# DengueWatch

Vite + React + TypeScript + Tailwind scaffold with Supabase data migrations.
The app opens a responsive design-system preview with illustrative data for identity approval.
Run npm run dev to review it locally; no live health data is fetched.

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
