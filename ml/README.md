# Reproducible NCR models

Create `.artifacts/ml-venv` using Python 3.12 and install the pinned `requirements.txt`. `scripts/ml-run.mjs` detects that environment; alternatively set `ML_PYTHON` to your Python executable.

Run `npm run ml:test`, `npm run ml:train`, `npm run ml:evaluate`, `npm run ml:export`. Evaluation takes several minutes because it includes week-block bootstrap intervals, all nine label sensitivities and three nested yearly validations. All input comes from the committed DOH CSV; there are no network or hosted writes. Private joblib training objects stay ignored and local; runtime exports are auditable JSON, never uploaded pickle files.

See docs/ML_METHOD.md for the source gaps, label definition, exact split and calibration protocol. docs/ML_EVALUATION.md and data/processed/ml/evaluation.json are generated from actual results. Prototype numbers do not select or replace results.

The Dashboard defaults to the first held-out week, without selecting it for favorable outcomes. Replay includes every calendar week through the source cutoff, with explicit No data rows when feature or target weeks are missing. The scorer parity fixture covers 600 actual rows across all five methods. Models are not retrained on upload; newer counts update past-only features and must pass the Live gate.
