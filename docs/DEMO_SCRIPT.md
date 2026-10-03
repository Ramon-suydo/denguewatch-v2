# Five-minute defense demo

Use the locally served build, not the hosted site, when venue Wi-Fi is uncertain.
The verified DB snapshot was captured on 2026-10-03. It contains 17 LGUs and
7,350 official observations (4,403 weekly / 1,037 monthly / 1,910 Manila daily),
source checksums, quality audit, legacy model results and weekly backtest evidence.
No contacts, policy records or community reports are exported.

## Prepare before leaving

1. With the approved DB connection available, run `npm run demo:snapshot`.
   This is read-only, checks every official source value, and preserves the old
   snapshot if verification fails. Do not regenerate it during the presentation.
2. For a deterministic local demo, build with the public demo flag:

   ```powershell
   $env:VITE_DEMO_MODE = "true"
   npm run build
   Remove-Item Env:\VITE_DEMO_MODE
   npm run preview -- --host 127.0.0.1 --port 4173
   ```

3. Open `http://127.0.0.1:4173`, confirm the dated Offline demo snapshot badge,
   then open every planned route and the daily/history/forecast charts once.
   Keep the laptop, build folder and local server running. Fonts and app assets
   are local; no Wi-Fi or Supabase is needed for this build.
4. Reporting remains closed. Offline reads never become writes, queue reports,
   or simulate successful withdrawal. Community counts are unavailable, not zero.

## Click path

| Time | Route/action | What to say and show |
| --- | --- | --- |
| 0:00–0:40 | `/`: shared notice and snapshot badge | “This is a research demonstration using a dated verified snapshot, not live surveillance or an official outbreak alert.” Point to source-specific footer dates. |
| 0:40–1:20 | Dashboard city selector, historical chart | Select Manila, then weekly observations. “Missing weeks remain gaps; large observed peaks are retained. Counts are published source labels.” Open the exact-values table. |
| 1:20–2:30 | Manila detail link; weekly forecast and Model transparency | Show 1/2/4-week controls and interval table. Lead with MAE against the stronger four-week mean: 8.82 vs 11.23 (21.5% skill), then seasonal naive 22.58 (61.0%). “Selection used 2018; test starts in 2019. Most observed baseline gain comes from recent counts.” |
| 2:30–3:15 | Backtest period: without COVID targets | “This leaves only 2019, not a counterfactual without COVID. One-week interval coverage drops to 71.4%/88.2% versus nominal 80/95. sMAPE is worse than the mean baseline overall; low-case relative errors need care.” No claimed current warning or accuracy percentage. |
| 3:15–4:05 | `/data-sources` | Show source overlap, three weekly gaps, incomplete January 2021, anomalous deaths, daily missing dates and citation placeholders. “Monthly is derived; Manila daily is separate and disagrees in overlapping years. We never add these sources.” |
| 4:05–4:35 | `/map`, Grid | Show all 17 LGUs with risk labels. “These are legacy monthly/historical distribution labels, separate from the weekly count model. Offline mode uses the grid instead of external tiles.” |
| 4:35–5:00 | `/report`, then `/privacy` | Show the unticked consent checkbox and closed collection; /legal holds versioned review drafts. “Community reports are unverified, separate from official data, and excluded from this snapshot/model. Privacy documents require review before launch.” End with newer DOH data as the next validation step. |

## If something breaks

- Supabase/Wi-Fi fails: reads time out after about four seconds and switch to the
  dated snapshot. For the defense, the forced demo build avoids the wait entirely.
- Hosted site cannot open offline: use the running local preview. This is not a
  PWA; a cold hosted-page reload with no access to app assets is not promised.
- A map tile fails: show Grid. In snapshot mode external tiles are not requested.
- A chart has not loaded yet: wait for its reserved-height skeleton, then use its
  exact-value table or the forecast interval table. Never invent a missing value.
- Wrong LGU or URL: use Dashboard navigation; the styled missing/404 state does
  not create a substitute LGU or observation.
- Browser itself goes fully offline after routes/assets were loaded: SPA navigation
  and the in-memory snapshot still work. Do not close/reload that tab; otherwise
  use the locally served build with loopback networking available.
- Local server stops: restart `npm run preview -- --host 127.0.0.1 --port 4173`.
- Everything fails: use the saved screenshots in `.artifacts/public-app`, these
  notes, `docs/WEEKLY_FORECAST.md`, and the checked-in backtest JSON. Explain the
  failure honestly and distinguish cached results from a running live system.

Optional offline handout: open an LGU detail page, choose Print report and save as PDF. The A4 report uses the official weekly series and cached forecast/interval/comparison evidence, includes the disclaimer and pending source citations, and labels its generated/snapshot dates.
