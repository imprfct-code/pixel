import { LockKeyhole, Pencil, Share2 } from "lucide-react";
import { useState } from "react";
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
    <>
      <ImageLightbox
        entry={entry}
        onClose={() => {
          if (editing) setEditing(false);
          else void navigate("/profile");
        }}
        toolbarActions={
          <>
            <span className="visibility large">
              {entry.visibility === "private" ? <LockKeyhole size={13} /> : <Share2 size={13} />}
              {entry.visibility}
            </span>
            <button type="button" onClick={() => setEditing(true)} aria-label="Edit entry">
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
