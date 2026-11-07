# Metro Manila classification method

## Scope and research label

Predict one next-week research threshold event per city, for the 17 NCR reporting units. This is not an official DOH outbreak declaration, diagnosis, individual infection risk or a barangay estimate. The cited Bangladesh patient-level IEEE R10-HTC 2020 study supplies only the requested DT/RF and 70:30 comparison protocol. The owner supplied IEEE document 9357035. Crossref verifies Sarma et al., "Dengue Prediction using Machine Learning Algorithms", DOI 10.1109/R10-HTC49770.2020.9357035. The publisher full text is access-blocked; detailed protocol fidelity still needs a full-text check. Its 79% accuracy is never presented as our result.

For city c, origin week t: threshold = max(mean(observed city cases through t) + k * sample SD(observed city cases through t), minimum). The target is 1 only when recorded cases at t+1 strictly exceed that threshold. Main k=1 and minimum=10. All nine k={0.5,1,1.5}, minimum={5,10,20} combinations are reported. First 26 calendar weeks are burn-in; SD uses ddof=1.

## Source and missing calendar weeks

The immutable DOH EPI CSV is filtered to NATIONAL CAPITAL REGION, Sundays 2016-01-10 through 2020-12-27. The two January 2021 source labels are excluded per the requested full-year cutoff; their completeness is not independently certified. Every recorded date has all 17 cities and no missing count fields. However, the calendar has three absent whole weeks: 2016-11-13, 2019-01-06, 2020-11-15. These are explicit missing values, never zeros. A sample is excluded if its eight-calendar-week feature window or next-week target contains a gap. Expanding statistics use only observed prior weeks. This differs from a prototype that shifts directly across missing dates.

The shared 70:30 cut is on eligible distinct TARGET weeks, pooling all cities. Training is the first floor(0.7*N) eligible weeks; testing is the remainder. The training-label end must be no later than the first test forecast origin. Actual boundaries/counts are generated in training.json/evaluation.json. The last source week remains 2020-12-27 even when its lag window is unscorable; unavailable replay forecasts must be shown as No data. Missing dates cannot be compressed into fictitious one-week lags.

## Features available at origin

Current cases and three calendar lags; means over four/eight calendar weeks; current / max(four-week mean,1); current / the current research threshold; ISO week number; rest-of-NCR current count and four-week mean; one-hot city identity. No future cases, target thresholds, target weather or participant reports enter features. Own-city counts are excluded from the rest-of-NCR features. Feature and label leakage tests perturb all future values and verify unchanged inputs/thresholds.

## Training and calibration

Three expanding-window folds operate on DISTINCT weeks inside chronological training. The fold assertion requires the final training target to be known by the earliest validation origin. DT grid: depths 3 through 8, leaves 5/15, balanced class weights. RF grid: 100/200/300 trees, depths 4/8, leaves 5/15, balanced_subsample. Fixed seed 20261026. Hyperparameters maximize mean fold balanced accuracy; ties retain grid order. No test result tunes hyperparameters.

A sigmoid/Platt logistic calibrator is fitted to the chosen configuration's out-of-fold training probabilities. ML decision operating points maximize validation balanced accuracy over 0.05..0.95 at 0.01 increments, with ties nearest 0.5. Persistence and seasonal baseline decisions retain their fixed above-threshold rules; calibrated scores do not redefine those rules. Majority uses training prevalence directly, with its majority decision preserved. The UI method is chosen by validation balanced accuracy among all five methods, including the baselines; test results are not used for this choice. Final base trees train on the full chronological training portion. Calibration drift remains a limitation.

Risk bands use the 50th, 75th and 90th percentiles of the selected method's validation probabilities. Equality enters the higher band. These validation-derived relative display bands are not clinical cutoffs. Displayed reliability uses held-out outcomes with numerator/denominator; sparse groups are explicit. Calibrated probabilities are research estimates, not guaranteed frequencies.

## Evaluation

Headline chronological 70:30; separate row-random stratified 70:30 comparison (optimistic because dates/cities overlap); majority, persistence and prior-year seasonal-history baselines; accuracy, balanced accuracy, precision, recall, F1, ROC-AUC, average precision (PR-AUC), Brier score, calibration curves and confusion matrices. The onset subset includes only cities not already above the origin threshold. Positive counts and confidence intervals accompany the onset claim.

Circular bootstrap blocks contain four consecutive observed target weeks with all available cities. Gaps can make observed-week blocks span longer than four calendar weeks. Fixed seed, 400 draws for headline/onset, 200 per-city/random/yearly and 100 sensitivity draws. RF-minus-rule F1 uses paired identical week draws. A 95% interval crossing zero means no clear improvement on that comparison. These are exploratory uncertainty estimates, not clinical validation.

Yearly robustness tests 2018, 2019 and 2020 with fresh inner expanding-window tuning using only earlier years. Sensitivities refit/calibrate only on each training partition with hyperparameters frozen from the main TRAINING search. The random comparison uses those frozen parameters and a separate validation subset within random training. No random-test outcomes select thresholds. Weather is not included in this implementation; its optional experiment is deferred without claiming benefit.

## Runtime, updates and reproducibility

Run `python -m venv .artifacts/ml-venv`, install `ml/requirements.txt` there, then `npm run ml:test`, `npm run ml:train`, `npm run ml:evaluate`, `npm run ml:export`. Set ML_PYTHON when using another Python executable. The three production commands regenerate frozen parameters, all evaluations/plots, and versioned JSON models/replay respectively. No model is silently retrained by a data upload.

JSON tree traversal casts input comparisons to float32, matching scikit-learn. `tests/ml-scorer.test.ts` compares all five methods on 600 actual rows: exact class and probability error <=1e-9. Exports contain data SHA, training window, feature order, calibration and operating points. Replay uses static predictions. Live scoring requires reviewed, complete 17-city source data and a latest week within 21 days; stale, future or incomplete data disable Live. New raw participant data is never used.

## Primary references

- scikit-learn calibration: https://scikit-learn.org/stable/modules/calibration.html
- TimeSeriesSplit: https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.TimeSeriesSplit.html
- Decision trees: https://scikit-learn.org/stable/modules/tree.html
- Random forests: https://scikit-learn.org/stable/modules/ensemble.html#forest

### Additional interpretation limits

In the onset subset, the fixed persistence rule cannot alert because currently-above rows are excluded. Its zero recall/F1 is a consequence of that definition, not evidence that every alternative is operationally useful. Compare actual positive counts and the seasonal baseline too. Week-ending counts are assumed available at the labelled origin for retrospective evaluation; release vintages and operational reporting delays are not independently verified. Live always shows the actual one-step target date, which may already have passed for a delayed upload.

### Deterministic forest scoring

Forest fitting may use two workers. Probability prediction uses one worker so tree probabilities are accumulated in a fixed order. Reproduction exposed differences up to 4.44e-16 in parallel prediction (unchanged model version and labels); serial scoring removes that execution-order variability. This changes no data split, target, hyperparameter search or validation criterion. Fresh exports and evaluation are regenerated after this correction.
