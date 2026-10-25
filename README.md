# DengueWatch v2

A Manila-focused research app built with React 19, TypeScript, Vite, Tailwind,
Recharts and Supabase. It shows supplied 2016–2023 Manila history, tests 1–2-week
forecasts under two absent-day assumptions, compares historical NCR cities, and
provides a separate closed-by-default community reporting/staff workflow.

**Current risk is unavailable:** supplied official data ends in 2023; the NCR map
permanently states that data ends January 2021. No district case figures, live NCR
forecast, fabricated KPI, SMS/email alert or PDF-export feature is offered.

The current implementation branch is `feat/manila-evidence`, based on
`feat/manila-redesign`. `main` deploys live; `defense-v1` remains the frozen fallback.
Do not merge schema/auth work without local testing and self-review.

## Run the public demo

Use Node **22.12 or newer** (`.nvmrc` selects 22).

```powershell
npm ci
npm run demo
```

`npm run demo` builds and serves a production preview on localhost. No database
credentials are required for the committed public research APIs. For source
editing use `npm run dev`. Windows users with a reserved port can choose
`npm run preview -- --host 127.0.0.1 --port 43125`.

Public routes: `/`, `/trends`, `/metro-manila` (also `/map`), `/prevention`,
`/report`, `/community`, `/methodology`, `/data-sources`, `/privacy`, `/terms` and
`/legal`. Home/Prevention/Report have English/Filipino content. `/admin` uses a
separate staff layout. Legacy `/city/:id` links redirect to Manila Trends.

## Evidence and reproducibility

```powershell
npm run data:prepare
npm run evaluate
npm run data:publish
```

Evaluation uses fixed seeds, expanding origins and past-only fitting/scaling,
paired support per scenario/horizon, cases/weather ablations, both missing-day
scenarios and a separate DOH-source sensitivity. Public forecasts conservatively
use persistence. Weather did **not** improve the primary matched 1/2-week ridge
MAE under either scenario. No causal or present-day accuracy claim is made.

Processed inputs, per-origin evidence, model metrics and provenance are versioned.
`npm run evaluate` works with committed processed weather; `npm run weather:fetch`
recreates weather from verified Open-Meteo ERA5 requests/caches. Full figures can
be regenerated using `npm run evaluate:plots` with Python 3 and matplotlib.
Raw files are immutable. A missing date is not silently zero: M preserves missing;
Z explicitly assumes zero only inside supplied daily coverage. Source citations,
NCR population provenance and DOH week-boundary semantics remain qualified.

- [Implementation status and remaining gates](docs/IMPLEMENTATION_STATUS.md)
- [Audit](docs/AUDIT.md), [dictionary and assumptions](docs/DATA.md),
  [reverified supplied measurements](docs/MEASUREMENTS.md)
- [Evaluation and figures](docs/EVALUATION.md), [API contract](docs/API.md)
- [Weather provenance](data/external/SOURCES.md)

## Checks

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run test:contrast
npx playwright install chromium
npm run test:ui
npm run test:pwa
npm audit --audit-level=high
```

Set `PLAYWRIGHT_CHANNEL=msedge` or `chrome` to use an installed browser.
`PLAYWRIGHT_PORT` overrides the browser-test port on Windows. CI runs checks on
pushes and pull requests. Browser fixtures are development-only; production
builds reject their flag. [Saved mobile Lighthouse report](docs/evidence/lighthouse-mobile.report.html).

## Local staff setup

With local Docker running, `npm run setup:local` starts local Supabase, applies
local migrations, seeds the supplied official history, creates a random-password
local demo administrator and keeps reporting **closed**. It refuses non-loopback
API/database URLs and remote Docker contexts. It never uses hosted DB credentials.
Then run `npm run staff:dev` and open `/admin`; credentials are stored only in the
ignored `.artifacts/local-staff-credentials.json`. No fake health reports are seeded.
The complete Docker/Auth path could not be exercised here because Docker is absent;
local SQL/role behavior is tested separately. See [deployment](docs/DEPLOYMENT.md).

## Release gates

The local database password matches a public project identifier in Git history.
**Rotate it in Supabase and update local configuration before hosted use.** The
known-value secret scan must not be described as clean. A CI checkout without the
private env file cannot establish that rotation happened.

New hosted migrations, real staff Auth/MFA, actual purge-job execution, deployed
headers, DPO/consent/provenance review and deployed ZAP remain unverified. Collection
has not been activated. `npm run reports:enable` is retired and fails before any
DB connection. Public reports are never official counts or model inputs.

- [Privacy](docs/PRIVACY.md), [security](docs/SECURITY.md),
  [threat model](docs/THREAT_MODEL.md), [security tests](docs/SECURITY_TESTS.md)
- [Usability plan — blank results](docs/USABILITY_PLAN.md),
  [health-worker protocol](docs/PROTOCOL.md)
- [Five-minute demo/fallback](docs/DEMO.md), [defense answers](docs/DEFENSE_QA.md)

Follow [CONTRIBUTING.md](CONTRIBUTING.md). Work stays on feature branches and
initial PRs target `feat/manila-redesign`. The user pushes unless explicitly
requesting otherwise. No hosted write, report activation or production merge is
part of a routine build. Ignore env/certs, build outputs, local raw additions and
private artifacts; never force-add those to share with a collaborator.

For the complete numerical evaluation and figures in one command, install the
pinned Python plotting dependencies with `python -m pip install -r requirements-plots.txt`,
then run `npm run evaluate`.

Environmental extension: [sources, ablations and limits](docs/ENVIRONMENT.md).
Install `requirements-environment.txt` for the extended evaluation, then use
`npm run environment:fetch` once to populate public-provider caches.
`npm run evaluate` runs entirely from those caches; `npm run weather:refresh`
is a separate server-only daily context refresh, never a live dengue warning.
