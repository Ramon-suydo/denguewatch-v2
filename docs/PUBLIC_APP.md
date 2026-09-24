# Public app and deployment review

## Scope

Public routes: / (also /dashboard), /city/:id, /map, /report, /privacy, /terms.
The original identity approval page remains at /design-preview. There is no login
gate, admin case-entry screen, or admin moderation interface in this milestone.
Anyone holding a report's reference code can use the withdrawal form in Privacy.

All production charts read historical_surveillance through the public Supabase
client. City and period are explicit filters; pages fetch in 500-row chunks so
Manila's 1,910 daily rows cannot be silently truncated by PostgREST's row cap.
Weekly, monthly and daily sources stay separate. Missing dates are null chart
points, never zero. Source citations and quality limitations are expandable.

Community counts come only from community_reports_weekly_agg (an RPC, not a table).
The window includes the current Monday-start week and seven previous weeks. Public
counts include only publishable city/week groups of at least five. An absent group
means zero OR suppressed; the UI never presents it as a confirmed zero. A sum of
visible weeks is explicitly a lower bound. Community counts never enter forecasts.

## Forecast formula and interpretation

Implementation: src/lib/forecast.ts. Owner refresh: scripts/lib/forecast-cache.ts.
Persistence: public.city_forecasts, one owner-written/public-readable record per LGU.

For consistency across all 17 NCR LGUs, use only the monthly CSV-derived series.
A complete _source-label month_ has all expected Sunday-labelled weekly records.
This definition does not certify onset dates, report completeness or source quality.
Exclude the current uncompleted month, flagged partial coverage, missing weeks,
deaths-exceed-cases, suspect weekly aggregates, and missing-death aggregates.
The first partial January 2016 is caught by counting expected Sundays; January
2021 and other flagged gaps are excluded explicitly.

Let x1, x2, x3 be counts for the three most recent eligible months, oldest first:
F = (x1 + 2*x2 + 3*x3) / 6. Skipped months remain gaps, and the three actual dates
are stored and shown. Forecast exactly the month after the newest eligible month.
Do not extrapolate repeatedly from 2020 to the current year.

Using all eligible months for the same city and source through that date, sort
counts; Qp is linear interpolation at rank (n - 1)*p for p=0.50 and p=0.80.
Low if F <= Q50; Medium if Q50 < F <= Q80; High if F > Q80.
Require at least 24 eligible months and Q80 > Q50; otherwise insufficient data.
Medium uses the design system's existing moderate-risk colors, never Signal Amber.

Cache entries retain input dates/counts/weights, thresholds, baseline count/range,
source, model version, input SHA-256 and computation time. Refresh is transactional.
No client computes or writes forecasts on page load. After updating surveillance,
run npm run forecast:refresh. No backtest accuracy or confidence interval is claimed.

The actual supplied NCR monthly data stops in January 2021, and Manila daily data
ends 2 December 2023. A stored historical risk tier is NOT a current risk level.
The current label is insufficient outside the saved forecast month. The map
defaults to current risk and explicitly lets readers select dated historical tiers.
Manila daily data remains a separate chart, not an input to NCR monthly estimates.

## Collection, withdrawal, and retention

The owner approved 90 days and achilleslang23@gmail.com as the public research contact.
The applied lifecycle migration publishes that contact but leaves submissions
disabled until the maintenance job and explicit enable step are completed.

The existing security-definer submit_community_report signature is retained.
It validates consent/version, active city, future dates in Asia/Manila, and
contact opt-in. The UI never inserts into community_reports directly.
No original reference code is persisted client-side or placed in a URL. The server
stores only its hash. A successful response displays the code once; a network
failure never automatically retries an insert.

The RPC additionally checks the owner-controlled collection gate and enforces a
serialized global limit of 100 submissions per rolling 24 hours. Deleted reports
still count toward that ceiling, so deletion cannot reset the quota. This cap
limits storage abuse without collecting IP addresses; it cannot establish identity,
prevent false reports, or guarantee availability under deliberate quota exhaustion.

