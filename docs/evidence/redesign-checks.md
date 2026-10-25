# Three-page redesign: evidence and owner handoff

Fresh local source: `c2a6751b367ec02f08a80709374b2f7b9b5e25ea` on `feat/redesign`. UI production captures/build source is recorded in redesign-status.json. No redesign main push, hosted migration or report activation is claimed. A main merge automatically deploys Vercel; test locally, self-review and inspect the preview before merging this schema/UI work near the defense.

|Area|What changed|Evidence / status|
|---|---|---|
|Navigation and visual system|Exactly Dashboard, Risk Map and Community Report in main navigation; About footer-only; old routes redirect to functional drawers; separate unlinked staff route. Skyline picture/srcset, glass fallback, bilingual primary pages.|Core source committed; current browser/production checks below determine local status.|
|Image and contrast|Original preserved with SHA proof; eight AVIF/WebP derivatives, largest WebP 185724 bytes. Exact author credit on About and every footer.|30 actual pixel checks across 360/768/1440 and both languages: PASS. Photo permission/source/licence NEEDS OWNER.|
|Dashboard and Manila forecast|Historical-only one/two-week case forecasts, intervals, measured MAEs, source bands/COVID shading/scenarios/year/month/backtest analytics and cited 4S/warnings.|Exact numeric tests compare both scenarios with saved data. Current risk is unavailable; case data ends 2023-12-02.|
|National map|104 local shapes, 96 explicit name matches, 8 no-data shapes, 30 unmatched case units; tied seasonal count ranks; accessible table follows selected layer/year/week; separate searchable community groups.|15 saved model/fold rows and 775 weekly comparisons. Weather did not consistently improve validation and is excluded. Population/catchment confounding is explicit; no national rates or current-risk claims.|
|Anonymous reports and staff|Coarse type/unit/barangay/onset/range, optional symptoms/filtered note, opt-in consent, actual SQL receipt, shared old/new RPC IP-hash throttle, moderation/delay/suppression/withdrawal/retention.|77 local unit/integration tests; db:verify applies all 12 migrations, passes 25 SQL checks and a signed local MFA adapter UI flow. This does not certify hosted Auth, proxy trust, schedules or log retention.|
|About and credits|Empty owner details hidden. All 390 locked npm and 16 resolved/pinned Python packages, bundled notices, UI fonts, evaluation font, icons, source receipts and image credit.|406 dependency entries; code-provider coverage and 11 boundary inputs checked. Team/contact and formal data-owner citations remain NEEDS OWNER.|

## Actual command results

|Check|Command|Exit|Result log|
|---|---|---:|---|
|install|`npm ci`|0|`.artifacts/launch/redesign-clean-install.txt`|
|lint|`npm run lint`|0|`.artifacts/launch/redesign-loading-lint.txt`|
|typecheck|`npm run typecheck`|0|`.artifacts/launch/redesign-loading-types.txt`|
|unit_integration|`npm test`|0|`.artifacts/launch/redesign-delivery-units.txt`|
|geography|`npm run test:geography`|0|`.artifacts/launch/redesign-geography.txt`|
|contrast|`npm run test:contrast`|0|`.artifacts/launch/redesign-focus-contrast.txt`|
|production_build|`npm run build`|0|`.artifacts/launch/redesign-verified-build.txt`|
|database|`npm run db:verify`|0|`.artifacts/launch/redesign-database-verify.txt`|
|database_catalog|`node node_modules/tsx/dist/cli.mjs .artifacts/launch/redesign-catalog.ts`|0|`.artifacts/launch/redesign-rls-catalog.txt`|
|map_evaluation|`npm run evaluate:map`|0|`.artifacts/launch/redesign-map-reproduce.txt`|
|evaluation|`npm run evaluate`|0|`.artifacts/launch/redesign-evaluation-reproduce.txt`|
|reproduction|`python .artifacts/launch/redesign-reproduce.py after`|0|`.artifacts/launch/redesign-reproduce-result.txt`|
|source_integrity|`python .artifacts/launch/redesign-git-integrity.py`|0|`.artifacts/launch/redesign-git-integrity.txt`|
|software_credits|`npm run credits:check`|0|`.artifacts/launch/redesign-full-credit-check.txt`|
|npm_audit|`npm audit --json`|0|`.artifacts/launch/redesign-dependency-audit.txt`|
|secret_audit|`npm run security:secrets`|1|`.artifacts/launch/redesign-delivery-secret-audit.txt`|
|lighthouse|`node .artifacts/launch/lighthouse-final.mjs`|0|`.artifacts/launch/redesign-loading-lighthouse.txt`|
|zap|`npm run security:zap -- http://127.0.0.1:43142`|0|`.artifacts/launch/redesign-verified-zap.txt`|
|ui_run_1|`npm run test:ui -- --workers=1`|0|`.artifacts/launch/redesign-verified-ui-1.txt`|
|ui_run_2|`npm run test:ui -- --workers=1`|0|`.artifacts/launch/redesign-verified-ui-2.txt`|
|ui_run_3|`npm run test:ui -- --workers=1`|0|`.artifacts/launch/redesign-verified-ui-3.txt`|
|production_browser|`npm run test:production -- --workers=1`|0|`.artifacts/launch/redesign-verified-production.txt`|
|pwa|`npm run test:pwa -- --workers=1`|0|`.artifacts/launch/redesign-verified-pwa.txt`|
|screenshots|`node .artifacts/launch/redesign-capture.mjs`|0|`.artifacts/launch/redesign-delivery-captures.txt`|

