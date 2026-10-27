# Current feature handoff for Claude

Local verification is complete for application source `a0e4240`: 85 unit/integration tests, four ML leakage tests, 600-row parity, three consecutive 44-test UI runs, 18 production and three PWA tests. Full evidence, retained diagnostics and owner-blocked gates: [mlux-checks.md](evidence/mlux-checks.md). The secret audit remains NEEDS OWNER (0 current / 44 known historical / 0 unexpected); hosted and human checks are not certified. Exact push: `git push -u origin feat/ml-map-ux`. Main was not pushed. Test locally, self-review and inspect the preview before merging; main merge deploys Vercel.

Use branch `feat/ml-map-ux`. Earlier main/redesign publication entries below describe older source. Current intent and limitations are in HANDOFF.md, ML_METHOD.md, ML_EVALUATION.md, MAP_DESIGN.md and UX_DECISIONS.md. See evidence/mlux-checks.md for completed verification, including any owner-blocked gates.

Calculation entry points: `ml/data.py` constructs past-only targets/features and explicit calendar gaps; `ml/pipeline.py` tunes within chronological training, calibrates, evaluates five methods, yearly folds, onset and label sensitivities, then exports trees. `src/ml/scorer.ts` matches scikit-learn; `src/ml/live.ts` constructs the same feature vector. `public/ml/replay.json` supplies all 70 held-out calendar weeks. RF was selected on validation; persistence wins test F1. Do not promote a model using test results or claim clinical accuracy.

UI entry points: `src/redesign/Dashboard.tsx`, `RiskMap.tsx`, `src/ml/MapProvider.tsx`, `useForecast.ts`, `ForecastUI.tsx`. Runtime source resolution is city only. OpenFreeMap is Risk-Map-only, with local PMTiles then neutral polygons/SVG fallbacks. The upload UI is `src/components/NcrModelUpload.tsx`; forward migration `20261026000100_ncr_model_uploads.sql` requires existing AAL2 admin protections. Uploads do not retrain the frozen model. Do not merge risky schema/auth work without local review and a preview.

NEEDS OWNER: newer reviewed 17-city counts; original photo source/licence/permission; team/controller/contact details; credential rotation; hosted migration/Auth/MFA/purge/schedule/log-retention checks; DPO approval before collection; actual English/Filipino/screen-reader usability sessions. Study metadata is verified from IEEE/Crossref; full-text protocol fidelity has not been independently checked. No invented human results or successful hosted deployment is claimed.

---

# Claude review guide

The owner explicitly authorizes publishing the completed redesign to main on 2026-10-25 so another reviewer can inspect the whole repository. Main pushes trigger Vercel deployments. Publication does not establish deployment success, credential rotation, hosted database migration, or permission to activate reporting.

## Start here

Read README.md, CONTRIBUTING.md and AGENTS.md, then docs/MAP_METHOD.md, docs/EVALUATION.md, docs/DESIGN.md and docs/evidence/redesign-checks.md. The validated application source is c2a6751; the complete source/evidence/review-bundle checkpoint is 5151fae. Later publication documentation does not change application behavior.

## Application and calculations

- src/App.tsx and src/redesign/Shell.tsx: exactly Dashboard, Risk Map and Community Report in primary navigation; About is footer-linked. Older routes redirect to methods/privacy drawers. Staff administration is separate and unlinked.
- src/redesign/Dashboard.tsx and ManilaPanel.tsx: historical Manila analytics and persistence case forecasts. scripts/lib/manila-model.ts implements the model and past-only interval calibration; scripts/evaluate-manila.ts evaluates it; scripts/publish-evidence.ts deliberately publishes the conservative naive baseline after inconclusive short-horizon regression gains. Public forecasts equal the latest reliable weekly count, with horizon-specific intervals derived from prior out-of-sample absolute errors. The default M scenario retains missing observations; Z assumes absent covered daily dates were zero for sensitivity analysis. Neither scenario establishes current risk.
- scripts/evaluate-map.py, src/redesign/outlook.ts and RiskMap.tsx: national historical count-based seasonal expectations, converted to tied percentile ranks from 0 to 100. This index is not an outbreak probability or a provincial case forecast. Display profiles use 2016-2020 observations. Weather failed the earlier-year held-out improvement gate and is excluded. Verified population/catchment denominators are unavailable; population confounding is explicit. Geography matching is explicit, with unmatched areas shown as No data.
- src/pages/ReportV2.tsx, src/lib/signals.ts and supabase/migrations/20261025000700_report_scope.sql: coarse anonymous signals, consent, shared old/new RPC rate guard, moderation, minimum-three suppression, 72-hour delay, withdrawal and retention. Reports never enter forecasts, official counts or the index. Reporting stays closed.
- src/redesign/About.tsx and src/content/: verified credits, complete dependency notices and intentionally empty owner/team/contact fields. The supplied photograph is credited to Sumarie Slabber; source URL and written permission/licence remain pending.

## Verification and limits

The local checkpoint passed 77 unit/integration tests, three consecutive 36-test UI runs, 10 production tests, three PWA tests, 25 SQL checks plus one local authenticated staff flow, and 30 measured photo-text contrast targets. Mobile Lighthouse scored performance 93/accessibility 100; the local passive ZAP scan found zero high/medium alerts; npm audit found zero vulnerabilities. Fourteen evaluation outputs reproduced byte-for-byte. See the committed evidence for actual commands, retained failures, scope and provenance.

review_bundle.zip is a sanitized review artifact with eight screenshots, source copies and evidence. Its source checkpoint is 54fa3cb and its application build is c2a6751. Redacted review copies may not execute unchanged; use the Git source for implementation. review_bundle.zip.sha256 and docs/evidence/redesign-bundle-validation.json verify archive integrity.

The secret audit remains failed pending owner rotation: zero current findings, 44 known historical findings, zero unexpected historical findings. Never expose or commit private environment values. Owner steps also include photo permission, team/controller/contact details, hosted Vercel/Supabase/Auth/MFA/purge/log-retention checks, institutional DPO review, actual usability/Filipino/screen-reader review and population/catchment verification. No hosted writes or reporting activation are authorized by this publication.
