# UI overhaul verification - 2026-10-27

Branch `feat/ui-overhaul`; reviewed scientific/map baseline `5d9bdb4`. No push or hosted mutation. The owner explicitly rejects iACADEMY as a reference. DengueWatch has an original water-drop/wave mark and care illustrations, self-hosted Fraunces/Figtree, a bay/sand/coral palette, and day/night/automatic appearance. Existing basemap licences are retained, including the Protomaps sprite MIT notice.

## Source and behavior

The 17-city Replay/Live calculation, generated inputs, ML code, schema, security/submission APIs and three-level local/online/plain-map fallback are preserved. The Dashboard preview uses local boundaries without a map engine or tiles. Example dates derive from complete saved rows: maximum/minimum actual metro count, largest adjacent-calendar increase, and maximum four-level entropy; earliest ties win. The all-week/17-row probability and 119-missing-row assertions remain.

Report fields preserve coarse ranges, validated catalogues, explicit unticked consent, server proof/rate limits, moderation, delay, suppression, retention and withdrawal. A confirmed-closed read-only preview and unknown-status Retry are exclusive. No report or withdrawal code enters browser storage. Only language and appearance preferences persist. No contact address was approved.

The first Dashboard paint is a build-time public shell, with no forecast/live/report values. The city form still works before hydration. Other routes do not preload the photograph. Map engines/tiles remain lazy. The public service-worker catalogue includes the local preview and locator; private APIs remain outside the cache. Hash handoffs wait for destination data, retain heading focus and clear the fixed header. Keyboard skip-to-content remains native.

## Checks

Final command results and timings are in [ui-command-manifest.json](ui-command-manifest.json). Sanitized logs are included in the review ZIP. Failure diagnostics are retained separately; they are not passing evidence. The completed commands passed unless explicitly owner-blocked below.

| Gate | Actual result | Status |
|---|---|---|
| Build, JS budget, lint, typecheck, rendered contrast | All passed | DONE |
| Unit/integration | 86 passed | DONE |
| Fresh embedded PostgreSQL | 25 SQL checks and one real SQL/MFA browser flow passed | DONE locally |
| Browser stability | Three consecutive runs, 51 passed each | DONE |
| Final focused UI follow-up | 7 passed, including expanded night-theme evidence/inventory and report labels | DONE |
| Final production / offline PWA | 18 / 4 passed | DONE |
| Visual references / independent comparison | 64 / 64 passed; unchanged 0.005 pixel threshold | DONE |
| Local browser compatibility | Chrome, Edge, Firefox, WebKit: 16 cases each, zero page errors | DONE locally |
| Dependency audit | 0 vulnerabilities | DONE |
| Local passive ZAP | 0 high/medium, 1 low/informational | DONE within scope |
| Full secret audit | 0 current, 44 known historical, 0 unexpected; exit 1 | NEEDS OWNER: rotation |
| ML leakage / reproducibility / geography / shipped fonts | 4 tests / 12 byte-identical outputs / 3 tests / 5 faces | DONE |

The three 51-test runs used frozen functional source. The final follow-up changed only icon/theme metadata, the footer mark's wave contrast and screenshot font-readiness checks. Build, budgets, lint/types, the 7-test focused accessibility/behavior suite, production, PWA, all visual captures/comparisons, compatibility and security audits were then rerun. No functional logic changed after the three stability runs. The archive records the final source commit in BUNDLE_SOURCE.json.

Measured isolated mobile Lighthouse: performance 97, accessibility 100, LCP 2.446 s, CLS 0, TBT 22 ms. See [report](lighthouse-mobile.report.html) and [JSON](lighthouse-mobile.report.json), including its runtime, fetch time and simulated mobile environment. These are lab results, not a field INP claim. The final accessibility correction affects hidden table headings/field labels and adds accurate preference disclosure; it does not alter the measured hero layout.

JS budgets include the public preload helper, lazy research/staff chunks and map worker: initial 103,468 bytes gzip; all JS 699,729 bytes gzip. Limits are 220 KiB initial and 850 KiB total, enforced in CI by `npm run test:ui-budget`; [actual asset manifest](ui-budget.json). Five shipped WOFF2 faces contain both n-tilde glyphs; [font proof](ui-fonts.json). Optional font-decoder tooling was isolated in ignored scratch, without adding app dependencies.

ML reproduction imported the unchanged pipeline with output paths redirected to scratch and its original data loader: 12 of 12 checked outputs byte-identical, [hash proof](ui-reproducibility.json). Four leakage tests passed. Three geographic-context tests passed. No generated model/data output was overwritten.

Visual baselines cover four pages, 360/768/1280/1920 px, day/night and reduced/normal motion: 64 PNGs committed under `tests/visual/baselines/`. The review gallery under `ui-overhaul/` contains 16 copies at 360/1280 px in both themes, using reduced motion. The suite waits for page content, fonts, decoded images and a stable map pulse; the comparison threshold remains 0.005. Historical before captures are linked in [UX decisions](../UX_DECISIONS.md), explicitly labeled as older published-redesign evidence.

A separate [reflow check](ui-reflow.json) passed all eight page/theme cases at a desktop 200% zoom-equivalent 640 x 500 CSS-pixel viewport with DPR 2 (1280 x 1000 physical pixels). This is emulation, not an actual-device zoom session.

Local Chrome, Edge, Firefox and WebKit checks cover 16 cases each: four pages, two widths and both themes; engine versions and errors are in [browser results](ui-browsers.json). WebKit is not real iOS Safari. Ordinary UI tests block service workers; the dedicated PWA suite verifies actual caching/offline behavior. Local Node is 20.19.4 despite the declared >=22.12 requirement; CI uses 22, and Lighthouse used 22.23.4. Do not infer a fresh Node 22 full-suite run from these local results.

## Findings corrected and review limits

Verification exposed anchor/skip-link interaction, a restored basemap attribution, stale optimized-photo receipts, and legacy dark text in expanded night-mode evidence/inventory tables and report labels. These were corrected with focused regression assertions. Earlier reference captures exposed inconsistent font rendering, and a tall About capture timed out while settling. Captures now verify the actual custom Fraunces/Figtree faces through Chromium's rendered-font API, decode images and wait for layout; tall-page capture has 15 seconds to settle. All 64 independent comparisons passed. Thresholds, source-number assertions and privacy/security checks were not relaxed.

NEEDS OWNER: reference screenshot if still desired; approved controller/contact; photo permission; team details; machine-assisted Filipino review by a native speaker; historical credential rotation; hosted configuration/Auth/MFA/purge/schedule/log verification; bilingual, screen-reader and actual-device usability; institutional DPO review. No iACADEMY style approval is needed or assumed. Public Gmail remains unpublished and reporting remains closed.

NOT VERIFIED: real iOS Safari and field INP <200 ms. Local axe/pixel/keyboard checks are scoped automated evidence, not universal WCAG certification or medical/legal approval. Local passive ZAP does not establish authenticated or active security coverage.

Review and test locally before merging near the defense. Main pushes deploy Vercel. The user pushes: `git push -u origin feat/ui-overhaul`.
