# Environmental evaluation results

Regenerate offline from verified caches with `npm run evaluate`.

AR(2) log1p ridge, fixed L2=20, standardization from each training prefix only; >=32 training pairs. COVID indicator in all AR variants. Lag selection frozen from 2016-2017 only; no 2017 calibration scores reused.

All six methods share identical origin/target rows within scenario/horizon. M gaps remain missing. Frozen selected lags yield more M pairs than the prior 8-lag main harness: these are different comparison cohorts.

Only prior out-of-sample targets matured by each origin. Calibration starts in 2018; first 20 matured rows have unavailable probabilities and intervals.

## Matched 2018-2023 test folds

|Scenario|Horizon|Model|N|MAE|RMSE|MASE|Skill vs persistence %|95% CI|80% coverage|
|---|---:|---|---:|---:|---:|---:|---:|---|---:|
|Z|1|naive|307|10.326|16.187|0.938|0.000|0.000 to 0.000|0.829|
|Z|1|env-ar|307|11.212|18.049|1.016|-8.585|-18.115 to 1.345|0.833|
|Z|1|env-season|307|10.753|17.111|0.978|-4.139|-12.530 to 4.689|0.833|
|Z|1|env-weather|307|11.083|17.638|1.004|-7.334|-17.543 to 1.983|0.833|
|Z|1|env-season-weather|307|10.891|17.499|0.989|-5.472|-14.839 to 3.536|0.833|
|Z|1|env-season-weather-no-engineered|307|10.860|17.204|0.986|-5.175|-13.945 to 3.517|0.829|
|Z|2|naive|306|14.069|21.829|1.277|0.000|0.000 to 0.000|0.821|
|Z|2|env-ar|306|14.435|23.187|1.313|-2.606|-14.602 to 8.286|0.821|
|Z|2|env-season|306|13.064|21.232|1.192|7.141|-5.045 to 17.477|0.814|
|Z|2|env-weather|306|13.221|21.239|1.201|6.024|-6.097 to 17.099|0.832|
|Z|2|env-season-weather|306|12.922|20.914|1.180|8.153|-3.023 to 18.719|0.818|
|Z|2|env-season-weather-no-engineered|306|12.823|20.543|1.169|8.853|-1.473 to 18.578|0.814|
|Z|4|naive|304|19.313|29.560|1.760|0.000|0.000 to 0.000|0.833|
|Z|4|env-ar|304|18.974|29.635|1.741|1.754|-9.156 to 13.586|0.822|
|Z|4|env-season|304|16.437|26.695|1.514|14.892|1.355 to 28.085|0.815|
|Z|4|env-weather|304|16.721|26.931|1.533|13.417|-1.349 to 26.579|0.804|
|Z|4|env-season-weather|304|16.550|26.901|1.523|14.306|-1.078 to 27.450|0.819|
|Z|4|env-season-weather-no-engineered|304|16.307|26.290|1.498|15.560|0.854 to 28.313|0.819|
|M|1|naive|166|14.024|20.335|1.139|0.000|0.000 to 0.000|0.829|
|M|1|env-ar|166|15.072|21.994|1.230|-7.469|-18.213 to 6.149|0.836|
|M|1|env-season|166|14.343|20.756|1.168|-2.274|-13.291 to 9.353|0.870|
|M|1|env-weather|166|15.185|21.738|1.228|-8.276|-22.972 to 3.936|0.842|
|M|1|env-season-weather|166|14.914|21.478|1.210|-6.347|-18.584 to 5.651|0.877|
|M|1|env-season-weather-no-engineered|166|14.826|21.087|1.201|-5.719|-18.587 to 5.879|0.870|
|M|2|naive|166|19.928|28.031|1.612|0.000|0.000 to 0.000|0.841|
|M|2|env-ar|166|20.827|30.586|1.689|-4.511|-21.203 to 10.114|0.828|
|M|2|env-season|166|18.829|27.241|1.528|5.513|-10.841 to 18.364|0.828|
|M|2|env-weather|166|19.161|27.675|1.551|3.846|-11.314 to 15.617|0.821|
|M|2|env-season-weather|166|18.750|26.923|1.523|5.910|-9.228 to 19.076|0.834|
|M|2|env-season-weather-no-engineered|166|18.592|26.548|1.506|6.701|-7.171 to 18.639|0.828|
|M|4|naive|159|27.836|38.370|2.265|0.000|0.000 to 0.000|0.831|
|M|4|env-ar|159|27.119|38.377|2.224|2.576|-10.712 to 16.854|0.831|
|M|4|env-season|159|23.375|33.444|1.904|16.027|0.825 to 28.157|0.831|
|M|4|env-weather|159|24.411|34.483|1.979|12.304|-2.503 to 24.553|0.816|
|M|4|env-season-weather|159|23.886|33.985|1.944|14.190|-0.694 to 27.761|0.831|
|M|4|env-season-weather-no-engineered|159|23.017|32.888|1.868|17.313|4.122 to 28.859|0.801|

## Held-out one-week season comparison

