# Implementation and release status

Environmental addendum: [ENVIRONMENT.md](ENVIRONMENT.md), [computed results](ENVIRONMENT_RESULTS.md), and [check ledger](evidence/environment-checks.json). Source lags are frozen before 2018; no environmental model was promoted.

Reviewed locally on 2026-10-25 on `feat/manila-evidence`. This is a historical
research application with a closed community-reporting gate. It is not approved
for live collection or current dengue warnings. No hosted Supabase changes were
made. The repository remote is Ramon-suydo/denguewatch-v2; the pasted request's
Ramon-sufile owner does not match the configured remote.

## Implemented and verified locally

- Immutable source ingestion, both absent-day scenarios, source reconciliation,
  lagged ERA5 provenance, expanding-window evaluation, weather ablations, alert
  metrics, intervals, source sensitivity, descriptive drivers and figures.
- Persistence remains the conservative public model. Weather worsens matched
  1/2-week ridge error in both primary scenarios. Neither scenario establishes
  a reliable complex-model improvement at those horizons. See EVALUATION.md.
- Manila historical public pages, real 17-city NCR historical map, bilingual
  Home/Prevention/Report, static public APIs, accessible tables and public PWA.
- Separate staff layout, server roles, audited moderation/uploads, closed
  submissions, proof-of-work, consent, withdrawal, suppression/delay, retention
  function and conditional cron installation; full migration role tests.
- Local setup guards, CI configuration, privacy/security docs and defense kit.

| Check | Actual result |
| --- | --- |
| Clean dependency install | Pass; npm ci |
| Unit/integration | 66 passed, 0 failed/skipped; Node 22.23.2 |
| Browser including axe and 360px | 29 passed; Edge; zero critical/serious axe findings in tested routes |
| Production PWA and headers | 2 passed; Edge; public offline reload and private-cache exclusion |
| Lint | Pass; zero warnings |
| Type check / production build | Pass |
| Geographic checks | 3 passed; hand-calculated metric buffers, Spearman ties and actual 17-city bounds |
| Contrast | Pass; token pairs and simulated-vision ramp/boundary checks |
| Dependency audit | 0 vulnerabilities; saved dependency-audit.json |
| Full numerical evaluation rerun | Identical evaluation.json bytes; SHA256 3f18ac075ea62d1ee3b46632655882eb0253a09ce21374049a0c573cd1dffb46 |
| Lighthouse mobile local production | Performance 94, accessibility 100, best practices 100, SEO 100; CLS 0.003 |
| Raw inputs / defense-v1 | Unchanged; fallback tag bfdff26009b168b2c9a063519d2bdc92a2737f76 |

Saved Lighthouse HTML/JSON and actual public screenshots/recording are under
[evidence](evidence/). These are lab and navigation artifacts, not field
performance, a complete WCAG certification or human usability findings.
Evaluation figures are under [figures](figures/). The usability results template
is deliberately blank.

## Open release blockers and unverified work

1. **Credential rotation required.** The history audit finds the known local
   database password because it equals a public project identifier. Treat it as
   exposed; rotate it and update private configuration before hosted use. The
   secret gate is unresolved. No private credential value is included here.
   The heuristic scan covers reachable fetched history, not unknown secrets or
   unreachable remote objects. CI without the private environment cannot prove
   rotation of this credential.
2. **Hosted deployment is unverified.** The two new 20261025 migrations, role
   appointment, hosted Auth and actual scheduled purge execution have not been
   applied or tested. Supabase/Docker local full-stack setup is blocked by absent
   Docker here; only its guards and SQL fixtures were tested. No demo staff login
   was fabricated. Follow DEPLOYMENT.md with owner authorization.
3. **ZAP baseline not run.** Docker is unavailable and no deployed URL for this
   revision was confirmed. evidence/zap-status.json states this; it is not a scan
   report. Run and review the documented deployed baseline before release.
4. **Governance and source confirmation remain.** Obtain DPO review, staff MFA
   decision, data-owner confirmation of absent dates and source week semantics,
   and confirmation of the population denominator and boundary vintage.
5. **Human evaluation remains.** Recruit users, run the tasks and original SUS
   questionnaire, record actual observations and complete the blank results.
   Report-spike protocol remains a draft requiring a health-worker review.
6. **CI and preview remain.** Workflow is configured but has not run on GitHub
   for this branch. Test the Vercel preview and self-review before merging.

Public historical demo can run with `npm ci` then `npm run demo`; it does not
require hosted secrets. Reports stay closed. The source ends in December 2023;
NCR source ends January 2021. Neither supplies current 2026 disease activity.

## Handoff

Read README.md, DATA.md, EVALUATION.md, SECURITY_TESTS.md and DEPLOYMENT.md before
changing the model or enabling collection. Preserve both scenarios and the
negative weather result. Do not merge into main until the release gates are
resolved; a main push triggers live Vercel deployment. The integration target is
`feat/manila-redesign` until the redesign is approved.

The user runs the push:

```powershell
git push -u origin feat/manila-evidence
```
