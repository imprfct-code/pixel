import { Download, Minus, Plus, X } from "lucide-react";
import { useEffect, useState, type WheelEvent } from "react";
import type { Entry } from "../../shared/pixel";
import { downloadImage } from "../lib/image";
import { ArtworkImage } from "./ArtworkImage";

const ZOOMS = [1, 2, 4, 8, 16] as const;

export function ImageLightbox({ entry, onClose }: { entry: Entry; onClose: () => void }) {
  const [zoomIndex, setZoomIndex] = useState(
    entry.width <= 64 ? 3 : entry.width <= 256 ? 2 : entry.width <= 512 ? 1 : 0,
  );
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const zoom = ZOOMS[zoomIndex];

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "+" || event.key === "=") {
        setZoomIndex((current) => Math.min(current + 1, ZOOMS.length - 1));
      }
      if (event.key === "-") setZoomIndex((current) => Math.max(current - 1, 0));
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    setZoomIndex((current) =>
      event.deltaY < 0 ? Math.min(current + 1, ZOOMS.length - 1) : Math.max(current - 1, 0),
    );
  }

  async function handleDownload() {
    setDownloading(true);
    setDownloadError(false);
    try {
      await downloadImage(entry.imageUrl, entry.originalFilename);
    } catch {
      setDownloadError(true);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={entry.title ?? entry.originalFilename}
    >
      <div className="lightbox-bar">
        <strong>{entry.title ?? entry.originalFilename}</strong>
        <span>
          {entry.width}×{entry.height}
        </span>
        <div className="lightbox-actions">
          <button
            type="button"
            onClick={() => setZoomIndex((current) => Math.max(current - 1, 0))}
            disabled={zoomIndex === 0}
            aria-label="Zoom out"
          >
            <Minus size={16} />
          </button>
          <span>{zoom}×</span>
          <button
            type="button"
            onClick={() => setZoomIndex((current) => Math.min(current + 1, ZOOMS.length - 1))}
            disabled={zoomIndex === ZOOMS.length - 1}
            aria-label="Zoom in"
          >
            <Plus size={16} />
          </button>
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={downloading}
            aria-label={downloadError ? "Download failed" : "Download image"}
            title={downloadError ? "Download failed" : "Download"}
          >
            <Download size={16} />
          </button>
          <button type="button" onClick={onClose} aria-label="Close viewer">
            <X size={18} />
          </button>
        </div>
      </div>
      <div className="lightbox-canvas" onWheel={handleWheel} data-drop-exclude="true">
        <div className="lightbox-image-wrap">
          <ArtworkImage
            src={entry.imageUrl}
            alt={entry.title ?? entry.originalFilename}
            style={{ width: entry.width * zoom, height: entry.height * zoom }}
          />
        </div>
      </div>
    </div>
  );
}
