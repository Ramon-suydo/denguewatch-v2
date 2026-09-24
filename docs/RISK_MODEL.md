# Risk model and city grid
Run `npm run risk:backtest` to reproduce [every paired prediction and city metric](risk-backtest.json) from the real local source files. Run `npm run app:setup` only against the intended database after reviewing the migrations; it applies pending migrations and refreshes caches atomically. No hosted changes were made for this task.

## Predeclared comparison
One-step rolling-origin evaluation: each target is a complete, unflagged monthly observation; train only on earlier complete source-label months. Require 24 training months, distinct city Q50/Q80 thresholds, and latest eligible month immediately before the target. Seasonality needs at least two observations in every calendar month. Evaluate both models on exactly the same eligible targets (325 across 17 cities). Exclusions mean this is not an estimate of accuracy on all months.
- Baseline B = (oldest + 2 × middle + 3 × newest eligible count) / 6.
- Seasonal ratio S = historical mean for the target calendar month / mean of the twelve calendar-month means. Month means receive equal weight.
- Fixed candidate C = .75 B + .25 B S. No weight tuning.
- Low <= training Q50; Medium <= training Q80; High > training Q80. Thresholds never include the target.
- Development: eligible dates before January 2020 (187 pairs). Final chronological holdout: 2020 (138 pairs).
- Retain only if MAE improves at least 5% in BOTH splits and in a majority of holdout cities. This gate was written before running the comparison.

| Metric | Trend | Candidate |
| --- | ---: | ---: |
| Development MAE (cases) | 139.91 | 134.08 |
| Holdout MAE (cases) | 49.36 | 39.35 |
| Holdout WAPE | 116.47% | 92.86% |
| Holdout tier agreement | 68.84% | 77.54% |

The candidate improved holdout MAE by 20.27%, but development by only 4.17%, failing the declared robustness gate. **Retain trend-only weights (100%, 0%, 0%, 0%).** Seasonality is promising, not demonstrated robust enough for adoption. High WAPE, small sample, pandemic-era holdout, incomplete source records, and retrospective eligibility checks limit generalization. This is temporal validation of archived records, not a reconstruction of real-time reporting availability, clinical validation, calibrated outbreak risk, or confidence intervals. No earlier saved backtest existed in this checkout; this establishes a reproducible baseline comparison.

## Explainable storage
`barangay_risk.inputs` records each factor's weight, contribution in case units, seasonal ratio and sample count, current calendar-month context, exclusion reasons, latest two monthly records, and selection metrics. Despite the requested table name, `scope='city'` is enforced: there are no barangay observations. Public reads only; refresh is owner-only. Paired predictions are also saved to `historical_forecast_backtest`; reruns upsert stable keys.

Current calendar seasonality is context separate from the dated forecast month. Refresh after ingestion and at month boundaries using `npm run forecast:refresh`; pages never recompute models. Current risk still expires at forecast-month end. The available historical series cannot establish 2026 conditions.

Community context compares last four COMPLETE weeks with preceding four using only published aggregate counts. All eight weeks must be published; absent/suppressed groups are never treated as zeros. No aligned historical community series exists to validate its incremental effect, so its weight is zero and it cannot elevate any tier, including High. This is intentionally not an unsupported nonzero composite. Do not mix current reports into a January 2021 estimate.

Weather remains an explicit zero-weight placeholder. The optional weather import/experiment was not performed; no weather accuracy claim or fabricated records.

## Grid
Mobile initial view is Grid; desktop Map. Explicit toggles preserve the user's choice until remount. All 17 cities remain visible, including absent cache records. Default risk ordering is High, Medium, Low, Insufficient, then name; alphabetical and descending monthly case count sorts are available. Latest known monthly counts use one source across cities; Manila's newer daily observations remain in its detail chart. Raw count direction includes date and a warning for partial/flagged periods; it must not be interpreted as comparable incidence. Community volumes stay separate, with suppression/empty/error states. Map assets and tiles are not loaded by a mobile grid visit.
