# DengueWatch

A student research prototype for exploring historical dengue records in Manila,
weekly forecast backtests, and Tondo census geography. Built with React 19,
TypeScript, Vite, Tailwind CSS, Recharts and Supabase.

The current redesign lives on `feat/manila-redesign`. The `defense-v1` tag remains
the frozen fallback. Community submissions and barangay dengue layers are closed.
Home Phase 2 is paused pending visual approval of the repaired Tondo map.

## Run locally

Use Node 22.12 or newer (the `.nvmrc` selects Node 22).

```powershell
git clone https://github.com/Ramon-suydo/denguewatch-v2.git
Set-Location denguewatch-v2
git switch feat/manila-redesign
npm ci
npm run dev
```

The committed verified snapshot lets public pages fall back without Supabase.
To force snapshot mode, copy `.env.example` to ignored `.env.local` and set
`VITE_DEMO_MODE=true`. Local fonts, Tondo geometry and population are included.
No database credentials are needed for snapshot mode. See the
[offline laptop runbook](docs/DEFENSE_DAY.md) for a production demo build.

## Checks

```powershell
npm test
npm run build
npm run test:contrast
npx playwright install chromium
npm run test:ui
```

Alternatively, set `$env:PLAYWRIGHT_CHANNEL = 'msedge'` or `'chrome'` to use an
installed browser. Browser tests use isolated test configuration; production
builds reject `VITE_TEST_FIXTURES=true`.

## Project layout

| Directory | Responsibility |
| --- | --- |
| `src/` | Public pages, shared UI, themes and data access |
| `config/` | Geographic area definitions |
| `data/geo/` | Verified boundary/population inputs and source manifest |
| `data/raw/` | Historical published inputs; new local files are ignored |
| `public/` | Offline snapshot and generated geography |
| `scripts/` | Audit, ingestion, backtest, geometry and contrast tools |
| `supabase/` | Database migrations; applied manually |
| `tests/` | Unit/browser checks and test-only fixtures |
| `docs/` | Data rules, model evidence, deployment and defense guides |

`node_modules/`, `dist/`, `.artifacts/`, certificates and local environment files
are ignored. Existing published source files stay tracked so audits remain
reproducible; do not add unreviewed or identifying raw data with `git add -f`.

## Data and model boundaries

Weekly, derived monthly and Manila daily records remain separate. Missing is not
zero. Deaths are excluded from forecasts; suspect observations stay disclosed.
Community reports are unverified and never part of official/model data. Forecasts
are historical statistical estimates, not medical advice or outbreak alerts.
Exact source citations still require owner review.

- [Current handoff and remaining work](docs/HANDOFF.md)
- [Data quality and source rules](docs/DATA_QUALITY.md)
- [Weekly model and backtest](docs/WEEKLY_FORECAST.md)
- [Tondo map sources and geometry gates](docs/TONDO_MAP_SOURCES.md)
- [Database setup and verification](docs/DATABASE_SETUP.md)
- [Community privacy and launch gate](docs/COMMUNITY_PRIVACY.md)
- [Launch checklist](docs/LAUNCH_CHECKLIST.md)
- [Design system](docs/design-system.md)
- [Defense demo script](docs/DEMO_SCRIPT.md)
- [Deployment](docs/DEPLOYMENT.md)

## Work with your thesis partner

Follow [CONTRIBUTING.md](CONTRIBUTING.md). Start a feature branch from the current
redesign, commit reviewed changes, and open a pull request back to
`feat/manila-redesign`. Test locally and self-review before merging into `main`:
every push or merge to `main` deploys to Vercel. Do not modify `defense-v1`, apply
hosted database changes, or open submissions as part of routine UI work.
