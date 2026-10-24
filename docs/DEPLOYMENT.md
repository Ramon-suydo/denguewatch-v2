# Deployment and local staff setup

Use Node 22.12+ and `npm ci`. Current branch: feat/manila-evidence. Public pages
work without Supabase from committed historical JSON. `npm run demo` is the
one-command production-demo entry after dependency installation.

## Local staff stack (Docker prerequisite)

1. Start a **local** Docker installation.
2. Run `npm run setup:local`. It verifies a local Docker context, starts Supabase,
   applies `migration up --local`, checks loopback API/DB URLs, imports the three
   supplied official source files, creates/reuses the local demo admin, and sets
   reporting_v2_policy.enabled=false. It does not reset/delete existing DB data.
3. Read the ignored `.artifacts/local-staff-credentials.json` privately. It holds a
   generated random password, not a shared committed password. Protect the file.
4. Run `npm run staff:dev` (or add `-- --port 43126`), then open `/admin` at the
   printed localhost address. Mode staff reads only public local keys from ignored
   `.env.staff.local`; the service-role key stays in setup-process memory.
5. Confirm an empty queue, role checks and CSV preview. No sample health reports
   are seeded and collection stays closed. Refreshing loses the memory-only
   session; sign in again. For local duplicate/abuse evidence use `npm test`.

The Docker/Auth end-to-end setup could not be run on this laptop because Docker
is absent. The installed CLI help and loopback refusal guard were verified; the
full migration/RLS/PoW/upload/purge behavior is tested in isolated PGlite. Do not
call this a verified hosted staff deployment.

The source-area catalog has 897 exact NAMRIA barangay labels including suffixes,
using native PCODE + exact label, not guessed PSGC replacements. Two non-barangay
objects are excluded. It is not a certified current administrative count. City-only
reporting is available when a source label is missing or the user declines detail.

## Hosted review and deployment

**First rotate the local DB credential that matches a public project identifier.**
Do not put a database URL, staff token or service-role/secret key in VITE_* variables.
Only the Supabase URL and public anon/publishable key belong in browser config.
Build guards reject private key names, non-anon JWTs and credential-bearing URLs.

The following migrations are prepared locally, not applied to hosted Supabase:
- `20261025000100_reporting_and_staff.sql`
- `20261025000200_manila_area_catalog.sql`

Review them with the owner/DPO, back up/prepare rollback, and apply only after
explicit owner authorization. The first permanently closes legacy submission
entrypoints, creates v2 roles/reporting/upload/audit boundaries, extends the purge,
and reuses/schedules the hourly job when pg_cron is available/preloaded. If not,
it emits a notice and collection remains closed pending review. Check both
`cron.job` and `cron.job_run_details`; a schedule row is not execution evidence.
[Official Supabase Cron documentation](https://supabase.com/docs/guides/cron).

Appoint real staff through Supabase Auth and private.staff_roles using actual
verified user UUIDs, never JWT user metadata. The configured local policy disables
signup and strengthens passwords; hosted Auth settings and MFA need separate
owner verification. Never publish a shared demo password. Do not run the retired
`reports:enable`; launch needs a later explicit owner/DPO decision and copy review.

For Vercel use Node22, install `npm ci`, build `npm run build`, output `dist`.
`vercel.json` defines SPA rewrites and CSP/security headers; test the deployed
responses. Feature pushes may create previews; **main pushes deploy production**.
No hosting integration settings were changed by this task.

## Publish the reviewed branch

```powershell
git status --short
git push -u origin feat/manila-evidence
```

Open the first PR against feat/manila-redesign per CONTRIBUTING.md. Test locally,
self-review the schema/auth diff and preview, and keep defense-v1 unchanged before
any merge near the defense. The configured remote is Ramon-suydo/denguewatch-v2;
the supplied standalone prompt names Ramon-sufile. No remote was changed.

## External verification after deployment

Run `npm run security:zap -- https://your-deployed-preview.example` with Docker;
review/save generated HTML/JSON. No scan result is claimed yet.

For a local mobile Lighthouse run, start the production preview, then run
`npm run audit:lighthouse -- http://127.0.0.1:43125/`. The wrapper uses a temporary
Node22/Lighthouse13 toolchain; CHROME_PATH may point to installed Edge/Chrome.
Saved reports are lab evidence for this revision, not field performance or a
WCAG certification. Human SUS results remain blank until actually collected.
