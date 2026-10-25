# National outlook extension

The unchanged DOH EPI source supplies 126 reporting-unit labels. `npm run map:prepare` creates local display geometry and an explicit crosswalk, leaving ambiguous names unmatched. Pinned geoBoundaries ADM2 metadata and the original boundary response are in data/external/redesign-phl-adm2.*. The source identifies NAMRIA/PSA/OCHA and CC BY 3.0 IGO. Existing NCR geometry supplies city display features; exact names do not verify historical catchment equivalence.

`npm run map:weather` caches Open-Meteo archive/forecast responses and receipts at geometric polygon centroids; `--forecast-only` refreshes only dated context. `python scripts/crosscheck-map-weather.py` compares four NASA POWER centroid samples monthly. `npm run evaluate:map` uses strictly earlier years for 2018/2019/2020 tests and publishes complete rank metrics. Weather did not pass the improvement gate and is excluded from the index. National PSA denominators are unverified; population confounding is disclosed, with no incidence-rate claim. See ../docs/MAP_METHOD.md.

---

# Data provenance and attribution

The code license does not grant rights to these datasets. Retain attribution and obtain data-owner permission where terms are unknown. These files contain official/department-provided aggregate counts, not individual community reports. Never add real report exports, contact details or private withdrawal codes.

| Raw file | Provenance and coverage | Retrieval and terms |
|---|---|---|
| doh-epi-dengue-data-2016-2021.csv | DOH Epidemiology Bureau weekly surveillance data (EPI). Repository NCR subset date labels: 2016-01-10 through 2021-01-10. Other regions remain in the raw source; the app filters NCR. Week-ending interpretation is operational and unconfirmed. | Original retrieval date, acquisition URL and FOI reference unknown; redistribution terms unknown. |
| ncr_dengue_monthly_with_rates.csv | Derived NCR monthly aggregation associated with the weekly DOH EPI file, 2016-01-01 through 2021-01-01. Not an independent dataset; rates/population denominator need source-owner confirmation. | Original retrieval/derivation date unknown; retain DOH attribution; terms unknown. |
| Daily_Reported_Cases_of_Dengue_in_the_City_of_Manila_from_2018_to_2023.xlsx | Recorded dates 2018-01-01 through 2023-12-02. Provided by the City of Manila health department to the project team; formal citation pending data owner. Missing rows cannot be assumed to mean zero. | Original retrieval date and formal reference unknown; attribution and permission required. |
| Manila_weekly_MHD_2018_2023.csv | Supplied weekly Manila health-department aggregate cross-check, not an independent additive source. The last partial daily week and absent supplied weeks are audited in data/processed/audit.json. | Original retrieval date and exact derivation are unknown; supplied to the project team; formal citation pending data owner. This locally supplied raw file remains ignored until owner permission/review. |

Processed outputs preserve source identity and SHA256, gaps, suspect counts and both absent-day scenarios. DOH labels supply the stitched series before 2018-01-01; daily-derived weeks supply 2018 onward. Do not add overlapping daily, weekly and monthly totals. Original health-file retrieval dates are not the current audit date.

Public geography, population, elevation and weather inputs have separate source/provenance manifests under data/geo and data/external. Retain NAMRIA/OCHA/HDX, PSA, Open-Meteo/Copernicus/ECMWF, NASA and other provider-specific attribution recorded there; inspect each manifest's actual license. The repository does not infer a blanket license for government data.

Community-report test data is generated only in disposable local PostgreSQL harnesses explicitly marked LOCAL TEST DATA ONLY. It is never published, seeded into hosted production, included in official counts or used for forecasts. No real community records were queried or exported for this work.

NEEDS OWNER: confirm original retrieval dates, issuing-office/formal reference details and usage/redistribution permissions with the health department/data owners. Unknown details remain unknown; no FOI request number or citation has been invented.
