import { ImagePlus, UploadCloud, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import type { UploadInput, Visibility } from "../../shared/pixel";
import { calendarDateKey } from "../lib/calendar";
import { ARTWORK_ACCEPT, validateImageFile } from "../lib/image";

import { useArtworkFile } from "../hooks/useArtworkFile";
import { useFramePlayback } from "../hooks/useFramePlayback";
import { AnimationFrame, AnimationControls } from "../components/AnimationPreview";

type UploadDraft = {
  file: File;
  title: string;
  note: string;
  visibility: Visibility;
  practiceDate: string;
};

function createDraft(file: File): UploadDraft {
  return {
    file,
    title: "",
    note: "",
    visibility: "private",
    practiceDate: calendarDateKey(new Date()),
  };
}

export function UploadScreen({
  initialFile,
  onUpload,
  onClose,
  onComplete,
}: {
  initialFile?: File;
  onUpload: (input: UploadInput) => Promise<string>;
  onClose: () => void;
  onComplete: (entryId: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(() => (initialFile ? createDraft(initialFile) : undefined));
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const file = draft?.file;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog?.open) dialog?.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  const { prepared, error: importError, loading } = useArtworkFile(file);
  const playback = useFramePlayback(prepared?.animation?.frameDurations);

  function choose(files: FileList | File[]) {
    if (submitting) return;
    setError(undefined);
    const selected = Array.from(files);
    if (selected.length === 0) return;
    if (selected.length > 1) {
      setError("Choose one image at a time");
      return;
    }
    try {
      validateImageFile(selected[0]);
      setDraft((current) =>
        current ? { ...current, file: selected[0] } : createDraft(selected[0]),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Invalid file");
    }
  }

  function updateDraft(patch: Partial<Omit<UploadDraft, "file">>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    choose(event.dataTransfer.files);
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    choose(Array.from(event.clipboardData.files).filter((file) => file.type.startsWith("image/")));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || !prepared || submitting) return;
    setSubmitting(true);
    setError(undefined);

    try {
      const entryId = await onUpload({
        ...prepared,
        title: draft.title.trim() || undefined,
        note: draft.note.trim() || undefined,
        visibility: draft.visibility,
        practiceDate: draft.practiceDate,
      });
      onComplete(entryId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload failed");
      setSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="upload-dialog"
      aria-labelledby="upload-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!submitting) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <section className="upload-panel" data-drop-exclude="true">
        <header className="upload-heading">
          <div>
            <p className="eyebrow">upload</p>
            <h1 id="upload-title">New work</h1>
          </div>
          <button type="button" onClick={onClose} disabled={submitting} aria-label="Close new work">
            <X size={17} />
          </button>
        </header>
        <form className="upload-form" onSubmit={submit}>
          <div className="upload-media-column">
            <div
              className={`drop-zone ${dragging ? "is-dragging" : ""} ${draft ? "has-file" : ""} ${importError ? "has-error" : ""}`}
              onDragEnter={() => setDragging(true)}
              onDragLeave={() => setDragging(false)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
              onPaste={handlePaste}
              tabIndex={0}
              data-drop-exclude="true"
            >
              {draft ? (
                <>
                  {prepared?.animation && prepared.animationUrl ? (
                    <AnimationFrame
                      url={prepared.animationUrl}
                      previewUrl={prepared.previewUrl}
                      columns={prepared.animation.columns}
                      width={prepared.width}
                      height={prepared.height}
                      frame={playback.frame}
                      alt="Selected artwork preview"
                    />
                  ) : prepared ? (
                    <img src={prepared.previewUrl} alt="Selected artwork preview" />
                  ) : (
                    <div className="import-status" role={importError ? "alert" : "status"}>
                      <ImagePlus size={24} strokeWidth={1.5} />
                      <strong>{loading ? "Reading artwork…" : "Could not import this file"}</strong>
                      {importError && <p>{importError}</p>}
                    </div>
                  )}
                  <button
                    className="remove-file"
                    disabled={submitting}
                    type="button"
                    onClick={() => setDraft(undefined)}
                    aria-label={`Remove ${draft.file.name}`}
                  >
                    <X size={16} />
                  </button>
                  <button
                    type="button"
                    className="replace-file"
                    disabled={submitting}
                    onClick={() => inputRef.current?.click()}
                  >
                    change file
                  </button>
                  <div className="file-caption">
                    <strong>{draft.file.name}</strong>
                    <span>
                      {prepared ? `${prepared.width}×${prepared.height} · ` : ""}
                      {Math.ceil(draft.file.size / 1024)} KB
                    </span>
                  </div>
                </>
              ) : (
                <button
                  className="drop-prompt"
                  type="button"
                  onClick={() => inputRef.current?.click()}
                >
                  <ImagePlus size={24} strokeWidth={1.5} />
                  <strong>drop / paste / choose</strong>
                  <span>Aseprite, PNG, GIF, JPG, WebP, or AVIF · up to 10 MB</span>
                </button>
              )}
              <input
                ref={inputRef}
                className="visually-hidden"
                type="file"
                disabled={submitting}
                accept={ARTWORK_ACCEPT}
                onChange={(event) => {
                  if (event.target.files) choose(event.target.files);
                  event.target.value = "";
                }}
              />
            </div>
            {prepared?.animation && (
              <AnimationControls
                playback={playback}
                durations={prepared.animation.frameDurations}
              />
            )}
            {prepared?.source && (
              <p className="source-note">
                Original Aseprite file is saved privately for you. Viewers see the preview
                {prepared.animation ? " and animation" : ""}.
              </p>
            )}
          </div>
          <div className="form-fields">
            <label>
              work date
              <input
                type="date"
                required
                max={calendarDateKey(new Date())}
                value={draft?.practiceDate ?? calendarDateKey(new Date())}
                disabled={!draft || submitting}
                onChange={(event) => updateDraft({ practiceDate: event.target.value })}
              />
            </label>
            <label>
              title <span>optional</span>
              <input
                maxLength={100}
                placeholder="tiny forest study"
                value={draft?.title ?? ""}
                disabled={!draft || submitting}
                onChange={(event) => updateDraft({ title: event.target.value })}
              />
            </label>
            <label>
              note <span>optional</span>
              <textarea
                maxLength={500}
                rows={4}
                placeholder="what changed, what felt hard…"
                value={draft?.note ?? ""}
                disabled={!draft || submitting}
                onChange={(event) => updateDraft({ note: event.target.value })}
              />
            </label>
            <fieldset disabled={!draft || submitting}>
              <legend>visibility</legend>
              <div className="segmented">
                {(["private", "unlisted", "public"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    data-active={draft?.visibility === option}
                    aria-pressed={draft?.visibility === option}
                    onClick={() => updateDraft({ visibility: option })}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <small>
                {draft?.visibility === "public"
                  ? "Visible on your profile and in the public feed"
                  : draft?.visibility === "unlisted"
                    ? "Anyone with the link can view this work"
                    : "Only you can view this work"}
              </small>
            </fieldset>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions">
              <button className="button" type="button" onClick={onClose} disabled={submitting}>
                cancel
              </button>
              <button className="button primary" type="submit" disabled={!prepared || submitting}>
                <UploadCloud size={15} />
                {submitting ? "saving" : "save work"}
              </button>
            </div>
          </div>
        </form>
      </section>
    </dialog>
  );
}
