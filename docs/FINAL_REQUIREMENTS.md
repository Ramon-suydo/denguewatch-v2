> Historical project record. Current launch status and owner blockers are in IMPLEMENTATION_STATUS.md and LAUNCH_CHECKLIST.md. Older check counts, deployed states and instructions below are not current verification.

> Weather/factors replacement: [ENVIRONMENT_REQUIREMENTS.md](ENVIRONMENT_REQUIREMENTS.md) takes precedence over the original section below. See [ENVIRONMENT.md](ENVIRONMENT.md) for implementation and evidence.

# DENGUEWATCH v2: FINAL CODEX PROMPT (standalone; replaces all earlier prompts)

## ROLE
You are the Head/Principal Engineer, Data Scientist, and Senior UI/UX Designer for DengueWatch v2, a dengue risk-monitoring and community-reporting web app, being built for a thesis defense in 7 days and for real community use. Repo: `Ramon-sufile/denguewatch` (existing stack: Supabase, Node/TypeScript tooling; confirm in audit and keep it unless it cannot support this). You own correctness, security, privacy, accessibility, and the honesty of every number.

## NON-NEGOTIABLE RULES
1. **No fabricated data, ever.** Every number in the UI traces to a provided dataset, a cited external source, or a community report labeled "unverified." Delete all mockup placeholders (1,245 cases, 7 high-risk districts, 128 communities, "users online," backup widgets, fake alerts).
2. **Verify, don't claim.** Run tests, lint, build, and the evaluation after each step and show real output. Never write "improved accuracy" without a computed number. If something fails or cannot be verified, say so.
3. **Raw data is immutable.** Never edit files in `data/raw/`. All cleaning happens in scripts writing to `data/processed/`.
4. **Report negative results honestly.** If weather or any feature does not beat the baseline in backtests, say so and ship the simpler model. That is a valid thesis finding.
5. **Scope discipline.** Build MUST items fully before anything else. Cut scope, never tests, privacy, or honesty.
6. **Use only what you can verify.** Do not guess API endpoints or data sources. If you have no internet, write the fetch script, tell me exactly which file to download and where to put it, and continue with the data we have.

## THE SCOPE (decided; do not expand)
**Operational area: Manila city only.** The claim the app makes and the thesis defends:
> "We forecast dengue activity for Manila city 1 to 2 weeks ahead, test whether weather improves on a strong last-week baseline, show historical Metro Manila city patterns, and collect community reports as a separate, unverified early-awareness layer."

Do NOT claim a live Metro Manila forecast, barangay/district-level case data in Manila, or outbreak prediction beyond what the backtest shows.

## DATA WE HAVE (measured; re-verify in Step 0 and report any difference)
Files in `data/raw/` (and `data/geo/`):

**A. `Daily_Reported_Cases_of_Dengue_in_the_City_of_Manila_from_2018_to_2023.xlsx`**: sheet `Sheet4`, six side-by-side Date/Cases blocks (one per year) with spacer columns. 1,910 daily rows, 2018-01-01 to 2023-12-02, 14,635 cases, no duplicate dates. Every recorded day has at least 1 case; **no zero-case day is recorded**. 252 calendar days have no row (2018: 6, 2019: 12, 2020: 170, 2021: 49, 2022: 13, 2023: 2), clustered in low-activity periods, so absent days are probably zero-case days. **This is unconfirmed.**

**B. `Manila_weekly_MHD_2018_2023.csv`** (and `..._1.csv`, byte-identical; remove the duplicate): weekly aggregation of A (Sunday week-ending), 308 weeks to 2023-11-26. Columns `week_ending, week_start, cases_reported, days_reported, complete_week`. 5 weeks blank (0 days with rows), 94 weeks with fewer than 7 days with rows. `days_reported` counts days with a row, which is NOT proof of non-reporting. It drops the final partial week (2023-11-27 to 12-02, about 30 cases).

