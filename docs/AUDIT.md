# Audit against the replacement specification

Audit date: 2026-10-25 (Asia/Manila). Baseline commit: 790becd.
Working branch: feat/manila-evidence, based on feat/manila-redesign.
The supplied prompt names Ramon-sufile/denguewatch-v2; this checkout's configured
remote is Ramon-suydo/denguewatch-v2. No remote was changed.

## Reproducible data evidence

Run `npm run data:prepare`; see [dictionary](DATA.md),
[validation output](../data/validation_report.md), and
[data/processed/audit.json](../data/processed/audit.json). Raw bytes are immutable.

Differences from the supplied measurements:
- DOH has **32,701** national data rows plus one HXL row, not 32,702 data rows.
- Daily workbook: **1,910 rows / 14,635 cases**, no duplicates or recorded zeros.
  **252** absent dates within 2018-01-01 through 2023-12-02; another **29** dates
  are beyond coverage. 2023 has 2 internal absences, not 31 missing source days.
- Derived CSV: 308 rows, 5 zero-row weeks, 94 weeks with fewer than seven rows;
  all totals/dates/row counts match workbook aggregation. Duplicate _1.csv absent;
  no raw file was deleted. Final excluded partial week has **30 cases**.
- Observed-week daily/DOH overlap reproduces the supplied **151** weeks: daily
  **8,255**, DOH **8,234**, MAE **13.5960**, max **78**. The initial audit used
  Scenario Z and counted five blank daily weeks as zero: **156** pairs, daily
  **8,255**, DOH **8,244**, correlation **0.929366**, MAE **13.2244**. This is a
  cohort distinction, not a discrepancy in source bytes. Requiring seven rows
  yields **104** pairs. All exact pairs/cohorts are retained; no double counting.
- NCR has 4,403 records / 17 LGUs / 259 labels per LGU, with three calendar gaps
  in each city's series. One missing death value and 155 deaths>cases retained
  as flags. Death totals are not validated mortality evidence.
- Monthly: 1,037 rows derived from DOH labels; denominator arithmetic checks,
  but population provenance is still unverified. No independent model validation.

## Geography and external sources

At baseline data/geo contained Manila/Tondo only; no complete 17-city collection.
Recovered 17 NCR admin3 features from the existing **unsimplified** HDX COD-AB v03
archive, verified against SHA-256 in boundary-source.json. Extraction script:
`scripts/extract-ncr-boundaries.py`. Committed selected source shapes and manifest;
1.06 GB archive stays ignored. URL https://data.humdata.org/dataset/cod-ab-phl;
NAMRIA/PSA via OCHA, **CC BY 3.0 IGO** per saved HDX metadata and prior manifest.
Web recheck returned 403; do not claim fresh remote metadata verification.
Boundary vintage **2025-02-13** is not proof of 2016-2021 administrative geometry.
The older MIT license text does not replace HDX's license.

Weather: [Open-Meteo official historical API](https://open-meteo.com/en/docs/historical-weather-api)
was verified and ERA5 annual hourly files fetched for 2015–2023; complete weeks
and request hashes recorded in [external provenance](../data/external/SOURCES.md).
Grid estimates, not station gauges. Respect the documented roughly five-day
publication delay using weather weeks ending at least seven days before origin.
Retrospective reanalysis revisions are not historical forecast vintages.

## Architecture and implementation inspected

- React 19 / Vite 8 / TypeScript 7 / Tailwind 4 / Recharts; Supabase, PostgreSQL,
  local PGlite SQL tests. Stack retained. Local default runtime Node 20.19.4 is
  below declared >=22.12; verification now uses temporary **Node 22.23.2**.
- src: public routing/layout, monthly legacy risk, January-2021 NCR ridge cache,
  disclosures, closed community form, source metadata, cached offline reads,
  Tondo SVG map. No admin UI, PWA manifest/service worker or i18n at baseline.
- scripts: ingestion/audit, weekly/risk backtests, geometry QA/build, snapshot,
  TLS validation, hosted setup. **check-ramp.mjs does not exist**; ramp/CVD checks
  are inside check-contrast.mjs and tondo-map.test.ts.
- supabase: five migrations, private admin allow-list, RLS on public tables,
  hashed bearer withdrawal code, aggregate suppression below five, closed gate,
  90-day purge configuration. Not complete against replacement request: no
  moderation queue/roles/CSV preview+rollback, publication delay, PoW/CAPTCHA,
  burst controls, barangay dropdown or free-note PII scrubber. No hosted writes.
- config: Tondo-only area definition. tests: baseline 32 unit/integration tests,
  browser accessibility/offline/closed gate checks. No lint command or CI existed.
- Dependencies: npm audit found one high Vite advisory group at 8.3.0. Updated
  to 8.3.3 within same major; audit then reports **0 vulnerabilities**. Explicit
  react-is peer added for Recharts. TypeScript 6 API compatibility alias follows
  Microsoft's TS7 documentation while preserving the native TS7 compiler.

## Secrets evidence — action required

`git ls-files` and **358 reachable historical blobs** scanned with
`scripts/audit-secrets.mjs`: no tracked .env.local/certs paths, private-key markers,
recognized GitHub/AWS/Supabase secret tokens, service-role JWTs or credential URLs
were detected. **However the local database password equals a public project
identifier already present in reachable history. Treat it as exposed and rotate
it in Supabase before hosted use.** The scanner correctly fails for that known
local value; do not report a clean secrets gate. Connection string was never
printed, committed or sent to a connected service. No database was contacted.
This heuristic audit cannot prove absence of unknown credentials/unreachable refs.
`.env`, `.env.*` and certs/ ignored; only .env.example intentionally tracked.
Browser code reads only VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. Historical
service-role/browser matches: none found; build guard hardening is tracked work.

## Mockup and scope conflicts at baseline

No production matches for the alleged 1,245 cases / 7 high-risk districts / 128
communities / users-online widgets, skyline hero or pie chart were found by source
inspection; do not claim deletion of elements that did not exist. Test-only
fixtures are gated out of production by Vite. Public nav has no admin items.
Conflicts that do exist: /map is Tondo population/crowding geography instead of
NCR historical cases; Home contains monthly legacy tiers and Jan-2021 forecasts;
no 2016–2023 stitched scenario UI, prevention page or both-scenario methodology;
city-detail routes still expose older forecasting components. These require
replacement or isolation before claiming the new product scope is fulfilled.

## Evidence status

Initial tests: 32/32 pass. New transformation/leakage/calibration tests: 9/9 pass
under Node 22.23.2. Production build passes under Node22 after restoring react-is.
Lint was absent; configured and compatibility issues being resolved. Full new
acceptance, browser regression, deployed ZAP and Lighthouse are NOT yet verified.
The working tree is an implementation in progress, not a seven-day completion claim.

## Supplied baseline and autocorrelation cross-check

[MEASUREMENTS.md](MEASUREMENTS.md) and data/processed/measurements.json record
the national-file nulls/duplicates, NCR yearly source totals, exact calendar-lag
autocorrelations under Z/M and 2023 audit baselines. Their separate eligible
cohorts are not substituted for the matched full harness. The supplied blend
cannot be reverified without specified weights and is not claimed as a measured
result. Run npm run data:prepare to regenerate these checks.
