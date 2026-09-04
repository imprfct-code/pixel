import { SignIn, SignUp } from "@clerk/react";
import { Link } from "react-router";

const appearance = {
  variables: {
    colorPrimary: "#e8e8e8",
    colorBackground: "#101010",
    colorText: "#e8e8e8",
    colorTextSecondary: "#747474",
    colorInputBackground: "#0a0a0a",
    colorInputText: "#e8e8e8",
    borderRadius: "0px",
    fontFamily: '"Geist Mono Variable", ui-monospace, monospace',
  },
};

export function AuthScreen({ mode }: { mode: "sign-in" | "sign-up" }) {
  return (
    <main className="auth-page">
      <Link className="auth-wordmark" to="/">
        <img src="/pixel.svg" alt="" /> Pixel
      </Link>
      <div className="auth-panel">
        {mode === "sign-in" ? (
          <SignIn
            appearance={appearance}
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/"
          />
        ) : (
          <SignUp
            appearance={appearance}
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/"
          />
        )}
      </div>
    </main>
  );
}
