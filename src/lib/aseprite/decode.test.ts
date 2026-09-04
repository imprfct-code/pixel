/// <reference types="node" />
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vite-plus/test";
import { decodeAseprite } from "./decode";
import { renderFrame } from "./render";

const fixtures = new URL("../../../tests/fixtures/aseprite/", import.meta.url);
async function bytes(name: string) {
  const file = await readFile(new URL(name, fixtures));
  return new Uint8Array(file).buffer;
}

describe("Aseprite import", () => {
  for (const name of [
    "alpha-offset",
    "grayscale",
    "1empty3",
    "2f-index-3x3",
    "4f-index-4x4",
    "abcd",
    "bg-index-3",
    "groups2",
    "groups3abc",
    "link",
    "tags3",
    "z-order",
  ]) {
    it(`matches Aseprite's own render: ${name}`, async () => {
      const sprite = await decodeAseprite(await bytes(`${name}.aseprite`));
      const expected = new Uint8Array(await bytes(`${name}.aseprite.rgba`));
      const actual = new Uint8Array(expected.length);
      sprite.frames.forEach((_, index) =>
        actual.set(renderFrame(sprite, index), index * sprite.width * sprite.height * 4),
      );
      // RGB channels beneath zero alpha differ between Aseprite color modes but are invisible.
      for (const pixels of [actual, expected]) {
        for (let offset = 0; offset < pixels.length; offset += 4) {
          if (pixels[offset + 3] === 0) pixels.fill(0, offset, offset + 3);
        }
      }
      expect(actual).toEqual(expected);
    });
  }
  it("rejects unsupported tilemaps instead of uploading an incorrect preview", async () => {
    await expect(decodeAseprite(await bytes("2x2tilemap2x2tile.aseprite"))).rejects.toThrow(
      "Tilemap",
    );
  });
  it("rejects damaged files and excessive frame counts", async () => {
    await expect(decodeAseprite(new ArrayBuffer(10))).rejects.toThrow();
    const data = await bytes("1empty3.aseprite");
    new DataView(data).setUint16(6, 65535, true);
    await expect(decodeAseprite(data)).rejects.toThrow("256 frames");
  });
});
