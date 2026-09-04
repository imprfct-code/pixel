import { LockKeyhole, Share2 } from "lucide-react";
import { Link } from "react-router";
import type { Entry } from "../../shared/pixel";
import { ArtworkImage } from "./ArtworkImage";

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
  if (entries.length === 0) {
    return (
      <section className="empty-timeline">
        <div className="section-heading">
          <h2>your timeline</h2>
          <span>day one is open</span>
        </div>
        <img
          className="practice-preview"
          src="/practice-studies.png"
          alt="Six pixel art practice studies: a sword, cottage, potion, portrait, tree, and walking character"
        />
        <div className="empty-copy">
          <div>
            <strong>Every piece counts.</strong>
            <p>Your rough attempts belong here too. The contrast becomes the proof.</p>
          </div>
          <Link className="button primary" to="/upload">
            upload your first piece
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="timeline" aria-labelledby="timeline-heading">
      <div className="section-heading">
        <h2 id="timeline-heading">your timeline</h2>
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
              <Link className="entry-card" to={`/entries/${entry.id}`} key={entry.id}>
                <div className="entry-image">
                  <ArtworkImage src={entry.imageUrl} alt={entry.title ?? entry.originalFilename} />
                </div>
                <div className="entry-meta">
                  <strong>{entry.title ?? entry.originalFilename}</strong>
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
              </Link>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
