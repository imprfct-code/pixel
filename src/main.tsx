import { ClerkProvider, Show, SignInButton, useAuth } from "@clerk/react";
import { Authenticated, AuthLoading, ConvexReactClient, Unauthenticated } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/geist-mono";
import { DemoPixel } from "./DemoPixel";
import { LivePixel } from "./LivePixel";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

const convexUrl = import.meta.env.VITE_CONVEX_URL;
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const configured = typeof convexUrl === "string" && typeof clerkKey === "string";

export function SignInGate() {
  return (
    <main className="sign-in-gate">
      <div className="pixel-glyph" aria-hidden="true" />
      <p className="eyebrow">visual practice log</p>
      <h1>See yourself becoming better.</h1>
      <p>Keep every pixel study in one quiet, chronological record.</p>
      <SignInButton mode="modal">
        <button className="button primary">start your log</button>
      </SignInButton>
    </main>
  );
}

createRoot(root).render(
  <StrictMode>
    {configured ? (
      <ClerkProvider publishableKey={clerkKey}>
        <ConvexProviderWithClerk client={new ConvexReactClient(convexUrl)} useAuth={useAuth}>
          <Show when="signed-in" fallback={<SignInGate />}>
            <AuthLoading>
              <p className="status-message full-page">signing in…</p>
            </AuthLoading>
            <Unauthenticated>
              <SignInGate />
            </Unauthenticated>
            <Authenticated>
              <LivePixel />
            </Authenticated>
          </Show>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    ) : (
      <DemoPixel />
    )}
  </StrictMode>,
);
