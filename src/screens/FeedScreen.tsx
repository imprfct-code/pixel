import { ImagePlus } from "lucide-react";
import { useQuery } from "convex/react";
import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router";
import { api } from "../../convex/_generated/api";
import type { Entry } from "../../shared/pixel";
import { ArtworkImage } from "../components/ArtworkImage";
import { GlobalDrop } from "../components/GlobalDrop";
import { ImageLightbox } from "../components/ImageLightbox";

function cardSize(width: number, height: number, index: number) {
  const ratio = width / height;
  if (ratio >= 1.35) return "wide";
  if (index > 1 && index % 5 === 0) return "large";
  return ratio <= 0.72 ? "portrait" : "standard";
}

const SKELETON_CARDS = [
  { size: "wide", ratio: "2 / 1" },
  { size: "standard", ratio: "1 / 1" },
  { size: "portrait", ratio: "3 / 4" },
  { size: "standard", ratio: "1 / 1" },
  { size: "large", ratio: "4 / 3" },
  { size: "standard", ratio: "1 / 1" },
] as const;

function FeedSkeleton() {
  return (
    <div className="feed-board" aria-busy="true">
      <span className="visually-hidden">loading works</span>
      {SKELETON_CARDS.map((card, index) => (
        <article
          className={`feed-card feed-card-${card.size} feed-skeleton-card`}
          key={`${card.size}-${index}`}
          aria-hidden="true"
        >
          <div className="feed-skeleton-preview" style={{ aspectRatio: card.ratio }} />
          <div className="feed-skeleton-author">
            <span />
            <i />
          </div>
        </article>
      ))}
    </div>
  );
}

export function FeedScreen() {
  const navigate = useNavigate();
  const works = useQuery(api.entries.feed);
  const [openEntry, setOpenEntry] = useState<Entry>();
  const openUpload = useCallback(
    (files: File[] = []) => {
      void navigate("/upload", { state: { uploadFiles: files } });
    },
    [navigate],
  );

  return (
    <GlobalDrop onSelectFiles={openUpload}>
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
          {works === undefined ? (
            <FeedSkeleton />
          ) : (
            <div className="feed-board">
              {works.map(({ entry, author }, index) => (
                <article
                  className={`feed-card feed-card-${cardSize(entry.width, entry.height, index)}`}
                  key={entry.id}
                >
                  <button
                    className="feed-card-preview"
                    type="button"
                    style={{ aspectRatio: `${entry.width} / ${entry.height}` }}
                    onClick={() => setOpenEntry(entry as Entry)}
                    aria-label={`Open ${entry.title ?? entry.originalFilename}`}
                  >
                    <ArtworkImage
                      src={entry.imageUrl}
                      alt={entry.title ?? entry.originalFilename}
                    />
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
        <button
          className="feed-upload"
          type="button"
          onClick={() => openUpload()}
          aria-label="Upload new entry"
        >
          <ImagePlus size={16} /> upload
        </button>
        {openEntry && <ImageLightbox entry={openEntry} onClose={() => setOpenEntry(undefined)} />}
      </div>
    </GlobalDrop>
  );
}
