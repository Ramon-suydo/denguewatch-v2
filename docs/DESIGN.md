# Photographic interface

Exactly three main navigation destinations: Dashboard `/`, Risk Map `/risk-map`, and Community Report `/report`. About & Credits `/about` is footer-linked, with no main-nav entry. Legacy research URLs redirect to relevant pages and the data/methods drawer; privacy and legal content remain accessible. Admin stays unlinked and authenticated. Native dialogs contain focus, make background controls inert and restore focus on close.

## Visual tokens and assets

Navy #071b2b, pale surface #f8fbfc, dark text #102a43, teal #0a766c, mint #c7efe5. A sequential teal map palette uses labels plus high-class hatching and a separate no-data pattern. Buttons and form controls have 44-pixel minimum targets; layouts support 360 pixels, reduced motion, keyboard input and print. Glass cards have opaque fallbacks. Self-hosted Montserrat supplies geometric extra-bold headlines, with font-display swap. Existing research archive fonts Roboto/Fraunces remain credited under OFL-1.1.

The owner-supplied 1672×941 RGB photograph is preserved byte-for-byte under `public/img/source/`. `python scripts/optimize-hero.py` creates AVIF/WebP at 640, 960, 1280 and 1672 pixels without upscaling. The largest WebP is below 250 KB. `Photo.tsx` uses picture/srcset, explicit dimensions, decorative empty alt text and a Dashboard-only preload/high priority. Wider displays blend edges; inner pages share a darker, blurred photograph.

The exact credit, “Background photograph by Sumarie Slabber”, appears on About and every footer. Author confirmation comes from the project owner, not independent licence verification. `src/content/credits.json` keeps source URL and licence empty and the UI hides empty fields. **NEEDS OWNER:** written permission or licence and source URL in `docs/evidence/image-permission.md`. Credit alone is not permission.

## Measured contrast

`npm run test:hero-contrast` runs a real browser at widths 360, 768 and 1440. It captures actual rendered layout, hides only text paint, samples every background pixel in the text rectangles, and compares actual foreground luminance against WCAG AA thresholds (4.5 normal, 3 large). This conservative rectangle test includes more than the glyph footprint. It is a prebuild requirement and fails the build on insufficient contrast. Receipts are `docs/evidence/hero-contrast.json`; raw captures remain local under `.artifacts/redesign/contrast/`. Axe browser checks independently cover cards, forms, drawers and keyboard targets.

## Content integrity

Core pages and privacy support English/Filipino. Team and contacts come only from `src/content/about.json`; empty fields are hidden. Credits cover source receipts, boundary inputs, providers, fonts, icons and the photograph. `npm run credits:generate` inventories actual locked npm dependencies and pinned Python packages into THIRD_PARTY_LICENSES.md, rendered on About. `npm run credits:check` verifies coverage and rejects placeholder UI text. Version, current commit, saved evaluation date and case-source dates are injected by Vite. No current disease risk is inferred from the old records.

## Loading and mobile measurement

Public route loading reserves one viewport of space so the safety notice and footer do not jump through the visible screen when a lazy page arrives. Dashboard reporting status imports the reporting client after the page can render. The shared photograph receives high fetch priority only on Dashboard. A real local mobile Lighthouse comparison improved performance from 65 to 91 and retained accessibility 100; CLS fell from 0.723 to 0.00053. Original and fixed logs are retained. These local scores do not verify hosted Vercel performance.

The software inventory includes all 16 resolved Python packages (406 npm/Python entries total), with every Python package version pinned. Bundled Python licence files are reproduced in THIRD_PARTY_LICENSES.md, including the DejaVu font notice for evaluation figures. UI fonts remain OFL-1.1.
