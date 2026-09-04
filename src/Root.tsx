import { ClerkLoaded, ClerkLoading, ClerkProvider, Show, useAuth } from "@clerk/react";
import { Authenticated, AuthLoading, ConvexReactClient, Unauthenticated } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { Navigate, Route, Routes } from "react-router";
import { AuthScreen } from "./AuthScreen";
import { ClerkAvatarSync } from "./components/ClerkAvatarSync";
import { ClerkEmailPrivacy } from "./components/ClerkEmailPrivacy";
import { AuthLoadingSkeleton, ProfileLoadingSkeleton } from "./components/LoadingSkeleton";
import { LivePixel } from "./LivePixel";
import { FeedScreen } from "./screens/FeedScreen";
import { PublicProfileScreen } from "./screens/PublicProfileScreen";
import { SSOCallbackScreen } from "./screens/SSOCallbackScreen";
import { ViewerScreen } from "./screens/ViewerScreen";

const PROTECTED_PATHS = ["/profile", "/upload"];
const CLERK_APPEARANCE = {
  variables: {
    colorPrimary: "#c7787a",
    colorPrimaryForeground: "#0a0a0a",
    colorDanger: "#df8b8e",
    colorNeutral: "#e8e8e8",
    colorForeground: "#e8e8e8",
    colorMuted: "#171717",
    colorMutedForeground: "#a0a0a0",
    colorBackground: "#0d0d0d",
    colorInput: "#111111",
    colorInputForeground: "#e8e8e8",
    colorBorder: "#3a3a3a",
    colorRing: "#c7787a",
    colorShadow: "#000000",
    colorModalBackdrop: "rgba(0, 0, 0, 0.56)",
    fontFamily: '"Geist Pixel"',
    fontFamilyButtons: '"Geist Pixel"',
    spacing: "0.75rem",
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
    avatarBox: {
      borderRadius: "0px",
    },
    avatarImage: {
      borderRadius: "0px",
    },
    popoverBox: {
      borderRadius: "0px",
    },
    userButtonPopoverCard: {
      width: "292px",
      maxWidth: "calc(100vw - 24px)",
      border: "1px solid #343434",
      borderRadius: "0px",
      backgroundColor: "#0d0d0d",
      boxShadow: "0 22px 64px rgba(0, 0, 0, 0.68)",
    },
    userButtonPopoverMain: {
      padding: "8px",
    },
    userPreview: {
      gap: "8px",
      padding: "0",
    },
    userPreviewSecondaryIdentifier: {
      color: "#a0a0a0",
    },
    userButtonPopoverActions: {
      padding: "0",
    },
    userButtonPopoverActionButton: {
      width: "100%",
      minHeight: "38px",
      justifyContent: "flex-start",
      gap: "8px",
      padding: "8px",
      borderTop: "1px solid #242424",
      borderRadius: "0px",
      color: "#d2d2d2",
      textAlign: "left",
    },
    userButtonPopoverActionButtonIcon: {
      flex: "none",
      margin: "0",
      color: "#b8b8b8",
    },
    userButtonPopoverFooter: {
      padding: "8px 10px",
      borderTop: "1px solid #242424",
      backgroundColor: "#0d0d0d",
    },
    modalContent: {
      position: "relative",
      width: "min(860px, calc(100vw - 32px))",
      height: "min(620px, calc(100vh - 32px))",
      maxWidth: "860px",
      maxHeight: "620px",
      margin: "auto",
      boxSizing: "border-box",
      overflow: "hidden",
      border: "1px solid #343434",
      borderRadius: "0px",
      backgroundColor: "#0d0d0d",
      boxShadow: "inset 0 0 0 1px #343434, 0 32px 120px rgba(0, 0, 0, 0.72)",
    },
    modalCloseButton: {
      position: "absolute",
      top: "12px",
      right: "12px",
      margin: "0",
      zIndex: "2",
    },
    navbar: {
      width: "210px",
      flexBasis: "210px",
      padding: "18px 12px",
      borderRight: "1px solid #242424",
      backgroundColor: "#0a0a0a",
    },
    navbarButtons: {
      gap: "4px",
    },
    navbarButton: {
      minHeight: "36px",
      padding: "8px 10px",
      borderRadius: "0px",
      color: "#bdbdbd",
    },
    pageScrollBox: {
      padding: "18px 22px",
    },
    profilePage: {
      gap: "14px",
    },
    profilePageContent: {
      padding: "0",
    },
    profileSection: {
      padding: "14px 0",
      borderColor: "#242424",
    },
    profileSectionHeader: {
      marginBottom: "8px",
    },
    profileSectionItem: {
      padding: "6px 0",
    },
    activeDeviceListItem: {
      gap: "10px",
      padding: "6px 0",
    },
    badge: {
      border: "1px solid #3a3a3a",
      backgroundColor: "#242424",
      color: "#d0d0d0",
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
      <Route path="/entries/:entryId" element={<ViewerScreen />} />
      <Route
        path="/sign-in/*"
        element={
          <>
            <ClerkLoading>
              <AuthLoadingSkeleton />
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
        <ProfileLoadingSkeleton withShell />
      </ClerkLoading>
      <ClerkLoaded>
        <Show when="signed-in" fallback={<Navigate to="/sign-in" replace />}>
          <AuthLoading>
            <ProfileLoadingSkeleton withShell />
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
        <ClerkAvatarSync />
        <ClerkEmailPrivacy />
        <ConfiguredPixel />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
