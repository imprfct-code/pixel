import { Download, Minus, Plus, X } from "lucide-react";
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
import { ArtworkImage } from "./ArtworkImage";

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 16;
const BUTTON_ZOOM_FACTOR = 1.25;
const WHEEL_ZOOM_SENSITIVITY = 0.02;
const MAX_WHEEL_ZOOM_EXPONENT = 0.25;
const IMAGE_PADDING = 96;

function clampZoom(zoom: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

function zoomLabel(zoom: number) {
  return `${Number(zoom.toFixed(2))}×`;
}

function preferredZoom(entry: Entry) {
  return entry.width <= 64 ? 8 : entry.width <= 256 ? 4 : entry.width <= 512 ? 2 : 1;
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
  const [zoom, setZoom] = useState(() => preferredZoom(entry));
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const [dragging, setDragging] = useState(false);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const fitZoom = Math.min(
      Math.max(1, canvas.clientWidth - IMAGE_PADDING) / entry.width,
      Math.max(1, canvas.clientHeight - IMAGE_PADDING) / entry.height,
    );
    setZoom(clampZoom(Math.min(preferredZoom(entry), fitZoom)));
    canvas.scrollTo({ left: 0, top: 0 });
  }, [entry]);

  const changeZoom = useCallback((factor: number, clientX?: number, clientY?: number) => {
    const canvas = canvasRef.current;
    const image = canvas?.querySelector("img");
    if (!canvas || !image) return;
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
    setZoom((current) => clampZoom(current * factor));
  }, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const anchor = zoomAnchorRef.current;
    const image = canvas?.querySelector("img");
    if (!canvas || !anchor || !image) return;
    const imageRect = image.getBoundingClientRect();
    canvas.scrollLeft += imageRect.left + imageRect.width * anchor.imageX - anchor.clientX;
    canvas.scrollTop += imageRect.top + imageRect.height * anchor.imageY - anchor.clientY;
    zoomAnchorRef.current = undefined;
  }, [zoom]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
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
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        canvas.scrollBy({ left: -80 });
      }
      if (event.key === "ArrowRight") {
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
  }, [changeZoom, onClose]);

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
            disabled={zoom <= MIN_ZOOM}
            aria-label="Zoom out"
          >
            <Minus size={16} />
          </button>
          <span>{zoomLabel(zoom)}</span>
          <button
            type="button"
            onClick={() => changeZoom(BUTTON_ZOOM_FACTOR)}
            disabled={zoom >= MAX_ZOOM}
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
          <ArtworkImage
            src={entry.imageUrl}
            alt={entry.title ?? entry.originalFilename}
            style={{ width: entry.width * zoom, height: entry.height * zoom }}
          />
        </div>
      </div>
      {details && <div className="lightbox-details">{details}</div>}
    </div>
  );
}
