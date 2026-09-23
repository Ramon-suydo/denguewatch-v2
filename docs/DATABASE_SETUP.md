# Database setup and verification

The app scaffold intentionally renders no UI. The SQL and importer are ready;
a successful dry run or isolated test is not proof of a hosted Supabase load.
Do not build data-dependent screens until the hosted verification below passes.

## Prerequisites

Use Node 22.12+ (the repository .nvmrc selects Node 22). The existing machine had
Node 20; development checks used an isolated Node 22 runtime without changing it.
Use a dedicated DengueWatch Supabase project. Do not point these initial migrations
at the old Sequelize schema or an unrelated project.

```powershell
Set-Location 'D:\Project\denguewatch-v2'
node --version
npm ci
Copy-Item .env.example .env.local
```

Copy the example only if .env.local does not already exist. Edit it locally:

- VITE_SUPABASE_URL: the project's public API URL.
- VITE_SUPABASE_ANON_KEY: the public anon/publishable key, never a service-role key.
- DIRECT_DATABASE_URL: PostgreSQL URL from Supabase's Connect panel. Use the direct
  connection or session pooler on port 5432, with a percent-encoded password.
  The session pooler can be used when the direct endpoint is unreachable over IPv4.
- DB_SSL_CA_FILE: optional trusted CA certificate PEM path if needed. The importer
  verifies TLS for remote hosts and never disables certificate verification. Point
  this setting at the actual certificate file (for example,
  C:/certificates/prod-ca-2021.crt), not its parent folder.

The database URL stays on your machine. Never put it in Vercel's VITE_ variables,
source files, screenshots, or chat. Ingestion uses pg over a privileged database
connection; it does not need a service-role API key. Owner-level ingestion is a
manual administrative operation, not a public app capability.

## Apply migrations

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase migration list --linked
npx supabase db push --linked --dry-run
npx supabase db push --linked
npx supabase migration list --linked
```

Replace YOUR_PROJECT_REF with the reference from your project URL/settings.
Supply the database password when prompted. Inspect the dry run and confirm only
this project's two migrations are pending. Do not use db reset --linked: that
would rebuild the remote database. The CLI configuration does not automatically
apply local auth/config settings to the hosted project.

## Audit, ingest, and verify

```powershell
npm run data:audit
npm run ingest
npm run db:verify
```

The importer validates all three files before connecting, takes an advisory lock,
and upserts LGUs plus surveillance rows in one transaction. It compares every
stored source value/quality flag/checksum against the parsed records, checks
per-source row counts/date ranges/totals, then commits. Any mismatch rolls back
all writes. Repeating ingestion adds no duplicates, preserves existing citation
edits and LGU activation settings, and leaves unchanged ingestion timestamps alone.

Expected: 17 LGUs; 1,037 monthly + 4,403 weekly + 1,910 daily = 7,350 records.
Backtests and community reports must remain empty unless deliberately populated
later. There are no synthetic/demo seed rows in the deployed migrations/importer.

`.artifacts/database-verification.json` is written only after a successful database
check and records the target host and verification time without credentials.

In Supabase SQL Editor, run `supabase/verification.sql`. Its first result should be:

| Source period | Rows | LGUs | Start | End | Cases | NULL death rows |
| --- | ---: | ---: | --- | --- | ---: | ---: |
| month | 1,037 | 17 | 2016-01-01 | 2021-01-01 | 116,147 | 0 |
| week | 4,403 | 17 | 2016-01-10 | 2021-01-10 | 116,147 | 1 |
| day | 1,910 | 1 | 2018-01-01 | 2023-12-02 | 14,635 | 1,910 |

Do not sum the Cases column across sources. SQL Editor normally runs privileged;
it is not a test of anonymous RLS. The verification file includes transactionally
scoped anon checks and privilege inspection. Local automated tests additionally
exercise anon, ordinary authenticated and explicitly appointed admin roles.

## Admin appointment

Create/invite the administrator using Supabase Auth, then run this as the project
owner in SQL Editor, replacing the UUID with that Auth user's actual ID:

```sql
insert into private.admin_users (user_id)
values ('YOUR_AUTH_USER_UUID'::uuid)
on conflict do nothing;
```

Removing this row removes administrator authorization on the next database request.
No user-editable metadata, signup field, or stale role claim can self-appoint an
admin. Keep the private schema out of exposed Data API schemas. This table is
intentionally unmodifiable by ordinary users, including application admins.

## Citations

Replace the placeholder for each exact source using parameterized/admin SQL, e.g.:

```sql
update public.historical_surveillance
set source_citation = 'YOUR EXACT DOH/FOI CITATION, REQUEST ID AND URL'
where source = 'ncr_dengue_monthly_with_rates.csv';
```

Do this separately for all three filenames; the monthly derivation should be
acknowledged. Reruns preserve citation edits. See DATA_QUALITY.md before using the
data for thesis claims, especially source death anomalies and partial coverage.

## Validation and deployment

```powershell
npm test
npm run build
git push -u origin feat/historical-data
```

The tests run migrations and all real-source rows in disposable PGlite PostgreSQL,
with a minimal simulated Supabase auth boundary. They do not contact the hosted
project and do not replace hosted RLS/API verification.

Test locally and self-review before merging this schema/auth branch. A main push
is live on Vercel; database migrations are run manually, not by Vercel builds.
Set Vercel's Node runtime to 22.x. No user interface is included in this milestone.

References: [Supabase migrations](https://supabase.com/docs/guides/local-development/database-migrations),
[database functions](https://supabase.com/docs/guides/database/functions),
[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
