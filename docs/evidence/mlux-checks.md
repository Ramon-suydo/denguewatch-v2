# NCR ML / map / UX verification

Application build: `bbc3e63085aead689b2de2abb9b90fe3c2a050b3`; final test source: `a0e4240d931b21e9190018f4ad690291bb86221a` on `feat/ml-map-ux`. Main was not pushed. Local checks below are completed; deployment is still NEEDS OWNER.

|Gate|Actual result|
|---|---|
|ML clean checkout|Train, evaluate, export and four leakage tests passed; repeated export left 12 artifacts byte-identical.|
|TypeScript parity|600 actual rows, five methods: exact classes and probability error <=1e-9; 600 feature-vector comparisons.|
|Unit/integration|85 passed.|
|Browser release|Three consecutive complete 44-test UI runs; 18 production and three PWA tests passed.|
|Database|25 SQL checks plus one MFA browser flow; 13 migrations applied to the local harness.|
|Geography / contrast / credits|3 geography tests; static contrast and 30 rendered hero targets; 438 dependencies and 13 boundary inputs covered.|
|Build / lint / types|Passed, including the production fixture guard.|
|npm audit|0 vulnerabilities.|
|Mobile Lighthouse|{"performance": 93.0, "accessibility": 100, "best-practices": 96.0, "seo": 100}.|
|Local ZAP|0 high/medium; 2 low/info. Passive, unauthenticated baseline only.|
|Secret audit|Exit 1: zero current, 44 known historical, zero unexpected. Rotation NEEDS OWNER.|
|Screenshots|All four pages at 360/1280; no overflow or uncaught page errors; map requests confined to Risk Map.|

## Scientific result

Persistence held-out F1 0.8855291576673866; RF 0.8152380952380952. RF remains validation-selected. Persistence clearly improves F1 over RF in this comparison. Three whole calendar weeks are missing; no zeros are imputed. Replay retains 119 unavailable predictions in 70 calendar weeks. The onset subset has only 20 positives. Full CIs, sensitivity/yearly/random results and limitations: ../ML_EVALUATION.md and ../ML_METHOD.md.

## Retained diagnostics and corrections

A retained 43/44 UI diagnostic showed the archive dialog remained open while its JSON was still loading. Archive checks now wait for a successfully completed real response and isolate the unrelated closed reporting-policy request; all value assertions and timeout settings are retained. Generated artifacts are excluded from dev file watching. The initial unit CSP assertion assumed one document policy; the strengthened guard checks strict document policies plus the dedicated worker. Offline glyph URLs needed encoded spaces. Production admin interception initially covered only the dev origin (one synthetic sign-in attempt returned HTTP 400); all successful staff/SQL tests use the local verified adapter. The worker needed its own tile connect policy. Visual QA found string GeoJSON ids became tile id 0: promoted ids now bind actual rendered states for all 17 cities. Pixel checks sample five interior patches away from outlines/labels. Mobile sticky positioning was replaced with a docked normal-flow card. Lighthouse 88/89 diagnostics led to responsive image preload and direct UI imports/eager Dashboard; audit settings were unchanged. Initial parallel forest scoring differed by <=4.44e-16, with unchanged classes/labels; serial prediction and the clean-checkout proof replace that diagnostic. Failed logs/contexts are retained; oversized traces are hash-profiled in bundle omissions.

## Scope and owner actions

- No successful hosted deployment, hosted Auth certification, hosted migration, report activation or human usability result claimed.
- An earlier production-isolation diagnostic sent synthetic local-test sign-in credentials to the configured Auth origin and received HTTP 400. The adapter now intercepts production Supabase origins; all successful admin/SQL verification is local.
- IEEE metadata verified; publisher full-text protocol fidelity not independently verified.
- Photo permission/source/licence, owner contacts, credential rotation, newer reviewed counts and DPO/hosted/human checks remain owner actions.

- Supply at least 26 consecutive reviewed Sunday weeks for all 17 LGUs, with a source citation; preview/stage/publish through AAL2 admin. Latest week must be within 21 days for Live.
- Verify photo permission/source/licence and fill src/content/about.json team/controller/contact.
- Rotate the exposed database/server credentials privately using ../ROTATE_CREDENTIALS.md. Do not paste secrets.
- Verify hosted migrations, appointed staff/MFA, purge/schedules/log retention, Vercel install/environment and preview. Reports remain closed pending DPO review.
- Run the real English/Filipino/screen-reader tasks in ../USABILITY_5_SECOND_TEST.md; results remain blank.
- The 6.7 MB PMTiles is already bundled. No owner extract step is required for this file.
- Test locally and self-review before merging near the defense. Every main push deploys Vercel.

Exact review-branch push: `git push -u origin feat/ml-map-ux`.