Null exit/result means NOT VERIFIED, never a pass. The mandatory secret audit fails with zero current findings, 44 known historical findings and zero unexpected historical findings because the owner deferred rotation. It also emits an old-path Git warning; complete output is retained. Staged commit scans passed but do not attest rotation.

## Validation limits and retained failures

- Evaluation reruns reproduced all 14 checked output files byte-for-byte in this Windows checkout; original case inputs and earlier migrations are unchanged. Committed weather responses, original photo/derivatives and published case-source SHA are independently checked against Git blobs.
- The first diagnostic had 17 failures, then 1; selectors were scoped to native dialogs while preserving assertions. Actual contrast/offline/empty-state/legal/form regressions were fixed. No test cases were removed or skipped.
- Historical-layer mismatch was reproduced: Abra annual saved count 1,315 versus the wrongly displayed seasonal index 24. A new regression checks every source unit for annual and weekly tables, correct legend/context, and community-only filtering. Before/after command logs and real failure traces are retained.
- Earlier complete 35-test runs predate the last fixes. A later release runner was interrupted during its second run when the historical-layer defect was found; it is not counted toward final stability. A pre-final 36-test run passed, then its second run hit a boundary-response readiness race; the test now waits for the real response body without increasing timeouts or reducing the 104-shape assertion. The final three-run requirement uses only redesign-verified-ui-1/2/3.
- The original gold focus ring measured only 1.66 against a light card. It was replaced by a two-colour white/navy ring and a dedicated SVG boundary focus style; the existing keyboard test now checks actual computed control/path contrast. Before/after logs are retained.
- Local mobile Lighthouse improved from performance 65/accessibility 100/CLS 0.723 to performance 93.0/accessibility 100/CLS 0.0005291742427677121. Page loading reserves viewport space, legacy API imports are deferred, collapsed tables mount on opening and offline-cache installation waits for the first screen. Subsequent 89 and 85 diagnostic scores were retained before the final 93 result. The before report is retained. Best-practices 96 includes the unavailable hosted reporting-policy endpoint; collection remains fail-closed.
- Local passive ZAP reports 0 high/medium and 2 low/info alerts. This is public local unauthenticated coverage, not a hosted or active security certification.
- Fresh production screenshots at 360/1280 cover all three pages and About. External backend requests are blocked for capture; closed/error states are actual fail-closed local states. No real reports or hosted participant data were loaded.

## Exact owner steps

1. Obtain the source URL and written permission/licence from Sumarie Slabber. Update src/content/credits.json and preserve evidence in docs/evidence/image-permission.md. Credit alone is not permission.
2. Fill src/content/about.json with verified team, school/program/course/adviser/year and feedback/security/controller contact details. Empty values remain hidden; do not invent them.
3. Follow docs/ROTATE_CREDENTIALS.md. Rotate the exposed database/server credentials, privately update the environment and GitHub secrets/rotation state, then rerun npm run credentials:verify and npm run security:secrets. Do not paste credentials into chat or commit them.
4. Verify the Vercel feature preview using Node 22 and the repo install command (Chromium/native dependencies/Pillow). That hosted install path is configured but unverified. Privately apply/verify all pending Supabase migrations only after rotation, check real staff Auth/TOTP/AAL2 and hourly purge execution, and verify infrastructure logging/retention and trusted proxy headers.
5. Have the school/DPO review the English/Filipino RA 10173 notice, controller/contact, consent, retention and abuse metadata before opening collection. Keep reporting closed until these checks are complete.
6. Run real usability sessions, including Filipino readers and a screen-reader walkthrough, and record results. Browser automation and axe are not a human screen-reader test or usability study.
7. Obtain formal case-data citations/permission and validate province/city catchments and PSA denominators before claiming population-adjusted risk or resolving ambiguous crosswalk entries.

Current branch push (owner runs it): `git push -u origin feat/redesign`. Review locally and the preview before a main merge; merging is a live deployment.
