# Expanded Manila count research - 2026-10-28

Current branch: `feat/expanded-forecast`, continuing from `feat/live-manila` / group-guide commit `ce949e7`. All five raw files are audited/reconciled in a separate count pipeline. Twelve candidates test history/season, delayed ERA5 weather, lagged complete NCR months, daily shape, and pooled-city water/elevation/density context. A separate recent refit explicitly downweights the nine estimated 2026 targets. The old classifier, historical data/evaluation and provisional ratio reference are preserved.

Open **Our Model -> Review expanded count models**, the Live-card comparison link, or `/expanded-model`. Current experimental refits are about 201 / 185 cases for weeks ending 1 / 8 November, from the source through 25 October. Reliable improvement over persistence is not established: selected one-week test MAE 9.989 vs 10.000, two-week 13.241 vs 12.667, both skill intervals crossing zero. Source matching/freshness hides inapplicable counts; no calibrated 2026 interval is claimed.

Verified locally: 98 existing plus 10 new scientific tests, 64 browser, 18 production, 6 PWA, types/lint/build/data/contrast/budget and deterministic numerical reproduction. Visuals: 16 intended model baselines refreshed; 79 independent comparisons passed in the full run and the remaining About capture passed a targeted rerun against its untouched baseline. [Actual checks and retained diagnostics](evidence/expanded-manila-checks.md), [methods/results](EXPANDED_MANILA_MODEL.md).

No push, main merge, hosted write/migration or collection activation. Existing credential rotation, source evidence/definitions/republication, hosted setup, DPO and human/native-language gates remain. Test locally and self-review before merging; main deploys automatically. User push: `git push -u origin feat/expanded-forecast`.

---

# Live Manila provisional panel - 2026-10-28

Current branch: `feat/live-manila`, from remote main `a683b3b` with the completed UI prerequisite merged locally at `11daef8`. The 2026 source has its own generated JSON and append-only aggregate version table. Frozen historical ratio quantiles generate provisional one-/two-week ranges; this is not the 17-city classifier. Dashboard mode controls share state. Live shows Manila only, neutral other areas, dated values, estimated hatches, source limitations and care guidance. Stale data returns to Replay after 14 days.

Local checks completed so far: 98 unit/integration tests, 60 full browser cases, 18 production cases, 5 PWA cases, all 80 independent visual comparisons and 28 cases each in Chrome/Edge/Firefox/WebKit. Current release measurements, evidence and owner gates are in [live-manila-checks.md](evidence/live-manila-checks.md). All 121 pre-existing historical/model/source/export artifacts remain byte-identical. The new schema is locally tested; no hosted migration, write, push or deployment is claimed.

NEEDS OWNER: all 13 source links/screenshots, first prior total and missing interpolation explanations, counting-definition/scale verification, republication permission, weekly update ownership, adviser wording and native Filipino review. Existing credential/contact/photo/DPO/collection gates remain. Reporting is closed. Main automatically deploys; test locally and self-review before merging. Push only when ready: `git push -u origin feat/live-manila`.

---

Earlier checkpoints below are historical.

# Manila-first landing and model demo - 2026-10-27

Branch: `feat/ui-overhaul`, continuing from `1ed560a`. Implemented: Manila-led hero and weekly history/dated-estimate chart; a separate district-grouped section for the other 16 NCR areas; a dedicated `/our-model` past-week prediction/outcome comparison; four visible navigation destinations; retained original identity, care guidance and gated reporting.

Three consecutive full browser runs passed 54 tests each before an unexpected PC restart interrupted production verification. Build, lint/types, 87 unit/integration tests, contrast and fresh database verification passed. The resumed production suite passed 18 tests, PWA passed 5, and all 80 independent visual comparisons passed. Four browser engines passed 20 cases each. Mobile Lighthouse measured 96 performance / 100 accessibility, LCP 2.415 s and CLS 0. Dependency audit found 0 vulnerabilities; local passive ZAP found 0 high/medium alerts. Full secret audit remains NEEDS OWNER (0 current / 44 known historical / 0 unexpected). The current [check report](evidence/manila-focus-checks.md) and [manifest](evidence/ui-command-manifest.json) record actual commands and limitations. Prior checkpoints below are historical.

No data, model, schema, submission/security, moderation, retention or map fallback behavior changed. Manila's dated count estimate remains historical; the RF demo estimates a high-case event, not a case count. Approved recent data is still needed for a current forecast.