**C. `doh-epi-dengue-data-2016-2021.csv`**: DOH EPI weekly, HXL format (**row 2 is a tag row; skip it**; cast `cases` and `deaths` to numeric). 32,702 rows, 126 provinces/cities, 17 regions, Sunday week-ending, 2016-01-10 to 2021-01-10, columns `loc, cases, deaths, date, Region`. **NCR: all 17 LGUs, 259 weeks each, no duplicates.** NCR yearly cases: 2016 = 13,002; 2017 = 26,103; 2018 = 29,200; 2019 = 40,478; 2020 = 7,183; 2021 = 181 (January only). NCR deaths total 4,009. Manila City here: 2016 to Jan 2021, which extends the Manila series back to 2016.

**D. `ncr_dengue_monthly_with_rates.csv`**: monthly roll-up of C for the 17 NCR LGUs plus `population_2020` (e.g., Manila 1,846,513) and `incidence_per_100k` (monthly). Population source is not stated: label "unverified; confirm against PSA 2020 census" until confirmed.

**Cross-check A/B vs C (Manila, 151 overlapping weeks):** correlation 0.93; totals within about 0.3% (8,234 vs 8,255); mean absolute weekly difference about 13.6, max 78. They agree in total but not week by week. Document; do not silently choose.

**Baseline already measured (2023 holdout, complete weeks only, rolling origin):** 1-week-ahead MAE about 10 cases for "last week's value" and for a 4-week moving average (mean weekly cases about 52); about 12 for a blend; about 29.5 for same-week-last-year. Manila weekly autocorrelation: lag 1 = 0.85, lag 2 = 0.88, lag 4 = 0.76, lag 8 = 0.48, lag 52 = 0.34. Strong short-term persistence, weak year-to-year repeat. Weather must beat a very strong persistence baseline.

## STEP 0: AUDIT FIRST (day 1 morning; write `docs/AUDIT.md`)
- Per-file data dictionary (columns, geography, resolution, range, nulls, units) for all four files and `data/geo/`. Check whether `data/geo` contains the 17 NCR city boundaries; if not, find official boundaries, cite the source, and record the licence.
- Inspect `src/`, `scripts/` (including `check-ramp.mjs`), `supabase/`, `config/`, `tests/`, CI, dependencies (`npm audit`).
- **Secrets check:** run `git ls-files` and search the full git history for `.env.local`, anything under `certs/`, private keys, Supabase service-role keys, tokens. Confirm `.gitignore` covers `.env*` and `certs/`; confirm no service-role key can reach the browser. If any secret was ever committed, tell me immediately so I can rotate it.
- List every mockup element that conflicts with the data (see "Mockup fixes").

## DATA HANDLING
1. **Absent days, two scenarios, always both.** Build the weekly series from file A twice:
   - **Scenario Z:** absent day = 0 cases (reindex to every calendar day, fill 0, aggregate Mon to Sun).
   - **Scenario M:** absent day = missing; weeks with fewer than 7 days with rows are flagged unreliable and excluded from scoring.
   Run the full evaluation on both and report both. If conclusions differ, say so. Put the question "does a date with no row mean zero cases or no report?" in `docs/DATA.md` and on the Methodology page. The app states which scenario is displayed.
2. **Stitched Manila series (2016 to 2023):** DOH EPI weekly for 2016-01 to 2017-12 (and use it as a cross-check for 2018 to Jan 2021), daily-derived weekly for 2018 to 2023. One source per period; record the join date and rationale; run a sensitivity check using the other source for 2018 to 2020.
3. Write reproducible ingestion scripts with schema checks, date-continuity checks, duplicate checks, and `data/validation_report.md`. Unit tests for every transformation.
4. Final tables in versioned processed form (JSON/Parquet/DB tables): `manila_weekly` (with epi_week, source, scenario flags), `ncr_weekly` (17 cities), `ncr_population`, `weather_weekly`.

## WEATHER AND OTHER FACTORS (test, do not assume)
Build `scripts/fetch_*` with provenance recorded in `data/external/SOURCES.md` (URL, retrieval date, parameters, licence). Verify each source yourself before use. Candidates: NASA POWER daily point data, Open-Meteo historical (ERA5), CHIRPS/GPM IMERG rainfall; PAGASA if obtainable. Use Manila coordinates, aggregate to the same Monday-to-Sunday week, state clearly that these are reanalysis/satellite estimates, not station gauges.
Features (lagged only; at forecast time use only information then available): rainfall accumulations (lags 1 to 8 weeks), temperature, humidity; optionally ENSO index (NOAA ONI), typhoon-week flags, school-calendar flag, and a COVID regime flag (2020 to 2021) instead of deleting those years.
**Demographic and geographic factors** (population 2020, density, city boundaries, neighboring cities) are **constant within Manila**, so they cannot predict Manila over time. Use them for the historical Metro Manila comparison and incidence per 100,000, and say so. Do not feed constants into the Manila forecast.

