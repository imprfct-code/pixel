import { useCallback, useEffect, useState } from "react";

export function useFramePlayback(durations?: number[], enabled = true) {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(() => !document.hidden);
  const count = durations?.length ?? 1;
  const [previousDurations, setPreviousDurations] = useState(durations);
  if (previousDurations !== durations) {
    setPreviousDurations(durations);
    setFrame(0);
    setPlaying(true);
  }
  const active = playing && enabled && visible && count > 1;
  useEffect(() => {
    if (!active || !durations) return;
    const timer = setTimeout(() => setFrame((current) => (current + 1) % count), durations[frame]);
    return () => clearTimeout(timer);
  }, [active, durations, count, frame]);
  useEffect(() => {
    const updateVisibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);
  function seek(next: number) {
    setPlaying(false);
    setFrame(((next % count) + count) % count);
  }
  const step = useCallback(
    (direction: number) => {
      setPlaying(false);
      setFrame((current) => (current + direction + count) % count);
    },
    [count],
  );
  const toggle = useCallback(() => setPlaying((current) => !current), []);
  return {
    frame: Math.min(frame, count - 1),
    playing: active,
    seek,
    step,
    toggle,
  };
}
