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
const CLERK_APPEARANCE = {
  variables: {
    colorPrimary: "#c7787a",
    colorPrimaryForeground: "#0a0a0a",
    colorDanger: "#df8b8e",
    colorNeutral: "#e8e8e8",
    colorForeground: "#e8e8e8",
    colorMuted: "#171717",
    colorMutedForeground: "#747474",
    colorBackground: "#0d0d0d",
    colorInput: "#111111",
    colorInputForeground: "#e8e8e8",
    colorBorder: "#2f2f2f",
    colorRing: "#c7787a",
    colorShadow: "#000000",
    colorModalBackdrop: "#050505",
    fontFamily: '"Geist Mono Variable", ui-monospace, monospace',
    fontFamilyButtons: '"Geist Mono Variable", ui-monospace, monospace',
    borderRadius: "0px",
  },
  elements: {
    cardBox: {
      borderRadius: "0px",
      boxShadow: "0 28px 90px rgba(0, 0, 0, 0.62)",
    },
    card: {
      border: "1px solid #343434",
      borderRadius: "0px",
      backgroundColor: "#0d0d0d",
      boxShadow: "none",
    },
    popoverBox: {
      borderRadius: "0px",
    },
    userButtonPopoverCard: {
      border: "1px solid #343434",
      borderRadius: "0px",
      backgroundColor: "#0d0d0d",
      boxShadow: "0 22px 64px rgba(0, 0, 0, 0.68)",
    },
    userButtonPopoverActionButton: {
      borderTop: "1px solid #242424",
      borderRadius: "0px",
    },
    userButtonPopoverFooter: {
      borderTop: "1px solid #242424",
      backgroundColor: "#0d0d0d",
    },
    modalContent: {
      border: "1px solid #343434",
      borderRadius: "0px",
      backgroundColor: "#0d0d0d",
      boxShadow: "0 32px 120px rgba(0, 0, 0, 0.72)",
    },
    navbar: {
      borderRight: "1px solid #242424",
      backgroundColor: "#0a0a0a",
    },
    navbarButton: {
      borderRadius: "0px",
    },
    profileSection: {
      borderColor: "#242424",
    },
    profileSectionPrimaryButton: {
      borderRadius: "0px",
    },
  },
};

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
    <ClerkProvider
      publishableKey={clerkKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      appearance={CLERK_APPEARANCE}
    >
      <ConvexProviderWithClerk client={new ConvexReactClient(convexUrl)} useAuth={useAuth}>
        <ConfiguredPixel />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
