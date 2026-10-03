# Defense day — frozen laptop runbook

Prepared 2026-10-03 (Asia/Manila). Features are frozen. Submissions remain closed.
Use the local build; hosted cold-page reload without network is not supported.
Keep the laptop plugged in, prevent sleep and keep the preview terminal running.

## Prepare with internet before leaving

The project declares Node >=22.12.0. This laptop currently uses Node 20.19.4 /
npm 10.8.2: tests/build passed here, but it is below the declared project engine.
Do not upgrade at the venue. Keep the prepared dist/; validate a supported Node
setup on a spare environment before a fresh install. This mismatch is deliberately
left unchanged during the freeze.
From PowerShell:

```powershell
Set-Location 'D:\Project\denguewatch-v2'
git status --short
node --version
npm --version
npm ci
if ($LASTEXITCODE -ne 0) { throw 'Install failed; use the frozen fallback below.' }
$env:VITE_DEMO_MODE = 'true'
try {
  npm run build
  if ($LASTEXITCODE -ne 0) { throw 'Build failed; use the frozen fallback below.' }
} finally {
  Remove-Item Env:\VITE_DEMO_MODE -ErrorAction SilentlyContinue
}
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

Run npm ci/build before travelling; npm ci needs downloaded packages and replaces
node_modules. Do not run it on venue Wi-Fi or while relying on the fallback server.
The public demo flag is compiled into the build. No DB credentials or API key are
needed for forced snapshot reads. Never print or project .env/certificate contents.

## Start on the day

With the already prepared dist/ and node_modules/ intact:

```powershell
Set-Location 'D:\Project\denguewatch-v2'
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

Open http://127.0.0.1:4173/. Confirm Offline demo snapshot (Oct 3, 2026), and that
/report says collection is closed and its unchecked consent cannot enable collection.
Follow DEMO_SCRIPT.md: Dashboard → Manila detail/weekly forecasts → exclude COVID
targets → Data & Sources → Map/Grid → closed Report → legal-v1.1 review drafts.
From Manila detail, Print report → Save as PDF; keep the resulting handout locally.

## Offline checklist

- [ ] Disconnect Wi-Fi/mobile hotspot; keep local loopback networking available.
- [ ] Reload the local root page. Snapshot badge and all 17 LGUs appear.
- [ ] Open all planned routes once; load history/daily/forecast charts and fonts.
- [ ] Check 1/2/4-week estimates, interval table, mean comparison and COVID caveat.
- [ ] Open Manila's separate daily series without adding it to weekly/monthly.
- [ ] Map uses Grid without external tiles. Community counts are unavailable, not zero.
- [ ] /legal shows the supplied controller/contact, Not available source fields,
  review labels and exact-citation warning; no verified office/permission is invented.
- [ ] Print/PDF includes the disclaimer, dated source/model evidence and intervals.
- [ ] Keep this tab/server open. Full browser offline mode works after route assets
  are warmed, but closing/reloading that tab may fail; use normal local preview
  with Wi-Fi disconnected instead of blocking the browser's loopback requests.
- [ ] Capture final dashboard, Manila model/intervals, data-quality and legal screens;
  copy screenshots, PDF and these notes to a local folder and USB drive.

## If a build or demo fails

Do not troubleshoot by changing dependencies, data, model or schema at the venue.

1. If dist/ still holds the rehearsed build, start preview with no rebuild.
2. A local pre-freeze backup from commit 06bc5bb is preserved at
   .artifacts/defense-freeze-06bc5bb/dist/ on this laptop. It is ignored and not
   part of a fresh clone; back it up to USB before travelling. If installed Vite
   is intact, run:

   ```powershell
   npm run preview -- --outDir .artifacts/defense-freeze-06bc5bb/dist --host 127.0.0.1 --port 4173 --strictPort
   ```

   That older default-mode build may wait about four seconds before snapshot
   fallback; with browser connectivity absent it reads the local snapshot directly.
3. If npm dependencies are unavailable but Python is installed, serve the frozen
   static build without installing anything:

   ```powershell
   python -m http.server 4173 --bind 127.0.0.1 --directory .artifacts/defense-freeze-06bc5bb/dist
   ```

   Open only http://127.0.0.1:4173/ and navigate with app links. Python's basic
   server does not rewrite deep URLs: do not reload /city/... or other routes.
   Confirm the snapshot badge and closed form. Python itself is a fallback
   prerequisite, not a dependency added to the app.
4. If no server works, show saved screenshots from .artifacts/public-app/ and
   .artifacts/design-system/, plus the manually captured final model/quality/legal
   screens and PDF. Generated artifacts are ignored; they must be copied from
   the rehearsed laptop and are not promised in a fresh clone. Explain that these
   are frozen screenshots, not a live app.
5. Evidence available in the committed repo: public/demo-snapshot.json (17 LGUs,
   4,403 weekly / 1,037 monthly / 1,910 daily), src/data/weekly-forecast-v1.json,
   docs/weekly-backtest-v1.json, DEMO_SCRIPT.md and DEFENSE_QA.md. JSON alone is
   evidence, not a runnable UI; use the prepared build/screenshots for presentation.

## Do not touch before the defense

- Do not enable submissions or run reports:enable, app:setup, ingest or migrations.
- Do not regenerate demo:snapshot, retrain/backtest, alter thresholds or combine sources.
- Do not change package.json/lockfile, upgrade Node, add dependencies or switch branches.
- Do not clear dist/, node_modules/, frozen backups, browser tabs or saved artifacts.
- Do not copy .env files, DB passwords, service-role keys or certs into a shareable package.
- Do not push/merge main as part of rehearsal; every main push deploys live.
- Do not remove review/citation warnings, describe estimates as current conditions,
  or claim zero personal-data processing, guaranteed coverage or a legal exemption.

Deliberately unchanged: existing models/metrics, historical sources, 90-day DB
setting, disabled submission gate, provider-default descriptions and unresolved
source provenance. Post-defense improvements stay deferred.


## Prepared offline package

The final verification creates .artifacts/denguewatch-defense-2026-10-03.zip locally,
containing the forced-demo dist/, these three defense documents, cached model
JSON evidence, final screenshots and Manila PDF. It contains no .env, certs,
node_modules or database connection settings. The ZIP is ignored, not committed;
copy it to USB and extract onto the laptop before the defense.

If Python is installed, from the extracted package folder:

```powershell
python -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Open the root URL and navigate with app links, without deep-route reloads. This
serves the already-built forced snapshot app without npm ci/build or Supabase.
If no local server can run, open screenshots and manila-report.pdf directly.
