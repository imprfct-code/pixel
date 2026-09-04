import { useQuery } from "convex/react";
import { Link, useParams } from "react-router";
import { api } from "../../convex/_generated/api";
import type { Entry, UserSummary } from "../../shared/pixel";
import { HomeScreen } from "./HomeScreen";

export function PublicProfileScreen() {
  const { handle = "" } = useParams();
  const profile = useQuery(api.entries.publicProfile, { username: handle });

  return (
    <div className="app-shell public-profile-shell">
      <header className="site-header">
        <Link className="wordmark" to={`/${profile?.user.username ?? handle}`} aria-label="Pixel">
          <img src="/pixel.svg" alt="" /> Pixel
        </Link>
        <Link className="header-settings" to="/profile">
          my profile
        </Link>
      </header>
      <main className="page-shell">
        {profile === undefined && <p className="status-message">loading</p>}
        {profile === null && (
          <section className="not-found">
            <h1>Profile not found</h1>
            <Link className="button" to="/profile">
              open my profile
            </Link>
          </section>
        )}
        {profile && (
          <HomeScreen
            user={profile.user as UserSummary}
            entries={profile.entries as Entry[]}
            editable={false}
          />
        )}
      </main>
      <footer>Pixel</footer>
    </div>
  );
}
