# Weekly forecast v1 (defense research estimates)

Run `npm run forecast:backtest` from the repository root. It makes no hosted
writes. It reads only the weekly NCR source for modeling, checks its checksum
against the existing approved audit (or the published v1 fingerprint), validates
headers, Sunday labels, nonnegative integer cases, unique LGU/date keys and NCR
geography, then regenerates:

- `src/data/weekly-forecast-v1.json`: bundled forecasts, metadata, all metrics and
  availability counts; no live model computation or database write on page load.
- `docs/weekly-backtest-v1.json`: versioned JSON with a column schema and all
  per-origin model predictions, actuals, interval bounds and training endpoints.

After a confirmed source-mapping/audit update, the workflow is
`npm run data:audit` -> `npm run ingest` -> `npm run forecast:backtest`.
New source names/granularities still require an approved mapping; the existing
auditor deliberately rejects unreviewed changes. The backtest command reads the
approved weekly raw file, not a mixture of Supabase sources. It does not promote
changes into hosted risk caches or overwrite `forecast:refresh` (legacy monthly
risk job). Review the new version and its recent-period evidence before promotion.

## Data and exact gap policy

4,403 NCR weekly rows, 17 LGUs, source labels 2016-01-10 through 2021-01-10.
No monthly CSV, Manila daily source, community, weather, population or deaths
are modeling inputs or targets. Death counts are inspected only to reproduce
the existing audited `deaths_exceed_cases` exclusion: 155 flagged rows are
unavailable to fitting, lag features, calibration and scoring. Case peaks on
other rows are retained. This preserves the source-review policy; it is not a
claim that their case counts have been proven wrong.

The three internal weekly gaps remain absent calendar slots. Every lag uses an
exact date, never the previous available row. No zero filling, interpolation,
Monday shifting, onset-date inference or inferred start/end-of-week semantics.
A missing target or required lag makes a prediction unavailable. The comparison
uses targets supported by ALL three models, and reports the paired and calendar
target counts. Results cannot be generalized to excluded observations without
further source review. Zero case values in valid observations remain zeros.

## Models

- Seasonal naive: target label minus exactly 52 weeks (364 days). No fallback if
  that observation is missing/suspect. This is a weekly annual approximation,
  including across years with 53 Sunday labels, not ISO-week alignment.
- Four-week moving average: equal mean of origin, origin-1/-2/-3 calendar weeks;
  held constant for the 1-, 2- and 4-week forecasts. All four must be available.
- Ridge: separate LGU and direct horizon regressions on log1p cases. Features
  are log1p counts at origin and three earlier labels, target-52, plus annual
  sine/cosine harmonics 1 and 2. Training-only standardization, fixed lambda=10,
  unpenalized intercept, at least 52 complete training examples. Predictions
  use nonnegative expm1 without lognormal bias correction. The transform can
  bias predictions low; large outbreaks and reporting shifts remain difficult.

No heavy dependency or hyperparameter search was added. Ridge is a small,
regularized lag model that can be refitted at every origin.

## Chronological evaluation and selection

Expanding training through origin t only; forecast t+1/t+2/t+4, then advance
one calendar week. Ridge training labels cannot exceed t. No random splits.
All three methods are evaluated at the same supported targets. No target or
later outcome enters that origin's fitting, scaling or uncertainty calibration.

2018 is development/calibration, and is explicitly NOT reported as held-out.
Before evaluating 2019 onward, the default is frozen from 2018 one-week MAE:
ridge must improve at least 5% over BOTH baselines and beat both in a majority
of LGUs; otherwise choose the lower-MAE baseline. One global method is selected
for all LGUs/horizons, not a hindsight winner per city. The current artifact
selects ridge. Selection is independent of 2019 onward test outcomes.

The 2019-onward test is walk-forward, not a fixed forecast made in 2018: an
observation can enter later training only after its source label is reached.
There is no availability/vintage metadata proving when DOH actually published
these records; this is a source-label simulation, not a demonstrated live
forecasting result. The 2020–2021 period is flagged as potentially distorted
reporting during COVID. Metrics include all test targets, 2019-only (without
COVID-period targets), and COVID-only. The exclusion is from scoring, not from
subsequent rolling training history. No causal COVID effect is estimated.

MAE/RMSE are in weekly cases. sMAPE is mean(200*|actual-prediction| /
(|actual|+|prediction|)); both zero contributes zero. Skill is
100*(naive MAE - model MAE)/naive MAE, undefined if naive MAE is zero.
Overall metrics pool all LGU-target observations. Case errors can be dominated
by larger cities; sMAPE is unstable near zero. None is a clinical accuracy rate.

## Prediction intervals

Signed out-of-sample residual quantiles per LGU/model/horizon, using only earlier
origins whose target labels have arrived by t. No in-sample errors or future
multi-step residuals. At least 30 observed residuals are required; otherwise
intervals are unavailable. Empirical 10th/90th and 2.5th/97.5th percentiles give
nominal 80% and 95% intervals; case-count bounds are clipped at zero. Coverage
is scored on earlier calibrated forecasts only; interval N is reported.
This empirical procedure has no guaranteed finite-sample or shift robustness.
The UI flags coverage more than 10 percentage points below nominal and shows
coverage even when that threshold is not crossed.

## Headline test results (paired targets)

| Horizon | N per model | Seasonal-naive MAE | 4-week mean MAE | Ridge MAE | Ridge 80% coverage | Ridge 95% coverage |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 week | 1,462 | 22.58 | 11.23 | 8.82 | 79.75% | 92.54% |
| 2 weeks | 1,462 | 23.79 | 14.32 | 9.94 | 78.04% | 91.31% |
| 4 weeks | 1,448 | 25.21 | 19.99 | 12.37 | 75.07% | 89.16% |

At one week ridge has lower MAE than seasonal naive in 17/17 LGUs, with 60.95%
skill. It is also 21.46% better than the four-week mean on overall MAE, but
sMAPE is WORSE: 68.22% versus 64.95% for the mean (93.77% seasonal naive).

Without COVID-period targets (2019 only), one-week ridge MAE is 12.39 versus
21.85 seasonal naive and 16.23 four-week mean; coverage falls to 71.43%/88.22%.
At four weeks in 2019, ridge coverage is 68.67%/83.71%, materially below nominal.
Do not present good all-period averages as proof that intervals work reliably
through outbreaks or reporting changes.

## UI scope and limits

The dashboard and LGU pages use the bundled weekly cache for their primary
forecast/performance panel. Historical chart/incidence source selectors remain
available; the dashboard labels its separate monthly risk overview as legacy.
The Map/Grid still displays the previously reviewed legacy risk distribution,
not a warning tier derived from this new count model. No current warning claim
or clinical threshold has been created. Counts forecast labels 2021-01-17,
2021-01-24 and 2021-02-07 and cannot describe 2026 conditions. Exact DOH/FOI
citations still await source-owner review. Real community submissions stay closed.
