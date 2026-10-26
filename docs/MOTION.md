# Motion

CSS linear() provides a spring easing curve with an ease fallback. This adds no motion runtime dependency. Short interactions use 150?450ms; map color changes retain 600ms. Only transform and opacity animate continuously. Native View Transitions progressively enhance navigation. Scroll-snap provides the carousel's momentum; gestures always retain buttons and keyboard support.

Reduced motion removes parallax, wave drift, pulse, autoplay, count-up and spring movement. Content stays visible without observers. Ambient motion pauses while the document is hidden. The map's existing fallback order and its underlying estimate data must remain intact.

Performance targets, not unmeasured claims: mobile Lighthouse ?90 performance / 100 accessibility, LCP <2.5s, CLS 0, INP <200ms. Commit measured evidence with step 7.
