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
  milestone: boolean;
};

function createDraft(file: File): UploadDraft {
  return { file, title: "", note: "", visibility: "private", milestone: false };
}

function fileKey(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

export function UploadScreen({
  initialFiles = [],
  onUpload,
  onClose,
  onComplete,
}: {
  initialFiles?: File[];
  onUpload: (input: UploadInput) => Promise<string>;
  onClose: () => void;
  onComplete: (entryIds: string[]) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [drafts, setDrafts] = useState(() => initialFiles.map(createDraft));
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(0);
  const [error, setError] = useState<string>();
  const active = drafts[activeIndex];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog?.open) dialog?.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  const previewUrls = useMemo(
    () => drafts.map((draft) => URL.createObjectURL(draft.file)),
    [drafts],
  );
  useEffect(() => () => previewUrls.forEach((url) => URL.revokeObjectURL(url)), [previewUrls]);

  function choose(files: FileList | File[]) {
    setError(undefined);
    const nextFiles = Array.from(files);
    if (nextFiles.length === 0) return;
    try {
      nextFiles.forEach(validateImageFile);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Invalid file");
      return;
    }
    setDrafts((current) => {
      const existing = new Set(current.map((draft) => fileKey(draft.file)));
      const added = nextFiles.filter((file) => !existing.has(fileKey(file))).map(createDraft);
      return [...current, ...added];
    });
  }

  function removeDraft(index: number) {
    setDrafts((current) => current.filter((_, draftIndex) => draftIndex !== index));
    setActiveIndex((current) =>
      Math.max(0, current > index ? current - 1 : current === index ? index - 1 : current),
    );
  }

  function updateDraft(patch: Partial<Omit<UploadDraft, "file">>) {
    setDrafts((current) =>
      current.map((draft, index) => (index === activeIndex ? { ...draft, ...patch } : draft)),
    );
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    choose(event.dataTransfer.files);
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    choose(
      Array.from(event.clipboardData.files).filter(
        (file) => file.type === "image/png" || file.type === "image/gif",
      ),
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (drafts.length === 0) return;
    setSubmitting(true);
    setSubmitted(0);
    setError(undefined);
    const entryIds: string[] = [];

    try {
      for (const [index, draft] of drafts.entries()) {
        setSubmitted(index);
        const dimensions = await readImageSize(draft.file);
        entryIds.push(
          await onUpload({
            file: draft.file,
            ...dimensions,
            title: draft.title.trim() || undefined,
            note: draft.note.trim() || undefined,
            visibility: draft.visibility,
            milestone: draft.milestone,
          }),
        );
      }
      onComplete(entryIds);
    } catch (cause) {
      if (entryIds.length > 0) {
        setDrafts((current) => current.slice(entryIds.length));
        setActiveIndex(0);
      }
      const reason = cause instanceof Error ? cause.message : "Upload failed";
      setError(entryIds.length > 0 ? `${entryIds.length} saved · ${reason}` : reason);
      setSubmitted(0);
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
            <h1 id="upload-title">New entry</h1>
          </div>
          <button type="button" onClick={onClose} aria-label="Close new entry">
            <X size={17} />
          </button>
        </header>
        <form className="upload-form" onSubmit={submit}>
          <div className="upload-media-column">
            <div
              className={`drop-zone ${dragging ? "is-dragging" : ""} ${active ? "has-file" : ""}`}
              onDragEnter={() => setDragging(true)}
              onDragLeave={() => setDragging(false)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
              onPaste={handlePaste}
              tabIndex={0}
              data-drop-exclude="true"
            >
              {active ? (
                <>
                  <img src={previewUrls[activeIndex]} alt="Selected artwork preview" />
                  <button
                    className="remove-file"
                    type="button"
                    onClick={() => removeDraft(activeIndex)}
                    aria-label={`Remove ${active.file.name}`}
                  >
                    <X size={16} />
                  </button>
                  <div className="file-caption">
                    <strong>{active.file.name}</strong>
                    <span>{Math.ceil(active.file.size / 1024)} KB</span>
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
                  <span>PNG or GIF · up to 10 MB each</span>
                </button>
              )}
              <input
                ref={inputRef}
                className="visually-hidden"
                type="file"
                accept="image/png,image/gif"
                multiple
                onChange={(event) => {
                  if (event.target.files) choose(event.target.files);
                  event.target.value = "";
                }}
              />
            </div>
            {drafts.length > 0 && (
              <div className="upload-queue" aria-label="Files to upload">
                {drafts.map((draft, index) => (
                  <button
                    key={fileKey(draft.file)}
                    type="button"
                    data-active={index === activeIndex}
                    aria-pressed={index === activeIndex}
                    onClick={() => setActiveIndex(index)}
                  >
                    <img src={previewUrls[index]} alt="" />
                    <span>{draft.file.name}</span>
                    <small>{index + 1}</small>
                  </button>
                ))}
                <button
                  className="add-files"
                  type="button"
                  onClick={() => inputRef.current?.click()}
                >
                  <ImagePlus size={14} /> add
                </button>
              </div>
            )}
          </div>
          <div className="form-fields">
            {active && drafts.length > 1 && (
              <p className="draft-position">
                entry {activeIndex + 1} / {drafts.length}
              </p>
            )}
            <label>
              title <span>optional</span>
              <input
                maxLength={100}
                placeholder="tiny forest study"
                value={active?.title ?? ""}
                disabled={!active}
                onChange={(event) => updateDraft({ title: event.target.value })}
              />
            </label>
            <label>
              note <span>optional</span>
              <textarea
                maxLength={500}
                rows={4}
                placeholder="what changed, what felt hard…"
                value={active?.note ?? ""}
                disabled={!active}
                onChange={(event) => updateDraft({ note: event.target.value })}
              />
            </label>
            <fieldset disabled={!active}>
              <legend>visibility</legend>
              <div className="segmented">
                {(["private", "unlisted", "public"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    data-active={active?.visibility === option}
                    onClick={() => updateDraft({ visibility: option })}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <small>default / private</small>
            </fieldset>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={active?.milestone ?? false}
                disabled={!active}
                onChange={(event) => updateDraft({ milestone: event.target.checked })}
              />{" "}
              mark as a milestone
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions">
              <button className="button" type="button" onClick={onClose}>
                cancel
              </button>
              <button className="button primary" type="submit" disabled={!active || submitting}>
                <UploadCloud size={15} />
                {submitting
                  ? `saving ${submitted + 1}/${drafts.length}`
                  : drafts.length > 1
                    ? `save ${drafts.length} entries`
                    : "save entry"}
              </button>
            </div>
          </div>
        </form>
      </section>
    </dialog>
  );
}
