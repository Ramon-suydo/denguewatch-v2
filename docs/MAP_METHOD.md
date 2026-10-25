# National Outlook Index method

This is a retrospective, count-based seasonal outlook, not a next-week case forecast, outbreak probability, or individual risk estimate. Manila alone has a separate historical case-forecast panel. Both source periods are old: national surveillance ends 2021-01-10; Manila ends 2023-12-02. Current risk is unavailable.

## Inputs and geography

The unchanged DOH EPI CSV supplies 126 province/city reporting units. No missing observations become zero. `data/geo/national-crosswalk.json` lists every exact/explicit name transformation and every unmatched unit. Local display geometry has 87 geoBoundaries ADM2 features plus 17 existing NCR city features: 104 polygons, 96 matched names, 8 unmatched polygons, and 30 case units without matched polygons. Name agreement does not establish reporting catchment equivalence or exclusion of separately reported cities. All crosswalk scope flags remain unverified. Unmatched areas show No data; the app never assigns district observations to cities.

The pinned geoBoundaries input is committed with its retrieval receipt and SHA-256. The source identifies NAMRIA/PSA/OCHA, 2020 ADM2 and CC BY 3.0 IGO. NCR geometry represents a later boundary vintage and is display context. Simplification preserves topology. RFC 7946 coordinates remain unchanged by rendering; D3 receives an oriented copy. No map tiles, browser weather requests, geolocation or tracking are used.

## Definition

For each source unit, the historical burden is the mean observed count in the training years. The seasonal expectation is the mean observed count within the target ISO week plus/minus two weeks, wrapping across a fixed 53-slot ISO-week cycle at year-end (the leap-week convention is explicit). This is equivalent to burden multiplied by its own seasonal ratio. The displayed 0–100 index is the tied average rank of that seasonal expectation among source units, rescaled as `100 * (rank - 1) / (N - 1)`. Rank 1 in the detail panel means the highest expectation; the index increases with expectation. The data table and map use the same rows. Days +0/+3/+7 select the calendar week's profile; they can legitimately produce identical values. There is no fabricated daily trajectory.

The profile displayed now is fitted only on 2016–2020 observations. Historical layers show recorded counts for a selected source week/year, never incidence rates. Verified PSA denominators aligned to every reporting catchment are unavailable. Count rankings are confounded by population size, surveillance and historical reporting. Large units tend to rank highly. The app makes no per-100,000 or person-level risk claim.

## Validation

Run `npm run evaluate:map`. `data/processed/map_evaluation.json` and `map_validation_weeks.json` are authoritative; the UI reads their published counterpart, rather than copied rounded constants. Test years are 2018, 2019 and 2020; all outer-fold training years strictly precede the test year. Compare burden-only and seasonal-burden on the same available case cohort. Weather comparisons use an identical common weather cohort for seasonal-burden, seasonal-ridge and lagged-weather models; this cohort differs from the full case cohort.

Metrics are mean weekly Spearman correlation with average tied ranks, top-ten intersection divided by ten (alphabetical source-unit order resolves boundary ties), and mean absolute rank difference divided by N−1. Weeks with absent observations exclude those units without imputing zero. Fixed ridge penalty 10, log1p features/targets and training-only standardization avoid tuning on test years. Inner training features also use only earlier years. Temperature mean and precipitation total use observed ERA5 at polygon centroids, lagged 14–27 days before each source date to allow an availability buffer. Geometric centroids can lie offshore; the provider selects a grid cell.

The weather model did not consistently beat both seasonal baselines on all three metrics in every held-out year. **Weather is excluded from the shipped index.** The saved results include unfavorable folds. Seasonal ranking also fails to beat burden-only in some folds; it is not a uniformly superior forecast. Forecast-weather transfer remains unverified even if a future historical ablation improves.

## Weather context and source limits

`scripts/fetch-map-weather.py` fetches and caches Open-Meteo historical and forecast data server-side in batches of eight centroids. History is 2016–2020; forecasts request eight calendar days in Asia/Manila and are published separately as dated context. The browser reads local JSON only. Context expires after 36 hours; absence/failure leaves the seasonal index available and says weather forecast unavailable. The daily refresh workflow can update context without changing the index. Data require Open-Meteo/Copernicus attribution; free API use is non-commercial and subject to provider terms.

Historical ERA5 resolution is approximately 28 km; forecast model resolution varies, roughly 9–50 km, and is not neighborhood weather. NASA POWER uses a coarser MERRA-2 grid, approximately 55–70 km. Four centroid samples (Manila City, Albay, Cebu and Davao del Sur), 2018–2020, are cross-checked monthly in `map_weather_crosscheck.json`. UTC versus Asia/Manila day boundaries and different grids prevent exact agreement. This limited cross-check does not certify all provinces or operational forecasts. Full receipts retain raw-response hashes and retrieval times.

## Community and safety

Community signals are a separate unverified aggregate layer, subject to at least three approved reports per area/week and a 72-hour delay. They never enter official counts, training, forecasts or the index. Suppression does not mean zero cases. The report policy stays closed pending owner credential rotation, hosted verification, contact/controller details and institutional privacy review.

## Primary references

- [geoBoundaries PHL ADM2 metadata](https://www.geoboundaries.org/api/current/gbOpen/PHL/ADM2/)
- [Open-Meteo historical API](https://open-meteo.com/en/docs/historical-weather-api) and [forecast API](https://open-meteo.com/en/docs)
- [NASA POWER methodology](https://power.larc.nasa.gov/docs/methodology/) and [acknowledgements](https://power.larc.nasa.gov/docs/acknowledgements/)
- [PSA 2020 population release](https://psa.gov.ph/content/highlights-philippine-population-2020-census-population-and-housing-2020-cph)
