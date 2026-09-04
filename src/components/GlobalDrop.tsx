import { UploadCloud, X } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import { useNavigate } from "react-router";
import type { UploadInput } from "../../shared/pixel";
import { readImageSize, validateImageFile } from "../lib/image";

type DropStatus = "idle" | "ready" | "reading" | "uploading" | "done" | "error";

export function GlobalDrop({
  children,
  onUpload,
}: {
  children: ReactNode;
  onUpload: (input: UploadInput) => Promise<string>;
}) {
  const navigate = useNavigate();
  const depth = useRef(0);
  const [status, setStatus] = useState<DropStatus>("idle");
  const [message, setMessage] = useState("Drop to upload");

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(
      context.registerTool(
        {
          name: "start_pixel_upload",
          title: "Open Pixel upload",
          description: "Open the Pixel upload form without creating an entry",
          inputSchema: { type: "object", properties: {}, additionalProperties: false },
          annotations: { readOnlyHint: true, untrustedContentHint: false },
          execute() {
            void navigate("/upload");
            return { path: "/upload" };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);
    return () => lifecycle.abort();
  }, [navigate]);

  function isExcluded(event: DragEvent) {
    return event.target instanceof Element && Boolean(event.target.closest("[data-drop-exclude]"));
  }

  function handleDragEnter(event: DragEvent) {
    if (!event.dataTransfer.types.includes("Files") || isExcluded(event)) return;
    event.preventDefault();
    depth.current += 1;
    setMessage("Drop to upload");
    setStatus("ready");
  }

  function handleDragOver(event: DragEvent) {
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = isExcluded(event) ? "none" : "copy";
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0 && status === "ready") setStatus("idle");
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    depth.current = 0;
    if (isExcluded(event)) {
      setStatus("idle");
      return;
    }
    const file = event.dataTransfer.files[0];
    if (file) void quickUpload(file);
  }

  async function quickUpload(file: File) {
    try {
      validateImageFile(file);
      setMessage(file.name);
      setStatus("reading");
      const dimensions = await readImageSize(file);
      setStatus("uploading");
      const entryId = await onUpload({
        file,
        ...dimensions,
        visibility: "private",
        milestone: false,
      });
      setStatus("done");
      window.setTimeout(() => {
        setStatus("idle");
        void navigate(`/entries/${entryId}`);
      }, 350);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Upload failed");
      setStatus("error");
    }
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
      {status !== "idle" && (
        <div className="global-drop" data-state={status} aria-live="polite">
          <div className="global-drop-panel">
            <UploadCloud size={28} strokeWidth={1.4} />
            <strong>{status === "done" ? "Uploaded" : message}</strong>
            <span>{statusLabel(status)}</span>
            <div className="global-drop-progress">
              <i />
            </div>
            {status === "error" && (
              <button type="button" onClick={() => setStatus("idle")} aria-label="Close">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function statusLabel(status: DropStatus) {
  if (status === "ready") return "PNG or GIF / private";
  if (status === "reading") return "Reading image";
  if (status === "uploading") return "Uploading";
  if (status === "done") return "Private entry";
  if (status === "error") return "Try another file";
  return "";
}
