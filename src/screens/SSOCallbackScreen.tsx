import { AuthenticateWithRedirectCallback } from "@clerk/react";
import { AuthLoadingSkeleton } from "../components/LoadingSkeleton";

export function SSOCallbackScreen() {
  return (
    <>
      <AuthLoadingSkeleton />
      <AuthenticateWithRedirectCallback />
    </>
  );
}
