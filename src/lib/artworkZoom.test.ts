import { describe, expect, it } from "vite-plus/test";
import { artworkZoom, clampArtworkZoom } from "./artworkZoom";

describe("artwork zoom", () => {
  it("opens a 4×4 sprite at a useful size and lets it grow beyond 16×", () => {
    const zoom = artworkZoom({ width: 4, height: 4 }, { width: 1000, height: 700 });
    expect(zoom.initial * 4).toBe(512);
    expect(zoom.fit).toBe(175);
    expect(zoom.max * 4).toBe(4096);
    expect(clampArtworkZoom(256, zoom)).toBe(256);
  });

  it("fits tiny artwork to narrow screens with whole source pixels", () => {
    const zoom = artworkZoom({ width: 4, height: 4 }, { width: 343, height: 550 });
    expect(zoom.initial).toBe(85);
    expect(zoom.fit * 4).toBeLessThanOrEqual(343);
  });

  it("uses both source dimensions for tall or wide work", () => {
    for (const image of [
      { width: 4, height: 1024 },
      { width: 1024, height: 4 },
    ]) {
      const zoom = artworkZoom(image, { width: 300, height: 200 });
      expect(image.width * zoom.initial).toBeLessThanOrEqual(300);
      expect(image.height * zoom.initial).toBeLessThanOrEqual(200);
      expect(zoom.initial).toBeLessThan(1);
      expect(zoom.max).toBe(16);
    }
  });

  it("allows large sources to fit even below the usual minimum zoom", () => {
    const zoom = artworkZoom({ width: 4096, height: 4096 }, { width: 150, height: 100 });
    expect(zoom.fit).toBeLessThan(0.05);
    expect(clampArtworkZoom(zoom.fit, zoom)).toBe(zoom.fit);
    expect(clampArtworkZoom(100, zoom)).toBe(16);
  });
});
