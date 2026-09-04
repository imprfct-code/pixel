import { ClerkLoaded, ClerkLoading, ClerkProvider, Show, useAuth } from "@clerk/react";
import { Authenticated, AuthLoading, ConvexReactClient, Unauthenticated } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { Navigate, Route, Routes } from "react-router";
import { AuthScreen } from "./AuthScreen";
import { LivePixel } from "./LivePixel";

export function SetupScreen() {
  return (
    <main className="setup-page">
      <img src="/pixel.svg" alt="" />
      <h1>Pixel</h1>
      <p>Clerk configuration required</p>
      <code>VITE_CLERK_PUBLISHABLE_KEY</code>
    </main>
  );
}

function ConfiguredPixel() {
  return (
    <Routes>
      <Route
        path="/sign-in/*"
        element={
          <>
            <ClerkLoading>
              <p className="status-message full-page">loading</p>
            </ClerkLoading>
            <ClerkLoaded>
              <Show when="signed-out" fallback={<Navigate to="/" replace />}>
                <AuthScreen mode="sign-in" />
              </Show>
            </ClerkLoaded>
          </>
        }
      />
      <Route
        path="/sign-up/*"
        element={
          <ClerkLoaded>
            <Show when="signed-out" fallback={<Navigate to="/" replace />}>
              <AuthScreen mode="sign-up" />
            </Show>
          </ClerkLoaded>
        }
      />
      <Route
        path="*"
        element={
          <>
            <ClerkLoading>
              <p className="status-message full-page">loading</p>
            </ClerkLoading>
            <ClerkLoaded>
              <Show when="signed-in" fallback={<Navigate to="/sign-in" replace />}>
                <AuthLoading>
                  <p className="status-message full-page">signing in</p>
                </AuthLoading>
                <Unauthenticated>
                  <Navigate to="/sign-in" replace />
                </Unauthenticated>
                <Authenticated>
                  <LivePixel />
                </Authenticated>
              </Show>
            </ClerkLoaded>
          </>
        }
      />
    </Routes>
  );
}

export function Root({ convexUrl, clerkKey }: { convexUrl?: string; clerkKey?: string }) {
  if (!convexUrl || !clerkKey) return <SetupScreen />;

  return (
    <ClerkProvider publishableKey={clerkKey} signInUrl="/sign-in" signUpUrl="/sign-up">
      <ConvexProviderWithClerk client={new ConvexReactClient(convexUrl)} useAuth={useAuth}>
        <ConfiguredPixel />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
