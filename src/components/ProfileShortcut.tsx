import { useUser } from "@clerk/react";
import { useQuery } from "convex/react";
import { Link } from "react-router";
import { api } from "../../convex/_generated/api";

export function ProfileShortcut() {
  const { isSignedIn } = useUser();
  const user = useQuery(api.users.current, isSignedIn ? {} : "skip");

  return (
    <Link className="header-profile" to="/profile" aria-label="Open my profile">
      <img src={user?.avatarUrl ?? "/avatar.png"} alt="" />
    </Link>
  );
}
