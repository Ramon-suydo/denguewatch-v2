# Environment: sources, tests and honest limits

This addendum replaces the weather/factors section of FINAL_REQUIREMENTS.md. The exact request is preserved in ENVIRONMENT_REQUIREMENTS.md. No raw disease files or hosted schema changed.

## Reproduce offline from caches

Install Node 22 dependencies with `npm ci`, Python dependencies with `python -m pip install -r requirements-environment.txt`. Obtain source caches once with `npm run environment:fetch`. Then set `ENV_OFFLINE=1` and run `npm run evaluate` (PowerShell: `$env:ENV_OFFLINE="1"; npm run evaluate`). Evaluation performs no provider calls. It generates the original harness plus the separate environmental ablation, geographic effect sizes and figures. `npm run environment:prepare` reruns just the addendum.

A clean clone needs the ignored public-provider caches. Transfer/download the exact URLs and matching receipts in data/external/SOURCES.md and data/processed/elevation_sources.json into data/external/. Required names: era5-manila-2015.json through era5-manila-2023.json; power-manila-2015-2023.json; osm-ncr-water.json; srtm90m-grid-0.json through srtm90m-grid-2300.json in steps of 100; each with .provenance.json. `environment:fetch` creates and validates receipts. Cache bytes are hashed; missing/bad data fails instead of being fabricated. No API keys are needed.

## Sources and weekly alignment

See [exact requests, timestamps, licences and hashes](../data/external/SOURCES.md). ERA5 primary features use Asia/Manila civil dates, 24 hours/day, seven complete Monday-Sunday days/week. Rain days use a fixed >=1mm/day definition. Weekly rainfall is total mm; temperature mean/min/max Celsius; humidity mean percent. Incomplete weeks and invalid/fill values are rejected. The single Manila point does not measure station rainfall or resolve NCR cities. ERA5 grid about 25km; NASA POWER meteorology 0.5 by 0.625 degrees.

NASA daily LST solar-swath cross-check: 469 paired weeks; rainfall Pearson r 0.575174, temperature r 0.865531; rainfall MAE 35.036 mm/week, temperature MAE 2.277 Celsius. LST versus civil-day boundaries, different grids, downscaling and model bias limit agreement. This is not station validation, and POWER is not blended into features.

## Frozen lags and small regularized models

AR(2) log1p ridge, fixed L2=20, standardization from each training prefix only; >=32 training pairs. COVID indicator in all AR variants. Lag selection frozen from 2016-2017 only; no 2017 calibration scores reused.

Maximum absolute log-case Pearson association in 2016-2017 training only, tie earliest; rainfall windows 1/2/4/8 selected there too. No test years consulted. Associations are confounded by season, not causal.

- Z: rain lag 3, temperature lag 1, humidity lag 3, rainfall rolling window 8 weeks; fixed cutoff 2017-12-31.
- M: rain lag 3, temperature lag 1, humidity lag 3, rainfall rolling window 8 weeks; fixed cutoff 2017-12-31.

All rainfall/temperature/humidity lags 1-8 and rainfall windows 1/2/4/8 are evaluated on training data only. The selected lag is frozen for all test horizons. Seasonal correlations are confounded; selection is a simple research heuristic, not optimal lag discovery. No multiple-testing correction or nested lag-tuning claim. Both scenarios have identical 2016-2017 training labels, hence identical lag choices.

Season adds June-November flag and sin/cos; weather adds selected rainfall, temperature and humidity lags, selected rainfall window, >=1mm rain days and weekly temperature min/max at lag 1. Combined adds a fixed research cumulative-200mm onset proxy, not PAGASA onset. No-engineered combined variant drops rainfall roll/rain-day/min/max/onset engineering.

At most 15 inputs in the combined ridge (2 case lags, COVID, 3 calendar terms, 3 selected weather lags, 4 weather summaries, 2 onset terms). Covariates from a weather week ending after origin minus one week are never used. The cumulative-200mm proxy uses fully contained current-year weeks only; missing weeks invalidate it. Threshold 200mm and cap 26 weeks are fixed research definitions, not locally validated meteorological onset or PAGASA criteria. No test years select them.

Optional thermal index omitted: no verified parameter curve is implemented; never labelled tested.

