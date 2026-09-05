import { useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Entry, UploadInput } from "../../shared/pixel";

export function usePixelUpload() {
  const beginUpload = useMutation(api.entries.beginUpload);
  const finalizeUpload = useAction(api.entries.finalizeUpload);

  return async (input: UploadInput) => {
    const { entryId, uploadUrl, sourceUploadUrl, animationUploadUrl } = await beginUpload({
      originalFilename: input.file.name,
      mimeType: input.file.type as Entry["mimeType"],
      width: input.width,
      height: input.height,
      fileSize: input.file.size,
      title: input.title,
      practiceDate: input.practiceDate,
      note: input.note,
      visibility: input.visibility,
      source: input.source
        ? { filename: input.source.name, fileSize: input.source.size }
        : undefined,
      animation: input.animation
        ? {
            fileSize: input.animation.file.size,
            columns: input.animation.columns,
            frameDurations: input.animation.frameDurations,
          }
        : undefined,
    });
    const uploads = [
      { url: uploadUrl, file: input.file, type: input.file.type },
      ...(input.source && sourceUploadUrl
        ? [{ url: sourceUploadUrl, file: input.source, type: "application/octet-stream" }]
        : []),
      ...(input.animation && animationUploadUrl
        ? [{ url: animationUploadUrl, file: input.animation.file, type: "image/png" }]
        : []),
    ];
    for (const upload of uploads) {
      let response: Response;
      try {
        response = await fetch(upload.url, {
          method: "PUT",
          headers: { "Content-Type": upload.type },
          body: upload.file,
        });
      } catch {
        throw new Error("Could not upload the work. Check your connection and try again.");
      }
      if (!response.ok) throw new Error("Could not save the work. Please try again.");
    }
    await finalizeUpload({ entryId });
    return entryId;
  };
}
