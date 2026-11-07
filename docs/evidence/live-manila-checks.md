# Live Manila verification — 2026-10-28

Current task: `feat/live-manila`, created from remote main `a683b3b` and merged with the completed UI prerequisite at local merge `11daef80725e0d024daf48b18d519ca1dc0b0995`. No push, deployment, hosted write or report activation is included.

## Implementation status

| Item | Status | Evidence |
| --- | --- | --- |
| Independent ingestion and metadata | DONE | `scripts/ingest_live_manila.ts`; generated `data/processed/manila_live_weekly.json`; public aggregate JSON; 13 rows, 6 estimated totals, 9 estimated weekly differences, 4 weekly values not flagged estimated |
| Source provenance verification | NEEDS OWNER | All 13 post links and screenshots absent; original first-week prior total absent; three missing estimate notes explicitly annotated without inventing source evidence |
| Empirical ranges and historical evaluation | DONE | Generated sensitivity at thresholds 80/100/150 and leave-one-year-out folds; primary coverage 29/40 and 32/42, below a calibrated 80% claim |
| Dashboard and Manila-only map | DONE | Separate Replay/Live UI; dated count/ranges; estimated hatches; one live ring; other 16 areas neutral with no recent data; no live ML probabilities |
| Admin append, CSV, audit and rollback | DONE locally / NOT VERIFIED hosted | New forward migration and existing admin upload area; AAL2 and append-only SQL; public export excludes owner evidence paths |
| Stale/future fallback | DONE | 14-day Manila-date gate, minute recheck, stale return to Replay; future inputs cannot activate Live |
| Historical/ML non-interference | DONE | 121 protected pre-existing files remain byte-identical; executable fingerprint/leakage test |
| Method/source documentation and bilingual text | DONE / NEEDS OWNER language review | `docs/LIVE_MANILA.md`, `DATA.md`, `DEFENSE_QA.md`, bilingual About credit; machine-assisted Filipino flagged for review |

## Completed local checks

Actual commands and exit codes are in [live-manila-command-manifest.json](live-manila-command-manifest.json), with sanitized logs in `review_bundle.zip`. Earlier failed/superseded attempts remain identified; the latest result per gate is the current result. No test was skipped or tolerance relaxed.

| Gate | Actual outcome |
| --- | --- |
| Full unit/integration | **98 passed**, zero failed/skipped; includes mathematical fixtures, LOYO coverage, CSV rules, byte identity and two new real-SQL security/publication/rollback cases |
| Full browser regression | **60 passed** on the final application; includes shared controls, exclusive modes, staleness, live 360/1280 accessibility, 13 bars/9 hatches/4 non-estimated values and real SQL admin flow |
| Production CSP/browser | **18 passed** |
| PWA/offline | **5 passed**; public charts/preferences/model demo work offline, no admin/hosted live inputs cached |
| Visual capture and independent comparison | **80 passed each**: five pages, four widths, two themes and two motion settings; pixel ratio remains 0.005 |
| Compatibility | **28 cases each** in Chrome 156.0.8078.48, Edge 156.0.4314.42, Firefox 155.0 and WebKit 26.6; 20 existing public-page cases plus 8 Live cases per engine, no page errors |
| Portable source guard | Pass against a separate copy with Linux-style tracked text and no Git on PATH; raw source EOL mutations are rejected. All 121 original local worktree SHA-256 values still match before the task. |
| Types/lint/build | Pass, including final full lint/typecheck after tool additions |
| Data/credits/contrast | Pass; existing shipped-data/credits/token/rendered-image contrast gates retained; new `live:check` verifies generated JSON, frozen SQL seed and all 121 protected fingerprints |
| JS budget | Initial **109,387 bytes gzip** / total **711,385 bytes gzip**; unchanged limits 225,280 / 870,400 |
| Mobile Lighthouse 13.5.0 | Performance **96**, accessibility **100**, best practices **96**, SEO **100**; LCP **2412.08 ms**, CLS **0**, TBT **7.5 ms** |
| Dependency audit | **0 vulnerabilities**, full `npm audit --json` |
| Local passive ZAP | **0 high/medium**, 1 low/informational alert; ZAP 2.17.0 with Java 17, production preview, no active/authenticated scan |
| Full-history secret audit | **NEEDS OWNER / exit 1**: guard configured, 0 current, 44 known historical, 0 unexpected historical; rotation is pending, not an all-green release claim |

Core/browser/tooling checks use supported **Node 22.23.2**. Lighthouse's package-isolated runtime was **Node 22.23.4**. Early focused attempts used the machine default Node 20.19.4; they are not substituted for the final supported-runtime checks. Installed Chrome was used because bundled Chromium's headless executable was absent. Browser runs use one worker to limit load. WebKit is not a real iOS Safari/device check. TBT is not field INP; field INP and prospective 2026 coverage were not measured.

