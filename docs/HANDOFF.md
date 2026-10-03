# Handoff
Branch: feat/risk-grid.

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
