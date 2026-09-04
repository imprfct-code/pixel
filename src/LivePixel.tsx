import { useUser, UserButton } from "@clerk/react";
import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";
import { api } from "../convex/_generated/api";
import type { Entry, ProfileInput, UserSummary } from "../shared/pixel";
import { PixelApp } from "./App";
import { ProfileLoadingSkeleton } from "./components/LoadingSkeleton";
import { usePixelUpload } from "./hooks/usePixelUpload";

export function LivePixel() {
  const { user: clerkUser } = useUser();
  const currentUser = useQuery(api.users.current);
  const ensureUser = useMutation(api.users.getOrCreate);
  const saveProfile = useMutation(api.users.updateProfile);
  const entries = useQuery(api.entries.listMine, currentUser ? {} : "skip");
  const upload = usePixelUpload();

  useEffect(() => {
    if (!clerkUser || currentUser !== null) return;
    const emailName = clerkUser.primaryEmailAddress?.emailAddress.split("@")[0];
    void ensureUser({
      username: clerkUser.username ?? emailName ?? `artist-${clerkUser.id.slice(-6)}`,
      displayName: clerkUser.fullName ?? undefined,
      avatarUrl: clerkUser.imageUrl,
    });
  }, [clerkUser, currentUser, ensureUser]);

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
