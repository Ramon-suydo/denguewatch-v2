# Main publication handoff

The owner explicitly authorizes publishing the completed redesign to main on 2026-10-25 for Claude review. Read [CLAUDE_HANDOFF.md](CLAUDE_HANDOFF.md) for the source map, calculation entry points, verified results and remaining owner steps. Every main push triggers a Vercel deployment; successful hosted operation is not verified by publication. Reporting stays closed and credential rotation remains deferred.

The following feature-branch handoff and local-only statements record the pre-publication checkpoint. They do not override this later publication authorization.

---

# Active redesign handoff

Current branch: `feat/redesign`, created from main e9a3047. The active specification is the owner's three-page redesign prompt. Current behavior/methods: MAP_METHOD.md and DESIGN.md. Current verification: [evidence/redesign-checks.md](evidence/redesign-checks.md). Application source c2a6751 passed all required local gates; credential rotation and hosted/human gates remain pending. Push the review branch with `git push -u origin feat/redesign`. The separate footer About page is not in main navigation. Old public research routes redirect to real methods/privacy drawers. Current risk remains unavailable; weather is excluded from the national index. Anonymous reporting adds coarse national units and a shared old/new RPC rate guard in one forward migration; collection stays closed.

NEEDS OWNER: photo permission/source/licence; about.json team/controller/contact; credential rotation and hosted Vercel/Supabase/Auth/schedules/log-retention verification; DPO review; real usability test; population/catchment verification. The configured Vercel install path has not been run on Vercel. Local harnesses do not verify hosted services. No redesign main push or report activation is claimed.

---

> Historical project record. Current launch status and owner blockers are in IMPLEMENTATION_STATUS.md and LAUNCH_CHECKLIST.md. Older check counts, deployed states and instructions below are not current verification.

# Handoff
Current branch: feat/manila-evidence. Earlier entries below are historical.
Current specification: FINAL_REQUIREMENTS.md plus ENVIRONMENT_REQUIREMENTS.md (weather/factors replacement). Current evidence and release gates: IMPLEMENTATION_STATUS.md.

## Hosted setup completed
On 2026-09-24, the user explicitly authorized applying the three pending migrations
and populating hosted caches, while expressly deferring report activation.

Ran npm run app:setup successfully against the configured hosted Supabase project.
The transaction applied:
- 20260924000300_forecast_cache.sql
- 20260924000400_community_lifecycle.sql
- 20260924000500_composite_risk.sql

Independent read-only verification confirmed:
- All three migration versions recorded.
- 17 city forecasts and 17 city-scoped risk-input records.
- 650 backtest records (325 paired predictions across two methods).
- Historical dataset unchanged at 7,350 observations.
- Public REST reads succeed for forecasts, risk inputs and policy.
- RLS enabled; anonymous inserts/updates denied on all three new tables.
- Active hourly retention schedule, minute 17, with 90-day retention.
- submissions_enabled = false. No reports:enable command was run.

Verification evidence: ignored .artifacts/hosted-setup-verification.json and
.artifacts/forecast-verification.json. No synthetic report was submitted.
The job is scheduled; execution history was not yet established by this check.

## Next work: content and consent review
Keep real submissions CLOSED through the user's upcoming content/consent pass.
Do not run reports:enable without later explicit authorization.
Approved research contact remains achilleslang23@gmail.com.

## Implemented locally
Public dashboard, city detail/history/incidence, Map/Grid with all 17 cities,
report consent flow, privacy/terms, secure submission/deletion RPCs, shared design
system, saved forecasts and transparent factor breakdowns.

Seasonality improved holdout MAE but failed the predeclared development threshold;
trend-only remains selected. Community/weather weights remain zero. The cached
January 2021 estimates do not establish current risk. See RISK_MODEL.md.
Latest implementation checks: 19 data/model/security tests, 10 browser tests,
production build and contrast checks passed.

No frontend push/deployment was performed. The user pushes:
git push -u origin feat/risk-grid
Test locally and self-review before merging near the defense; main deploys live.
Exact source citation placeholders still need source-owner review.

## Core-page review: 2026-10-01

Preserved the existing Supabase dashboard, city detail/history, and risk grid.
Added /data-sources with navigation/footer links, audited coverage and gap counts,
source overlaps, mortality anomalies, population/geography limits, and explicit
DOH/FOI citation placeholders. Counts are labeled as the 2026-09-23 file audit,
not live database counts. Updated the existing responsive-route check to include
this page at 320, 390, and 768 pixels.

