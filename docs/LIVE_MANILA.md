# Live Manila provisional estimates

This feature lives on `feat/live-manila`. It combines the latest remote main with the locally completed UI overhaul; the UI overhaul was not yet merged remotely when work began. No push, hosted migration, report activation or external data verification is implied. Test locally and self-review before merging: main deploys to Vercel.

## Source and verified file facts

The project team says these figures were manually transcribed from Manila Information Office Facebook posts of cumulative dengue cases since January 1, then cleaned separately. This provenance is **team-reported, unofficial and unverified**. No public post links or screenshots were supplied. The `observed` field means only “weekly value is not flagged estimated”; it does not mean independently verified.

The supplied immutable CSV contains 13 consecutive Monday–Sunday weeks, 2026-07-27 through 2026-10-25. All report-Monday fields are the following day. All twelve checkable differences agree with consecutive cumulative totals; the first weekly value, 54, cannot be checked because its preceding total is absent. Seven cumulative totals are not flagged estimated and six are estimated. Four weekly values are not flagged estimated (54, 267, 226, 226); nine are estimated. Interpolated values are not independent observations.

Three estimated weeks (ending 2026-08-23, 2026-09-20, 2026-10-04) have blank original notes. A fingerprinted legacy manifest supplies a factual validation annotation: the weekly flag is estimated and the preceding cumulative total is estimated; the interpolation method and source evidence remain unknown. `raw_note` preserves the original blank. This is not an invented source explanation. All legacy rows retain `source_url: null`; new rows require a public Facebook post HTTPS URL and a note for any estimated value.

| Week ending | Weekly cases | Weekly estimated | Post link / screenshot |
| --- | ---: | --- | --- |
| 2026-08-02 | 54 | No; unverified | NEEDS OWNER |
| 2026-08-09 | 81 | Yes | NEEDS OWNER |
| 2026-08-16 | 87 | Yes | NEEDS OWNER |
| 2026-08-23 | 94 | Yes | NEEDS OWNER |
| 2026-08-30 | 173 | Yes | NEEDS OWNER |
| 2026-09-06 | 225 | Yes | NEEDS OWNER |
| 2026-09-13 | 206 | Yes | NEEDS OWNER |
| 2026-09-20 | 184 | Yes | NEEDS OWNER |
| 2026-09-27 | 198 | Yes | NEEDS OWNER |
| 2026-10-04 | 202 | Yes | NEEDS OWNER |
| 2026-10-11 | 267 | No; unverified | NEEDS OWNER |
| 2026-10-18 | 226 | No; unverified | NEEDS OWNER |
| 2026-10-25 | 226 | No; unverified | NEEDS OWNER |

Owner screenshots belong under `docs/evidence/live-manila/`, excluded locally by `.git/info/exclude`. Teammates must add that exclusion in their own clone before adding screenshots. They are never served by the app or included in the review bundle. Public UI captures use the separate `docs/evidence/live-manila-ui/` folder. Private evidence paths are stripped from public JSON and public SQL exports.

## Independent pipeline and definitions

`npm run live:ingest` reads only the named raw CSV and the existing processed historical Manila file. It writes `data/processed/manila_live_weekly.json`, its public aggregate projection at `public/live-manila/weekly.json`, and a frozen historical reference at `public/live-manila/reference.json`. Original raw files stay local. Ingestion rejects malformed/invalid ISO dates, wrong weekday boundaries/report Mondays, duplicates, gaps, decreasing totals, mismatched differences, missing flags, unknown fields and unexplained estimates. The legacy exception is restricted to the exact input fingerprint. It cannot exempt newly added rows.

The historical series ends in December 2023; the new series begins in July 2026. That gap is not filled. No live rows enter historical preparation, ML training, targets, thresholds, evaluation or Replay. A committed manifest tests byte identity for **121 pre-existing historical/model/source/export artifacts** against the branch prerequisite checkpoint `11daef80725e0d024daf48b18d519ca1dc0b0995`. The raw 2026 CSV remains ignored. The new table/versioned code path contains aggregate Manila counts only, never participant reports.

No model is trained on these 13 points. The 17-city random forest requires features unavailable for 2026. Its existing evaluation is unchanged. The provisional count reference is persistence: repeat the latest week's count for each horizon. Other cities have no recent data in Live; Replay keeps their original historical probabilities and outcomes.

## Reproducible ranges and coverage

