import { ArrowLeft, Download, Grid3X3, LockKeyhole, Pencil, Share2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import type { Entry, EntryUpdateInput } from "../../shared/pixel";
import { ArtworkImage } from "../components/ArtworkImage";
import { EntryEditor } from "../components/EntryEditor";
import { downloadImage } from "../lib/image";

const SCALES = [1, 2, 4, 8, 16] as const;

export function ViewerScreen({
  entries,
  loading,
  onUpdate,
  onDelete,
}: {
  entries: Entry[];
  loading: boolean;
  onUpdate: (entryId: string, input: EntryUpdateInput) => Promise<void>;
  onDelete: (entryId: string) => Promise<void>;
}) {
  const { entryId } = useParams();
  const navigate = useNavigate();
  const entry = entries.find((item) => item.id === entryId);
  const [scale, setScale] = useState<(typeof SCALES)[number]>(4);
  const [checker, setChecker] = useState(true);
  const [editing, setEditing] = useState(false);

  if (loading) return <p className="status-message">loading</p>;
  if (!entry) {
    return (
      <section className="not-found">
        <h1>Entry not found</h1>
        <Link className="button" to="/profile">
          back to timeline
        </Link>
      </section>
    );
  }

  return (
    <section className="viewer-page">
      <div className="viewer-heading">
        <Link className="back-link" to="/profile">
          <ArrowLeft size={15} /> timeline
        </Link>
        <div>
          <h1>{entry.title ?? entry.originalFilename}</h1>
        </div>
        <div className="viewer-entry-actions">
          <span className="visibility large">
            {entry.visibility === "private" ? <LockKeyhole size={13} /> : <Share2 size={13} />}
            {entry.visibility}
          </span>
          <button className="button" type="button" onClick={() => setEditing(true)}>
            <Pencil size={13} /> edit
          </button>
        </div>
      </div>
      <div className={`pixel-stage ${checker ? "checker" : ""}`} data-drop-exclude="true">
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
        <button
          className="checker-control"
          onClick={() =>
            void downloadImage(entry.imageUrl, entry.originalFilename).catch(() => undefined)
          }
        >
          <Download size={14} /> download
        </button>
        <span>
          {entry.width}×{entry.height}px · {Math.ceil(entry.fileSize / 1024)} KB
        </span>
      </div>
      {entry.note && <p className="entry-note">{entry.note}</p>}
      {editing && (
        <EntryEditor
          entry={entry}
          onClose={() => setEditing(false)}
          onSave={(input) => onUpdate(entry.id, input)}
          onDelete={async () => {
            await onDelete(entry.id);
            void navigate("/profile");
          }}
        />
      )}
    </section>
  );
}
