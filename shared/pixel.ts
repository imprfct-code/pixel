export const VISIBILITIES = ["private", "unlisted", "public"] as const;

export type Visibility = (typeof VISIBILITIES)[number];

export interface UserSummary {
  id: string;
  username: string;
  displayName: string | null;
  practiceStartedAt: string;
}

export interface Entry {
  id: string;
  title: string | null;
  note: string | null;
  originalFilename: string;
  mimeType: "image/png" | "image/gif";
  width: number;
  height: number;
  fileSize: number;
  visibility: Visibility;
  milestone: boolean;
  createdAt: string;
  imageUrl: string;
}

export interface UploadInput {
  file: File;
  title?: string;
  note?: string;
  visibility: Visibility;
  milestone: boolean;
  width: number;
  height: number;
}