Use Scenario M: reliable, complete historical weeks only, excluding null counts and partial boundaries. There are 312 such weeks. Restrict origins to at least 100 cases and pair each with the exact calendar week one or two weeks later; missing outcomes are excluded, not shifted or filled. There are 42 qualifying origin weeks, **40 valid one-week pairs and 42 two-week pairs**. The different n values correct the assumption that every origin has a complete next-week outcome.

For each horizon compute `cases(t+h) / cases(t)`. Use linear type-7 quantiles: sort the ratios, interpolate at `(n−1)q`, with q = 0.1, 0.5, 0.9. Multiply each quantile by the latest weekly count. Round the lower bound down, the middle to the nearest integer and the upper bound up. These are historical empirical 10th–90th ratio ranges, **not calibrated 80% prediction intervals or guaranteed bounds**.

Leave-one-year-out coverage: hold out all origin pairs from one calendar year; remove training pairs whose origin **or target** enters that held-out year. Fit quantiles using only the remaining years, and check the held-out outcomes inclusively against those limits. Pool the covered outcomes across folds. This retrospective sensitivity analysis is not a prospective validation of 2026 and not a claimed ML accuracy score. Fold-level n, coverage and persistence MAE are in the generated JSON.

| Origin threshold | Horizon | Pairs | Ratio p10 / p50 / p90 | Held-out covered / n | Coverage |
| ---: | ---: | ---: | --- | --- | ---: |
| 80 | 1 week | 67 | 0.70531 / 0.94326 / 1.26215 | 52 / 67 | 77.61% |
| 80 | 2 weeks | 72 | 0.64079 / 0.90610 / 1.34687 | 55 / 72 | 76.39% |
| 100 | 1 week | 40 | 0.71792 / 0.95678 / 1.21037 | 29 / 40 | 72.50% |
| 100 | 2 weeks | 42 | 0.66518 / 0.89978 / 1.34687 | 32 / 42 | 76.19% |
| 150 | 1 week | 12 | 0.73405 / 0.96209 / 1.20040 | 7 / 12 | 58.33% |
| 150 | 2 weeks | 12 | 0.63342 / 0.80036 / 1.10105 | 4 / 12 | 33.33% |

The primary ranges cover less than the nominal 80% in held-out years. Threshold-150 results are especially unstable and poorly covered. The preselected threshold remains 100; no threshold was chosen to improve these results. No silent extra widening occurs when the current week is estimated; that condition is disclosed.

At the supplied latest value of 226 (week ending 2026-10-25), the generated one-week range is **162–274**, middle 216, target 2026-10-26 through 2026-11-01. The two-week range is **150–305**, middle 203, target 2026-11-02 through 2026-11-08. Persistence is 226 at both horizons.

## Direction and scale context

Take the last three weekly values not flagged estimated. Compute the geometric average weekly rate from the first to last using their actual calendar separation, preserving skipped estimated weeks. The steady tolerance is the median absolute one-week relative change among the same complete historical origin-count-at-least-100 pairs: **17.8535%**. A rate above that band is Rising; below the negative band is Falling; otherwise Steady. Fewer than three observations means Unavailable. This tolerance is descriptive, not statistically significant trend detection. For 267 → 226 → 226, the weekly rate is −7.9977%, hence **Steady**.

The context percentile is the strict fraction of complete Scenario M weekly counts below the latest count. At 226 it is **99.6795%**, displayed as 99.7%. Historical maximum is **257**. The latest 226 does **not** exceed it; the supplied 2026 peak **267** does. The UI says conditionally that the supplied peak exceeds the historical maximum if confirmed. Adviser/owner review is pending. No outbreak declaration follows from this comparison.

Scenario M's historical 95th percentile is 140.45; nine of the thirteen new values exceed it. Its largest sum of included complete weekly counts in a calendar year is 3,761 in 2019. This is **not an independently complete annual total**: Scenario M omits incomplete weeks. Scenario Z's 2019 included-week sum is 3,961. The current cumulative 4,274 is numerically higher than both, but source definitions, coverage, suspected/confirmed status and revisions are unverified. Do not call this a validated year-to-year comparison. The original task's “higher than any full year” wording is therefore not used.

This method extrapolates historical relationships to an unofficial source in 2026, across a long data gap and potentially different definitions. The recent peak is outside the observed historical weekly range, although the latest week's level itself is within it. There is no evidence that the ranges are calibrated at this source/scale.

## Teammate update procedure

