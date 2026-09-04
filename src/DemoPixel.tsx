import { useState } from "react";
import type { Entry, UploadInput, UserSummary } from "../shared/pixel";
import { PixelApp } from "./App";

const demoUser: UserSummary = {
  id: "local-artist",
  username: "pixel-artist",
  displayName: "Pixel Artist",
  practiceStartedAt: new Date(Date.now() - 45 * 86_400_000).toISOString(),
  avatarUrl: "/avatar.png",
};

export function DemoPixel() {
  const [entries, setEntries] = useState<Entry[]>([]);

  async function upload(input: UploadInput) {
    const id = crypto.randomUUID();
    const entry: Entry = {
      id,
      title: input.title ?? null,
      note: input.note ?? null,
      originalFilename: input.file.name,
      mimeType: input.file.type as Entry["mimeType"],
      width: input.width,
      height: input.height,
      fileSize: input.file.size,
      visibility: input.visibility,
      milestone: input.milestone,
      createdAt: new Date().toISOString(),
      imageUrl: URL.createObjectURL(input.file),
    };
    setEntries((current) => [entry, ...current]);
    return id;
  }

  return <PixelApp user={demoUser} entries={entries} onUpload={upload} mode="demo" />;
}
