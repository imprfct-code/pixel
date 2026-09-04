import type { CSSProperties } from "react";

export function ArtworkImage({
  src,
  alt,
  className,
  style,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
}) {
  return <img src={src} alt={alt} className={className} style={style} />;
}
