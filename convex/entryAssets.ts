import { v, type Infer } from "convex/values";
import type { Doc } from "./_generated/dataModel";

export const sourceUpload = v.object({ filename: v.string(), fileSize: v.number() });
export const animationUpload = v.object({
  fileSize: v.number(),
  columns: v.number(),
  frameDurations: v.array(v.number()),
});

export function validateExtraAssets(input: {
  source?: Infer<typeof sourceUpload>;
  animation?: Infer<typeof animationUpload>;
  mimeType: string;
  width: number;
  height: number;
}) {
  const { source, animation, width, height } = input;
  for (const asset of [source, animation]) {
    if (
      asset &&
      (!Number.isInteger(asset.fileSize) || asset.fileSize < 1 || asset.fileSize > 10 * 1024 * 1024)
    ) {
      throw new Error("Each file must be 10 MB or smaller");
    }
  }
  if ((source || animation) && input.mimeType !== "image/png")
    throw new Error("Aseprite previews must be PNG");
  if (source && !/\.(ase|aseprite)$/i.test(source.filename))
    throw new Error("Invalid Aseprite filename");
  if (!animation) return;
  const { columns, frameDurations } = animation;
  if (
    !source ||
    frameDurations.length < 2 ||
    frameDurations.length > 256 ||
    frameDurations.some(
      (duration) => !Number.isInteger(duration) || duration < 10 || duration > 65535,
    ) ||
    !Number.isInteger(columns) ||
    columns < 1 ||
    columns > frameDurations.length ||
    columns * width > 8192 ||
    Math.ceil(frameDurations.length / columns) * height > 8192 ||
    frameDurations.length * width * height > 16 * 1024 * 1024
  ) {
    throw new Error("Invalid or oversized animation");
  }
}

export function entryAssets(entry: Doc<"entries">) {
  return [
    { objectKey: entry.objectKey, fileSize: entry.fileSize, mimeType: entry.mimeType },
    ...(entry.source ? [{ ...entry.source, mimeType: "application/octet-stream" }] : []),
    ...(entry.animation ? [{ ...entry.animation, mimeType: "image/png" }] : []),
  ];
}
