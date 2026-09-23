# Published dataset audit

Inspected 2026-09-23 before ingestion code was written. The owner identifies the sources as DOH and FOI/Freedom of Information. Exact dataset URLs, request identifiers, citation text, and redistribution terms still need to be attached by the owner. The monthly CSV is demonstrably derived from the weekly CSV; do not imply it is an independent series.

## Coverage

| Source | Data rows | LGUs | First label | Last label | Cases | Missing deaths |
| --- | ---: | ---: | --- | --- | ---: | ---: |
| `ncr_dengue_monthly_with_rates.csv` | 1,037 | 17 | 2016-01-01 | 2021-01-01 | 116,147 | 0 |
| `doh-epi-dengue-data-2016-2021.csv` | 4,403 | 17 | 2016-01-10 | 2021-01-10 | 116,147 | 1 |
| `Daily_Reported_Cases_of_Dengue_in_the_City_of_Manila_from_2018_to_2023.xlsx` | 1,910 | 1 | 2018-01-01 | 2023-12-02 | 14,635 | 1,910 |

The weekly file has 32,701 nationwide data rows plus one HXL metadata row after the CSV header. Filtering Region exactly to NATIONAL CAPITAL REGION yields 4,403 records. Each NCR LGU has 259 weekly and 61 monthly records. There are no duplicate source/LGU/date keys, negative counts, missing case values, or mismatched city spellings between the CSVs.

**Expected database contents: 17 LGUs and 7,350 surveillance records. The combined sum of cases across these sources is not meaningful.**

## NCR geography

CALOOCAN CITY, LAS PINAS CITY, MAKATI CITY, MALABON CITY, MANDALUYONG CITY, MANILA CITY, MARIKINA CITY, MUNTINLUPA CITY, NAVOTAS CITY, PARANAQUE CITY, PASAY CITY, PASIG CITY, PATEROS, QUEZON CITY, SAN JUAN CITY, TAGUIG CITY, VALENZUELA CITY.

Source names use unaccented LAS PINAS CITY and PARANAQUE CITY. The normalizer also accepts accented names, City of prefixes, case variations, and whitespace; unknown LGUs fail ingestion. Pateros is the municipality. Manila daily data maps only to MANILA CITY.

Current 10-digit PSGC identifiers were sourced from [PSA PSGC summary](https://psa.gov.ph/classification/psgc/summary), accessed 2026-09-23. These are reference identifiers, not evidence that 2016-2023 boundaries match current boundaries. Population is preserved from the monthly file under its population_2020 label, with population_year=2020; no current-population claim or boundary adjustment is made.

## Workbook: all six year-pairs

The single Sheet4 worksheet contains 361 physical rows including its header, six independently positioned total footers, and padding. Date/case pairs are A:B, D:E, G:H, J:K, M:N, P:Q. They must be unpivoted independently, not read as one row per date. Excel date cells are interpreted without local-time conversion.

| Year | Daily records | First date | Last date | Cases/footer total | Absent calendar dates |
| --- | ---: | --- | --- | ---: | ---: |
| 2018 | 359 | 2018-01-01 | 2018-12-30 | 3,641 | 6 |
| 2019 | 353 | 2019-01-01 | 2019-12-29 | 3,961 | 12 |
| 2020 | 196 | 2020-01-01 | 2020-12-30 | 697 | 170 |
| 2021 | 316 | 2021-01-01 | 2021-12-29 | 1,214 | 49 |
| 2022 | 352 | 2022-01-01 | 2022-12-29 | 2,669 | 13 |
| 2023 | 334 | 2023-01-01 | 2023-12-02 | 2,453 | 31 |

All six footer totals match the summed daily records. No daily record has zero cases; 281 dates are absent relative to the full six calendar years. They may be omitted zero-report days or missing observations: the workbook alone cannot establish which. Preserve absence, never fill with zero. 2023 ends on December 2, so the last 29 calendar days are outside supplied coverage. The daily workbook contains no deaths field: store NULL, never zero.

## Gaps and anomalous values

- Three internal weekly gaps occur in every LGU: 2016-11-13, 2019-01-06, and 2020-11-15. Coverage also starts partway through January 2016 and ends early in January 2021.
- Weekly dates are Sunday labels, but no supplied metadata proves whether they represent week starts or ends. Preserve the exact label in period_start with period_date_semantics=source_date_label. Do not silently shift to Monday or infer onset dates.
- Monthly January 2021 consists of only two weekly records per LGU. A monthly row does not guarantee a complete month.
- 155 weekly rows and 41 monthly rows have deaths > cases. Example: QUEZON CITY, 2016-09-04, cases=0 and deaths=203. This suggests a source/column problem; it is not automatically corrected. Do not use affected values to claim mortality rates or validate forecasts without reviewing the source.
- QUEZON CITY, 2017-05-07, has cases=48 and a blank deaths field. Its weekly deaths remain NULL. The supplied May monthly death aggregate is retained and flagged aggregate_contains_missing_deaths.
- Monthly cases, deaths (with the source aggregation treating the one blank as zero), and weeks_reported exactly match grouping weekly rows by their label month. Monthly data is not an independent validation set.
- All supplied incidence rates match cases / population_2020 * 100000 to two decimals. This verifies arithmetic only, not external population provenance.
- Maximum cases: weekly 812 in Quezon City on 2019-09-08; monthly 3,265 in Quezon City in September 2019; daily 46 in Manila on 2019-08-25. Preserve these peaks; large values alone are not proof of an error.

## Overlapping Manila series disagree

| Year | Daily workbook cases | Weekly CSV cases |
| --- | ---: | ---: |
| 2018 | 3,641 | 3,620 |
| 2019 | 3,961 | 3,901 |
| 2020 | 697 | 689 |
| 2021 | 1,214 | 34 (January only) |

Different coverage, reporting definitions or revisions may explain differences; this has not been established. Keep all sources and granularities separate. Never sum day+week+month series or train/test across overlapping representations of the same observations. Backtest results remain empty until Prompt 5; missing periods and suspect values need an explicit evaluation policy then.

## Reproduce and inspect

Run `npm run data:audit`. It reads every file, checks totals/duplicates/headers, and writes `.artifacts/data-audit.json` with all absent daily dates, weekly gaps, suspect rows, and checksums. It does not connect to a database. The importer runs the same checks before writes. Changed coverage/totals fail closed for re-audit.

## Source fingerprints

| File | SHA-256 |
| --- | --- |
| `ncr_dengue_monthly_with_rates.csv` | `66ea1f9f5fff0a049b547d08e802f47d015cb5c8a979acfb10606fe4a1e953e6` |
| `doh-epi-dengue-data-2016-2021.csv` | `4e993553f10081b4e6b35a0d4b3c9bd0cc271765645a123fcb2e0c5d7084633c` |
| `Daily_Reported_Cases_of_Dengue_in_the_City_of_Manila_from_2018_to_2023.xlsx` | `f066701654e86b9b49305a84bc08a0823613eb83cde3df067f338fbae145849d` |
