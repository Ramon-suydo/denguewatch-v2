# Five-minute defense demonstration

Use Node 22.12+ and `npm ci`, then `npm run demo`. It builds and serves the real
bundled official history without database credentials. If the default preview
port is reserved on Windows, use `npm run preview -- --host 127.0.0.1 --port 43125`.
No report is submitted or collection opened during this demonstration.

| Time | Action | Honest point to explain |
| --- | --- | --- |
| 0:00–0:45 | Home: read status, source date and scenario M | Current risk is unavailable; historical data cannot establish today's conditions |
| 0:45–1:35 | Trends: show line, missing weeks, source change, COVID shading and exact table; switch Z/M | Absent dates are unresolved; Z assumes zero, M preserves missing; final partial week excluded |
| 1:35–2:15 | Show 1/2-week forecast and interval; point out exploratory four weeks | Persistence is the conservative public baseline; intervals can under-cover; no current warning |
| 2:15–2:55 | Metro Manila: choose a source week/year and select Manila | Permanent January 2021 banner; real city boundaries; unverified fixed 2020 population; no district cases or forecast |
| 2:55–3:45 | Methodology: matched naive/ridge/weather rows, year/COVID fold, alert metrics | Weather did not improve matched 1/2-week ridge under either primary scenario; negative results are valid evidence |
| 3:45–4:25 | Prevention and Report: switch Filipino, show closed consent | Verified guidance, no diagnosis; reports are unverified and separate; explicit consent, delayed/suppressed aggregates |
| 4:25–5:00 | /admin while signed out, privacy/withdrawal and offline reload | Public users see login only; no raw reports; no offline mutation queue; owner/DPO/deployment gates remain |

For staff features, use an authorized **local** Supabase stack and the generated
local demo administrator described in DEPLOYMENT.md. The local queue starts empty;
no fake health reports are seeded. Explain isolated SQL test evidence rather than
pretending a hosted staff login or live moderation session was verified.

## Fallback plan

- Keep the reviewed dist folder, source inputs, figures and saved evaluation on
  the defense laptop and USB. Keep private credentials outside shared copies.
- Warm Home/Trends/Metro/Methodology online once so the PWA public cache installs;
  test an actual offline reload before leaving. Report/withdrawal never queues.
- Keep screenshots under docs/evidence and the fallback-demo.webm recording when
  present. The recording is historical app navigation, not a usability result.
- If network/hosting fails, use `npm run demo` and the local static API; disclose
  the dated research context. If the laptop fails, show the saved recording and
  figures. Do not invent current numbers, working admin access or ZAP results.
- Rehearse the narrative and keyboard path; stop new features on the final day.

Regenerate the actual local fallback with `npm run demo:record -- http://127.0.0.1:43125`
while the reviewed production preview runs at that address. Install Playwright
FFmpeg first with `npx playwright install ffmpeg`. Saved media contains no health
report submission or staff login.
