export const VISIBILITIES = ["private", "unlisted", "public"] as const;

export type Visibility = (typeof VISIBILITIES)[number];

export interface UserSummary {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  website: string | null;
  practiceStartedAt: string;
  avatarUrl?: string;
}

export interface ProfileInput {
  username: string;
  displayName?: string;
  bio?: string;
  website?: string;
}

export interface Entry {
  id: string;
  title: string | null;
  note: string | null;
  originalFilename: string;
  mimeType: "image/png" | "image/gif" | "image/jpeg" | "image/webp" | "image/avif";
  width: number;
  height: number;
  fileSize: number;
  visibility: Visibility;
  createdAt: string;
  imageUrl: string;
}

export interface UploadInput {
  file: File;
  title?: string;
  note?: string;
  visibility: Visibility;
  width: number;
  height: number;
}

export interface EntryUpdateInput {
  title?: string;
  note?: string;
  visibility: Visibility;
}
