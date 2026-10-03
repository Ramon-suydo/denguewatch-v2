# Defense Q&A — research demonstration

These answers refer to the audited current sources in DATA_QUALITY.md and the
weekly-ridge-v1 cached backtest. Exact DOH/FOI citations remain pending. This is
not a clinical validation or legal-compliance assessment.

1. **What data did you actually use?**
   The forecasting input is the NCR weekly source only: 4,403 rows across 17 LGUs,
   January 2016–January 2021. The DB has 7,350 observations across three separate
   representations, not 7,350 independent case measurements. The snapshot is
   verified against every source row; data availability is not real-time.

2. **Why not train on monthly and weekly together?**
   Monthly counts exactly reproduce grouping weekly labels by month. Using one
   as training data and the other as independent testing would overlap underlying
   observations. Monthly remains for legacy historical charts/risk, never the
   weekly forecasting pipeline. Manila daily is another source and is not combined.

3. **Why ridge instead of deep learning?**
   A small regularized model is easier to audit with limited history. Each LGU
   and direct horizon has a fit using recent log-case lags, a 52-week lag and
   annual Fourier terms; lambda=10 is fixed. It must beat both simple baselines
   on development data. Model complexity is not evidence of better prediction.

4. **How did you prevent future leakage?**
   Each expanding origin trains only through that week's label. Feature scaling
   uses only training examples; multi-step residuals calibrate intervals only
   after their targets arrive. Selection is frozen from 2018, before 2019-onward
   test outcomes. Publication/vintage dates are not supplied, so this is a
   retrospective source-label simulation, not a demonstrated real-time result.

5. **Does it beat the strongest baseline?**
   At one week, pooled test MAE is 8.82 for ridge versus 11.23 for the four-week
   mean (21.5% improvement); seasonal naive is 22.58 (61.0% improvement).
   Ridge beats seasonal naive in 17/17 LGUs on MAE. Ridge MAE at two/four weeks
   is 9.94/12.37. These are paired common-support results, not clinical accuracy.
   Ridge sMAPE is worse than the mean overall: 68.22% versus 64.95%.
   One-week RMSE: ridge 20.89, mean 25.21, seasonal naive 51.70;
   each is scored on 1,462 paired targets. MAE/RMSE are case-count errors.

6. **Why is seasonal naive comparatively weak?**
   It repeats the label exactly 52 weeks earlier and ignores the latest case
   counts. Year-to-year outbreak amplitude and reporting shifts can break that
   assumption. The four-week mean already achieves 50.3% MAE skill versus naive,
   compared with ridge's 61.0%. This comparison does not isolate feature effects
   or establish that seasonal naive is universally weak.

7. **Can we trust the prediction intervals?**
   They use earlier out-of-sample signed residual quantiles, per LGU/horizon/model,
   with at least 30 observed residuals. Nominal 80%/95% intervals cover
   79.75%/92.54% of one-week all-period targets, but only 71.43%/88.22% in 2019
   without COVID targets. Four-week 2019 coverage is 68.67%/83.71%. Calibration is
   imperfect, especially under shifts; these are not guaranteed probabilities.

8. **What about missing data and deaths greater than cases?**
   Three weekly calendar gaps remain missing, never zero or interpolated. Exact
   missing/suspect lags make forecasts unavailable. The audit flags 155 weekly
   and 41 monthly rows with deaths above cases; affected weekly rows are excluded
   from fitting/scoring. Deaths are not predictors. Daily Manila has no deaths
   field (NULL, not zero); valid large case peaks are retained. Source review is
   required before mortality claims.

9. **How did COVID affect the evaluation?**
   We flag 2020–2021 as potentially distorted reporting and publish metrics with
   and without those targets. Excluding them leaves 2019 only: one-week ridge MAE
   is 12.39, versus 16.23 mean and 21.85 naive. This is not a causal estimate of
   COVID's effects and does not remove COVID observations from later training.

10. **Can the app warn about dengue conditions today?**
    No. Weekly test evidence ends January 2021; the separate Manila daily source
    ends 2 December 2023 and says nothing about other LGUs today. The model is for
    short 1/2/4-week historical counts, not season-level outbreak declarations,
    individual infection probabilities or emergency decisions. Follow DOH/local
    health-office and qualified clinical guidance.

11. **How are community reports and privacy handled?**
    Today community health submissions are closed; no new community health records
    are accepted. Legal-v1.1 documents remain drafts for review, not legal advice.
    This is not a claim that no personal data is processed: provider request
    metadata can be logged and online withdrawal can process a private code.
    No app analytics, cookies or local/session storage
    is installed. Fonts/scripts are local, but online Supabase reads and
    OpenStreetMap tiles expose request metadata to providers; Vercel/provider
    log and backup retention need verification. The snapshot contains no reports
    or contacts. Health reports would be sensitive personal information under
    [RA 10173 §3(l)(2), published by the NPC](https://privacy.gov.ph/data-privacy-act/).
    Dormant community-v1 consent is unticked, with separate optional contact;
    withdrawal codes are hashed and small aggregates suppressed, without a
    guarantee of anonymity. The existing DB setting is 90 days; launch retention is
    "Not applicable, form closed"; the owner names the DengueWatch student research
    team, University Perpetual Help College of Manila, with achilleslang23@gmail.com
    as controller contact. A DPO designation is not confirmed. Provider-default
    log/backup labels do not establish verified retention durations. Lawyer/school DPO review
    must cover rights handling, consent, liability, processors and registration.
    Registration is not automatically ruled out by being a thesis: NPC Circular
    2022-04 covers controllers/processors with 250+ employees, sensitive data on
    1,000+ people, or processing likely to risk subjects' rights/freedoms.
    The DPO must assess the school/controller as a whole and any exemption route;
    no registration status or exemption is claimed. See the
    [NPC registration guidance](https://privacy.gov.ph/reminder-on-mandatory-data-protection-officer-and-data-processing-system-registration/).

12. **What would newer DOH data realistically add?**
    More recent weekly years can provide relevant held-out periods and more
    interval-calibration samples, including different outbreak seasons. Gains
    are not guaranteed; audit overlap/definitions first, ingest separately,
    retrain and compare recent held-out evidence before promotion. Climate needs
    aligned information available at the origin. Barangay data needs consistent
    geography, coverage and small-count protections; population/deaths need
    separate provenance and quality review, not automatic case-model mixing.

Sources for numerical answers: `src/data/weekly-forecast-v1.json`,
`docs/weekly-backtest-v1.json`, `docs/WEEKLY_FORECAST.md` and `docs/DATA_QUALITY.md`.
The live-source attribution fields are configured in `src/lib/source-metadata.ts`.


Feature freeze: no model/data/schema/dependency changes. The snapshot date is
2026-10-03T03:17:58.331Z (UTC); model evidence generation is 2026-10-01, not a
new data period. See DEMO_SCRIPT.md for the artifact-derived 1/2/4-week table and
DEFENSE_DAY.md for local startup and fallback. Source acquisition dates/FOI IDs
are Not available, URLs not public and usage terms Not stated; those are honest
unknowns, not verified citations or a statement that no FOI request existed.
