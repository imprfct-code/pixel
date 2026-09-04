import { Check, Pencil, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import type { Entry, EntryUpdateInput } from "../../shared/pixel";
import { EntryEditor } from "../components/EntryEditor";
import { ImageLightbox } from "../components/ImageLightbox";

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
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    [],
  );

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 1800);
  }

  if (loading) return <p className="status-message">loading</p>;
  if (!entry) {
    return (
      <section className="not-found">
        <h1>Work not found</h1>
        <Link className="button" to="/profile">
          back to timeline
        </Link>
      </section>
    );
  }

  return (
    <>
      <ImageLightbox
        entry={entry}
        onClose={() => {
          if (editing) setEditing(false);
          else void navigate("/profile");
        }}
        toolbarActions={
          <>
            <button
              className="lightbox-share"
              type="button"
              data-copied={copied || undefined}
              onClick={() => void copyLink()}
              aria-label={copied ? "Link copied" : "Copy share link"}
            >
              {copied ? <Check size={13} /> : <Share2 size={13} />}
              <span aria-live="polite">{copied ? "copied" : "share"}</span>
            </button>
            <button type="button" onClick={() => setEditing(true)} aria-label="Edit work">
              <Pencil size={15} />
            </button>
          </>
        }
      />
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
    </>
  );
}
