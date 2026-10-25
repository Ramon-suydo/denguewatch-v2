> Publication update (2026-10-25, Asia/Manila): the owner explicitly requested publishing all committed work to main, overriding the earlier local-only instruction. Source and review bundle were pushed at 5a422d0. Earlier results below describe the pre-publication checkpoint. Credential rotation and hosted/human verification remain pending; publication does not establish deployment success or authorize reporting activation.

# Security test evidence

Updated 2026-10-25T07:14:00.872864+00:00. All results are local unless explicitly identified otherwise.

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

## Passive scanner scope

Docker is unavailable. Official-checksum-verified portable Java 17 and ZAP 2.17.0 ran the equivalent public passive automation plan against the local production preview. No active scan or authenticated scan ran. The first Medium CSP finding and full first report/log are retained in the review bundle; the final reports are [zap-local.html](evidence/zap-local.html), [JSON](evidence/zap-local.json), and [summary](evidence/zap-local-summary.json). Informational/lower findings are retained. Production browser tests verify strict CSP and public-only PWA caching.

## Credential and data scope

The audit scans current source, staged content, nested ZIP members and reachable history without printing matching values. Current tree has zero findings, but 44 known historical blob exposures and deferred rotation intentionally keep the full audit failed. History was not rewritten. A pre-commit hook scans staged data; CI requires private guard configuration plus truthful rotation attestation, and live credential verification is separate. No real community reports were loaded, exported or seeded into production. Test Auth JWTs and PostgreSQL roles are disposable synthetic scaffolds. Owner-confirmed API revocation, deployed credentials, actual Supabase Auth/TOTP and security posture remain unverified.

## NEEDS OWNER

1. Rotate the Supabase database password and affected server API keys in the dashboard. Privately update ignored .env.local, hosting environment variables and Actions secrets. Do not paste any values. Set CREDENTIALS_ROTATED=1 only after rotation. Configure the private exposure-guard secret using docs/ROTATE_CREDENTIALS.md.
2. Run `npm run credentials:verify`, `npm run security:secrets`, `npm run hosted:bootstrap`, then `npm run db:verify -- --hosted`. If verification requires pending migrations, bootstrap after rotation and repeat verification. The audit attestation is not proof of revoked hosted credentials.
3. Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD privately; run `npm run hosted:admin`; remove the bootstrap password. Enroll/verify TOTP through the staff flow and exercise an actual hosted AAL2 login and authorized moderation. Local test JWTs are not hosted Auth proof.
4. Configure repository variables SUPABASE_URL and DEPLOYED_URL, protected retention server-key secret, the private exposure fingerprint secret, and CREDENTIALS_ROTATED. Manually run Community retention and ZAP baseline workflows; inspect successful current-code runs/artifacts. Verify pg_cron or the active hourly Actions fallback using `npm run db:verify -- --hosted`. A YAML schedule alone is not proof of execution.
5. Perform a real usability session and school/DPO review of consent, retention, withdrawal and institutional responsibility. Resolve original source retrieval dates, formal citation/redistribution terms, absence semantics and population attribution with source owners. No participants, approvals or source dates have been invented.
6. Test locally and self-review the auth/schema changes before merging near the defense. Re-run required release gates in the intended environment. Only after every gate passes, set `$env:LAUNCH_GATES_PASSED = '1'` and run `npm run hosted:bootstrap -- --enable-reporting`. Emergency closure: `npm run reports:off`. Do not enable collection merely to demonstrate a test.

Full numbered dashboard and command instructions: [ROTATE_CREDENTIALS.md](ROTATE_CREDENTIALS.md). All private configuration stays out of Git.
