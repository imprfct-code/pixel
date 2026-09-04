import { useUser, UserButton } from "@clerk/react";
import { useAction, useMutation, useQuery } from "convex/react";
import { useEffect } from "react";
import { api } from "../convex/_generated/api";
import type { Entry, UploadInput, UserSummary } from "../shared/pixel";
import { PixelApp } from "./App";

export function LivePixel() {
  const { user: clerkUser } = useUser();
  const currentUser = useQuery(api.users.current);
  const ensureUser = useMutation(api.users.getOrCreate);
  const entries = useQuery(api.entries.listMine, currentUser ? {} : "skip");
  const beginUpload = useMutation(api.entries.beginUpload);
  const finalizeUpload = useAction(api.entries.finalizeUpload);

  useEffect(() => {
    if (!clerkUser || currentUser !== null) return;
    const emailName = clerkUser.primaryEmailAddress?.emailAddress.split("@")[0];
    void ensureUser({
      username: clerkUser.username ?? emailName ?? `artist-${clerkUser.id.slice(-6)}`,
      displayName: clerkUser.fullName ?? undefined,
    });
  }, [clerkUser, currentUser, ensureUser]);

  if (!currentUser) return <p className="status-message full-page">loading</p>;

  const user: UserSummary = {
    id: currentUser._id,
    username: currentUser.username,
    displayName: currentUser.displayName ?? null,
    practiceStartedAt: new Date(currentUser.practiceStartedAt).toISOString(),
    avatarUrl: "/avatar.png",
  };

  async function upload(input: UploadInput) {
    const { entryId, uploadUrl } = await beginUpload({
      originalFilename: input.file.name,
      mimeType: input.file.type as Entry["mimeType"],
      width: input.width,
      height: input.height,
      fileSize: input.file.size,
      title: input.title,
      note: input.note,
      visibility: input.visibility,
      milestone: input.milestone,
    });
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": input.file.type },
      body: input.file,
    });
    if (!response.ok) throw new Error("R2 rejected the upload");
    await finalizeUpload({ entryId });
    return entryId;
  }

  return (
    <PixelApp
      user={user}
      entries={(entries ?? []) as Entry[]}
      loading={entries === undefined}
      onUpload={upload}
      account={<UserButton appearance={{ elements: { avatarBox: "account-avatar" } }} />}
    />
  );
}
