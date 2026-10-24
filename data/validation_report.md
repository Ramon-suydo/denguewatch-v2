# Validation report

Generated with npm run data:prepare; no database writes.

- Source checksums: ncr_dengue_monthly_with_rates.csv: 66ea1f9f5fff0a049b547d08e802f47d015cb5c8a979acfb10606fe4a1e953e6; doh-epi-dengue-data-2016-2021.csv: 4e993553f10081b4e6b35a0d4b3c9bd0cc271765645a123fcb2e0c5d7084633c; Daily_Reported_Cases_of_Dengue_in_the_City_of_Manila_from_2018_to_2023.xlsx: f066701654e86b9b49305a84bc08a0823613eb83cde3df067f338fbae145849d
- Nationwide data rows: 32701; one HXL metadata row excluded.
- NCR: 4403 rows, 17 LGUs; three internal gaps per LGU remain missing.
- Daily: 1910 positive rows; 252 absent dates inside coverage; 29 dates after the final source date are outside coverage.
- Stitched weeks per scenario: 413; source changes on 2018-01-01.
- Complete boundary weeks only; final partial week retained for audit, excluded from forecasts/scoring.
- Duplicate weekly _1.csv present: false. Raw files untouched.
- Reconciliation: 156 paired weeks; daily 8255, DOH 8244; MAE 13.2244, correlation 0.929366, maximum difference 78.
- Operational DOH Sunday-week-ending interpretation remains unconfirmed.
- See data/processed/audit.json for nulls, gaps, anomalies, schemas and fingerprints.
