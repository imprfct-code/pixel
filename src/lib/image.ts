const ACCEPTED_TYPES = new Set(["image/png", "image/gif"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function validateImageFile(file: File) {
  if (!ACCEPTED_TYPES.has(file.type)) throw new Error("PNG or GIF only");
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
  const response = await fetch(url);
  if (!response.ok) throw new Error("Download failed");
  const objectUrl = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}