Owner gates remain: known historical credential rotation; approved controller/contact; photo permission; native Filipino review; hosted Auth/MFA/purge/schedules/log verification; DPO approval; real iOS/device, screen-reader and usability review; field INP. Reports remain closed. No hosted write, push or main merge is included.

Test locally and self-review before merging; every main push deploys Vercel. User push command: `git push -u origin feat/ui-overhaul`.

---

# Bay & care UI overhaul checkpoint (2026-10-27)

Active branch: `feat/ui-overhaul`. The owner wants DengueWatch to have its own personality; iACADEMY is not a reference. The branch starts from fetched main `de0d22c` and retains the reviewed ML/map prerequisite `5d9bdb4`. No new model, data, schema, submission-security, moderation or retention changes are included.

The four public pages now use an original drop/wave identity, Fraunces and Figtree, day/night/automatic appearance, readable surfaces, a local boundary preview, source-derived example weeks, a city sheet, a gated reporting stepper and editorial credits. Verified: 86 unit/integration tests, three consecutive 51-test UI runs, a final 7-test presentation/a11y follow-up, 18 production tests, 4 PWA tests and 64 independent visual comparisons. Mobile Lighthouse measured 97 performance / 100 accessibility, LCP 2.446 s and CLS 0. Technical evidence and final gate results: [UI overhaul checks](evidence/ui-overhaul-checks.md). Brand, components and motion: [BRAND](BRAND.md), [DESIGN_SYSTEM](DESIGN_SYSTEM.md), [MOTION](MOTION.md). Decisions and evidence limits: [UX_DECISIONS](UX_DECISIONS.md).

| Numbered step | Reviewable change | Status / commit |
|---|---|---|
| 1 | Original brand, source audit and shared tokens | DONE - `cffff93` |
| 2 | Shell, nav/footer, typography, themes and components | DONE - `b8f7d6a` |
| 3 | City search, shared-week preview, care and evidence Dashboard | DONE - `9afaade` |
| 4 | Mixed default, floating map controls, sheet and scrubber | DONE - `6b212e3` |
| 5 | Coarse reporting stepper, separate gated states and receipt | DONE - `352f420` |
| 6 | About, methods and attribution | DONE - `865aba3` |
| 7 | Motion, rendered accessibility, performance, snapshots and review bundle | DONE locally - final source commit recorded in the review archive |

NEEDS OWNER: approved controller/contact (personal Gmail remains unpublished), photo source/licence/permission, team fields, native Filipino review, known historical credential rotation, hosted Auth/MFA/purge/schedules/log retention, DPO approval before any collection, and real bilingual/screen-reader usability. The absent reference screenshot is recorded; it does not authorize borrowing another site's identity. Collection stays closed.

NOT VERIFIED: real iOS Safari/device checks and field INP under 200 ms. Local WebKit is engine compatibility evidence. Lighthouse TBT does not establish INP. Lab screenshots and axe assertions do not replace human review.

No push, main merge, hosted write, migration or collection activation occurs in this task. Exact push command: `git push -u origin feat/ui-overhaul`. Test locally and self-review before merging near the defense; every main push automatically deploys Vercel.

---

# Current NCR ML/map checkpoint (2026-10-26)

Local verification is complete for application source `a0e4240`: 85 unit/integration tests, four ML leakage tests, 600-row parity, three consecutive 44-test UI runs, 18 production and three PWA tests. Full evidence, retained diagnostics and owner-blocked gates: [mlux-checks.md](evidence/mlux-checks.md). The secret audit remains NEEDS OWNER (0 current / 44 known historical / 0 unexpected); hosted and human checks are not certified. Exact push: `git push -u origin feat/ml-map-ux`. Main was not pushed. Test locally, self-review and inspect the preview before merging; main merge deploys Vercel.

Active branch: `feat/ml-map-ux`, based on main `de0d22c`. Current scientific method and results: [ML_METHOD.md](ML_METHOD.md) and [ML_EVALUATION.md](ML_EVALUATION.md). Map and UX: [MAP_DESIGN.md](MAP_DESIGN.md), [UX_DECISIONS.md](UX_DECISIONS.md). Final verification is recorded in [evidence/mlux-checks.md](evidence/mlux-checks.md); previous redesign passes below do not certify this feature.

Implemented: 17-area chronological DT/RF research, calibration and all three baselines, onset and robustness analyses, Python/TypeScript parity, dated Replay/guarded Live, AAL2 reviewed CSV versioning with audit/rollback, a lazy MapLibre map with a real local PMTiles extract and polygon/SVG fallbacks, and a simpler bilingual Dashboard. Persistence wins held-out F1. Missing calendar weeks remain missing. No current outbreak forecast is inferred from old data.

