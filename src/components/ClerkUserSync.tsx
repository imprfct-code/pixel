import { useUser } from "@clerk/react";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import { api } from "../../convex/_generated/api";

export function ClerkUserSync() {
  const { isSignedIn, user } = useUser();
  const currentUser = useQuery(api.users.current, isSignedIn ? {} : "skip");
  const ensureUser = useMutation(api.users.getOrCreate);
  const saveAvatar = useMutation(api.users.updateAvatar);
  const provisioning = useRef(false);
  const activeAvatar = useRef<string>(undefined);
  const pendingAvatar = useRef<string>(undefined);
  const clerkAvatarUrl = user?.imageUrl;
  const savedAvatarUrl = currentUser?.avatarUrl;

  useEffect(() => {
    if (!user || currentUser !== null || provisioning.current) return;

    provisioning.current = true;
    const emailName = user.primaryEmailAddress?.emailAddress.split("@")[0];
    void ensureUser({
      username: user.username ?? emailName ?? `artist-${user.id.slice(-6)}`,
      displayName: user.fullName ?? undefined,
      avatarUrl: user.imageUrl,
    }).then(
      () => {
        provisioning.current = false;
      },
      () => {
        provisioning.current = false;
      },
    );
  }, [currentUser, ensureUser, user]);

  useEffect(() => {
    if (!clerkAvatarUrl || !currentUser || savedAvatarUrl === clerkAvatarUrl) return;

    const stableTimer = setTimeout(() => {
      if (activeAvatar.current === clerkAvatarUrl || pendingAvatar.current === clerkAvatarUrl)
        return;

      pendingAvatar.current = clerkAvatarUrl;
      if (activeAvatar.current) return;

      const flush = async () => {
        while (pendingAvatar.current) {
          const avatarUrl = pendingAvatar.current;
          pendingAvatar.current = undefined;
          activeAvatar.current = avatarUrl;
          try {
            await saveAvatar({ avatarUrl });
          } catch {
            // Clerk remains the live source; a later identity update will retry the mirror.
          }
          activeAvatar.current = undefined;
        }
      };

      void flush();
    }, 1_200);

    return () => clearTimeout(stableTimer);
  }, [clerkAvatarUrl, currentUser, saveAvatar, savedAvatarUrl]);

  return null;
}