Checks: npm test (19 passed), npm run build, npm run test:contrast, and
npm run test:ui -- tests/ui/public-app.spec.ts (7 passed with
PLAYWRIGHT_CHANNEL=msedge). Default Playwright Chromium is absent on this machine;
installed Edge works. No hosted writes, report activation, or push performed.

Next Tier 0 work: assess existing forecast/backtest implementation against the
new handoff request for seasonal-naive and moving-average baselines, one stronger
model, walk-forward per-LGU MAE/RMSE/sMAPE, and prediction intervals. Existing
model selection does not by itself establish that all these requirements are met.
Then verify shared disclaimers/attribution and cached-data demo readiness.

## Weekly forecast/backtest: 2026-10-01 (Day 2)

Primary dashboard/LGU forecasting now uses the bundled weekly-only v1 cache,
not the monthly CSV. Run `npm run forecast:backtest` to regenerate the versioned
`src/data/weekly-forecast-v1.json` and `docs/weekly-backtest-v1.json` artifacts.
No hosted writes or deployment performed. Details: docs/WEEKLY_FORECAST.md.

Models: seasonal naive (52 calendar weeks), equal four-week mean, and separate
LGU/direct-horizon log-case ridge with fixed lambda=10, lags and annual harmonics.
Expanding rolling origins, 1/2/4-week horizons, paired common-support scoring.
2018 is development/calibration, not held-out; default frozen on its one-week
MAE before the 2019-onward evaluation. Ridge selected. No future fitting/scaling
or interval residuals; gaps and 155 suspect rows stay unavailable, never zero.
Death counts enter only the existing suspect-row quality exclusion, not models.

2019-onward one-week MAE: ridge 8.82, mean 11.23, seasonal naive 22.58;
ridge beats seasonal naive in 17/17 LGUs (60.95% MAE skill), N=1,462 per model.
Ridge MAE at 2/4 weeks: 9.94/12.37. One-week nominal 80%/95% coverage:
79.75%/92.54%. One-week sMAPE is worse than the mean baseline (68.22%/64.95%).
Without COVID-period targets (2019 only), ridge one-week MAE is 12.39 and
coverage 71.43%/88.22%; four-week coverage 68.67%/83.71% is poorly calibrated.
UI exposes per-LGU/overall metrics, COVID cohorts, interval bands/exact tables,
and exclusions. Counts forecast 2021 labels, not current 2026 conditions.

Checks: npm test (23 passed), npm run build, and public-page browser checks
(8 passed with PLAYWRIGHT_CHANNEL=msedge; mobile and accessibility included).
The separate dashboard monthly risk overview is explicitly legacy; Map/Grid
still uses the previously reviewed monthly risk distribution. New weekly count
forecasts do not generate clinical warning tiers or refresh hosted risk caches.

Next: Day 3 shared disclaimer/footer attribution review, then cached-data demo
readiness. Exact DOH/FOI citations await owner review. Submissions stay closed.
Test locally and self-review before merging; main deploys live. User pushes:
`git push -u origin feat/risk-grid`.

## Shared disclaimers and transparency: 2026-10-01 (Day 3)

LayoutShell now renders one SharedDisclaimer on every route, including the
preview and not-found page: historical statistical estimates, not medical
advice/emergency/outbreak alerts or a substitute for DOH/local health guidance;
community reports remain unverified and separate from official data.

Footer attribution uses the centralized src/lib/source-metadata.ts config.
Each of the three sources has title, issuing office, date obtained, FOI ID, URL
and usage terms, currently [pending]. Fill this file once; footer, Data & Sources,
chart source details and forecast citation details read it. The npm test citation
check warns (18 pending fields), not fails. The visible footer placeholder is
[exact citation pending]. No source provenance or usage permission was invented.

Last data period is read from historical_surveillance by source and period,
not from model cache dates. The footer identifies the newest source separately
(Manila daily only) and also shows NCR weekly/monthly labels. Failed reads show
Unavailable with retry; empty sources show No records. No real-time claim.

