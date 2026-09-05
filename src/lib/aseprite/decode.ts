import { Reader, inflate } from "./reader";

export const MAX_FRAMES = 256;
export const MAX_PIXELS = 16 * 1024 * 1024;
const MAX_DECODED_BYTES = 128 * 1024 * 1024;

export type Layer = { name: string; flags: number; type: number; level: number; opacity: number };
export type Cel = {
  layer: number;
  x: number;
  y: number;
  opacity: number;
  z: number;
  width: number;
  height: number;
  pixels: Uint8Array;
  link?: number;
};
export type Frame = { duration: number; cels: Cel[]; palette: number[][] };
export type Sprite = {
  width: number;
  height: number;
  depth: number;
  transparentIndex: number;
  groupOpacity: boolean;
  layers: Layer[];
  frames: Frame[];
};

function unsupported(feature: string): never {
  throw new Error(`${feature}: not supported yet. Export this work as PNG or GIF from Aseprite.`);
}

function readLayer(r: Reader, headerFlags: number): Layer {
  const flags = r.u16(),
    type = r.u16(),
    level = r.u16();
  r.take(4);
  const blend = r.u16(),
    opacity = r.u8();
  r.take(3);
  const name = r.string();
  if (type > 1) unsupported("Tilemap layers");
  if (blend !== 0) unsupported("Layer blend modes other than Normal");
  if (flags & 64) unsupported("Reference layers");
  return { name, flags, type, level, opacity: headerFlags & 1 ? opacity : 255 };
}

async function readCel(r: Reader, depth: number, budget: { bytes: number }): Promise<Cel> {
  const layer = r.u16(),
    x = r.i16(),
    y = r.i16(),
    opacity = r.u8(),
    type = r.u16(),
    z = r.i16();
  r.take(5);
  if (type === 1)
    return {
      layer,
      x,
      y,
      opacity,
      z,
      link: r.u16(),
      width: 0,
      height: 0,
      pixels: new Uint8Array(),
    };
  if (type !== 0 && type !== 2) unsupported("Tilemap cels");
  const width = r.u16(),
    height = r.u16();
  const size = width * height * (depth / 8);
  budget.bytes += size;
  if (size > MAX_PIXELS * 4 || budget.bytes > MAX_DECODED_BYTES)
    throw new Error("This file has too much layer data to preview");
  const data = r.take(r.bytes.length - r.offset);
  const pixels = type === 2 ? await inflate(data, size) : data;
  if (pixels.length !== size) throw new Error("Invalid cel size");
  return { layer, x, y, opacity, z, width, height, pixels };
}

function readPalette(r: Reader, palette: number[][]) {
  const size = r.u32(),
    first = r.u32(),
    last = r.u32();
  if (size > 256 || first > last || last >= 256) unsupported("Palettes larger than 256 colors");
  r.take(8);
  for (let i = first; i <= last; i++) {
    const flags = r.u16();
    palette[i] = [r.u8(), r.u8(), r.u8(), r.u8()];
    if (flags & 1) r.string();
  }
}

function readOldPalette(r: Reader, palette: number[][], sixBit: boolean) {
  const packets = r.u16();
  let index = 0;
  for (let packet = 0; packet < packets; packet++) {
    index += r.u8();
    const count = r.u8() || 256;
    if (index + count > 256) throw new Error("Invalid palette");
    for (let color = 0; color < count; color++) {
      const rgb = [r.u8(), r.u8(), r.u8()].map((value) =>
        sixBit ? Math.round((value * 255) / 63) : value,
      );
      palette[index++] = [...rgb, 255];
    }
  }
}

/** Reads the supported image subset; unsupported visual features fail before anything is uploaded. */
export async function decodeAseprite(buffer: ArrayBuffer): Promise<Sprite> {
  const r = new Reader(new Uint8Array(buffer));
  const fileSize = r.u32();
  if (r.u16() !== 0xa5e0 || fileSize !== buffer.byteLength)
    throw new Error("Not a valid Aseprite file");
  const count = r.u16(),
    width = r.u16(),
    height = r.u16(),
    depth = r.u16(),
    flags = r.u32();
  if (!width || !height || width > 4096 || height > 4096)
    throw new Error("Images must be at most 4096×4096");
  if (!count || count > MAX_FRAMES || width * height * count > MAX_PIXELS)
    throw new Error("Use at most 256 frames and 16 million pixels across all frames");
  if (![8, 16, 32].includes(depth)) unsupported("This color mode");
  r.take(10);
  const transparentIndex = r.u8();
  r.take(5);
  const pixelWidth = r.u8() || 1,
    pixelHeight = r.u8() || 1;
  if (pixelWidth !== pixelHeight) unsupported("Non-square pixels");
  r.take(128 - r.offset);
  const sprite: Sprite = {
    width,
    height,
    depth,
    transparentIndex,
    groupOpacity: Boolean(flags & 2),
    layers: [],
    frames: [],
  };
  let palette: number[][] = [];
  const budget = { bytes: 0 };
  for (let frameIndex = 0; frameIndex < count; frameIndex++) {
    const frameStart = r.offset;
    const frameSize = r.u32();
    if (frameSize < 16 || frameStart + frameSize > fileSize || r.u16() !== 0xf1fa)
      throw new Error("Invalid Aseprite frame");
    const oldCount = r.u16(),
      duration = r.u16();
    r.take(2);
    const chunks = r.u32() || oldCount;
    if (chunks > (frameSize - 16) / 6) throw new Error("Invalid frame chunks");
    const frame: Frame = { duration: Math.max(10, duration), cels: [], palette: [] };
    palette = palette.map((color) => [...color]);
    let modernPalette = false;
    for (let chunk = 0; chunk < chunks; chunk++) {
      const size = r.u32(),
        type = r.u16();
      if (size < 6 || r.offset + size - 6 > frameStart + frameSize)
        throw new Error("Invalid Aseprite chunk");
      const data = new Reader(r.take(size - 6));
      if (type === 0x2004) {
        if (frameIndex !== 0 || sprite.layers.length >= 128)
          throw new Error("Unsupported layer layout");
        sprite.layers.push(readLayer(data, flags));
      } else if (type === 0x2005) {
        frame.cels.push(await readCel(data, depth, budget));
      } else if (type === 0x2019 && depth === 8) {
        readPalette(data, palette);
        modernPalette = true;
      } else if ((type === 4 || type === 0x11) && depth === 8 && !modernPalette) {
        readOldPalette(data, palette, type === 0x11);
      } else if (type === 0x2006 && data.u32() & 1) {
        unsupported("Precisely scaled cels");
      } else if (type === 0x2007) {
        const profile = data.u16(),
          profileFlags = data.u16();
        if (profile > 1 || profileFlags & 1) unsupported("Custom color profiles");
      }
    }
    if (r.offset !== frameStart + frameSize) throw new Error("Invalid frame size");
    frame.palette = palette;
    for (const cel of frame.cels) {
      if (!sprite.layers[cel.layer] || sprite.layers[cel.layer].type !== 0)
        throw new Error("Invalid cel layer");
      if (cel.link !== undefined) {
        if (cel.link >= frameIndex) throw new Error("Invalid linked frame");
        const source = sprite.frames[cel.link].cels.find((other) => other.layer === cel.layer);
        if (!source) throw new Error("Missing linked cel");
        cel.width = source.width;
        cel.height = source.height;
        cel.pixels = source.pixels;
      }
    }
    sprite.frames.push(frame);
  }
  if (r.offset !== fileSize) throw new Error("Unexpected data after the last frame");
  return sprite;
}
