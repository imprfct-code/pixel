import { ArrowLeft, Grid3X3, LockKeyhole, Share2 } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router";
import type { Entry } from "../../shared/pixel";
import { ArtworkImage } from "../components/ArtworkImage";

const SCALES = [1, 2, 4, 8, 16] as const;

export function ViewerScreen({ entries, loading }: { entries: Entry[]; loading: boolean }) {
  const { entryId } = useParams();
  const entry = entries.find((item) => item.id === entryId);
  const [scale, setScale] = useState<(typeof SCALES)[number]>(4);
  const [checker, setChecker] = useState(true);

  if (loading) return <p className="status-message">loading artwork…</p>;
  if (!entry) {
    return (
      <section className="not-found">
        <p className="eyebrow">missing entry</p>
        <h1>This piece is not in your log.</h1>
        <Link className="button" to="/">
          back to timeline
        </Link>
      </section>
    );
  }

  return (
    <section className="viewer-page">
      <div className="viewer-heading">
        <Link className="back-link" to="/">
          <ArrowLeft size={15} /> timeline
        </Link>
        <div>
          <p className="eyebrow">practice entry</p>
          <h1>{entry.title ?? entry.originalFilename}</h1>
        </div>
        <span className="visibility large">
          {entry.visibility === "private" ? <LockKeyhole size={13} /> : <Share2 size={13} />}
          {entry.visibility}
        </span>
      </div>
      <div className={`pixel-stage ${checker ? "checker" : ""}`}>
        <ArtworkImage
          src={entry.imageUrl}
          alt={entry.title ?? entry.originalFilename}
          style={{ width: entry.width * scale, height: entry.height * scale }}
        />
      </div>
      <div className="viewer-controls">
        <div className="scale-control" aria-label="Pixel scale">
          <span>scale</span>
          {SCALES.map((value) => (
            <button key={value} data-active={scale === value} onClick={() => setScale(value)}>
              {value}×
            </button>
          ))}
        </div>
        <button
          className="checker-control"
          data-active={checker}
          onClick={() => setChecker((value) => !value)}
        >
          <Grid3X3 size={14} /> checker
        </button>
        <span>
          {entry.width}×{entry.height}px · {Math.ceil(entry.fileSize / 1024)} KB
        </span>
      </div>
      {entry.note && <p className="entry-note">{entry.note}</p>}
    </section>
  );
}