Withdrawal immediately excludes a report from aggregates and clears contact and
barangay. It returns an indistinguishable response for nonexistent/already-deleted
codes. Remaining rows expire 90 days after creation. Aggregates exclude expired
records even if cleanup is delayed. An owner-only hourly cron job hard-deletes
expired rows; it must be active before enabling collection. Backup storage is
separate from application deletion, and the privacy notice explains that limit.

Policy/cache tables have public read access only; users cannot change retention,
enable reporting, edit the public contact, modify cache records, or invoke the
private purge function. Raw report RLS from the prior migration is preserved.
No service-role key or database credentials enter the browser.

## Hosted setup status

On 2026-09-24, explicit user authorization covered the three migrations and cache
population only. Ran npm run app:setup successfully. Read-only verification
confirmed 17 forecasts, 17 risk-input records, 650 backtest rows, unchanged 7,350
historical rows, public read access, RLS, and the active hourly retention job.

**Real submissions remain disabled (submissions_enabled=false).**
Do not run reports:enable until after the upcoming content/consent review and
later explicit authorization. No synthetic report was submitted.
See HANDOFF.md for verification evidence and the next task.

app:setup applies ONLY 20260924000300_forecast_cache.sql and
20260924000400_community_lifecycle.sql and
20260924000500_composite_risk.sql, records their migration versions, enables
pg_cron, schedules the hourly retention job, and saves real-data forecasts. All
steps use one transaction and a project-level advisory lock; failure rolls back.
It does not reset, replace, or reingest the historical dataset.

reports:enable verifies an active retention job and the approved contact before
opening new submissions. COMMUNITY_CONTACT_EMAIL is an optional server-only
override for a future approved contact. Do not put database credentials in VITE_
variables. Running these commands changes the existing Supabase project even
before a frontend Git push.

For a Supabase CLI workflow, apply the new migration files normally, then still
run npm run app:setup to schedule cleanup and populate forecasts. Do not edit the
migration history manually. No hosted mutation is performed by the Vercel build.

Check that the cron job continues to succeed and pause submissions if maintenance
fails. The app's public expiry filter is immediate; physical deletion depends on
the scheduled job. Monitor cron.job_run_details through the owner's dashboard.

## Local validation and screenshots

- npm test: real-source ingestion/RLS tests, forecast formula and freshness,
  persisted cache protections, direct RPC gate/quota, and 90-day purge tests.
- npm run test:contrast: design token AA checks.
- npm run test:ui: isolated browser tests with the actual 7,350 source observations.
  Browser test API responses are intercepted; no hosted test report is inserted.
  Test-only reference codes/contact examples never enter the live database.
- npm run build: production compile and route splitting.

Playwright runs its own server with an invalid test-only Supabase host and fake
public key; this prevents accidental dependence on local/live credentials.
Install its Chromium browser, or set PLAYWRIGHT_CHANNEL=chrome to use installed
Chrome. Tests cover pagination, empty/suppressed states, map tile failure, future
date rejection, opt-in reset, RPC submission/withdrawal, mobile widths, and axe AA.

Screenshots under ignored .artifacts/public-app/ are captured using real historical
source fixtures in isolated browser tests. They demonstrate implemented UI; they
are not deployment evidence; hosted verification is recorded separately in HANDOFF.md.

Test locally and self-review before merging near the defense. The user pushes.
Every main push is a live Vercel deployment. vercel.json handles direct SPA routes.

## Sources and limitations

- [WHO dengue warning signs](https://www.who.int/news-room/fact-sheets/detail/dengue-and-severe-dengue),
  checked 24 September 2026; linked directly in the report notice.
- [Leaflet API](https://leafletjs.com/reference.html) and
  [OpenStreetMap tile policy](https://operations.osmfoundation.org/policies/tiles/).
  Tiles retain attribution, use HTTPS, and are not bulk-prefetched. No API key is
  needed. Representative markers are approximate city centers, not boundaries.
- [Supabase Cron](https://supabase.com/docs/guides/cron).
- See DATA_QUALITY.md for source gaps, provenance limitations, and citation
  placeholders. Exact DOH/FOI dataset citations still need source-owner review.