Model transparency reads metrics from the bundled backtest artifact, comparing
the strongest baseline (currently four-week mean) first, then seasonal naive,
with MAE skill against both (21.5% and 61.0% at one week). Added training/selection
and test windows, actual per-LGU fit/intercept and lag/seasonality inputs, known
limitations and potential data improvements. The recent-count explanation is a
baseline comparison, not proven feature attribution. sMAPE 68.2% versus 64.9%
is an aggregate result; no separate low-case-week score exists. One-week 2019
interval coverage 71.4%/88.2% versus nominal 80%/95% is shown from the cache.
Test evidence ends 2021-01-10; no later-year or season-level outbreak claim.

Copy audit fixed stale monthly forecast wording in chart details and explicitly
labels Map/Grid as legacy monthly/historical. No forecasting/data-policy changes,
new dependencies, hosted writes, submission activation or push performed.

Checks: npm test (24 passed, expected pending-citation warning), npm run build,
all 13 browser checks with PLAYWRIGHT_CHANNEL=msedge, and npm run test:contrast
passed. Browser checks cover all public routes at 320/390/768, artifact-number
agreement, and DB coverage changes/failure/empty reads. Production build still
reports a large-chunk warning; Day 4 demo/performance review remains pending.

Next: Day 4 cached-data demo readiness, console checks and mobile/performance
review. Exact citations await owner review; real submissions remain closed.
Test locally and self-review before merging; main deploys live. User pushes:
`git push -u origin feat/risk-grid`.

## Day 4 — demo hardening (2026-10-03)

Completed on feat/risk-grid. `npm run demo:snapshot` verifies official DB rows
against audited raw files in a read-only repeatable-read transaction, then writes
public/demo-snapshot.json atomically. Snapshot date: 2026-10-03T03:17:58.331Z;
17 LGUs, 4,403 weekly, 1,037 monthly, 1,910 daily observations (7,350 total).
Includes per-source hashes, coverage/quality audit, official legacy risks and
forecasts, 650 legacy backtest rows, weekly cache and full weekly backtest/hash.
It exports no community reports, contacts or policy records. Source surprises
fail closed and preserve the previous snapshot. Public JSON is 7.16 MB uncompressed.

All published reads try Supabase first and fall back after failure/about four
seconds, when browser connectivity is absent, or with VITE_DEMO_MODE=true.
Fallback is consistent across resources until reload, visibly dated, and source
coverage in the footer is labelled as snapshot coverage. Empty live responses
remain empty; missing community counts stay unavailable, never zero. Offline
policy is closed; submission/withdrawal calls are blocked, never queued or faked.
Offline map uses the 17-LGU grid without requesting external tiles.

Dashboard/routes and chart modules load lazily; historical/forecast skeletons
reserve chart heights. Largest JS chunk: 785.78 -> 474.27 kB; gzip 219.39 ->
138.19 kB. No large-chunk warning; no dependency added. Tap targets are >=44px,
including report legal links/map controls. Inline favicon avoids offline fetch
errors. Existing labelled risk levels, chart tables, focus/modal behavior and
reduced-motion rules are retained.

Checks: npm test (26 passed; expected 18 pending citation fields warning), npm
run build, all 18 browser cases (one existing toast assertion was scoped to its
region and rerun), and npm run test:contrast passed. Online/offline checks cover
11 public/missing routes at 320/390/768/1280px, no horizontal overflow, usable
tap targets, no serious/critical axe findings and no browser console warnings or
errors. Keyboard skip/focus/reduced-motion and modal focus checks pass. Separate
production-build smoke passed all 11 routes with external network blocked and
then warmed SPA navigation with the browser fully offline, with clean console.

Use docs/DEMO_SCRIPT.md for the five-minute click path and local demo build
commands; docs/DEFENSE_QA.md has 12 source/backtest-grounded panel answers.
This is not a PWA: cold hosted-page reload without assets/network is not promised;
serve the bundled build locally for the defense and keep it running. No hosted
writes, report activation or push performed. Exact DOH/FOI metadata remains pending.
Next: rehearse the local demo, supply citations and review draft privacy/legal
copy with the school DPO. Test locally and self-review before merging; main deploys
live. User pushes: `git push -u origin feat/risk-grid`.

## Day 5 — review drafts and print export (2026-10-03)

