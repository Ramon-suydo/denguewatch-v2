# Read-only research API

Run `npm run evaluate` then `npm run data:publish`; `npm run dev` serves:
- `/api/v2/manila.json`: weekly scenarios, year comparison, past-only endemic
  research channel, historical forecasts/80% intervals, empirical probabilities,
  flags, model version and as-of date. Current risk is explicitly insufficient.
- `/api/v2/ncr.json`: official NCR weekly rows, unverified fixed population
  denominators, real 17-city geometry, historical-only banner and provenance.
- `/api/v2/backtest.json`: persistence actual-versus-predicted test records.

These versioned public JSON resources are static exports, not real-time APIs.
No community report is read by this publisher or returned by these resources.
No current 2026 observations are supplied. Default public model is persistence;
the frozen 2017 ridge candidate and all negative results remain in EVALUATION.md.
The conservative public promotion decision follows evaluation and is not claimed
to be preregistered. Population rates are descriptive, not current incidence.
Raw files never change; `data/processed/` contains reproducible evidence.

Evaluation `falseAlarmRate` is FP / (FP + TN), the false-positive rate.
The fraction of issued alerts that are false is 1 minus precision.