1. Obtain the public source post, report Monday, cumulative total and screenshot. Confirm that the total still means the same since-January-1 population/definition. Do not silently reset after year-end or edit a prior total.
2. Use an authorized AAL2 admin session in the existing dataset upload area. The new weekly form previews the next Monday–Sunday week. Enter the posted total, public post URL and following report Monday. Flag an interpolated total and explain it. A difference touching an estimated prior total remains estimated and needs a note. Never label the whole change since an earlier observed anchor as a single observed week.
3. The CSV path accepts **append rows only**, using `public/live-manila-append-template.csv`: `total_since_jan1,report_monday,source_url,total_is_estimate,note,evidence_file`. It computes weekly values and boundaries, rather than accepting typed forecast numbers. Each new total must be non-decreasing and each appended week consecutive. A new-year reset or historical correction needs a separately reviewed change.
4. Preview, stage, independently self-review, then publish. Stage/publish/rollback have staff audit entries. Direct table mutation is denied. Publication checks that the reviewed parent is still current. Rollback restores the previous published version, or the shipped baseline. No reports gate changes.
5. Hosted migration `20261028000100_live_manila.sql` must be reviewed and installed by the owner before hosted updates work. **NOT VERIFIED / NEEDS OWNER**: hosted migration, Auth/MFA and publication execution. The local PostgreSQL harness exercises the real SQL, not hosted services.
6. For the initial raw file, run `npm run live:ingest` and inspect its real output. This command is not a general overwrite/correction tool: only the exact supplied legacy fingerprint can omit links and three notes. New updates should use the append UI/CSV flow. Publish validated aggregate exports through the usual reviewed branch/build process if updating the shipped fallback.

Freshness uses Asia/Manila dates and the source `last_week_end`: age 0 through 14 calendar days is eligible for Live. Future dates are ineligible. From 2026-11-09 the supplied seed falls back to Replay unless a newer version is available. The app rechecks the date/source every minute; “Live data is out of date” appears when stale. Source fetch failure leaves Replay usable. Offline mode does not promise live hosted updates.

## Owner actions and release limits

- **NEEDS OWNER:** all 13 post URLs/screenshots, first week's prior cumulative total, missing interpolation explanations, counting-definition verification with the Manila Health Department or Information Office, and permission to republish.
- **NEEDS OWNER:** adviser review of the conditional peak comparison and provisional range wording; weekly update responsibility and review routine.
- **NEEDS OWNER:** review machine-assisted Filipino wording. Public English/Filipino values and labels are paired; this is not a certified native-language review.
- **NOT VERIFIED:** prospective accuracy, hosted publication/migration, real iOS/device and screen-reader review. This is not an official DOH product or medical/outbreak classification.
- Existing owner gates (credential rotation, controller/contact, photograph permission and DPO/collection authorization) remain in place. Community submissions remain closed.

Actual commands, outcomes and screenshots are recorded separately in `docs/evidence/live-manila-checks.md`. Earlier UI evidence is historical; it is not substituted for current checks.

Health-copy reference: [WHO dengue fact sheet](https://www.who.int/news-room/fact-sheets/detail/dengue-and-severe-dengue), checked 2026-10-28, supports mosquito protection, removing water-holding habitats and urgent care for severe warning signs. This is separate from the unverified Manila figures; no Facebook post was verified by that check.

Publication implementation: historical ratio quantiles, coverage folds and tolerance are generated at build time and frozen in the private migration seed. The public RPC generates projection JSON from validated versioned rows using those frozen values; it never refits the quantiles. The browser renders that JSON. A real-SQL parity test compares ranges, metadata and sensitivity against the reproducible script, including restoration of an earlier published version. `npm run live:check` verifies the public artifact, frozen SQL payload, reference series and all 121 fingerprints; it is a prebuild gate and does not require the local raw 2026 CSV. Dashboard mode controls share one state.

For interpolated weeks, owner evidence must identify the anchor posts; there may be no post for the interpolated date itself. Do not invent a week-specific post link. The initial CLI reproduces the supplied 13 rows; append CSV updates use the authenticated admin flow described above.

Cross-platform integrity: `protected-canonical.json` records SHA-256 of the prerequisite Git blobs and the existing Git text checkout policy. Text CRLF checkout conversion is handled only for those text paths; `-text`/binary sources remain byte-exact. The portable build guard requires neither Git nor the original local 2026 CSV. The original local before/after SHA-256 record separately confirms all 121 working files are literally unchanged; none was rewritten for portability. A Linux-style copy with Git absent from PATH passes the actual guard, and a unit test rejects raw-source line-ending changes.