/legal is a lazy-loaded, footer-linked set of six legal-v1 review sections:
Privacy, Terms, Forecast/Medical Disclaimer, Sources (canonical metadata),
Model Transparency (link to the existing LGU panel), and Cookie/Storage notice.
All say Draft for review / Not legal advice and carry version/date. /privacy
and /terms reuse the same draft copy; the existing withdrawal flow is preserved.

Reality audit: no app analytics/advertising SDK, cookies, localStorage/sessionStorage
writes or remote font/CDN loader. Fonts/scripts are local; browsers may cache
public assets. Online public Supabase anon reads have auth persistence disabled.
Vercel/Supabase and online OpenStreetMap tiles receive request metadata; provider
log/backup retention/settings and locations require verification. Withdrawal codes
stay out of URLs/storage; optional copy uses clipboard only on request. Community
submissions remain closed; offline snapshot/mutations behavior is unchanged.

Existing 90-day DB retention and previously approved research email are preserved
as facts, not final public-launch policy or controller/DPO designation. Five fields
in src/lib/legal.ts remain [pending]: controller name, controller/DPO contact,
final launch retention, technical-log retention, provider backup retention.
Source metadata remains 18 pending fields: title, issuing office, obtained date,
FOI request ID, URL and usage terms for each of the three sources.

CommunityConsent is reusable, unticked/required and versioned community-v1;
text is centralized in src/lib/legal.ts. Continue/submit requires the existing
policy gate and matching consent version. No hosted mutation or activation ran.
LAUNCH_CHECKLIST.md covers every-RPC rate limiting/abuse controls, retention,
RLS/grants, consent/lawful-basis/liability/right-request review, controller contact,
provider arrangements and NPC registration/exemption assessment by the school DPO.
Health-data/rights and registration descriptions link official NPC references;
no legal status or exemption is claimed. COMMUNITY_PRIVACY and DEFENSE_QA are
updated to match the current implementation and applied hosted migrations.

LGU detail has Print report, using browser print/PDF with A4 CSS. It includes
weekly DB/snapshot observations, dated trend/exact rows (gaps break the line),
1/2/4-week cached estimates and 80/95 intervals, per-LGU artifact-derived MAE
comparison versus the four-week mean, limitations, shared disclaimer, source
metadata/checksum, model version/run date, generated time and snapshot date.
Weekly latest label is distinct from cached forecast origin; a newer DB label
never updates the model implicitly. Nav/interactive charts are excluded from the
printed report while frames remain measurable to prevent resize warnings.

Checks: npm test (26 passed; expected pending-citation warning), npm run build
(once each), all 19 browser tests and contrast checks passed. The new print check
renders an actual A4 PDF fully offline, asserts artifact score/disclaimer/source
text and empty app storage, and checks the model link scrolls to its existing
panel. All 12 routes/missing routes pass online/offline mobile checks at
320/390/768/1280, serious/critical axe and console checks. Final targeted print/
model-link rerun passed after diff review. No dependencies added; largest JS chunk
474.67 kB (gzip 138.33); no large-chunk warning. DEMO_SCRIPT includes the handout.

Next: owner fills pending metadata, school DPO/lawyer reviews drafts and rehearses
the local demo/printed handout. Submissions stay closed. Test locally and self-review
before merging; main deploys live. User pushes: git push -u origin feat/risk-grid.

## Owner metadata update — 2026-10-03

legal-v1.1 uses the owner-supplied controller name (DengueWatch student research
team, University Perpetual Help College of Manila) and controller research contact
achilleslang23@gmail.com. A DPO appointment is not asserted. Launch retention says
Not applicable, form closed; the existing 90-day DB configuration is unchanged.
Technical-log retention is per Vercel/Supabase defaults; backup retention per
Supabase defaults. These labels do not establish verified durations or settings.

Canonical source metadata now contains the supplied titles/offices and usage
terms Not stated. Acquisition dates and FOI IDs are Not available; URLs are
not public. The original acquisition channel is unverified: neither a request ID
nor an assertion that no FOI request existed was invented, and file/audit dates
were not substituted for acquisition dates. Weekly/daily specific offices remain
unconfirmed; monthly is explicitly derived from weekly, not independent.

All metadata fields are filled, but 14 source fields remain unverified/incomplete.
The existing exact-citation warning remains visible and npm test still warns.
Unknown/default descriptions must not silently count as verified citation evidence.
Launch checklist, privacy copy and defense Q&A distinguish supplied values from
review decisions. COMMUNITY_PRIVACY's earlier pending-field notes are superseded
by this update: controller/contact are supplied, provider durations/provenance and
future launch retention still need review. Submissions remain closed; no DB writes.