|Scenario|Year|AR MAE|AR + season MAE|Season change % vs AR|Persistence MAE|
|---|---|---:|---:|---:|---:|
|Z|2018|16.233|14.705|9.411|14.608|
|Z|2019|16.833|15.346|8.832|16.019|
|Z|2020|6.641|5.860|11.763|4.769|
|Z|2021|6.417|6.220|3.073|6.173|
|Z|2022|11.532|12.414|-7.646|10.404|
|Z|2023|9.589|9.991|-4.197|10.042|
|M|2018|20.075|18.320|8.741|17.703|
|M|2019|20.450|18.185|11.077|18.892|
|M|2020|8.741|6.830|21.861|8.167|
|M|2021|9.543|8.669|9.156|9.462|
|M|2022|13.723|14.115|-2.855|12.147|
|M|2023|9.215|10.171|-10.382|9.974|

## Alerts (primary 1/2 week horizons)

|Scenario|H|Model|N calibrated|Precision|Recall|F1|AUC|Brier|False positive rate|
|---|---:|---|---:|---:|---:|---:|---:|---:|---:|
|Z|1|naive|287|0.717|0.704|0.710|0.913|0.088|0.064|
|Z|1|env-ar|287|0.712|0.685|0.698|0.891|0.095|0.064|
|Z|1|env-season|287|0.725|0.685|0.705|0.907|0.087|0.060|
|Z|1|env-weather|287|0.689|0.574|0.626|0.886|0.100|0.060|
|Z|1|env-season-weather|287|0.717|0.611|0.660|0.903|0.092|0.056|
|Z|1|env-season-weather-no-engineered|287|0.688|0.611|0.647|0.900|0.094|0.064|
|Z|2|naive|285|0.604|0.604|0.604|0.871|0.103|0.091|
|Z|2|env-ar|285|0.556|0.566|0.561|0.838|0.120|0.103|
|Z|2|env-season|285|0.667|0.604|0.634|0.867|0.106|0.069|
|Z|2|env-weather|285|0.595|0.472|0.526|0.826|0.119|0.073|
|Z|2|env-season-weather|285|0.634|0.491|0.553|0.853|0.112|0.065|
|Z|2|env-season-weather-no-engineered|285|0.659|0.509|0.574|0.849|0.112|0.060|
|M|1|naive|146|0.721|0.689|0.705|0.901|0.119|0.119|
|M|1|env-ar|146|0.756|0.756|0.756|0.888|0.121|0.109|
|M|1|env-season|146|0.745|0.778|0.761|0.919|0.106|0.119|
|M|1|env-weather|146|0.756|0.689|0.721|0.887|0.123|0.099|
|M|1|env-season-weather|146|0.780|0.711|0.744|0.906|0.114|0.089|
|M|1|env-season-weather-no-engineered|146|0.805|0.733|0.767|0.908|0.113|0.079|
|M|2|naive|145|0.676|0.543|0.602|0.831|0.156|0.121|
|M|2|env-ar|145|0.587|0.587|0.587|0.793|0.175|0.192|
|M|2|env-season|145|0.705|0.674|0.689|0.846|0.151|0.131|
|M|2|env-weather|145|0.657|0.500|0.568|0.795|0.171|0.121|
|M|2|env-season-weather|145|0.675|0.587|0.628|0.826|0.159|0.131|
|M|2|env-season-weather-no-engineered|145|0.667|0.609|0.636|0.836|0.156|0.141|

## Threshold episode lead (same onset, primary horizons only)

|Scenario|Model|Eligible onsets|Detected|Mean lead weeks|
|---|---|---:|---:|---:|
|Z|naive|18|6|2.000|
|Z|env-ar|18|7|1.857|
|Z|env-season|18|6|1.833|
|Z|env-weather|18|5|1.800|
|Z|env-season-weather|18|4|2.000|
|Z|env-season-weather-no-engineered|18|5|2.000|
|M|naive|14|5|2.000|
|M|env-ar|14|5|2.000|
|M|env-season|14|6|2.000|
|M|env-weather|14|5|1.800|
|M|env-season-weather|14|7|1.714|
|M|env-season-weather-no-engineered|14|7|1.714|

Eligible onset requires the immediately previous observed calendar week to be below its past-only threshold. Missing prior weeks are not invented. FPR = FP/(FP+TN). False fraction among alerts = 1 - precision.

Season adds June-November flag and sin/cos; weather adds selected rainfall, temperature and humidity lags, selected rainfall window, >=1mm rain days and weekly temperature min/max at lag 1. Combined adds a fixed research cumulative-200mm onset proxy, not PAGASA onset. No-engineered combined variant drops rainfall roll/rain-day/min/max/onset engineering.

Optional thermal index omitted: no verified parameter curve is implemented; never labelled tested.

400 circular moving blocks of 8 observed rows, seed 20261025, 95% skill CI versus matched persistence; gaps mean observed blocks are not necessarily eight calendar weeks.

No environmental model is promoted. Public persistence baseline remains independent of weather availability. No current dengue observations exist.

All yearly/COVID folds, interval denominators, lag correlations, coefficients and per-origin records are saved in environment_evaluation.json. Descriptive correlations and coefficients do not establish causation.
