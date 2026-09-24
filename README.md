# DengueWatch

Vite + React + TypeScript + Tailwind scaffold with Supabase data migrations.
Public dashboard, city history, NCR map, and voluntary community reporting built on the shared design system.
Run npm run dev to review it locally. Public pages read Supabase; hosted app migrations and report activation require the setup described below.

- [Public app, forecast formula and hosted setup](docs/PUBLIC_APP.md)
- [Design system, contrast and preview checks](docs/design-system.md)

- [Dataset findings](docs/DATA_QUALITY.md)
- [Migrate, ingest, and verify](docs/DATABASE_SETUP.md)
- [Community privacy and RPC contract](docs/COMMUNITY_PRIVACY.md)
- [Branch and commit workflow](CONTRIBUTING.md)
- [Vercel deployment](DEPLOYMENT.md)

Use Node 22.12+. Run npm ci, npm run data:audit, npm test, and npm run build.
Copy .env.example to ignored .env.local and fill local configuration before
connecting to Supabase. Database credentials are never browser variables.

Historical files are supplied as DOH/FOI sources. Exact citation placeholders
remain for the owner to fill. Monthly, weekly, and daily observations overlap;
never add their totals together. Source anomalies and missingness are preserved.
