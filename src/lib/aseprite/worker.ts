import { decodeAseprite } from "./decode";
import { renderFrame } from "./render";

self.onmessage = async (event: MessageEvent<ArrayBuffer>) => {
  try {
    const sprite = await decodeAseprite(event.data);
    const columns = Math.min(
      Math.ceil(Math.sqrt(sprite.frames.length)),
      Math.floor(8192 / sprite.width),
    );
    const rows = Math.ceil(sprite.frames.length / columns);
    if (rows * sprite.height > 8192) throw new Error("This animation is too large to preview");
    const sheet = new OffscreenCanvas(sprite.width * columns, sprite.height * rows);
    const context = sheet.getContext("2d");
    const cover = new OffscreenCanvas(sprite.width, sprite.height);
    const coverContext = cover.getContext("2d");
    if (!context || !coverContext)
      throw new Error("Image processing is unavailable in this browser");
    for (let index = 0; index < sprite.frames.length; index++) {
      const frame = new ImageData(
        new Uint8ClampedArray(renderFrame(sprite, index)),
        sprite.width,
        sprite.height,
      );
      context.putImageData(
        frame,
        (index % columns) * sprite.width,
        Math.floor(index / columns) * sprite.height,
      );
      if (index === 0) coverContext.putImageData(frame, 0, 0);
    }
    const preview = await cover.convertToBlob({ type: "image/png" });
    const animation =
      sprite.frames.length > 1 ? await sheet.convertToBlob({ type: "image/png" }) : undefined;
    self.postMessage({
      preview,
      animation,
      width: sprite.width,
      height: sprite.height,
      columns,
      frameDurations: sprite.frames.map((frame) => frame.duration),
    });
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : "Could not read this Aseprite file",
    });
  }
};
