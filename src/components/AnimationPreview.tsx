import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { useFramePlayback } from "../hooks/useFramePlayback";
import { ArtworkImage } from "./ArtworkImage";
import "../styles/animation.css";

export function AnimationFrame({
  url,
  previewUrl,
  columns,
  width,
  height,
  frame,
  alt,
  style,
}: {
  url: string;
  previewUrl: string;
  columns: number;
  width: number;
  height: number;
  frame: number;
  alt: string;
  style?: CSSProperties;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState<{
    url: string;
    image?: HTMLImageElement;
    error?: boolean;
  }>();
  const image = loaded?.url === url ? loaded.image : undefined;
  useEffect(() => {
    const sheet = new Image();
    sheet.onload = () => setLoaded({ url, image: sheet });
    sheet.onerror = () => setLoaded({ url, error: true });
    sheet.src = url;
    return () => {
      sheet.onload = null;
      sheet.onerror = null;
    };
  }, [url]);
  useLayoutEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !image) return;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(
      image,
      (frame % columns) * width,
      Math.floor(frame / columns) * height,
      width,
      height,
      0,
      0,
      width,
      height,
    );
  }, [image, frame, columns, width, height]);
  if (!image)
    return (
      <div className="animation-fallback">
        <ArtworkImage src={previewUrl} alt={alt} style={style} />
        <small role="status">
          {loaded?.url === url && loaded.error
            ? "Animation could not load. Reopen to retry."
            : "Loading frames…"}
        </small>
      </div>
    );
  return (
    <canvas
      ref={canvasRef}
      data-artwork
      width={width}
      height={height}
      style={style}
      role="img"
      aria-label={`${alt}, frame ${frame + 1}`}
    />
  );
}

export function AnimationControls({
  playback,
  durations,
}: {
  playback: ReturnType<typeof useFramePlayback>;
  durations: number[];
}) {
  const controlsRef = useRef<HTMLDivElement>(null);
  const { step, toggle } = playback;
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.isComposing ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return;
      if (!["ArrowLeft", "ArrowRight", " "].includes(event.key)) return;
      const controls = controlsRef.current;
      const target = event.target;
      if (!controls || !(target instanceof HTMLElement)) return;
      const dialog = document.querySelector("dialog[open]");
      if (dialog && !dialog.contains(controls)) return;
      const scope = controls.closest('dialog, [role="dialog"]');
      if (scope && target !== document.body && !scope.contains(target)) return;
      const inControls = controls.contains(target);
      if (
        !inControls &&
        target.closest(
          'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]',
        )
      )
        return;
      if (event.key === " " && !inControls && target.closest('button, a, [role="button"]')) return;
      event.preventDefault();
      if (event.key === " ") {
        if (!event.repeat) toggle();
      } else step(event.key === "ArrowRight" ? 1 : -1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [step, toggle]);
  return (
    <div ref={controlsRef} className="animation-controls" aria-label="Animation controls">
      <button
        type="button"
        onClick={() => step(-1)}
        aria-label="Previous frame"
        title="Previous frame (←)"
        aria-keyshortcuts="ArrowLeft"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        type="button"
        onClick={playback.toggle}
        aria-label={playback.playing ? "Pause animation" : "Play animation"}
        title={playback.playing ? "Pause animation (Space)" : "Play animation (Space)"}
        aria-keyshortcuts="Space"
        data-playing={playback.playing}
      >
        {playback.playing ? <Pause size={16} /> : <Play size={16} />}
      </button>
      <button
        type="button"
        onClick={() => step(1)}
        aria-label="Next frame"
        title="Next frame (→)"
        aria-keyshortcuts="ArrowRight"
      >
        <ChevronRight size={16} />
      </button>
      <input
        type="range"
        aria-label="Animation frame"
        aria-valuetext={`Frame ${playback.frame + 1} of ${durations.length}`}
        min={1}
        max={durations.length}
        value={playback.frame + 1}
        onChange={(event) => playback.seek(Number(event.target.value) - 1)}
      />
      <span>
        {playback.frame + 1} / {durations.length}
      </span>
      <small>{durations[playback.frame]} ms</small>
    </div>
  );
}
