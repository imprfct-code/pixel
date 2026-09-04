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

export function UploadScreen({
  onUpload,
  onClose,
}: {
  onUpload: (input: UploadInput) => Promise<string>;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [visibility, setVisibility] = useState<Visibility>("private");

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

  function choose(nextFile?: File) {
    setError(undefined);
    if (!nextFile) return;
    try {
      validateImageFile(nextFile);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Invalid file");
      return;
    }
    setFile(nextFile);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    choose(event.dataTransfer.files[0]);
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    choose(
      Array.from(event.clipboardData.files).find(
        (item) => item.type === "image/png" || item.type === "image/gif",
      ),
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setSubmitting(true);
    setError(undefined);
    const form = new FormData(event.currentTarget);
    try {
      const dimensions = await readImageSize(file);
      const title = form.get("title");
      const note = form.get("note");
      await onUpload({
        file,
        width: dimensions.width,
        height: dimensions.height,
        title: typeof title === "string" && title ? title : undefined,
        note: typeof note === "string" && note ? note : undefined,
        visibility,
        milestone: form.get("milestone") === "on",
      });
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
            <h1 id="upload-title">New entry</h1>
          </div>
          <button type="button" onClick={onClose} aria-label="Close new entry">
            <X size={17} />
          </button>
        </header>
        <form className="upload-form" onSubmit={submit}>
          <div
            className={`drop-zone ${dragging ? "is-dragging" : ""} ${file ? "has-file" : ""}`}
            onDragEnter={() => setDragging(true)}
            onDragLeave={() => setDragging(false)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            onPaste={handlePaste}
            tabIndex={0}
            data-drop-exclude="true"
          >
            {previewUrl && file ? (
              <>
                <img src={previewUrl} alt="Selected artwork preview" />
                <button
                  className="remove-file"
                  type="button"
                  onClick={() => setFile(undefined)}
                  aria-label="Remove file"
                >
                  <X size={16} />
                </button>
                <div className="file-caption">
                  <strong>{file.name}</strong>
                  <span>{Math.ceil(file.size / 1024)} KB</span>
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
                <span>PNG or GIF · up to 10 MB</span>
              </button>
            )}
            <input
              ref={inputRef}
              className="visually-hidden"
              type="file"
              accept="image/png,image/gif"
              onChange={(event) => choose(event.target.files?.[0])}
            />
          </div>
          <div className="form-fields">
            <label>
              title <span>optional</span>
              <input name="title" maxLength={100} placeholder="tiny forest study" />
            </label>
            <label>
              note <span>optional</span>
              <textarea
                name="note"
                maxLength={500}
                rows={4}
                placeholder="what changed, what felt hard…"
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
                    onClick={() => setVisibility(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <small>default / private</small>
            </fieldset>
            <label className="checkbox">
              <input type="checkbox" name="milestone" /> mark as a milestone
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
              <button className="button primary" type="submit" disabled={!file || submitting}>
                <UploadCloud size={15} /> {submitting ? "saving…" : "save entry"}
              </button>
            </div>
          </div>
        </form>
      </section>
    </dialog>
  );
}
