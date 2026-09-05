export type AsepritePreview = {
  preview: Blob;
  animation?: Blob;
  width: number;
  height: number;
  columns: number;
  frameDurations: number[];
};

export async function importAseprite(file: File, signal: AbortSignal) {
  const buffer = await file.arrayBuffer();
  signal.throwIfAborted();
  return new Promise<AsepritePreview>((resolve, reject) => {
    const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    const cleanup = () => {
      clearTimeout(timeout);
      worker.terminate();
      signal.removeEventListener("abort", abort);
    };
    const abort = () => {
      cleanup();
      reject(new DOMException("Import cancelled", "AbortError"));
    };
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("This file took too long to process. Try exporting it as PNG or GIF."));
    }, 30_000);
    signal.addEventListener("abort", abort, { once: true });
    worker.onmessage = (event: MessageEvent<AsepritePreview | { error: string }>) => {
      cleanup();
      if ("error" in event.data) reject(new Error(event.data.error));
      else resolve(event.data);
    };
    worker.onerror = () => {
      cleanup();
      reject(new Error("Could not process this file in your browser"));
    };
    worker.postMessage(buffer, [buffer]);
  });
}
