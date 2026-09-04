import { AuthenticateWithRedirectCallback } from "@clerk/react";

export function SSOCallbackScreen() {
  return (
    <main className="auth-callback">
      <img src="/pixel.svg" alt="" />
      <span>signing in</span>
      <AuthenticateWithRedirectCallback />
    </main>
  );
}
