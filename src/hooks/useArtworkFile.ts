import { useEffect, useState } from "react";
import { isAseprite, readImageSize, validateImageFile } from "../lib/image";
import type { UploadInput } from "../../shared/pixel";

type Prepared = Pick<UploadInput, "file" | "width" | "height" | "source" | "animation"> & {
  previewUrl: string;
  animationUrl?: string;
};
type Result = { file: File; prepared: Prepared } | { file: File; error: string };

export function useArtworkFile(file?: File) {
  const [result, setResult] = useState<Result>();
  useEffect(() => {
    if (!file) return;
    const selectedFile = file;
    const controller = new AbortController();
    const urls: string[] = [];
    function url(blob: Blob) {
      const value = URL.createObjectURL(blob);
      urls.push(value);
      return value;
    }
    async function prepare(): Promise<Prepared> {
      validateImageFile(selectedFile);
      if (!isAseprite(selectedFile))
        return {
          file: selectedFile,
          ...(await readImageSize(selectedFile)),
          previewUrl: url(selectedFile),
        };
      const { importAseprite } = await import("../lib/aseprite/import");
      const parsed = await importAseprite(selectedFile, controller.signal);
      const preview = new File(
        [parsed.preview],
        selectedFile.name.replace(/\.(ase|aseprite)$/i, ".png"),
        {
          type: "image/png",
        },
      );
      if (
        parsed.preview.size > 10 * 1024 * 1024 ||
        (parsed.animation?.size ?? 0) > 10 * 1024 * 1024
      )
        throw new Error("Generated preview exceeds 10 MB. Try a smaller sprite or export PNG/GIF.");
      const animation = parsed.animation
        ? { file: parsed.animation, columns: parsed.columns, frameDurations: parsed.frameDurations }
        : undefined;
      return {
        file: preview,
        width: parsed.width,
        height: parsed.height,
        source: selectedFile,
        animation,
        previewUrl: url(preview),
        animationUrl: animation ? url(animation.file) : undefined,
      };
    }
    void prepare()
      .then((prepared) => {
        if (!controller.signal.aborted) setResult({ file, prepared });
        else urls.forEach((value) => URL.revokeObjectURL(value));
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setResult({
            file,
            error: error instanceof Error ? error.message : "Could not read this file",
          });
      });
    return () => {
      controller.abort();
      urls.forEach((value) => URL.revokeObjectURL(value));
    };
  }, [file]);
  const current = result?.file === file ? result : undefined;
  return {
    prepared: current && "prepared" in current ? current.prepared : undefined,
    error: current && "error" in current ? current.error : undefined,
    loading: Boolean(file && !current),
  };
}
