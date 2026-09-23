# DengueWatch design system

This branch intentionally contains one identity approval preview at `/`. All counts,
risk levels, sources and dates are illustrative; no Supabase requests or writes occur.
Approve the identity before extending it to the application's real pages.

## Reference study

The supplied `./legacy/Iacad-website` path was absent. The read-only reference used was
`D:/Project/Iacad-website/iacademy-library`: Container.tsx, Section.tsx, Card.tsx,
Reveal.tsx, app/globals.css, and app/layout.tsx.

Keep its 1280px container, 24–32px gutters, 24px card padding, generous section rhythm,
thin borders, soft shadows, and serif/sans hierarchy. The dashboard condenses marketing
section spacing to 32–48px. Its reveal is only 10px over 500ms, runs once, preserves
visible content without observation, and honors reduced motion. Static cards do not
lift on hover: only interactive controls imply interaction.

## Identity and tokens

`src/theme/palette.js` owns the colors. `tailwind.config.js` exposes named theme colors,
fonts, radii and shadows. CSS explicitly loads that config with `@config`, as required by
[Tailwind 4](https://tailwindcss.com/docs/functions-and-directives#config).
Import primitives from `src/components/ui`; do not duplicate button/form/badge styles
inside future pages.

- Deep Teal: 950 #092B2B, 900 #103938, 800 #124541, 700 #15534F, 600 #19665F,
  500 #287D74, 400 #4A968B, 300 #7CB5AA, 200 #ADD2CA, 100 #D4E9E4, 50 #EDF6F4.
  Dark structural surfaces and readable text convey calm, clinical credibility.
- Signal Amber: 900 #603012, 800 #76370F, 700 #91430E, 600 #B65A15,
  500 #E68A2E, 400 #F2A348, 300 #F9B76D, 100 #FFE5CB, 50 #FFF5EC.
  Saturated burnt amber marks actions; darker 700 is used for links, never bright amber
  as small text on white. Buttons use deep-teal text, not white.
- Warm gray: 900 #242B27, 800 #33352F, 700 #48463F, 600 #5E5A52,
  500 #716D63, 400 #969185, 300 #CBC7BC, 200 #E4E1D9, 100 #F2F0EB, 50 #FAF9F6.
  Warm surfaces soften the clinical palette without reducing text contrast.

Source Serif 4 adds restrained editorial authority. Source Sans 3 provides open
letterforms and clear numerals. Both are locally bundled, with Georgia/Times and
Segoe UI/Arial system fallbacks; see the rationale comment in the Tailwind config.

Body text is 18px; supporting text, badges, chart ticks, and labels are at least 16px.
Controls are at least 46px tall. The 4px spacing rhythm uses 8/12/16/24/32/48px.
Radii: 8px controls, 16px cards, 24px dialogs. Shadows are teal-tinted and restrained.
A decorative monitoring line appears in the wordmark and hero, with no pulse
animation, medical cross, or mosquito imagery. It does not encode real measurements.

## Semantics and measured contrast

Contrast uses WCAG sRGB relative luminance. Every text pair below exceeds AA's 4.5:1
normal-text threshold. Run `npm run test:contrast` to verify from source tokens.

| Meaning               | Text / background | Ratio  |
| --------------------- | ----------------- | ------ |
| Low risk              | #205B37 / #E7F2E8 | 6.99:1 |
| Moderate risk         | #725000 / #FFF2C2 | 6.54:1 |
| High risk             | #972F32 / #FBE9E7 | 6.47:1 |
| Insufficient data     | #48463F / #F2F0EB | 8.29:1 |
| Community, unverified | #65428A / #F2EBFA | 6.68:1 |
| Official source       | #255482 / #EAF1FA | 6.92:1 |
| Primary action        | #092B2B / #E68A2E | 5.78:1 |
| Amber link on white   | #91430E / #FFFFFF | 6.97:1 |
| Muted text on page    | #5E5A52 / #FAF9F6 | 6.52:1 |

`RiskBadge` accepts Low, Moderate, High, or Insufficient data. Only it uses risk
colors: labeled pills with distinct symbols. Moderate is pale yellow/ochre, visibly
different from the saturated burnt-amber action button. Never use risk colors for
provenance, decorative accents, validation errors, or arbitrary statuses.

`UnverifiedBadge` defaults to community: violet, dashed rectangular outline and a
diamond. `source="official"` is blue with a solid rectangular outline and document
symbol. Source labels do not imply risk, case confirmation, or validation of the
sample figures. Labels, symbols and shape supplement color on projectors and for
color-vision differences. The generic `Badge` is neutral metadata only.

## Components and behavior

- Button: primary, secondary, ghost; native props and disabled state.
- Card, Badge, MonitoringLine, Reveal: shared presentation primitives.
- Input, Select, Checkbox: visible labels, generated IDs, accessible error descriptions.
  Consent is opt-in and resets each time the preview opens.
- Modal: native dialog, inert background, Tab/Shift+Tab wrapping, Escape, close button,
  scroll lock and focus restoration. Callers own the open state.
- Toast / ToastProvider / useToast: persistent polite announcement with explicit
  dismissal, so messages cannot vanish before they are read.
- TopNav / LayoutShell: mobile menu, configurable section links and action, skip link.
- StatCard: label, value, detail and optional annotation; no implicit risk inference.
- TrendChart: lazy-loaded Recharts, responsive sizing, keyboard chart support,
  solid/dashed series and a visible expandable data table. Nulls remain gaps;
  empty datasets have an explicit empty state. No chart animation.
  [Recharts accessibility reference](https://github.com/recharts/recharts/wiki/Recharts-and-accessibility).

## Review and validation

Use Node >=22.12.0 (see .nvmrc), then:

```powershell
npm ci
npm run dev
npm run build
npm test
npm run test:contrast
npx playwright install chromium
npm run test:ui
```

For an already installed Chrome, set `$env:PLAYWRIGHT_CHANNEL = 'chrome'` instead of
installing Chromium. Browser checks cover widths 320, 390, 768, 1024, and 1440; period
selection, searching/empty states, mobile navigation, consent gating, focus containment
and restoration, and axe WCAG A/AA checks on desktop, mobile, and the open dialog.

Screenshots are generated in ignored `.artifacts/design-system/`: desktop.png,
desktop-overview.png and mobile.png. This is automated coverage, not a claim of a full
accessibility certification. Test on the actual projector and self-review locally
before merging near the defense. The user pushes; merging/pushing main deploys Vercel.
