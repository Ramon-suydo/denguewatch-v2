# Design system

Tokens live in src/overhaul/tokens.css. Spacing follows an 8px grid. Text is 18px, captions 14px minimum, paragraphs about 65 characters. Fluid Fraunces display headings and Figtree text use clamp(). Surfaces are opaque; only navigation and map controls may blur. Cards use 16?28px radii, controls pills, soft layered shadows.

Light is the daytime theme; Night follows the system unless the visitor chooses a theme. Both themes define ink, muted text, surface, border, brand and action colors. Risk is separate: Low, Watch, Raised, High; every level includes a symbol and name.

Components: wordmark, wave, original care illustrations, buttons, segmented controls, chips, cards, scroll-snap carousel, native accordion, draggable city sheet with keyboard snap controls, report stepper, existing toast/modal/form components, skeleton, risk badge and native tooltip. Development-only /design is eliminated by Vite's DEV constant in production and has no sitemap entry.

Verification must distinguish token contrast checks from rendered contrast over imagery. No Lighthouse, cross-browser, CLS or INP result may be claimed without a current measurement.
