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
