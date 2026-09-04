import { Pencil } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

type ProfileFieldKind = "handle" | "displayName" | "bio" | "website";

const fieldLabels: Record<ProfileFieldKind, string> = {
  handle: "handle",
  displayName: "display name",
  bio: "bio",
  website: "website",
};

function websiteInputValue(value: string) {
  return value.replace(/^https?:\/\//i, "");
}

function normalizeWebsite(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  new URL(normalized);
  return normalized;
}

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
  const savingRef = useRef(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editing) return;
    const field = kind === "bio" ? textareaRef.current : inputRef.current;
    field?.focus();
    if (field instanceof HTMLInputElement) {
      field.setSelectionRange(field.value.length, field.value.length);
    } else if (field) {
      field.selectionStart = field.value.length;
      field.selectionEnd = field.value.length;
      field.style.height = "auto";
      field.style.height = `${field.scrollHeight}px`;
    }
  }, [editing, kind]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (savingRef.current) return;
    let nextValue = draft;
    if (kind === "website") {
      try {
        nextValue = normalizeWebsite(draft);
      } catch {
        setError("invalid URL");
        return;
      }
    }
    if (nextValue === value) {
      setEditing(false);
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setError("");
    try {
      await onSave(nextValue);
      setEditing(false);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not save";
      setError(/already taken/i.test(message) ? "already taken" : message);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setDraft(value);
      setEditing(false);
      return;
    }
    if (event.key === "Enter" && kind !== "bio") {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  if (editing) {
    return (
      <form
        className="inline-profile-form"
        data-kind={kind}
        data-error={error || undefined}
        data-saving={saving || undefined}
        onSubmit={submit}
      >
        {kind === "handle" && <span>@</span>}
        {kind === "bio" ? (
          <textarea
            ref={textareaRef}
            aria-label={`Edit ${fieldLabels[kind]}`}
            rows={2}
            maxLength={240}
            value={draft}
            onBlur={(event) => event.currentTarget.form?.requestSubmit()}
            onChange={(event) => {
              setDraft(event.target.value);
              event.currentTarget.style.height = "auto";
              event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`;
            }}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <span className="inline-profile-input">
            <span aria-hidden="true">{draft || emptyLabel}</span>
            <input
              ref={inputRef}
              aria-label={`Edit ${fieldLabels[kind]}`}
              required={kind === "handle"}
              minLength={kind === "handle" ? 2 : undefined}
              maxLength={kind === "handle" ? 32 : kind === "displayName" ? 80 : 160}
              type="text"
              inputMode={kind === "website" ? "url" : undefined}
              autoCapitalize={kind === "website" ? "none" : undefined}
              spellCheck={kind === "website" ? false : undefined}
              value={draft}
              onBlur={(event) => event.currentTarget.form?.requestSubmit()}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
            />
          </span>
        )}
        {error && <small>{error}</small>}
      </form>
    );
  }

  const displayValue = kind === "website" && value ? websiteInputValue(value) : value;

  return (
    <button
      className="inline-profile-field"
      data-kind={kind}
      data-empty={!value || undefined}
      type="button"
      onClick={() => {
        setDraft(kind === "website" ? websiteInputValue(value) : value);
        setError("");
        setEditing(true);
      }}
      aria-label={`Edit ${fieldLabels[kind]}`}
    >
      {kind === "handle" && "@"}
      {displayValue || emptyLabel}
      <Pencil className="inline-profile-pencil" size={11} aria-hidden="true" />
    </button>
  );
}