## MODELING AND EVALUATION (the thesis evidence)
**Targets:** (A) cases 1 and 2 weeks ahead (report 4 weeks ahead as exploratory, with its larger error); (B) probability that next-week cases exceed an **endemic-channel alert threshold** computed from past data only.
**Models in one comparable harness:** naive (last week); 4-week moving average; seasonal naive; endemic-channel rule; regularized regression or Poisson/negative-binomial GLM with lagged features; one regularized tree-based model. No deep learning (sample too small; state this).
**Protocol:** expanding-window rolling-origin only, never random splits, no leakage. Test folds: 2018, 2019, 2022, 2023 separately; 2020 to 2021 reported separately under the COVID flag. Run on both absent-day scenarios.
**Metrics:** MAE, RMSE, MASE and % improvement versus naive with a bootstrap confidence interval (or Diebold-Mariano); alert precision, recall, F1, ROC-AUC, Brier score, lead time in weeks, false-alarm rate; prediction-interval coverage (do 80% intervals cover about 80%?).
**Ablation:** with/without weather, with/without each driver; show coefficients/importances with a correlation-is-not-causation caveat.
**Optional research (only after MUST items pass):** for 2016 to 2020, test whether lagged cases from other NCR cities improve Manila forecasts. The same-week correlation of Manila with the rest of NCR is about 0.92 but mostly reflects shared seasonality; only lagged out-of-sample gains count.
**Decision rule:** production model = simplest model not meaningfully worse than the best. Results in `docs/EVALUATION.md` (tables, forecast-vs-actual plots, error by horizon, limitations), regenerable with one command (`npm run evaluate`) with fixed seeds.

## PRODUCT: MUST SHIP
1. **API:** weekly series, year comparison, endemic channel, current risk level **with a one-sentence reason** (e.g., "Cases last week were higher than X% of the same weeks in prior years"), 1 to 2 week forecast with interval, probability of rise, data-quality flags, model version, data "as of" date. Risk thresholds are documented, computed from data, and tested.
2. **Public site (mobile-first, tested at 360px; WCAG 2.2 AA; PWA):**
   - **Home:** status card (level, reason, as-of date, what to do), Report button.
   - **Trends:** Manila 2016 to 2023, source bands, COVID period shaded, year comparison, forecast with interval.
   - **Metro Manila (historical):** city-level map and ranking by incidence per 100,000 for a selectable week/year, **permanent banner "data ends January 2021."** No forecast on this page.
   - **Prevention:** DOH "4S" guidance (verify wording and cite), warning signs for urgent care, "informational, not a diagnosis."
   - **Report a Case, Community Reports (aggregates), Methodology & Data Sources, Privacy Notice.**
   - English throughout; Filipino for Home, Prevention, and Report only (i18n-ready).
   - Every chart shows source and as-of date; loading, empty, error, offline and stale-data states everywhere.
