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
