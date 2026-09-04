import { UploadCloud, X } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import { validateImageFile } from "../lib/image";

type DropStatus = "idle" | "ready" | "error";

export function GlobalDrop({
  children,
  onSelectFiles,
}: {
  children: ReactNode;
  onSelectFiles: (files: File[]) => void;
}) {
  const depth = useRef(0);
  const [status, setStatus] = useState<DropStatus>("idle");
  const [message, setMessage] = useState("Drop to create works");

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(
      context.registerTool(
        {
          name: "start_pixel_upload",
          title: "Open Pixel upload",
          description: "Open the Pixel upload form without creating a work",
          inputSchema: { type: "object", properties: {}, additionalProperties: false },
          annotations: { readOnlyHint: true, untrustedContentHint: false },
          execute() {
            onSelectFiles([]);
            return { path: "/upload" };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);
    return () => lifecycle.abort();
  }, [onSelectFiles]);

  function isExcluded(event: DragEvent) {
    return event.target instanceof Element && Boolean(event.target.closest("[data-drop-exclude]"));
  }

  function handleDragEnter(event: DragEvent) {
    if (!event.dataTransfer.types.includes("Files") || isExcluded(event)) return;
    event.preventDefault();
    depth.current += 1;
    const count = event.dataTransfer.items.length;
    setMessage(count > 1 ? `Drop ${count} files to create works` : "Drop to create a work");
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
    const files = Array.from(event.dataTransfer.files);
    if (files.length === 0) {
      setStatus("idle");
      return;
    }
    try {
      files.forEach(validateImageFile);
      setStatus("idle");
      onSelectFiles(files);
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
            <strong>{message}</strong>
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
  if (status === "ready") return "PNG, GIF, JPG, WebP, or AVIF, one work per file";
  if (status === "error") return "Try another file";
  return "";
}