3. **Community reporting (safe by design):** barangay dropdown (coarse location only), symptom-onset date, optional symptoms, optional short note with automatic PII stripping (phones, emails, addresses), explicit consent, no account, tracking code to withdraw. Reports are "community-reported, unverified," stored separately from DOH data, **never merged into official counts or the forecast**, and shown publicly only as aggregates with at least 3 reports per area/time window and delayed publication. Abuse controls: rate limiting, honeypot, CAPTCHA/proof-of-work, duplicate detection, burst quarantine. No history exists, so community reports are NOT a validated predictor; present them as awareness only and list their evaluation as future work.
4. **Admin (separate routes and layout):** login with strong hashing, MFA if time allows, roles (moderator/admin), moderation queue (approve/reject/merge), validated CSV upload with preview and rollback, audit log of every action.
5. **Privacy and security:** treat reports as sensitive personal information under the Data Privacy Act of 2012 (RA 10173). Data minimization, consent notice, retention purge job, deletion path, no third-party trackers, no precise location or IP stored, strict CSP and security headers, server-side schema validation, parameterized queries, secrets in env only, **Supabase Row Level Security on every table with tests proving the public role cannot read raw reports.** Docs: `docs/PRIVACY.md`, `docs/SECURITY.md`, `docs/THREAT_MODEL.md`. Flag anything needing review by a data-protection officer.
6. **Security evidence:** OWASP ZAP baseline scan on the deployed app (save the report), dependency audit with high/critical fixed, and written abuse tests (unauthenticated admin access, tracking-code guessing, XSS in the note field, spam burst, SQL injection) in `docs/SECURITY_TESTS.md`.
7. **Quality gates:** lint, type check, unit/integration/e2e tests, axe (zero critical), Lighthouse mobile report saved, CI on every push.
8. **Usability and defense kit:** `docs/USABILITY_PLAN.md` (5 task scenarios, SUS questionnaire, observation sheet, results template; leave results blank, do not invent them), `docs/PROTOCOL.md` (one-page response protocol for a health worker when reports spike), `docs/DEMO.md` (5-minute click-through), `docs/DEFENSE_QA.md` (honest answers: why simple models, why Manila only, why no district map, how false reports are handled, Data Privacy Act, limitations), and a fallback plan (screen recording and screenshots).
9. **Deployment:** live URL or one-command setup, seed data, README, demo admin instructions.

## WON'T (do not build)
Barangay/district case figures in Manila; a live Metro Manila forecast; weather forecasts for other cities; deep learning; SMS/email alerts; PDF export; fake KPIs or widgets; anything unverifiable.

## MOCKUP FIXES (senior UX standards)
- Replace the AI skyline hero with a purposeful status-first hero. Remove the pie chart; use line/bar charts with direct labels.
- Split public and admin navigation completely. Admin items (Data Management, Settings, Users) never appear publicly.
- Risk is never color-only (add icon + text label), colorblind-safe palette, contrast at least 4.5:1, base font 16px+, 44px touch targets, visible focus, keyboard navigation, charts with text summaries and data-table alternatives, reduced-motion respected.
- Risk copy is actionable and plain-language; remove jargon like "vector surveillance needed."
- Replace the district map with the NCR city-level historical map; remove Tondo/Sampaloc/Sta. Mesa/Ermita/Malate case figures. Define design tokens once; no one-off styling.
- Replace the undefined "risk index" (<50 / 50 to 74 / <75) with the documented data-driven levels.

## SCHEDULE (report evidence at the end of each day: what works, test output, what slipped, what you could not verify)
- **Day 1:** audit, secrets check, ingestion, validation, reconciliation, tests.
- **Day 2:** weather/external fetch, features, evaluation harness, first backtest results (both scenarios).
- **Day 3:** finalize model, API, risk logic; start public UI and design tokens.
- **Day 4:** public UI complete, PWA, community report form, moderation.
- **Day 5:** admin, RLS tests, security tests, deployment.
- **Day 6:** accessibility, Lighthouse, ZAP, usability fixes, docs.
- **Day 7:** buffer: bug fixing, demo rehearsal, final report. Do not start new features on Day 7.

## ACCEPTANCE CHECKLIST
- [ ] No fabricated number anywhere; no missing or absent day silently treated as zero in Scenario M, and the zero assumption is explicit in Scenario Z.
- [ ] Evaluation reproducible with one command; both scenarios; ablation of weather; honest written conclusion.
- [ ] Alerts evaluated with precision, recall, lead time, false-alarm rate.
- [ ] Metro Manila page shows only 2016 to Jan 2021 with the permanent date banner; no Manila-district figures.
- [ ] Public endpoints cannot return individual reports (tests including RLS); community reports never enter official counts or the forecast.
- [ ] No secrets in git history; `.env*` and `certs/` ignored.
- [ ] Admin routes blocked without auth and role (tests); admin actions logged.
- [ ] axe: zero critical; keyboard navigable; works at 360px; Lighthouse mobile saved.
- [ ] All docs listed above exist and match the code.
- [ ] Final report lists what was verified (with output), what was not, and open risks.