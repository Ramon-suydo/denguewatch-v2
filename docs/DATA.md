# Data assumptions and dictionary

Run `npm run data:prepare` to regenerate `data/processed/*.json` and
`data/validation_report.md`. Raw bytes are never changed and no database is used.
Source hashes, individual gaps and anomalies are in `data/processed/audit.json`.

## Unresolved source question

**Does a date with no row mean zero cases or no report?** The workbook does not
answer. Scenario Z assumes zero within supplied coverage only. Scenario M treats
absence as missing and excludes weeks with fewer than seven daily rows from
scoring and supervised training targets. Both scenarios retain observed totals
and flags. Neither fills dates outside coverage. Final week ending 2023-12-03
has six supplied calendar days, 30 cases; it is retained but excluded in both.

## Dictionary

| File | Fields and units | Geography / resolution | Range / nulls |
| --- | --- | --- | --- |
| Daily workbook, Sheet4 | Six Date/Cases pairs A:B,D:E,G:H,J:K,M:N,P:Q; cases=integer count, date=calendar date | Manila / daily | 2018-01-01–2023-12-02; 1,910 observations, no zero rows, 252 absent dates within supplied coverage; no deaths column |
| Manila weekly MHD CSV | week_ending / week_start=ISO dates; cases_reported=count or blank; days_reported=days with a row, NOT established reporting completeness; complete_week=boolean | Manila / weekly, derived from workbook | 308 rows ending 2023-11-26; 5 blank totals; final partial week omitted. Local input checked, not committed |
| DOH EPI CSV | loc=source location name, cases=count, deaths=count or blank, date=Sunday source label, Region=region; row 2=HXL metadata | National / weekly; NCR filtered by exact region | 32,701 nationwide data rows; 4,403 NCR, 17 LGUs ×259; 2016-01-10–2021-01-10; one NCR death missing, 155 NCR deaths>cases flags |
| NCR monthly CSV | city,year,month,cases,deaths,weeks_reported,population_2020,incidence_per_100k | 17 NCR LGUs / month | 1,037 rows; 2016-01–2021-01; no nulls; monthly roll-up, not independent evidence; fixed 2020 population provenance unverified |
| manila_weekly.json | scenarios.Z/M: week_start,week_ending,epi_week,source,scenario,cases,cases_recorded,days_with_rows,calendar_days_in_coverage,reliable,flags | Manila / 413 continuous Sunday labels per scenario | 2016-01-10–2023-12-03; cases=null for absent DOH/suspect/partial/M-incomplete weeks |
| ncr_weekly.json | city,week_ending,cases,deaths,flags,source | NCR / source weekly rows | Three calendar gaps per LGU stay missing, never zero |
| ncr_population.json | city,population_2020,source,status | NCR / fixed census-labelled denominator | All 17; explicitly unverified until PSA confirmation |

`epi_week` is ISO week of the Monday start, not a claim to verified DOH epidemic
week semantics. DOH Sunday labels are operationally interpreted as week ends for
this analysis; source documentation has not confirmed that interpretation.

## Stitch and reconciliation

Use DOH labels before 2018-01-01; use daily-derived weeks afterwards. This extends
Manila history while using the longer daily source through 2023. Sources are
never summed. Death anomalies are disclosed and their DOH training targets remain
excluded under the existing quality policy; death counts are never predictors.
Daily source questions are evaluated using both scenarios.

Reverified observed-week overlap matches the supplied **151 weeks**: daily
**8,255**, DOH **8,234**, MAE **13.5960**, maximum difference **78**, correlation
about **0.93**. This excludes five all-absent daily-derived weeks. Scenario Z's
zero-assumed comparison includes them: **156** paired weeks, daily **8,255**,
DOH **8,244**, correlation **0.929366**, MAE **13.2244**. Requiring seven daily
rows yields **104** paired weeks, daily **7,767**, DOH **7,780**, MAE **17.2019**.
All three cohorts and exact pairs are recorded in audit.json. Do not describe
cohort differences as conflicting source files or silently mix denominators.

The alternate-source sensitivity uses DOH for 2018–2020. It reports case-only
baselines/regression separately; it does not establish weather robustness under
the alternate source. Completeness and scored samples change between experiments.

## Geography

Original geo inputs: Tondo polygons and Manila boundary from HDX COD-AB/NAMRIA;
PSA 2020 Tondo population JSON; provenance JSON and an older MIT license text.
The MIT file applies to the earlier third-party resource, not HDX boundaries.
HDX metadata records CC BY 3.0 IGO. Do not substitute one license for another.
No full 17-city NCR boundary collection existed in tracked data at baseline.
See AUDIT.md for source retrieval and current gaps.
