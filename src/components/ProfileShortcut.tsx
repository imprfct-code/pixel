import { useUser } from "@clerk/react";
import { useQuery } from "convex/react";
import { Link } from "react-router";
import { api } from "../../convex/_generated/api";

export function ProfileShortcut() {
  const { isSignedIn } = useUser();
  const user = useQuery(api.users.current, isSignedIn ? {} : "skip");

  if (isSignedIn === undefined) return null;

  if (!isSignedIn) {
    return (
      <Link className="button" to="/sign-in">
        Login
      </Link>
    );
  }

  if (!user?.avatarUrl) return null;

  return (
    <Link className="header-profile" to="/profile" aria-label="Open my profile">
      <img src={user.avatarUrl} alt="" />
    </Link>
  );
}