NEEDS OWNER: newer reviewed 17-city counts; original photo source/licence/permission; team/controller/contact details; credential rotation; hosted migration/Auth/MFA/purge/schedule/log-retention verification; DPO approval before collection; actual English/Filipino/screen-reader usability sessions. Local checks do not establish successful hosted operation. Reports remain closed. IEEE citation metadata is resolved; independent full-text protocol verification is still unavailable.

Test locally, self-review and inspect the feature preview before merging this schema/UI work near the defense. Main merge automatically deploys Vercel. No feature push, main merge, hosted migration or report activation is included in this task.

---

# Three-page redesign status (2026-10-25)

Active work is on `feat/redesign`, based on latest main e9a3047. No redesign deployment is authorized by this branch alone. Every main push automatically deploys Vercel; review locally and inspect the preview before merging this schema/UI change near the defense.

Implemented: photographic Dashboard, local national outlook, coarse anonymous report flow and footer-linked About; optimized source-preserving AVIF/WebP; measured pixel contrast prebuild gate; explicit national crosswalk; strictly earlier-year rank validation; weather excluded after failed improvement gate; generated npm/Python credits; bilingual privacy and actual server receipt; a forward-only report-scope/rate-hash migration.

Local redesign gates are DONE: 77 unit/integration tests, 25 SQL checks plus one local authenticated UI flow, three consecutive 36-test UI runs, 10 production tests, three offline/PWA tests, 30 measured hero-text contrast targets, mobile Lighthouse 93.0/100 performance/accessibility, zero high/medium local passive ZAP alerts and zero npm audit findings. Evaluation reproduction checked 14 byte-identical outputs. Detailed commands, source/build commits, retained failures and verification limits: [redesign-checks.md](evidence/redesign-checks.md) and [redesign-status.json](evidence/redesign-status.json).

Release remains NEEDS OWNER: the secret audit reports zero current, 44 known historical and zero unexpected historical findings; rotation is deferred. No hosted deployment, successful live operation, participant collection, human usability or DPO approval is claimed. Older launch records below remain historical.

NEEDS OWNER: photo source/licence/written permission; team/school/contact fields in src/content/about.json; credential rotation; Supabase/Vercel deployment and hosted schedules/Auth/log-retention verification; validated reporting geography and population/catchment mapping; institutional DPO review before opening collection; actual usability sessions. No hosted writes or real participant records are used in this work.

---

> Publication update (2026-10-25, Asia/Manila): the owner explicitly requested publishing all committed work to main, overriding the earlier local-only instruction. Source and review bundle were pushed at 5a422d0. Earlier results below describe the pre-publication checkpoint. Credential rotation and hosted/human verification remain pending; publication does not establish deployment success or authorize reporting activation.

# Implementation status

Updated 2026-10-25T07:14:00.872864+00:00. Work is local on fix/launch. Main has not been merged or pushed; main pushes automatically deploy. The owner explicitly chose to defer credential rotation and continue locally. **The release is blocked.**

| Gate | Fresh local evidence | Status |
|---|---|---|
| Install, lint, types, geography, contrast, production build | npm ci; npm run lint; npm run typecheck; npm run test:geography (3); npm run test:contrast; npm run build: pass | DONE |
| Unit/integration | npm test: 72 passed, zero skipped | DONE |
| Fresh database | npm run db:verify: 24 SQL tests and 1 authenticated UI flow passed; all 11 forward migrations apply, migration ledger rerun is idempotent | DONE locally |
| Browser stability | npm run test:ui: 31 passed in each of ui-verified-1, ui-verified-2, ui-verified-3, sequential runs; baseline default and one-worker runs also passed 29/29 before fixes | DONE |
| Production and offline | npm run test:production: 5 passed; npm run test:pwa: 3 passed, including actual strict-CSP styles | DONE |
| Accessibility | Browser axe assertions: zero critical/serious issues, including signed staff workspace | DONE within tested routes |
| Dependency audit | npm audit --json: zero vulnerabilities | DONE |
| Shipped attribution/filler | npm run data:validate passed; full marker inventory retained | DONE |
| Evaluation and accuracy | npm run evaluate passed offline; evaluation, environmental evaluation and weekly outputs byte-identical; UI checks all 18 scenario/model/horizon MAE cells against saved output | DONE |
| Secret audit | npm run security:secrets: 0 current findings, 44 known historical blobs, 0 unexpected history findings; exit 1 because owner deferred rotation | NEEDS OWNER |
| Lighthouse mobile | Fresh 2026-10-25T07:11:46.373Z: performance 97, accessibility 100, best practices 96, SEO 100 | DONE |
| ZAP local passive baseline | Fresh 2026-10-25T07:12:50.741Z: 0 High/Medium, 2 lower alerts retained | DONE |
| Hosted verification and human approvals | No live connection, migration, reporting activation, deployed scan, usability or DPO approval claimed | NEEDS OWNER |

