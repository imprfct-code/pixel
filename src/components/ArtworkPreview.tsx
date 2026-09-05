import { useEffect, useRef, useState } from "react";
import type { Entry } from "../../shared/pixel";
import { useFramePlayback } from "../hooks/useFramePlayback";
import { AnimationFrame } from "./AnimationPreview";
import { ArtworkImage } from "./ArtworkImage";

export function ArtworkPreview({ entry }: { entry: Entry }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const playback = useFramePlayback(entry.animation?.frameDurations, visible);
  useEffect(() => {
    const element = ref.current;
    if (!element || !entry.animation) return;
    const observer = new IntersectionObserver(([item]) => setVisible(item.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, [entry.animation]);

  return (
    <div className="artwork-preview" ref={ref}>
      {entry.animation && visible ? (
        <AnimationFrame
          url={entry.animation.url}
          previewUrl={entry.imageUrl}
          columns={entry.animation.columns}
          width={entry.width}
          height={entry.height}
          frame={playback.frame}
          alt={entry.title ?? entry.originalFilename}
        />
      ) : (
        <ArtworkImage
          src={entry.imageUrl}
          alt={entry.title ?? entry.originalFilename}
          loading="lazy"
        />
      )}
    </div>
  );
}