No optional ENSO, typhoon, satellite or school-calendar feature was added. No environmental feature is promoted to the public model because the primary evidence is inconclusive.

## Ablation findings

Full numeric yearly/COVID/pooled MAE, RMSE, MASE, moving-block 95% skill CI, precision/recall/F1/AUC/Brier/FPR, interval coverage and episode lead: [ENVIRONMENT_RESULTS.md](ENVIRONMENT_RESULTS.md). Every model shares support within scenario and horizon, but this support differs from the original 8-lag harness. Do not compare their raw MAEs as an ablation.

|Scenario|1w persistence MAE|1w AR|1w season|1w weather|1w combined|
|---|---:|---:|---:|---:|---:|
|Z|10.326|11.212|10.753|11.083|10.891|
|M|14.024|15.072|14.343|15.185|14.914|

Season improves pooled one-week AR MAE by about 4.1% (Z) and 4.8% (M), yet remains worse than persistence. Unlike the supplied crude estimate, season worsens AR in 2022 and 2023 under this specification; it helps in 2018/2019. Some individual year/model point estimates beat persistence. No tested environmental variant establishes a positive lower 95% skill bound at 1 or 2 weeks in either scenario. This is inconclusive evidence, not proof of no effect.

Exploratory four-week season and no-engineered combined variants have positive lower skill bounds in both scenarios in this run. Those gains do not justify a 1/2-week operational claim or promotion: exploratory horizon, multiple comparisons, selective M support and retrospective weather vintages remain limitations.

The original all-lag weather regression finding remains valid on its separate cohort; the expanded controlled experiment is reported alongside it, not substituted silently.

## Monthly profile recheck

|Month of Sunday ending|Complete-row N|Mean cases/week|
|---:|---:|---:|
|1|26|53.808|
|2|29|43.690|
|3|28|29.393|
|4|20|27.200|
|5|21|22.810|
|6|23|29.957|
|7|30|49.600|
|8|24|95.250|
|9|25|122.120|
|10|31|92.774|
|11|29|72.069|
|12|26|49.846|

April/May means reproduce approximately 27/23 cases per week. August-October are about 95/122/93 in this complete-row specification, rather than the supplied 85-113 range. The weekly end-date assignment, source stitch, coverage and exclusion policy are explicit. A monthly profile does not measure a 2-3 month causal lag or establish the example 4-12 week warning claim; the app therefore uses calendar context and prevention guidance without asserting that delay. The descriptive profile includes test-period history but never selects model inputs.

## Geographic context (exploratory, n=17)

OSM contemporary mapped waterways and water bodies, excludes coastline from distance buffers; 200/500m UTM buffers (8 segments/quadrant), 1m geometry simplification and clipped to city geometry; centroid-to-nearest mapped river. Incomplete mapping is not absence of water.

USGS SRTM90m via Open Topo Data, bilinear interpolation; systematic 500m grid centers inside polygons; sampled mean and fraction below 5m, NOT complete raster zonal statistics or flood hazard. DSM/vertical errors and coastal/ocean zeros can dominate a 5m cutoff.

UTM 51N polygon area from official HDX/NAMRIA boundary geometry, checked against WGS84 geodesic area within 0.3%; derived area, not a PSA land-area statistic.

2025 boundary / 2026 OSM / circa-2000 SRTM / 2020 population versus 2016-2019 disease observations; no historical harmonization.

4000 iid city bootstrap resamples, seed 20261025; percentile 95% interval; spatial dependence not modeled, very low power, exploratory effect sizes without p-values.

Population denominator unverified; density, income, health-seeking behavior, reporting and mapping quality confound these ecological associations. No causal inference.

|Layer|Spearman rho|95% bootstrap CI|N|
|---|---:|---|---:|
|water_share_200m|-0.044|-0.620 to 0.480|17|
|water_share_500m|-0.213|-0.677 to 0.312|17|
|centroid_river_distance_m|-0.189|-0.686 to 0.386|17|
|sample_mean_elevation_m|-0.240|-0.687 to 0.313|17|
|sample_share_below_5m|-0.109|-0.638 to 0.419|17|
|density_per_km2|-0.020|-0.595 to 0.489|17|

