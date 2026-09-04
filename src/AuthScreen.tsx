import { useSignIn, useSignUp } from "@clerk/react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

type Strategy = "oauth_github" | "oauth_google";

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : "Could not continue";
}

export function AuthScreen({ mode }: { mode: "sign-in" | "sign-up" }) {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const [active, setActive] = useState<Strategy>();
  const [error, setError] = useState("");
  const resource = mode === "sign-in" ? signIn : signUp;

  async function continueWith(strategy: Strategy) {
    if (!resource) return;
    setActive(strategy);
    setError("");
    try {
      const result = await resource.sso({
        strategy,
        redirectUrl: "/",
        redirectCallbackUrl: "/sso-callback",
      });
      if (result.error) throw result.error;
    } catch (caught) {
      setError(messageFrom(caught));
      setActive(undefined);
    }
  }

  const isSignIn = mode === "sign-in";

  return (
    <main className="auth-page">
      <div className="auth-frame">
        <Link className="auth-wordmark" to="/">
          <img src="/pixel.svg" alt="" /> Pixel
        </Link>
        <section className="auth-content">
          <p className="eyebrow">account</p>
          <h1>{isSignIn ? "sign in" : "create account"}</h1>
          <div className="auth-providers">
            <button
              className="auth-provider primary"
              type="button"
              disabled={!resource || Boolean(active)}
              onClick={() => void continueWith("oauth_github")}
            >
              {active === "oauth_github" ? (
                <Loader2 className="auth-spinner" size={14} />
              ) : (
                <span className="provider-mark">GH</span>
              )}
              {active === "oauth_github" ? "connecting" : "continue with GitHub"}
            </button>
            <button
              className="auth-provider"
              type="button"
              disabled={!resource || Boolean(active)}
              onClick={() => void continueWith("oauth_google")}
            >
              {active === "oauth_google" ? (
                <Loader2 className="auth-spinner" size={14} />
              ) : (
                <span className="provider-mark">G</span>
              )}
              {active === "oauth_google" ? "connecting" : "continue with Google"}
            </button>
          </div>
          {error && <p className="auth-error">{error}</p>}
          <p className="auth-switch">
            {isSignIn ? "new to Pixel" : "already have an account"}
            <Link to={isSignIn ? "/sign-up" : "/sign-in"}>
              {isSignIn ? "create account" : "sign in"}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
