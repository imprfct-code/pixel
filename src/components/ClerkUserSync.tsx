import { useUser } from "@clerk/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { api } from "../../convex/_generated/api";

export function ClerkUserSync({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const { isAuthenticated } = useConvexAuth();
  const currentUser = useQuery(api.users.current, isAuthenticated ? {} : "skip");
  const ensureUser = useMutation(api.users.getOrCreate);
  const saveAvatar = useMutation(api.users.updateAvatar);
  const [attempt, setAttempt] = useState(0);
  const [failedUser, setFailedUser] = useState<string>();
  const activeAvatar = useRef<string>(undefined);
  const pendingAvatar = useRef<string>(undefined);
  const clerkAvatarUrl = user?.imageUrl;
  const savedAvatarUrl = currentUser?.avatarUrl;

  const userId = user?.id;
  const username =
    user?.username ??
    user?.primaryEmailAddress?.emailAddress.split("@")[0] ??
    `artist-${userId?.slice(-6)}`;
  const displayName = user?.fullName ?? undefined;

  useEffect(() => {
    if (!userId || !isAuthenticated || currentUser !== null) return;
    let cancelled = false;
    void ensureUser({ username, displayName, avatarUrl: clerkAvatarUrl }).catch(() => {
      if (!cancelled) setFailedUser(userId);
    });
    return () => {
      cancelled = true;
    };
  }, [
    userId,
    username,
    displayName,
    clerkAvatarUrl,
    isAuthenticated,
    currentUser,
    ensureUser,
    attempt,
  ]);

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

  if (userId && failedUser === userId && currentUser === null) {
    return (
      <main className="setup-page" role="alert">
        <h1>Could not prepare your profile</h1>
        <p>Check your connection, then try again. Your account is safe.</p>
        <button
          className="button"
          type="button"
          onClick={() => {
            setFailedUser(undefined);
            setAttempt((value) => value + 1);
          }}
        >
          try again
        </button>
      </main>
    );
  }
  return children;
}