All six geographic intervals cross zero. No geographic layer is claimed to forecast or cause dengue. Population density uses the unverified supplied 2020 denominator; the evidence remains provisional until PSA verification. Mean incidence is the mean of observed DOH weekly cases per fixed 100,000 population in 2016-2019, not zero-filled absent weeks or a current rate. There are 206 recorded source weeks per city.

Aedes aegypti mainly breeds in small standing-water containers near homes, such as drums, tires and pots; flowing rivers are not the principal breeding habitat. Water proximity, low elevation and flooding are indirect hypotheses only.

Official flood hazard omitted: no licensed machine-readable city-comparable hazard layer was verified. No household or barangay-risk overlay.

No household risk map or optional barangay overlay was built. City context can be shown/hidden beside the historical comparison; no layer changes the forecast.

## Figures and descriptive drivers

- [Training-only lag correlations](figures/weather-lag-correlations.png)
- [Monthly profile](figures/monthly-case-profile.png)
- [Environment ablation by horizon](figures/environment-ablation.png)
- [Geographic scatterplots](figures/geographic-context.png)

Standardized final-fit coefficients are descriptive only. Correlated weather variables, seasonal covariates and a small sample make attribution unstable; these coefficients do not select the deployed model.

|Scenario|Combined model feature|Standardized log-target coefficient|
|---|---|---:|
|Z|log_cases_0|0.55846|
|Z|log_cases_1|0.29559|
|Z|covid_2020_2021|-0.10561|
|Z|rainy_Jun_Nov|0.00361|
|Z|annual_sin|-0.04962|
|Z|annual_cos|-0.01499|
|Z|rain_lag_3|0.04802|
|Z|temperature_lag_1|-0.01478|
|Z|humidity_lag_3|0.00269|
|Z|rain_rolling_8|0.02534|
|Z|rain_days_lag_1|0.03400|
|Z|temperature_min_lag_1|-0.00353|
|Z|temperature_max_lag_1|-0.03242|
|Z|rain_200mm_reached|-0.00623|
|Z|weeks_since_200mm_capped_26|-0.02617|
|M|log_cases_0|0.30474|
|M|log_cases_1|0.18008|
|M|covid_2020_2021|-0.00730|
|M|rainy_Jun_Nov|0.00191|
|M|annual_sin|-0.08355|
|M|annual_cos|-0.06153|
|M|rain_lag_3|0.03472|
|M|temperature_lag_1|-0.00976|
|M|humidity_lag_3|0.02154|
|M|rain_rolling_8|0.02046|
|M|rain_days_lag_1|0.00804|
|M|temperature_min_lag_1|-0.02455|
|M|temperature_max_lag_1|-0.01703|
|M|rain_200mm_reached|0.03707|
|M|weeks_since_200mm_capped_26|-0.05142|

## Daily refresh and actual fallback

`npm run weather:refresh` is a server-side filesystem job. It persists a 24-hour attempt timestamp (including failures), locks concurrent refreshes, rate-limits requests and caches raw responses with receipts. A successful refresh of this revision returned a completed historical weather week; inspect public/api/v2/weather.json for its date. No browser calls a provider and no viewer coordinates are sent. No keys are exposed. This does not refresh disease observations or turn the app into live dengue surveillance.

The public forecast is persistence in both availability states because environmental promotion was not justified. On failure, missing/stale weather status or absent weather features, the UI states "Weather data unavailable; showing baseline forecast." The same policy preserves the baseline forecast and its intervals. Rainy/dry calendar context remains available independently of weather. Tests simulate provider failure and the next attempt after 24 hours, as well as browser-level missing weather.

Deployment scheduling was not applied. Run this job at most daily on one server with a persistent shared filesystem, then publish the static weather.json. Vercel immutable/serverless filesystems are not a durable shared cache: do not deploy this job as an unsynchronized request handler. For multiple workers, use a shared atomic cache/lock; no live hosted scheduler or weather API route is claimed.

## Remaining gates

Original credential rotation, hosted Auth/migration/retention verification, deployed ZAP and DPO/human evaluation remain unresolved. New work does not enable reporting or alter official disease counts. No secrets, provider keys or raw community reports were added.