Checks: npm test (26 passed), npm run build (once each), targeted legal/consent/
offline A4 PDF/model-link browser check passed. No new dependency or push.
Next: source-owner provenance and school DPO/lawyer/provider review. Test locally
before merging. User pushes: git push -u origin feat/risk-grid.

## Day 6 — feature freeze / final defense package (2026-10-03)

No replacement metadata block was included (only a paste placeholder), so the
previous owner-supplied legal-v1.1/source values are preserved exactly. Not available,
not public and Not stated render plainly; exact-citation warnings remain because
provenance/usage terms are not verified. Draft review labels and collection gate stay.

DEMO_SCRIPT and DEFENSE_QA now include final artifact-derived one/two/four-week
MAE/RMSE/sMAPE/paired support and comparison versus the four-week mean. One-week
ridge MAE 8.82, mean 11.23, seasonal naive 22.58; ridge RMSE 20.89 and sMAPE 68.22%
versus mean 64.95%. Intervals 79.75%/92.54% overall, 71.43%/88.22% in 2019-only
without COVID targets. Snapshot 2026-10-03T03:17:58.331Z; weekly evidence ends
2021-01-10. No retraining/data refresh performed.

Privacy answer correctly says no new community health submissions while closed,
not zero personal-data processing: online infrastructure request metadata and the
withdrawal-code RPC still exist. Health-data/rights/NPC references and lawyer/DPO
review remain in the draft answer. Provider defaults are not verified durations.

DEFENSE_DAY.md has exact npm ci/build/preview commands, compiled VITE_DEMO_MODE,
offline checklist, print/PDF and screenshot backup, static-server fallback and
do-not-touch list. A pre-freeze build copy exists locally at ignored
.artifacts/defense-freeze-06bc5bb/dist. Final ignored ZIP:
.artifacts/denguewatch-defense-2026-10-03.zip (5,126,340 bytes), containing forced
snapshot-mode dist/, three defense docs, four final screenshots, Manila PDF and
cached JSON evidence. Copy ZIP to USB; it is not in Git or a fresh clone. JSON
alone is evidence, not a runnable UI. Cold hosted offline reload is not promised.

Final checks: npm test once (26 passed), full browser suite once (16 passed,
3 found horizontal overflow from newly supplied source filenames), then only
those 3 rerun and passed after .prose dd overflow-wrap:anywhere. A second build
was necessary to include this CSS bug fix; final largest JS 475.25 kB/gzip138.52,
no large-chunk warning. Contrast passed once. A benign Node color warning first
stopped the PowerShell launcher before any browser tests began; warning handling
was corrected. Production offline smoke passed 12 routes with external network
blocked, then warmed SPA navigation with browser fully offline; zero external
requests and console warnings/errors, closed consent, Not available rendering,
320px legal layout and actual PDF verified. Smoke harness was corrected to use
baseURL and warm modules within one SPA session rather than full reloads.

Security: no .env/certificate files in tracked paths or reachable history;
231 unique reachable Git blobs scanned against known private local credentials,
private-key/token patterns and service-role JWTs: no findings. This heuristic
scan is not proof against every possible unknown credential. src has no TODO or
console.log matches. .env.local/certs/.artifacts remain ignored. ZIP's 54 files
passed the same credential-pattern check and prohibited-path check; no findings.
Detailed logs/audits are local ignored .artifacts/day6-* files.

Deliberately unchanged: models, thresholds, sources/snapshot/backtest, schema,
90-day DB setting, closed reports, provider defaults and unverified provenance.
Runtime mismatch also left unchanged: this laptop is Node20.19.4/npm10.8.2,
below project's declared Node>=22.12.0 despite passing checks. Runbook records it;
validate a supported environment separately, not at the venue; use prepared dist.
No feature/dependency, DB mutation, report activation, push or merge performed.
Next: copy ZIP/PDF to USB, rehearse locally, self-review before any merge. main
pushes deploy live. User pushes: git push -u origin feat/risk-grid.

## Manila redesign — Phase 0 (2026-10-03)

