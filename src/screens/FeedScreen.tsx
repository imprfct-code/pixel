import { useQuery } from "convex/react";
import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { api } from "../../convex/_generated/api";
import type { Entry } from "../../shared/pixel";
import { ArtworkImage } from "../components/ArtworkImage";
import { ImageLightbox } from "../components/ImageLightbox";

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" })
    .format(new Date(value))
    .toLowerCase();
}

export function FeedScreen() {
  const participants = useQuery(api.entries.feed);
  const [openEntry, setOpenEntry] = useState<Entry>();

  return (
    <div className="app-shell feed-shell">
      <header className="site-header">
        <Link className="wordmark" to="/" aria-label="Pixel feed">
          <img src="/pixel.svg" alt="" /> Pixel
        </Link>
        <Link className="header-settings" to="/profile">
          my profile
        </Link>
      </header>
      <main className="page-shell feed-page">
        <div className="feed-heading">
          <div>
            <p className="eyebrow">community</p>
            <h1>Feed</h1>
          </div>
          <span>{participants ? `${participants.length} artists` : "loading"}</span>
        </div>
        {participants === undefined && <p className="status-message">loading</p>}
        {participants?.length === 0 && <p className="feed-empty">No artists yet</p>}
        {participants && participants.length > 0 && (
          <div className="feed-list">
            {participants.map((participant) => (
              <article className="feed-artist" key={participant.user.id}>
                <Link className="feed-artist-profile" to={`/${participant.user.username}`}>
                  <img src={participant.user.avatarUrl ?? "/avatar.png"} alt="" />
                  <span>
                    <strong>@{participant.user.username}</strong>
                    {participant.user.displayName && <small>{participant.user.displayName}</small>}
                  </span>
                  <ArrowUpRight size={15} />
                </Link>
                {participant.entries.length > 0 ? (
                  <div className="feed-artworks">
                    {participant.entries.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => setOpenEntry(entry as Entry)}
                        aria-label={`Open ${entry.title ?? entry.originalFilename}`}
                      >
                        <span className="feed-artwork-image">
                          <ArtworkImage
                            src={entry.imageUrl}
                            alt={entry.title ?? entry.originalFilename}
                          />
                        </span>
                        <span className="feed-artwork-meta">
                          <strong>{entry.title ?? entry.originalFilename}</strong>
                          <time dateTime={entry.createdAt}>{dateLabel(entry.createdAt)}</time>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="feed-no-work">No public entries</p>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
      <footer>Pixel</footer>
      {openEntry && <ImageLightbox entry={openEntry} onClose={() => setOpenEntry(undefined)} />}
    </div>
  );
}
