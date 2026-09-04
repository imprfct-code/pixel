import { ClerkLoaded, ClerkLoading, ClerkProvider, Show, useAuth } from "@clerk/react";
import { Authenticated, AuthLoading, ConvexReactClient, Unauthenticated } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { Navigate, Route, Routes } from "react-router";
import { AuthScreen } from "./AuthScreen";
import { LivePixel } from "./LivePixel";
import { FeedScreen } from "./screens/FeedScreen";
import { PublicProfileScreen } from "./screens/PublicProfileScreen";
import { SSOCallbackScreen } from "./screens/SSOCallbackScreen";

const PROTECTED_PATHS = ["/profile", "/upload", "/settings", "/entries/:entryId"];

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
      <Route path="/sso-callback" element={<SSOCallbackScreen />} />
      <Route path="/" element={<FeedScreen />} />
      <Route
        path="/sign-in/*"
        element={
          <>
            <ClerkLoading>
              <p className="status-message full-page">loading</p>
            </ClerkLoading>
            <ClerkLoaded>
              <Show when="signed-out" fallback={<Navigate to="/profile" replace />}>
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
            <Show when="signed-out" fallback={<Navigate to="/profile" replace />}>
              <AuthScreen mode="sign-up" />
            </Show>
          </ClerkLoaded>
        }
      />
      {PROTECTED_PATHS.map((path) => (
        <Route key={path} path={path} element={<ProtectedPixel />} />
      ))}
      <Route path="/:handle" element={<PublicProfileScreen />} />
      <Route path="*" element={<Navigate to="/profile" replace />} />
    </Routes>
  );
}

function ProtectedPixel() {
  return (
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
