# Metro Manila map design

## Engine and source choice

MapLibre GL JS 6.16.0 (BSD-3-Clause), PMTiles 4.5.0 and @protomaps/basemaps 5.7.2 are pinned. There are no Google services, API keys or billing cards. The MapProvider interface receives the same 17-city geometry, predictions, selected city, mode and accessibility controls for each basemap path. WebGL failure also has an SVG polygon fallback.

Online: OpenFreeMap Positron, selected for its muted light land/water styling under colored city fills. Positron and Liberty style endpoints were fetched successfully; the provider receipts record their hashes/hosts. All glyphs, sprites, raster and vector tile URLs resolve to tiles.openfreemap.org. No separate assets host was present in the inspected styles/TileJSON. The attribution control remains visible: OpenFreeMap, OpenMapTiles, data from OpenStreetMap contributors. Public service availability is as-is; there is no uptime claim.

Fallback: after an error or a three-second timeout, load the real local Metro Manila PMTiles extract. It contains only the bounded region through zoom 13 and is 6.7 MB. The local style uses Protomaps layers and self-hosted glyph/sprite files. If it fails, the same city polygons and labels appear on a neutral background with “Base map unavailable.” Offline labels remain city-level. No report data is sent to either map provider.

## City rendering and interaction

Source: public/geo/ncr-cities.geojson, simplified from the existing NAMRIA/PSA/OCHA NCR boundaries with topology preserved. All 17 explicit DOH name matches are recorded in data/geo/ncr-ml-crosswalk.json. No fuzzy matches, grids, smoothing or barangay probabilities. Name agreement does not certify catchment equivalence.

Calibrated probability drives a continuous traffic-color expression, with narrow transitions at validation-derived band boundaries. City outlines include a dark contrast edge plus the requested white line; Manila is thicker. Unknown probability is grey. Fill opacity rises from 0.35 to 0.75 with probability (0.82 in high contrast). High cities pulse; selected/hovered cities use feature-state outlines. Changes between weeks ease for 600 ms. City selection flies the view; camera centers stay within NCR. Max-bounds include viewport-aspect padding so a wide canvas can fit all 17 areas; uncolored basemap context does not imply modeled coverage. Tilt is disabled on mobile and reduced motion. The data table and city-picker buttons mirror the map for keyboard/screen-reader access; arrows cycle cities and Enter selects. High contrast adds hatching. Actual rendered-pixel/color and behavior checks are recorded separately; design intent is not a test pass.

Replay includes every calendar week in the evaluation range. Unscorable lag/target windows produce explicit No data, with source outcomes retained when available. Live is computed locally using the frozen JSON scorer only after an admin-published 17-city batch passes completeness and <=21-day freshness checks. New uploads never silently retrain models.

## CSP, privacy and loading

The Risk Map document alone permits tile connections to tiles.openfreemap.org and inline style attributes required by MapLibre positioning. Other documents retain style-src-attr none and no tile host permission. Primary navigation uses full document loads, so moving to/from Risk Map receives the right policy. The local worker is bundled and served from self; blob worker exceptions are unnecessary. Preview middleware mirrors Vercel route headers.

MapLibre code/CSS/worker and PMTiles/glyph/sprite/boundary requests are lazy and only warmed by a Risk Map client. Dashboard uses a small neutral SVG thumbnail with no encoded risk values. Community Report imports no map engine and sends no map requests. Map requests use same-origin credentials mode, which omits cross-origin cookies. The privacy drawer discloses provider IP/browser-header/viewed-area visibility. No claim is made that third-party maps are anonymous.

PWA core assets and map-only assets are separately enumerated in docs/evidence/ml-pwa-assets.json. A Risk Map page may request map caching; leaving cancels the warm-up. Full cached PMTiles files answer Range requests with 206 and Content-Range. Offline navigation reconstructs the document with the route-specific CSP; the Dashboard policy must not be inherited by Risk Map or relaxed on Report. Staff/report mutations and hosted Live inputs are not cached. Basemap source data are public geography, never participant records.

## Sources

- https://openfreemap.org/quick_start/
- https://maplibre.org/maplibre-gl-js/docs/
- https://docs.protomaps.com/basemaps/maplibre
- https://docs.protomaps.com/basemaps/downloads
- https://docs.protomaps.com/pmtiles/cli
- scripts/build-basemap.md and data/external/ml-basemap.provenance.json

Glyph paths are canonical URL paths in the cache manifest, including encoded spaces. Offline checks wait for all optional map assets, require visible city labels and verify an actual PMTiles 206 response.
