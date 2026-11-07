# Build the self-hosted Metro Manila basemap

The repository already includes a real 6,712,783-byte Protomaps extract, not a placeholder. See data/external/ml-basemap.provenance.json for its SHA, actual source build and bounded region. No owner download is needed for this checked-in extract.

Install the official pmtiles CLI from https://github.com/protomaps/go-pmtiles/releases, then run `python scripts/build-basemap.py`. Set PMTILES_BIN to the binary path if it is not on PATH. The script resolves the current official build, derives bounds from the 17 checked polygons, performs the extract, checks the 50 MB cap, copies local glyphs/sprites and writes provenance/config. It preserves the old extract when the size gate fails. It makes no hosted writes.

The verified command used for the bundled extract was:

```powershell
pmtiles extract https://build.protomaps.com/20261025.pmtiles public/basemap/metro-manila.pmtiles --bbox=120.901395,14.34673,121.140036,14.790292 --maxzoom=13 --download-threads=2
```

Daily build URLs expire. Prefer the resolver script when rebuilding later. The bbox is measured from the source boundaries plus 0.005 degrees padding. Max zoom 13 covers streets without a large Git artifact. If a later extract exceeds 50 MB, retry the script with `--maxzoom 12`. Do not commit artifacts above 50 MB; use reviewed public range-capable storage or Git LFS if higher detail becomes necessary.

The download used the official v1.31.2 Windows CLI; its ZIP SHA-256 was checked against the GitHub release API digest: a658baa4d7e55020aef6ca17bd9ff9faa1582671266b36f58c52db0ac8e785a1. The full 139 GB source planet was not downloaded or hash-verified; the extracted file has its own receipt SHA.

Offline styles use @protomaps/basemaps, local Noto Sans Regular Latin glyphs and local sprites. Basemap symbol layers are omitted to avoid unsupported remote language glyphs and visual clutter; the 17 city labels use the local font. Roads, water, parks and buildings remain. Source notices are in docs/evidence/noto-map-glyphs-OFL.txt and map-sprites-MIT.txt, and the complete software notices.

Warm-up: open Risk Map online once and allow the service worker to cache its map assets. Other pages do not prefetch the map engine or tiles. Offline PMTiles byte ranges are synthesized as valid HTTP 206 responses from the complete cached file. Stale reviewed counts still cannot enable Live. A clean offline browser with no prior app visit cannot install a PWA.
