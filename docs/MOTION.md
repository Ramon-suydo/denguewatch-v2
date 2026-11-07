# Motion

CSS linear() provides a spring easing curve with an ease fallback. This adds no motion runtime dependency. Short interactions use 150 to 450ms; map color changes retain 600ms. Only transform and opacity animate continuously. Native View Transitions progressively enhance navigation. Scroll-snap provides the carousel's momentum; gestures always retain buttons and keyboard support.

Reduced motion removes parallax, wave drift, pulse, autoplay, count-up and spring movement. Content stays visible without observers. Ambient motion pauses while the document is hidden. The map's existing fallback order and its underlying estimate data must remain intact.

Performance targets, not unmeasured claims: mobile Lighthouse >=90 performance / 100 accessibility, LCP <2.5s, CLS 0, INP <200ms. Commit measured evidence with step 7.

Implementation: CSS linear() spring with ease fallback; native Web Animations for finger-following sheet transforms and release; native document.startViewTransition with ordinary-link fallback. No motion library is added. Reveals never hide content before JavaScript, and staggered steps animate transform/opacity only. Keyboard and reduced-motion tests remain mandatory.

Local evidence: three 51-test browser runs, a final 7-test focused follow-up, 64 visual comparisons across both motion preferences, and native-transition supported/unavailable paths pass. Lighthouse measured 97 performance / 100 accessibility, LCP 2.446 s and CLS 0. Field INP and real iOS Safari remain NOT VERIFIED. See [checks](evidence/ui-overhaul-checks.md).

The Manila-first revision extends visual coverage to five pages: 80 passing captures and 80 independent comparisons across four widths, two themes and both motion settings. New charts are static SVG; selecting a saved model example changes source-based data without autoplay.

Live Manila adds a static SVG bar chart and static city ring/label. It reuses the existing segmented-control reduced-motion treatment; data refresh is not an animation. The 80-case Replay/public visual matrix includes both motion settings. New Live browser/accessibility checks use reduced motion at 360/1280 px. A minute timer rechecks source freshness without animating values.
