const ACCEPTED_TYPES = new Set([
  "image/png",
  "image/gif",
  "image/jpeg",
  "image/webp",
  "image/avif",
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const ARTWORK_ACCEPT = ".ase,.aseprite,image/png,image/gif,image/jpeg,image/webp,image/avif";

export function isAseprite(file: File) {
  return /\.(ase|aseprite)$/i.test(file.name);
}

export function validateImageFile(file: File) {
  if (!ACCEPTED_TYPES.has(file.type) && !isAseprite(file))
    throw new Error("Use Aseprite, PNG, GIF, JPG, WebP, or AVIF");
  if (!file.size) throw new Error("This file is empty");
  if (file.size > MAX_FILE_SIZE) throw new Error("Maximum file size 10 MB");
}

export function readImageSize(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      reject(new Error("Unable to read image"));
      URL.revokeObjectURL(url);
    };
    image.src = url;
  });
}

export async function downloadImage(url: string, filename: string) {
  // An <img> cache entry may lack CORS headers; downloads need a fresh CORS response.
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Download failed");
  const objectUrl = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

export function downloadArtwork(entry: Entry) {
  return downloadImage(
    entry.animation?.url ?? entry.imageUrl,
    entry.animation
      ? `${entry.originalFilename.replace(/\.[^.]+$/, "")}-spritesheet.png`
      : entry.originalFilename,
  );
}
import type { Entry } from "../../shared/pixel";
