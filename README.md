# DengueWatch

A historical dengue research app with three main pages: Dashboard, Risk Map and Community Report. About & Credits is linked from every footer. Manila case data ends 2023-12-02; national province/city data ends 2021-01-10. Neither establishes current risk. The Manila panel shows retrospective case forecasts; the national map ranks historical seasonal count expectations, with explicit unmatched areas and population confounding. Weather failed the held-out improvement gate and is shown only as dated context. Community reports stay separate, unverified, coarse and closed by default.

The redesign is on `feat/redesign`. See [MAP_METHOD](docs/MAP_METHOD.md), [DESIGN](docs/DESIGN.md), [current evidence](docs/evidence/redesign-checks.md), and [owner blockers](docs/IMPLEMENTATION_STATUS.md). Main pushes automatically deploy Vercel; review and test this schema/UI branch before merging.

## Run locally

Use Node 22.12+ and the Python packages in requirements-environment.txt. Public research pages can use their bundled files without private credentials.

```powershell
npm ci
python -m pip install -r requirements-environment.txt
npx playwright install chromium
npm run dev
```

For an installed Edge browser on Windows, set `$env:PLAYWRIGHT_CHANNEL = 'msedge'` before browser checks. Tests use isolated public configuration and disposable, clearly labeled local report data; they never submit to hosting.

```powershell
npm run lint
npm run typecheck
npm test
npm run db:verify
npm run test:geography
npm run test:contrast
npm run build
npm run test:ui
npm run test:production
npm run test:pwa
npm run security:secrets
```

## Release status

The owner explicitly requested publishing the completed work to main on 2026-10-25, and the source plus sanitized review bundle were pushed. Main pushes may trigger Vercel automatically; deployment success has not been verified. Credential rotation, hosted verification, first admin/MFA, retention execution and reporting activation remain NEEDS OWNER. The bundled evidence preserves the earlier local checkpoint; publication is not proof that hosted release gates passed. See docs/IMPLEMENTATION_STATUS.md, docs/LAUNCH_CHECKLIST.md and docs/ROTATE_CREDENTIALS.md. Test locally and self-review schema/auth changes before further deployment near the defense.

The server reporting policy fails closed until verification and explicit activation. One-line kill switch after configuring rotated server credentials: `npm run reports:off`. Browser flags cannot override database authorization. Community reports never enter official counts or forecasts.

## Architecture and attribution

React/Vite serves same-origin research JSON and an allowlisted offline PWA cache. Supabase Auth provides staff sessions; PostgreSQL RLS and audited RPCs enforce appointed roles, MFA claims, moderation, suppression, withdrawal and retention. Node/Python scripts handle ingestion, evaluation and operations. Embedded PostgreSQL tests verify actual migrations/RPCs; the local signed Auth/PostgREST adapter is not proof of hosted Supabase Auth/TOTP behavior.

Code is MIT licensed. Data and third-party assets retain their own attribution/usage terms; see data/README.md. Original health-file retrieval dates and redistribution permissions remain unknown where the source owner has not supplied them. Never commit environment files, certificates, credentials, real report exports or personal health information. Configure the hook with `git config core.hooksPath .githooks`.
