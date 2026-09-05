import { useCallback, useEffect, useState } from "react";

export function useFramePlayback(durations?: number[]) {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const count = durations?.length ?? 1;
  const [previousDurations, setPreviousDurations] = useState(durations);
  if (previousDurations !== durations) {
    setPreviousDurations(durations);
    setFrame(0);
    setPlaying(false);
  }
  useEffect(() => {
    if (!playing || !durations || count < 2) return;
    const timer = setTimeout(() => setFrame((current) => (current + 1) % count), durations[frame]);
    return () => clearTimeout(timer);
  }, [playing, durations, count, frame]);
  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => document.removeEventListener("visibilitychange", pauseWhenHidden);
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
    playing,
    seek,
    step,
    toggle,
  };
}
