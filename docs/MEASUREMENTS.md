# Reverified supplied measurements

Daily-derived 2018–2023 full-boundary weeks. Exact calendar lags, no gap compression. Z fills internal absent dates only; M requires seven daily rows for targets and all required lag weeks. Each audit baseline uses its own available support, unlike the full paired harness. 2023 ends at last complete-boundary source week; final partial week excluded. Blend not reverified because weights were not specified.

## National file

{
  "rows": 32701,
  "first": "2016-01-10",
  "last": "2021-01-10",
  "duplicate_loc_date_rows": 0,
  "blank_cases": 0,
  "blank_deaths": 1,
  "invalid_case_values": 0,
  "invalid_nonblank_death_values": 0
}

## NCR yearly totals (source values, not validated mortality)

|Year|Rows|Cases|Known deaths|Missing death rows|
|---|---:|---:|---:|---:|
|2016|850|13002|2987|0|
|2017|901|26103|168|1|
|2018|884|29200|180|0|
|2019|867|40478|190|0|
|2020|867|7183|483|0|
|2021|34|181|1|0|

## Calendar-lag autocorrelation

|Scenario|Lag weeks|Pairs|Pearson r|
|---|---:|---:|---:|
|Z|1|307|0.9337|
|Z|2|306|0.8797|
|Z|4|304|0.7801|
|Z|8|300|0.4849|
|Z|52|256|0.2752|
|M|1|185|0.9042|
|M|2|184|0.8212|
|M|4|179|0.6777|
|M|8|164|0.2827|
|M|52|120|0.4938|

## 2023 baseline audit (separate support per method)

|Scenario|Model|N|MAE|Mean target cases|
|---|---|---:|---:|---:|
|Z|naive|48|10.0417|50.7500|
|Z|mean-4|48|10.7292|50.7500|
|Z|seasonal-naive|48|32.0417|50.7500|
|M|naive|42|10.0000|52.7619|
|M|mean-4|33|8.6212|53.5758|
|M|seasonal-naive|37|32.4324|53.0000|

The supplied approximate lag correlations depend on missing-day/support conventions. Use the exact calendar-aware values above. Do not compare separate-support errors as paired skill; EVALUATION.md contains matched comparisons, uncertainty and both scenarios. The unspecified blend is not presented as verified.