Branch feat/manila-redesign; defense-v1 resolves to
bfdff26009b168b2c9a063519d2bdc92a2737f76 and must remain untouched.
Read only the four specified iACADEMY reference files via public raw URLs;
no external repository changes. Baseline audit: docs/REDESIGN_PHASE0.md.
48 screenshots of 12 current route patterns at 320/390/768/1280, using verified
snapshot reads with external network blocked. Zero horizontal overflow/page errors.
Full/viewport captures are ignored .artifacts/manila-phase0/. Charts were awaited
before final captures so skeletons were not mistaken for settled defects.
No UI/data/model/schema changes or hosted reads/writes performed in this phase.
Next: Phase 1 palette/fonts/nav/cards/footer; close misleading CTA and quarantine
public fixture preview. Tests/build run once below before Phase 0 commit.


## Manila redesign — Phase 1 (2026-10-03)

Branch feat/manila-redesign; defense-v1 remains bfdff26009b168b2c9a063519d2bdc92a2737f76.
Shared navy/gold/cobalt/cyan theme now covers public, legal and 404 pages.
Montserrat 500–800, Roboto 400/500/700 and Fraunces 600 are self-hosted;
only these three requested font packages were added; old font packages removed.
Retired dw-* classes and teal/amber tokens. Added brand rail, pill navigation,
scroll blur, index-card accents, section bars and interactive-only hover lift.
One integrated honesty strip shows derived weekly/daily periods and offline badge;
full disclaimer and attribution remain in the shared footer. Closed community
navigation now reads “Community reports: opening soon”. No submissions enabled.
Presentation filters cities to Manila; source data and NCR backtests remain intact.
Removed city pickers and city sorting controls; historical period labels are plain.
Charts have computed takeaways; history legend/table distinguish missing from zero.
DesignPreview and public API fixtures moved to tests/fixtures. /dev requires DEV
and VITE_TEST_FIXTURES=true; production rejects that flag. Verified no preview
fixture markers/chunks in dist. Normal /dev and /design-preview resolve to 404.
Checks: 27 unit tests pass; final production build passes; 18 contrast pairs pass.
Browser suite: 17 pass initially; both failed checks pass after targeted recheck
(wait for lazy preview chart before interaction; extend multi-route loop timeout).
Includes online/offline axe at 320/390/768/1280, console hygiene, 44px targets,
keyboard/reduced motion, fully offline warmed routes, timeout fallback and A4 print.
Final production-only 320px smoke also passes: menu/neutral CTA, closed form, axe,
console and /dev plus /design-preview 404; no fixture data is shipped.
Initial font export paths corrected; final rebuild required stopping preview to
release a Windows snapshot file lock. No repeat unit run or dependency workaround.
48 production screenshots plus four home viewport captures: ignored
.artifacts/manila-phase1/; zero overflow, page errors or external requests.
Largest JS chunk 474.00 kB (138.06 kB gzip); charts/routes remain lazy-loaded.
Unchanged: raw data, snapshot, model/backtest, schema, provenance and closed gate.
Existing laptop Node20.19.4 remains below declared >=22.12.0; no runtime migration.
Next: Phase 2 visual-first Home, then Phase 3 verified Tondo geography/population.
No barangay counts, population totals or boundaries invented. No Supabase writes,
merge, push or tag change. Self-review and test locally before merging near defense.
User push: git push -u origin feat/manila-redesign.


## Data confidence — item A (2026-10-04)

Data & Sources now leads with verified Manila work: 2,230 scoped rows, recorded
full-row source verification, source fingerprints, years and last source label,
all derived from the committed audit snapshot. Weekly/daily coverage bars hatch
missing observations; annual overlap differences and suspect Manila rows are
computed. Model summary uses the cached Manila one-week test, linked to its panel.
Five closed-by-default notes retain historical/non-live dates, missing vs zero,
separate daily/weekly/monthly sources, mortality exclusions and unverified community
counts. All broader disclosures remain in DATA_QUALITY.md; no other LGU details
appear in the page body. Citation warnings and shared footer were not edited.
Added contextual info beside history gaps and model MAE. No stronger accuracy claim.
Checks once: 28 unit tests, production build, disclosure/axe browser check at
320/390/768/1280 pass. No new dependency, snapshot/DB change, push or tag mutation.
Next: item B requires real Tondo boundary/population import; none existed on branch.


## Tondo minimalist map — item B (2026-10-04)

