# Session handoff - 2026-09-24

Current branch: feat/historical-data.

## Completed

- Blank Vite/React/TypeScript/Tailwind scaffold; no application UI built.
- Supabase migrations, protected community RPCs, and published-data importer.
- Hosted ingestion and full source-row verification succeeded: 17 LGUs and
  7,350 records (1,037 monthly, 4,403 weekly, 1,910 daily).
- Fixed the local CA certificate path and added clear certificate validation.
- Last validation: 10 tests passed and the production build passed.
- Source findings, missing periods, and anomalies are in DATA_QUALITY.md.

## Resume

Read DATABASE_SETUP.md and COMMUNITY_PRIVACY.md, then continue with the user's
next build prompt. Do not combine overlapping historical sources or mix community
self-reports with official surveillance. No forecast accuracy results exist yet;
backtesting belongs to the later forecasting prompt. Exact DOH/FOI citations
still need to replace their placeholders.

Working credentials and the CA path remain in ignored .env.local. Values that
were entered into the tracked example were preserved in ignored .env.example.local;
the tracked .env.example contains blank configuration fields. certs/ is ignored.
Local environment files and certificates are not backed up to GitHub.

Use npm test and npm run build before merging risky work. Every push to main
is treated as a live Vercel deployment; resume work on the feature branch.
