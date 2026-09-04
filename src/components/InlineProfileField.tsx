import { Check, Pencil, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

type ProfileFieldKind = "handle" | "displayName" | "bio" | "website";

export function InlineProfileField({
  kind,
  value,
  emptyLabel,
  onSave,
}: {
  kind: ProfileFieldKind;
  value: string;
  emptyLabel: string;
  onSave: (value: string) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editing) return;
    const field = kind === "bio" ? textareaRef.current : inputRef.current;
    field?.focus();
    field?.select();
  }, [editing, kind]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (draft === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(draft);
      setEditing(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  function handleEscape(event: KeyboardEvent) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    setDraft(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <form className="inline-profile-form" data-kind={kind} onSubmit={submit}>
        {kind === "handle" && <span>@</span>}
        {kind === "bio" ? (
          <textarea
            ref={textareaRef}
            rows={2}
            maxLength={240}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleEscape}
          />
        ) : (
          <input
            ref={inputRef}
            required={kind === "handle"}
            minLength={kind === "handle" ? 2 : undefined}
            maxLength={kind === "handle" ? 32 : kind === "displayName" ? 80 : 160}
            type={kind === "website" ? "url" : "text"}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleEscape}
          />
        )}
        <button type="submit" disabled={saving} aria-label={`Save ${kind}`}>
          <Check size={13} />
        </button>
        <button type="button" onClick={() => setEditing(false)} aria-label={`Cancel ${kind}`}>
          <X size={13} />
        </button>
        {error && <small>{error}</small>}
      </form>
    );
  }

  return (
    <div className="inline-profile-field" data-kind={kind}>
      {kind === "handle" && <h1>@{value}</h1>}
      {kind === "displayName" && <p className="profile-note">{value || emptyLabel}</p>}
      {kind === "bio" && <p className="profile-bio">{value || emptyLabel}</p>}
      {kind === "website" &&
        (value ? (
          <a className="profile-link" href={value} target="_blank" rel="noreferrer">
            {value.replace(/^https?:\/\//, "")}
          </a>
        ) : (
          <span className="profile-link">{emptyLabel}</span>
        ))}
      <button
        type="button"
        onClick={() => {
          setDraft(value);
          setError("");
          setEditing(true);
        }}
        aria-label={`Edit ${kind}`}
      >
        <Pencil size={11} /> edit
      </button>
    </div>
  );
}