Replaced /map city markers/basemap with a lazy offline SVG map card. Areas is the
default, Heat uses weighted centroid kernels/blur clipped to source polygons,
Table is searchable/sortable. Population and crowding use real PSA 2020 values;
crowding is explicitly not disease risk. Cases is locked behind a separate hook;
no city count, report or forecast is assigned to a barangay. Empty filters show
No data, not zero. Coverage/source drawer, district chips, deep-link selection,
arrow focus, keyboard +/-/0, pointer pan, two pins and mobile info sheet included.

Source verification corrected the planned 267 assumption: 258 numeric entries
in the requested 1–267 range have polygons/population. Missing numbers are
21,22,23,24,27,40,113,114,115; these stay unavailable, not zero or synthetic shapes.
PSA separately lists 202-A (1,213 people), so 653,007 + 1,213 reconciles 654,220.
202-A geometry is quarantined because the repository maps it to Barangay 202’s
PSGC 1380601202, a duplicate identity; never guess a replacement or merge it.
267 is the requested numeric scope, not a verified current administrative count.
Details/license/fingerprints: docs/TONDO_MAP_SOURCES.md and source-metadata.ts.

config/areas.json + npm run geo:build produces committed paths/areas/centroids
and TopoJSON. Small d3-geo/topojson tools and types added for build-time geometry;
map runtime imports no geometry library. Local equal-area projection for km².
public/geo/tondo.json is 64.7 kB; lazy map JS 11.68 kB/4.39 kB gzip.
Snapshot includes the geometry/population artifact; demo:snapshot retains it on
regeneration. Existing surveillance rows, audit timestamp/checksums and backtests
are unchanged. Offline reads use the snapshot before attempting geometry fetches.

Exact brand cyan reverses brightness before gold under protanopia. Only the map
stop dims cyan by 10% linear light and lifts red slightly to avoid a tritanopia
gamut dip between stops; brand tokens unchanged. All 301 interpolated samples
pass each simulation, and the legend uses the same linear-light interpolation. Normal/protanopia/
deuteranopia/tritanopia stop-order checks pass; hatching, labels and table remain.
Checks: 30 unit tests once, plus the changed quarantine tests (2 pass), final
build, 22 contrast pairs and four simulated ramp checks pass. Full browser run
had 16 pass/4 fail; targeted fixes/rechecks resolve all 20. Fixed missing native
CSS token variables, inherited light table header and offline geometry retry.
Confidence timeline now also resolves native theme tokens correctly. Rebuilds
required these browser fixes; final note encoding corrected to UTF-8. Snapshot copy verified structurally against
HEAD and restored to preserve every original surveillance field exactly. No repeated
full unit suite. Production offline capture checks 3 map views at 4 widths, no
horizontal overflow, axe findings, console issues or external network requests;
16 captures in ignored .artifacts/tondo-final/ precede the final minor gamut
adjustment; the affected map browser check passes after that adjustment.
Final largest JS chunk 475.59 kB/138.66 kB gzip. Existing Node20 mismatch kept.

No hosted Supabase write, schema/community launch, push, merge or defense-v1 change.
Next: independent PSGC review for 202-A/source gaps; Phase 2 Home remains unbuilt.
Test locally and self-review before merging. User push:
git push -u origin feat/manila-redesign.

## Focused Tondo geometry repair — 2026-10-04
- Replaced destructive hierarchical_t0p005 geometry (256 triangles; 1,036 vertices) with unsimplified HDX COD-AB/NAMRIA polygons; preserved reviewed PCODE/name→PSGC joins. Source manifest/checksum and full-resolution Manila reference committed locally.
- geo:build now selects Tondo first, rewinds exterior/holes for d3, simplifies shared topology, validates geometry/derived city bounds and <=5% per-polygon area drift; invalid input is quarantined without a path. QA artifact stores every polygon’s original/simplified vertices and areas.
- 258/267 mapped; same nine source gaps; 202-A remains quarantined. 9,996 original→5,738 simplified vertices; max drift 3.612%; total area 10.932420→10.933818 km². Large polygons 20/105/128 listed for review. PSA confirms Barangay 20=45,772; population legend remains 56–45,772.
- Desktop side panel/mobile bottom panel occupy their own layout space; Pin and Close use shared buttons. Navbar clearance follows measured height. Screenshots .artifacts/tondo-geometry-{320,390,768,1280}.png; desktop/mobile visually inspected.
- Checks: 32 unit tests, production build (after correcting two TypeScript errors), two offline map browser tests at all four widths with axe and shape-count/share/layout gates, contrast and color-vision simulations pass. Geometry artifact 185,226 bytes (~52,478 gzip); lazy map JS 12.46 kB (~4.59 gzip). Surveillance snapshot values unchanged; no hosted DB writes, submissions remain closed, defense-v1 untouched.
- STOP: Phase 2 remains paused pending owner visual confirmation. Test locally and self-review before merging near the defense.

