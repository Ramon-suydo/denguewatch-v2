# Design system

Tokens live in src/overhaul/tokens.css. Spacing follows an 8px grid. Text is 18px, captions 14px minimum, paragraphs about 65 characters. Fluid Fraunces display headings and Figtree text use clamp(). Surfaces are opaque; only navigation and map controls may blur. Cards use 16 to 28px radii, controls pills, soft layered shadows.

Light is the daytime theme; Night follows the system unless the visitor chooses a theme. Both themes define ink, muted text, surface, border, brand and action colors. Risk is separate: Low, Watch, Raised, High; every level includes a symbol and name.

Components: wordmark, wave, original care illustrations, buttons, segmented controls, chips, cards, scroll-snap carousel, native accordion, draggable city sheet with keyboard snap controls, report stepper, existing toast/modal/form components, skeleton, risk badge and focus/hover tooltip. Development-only /design is eliminated by Vite's DEV constant in production and has no sitemap entry.

Verification must distinguish token contrast checks from rendered contrast over imagery. No Lighthouse, cross-browser, CLS or INP result may be claimed without a current measurement.

CI budgets: initial JavaScript ≤220 KiB gzip; all JavaScript including the lazy map worker, staff and archived research routes ≤850 KiB gzip. scripts/check-ui-budget.mjs measures the built manifest graph and rejects map-engine entry into the initial graph. Screenshot CI uses Windows/Edge to match the baseline platform. Existing Linux quality gates remain.

The installed-app icon uses the same original drop/wave geometry with a maskable safe area; browser and manifest colors use bay teal and warm sand. Footer waves use the footer background color so the monochrome mark remains legible.
