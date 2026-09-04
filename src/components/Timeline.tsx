import { LockKeyhole, Share2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
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
  milestone: false,
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

function groupEntries(entries: Entry[]) {
  const groups = new Map<string, Entry[]>();
  for (const entry of entries) {
    const label = dateLabel(entry.createdAt);
    groups.set(label, [...(groups.get(label) ?? []), entry]);
  }
  return Array.from(groups);
}

export function Timeline({ entries }: { entries: Entry[] }) {
  const [openEntry, setOpenEntry] = useState<Entry>();

  if (entries.length === 0) {
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

  return (
    <section className="timeline" aria-labelledby="timeline-heading">
      <div className="section-heading">
        <h2 id="timeline-heading">timeline</h2>
        <span>newest first</span>
      </div>
      {groupEntries(entries).map(([label, items]) => (
        <div className="day-group" key={label}>
          <div className="day-label">
            <span>{label}</span>
            <small>
              {items.length} {items.length === 1 ? "piece" : "pieces"}
            </small>
          </div>
          <div className="entry-grid">
            {items.map((entry) => (
              <article className="entry-card" key={entry.id}>
                <button
                  className="entry-image"
                  type="button"
                  onClick={() => setOpenEntry(entry)}
                  data-drop-exclude="true"
                  aria-label={`Open ${entry.title ?? entry.originalFilename}`}
                >
                  <ArtworkImage src={entry.imageUrl} alt={entry.title ?? entry.originalFilename} />
                </button>
                <div className="entry-meta">
                  <Link to={`/entries/${entry.id}`}>
                    <strong>{entry.title ?? entry.originalFilename}</strong>
                  </Link>
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
              </article>
            ))}
          </div>
        </div>
      ))}
      {openEntry && <ImageLightbox entry={openEntry} onClose={() => setOpenEntry(undefined)} />}
    </section>
  );
}
