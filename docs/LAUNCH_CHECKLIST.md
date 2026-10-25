# Current redesign checkpoint

Active branch: `feat/redesign`. Application source: `c2a6751`. Local redesign gates are DONE: 77 unit/integration tests, 25 SQL checks plus one local authenticated UI flow, three consecutive 36-test UI runs, 10 production tests, three offline/PWA tests, 30 measured hero-text contrast targets, mobile Lighthouse 93.0/100 performance/accessibility, zero high/medium local passive ZAP alerts and zero npm audit findings. Evaluation reproduction checked 14 byte-identical outputs. Detailed commands, source/build commits, retained failures and verification limits: [redesign-checks.md](evidence/redesign-checks.md) and [redesign-status.json](evidence/redesign-status.json).

NEEDS OWNER: photo source/licence/written permission; src/content/about.json team/controller/contact; credential rotation; hosted Vercel/Supabase/Auth/MFA/schedules/log-retention verification; DPO review; real usability and Filipino review; verified population/catchment mapping. Collection stays closed. Test locally, self-review and inspect the feature preview before merging; main merge automatically deploys Vercel.

---

> Publication update (2026-10-25, Asia/Manila): the owner explicitly requested publishing all committed work to main, overriding the earlier local-only instruction. Source and review bundle were pushed at 5a422d0. Earlier results below describe the pre-publication checkpoint. Credential rotation and hosted/human verification remain pending; publication does not establish deployment success or authorize reporting activation.

# Launch checklist

**BLOCKED: owner deferred credential rotation. Do not push main or activate reporting.** Updated 2026-10-25T07:14:00.872864+00:00.

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

## NEEDS OWNER

1. Rotate the Supabase database password and affected server API keys in the dashboard. Privately update ignored .env.local, hosting environment variables and Actions secrets. Do not paste any values. Set CREDENTIALS_ROTATED=1 only after rotation. Configure the private exposure-guard secret using docs/ROTATE_CREDENTIALS.md.
2. Run `npm run credentials:verify`, `npm run security:secrets`, `npm run hosted:bootstrap`, then `npm run db:verify -- --hosted`. If verification requires pending migrations, bootstrap after rotation and repeat verification. The audit attestation is not proof of revoked hosted credentials.
3. Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD privately; run `npm run hosted:admin`; remove the bootstrap password. Enroll/verify TOTP through the staff flow and exercise an actual hosted AAL2 login and authorized moderation. Local test JWTs are not hosted Auth proof.
4. Configure repository variables SUPABASE_URL and DEPLOYED_URL, protected retention server-key secret, the private exposure fingerprint secret, and CREDENTIALS_ROTATED. Manually run Community retention and ZAP baseline workflows; inspect successful current-code runs/artifacts. Verify pg_cron or the active hourly Actions fallback using `npm run db:verify -- --hosted`. A YAML schedule alone is not proof of execution.
5. Perform a real usability session and school/DPO review of consent, retention, withdrawal and institutional responsibility. Resolve original source retrieval dates, formal citation/redistribution terms, absence semantics and population attribution with source owners. No participants, approvals or source dates have been invented.
6. Test locally and self-review the auth/schema changes before merging near the defense. Re-run required release gates in the intended environment. Only after every gate passes, set `$env:LAUNCH_GATES_PASSED = '1'` and run `npm run hosted:bootstrap -- --enable-reporting`. Emergency closure: `npm run reports:off`. Do not enable collection merely to demonstrate a test.

Full numbered dashboard and command instructions: [ROTATE_CREDENTIALS.md](ROTATE_CREDENTIALS.md). All private configuration stays out of Git.

## Branch handoff

The completed local task is committed on fix/launch. To publish the review branch when ready: `git push -u origin fix/launch`. Main must not be updated until every gate passes. Once approved and every gate is independently checked, fetch current main and review ancestry/conflicts before any merge; never force push. The main deployment and real hosted smoke test remain owner work.
