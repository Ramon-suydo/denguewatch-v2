# Manila-first revision - 2026-10-27

The owner approved adapting a groupmate's PDF structure while retaining DengueWatch's own brand. The reference is a hierarchy guide, not approval to reuse its sample counts, current-week labels, seasonal cutoffs or styling.

The landing page now starts with Manila. Its weekly recorded-count chart and saved one-week estimate are together, with the source dates, uncertainty range and an exact-value table. Missing/incomplete weeks remain gaps. The default complete-row snapshot originates 2023-11-26 and estimates 2023-12-03; it is not a forecast for the coming week today.

Other NCR areas have their own section: 15 cities plus Pateros in three district cards. The full map remains a separate destination. The primary navigation exposes Manila, NCR Map, Our Model and Report; page shortcuts jump directly to the main sections. Original typography, palette, photo, mark, themes and care guidance remain.

Our Model now owns the interactive historical demonstration and detailed model comparisons. City/week selectors compare the saved predicted class and probability with the recorded count and outcome. Random Forest estimates a high-case event, whereas the Manila chart uses a separate count baseline. Missing inputs receive no prediction or match verdict. The default historical Manila example is a miss; the simpler rule's better saved F1 remains visible. No model is retrained or changed for the presentation.

Before captures are the actual committed Dashboard images from `1ed560a`: [mobile](evidence/manila-focus-before/dashboard-360-light.png), [desktop](evidence/manila-focus-before/dashboard-1280-light.png), with provenance in that folder. After captures are [mobile](evidence/ui-overhaul/dashboard-360-light.png), [desktop](evidence/ui-overhaul/dashboard-1280-light.png) and the new [model page](evidence/ui-overhaul/model-1280-light.png). The model page is new and has no prior equivalent screenshot.

Verification, source boundaries and remaining owner work: [Manila-first checks](evidence/manila-focus-checks.md). The restart interrupted production verification after all three 54-test stability runs had completed; remaining browser checks resume with one worker. Completed checks are retained, and an interrupted log is not presented as a pass.

---

# Bay & care UI overhaul — 2026-10-27

The owner explicitly rejects iACADEMY as a reference. DengueWatch uses its own water-drop / Manila Bay wave mark, Fraunces + Figtree type, warm sand, deep teal and coral actions. No reference screenshot was available in this session; the supplied layout principles guided the work.

Before: the twilight photograph covered every route, dense navy/glass panels competed with small type, Dashboard linked a static illustration, Replay began at the first held-out week, and Report could show closed and unknown status together.
After: the photograph belongs to the hero; inner pages use readable opaque surfaces; the local boundary preview and ranked city list share the same saved week; the map begins with the most diverse available levels; collection states are mutually exclusive and the gated form is a four-step flow. About owns the long explanation and collapsible evaluation tables.

## Evidence and source boundaries

Historical before captures: [360 px](evidence/home-360.png), [1280 px](evidence/home-1280.png). These are the repository’s earlier published-redesign captures, not a newly invented reference. Current after captures are under evidence/ui-overhaul/ and all 64 regression baselines are under tests/visual/baselines/ (four pages × four widths × two themes × two motion settings).

The branch was created from fetched origin/main de0d22c, then fast-forwarded to the existing reviewed ML/map baseline 5d9bdb4. This prerequisite is not new ML work. No ML pipeline, generated data, models, submission API, schema, moderation or retention behavior is changed by the UI commits. The local → online → plain-map fallback order is retained. The risk palette changes presentation only; thresholds and probabilities remain identical.

Examples use public/ml/replay.json. Peak and quiet require all 17 actual target-week counts. Rising compares complete adjacent calendar weeks only. Mixed maximizes Shannon entropy over four saved risk levels with all 17 estimates present. Earliest date wins ties. These are factual sample-selection rules, not invented event names or official epidemic declarations. Every chip displays its date.