## Partner-ready repository cleanup — 2026-10-06
- Owner explicitly authorizes publishing all completed work on feat/manila-redesign. Main and defense-v1 remain unchanged; Phase 2 still awaits map visual approval.
- README now describes actual Manila/Tondo functionality, offline setup, checks, directory ownership, and partner branches/PRs. Deployment guide moved into docs/DEPLOYMENT.md; links and stale defense click paths updated.
- Removed unused Leaflet component/dependencies/styles and obsolete tile mocks. Added editor defaults while exempting raw source bytes; new data/raw files are ignored, existing verified published files remain tracked.
- Patched transitive source-map-js 1.2.1→1.2.2 for GHSA-68fv-2mgg-jv7q. npm audit reports zero vulnerabilities. No broad dependency upgrade or new feature.
- Checks: 32 unit tests; 21 browser tests (all public routes, four widths, axe, keyboard, closed submissions, print, cached/offline and timeout behavior); build; contrast/ramp simulations; git diff --check; local documentation links. All pass. Production smoke: 12 routes, zero console issues/external requests, 258 shapes; screenshot .artifacts/push-review-{320,1280}.png, desktop inspected.
- Historical secret-pattern scan covers 343 text blobs: no private keys, recognized secret tokens or database passwords detected. Local env/cert files remain ignored; src has no TODO/FIXME or console logging. No hosted database writes. Existing Node 20 laptop engine mismatch retained; collaborators should use declared Node >=22.12.
- Before merging into main, test locally and self-review; main deploys production. Partner checks out feat/manila-redesign and creates a feature branch from it.

## Replacement specification — 2026-10-25

Owner supplied FINAL_REQUIREMENTS.md, replacing the older redesign/Tondo scope.
Implemented on feat/manila-evidence from feat/manila-redesign; main and defense-v1
unchanged. Start with README, AUDIT, DATA, MEASUREMENTS, EVALUATION and
IMPLEMENTATION_STATUS before proposing further work.

- Immutable daily-derived Z/M series, explicit DOH join, source reconciliation,
  verified ERA5 provenance, fixed-seed rolling evaluation and read-only APIs.
- Current public baseline is persistence; primary weather ridge comparisons are
  negative. Never claim current 2026 risk or clinically validated outbreak alerts.
- Public Manila history, historical 17-city NCR map, methodology/driver/alert tables,
  prevention and bilingual Home/Prevention/Report; PWA public-only cache.
- V2 reporting/roles/moderation/upload/audit/retention migrations prepared and tested
  locally. Collection stays closed; legacy activation command is retired.
- Local DB password equals a public identifier: rotate before hosted use. New
  hosted migrations, real Auth/MFA/purge verification, DPO/provenance review,
  deployed ZAP and human usability evidence remain outside verified local results.
- Docker is absent; guarded local staff setup provided but its full Docker/Auth
  execution is unverified. Public demo works without DB credentials.

Test locally and self-review before merging risky work near defense. User pushes:
`git push -u origin feat/manila-evidence`. Do not apply hosted migrations or open
collection without later explicit owner authorization.

## Environmental addendum, 2026-10-25

NASA POWER cross-check, pre-2018 frozen lag selection, paired AR/season/weather
ablations, geographic proxies and city bootstrap CIs are implemented. Read
ENVIRONMENT.md and ENVIRONMENT_RESULTS.md. No primary 1/2-week environmental
variant has a positive lower skill bound versus persistence; four-week findings
remain exploratory. Population/source-vintage limitations remain explicit.
Public forecasting stays persistence, weather failure is tested, and provider
calls are server-only, cached and rate-limited. The daily filesystem refresh job
is provided but no hosted schedule was installed. No hosted writes or report
activation occurred. Credential rotation and the earlier release gates remain.
