# Session handoff - public app, 24 September 2026

Branch: feat/public-app. The public-app implementation is ready for review.

## Implemented and checked

- Public dashboard, full city histories/incidence, Leaflet NCR map, three-step
  reporting, terms, privacy and reference-code withdrawal.
- Shared teal/amber design system reused; /design-preview is preserved.
- Monthly WMA forecast and city-distribution thresholds with explicit historical
  dates and insufficient current-data labels. No community mixing or accuracy claim.
- Two pending migrations: protected forecast cache and 90-day report lifecycle.
- Approved public contact: achilleslang23@gmail.com. Reports stay disabled until
  the owner explicitly activates them after retention cleanup is scheduled.
- 17 data/security tests, 9 browser tests, contrast checks and production build pass.
- Browser screenshots: .artifacts/public-app/dashboard.png and mobile.png.
  They use real source data in intercepted local test responses, not hosted writes.
- The malformed ignored local API URL was corrected from a bare project reference
  after matching it to both the anon key and database project. No secret was printed.
- Read-only hosted API checks confirm 17 LGUs and 7,350 historical observations.
  New city_forecasts and community_policy tables are not present (PGRST205).

## Required next step

Automatic approval review rejected running npm run app:setup against the configured
shared Supabase project because explicit hosted-write authorization was missing.
No hosted mutations were made. Do not retry via another tool or route to bypass it.

Once the user explicitly authorizes the exact hosted changes, run:

```powershell
npm run app:setup
npm run reports:enable
```

This applies the three pending migrations, schedules hourly deletion of records older
than 90 days, populates forecasts from real historical_surveillance rows, and opens
consented submissions using the approved public contact. Verify the public API,
cron job, and cached results afterward. Do not insert a synthetic health report
into the hosted project for a smoke test.

See PUBLIC_APP.md and RISK_MODEL.md for details. The risk/grid additions are on feat/risk-grid, branched from feat/public-app; neither branch has been pushed by the assistant. Use Node >=22.12 (local Node 22.18 is available).
After ingestion changes, refresh saved results with npm run forecast:refresh.

The user pushes. Test locally and self-review before merging near the defense;
a push to main is a live Vercel deployment. Exact dataset citation placeholders
still require source-owner review; see DATA_QUALITY.md.
