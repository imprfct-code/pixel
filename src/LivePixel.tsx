import { useUser, UserButton } from "@clerk/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Entry, ProfileInput, UserSummary } from "../shared/pixel";
import { PixelApp } from "./App";
import { ProfileLoadingSkeleton } from "./components/LoadingSkeleton";
import { usePixelUpload } from "./hooks/usePixelUpload";

export function LivePixel() {
  const { user: clerkUser } = useUser();
  const currentUser = useQuery(api.users.current);
  const saveProfile = useMutation(api.users.updateProfile);
  const entries = useQuery(api.entries.listMine, currentUser ? {} : "skip");
  const upload = usePixelUpload();

  if (!currentUser) return <ProfileLoadingSkeleton withShell />;

  const user: UserSummary = {
    id: currentUser._id,
    username: currentUser.username,
    displayName: currentUser.displayName ?? null,
    bio: currentUser.bio ?? null,
    website: currentUser.website ?? null,
    practiceStartedAt: new Date(currentUser.practiceStartedAt).toISOString(),
    avatarUrl: currentUser.avatarUrl ?? "/avatar.png",
  };

  async function updateProfile(input: ProfileInput) {
    await saveProfile(input);
  }

  async function updateAvatar(file: File) {
    if (!clerkUser) throw new Error("User not loaded");
    await clerkUser.setProfileImage({ file });
    await clerkUser.reload();
  }

  return (
    <PixelApp
      user={user}
      entries={(entries ?? []) as Entry[]}
      loading={entries === undefined}
      onUpload={upload}
      onSaveProfile={updateProfile}
      onAvatarUpload={updateAvatar}
      account={<UserButton appearance={{ elements: { avatarBox: "account-avatar" } }} />}
    />
  );
}