## Root-cause corrections

The reproduced production retry failure came from a cache-first service worker bypassing API interception: the captured network response was 200 instead of the intended 503. The same test passed when only service workers were blocked. Ordinary UI tests now block workers, while PWA tests retain them; the error/retry test asserts an actual visible accessible alert and retry. Health-URL readiness and retained failure traces/videos support diagnosis. A later navigation-status regression made external requests on the offline map; status lookup is now scoped to home/report/community, preserving the original no-network map assertion. The failed run is retained. The older copied-bundle failures were not reproduced in the canonical checkout; their historical cause remains unverified.

Forward migrations correct source citations without changing applied SQL, protect retention RPC execution, enforce AAL2 for current staff RPCs and legacy admin RLS. Staff sign-in performs real SDK MFA enrollment/challenge; hosted execution remains pending. Database policy drives public collection status and fails closed. Reports stay unverified, delayed, threshold-suppressed and separate from official observations and models. Local signed Auth/PostgREST fixtures use actual SQL and disposable synthetic records; they are clearly labeled and excluded from production builds.

The first passive ZAP run found a Medium inline-style CSP weakness. The CSP now disallows inline style attributes; production chart/style tests pass and the final passive scan has no High/Medium findings. No active or authenticated penetration test is claimed.

Manila case observations end 2023-12-02 and NCR ends 2021-01-10. These are historical research displays. Weather has its own status/date and unavailable fallback. Public charts default to complete-row scenario M; scenario Z assumes missing daily dates are zero only within coverage. The one-week forecast is last week's value; longer ridge comparisons are exploratory with wide uncertainty. Weather did not establish an operational improvement. Saved MAEs feed the visible accuracy table. Saved-checksum labels do not claim a fresh hosted full-row audit.

The retired activation command initially exceeded its unchanged five-second regression timeout because it imported database/forecast modules before rejecting the command. It now rejects before dynamically importing those modules. The original failed log and later passes are retained. No test or safeguard was skipped, deleted or weakened.

## NEEDS OWNER

1. Rotate the Supabase database password and affected server API keys in the dashboard. Privately update ignored .env.local, hosting environment variables and Actions secrets. Do not paste any values. Set CREDENTIALS_ROTATED=1 only after rotation. Configure the private exposure-guard secret using docs/ROTATE_CREDENTIALS.md.
2. Run `npm run credentials:verify`, `npm run security:secrets`, `npm run hosted:bootstrap`, then `npm run db:verify -- --hosted`. If verification requires pending migrations, bootstrap after rotation and repeat verification. The audit attestation is not proof of revoked hosted credentials.
3. Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD privately; run `npm run hosted:admin`; remove the bootstrap password. Enroll/verify TOTP through the staff flow and exercise an actual hosted AAL2 login and authorized moderation. Local test JWTs are not hosted Auth proof.
4. Configure repository variables SUPABASE_URL and DEPLOYED_URL, protected retention server-key secret, the private exposure fingerprint secret, and CREDENTIALS_ROTATED. Manually run Community retention and ZAP baseline workflows; inspect successful current-code runs/artifacts. Verify pg_cron or the active hourly Actions fallback using `npm run db:verify -- --hosted`. A YAML schedule alone is not proof of execution.
5. Perform a real usability session and school/DPO review of consent, retention, withdrawal and institutional responsibility. Resolve original source retrieval dates, formal citation/redistribution terms, absence semantics and population attribution with source owners. No participants, approvals or source dates have been invented.
6. Test locally and self-review the auth/schema changes before merging near the defense. Re-run required release gates in the intended environment. Only after every gate passes, set `$env:LAUNCH_GATES_PASSED = '1'` and run `npm run hosted:bootstrap -- --enable-reporting`. Emergency closure: `npm run reports:off`. Do not enable collection merely to demonstrate a test.

Full numbered dashboard and command instructions: [ROTATE_CREDENTIALS.md](ROTATE_CREDENTIALS.md). All private configuration stays out of Git.
