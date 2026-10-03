# Five-minute defense demo

Use the locally served build, not the hosted site, when venue Wi-Fi is uncertain.
The verified DB snapshot was captured on 2026-10-03. It contains 17 LGUs and
7,350 official observations (4,403 weekly / 1,037 monthly / 1,910 Manila daily),
source checksums, quality audit, legacy model results and weekly backtest evidence.
No contacts, policy records or community reports are exported.

## Prepare before leaving

1. Use the committed verified snapshot. Feature freeze: do not regenerate data
   or retrain before the defense. Follow `docs/DEFENSE_DAY.md` for laptop setup.
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


## Frozen evidence — 2026-10-03

Model weekly-ridge-v1; artifact generated 2026-10-01T15:21:21.994Z.
Snapshot captured 2026-10-03T03:17:58.331Z (UTC); 17 LGUs / 7,350 rows.
2018 is selection/calibration; paired walk-forward test targets are 2019 onward,
ending 2021-01-10. These are count-error metrics, not clinical accuracy.

| Ahead | Model | Paired targets | MAE | RMSE | sMAPE | MAE skill vs mean |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| 1 weeks | ridge | 1462 | 8.82 | 20.89 | 68.22% | 21.5% |
| 1 weeks | mean-4 | 1462 | 11.23 | 25.21 | 64.95% | 0.0% |
| 1 weeks | seasonal-naive | 1462 | 22.58 | 51.70 | 93.77% | -101.1% |
| 2 weeks | ridge | 1462 | 9.94 | 23.25 | 72.36% | 30.6% |
| 2 weeks | mean-4 | 1462 | 14.32 | 32.55 | 73.13% | 0.0% |
| 2 weeks | seasonal-naive | 1462 | 23.79 | 56.13 | 94.38% | -66.2% |
| 4 weeks | ridge | 1448 | 12.37 | 27.77 | 79.70% | 38.1% |
| 4 weeks | mean-4 | 1448 | 19.99 | 45.93 | 86.19% | 0.0% |
| 4 weeks | seasonal-naive | 1448 | 25.21 | 59.02 | 94.99% | -26.1% |

One-week all-period 80%/95% interval coverage: 79.75%/92.54%. Excluding COVID
targets leaves only 2019: 71.43%/88.22%, below nominal 80%/95%. Ridge sMAPE is
worse than the mean overall (68.22% vs 64.95%); do not present only MAE gains.

At /legal say: "These are legal-v1.1 drafts for review, not legal advice. Health
information would be sensitive personal information under RA 10173. Community
health submissions are closed and the demo snapshot contains no personal reports.
This does not mean zero personal-data processing: hosted request metadata may be
logged, and the online withdrawal RPC can process a private code. The forced local
demo makes no Supabase or external map requests. Controller contact is
achilleslang23@gmail.com; a DPO designation is not confirmed. Provider-default
retention descriptions are not verified durations."

Metadata renders Not available / not public / Not stated plainly. Exact-citation
warnings remain because original acquisition details, specific offices and usage
terms are unverified. No source permission or legal status is inferred.
