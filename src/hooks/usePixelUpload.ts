import { useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Entry, UploadInput } from "../../shared/pixel";

export function usePixelUpload() {
  const beginUpload = useMutation(api.entries.beginUpload);
  const finalizeUpload = useAction(api.entries.finalizeUpload);

  return async (input: UploadInput) => {
    const { entryId, uploadUrl } = await beginUpload({
      originalFilename: input.file.name,
      mimeType: input.file.type as Entry["mimeType"],
      width: input.width,
      height: input.height,
      fileSize: input.file.size,
      title: input.title,
      practiceDate: input.practiceDate,
      note: input.note,
      visibility: input.visibility,
    });
    let response: Response;
    try {
      response = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": input.file.type },
        body: input.file,
      });
    } catch {
      throw new Error("Could not upload the image. Check your connection and try again.");
    }
    if (!response.ok) throw new Error("Could not save the image. Please try again.");
    await finalizeUpload({ entryId });
    return entryId;
  };
}
