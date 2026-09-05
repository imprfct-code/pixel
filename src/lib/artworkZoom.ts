type Size = { width: number; height: number };

export function clampArtworkZoom(zoom: number, limits: { min: number; max: number }) {
  return Math.min(limits.max, Math.max(limits.min, zoom));
}

export function artworkZoom(image: Size, available: Size) {
  const longestSide = Math.max(image.width, image.height);
  const max = Math.max(16, 4096 / longestSide);
  const rawFit = Math.min(
    Math.max(1, available.width) / image.width,
    Math.max(1, available.height) / image.height,
    max,
  );
  // Whole-number enlargement gives each source pixel the same screen area.
  const fit = rawFit >= 1 ? Math.floor(rawFit) : rawFit;
  const preferred = Math.min(fit, Math.max(1, 512 / longestSide));
  return {
    min: Math.min(0.05, fit),
    max,
    fit,
    initial: preferred >= 1 ? Math.floor(preferred) : preferred,
  };
}
