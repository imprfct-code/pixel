import { useUser, UserButton } from "@clerk/react";
import { useAction, useMutation, useQuery } from "convex/react";
import { useEffect } from "react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import type {
  Entry,
  EntryUpdateInput,
  ProfileInput,
  UploadInput,
  UserSummary,
} from "../shared/pixel";
import { PixelApp } from "./App";

export function LivePixel() {
  const { user: clerkUser } = useUser();
  const currentUser = useQuery(api.users.current);
  const ensureUser = useMutation(api.users.getOrCreate);
  const saveProfile = useMutation(api.users.updateProfile);
  const saveAvatar = useMutation(api.users.updateAvatar);
  const entries = useQuery(api.entries.listMine, currentUser ? {} : "skip");
  const beginUpload = useMutation(api.entries.beginUpload);
  const finalizeUpload = useAction(api.entries.finalizeUpload);
  const updateEntryMutation = useMutation(api.entries.updateMine);
  const removeEntryMutation = useMutation(api.entries.removeMine);

  useEffect(() => {
    if (!clerkUser || currentUser !== null) return;
    const emailName = clerkUser.primaryEmailAddress?.emailAddress.split("@")[0];
    void ensureUser({
      username: clerkUser.username ?? emailName ?? `artist-${clerkUser.id.slice(-6)}`,
      displayName: clerkUser.fullName ?? undefined,
      avatarUrl: clerkUser.imageUrl,
    });
  }, [clerkUser, currentUser, ensureUser]);

  useEffect(() => {
    if (!clerkUser || !currentUser || currentUser.avatarUrl === clerkUser.imageUrl) return;
    void saveAvatar({ avatarUrl: clerkUser.imageUrl });
  }, [clerkUser, currentUser, saveAvatar]);

  if (!currentUser) return <p className="status-message full-page">loading</p>;

  const user: UserSummary = {
    id: currentUser._id,
    username: currentUser.username,
    displayName: currentUser.displayName ?? null,
    bio: currentUser.bio ?? null,
    website: currentUser.website ?? null,
    practiceStartedAt: new Date(currentUser.practiceStartedAt).toISOString(),
    avatarUrl: currentUser.avatarUrl ?? clerkUser?.imageUrl ?? "/avatar.png",
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
    let response: Response;
    try {
      response = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": input.file.type },
        body: input.file,
      });
    } catch {
      throw new Error("R2 upload is blocked. Check the bucket CORS policy");
    }
    if (!response.ok) throw new Error("R2 rejected the upload");
    await finalizeUpload({ entryId });
    return entryId;
  }

  async function updateProfile(input: ProfileInput) {
    await saveProfile(input);
  }

  async function updateAvatar(file: File) {
    if (!clerkUser) throw new Error("User not loaded");
    await clerkUser.setProfileImage({ file });
    await clerkUser.reload();
    await saveAvatar({ avatarUrl: clerkUser.imageUrl });
  }

  async function updateEntry(entryId: string, input: EntryUpdateInput) {
    await updateEntryMutation({ entryId: entryId as Id<"entries">, ...input });
  }

  async function removeEntry(entryId: string) {
    await removeEntryMutation({ entryId: entryId as Id<"entries"> });
  }

  return (
    <PixelApp
      user={user}
      entries={(entries ?? []) as Entry[]}
      loading={entries === undefined}
      onUpload={upload}
      onSaveProfile={updateProfile}
      onAvatarUpload={updateAvatar}
      onUpdateEntry={updateEntry}
      onDeleteEntry={removeEntry}
      account={<UserButton appearance={{ elements: { avatarBox: "account-avatar" } }} />}
    />
  );
}