City probabilities and reliability still read the generated files. Existing all-week and numeric-evidence assertions remain, including 119 unavailable predictions. New coverage compares the preview’s 17 probabilities and top three for every chip. No missing value is filled with zero.

## Interaction and privacy decisions

Native CSS springs and Web Animations avoid a motion-runtime dependency. Pointer drags follow the finger with transform only; release uses distance and velocity. Peek/half/full snaps have handle buttons and arrow/Home/End controls. Reduced motion removes movement. Native View Transitions use ordinary navigation when unavailable; a dedicated motion-enabled test covers both paths.

Small geographic polygons remain actual shapes. Pointer/keyboard selection shows a tooltip; the large full-map action and searchable city picker provide touch alternatives. The footer’s locator is a display-only rendering of existing country/NCR boundaries; its source hashes and simplification tolerance are recorded in evidence/locator.json. It makes no map/tile request on Report.

Report fields retain the existing API contracts and people-affected range/default. Consent is unticked and mandatory at Review; server-side proof, rate limits, filters, moderation, delay and withdrawal are untouched. Closed preview disables inputs and submission. Unknown policy shows one Retry state and no submission form. No code, note or health field is put in browser storage or the URL. Personal Gmail publication is removed; approved contact remains an owner decision. The long privacy notice and withdrawal flow stay available in the modal.

## Review limits

All new Filipino copy is a machine-assisted draft for owner/native-speaker review. Do not claim linguistic approval. Real iOS Safari/device usability, screen-reader sessions, photo permission, an approved controller/contact, hosted configuration and DPO review remain NEEDS OWNER. Local WebKit is compatibility evidence, not an iOS Safari certification. Lab scores and failures are reported separately in evidence/ui-overhaul-checks.md.


---

# UX decisions: city classification and Replay

The primary view now answers which Metro Manila city areas have higher estimates in a clearly dated example. It does not imply a current forecast from old data. Exactly Dashboard, Risk Map and Community Report remain in primary navigation; About and Methods stay footer-linked.

Dashboard order: compact photographic hero and two actions; visible Replay/Live banner; top-three city estimates and neutral map thumbnail; three prevention actions and urgent warning signs; Data/Model/Map steps; closed Evidence accordion. Dense numeric methods and scenario analysis belong to About/Methods and the research archive. Primary views avoid MAE, Spearman, Scenario M and persistence wording. Probabilities use plain “about N in 10” wording; small values are “less than 1 in 10,” never rounded into a false zero-risk promise. Filipino primary text follows the same controls and data.

The national Philippines Outlook Index has been retired from primary UI. Its source, definition and evaluations are preserved under docs/archive/national-outlook and the original scripts/data for auditability. The current model uses the 17 NCR units only. Archived Manila 2023 research remains distinguishable from the 2016-2020 NCR classification task. Community reports remain separate and closed.

Motion is present in section reveals, count-up coverage, subtle photo movement, sparklines, city fly-to, probability-color transitions and high-level pulses. Reduced motion disables animation, autoplay and tilt. Explicit dimensions, stable loading space and lazy map code protect layout/performance. Browser/Lighthouse evidence is recorded separately; these choices do not prove the five-second usability goal.

The default Dashboard example is the first held-out week. It is not selected for favorable outcomes. Replay can show later weeks, including unavailable predictions where the real input calendar has gaps. A neutral thumbnail avoids encoding a historical risk color as a Live value.

The physical map resolution is city/municipality. Display zoom and street detail do not imply sub-city model precision. Calibration and probability bands are research constructs. The baseline can outperform RF, and all saved results remain visible.

The optimized shared photograph is preloaded from the initial HTML with the same responsive AVIF source set used by Photo. Lighthouse identified late discovery through the lazy Dashboard chunk; preload shortens that path without changing image pixels or audit settings.

The small primary Dashboard renders from the entry chunk. Other pages and technical evidence remain lazy. Root UI primitives import their own modules rather than the legacy layout barrel, which had pulled the data-service SDK onto the first loading path. This changes loading order, not content, data or safeguards.
