import type { Cel, Sprite } from "./decode";

function multiply(a: number, b: number) {
  const product = a * b + 128;
  return (product + (product >> 8)) >> 8;
}

function over(
  target: Uint8Array,
  offset: number,
  red: number,
  green: number,
  blue: number,
  alpha: number,
) {
  if (!alpha) return;
  if (!target[offset + 3] || alpha === 255) {
    target.set([red, green, blue, alpha], offset);
    return;
  }
  const combined = alpha + target[offset + 3] - multiply(alpha, target[offset + 3]);
  target[offset] += Math.trunc(((red - target[offset]) * alpha) / combined);
  target[offset + 1] += Math.trunc(((green - target[offset + 1]) * alpha) / combined);
  target[offset + 2] += Math.trunc(((blue - target[offset + 2]) * alpha) / combined);
  target[offset + 3] = combined;
}

export function renderFrame(sprite: Sprite, frameIndex: number) {
  const frame = sprite.frames[frameIndex];
  if (!frame) throw new Error("Frame not found");
  const size = sprite.width * sprite.height * 4;
  const children = new Map<number, number[]>();
  const parents: number[] = [];
  for (let index = 0; index < sprite.layers.length; index++) {
    const layer = sprite.layers[index];
    if (layer.level > parents.length) throw new Error("Invalid layer nesting");
    parents.length = layer.level;
    const parent = parents.at(-1) ?? -1;
    const siblings = children.get(parent) ?? [];
    siblings.push(index);
    children.set(parent, siblings);
    if (layer.type === 1) parents.push(index);
  }
  const cels = new Map(frame.cels.map((cel) => [cel.layer, cel]));
  function drawCel(target: Uint8Array, cel: Cel, opacity: number) {
    const background = Boolean(sprite.layers[cel.layer].flags & 8);
    for (let y = Math.max(0, -cel.y); y < Math.min(cel.height, sprite.height - cel.y); y++) {
      for (let x = Math.max(0, -cel.x); x < Math.min(cel.width, sprite.width - cel.x); x++) {
        const source = ((y * cel.width + x) * sprite.depth) / 8;
        const offset = ((y + cel.y) * sprite.width + x + cel.x) * 4;
        let red: number, green: number, blue: number, alpha: number;
        if (sprite.depth === 32) {
          [red, green, blue, alpha] = cel.pixels.subarray(source, source + 4);
        } else if (sprite.depth === 16) {
          red = green = blue = cel.pixels[source];
          alpha = cel.pixels[source + 1];
        } else {
          const index = cel.pixels[source];
          if (index === sprite.transparentIndex && !background) continue;
          const color = frame.palette[index];
          if (!color)
            throw new Error(
              "This indexed file is missing palette colors. Export it as PNG or GIF.",
            );
          [red, green, blue, alpha] = color;
        }
        over(target, offset, red, green, blue, multiply(alpha, opacity));
      }
    }
  }
  let groupBytes = 0;
  function drawGroup(parent: number, target: Uint8Array) {
    const indices = [...(children.get(parent) ?? [])].sort((a, b) => {
      const az = cels.get(a)?.z ?? 0,
        bz = cels.get(b)?.z ?? 0;
      return a + az - b - bz || az - bz;
    });
    for (const index of indices) {
      const layer = sprite.layers[index];
      if (!(layer.flags & 1)) continue;
      if (layer.type === 1) {
        if (!sprite.groupOpacity || layer.opacity === 255) drawGroup(index, target);
        else {
          groupBytes += size;
          if (groupBytes > 128 * 1024 * 1024)
            throw new Error("This file has too much nested layer data to preview");
          const group = new Uint8Array(size);
          drawGroup(index, group);
          groupBytes -= size;
          for (let offset = 0; offset < size; offset += 4)
            over(
              target,
              offset,
              group[offset],
              group[offset + 1],
              group[offset + 2],
              multiply(group[offset + 3], layer.opacity),
            );
        }
      } else {
        const cel = cels.get(index);
        if (cel) drawCel(target, cel, multiply(cel.opacity, layer.opacity));
      }
    }
  }
  const result = new Uint8Array(size);
  drawGroup(-1, result);
  return result;
}
