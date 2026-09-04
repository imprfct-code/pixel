import { Trash2, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { calendarDateKey, entryDate } from "../lib/calendar";
import type { Entry, EntryUpdateInput } from "../../shared/pixel";

export function EntryEditor({
  entry,
  onSave,
  onDelete,
  onClose,
}: {
  entry: Entry;
  onSave: (input: EntryUpdateInput) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [practiceDate, setPracticeDate] = useState(entryDate(entry));
  const [title, setTitle] = useState(entry.title ?? "");
  const [note, setNote] = useState(entry.note ?? "");
  const [visibility, setVisibility] = useState(entry.visibility);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog?.open) dialog?.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await onSave({
        title: title.trim() || undefined,
        note: note.trim() || undefined,
        visibility,
        practiceDate,
      });
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update work");
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onDelete();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete work");
      setSaving(false);
      setConfirmDelete(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="entry-editor-dialog"
      aria-labelledby="entry-editor-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!saving) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <form className="entry-editor" onSubmit={submit}>
        <header>
          <div>
            <p className="eyebrow">work</p>
            <h2 id="entry-editor-title">Edit artwork</h2>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close work editor">
            <X size={17} />
          </button>
        </header>
        <fieldset disabled={saving} className="entry-editor-body form-fields">
          <label>
            work date
            <input
              type="date"
              required
              max={calendarDateKey(new Date())}
              value={practiceDate}
              onChange={(event) => setPracticeDate(event.target.value)}
            />
          </label>
          <label>
            title <span>optional</span>
            <input
              maxLength={100}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label>
            note <span>optional</span>
            <textarea
              rows={4}
              maxLength={500}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
          <fieldset>
            <legend>visibility</legend>
            <div className="segmented">
              {(["private", "unlisted", "public"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  data-active={visibility === option}
                  aria-pressed={visibility === option}
                  onClick={() => setVisibility(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </fieldset>
          {error && <p className="form-error">{error}</p>}
          <div className="entry-editor-actions">
            <button
              className="button danger"
              type="button"
              disabled={saving}
              onClick={() => void remove()}
            >
              <Trash2 size={14} /> {confirmDelete ? "confirm delete" : "delete"}
            </button>
            <span />
            <button className="button" type="button" onClick={onClose} disabled={saving}>
              cancel
            </button>
            <button className="button primary" type="submit" disabled={saving}>
              {saving ? "saving" : "save changes"}
            </button>
          </div>
        </fieldset>
      </form>
    </dialog>
  );
}
