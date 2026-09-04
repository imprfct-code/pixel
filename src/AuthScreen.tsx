import { useSignIn, useSignUp } from "@clerk/react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

type Strategy = "oauth_github" | "oauth_google";

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Try again";
}

function GitHubIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M12 .7A11.5 11.5 0 0 0 8.36 23.1c.58.1.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.52-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.27 3.38.97.1-.75.4-1.27.74-1.56-2.57-.3-5.27-1.29-5.27-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.16 1.18A10.95 10.95 0 0 1 12 6.1c.98 0 1.94.13 2.85.38 2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.76.12 3.05.73.81 1.17 1.83 1.17 3.09 0 4.42-2.7 5.39-5.28 5.68.42.36.78 1.06.78 2.14v3.28c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18">
      <path
        fill="#4285f4"
        d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.797 2.716v2.258h2.909c1.702-1.567 2.684-3.874 2.684-6.614Z"
      />
      <path
        fill="#34a853"
        d="M9 18c2.43 0 4.468-.806 5.956-2.181l-2.91-2.258c-.805.54-1.835.859-3.046.859-2.344 0-4.328-1.585-5.037-3.714H.956v2.332A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#fbbc05"
        d="M3.963 10.706A5.42 5.42 0 0 1 3.681 9c0-.592.102-1.168.282-1.706V4.962H.956A9 9 0 0 0 0 9c0 1.452.347 2.827.956 4.038l3.007-2.332Z"
      />
      <path
        fill="#ea4335"
        d="M9 3.58c1.321 0 2.507.454 3.44 1.345l2.581-2.581C13.464.892 11.426 0 9 0A9 9 0 0 0 .956 4.962l3.007 2.332C4.672 5.165 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
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
          <h1>{isSignIn ? "Sign in to Pixel" : "Create your account"}</h1>
          <div className="auth-providers">
            <button
              className="auth-provider primary"
              type="button"
              disabled={!resource || Boolean(active)}
              aria-busy={active === "oauth_github"}
              onClick={() => void continueWith("oauth_github")}
            >
              <span className="auth-provider-icon">
                {active === "oauth_github" ? <Loader2 className="auth-spinner" /> : <GitHubIcon />}
              </span>
              {active === "oauth_github" ? "Opening GitHub" : "Continue with GitHub"}
            </button>
            <button
              className="auth-provider"
              type="button"
              disabled={!resource || Boolean(active)}
              aria-busy={active === "oauth_google"}
              onClick={() => void continueWith("oauth_google")}
            >
              <span className="auth-provider-icon">
                {active === "oauth_google" ? <Loader2 className="auth-spinner" /> : <GoogleIcon />}
              </span>
              {active === "oauth_google" ? "Opening Google" : "Continue with Google"}
            </button>
          </div>
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <p className="auth-switch">
            {isSignIn ? "New to Pixel?" : "Already have an account?"}
            <Link to={isSignIn ? "/sign-up" : "/sign-in"}>
              {isSignIn ? "Create account" : "Sign in"}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
