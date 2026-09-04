import type { CSSProperties } from "react";

export function ArtworkImage({
  src,
  alt,
  className,
  style,
  loading,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  loading?: "lazy" | "eager";
}) {
  return (
    <img
      data-artwork
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      decoding="async"
    />
  );
}
