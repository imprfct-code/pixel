# Aseprite import experiment

Branch: `imprfct/aseprite-import`.

Upload `.ase` or `.aseprite` through the same chooser or drop target as PNG/GIF. The browser decodes the file in a cancellable worker, generates a PNG cover and, for animated work, a PNG frame atlas. No Aseprite executable or new service is needed in production.

The original file is preserved unchanged in private R2 storage. Only the owner receives its download URL. Public viewers receive the cover and frame atlas. Original layers, tags, palettes and other project data remain in the downloadable source.

Playback starts automatically, follows per-frame durations, suspends when the document is hidden, and offers previous/next buttons and a frame slider. In the viewer, Space toggles playback and left/right arrows step frames; buttons and the slider also work with the keyboard. Gallery previews animate while visible on screen. PNG/GIF/JPEG/WebP/AVIF retain their existing upload behavior; GIF uses native image playback without the Aseprite frame controls.

## Supported subset and limits

- RGB, grayscale and indexed color; normal layers and groups; visibility and opacity; raw/compressed/linked cels; palettes; cel position and z-order.
- 10 MB per uploaded asset, 4096×4096 canvas, 256 frames, 16 million canvas pixels across frames, 128 MB decoded cel data, 128 layers, 8192×8192 atlas bounds.
- Tilemaps, non-Normal blend modes, reference layers, precise cel scaling, nonsquare pixels and custom color profiles produce an explicit export-to-PNG/GIF error.
- Tags are retained in the original file; this first version plays the whole timeline forward. There is no layer editor or tag selector.
- The first frame is the cover, including when that frame is empty.

## Verification

`vp check`, `vp test --run`, `vpr build`.

Fixtures from Aseprite's official test suite and generated opacity/grayscale cases are compared against native Aseprite RGBA exports. Backend tests cover source privacy, bounds checking, all-assets-required finalization and deletion of the associated objects.

Browser verification uses the local frontend and the development Convex deployment, with private test works. Production remains on main.

Verified in the embedded browser at desktop and 390 px widths: static and animated Aseprite imports, play/pause and frame stepping, persistence after reload, rejection of tilemaps, and ordinary PNG/GIF uploads. Four private demonstration works remain in the development account. The source download was confirmed in Chromium; the downloaded 1,648-byte `.aseprite` has the same SHA-256 hash as the original fixture.
