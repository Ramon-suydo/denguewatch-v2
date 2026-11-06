# UI fixes and reviewed Manila forecast - 2026-11-06

The model now consumes the corrected 14-week processed/public Manila snapshot,
instead of the superseded 13-row acquisition CSV. The original raw files and
historical training/validation/test partitions are preserved. Estimated weekly
differences remain flagged when either cumulative anchor was estimated.

The reviewed source rule accepts Monday's Manila PIO post, or the first later
post that reporting week when Monday has no post. The protected snapshot is
`data/live-manila/reviewed-2026.json`. A forward seed migration preserves these
corrections in local database harnesses; it has not been applied to hosted
Supabase and does not activate reporting.

## Forecast and limitations

- Latest reviewed week: 2026-11-01, 265 cases.
- One-week Random Forest: 230 cases for 2026-11-08; research alert badge High.
- Two-week Random Forest: 216 cases for 2026-11-15.
- Extras feature importance is available for 32 features.
- Recent ERA5 archive context was refreshed through 2026-10-30. Its dated cache
  and provider receipt remain local, following the existing cache policy.
- These forecasts remain provisional. The 2023 held-out results are unchanged:
  one-week RF MAE 9.99 versus persistence 10.00; two-week RF MAE 13.24 versus
  persistence 12.67. No improved accuracy or promotion eligibility is claimed.

## Completed checks

- Existing ML environment: extra requirements installed successfully.
- `npm run count:evaluate`, `npm run count:extras`, `npm run count:check` passed.
- Eleven Python source/model regressions and 98 npm unit/integration tests passed.
- Typecheck, lint, Live integrity check and production build passed.
- All ten targeted Live Manila/expanded research browser tests passed.
- Broader browser run: 60 of 64 passed; the four remaining cases passed in an
  isolated one-worker retry after final date/footer fixes. Two of those initial
  failures were timeouts under concurrent browser/audit load. The retained
  logs distinguish the original failures from the successful retries.
- All 80 Windows Edge visual cases completed with updated references for the
  new layout. Eight repeat dashboard/map comparisons at 360px/1280px in both
  themes passed without updating snapshots.
- Real `npm run dev`, without API fixtures, passed desktop 1280px and mobile
  360px smoke checks: visible RF 230, High badge, no Quick estimate, dashed
  Next week bar, no page errors. Screenshots are in `ui-fixes-20261106/`.
- The small hero disclaimer failed the original contrast threshold on one
  mobile crop. A dark text backdrop fixed it; the threshold was preserved.

The two current weather-context exports were copied exactly from origin/main
at d2257ce and their protected fingerprints reviewed once. The other 119
protected artifact records were preserved. No automatic fingerprint rewriting
or integrity-check exemption was added.

## Remaining release checks

Older browser assertions now use the new headings/navigation, explicit past
records selection and the current source/disclaimer footers. Exact data,
missing-data, no-leakage, reporting, mobile and accessibility assertions remain.
Diagnostics and passing retries are retained in `.artifacts/ui-fixes-20261106/`
(`full-ui2.log`, `final-retry.log`, `visual-update.log`, `visual-repeat.log`).

The previous GitHub Quality run failed because the private exposure guard was
not configured in CI. Historical credential rotation also remains an owner
prerequisite; no rotation attestation or security bypass was added. The Windows
visual job was missing Playwright ffmpeg; its dependency installation is now
explicit, but new remote results must be checked after pushing.

Read-only GitHub inspection found no Actions secrets or variables configured.
The security gate requires the private `EXPOSED_CREDENTIAL_SHA256` guard and
truthful credential-rotation status. No hosted credential change, remote secret
update or rotation attestation was performed. Stop before main merge while
this gate fails; a normal merge would deploy Vercel even though the branch is
not protected.

Test locally and self-review the branch/preview before merging. Merging main
deploys Vercel. Hosted migration application and hosted operation are not
verified by these local checks.
