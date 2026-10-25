# Security test evidence

Local tests use synthetic isolated fixtures only; no hosted health report was
submitted. Full current migration tests are in tests/reporting-v2.test.ts.
Legacy v1 regression tests are deliberately isolated to the five original
migrations; the full-migration suite separately proves the legacy submit path is
permanently closed. Do not cite legacy insert tests as current public permission.

| Abuse / behavior | Executable evidence | Result |
| --- | --- | --- |
| Unauthenticated staff access | reporting-v2.test.ts role tests; staff-reporting.spec.ts direct /admin paths | Denied / login only; no queue RPC before authentication |
| Nonstaff or moderator upload attempt | Full migration role tests | Denied server-side |
| Public individual-report read | anon and ordinary authenticated SELECT, queue-RPC tests | Denied; no raw SELECT grant even to staff |
| Missing consent / honeypot / bad symptom / future onset / unknown area | Full migration submit tests | Rejected before storage |
| Proof replay | Reuse consumed challenge/nonce | Rejected |
| Tracking-code guessing / withdrawal | Invalid and matching code calls; no raw lookup; hash at rest | Generic response; valid withdrawal clears fields and suppresses group |
| XSS and PII in note | SQL scrub test plus browser sanitized preview | Common phone/email removed; tags stripped; remaining text never injected as HTML |
| Spam burst / duplicates | Repeated same area/date and local burst fixtures | Quarantined; not published |
| SQL injection / malformed upload | SQL-like city name, negative count, duplicate, non-Sunday | Rejected; no official rows changed |
| Moderation and audit | Moderator approvals and queue reads | Role checked, audit recorded, review does not validate diagnosis |
| Small groups / delayed publication | Three approved reports, recent then aged, then withdrawn | Recent hidden; >=72h and >=3 required; withdrawal suppresses again |
| Upload preview/publication/rollback | Admin staging, invalid transitions, public reviewed export | Atomic, audited, rollback removes version from public export |
| Retention / RLS / purge permissions | Age to >90 days; private purge; table RLS catalog inspection | Expired rows removed; all new tables RLS; public purge denied |
| Client credential exposure | Vite private-key-name/service-role build tests | Build rejected |
| Browser cache leakage / headers | Production PWA suite | Public-only cache; staff/Supabase requests excluded; CSP/frame/nosniff verified locally |

Commands: `npm test`, `npm run test:ui`, `npm run build`, `npm run test:pwa`,
`npm run lint`, `npm audit --audit-level=high`.
Local evidence at this checkpoint: 66 unit/integration tests, 29 browser checks,
2 production PWA checks; all pass. Lint zero warnings; clean install and build
pass. Actual runtime for final verification is Node 22.23.2. Reports/roles are
local fixtures; real hosted staff login and scheduled purge execution are not
proven by these checks.

**ZAP not run:** no Docker executable and no confirmed deployed URL for this
revision. docs/evidence/zap-status.json is not a scan report. Run
`npm run security:zap -- https://your-deployed-preview.example` with Docker and
retain/review the generated HTML/JSON. Lighthouse mobile evidence is stored under
docs/evidence; it is a lab measurement, not field performance or WCAG certification.

**Secret gate unresolved:** historical scan detects the known local database
password because it equals a public project identifier. Rotate the credential;
do not report a clean secret gate or try to solve it by hiding scan failures.
