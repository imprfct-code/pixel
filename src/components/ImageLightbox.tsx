import { FileDown, Download, Maximize, Minus, Plus, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import type { Entry } from "../../shared/pixel";
import { downloadImage } from "../lib/image";
import { useFramePlayback } from "../hooks/useFramePlayback";
import { AnimationControls, AnimationFrame } from "./AnimationPreview";
import { ArtworkImage } from "./ArtworkImage";

import { artworkZoom, clampArtworkZoom } from "../lib/artworkZoom";
const BUTTON_ZOOM_FACTOR = 1.25;
const WHEEL_ZOOM_SENSITIVITY = 0.02;
const MAX_WHEEL_ZOOM_EXPONENT = 0.25;

function zoomLabel(zoom: number) {
  return `${Number(zoom.toFixed(2))}×`;
}

export function ImageLightbox({
  entry,
  onClose,
  toolbarActions,
  details,
}: {
  entry: Entry;
  onClose: () => void;
  toolbarActions?: ReactNode;
  details?: ReactNode;
}) {
  const playback = useFramePlayback(entry.animation?.frameDurations);
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ pointerId: -1, x: 0, y: 0, left: 0, top: 0 });
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchDistanceRef = useRef<number>(undefined);
  const zoomAnchorRef = useRef<
    | {
        clientX: number;
        clientY: number;
        imageX: number;
        imageY: number;
      }
    | undefined
  >(undefined);
  const zoomMode = useRef<"auto" | "fit" | "manual">("auto");
  const [limits, setLimits] = useState(() => artworkZoom(entry, { width: 512, height: 512 }));
  const [zoom, setZoom] = useState(limits.initial);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const [dragging, setDragging] = useState(false);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const wrap = canvas?.querySelector(".lightbox-image-wrap");
    if (!canvas || !wrap) return;
    zoomMode.current = "auto";
    zoomAnchorRef.current = undefined;
    const measure = () => {
      const padding = getComputedStyle(wrap);
      const next = artworkZoom(
        { width: entry.width, height: entry.height },
        {
          width:
            canvas.clientWidth - parseFloat(padding.paddingLeft) - parseFloat(padding.paddingRight),
          height:
            canvas.clientHeight -
            parseFloat(padding.paddingTop) -
            parseFloat(padding.paddingBottom),
        },
      );
      setLimits(next);
      setZoom((current) =>
        zoomMode.current === "auto"
          ? next.initial
          : zoomMode.current === "fit"
            ? next.fit
            : clampArtworkZoom(current, next),
      );
      if (zoomMode.current !== "manual") canvas.scrollTo({ left: 0, top: 0 });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [entry.id, entry.width, entry.height]);

  const fitToView = useCallback(() => {
    zoomMode.current = "fit";
    zoomAnchorRef.current = undefined;
    setZoom(limits.fit);
    canvasRef.current?.scrollTo({ left: 0, top: 0 });
  }, [limits.fit]);

  const changeZoom = useCallback(
    (factor: number, clientX?: number, clientY?: number) => {
      const canvas = canvasRef.current;
      const image = canvas?.querySelector("[data-artwork]");
      if (!canvas || !image) return;
      zoomMode.current = "manual";
      const canvasRect = canvas.getBoundingClientRect();
      const imageRect = image.getBoundingClientRect();
      const x = clientX ?? canvasRect.left + canvas.clientWidth / 2;
      const y = clientY ?? canvasRect.top + canvas.clientHeight / 2;
      zoomAnchorRef.current = {
        clientX: x,
        clientY: y,
        imageX: (x - imageRect.left) / imageRect.width,
        imageY: (y - imageRect.top) / imageRect.height,
      };
      setZoom((current) => clampArtworkZoom(current * factor, limits));
    },
    [limits],
  );

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const anchor = zoomAnchorRef.current;
    const image = canvas?.querySelector("[data-artwork]");
    if (!canvas || !anchor || !image) return;
    const imageRect = image.getBoundingClientRect();
    canvas.scrollLeft += imageRect.left + imageRect.width * anchor.imageX - anchor.clientX;
    canvas.scrollTop += imageRect.top + imageRect.height * anchor.imageY - anchor.clientY;
    zoomAnchorRef.current = undefined;
  }, [zoom]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const root = rootRef.current;
    root?.focus();
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || document.querySelector("dialog[open]")) return;
      const controls = root?.querySelectorAll<HTMLElement>(
        "button:not(:disabled), a[href], input:not(:disabled)",
      );
      if (!controls?.length) return;
      const first = controls[0],
        last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === root)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    root?.addEventListener("keydown", trapFocus);
    return () => {
      root?.removeEventListener("keydown", trapFocus);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || document.querySelector("dialog[open]")) return;
      if (event.key === "Escape") onClose();
      if (
        event.target instanceof HTMLElement &&
        event.target.matches("input, textarea, button, select")
      )
        return;
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        changeZoom(BUTTON_ZOOM_FACTOR);
      }
      if (event.key === "-") {
        event.preventDefault();
        changeZoom(1 / BUTTON_ZOOM_FACTOR);
      }
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (event.key === "ArrowLeft" && !entry.animation) {
        event.preventDefault();
        canvas.scrollBy({ left: -80 });
      }
      if (event.key === "ArrowRight" && !entry.animation) {
        event.preventDefault();
        canvas.scrollBy({ left: 80 });
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        canvas.scrollBy({ top: -80 });
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        canvas.scrollBy({ top: 80 });
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [changeZoom, onClose, entry.animation]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const pixelDelta =
        event.deltaMode === WheelEvent.DOM_DELTA_PIXEL ? event.deltaY : event.deltaY * 16;
      const exponent = Math.max(
        -MAX_WHEEL_ZOOM_EXPONENT,
        Math.min(MAX_WHEEL_ZOOM_EXPONENT, -pixelDelta * WHEEL_ZOOM_SENSITIVITY),
      );
      changeZoom(Math.exp(exponent), event.clientX, event.clientY);
    };
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [changeZoom]);

  function startPan(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const canvas = event.currentTarget;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    canvas.setPointerCapture(event.pointerId);

    if (pointersRef.current.size > 1) {
      const [first, second] = [...pointersRef.current.values()];
      pinchDistanceRef.current = Math.hypot(second.x - first.x, second.y - first.y);
      dragRef.current.pointerId = -1;
      setDragging(false);
      return;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: canvas.scrollLeft,
      top: canvas.scrollTop,
    };
    setDragging(true);
  }

  function pan(event: PointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointersRef.current.size > 1) {
      const [first, second] = [...pointersRef.current.values()];
      const distance = Math.hypot(second.x - first.x, second.y - first.y);
      const previousDistance = pinchDistanceRef.current;
      pinchDistanceRef.current = distance;
      if (previousDistance && distance > 0) {
        changeZoom(distance / previousDistance, (first.x + second.x) / 2, (first.y + second.y) / 2);
      }
      return;
    }

    const start = dragRef.current;
    if (start.pointerId !== event.pointerId) return;
    event.currentTarget.scrollLeft = start.left - (event.clientX - start.x);
    event.currentTarget.scrollTop = start.top - (event.clientY - start.y);
  }

  function stopPan(event: PointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    pinchDistanceRef.current = undefined;
    const remaining = pointersRef.current.entries().next().value;
    if (remaining) {
      const [pointerId, point] = remaining;
      dragRef.current = {
        pointerId,
        x: point.x,
        y: point.y,
        left: event.currentTarget.scrollLeft,
        top: event.currentTarget.scrollTop,
      };
      setDragging(true);
      return;
    }

    dragRef.current.pointerId = -1;
    setDragging(false);
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
      ref={rootRef}
      tabIndex={-1}
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
          {toolbarActions}
          <button
            type="button"
            onClick={() => changeZoom(1 / BUTTON_ZOOM_FACTOR)}
            disabled={zoom <= limits.min}
            aria-label="Zoom out"
          >
            <Minus size={16} />
          </button>
          <span>{zoomLabel(zoom)}</span>
          <button
            type="button"
            onClick={() => changeZoom(BUTTON_ZOOM_FACTOR)}
            disabled={zoom >= limits.max}
            aria-label="Zoom in"
          >
            <Plus size={16} />
          </button>
          <button
            type="button"
            onClick={fitToView}
            aria-label="Fit artwork to view"
            title="Fit artwork to view"
          >
            <Maximize size={16} />
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
      <div
        ref={canvasRef}
        className="lightbox-canvas"
        onPointerDown={startPan}
        onPointerMove={pan}
        onPointerUp={stopPan}
        onPointerCancel={stopPan}
        data-dragging={dragging || undefined}
        data-drop-exclude="true"
      >
        <div className="lightbox-image-wrap">
          {entry.animation ? (
            <AnimationFrame
              url={entry.animation.url}
              previewUrl={entry.imageUrl}
              columns={entry.animation.columns}
              width={entry.width}
              height={entry.height}
              frame={playback.frame}
              alt={entry.title ?? entry.originalFilename}
              style={{ width: entry.width * zoom, height: entry.height * zoom }}
            />
          ) : (
            <ArtworkImage
              src={entry.imageUrl}
              alt={entry.title ?? entry.originalFilename}
              style={{ width: entry.width * zoom, height: entry.height * zoom }}
            />
          )}
        </div>
      </div>
      <div className="lightbox-footer">
        {(entry.animation || entry.sourceUrl) && (
          <div className="lightbox-playback">
            {entry.animation && (
              <AnimationControls playback={playback} durations={entry.animation.frameDurations} />
            )}
            {entry.sourceUrl && (
              <SourceDownload
                url={entry.sourceUrl}
                filename={entry.sourceFilename ?? "source.aseprite"}
              />
            )}
          </div>
        )}
        {details && <div className="lightbox-details">{details}</div>}
      </div>
    </div>
  );
}

function SourceDownload({ url, filename }: { url: string; filename: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  return (
    <a
      className="source-download"
      href={url}
      download={filename}
      aria-disabled={status === "loading"}
      title={`Private original · ${filename}`}
      aria-label={
        status === "error" ? "Retry Aseprite source download" : "Download Aseprite source"
      }
      onClick={async (event) => {
        event.preventDefault();
        if (status === "loading") return;
        setStatus("loading");
        try {
          await downloadImage(url, filename);
          setStatus("idle");
        } catch {
          setStatus("error");
        }
      }}
    >
      <FileDown size={15} />
      <span>
        {status === "loading"
          ? "downloading…"
          : status === "error"
            ? "failed · retry"
            : "aseprite source"}
      </span>
    </a>
  );
}
