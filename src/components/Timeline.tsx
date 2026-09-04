import { ArrowDown, ArrowUp, LockKeyhole, Share2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import type { Entry } from "../../shared/pixel";
import { ArtworkImage } from "./ArtworkImage";
import { ImageLightbox } from "./ImageLightbox";

const PREVIEW_ENTRY: Entry = {
  id: "practice-studies",
  title: "Practice studies",
  note: null,
  originalFilename: "practice-studies.png",
  mimeType: "image/png",
  width: 1536,
  height: 1024,
  fileSize: 1_300_000,
  visibility: "private",
  createdAt: new Date().toISOString(),
  imageUrl: "/practice-studies.png",
};

function dateLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const key = date.toDateString();
  if (key === today.toDateString()) return "today";
  if (key === yesterday.toDateString()) return "yesterday";
  return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", year: "numeric" })
    .format(date)
    .toLowerCase();
}

export function Timeline({
  entries,
  linkEntries = true,
}: {
  entries: Entry[];
  linkEntries?: boolean;
}) {
  const navigate = useNavigate();
  const [openEntry, setOpenEntry] = useState<Entry>();
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  if (entries.length === 0) {
    if (!linkEntries) {
      return (
        <section className="empty-timeline">
          <div className="section-heading">
            <h2>timeline</h2>
            <span>0 entries</span>
          </div>
          <p className="public-empty-copy">No public entries yet</p>
        </section>
      );
    }
    return (
      <>
        <section className="empty-timeline">
          <div className="section-heading">
            <h2>timeline</h2>
            <span>0 entries</span>
          </div>
          <button
            className="practice-preview-trigger"
            type="button"
            onClick={() => setOpenEntry(PREVIEW_ENTRY)}
            data-drop-exclude="true"
            aria-label="Open practice studies"
          >
            <img
              className="practice-preview"
              src="/practice-studies.png"
              alt="Six pixel art practice studies"
            />
          </button>
          <div className="empty-copy">
            <div>
              <strong>No entries</strong>
            </div>
            <Link className="button primary" to="/upload">
              upload
            </Link>
          </div>
        </section>
        {openEntry && <ImageLightbox entry={openEntry} onClose={() => setOpenEntry(undefined)} />}
      </>
    );
  }

  const sortedEntries = [...entries].sort((left, right) => {
    const difference = new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    return sort === "newest" ? difference : -difference;
  });

  return (
    <section className="timeline" aria-labelledby="timeline-heading">
      <div className="section-heading">
        <h2 id="timeline-heading">timeline</h2>
        <div className="timeline-sort" aria-label="Sort timeline">
          <button type="button" aria-pressed={sort === "newest"} onClick={() => setSort("newest")}>
            <ArrowDown size={11} /> newest
          </button>
          <button type="button" aria-pressed={sort === "oldest"} onClick={() => setSort("oldest")}>
            <ArrowUp size={11} /> oldest
          </button>
        </div>
      </div>
      <div className="entry-timeline">
        {sortedEntries.map((entry, index) => (
          <article
            className="timeline-entry"
            key={entry.id}
            role={linkEntries ? "link" : "button"}
            tabIndex={0}
            data-drop-exclude="true"
            aria-label={`Open ${entry.title ?? entry.originalFilename}`}
            onClick={() => {
              if (linkEntries) void navigate(`/entries/${entry.id}`);
              else setOpenEntry(entry);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              if (linkEntries) void navigate(`/entries/${entry.id}`);
              else setOpenEntry(entry);
            }}
          >
            <span className="timeline-dot" data-latest={index === 0 || undefined} />
            <div className="timeline-thumbnail">
              <ArtworkImage src={entry.imageUrl} alt={entry.title ?? entry.originalFilename} />
            </div>
            <div className="timeline-entry-copy">
              <div className="timeline-entry-title">
                <strong>{entry.title ?? entry.originalFilename}</strong>
                <time dateTime={entry.createdAt}>{dateLabel(entry.createdAt)}</time>
              </div>
              {entry.note && <p>{entry.note}</p>}
              <div className="timeline-entry-meta">
                <span>
                  {entry.width}×{entry.height}
                </span>
                <span className="visibility">
                  {entry.visibility === "private" ? (
                    <LockKeyhole size={11} />
                  ) : (
                    <Share2 size={11} />
                  )}
                  {entry.visibility}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
      {openEntry && <ImageLightbox entry={openEntry} onClose={() => setOpenEntry(undefined)} />}
    </section>
  );
}
