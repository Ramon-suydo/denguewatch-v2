# Public site - 7 November 2026

Public dashboard: https://denguewatch-manila.rhex-diaz.chatgpt.site

The reviewed ui-fixes application was merged through PR #1 into GitHub main at
`ea65495c6525f8a6a9b7046382c3f451b266d861`. Its application revision is
`6719accbfbd541fd09322691bcb163196561b12f`.

## Hosting

The public build is hosted with Sites. Its access policy is public; visitors
do not need to run npm or keep the developer's computer online.

- Project ID: `appgprj_6aeea9726d688191bee5598c874d7742`
- Saved version: `appgprj_6aeea9726d688191bee5598c874d7742~appgver_7231f1a776bc8191bb329a9c727bf72e`
- Deployment: `appgdep_6aeeaa8e5b2081918cb5b8f0b6441505`, succeeded.
- Public-build source commit: `cffd215bc4277545c7637b972a13e0b9d4d0f448`.

The source and development workflow remain in this GitHub repository. The
Sites source checkout is a separate publication of the reviewed static build.
Use the existing project ID for subsequent publication; do not create another
Site. A GitHub main push has not been verified to refresh this Sites snapshot
automatically. Follow the Sites skill's existing-site workflow to republish a
new reviewed build. Never copy .env files, private credentials, or ML caches.

Vercel CLI was signed out and browser access was unavailable during this
release. No Vercel deployment was verified; a GitHub merge alone is not proof
of a successful Vercel release.

## Verification and limits

Unauthenticated Node HTTP requests verified the dashboard, public routes,
JavaScript bundle and source/model JSON. The shipped snapshot has 14 weeks,
origin 2026-11-01, one-week RF forecast 230 and research alert High.

The hosting service returns the full PMTiles archive with HTTP 200 instead of
supporting the requested byte range. The existing map implementation falls back
to OpenFreeMap, then a plain city overlay if necessary. Offline street-map
operation on this host is not certified.

The static host did not apply the packaged _headers file: the original Vercel
CSP and nosniff headers were absent in checked responses. Do not describe this
publication as having passed the Vercel production-header checks. The current
environment could not perform a hosted browser interaction/screenshot check.

Supabase migrations, administrative authentication and data writes were not
applied or certified by this frontend publication. Community reporting was not
enabled. GitHub's known secret-guard configuration/rotation prerequisite and
remote screenshot failures remain unresolved; publication is not a passing CI
claim.

The public site serves saved forecasts. New source weeks still require review,
model reruns and publication; keeping the website online does not automatically
collect PIO posts or retrain the model. Existing freshness fallbacks remain.
