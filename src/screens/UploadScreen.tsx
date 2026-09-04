import { ImagePlus, UploadCloud, X } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import type { UploadInput, Visibility } from "../../shared/pixel";
import { readImageSize, validateImageFile } from "../lib/image";

type UploadDraft = {
  file: File;
  title: string;
  note: string;
  visibility: Visibility;
};

function createDraft(file: File): UploadDraft {
  return { file, title: "", note: "", visibility: "private" };
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

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : undefined), [file]);
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  function choose(files: FileList | File[]) {
    setError(undefined);
    const selected = Array.from(files);
    if (selected.length === 0) return;
    if (selected.length > 1) {
      setError("Choose one image at a time");
      return;
    }
    try {
      validateImageFile(selected[0]);
      setDraft(createDraft(selected[0]));
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
    if (!draft) return;
    setSubmitting(true);
    setError(undefined);

    try {
      const dimensions = await readImageSize(draft.file);
      const entryId = await onUpload({
        file: draft.file,
        ...dimensions,
        title: draft.title.trim() || undefined,
        note: draft.note.trim() || undefined,
        visibility: draft.visibility,
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
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="upload-panel" data-drop-exclude="true">
        <header className="upload-heading">
          <div>
            <p className="eyebrow">upload</p>
            <h1 id="upload-title">New work</h1>
          </div>
          <button type="button" onClick={onClose} aria-label="Close new work">
            <X size={17} />
          </button>
        </header>
        <form className="upload-form" onSubmit={submit}>
          <div className="upload-media-column">
            <div
              className={`drop-zone ${dragging ? "is-dragging" : ""} ${draft ? "has-file" : ""}`}
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
                  <img src={previewUrl} alt="Selected artwork preview" />
                  <button
                    className="remove-file"
                    type="button"
                    onClick={() => setDraft(undefined)}
                    aria-label={`Remove ${draft.file.name}`}
                  >
                    <X size={16} />
                  </button>
                  <div className="file-caption">
                    <strong>{draft.file.name}</strong>
                    <span>{Math.ceil(draft.file.size / 1024)} KB</span>
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
                  <span>PNG, GIF, JPG, WebP, or AVIF, up to 10 MB</span>
                </button>
              )}
              <input
                ref={inputRef}
                className="visually-hidden"
                type="file"
                accept="image/png,image/gif,image/jpeg,image/webp,image/avif"
                onChange={(event) => {
                  if (event.target.files) choose(event.target.files);
                  event.target.value = "";
                }}
              />
            </div>
          </div>
          <div className="form-fields">
            <label>
              title <span>optional</span>
              <input
                maxLength={100}
                placeholder="tiny forest study"
                value={draft?.title ?? ""}
                disabled={!draft}
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
                disabled={!draft}
                onChange={(event) => updateDraft({ note: event.target.value })}
              />
            </label>
            <fieldset disabled={!draft}>
              <legend>visibility</legend>
              <div className="segmented">
                {(["private", "unlisted", "public"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    data-active={draft?.visibility === option}
                    onClick={() => updateDraft({ visibility: option })}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <small>default / private</small>
            </fieldset>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions">
              <button className="button" type="button" onClick={onClose}>
                cancel
              </button>
              <button className="button primary" type="submit" disabled={!draft || submitting}>
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