Reproduction commands (executed with real outputs):

```powershell
npm exec --yes --package=node@22 -- node scripts/check-live-manila.mjs core
npm exec --yes --package=node@22 -- node scripts/check-live-manila.mjs focused
npm exec --yes --package=node@22 -- node scripts/check-live-manila.mjs browser
npm exec --yes --package=node@22 -- node scripts/check-live-manila.mjs production
npm exec --yes --package=node@22 -- node scripts/check-live-manila.mjs visual_update
npm exec --yes --package=node@22 -- node scripts/check-live-manila.mjs visual
npm exec --yes --package=node@22 -- node scripts/check-live-manila.mjs compat
npm exec --yes --package=node@22 -- node scripts/check-live-manila-release.mjs
npm exec --yes --package=node@22 -- node scripts/check-live-manila.mjs tools
npm exec --yes --package=node@22 -- node scripts/check-live-manila.mjs security
```

`security` deliberately exits 1 for the known owner rotation gate. `visual_update` is a baseline authoring command, not independent comparison. Only the 48 changed Dashboard/Map/About references were first backed up and regenerated to avoid retaining older images whose small changes could fall under the pixel tolerance; the separate `visual` run then passed all 80. Existing Report/Model references were retained and passed. Visual dates are frozen to 2026-10-28; independent clock tests verify expiry, future rejection and automatic stale fallback.

Screenshots: [mobile Live card](live-manila-ui/card-360-day.png), [mobile night card](live-manila-ui/card-360-night.png), [desktop Live card](live-manila-ui/card-1280-day.png), [desktop night card](live-manila-ui/card-1280-night.png), [mobile Live map](live-manila-ui/map-360.png), [desktop Live map](live-manila-ui/map-1280.png). The 20-image public review gallery is refreshed from actual reduced-motion baselines under `ui-overhaul/`; all 80 actual PNG references remain committed under `tests/visual/baselines/` and their hashes are packaged.

The latest supplied week is 226 cases, below the historical maximum 257; the supplied peak 267 is higher only conditionally on verification. Script-generated primary ranges are **162-274** / **150-305**, with 40 / 42 historical pairs. Held-out coverage is **72.50% / 76.19%**, so the UI does not claim calibrated 80% intervals or ML skill. The initial seed becomes stale on **2026-11-09** unless a newer week is published.

## Diagnostics retained honestly

- Initial browser launch could not find Playwright Chromium; subsequent runs use installed Chrome.
- Two early focused runs caught unchanged mode copy and Windows encoding in task-added map labels. Exact byte replacements and corrected copy passed the focused suite.
- Automatic review rejected a broad encoding rewrite because it could touch unrelated work; read-only inspection isolated two files, and approved repairs changed only four confirmed malformed labels.
- One early full browser run exposed unnecessary offline hosted requests and a Replay label reload that contaminated pixel samples. Offline requests now stop, the local fixture models an empty published feed, and Live has a separate label layer. The unchanged console/offline/pixel assertions pass on the final full run. Shared Dashboard mode and server-generated publication JSON were then verified in the final 60-case run.
- Final review caught that literal Windows checkout hashes would fail on Linux for Git-normalized text. The guard now checks SHA-256 of canonical tracked bytes using the existing Git policy, without rewriting science files or normalizing raw sources. New portability/raw-byte regression and full 98-test suite pass. Application source is unchanged by this build-only correction. The rebuild embeds the newer Git commit metadata, so asset hashes change; the PWA gate is rerun for that cache revision.
- Initial Node-22 check runner pointed at a nonexistent TypeScript entry point. It now follows the project's actual `tsc` shim target (`@typescript/native`); typecheck passes.
- Early runner attempts reused a log filename. Their exit codes remain recorded and the overwritten attempt logs are explicitly marked unavailable; they are not represented by later passing log content. Subsequent logs have unique names.

The new schema and public JSON are separate from the unchanged scientific pipeline. The source artifact is unofficial. Publication JSON is generated from frozen build-time quantiles; the UI never refits them. Rollback of the current publication restores the previous generated projection. Source screenshots remain excluded locally under `.git/info/exclude`, and private evidence paths never appear in public output.

## Owner and external gates

NEEDS OWNER: source links/screenshots for every week; verification of definitions, scale and revisions with the Manila Health Department or Information Office; permission to republish; first prior cumulative total and missing interpolation explanations; weekly update responsibility; adviser review of conditional peak wording; native Filipino review; existing credential rotation and collection/contact/photo/DPO gates.

NOT VERIFIED: hosted migration, Auth/MFA/publication/rollback, prospective 2026 coverage, real iOS/device, screen-reader and human usability. Reporting remains closed. The reference ranges are provisional extrapolations, not ML skill or official outbreak determinations.

Test locally and self-review before merging. Main deploys automatically. The user pushes with:

```powershell
git push -u origin feat/live-manila
```
