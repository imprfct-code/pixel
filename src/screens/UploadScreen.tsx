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
import { Link } from "react-router";
import type { UploadInput, Visibility } from "../../shared/pixel";

const ACCEPTED_TYPES = new Set(["image/png", "image/gif"]);

function imageSize(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      reject(new Error("The image could not be read"));
      URL.revokeObjectURL(url);
    };
    image.src = url;
  });
}

export function UploadScreen({ onUpload }: { onUpload: (input: UploadInput) => Promise<string> }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [visibility, setVisibility] = useState<Visibility>("private");

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
    if (!ACCEPTED_TYPES.has(nextFile.type)) {
      setError("Choose a PNG or GIF file.");
      return;
    }
    if (nextFile.size > 10 * 1024 * 1024) {
      setError("Keep the file at 10 MB or below.");
      return;
    }
    setFile(nextFile);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    choose(event.dataTransfer.files[0]);
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    choose(Array.from(event.clipboardData.files).find((item) => ACCEPTED_TYPES.has(item.type)));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setSubmitting(true);
    setError(undefined);
    const form = new FormData(event.currentTarget);
    try {
      const dimensions = await imageSize(file);
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
      setError(cause instanceof Error ? cause.message : "Upload failed. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <section className="upload-page">
      <div className="page-intro">
        <p className="eyebrow">new practice entry</p>
        <h1>Keep the evidence.</h1>
        <p>Rough studies are the point. Every new upload starts private.</p>
      </div>
      <form className="upload-form" onSubmit={submit}>
        <div
          className={`drop-zone ${dragging ? "is-dragging" : ""} ${file ? "has-file" : ""}`}
          onDragEnter={() => setDragging(true)}
          onDragLeave={() => setDragging(false)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          onPaste={handlePaste}
          tabIndex={0}
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
            <button className="drop-prompt" type="button" onClick={() => inputRef.current?.click()}>
              <ImagePlus size={24} strokeWidth={1.5} />
              <strong>drop, paste, or choose a file</strong>
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
            <small>Private is the default. You can choose when a study is ready to be seen.</small>
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
            <Link className="button" to="/">
              cancel
            </Link>
            <button className="button primary" type="submit" disabled={!file || submitting}>
              <UploadCloud size={15} /> {submitting ? "saving…" : "save entry"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
