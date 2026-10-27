> Historical UI-overhaul checkpoint. The later Live Manila feature and current verification are in [live-manila-checks.md](live-manila-checks.md). Shared gallery paths now show the current UI; the original captures remain in this checkpoint's Git history.

# Manila-first landing and model demonstration

Requested change: adapt the groupmate's PDF structure, retain DengueWatch's own identity, put Manila first, give other NCR areas their own section, and make the model explanation easy to find. The PDF is a structural reference. Its sample figures, current-week claims and seasonal status cutoffs were not copied.

## Implemented

- Manila-led hero and section shortcuts; primary navigation is Manila, NCR Map, Our Model and Report.
- A weekly Manila chart with exact source counts, visible gaps, a dated one-week historical estimate and its saved 80% uncertainty range. Desktop places the two summary cards beside the chart; the complete chart fits on mobile. Exact counts remain available in an expandable table.
- A separate section for the remaining 16 NCR areas: 15 cities and Pateros, grouped into the three remaining NCR districts. Their probabilities and risk labels come from the saved NCR rows, with factual example-week controls and the existing guarded Live option.
- A dedicated /our-model page with city and past-week selectors, a prediction/outcome comparison, recorded-count chart, clear match/miss/unavailable states, and expandable model comparisons. The initial Manila/Mixed example happens to be a miss; successes are not cherry-picked.
- A four-item mobile tab bar, source-period disclosures, retained care guidance, and offline precaching for the new model page. No map engine or tile request is added to the landing or model page.

## Data boundaries

Manila source coverage ends 2023-12-02; the latest complete-row snapshot originates 2023-11-26. Its one-week persistence estimate targets 2023-12-03. These are historical dates, not a forecast for the coming week today. A complete recorded count is unavailable for that partial target week; the chart does not substitute its partial count or zero.

Random Forest estimates the probability/class of a high-case week, not a case count. The recorded bars are observations. They are not Random Forest count predictions. Match/miss uses the saved predicted class and actual label; missing predictions/outcomes receive no verdict. The saved research cutoff is not an official outbreak declaration. The full comparison still reports that the simpler rule matched or beat RF on F1.

Generated data, models, training, thresholds, probabilities, schema, submission APIs, moderation, retention, closed reporting and the three-level map fallback remain unchanged from 1ed560a. Newer reviewed data is still required for a meaningful current forecast. No hosted write, collection activation or push is included.

## Verification

The completed command manifest is [ui-command-manifest.json](ui-command-manifest.json). Sanitized command logs are included in the review ZIP.

| Gate | Actual result | Status |
|---|---|---|
| Production build, lint, typecheck and JS budget | Passed | DONE |
| Unit/integration | 87 passed, no failures or skips | DONE |
| Database | 25 SQL checks and one seeded SQL/MFA reporting flow passed | DONE locally |
| Browser stability | Three consecutive full runs: 54 passed each | DONE |
| Production research suite | 18 passed | DONE |
| Offline/PWA | 5 passed, including the separate model demo offline and strict CSP | DONE |
| Visual references / independent comparison | 80 / 80 passed; existing 0.005 pixel tolerance retained | DONE |
| Cross-browser smoke | Chrome, Edge, Firefox and WebKit: 20 cases each, no page errors | DONE locally |
| Dependency audit | 0 vulnerabilities | DONE |
| Local passive ZAP | 0 high/medium, 1 low/informational alert | DONE within scan scope |
| Full secret audit | 0 current, 44 known historical, 0 unexpected; rotation pending, exit 1 | NEEDS OWNER |
| Isolated mobile Lighthouse | Performance 96, accessibility 100, LCP 2.415 s, CLS 0, TBT 14.5 ms | DONE in this lab run |

The PC restarted after all three complete 54-test runs had been recorded. Production verification was interrupted and was rerun completely. Remaining browser and visual commands used one worker, confirmed in their logs. Completed earlier gates were preserved. The PC-interrupted log, an explicitly stopped resumed attempt to correct npm worker-flag forwarding, and the initial stale-heading failures are retained as diagnostics, not passing evidence. The manifest separates interrupted attempts from the latest completed result of each gate. The translated heading assertions were corrected, and recovery now requires all 16 NCR results to return. Explicit selector labels were fixed before the new all-week data sweep.

The final source commit is recorded in BUNDLE_SOURCE.json inside the review ZIP. No push or hosted write occurred. The new browser coverage checks all 26 displayed Manila history rows, its exact estimate/target, all 70 Manila model weeks, all 17 model areas, missing predictions, misses, recovery from unavailable history, and expanded chart accessibility in both themes at 360/768/1280 px. Pure-data coverage verifies the 16-area grouping and unchanged source projections.

The earlier 12-artifact byte-identical ML reproduction and four leakage tests remain applicable to the unchanged model/data files. They were not rerun or relabeled as fresh model training in this presentation-only change.

The existing tolerance initially accepted small navigation differences against older references. To make the review images fully current, 48 prior-page references were force-refreshed, followed by another complete 80-case independent comparison. Both the refresh and final comparison passed; tolerance was not increased. The initial shell test-selection attempt is retained as diagnostic metadata, and the successful refresh/comparison record their actual structured Node CLI arguments.

Final screenshots cover five pages, four widths, both themes and both motion settings: 80 baselines. The review gallery contains 20 reduced-motion captures at 360/1280 px in light/dark. Real iOS Safari, human screen-reader/usability work, field INP, photo permission, approved contact, native Filipino review, hosted/DPO checks and known historical credential rotation remain owner work.

Test locally and self-review before merging near the defense. Main pushes automatically deploy Vercel. The user pushes: `git push -u origin feat/ui-overhaul`.

## Performance and review limits

JS assets total 105,850 bytes gzip initially and 705,217 bytes gzip across all chunks, including the map worker. The retained limits are 220 KiB / 850 KiB and are enforced in CI. [Asset budget](ui-budget.json). The performance audit ran in isolation after the browser checks, against the saved production build: [HTML](lighthouse-mobile.report.html), [JSON](lighthouse-mobile.report.json). TBT is not field INP; no field INP claim is made.

Local Node was 20.19.4 despite the project's declared >=22.12 requirement. Lighthouse ran under Node 22.23.4. A complete fresh Node 22 functional-suite run is not claimed; CI uses Node 22. WebKit 26.6 is local engine evidence, not a real iOS Safari/device certification. Other actual engine versions are in [ui-browsers.json](ui-browsers.json).

Before screenshots are the committed captures from 1ed560a, with [provenance](manila-focus-before/source.json). The five-page after gallery is under ui-overhaul/. The reference PDF's example numbers and seasonal labels were not promoted into source data. The supplied reference resolves the structural-reference question; owner work still includes photo permission, approved contact/controller, native Filipino review, historical credential rotation, hosted/DPO checks and human/device usability.
