import { useQuery } from "convex/react";
import { useState } from "react";
import { Link } from "react-router";
import { api } from "../../convex/_generated/api";
import type { Entry } from "../../shared/pixel";
import { ArtworkImage } from "../components/ArtworkImage";
import { ImageLightbox } from "../components/ImageLightbox";

export function FeedScreen() {
  const works = useQuery(api.entries.feed);
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
        {works && (
          <div className="feed-board">
            {works.map(({ entry, author }) => (
              <article className="feed-card" key={entry.id}>
                <button
                  className="feed-card-preview"
                  type="button"
                  style={{ aspectRatio: `${entry.width} / ${entry.height}` }}
                  onClick={() => setOpenEntry(entry as Entry)}
                  aria-label={`Open ${entry.title ?? entry.originalFilename}`}
                >
                  <ArtworkImage src={entry.imageUrl} alt={entry.title ?? entry.originalFilename} />
                </button>
                <Link className="feed-card-author" to={`/${author.username}`}>
                  <img src={author.avatarUrl ?? "/avatar.png"} alt="" />
                  <strong>@{author.username}</strong>
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>
      {openEntry && <ImageLightbox entry={openEntry} onClose={() => setOpenEntry(undefined)} />}
    </div>
  );
}
