# Design System — BeerMenu

**Concept: "Taverne bij nacht".** Dark-first, warm and editorial, like a menu card in a dim bar.
The app is mostly opened inside Biertaverne De Gouverneur, so dark mode is the default and light
mode is a cream "paper" variant.

Derived with the `ui-ux-pro-max` skill:
- Product match **Brewery/Winery**: motion-driven + vintage/retro, secondary **Dark Mode (OLED)**,
  palette "deep amber/burgundy + gold, craft aesthetic".
- Palette adapted from the skill's brewery palette (burgundy `#7C2D12` + craft gold `#CA8A04`) to a
  dark UI: gold becomes the accent, burgundy becomes the warmer "ember" for heat/danger.
- The skill suggested Amatic SC + Cabin for a craft feel; we use the repo's licensed **PP Migra**
  (editorial serif, italic display) + **PP Neue Montreal** instead, so fonts stay local (PWA/offline)
  and the look is modern rather than hand-drawn.

## Colour tokens

Defined as RGB triplets in `src/index.css` and exposed via Tailwind (`tailwind.config.js`), so every
utility supports opacity: `bg-gold/15`, `border-line/10`, `text-fg`.

| Token       | Dark (default) | Light      | Use                                        |
|-------------|----------------|------------|--------------------------------------------|
| `bg`        | `#0E0B09`      | `#F7F1E6`  | Page background (stout / cream paper)      |
| `surface`   | `#191410`      | `#FFFCF6`  | Cards, sheets                              |
| `surface-2` | `#261E18`      | `#EEE5D4`  | Inputs, image wells                        |
| `line`      | foam @ alpha   | ink @ alpha| Borders/dividers — always used as `/10`–`/25` |
| `fg`        | `#F6EEDF`      | `#1B120C`  | Text; also inverted "active" chips         |
| `muted`     | `#B0A391`      | `#66584A`  | Secondary text (≥ 5.4:1 on every surface)  |
| `gold`      | `#F2B33D`      | `#8A5204`  | Accent, primary buttons, rating            |
| `on-gold`   | `#1A1108`      | `#FFFFFF`  | Text on gold                               |
| `ember`     | `#F0684E`      | `#B22222`  | ABV, danger, the Toepen "P"                |
| `hop`       | `#9BC53D`      | `#3F6E12`  | IBU, success, "new"                        |

All text tokens meet WCAG AA (4.5:1) against `bg`, `surface` and `surface-2` in both themes.
Data colours are fixed per meaning: **ABV = ember, IBU = hop, rating = gold**.

Never hardcode hex in components. The only exceptions are SVG attributes that can't read CSS
variables (the radar chart in `BeerModal.tsx` mirrors the tokens in `CHART_COLORS`) and the
bottle-cap artwork.

## Typography

| Role     | Font                         | Tailwind                                  |
|----------|------------------------------|-------------------------------------------|
| Display  | PP Migra Extrabold *Italic*  | `font-display italic font-extrabold`      |
| Body/UI  | PP Neue Montreal 400/500/700 | default `font-sans`                        |
| Labels   | Neue Montreal, uppercase     | `.eyebrow` / `.stat-label`                |
| Numbers  | tabular figures              | `.tabular`                                |

Page titles are oversized (`text-[2.75rem]` → `md:text-7xl`) with tight leading and a word-by-word
reveal (`PageLayout`). Body stays ≥ 16px; labels are 11px uppercase with wide tracking.

## Components (`src/index.css` @layer components)

- `.surface` — card: `bg-surface`, 1px `line/10` border, `rounded-3xl`.
- `.btn`, `.btn-primary` (gold), `.btn-secondary`, `.btn-ghost` — pill buttons, min 48px high.
- `.icon-btn` — 44×44 round icon button (always give it an `aria-label`).
- `.chip` / `.chip-active` — filter pills, min 40px; active chips invert to `fg` on `bg`.
- `.field` — inputs/selects, 48px, gold focus ring.
- `BottleCap` — the brand mark (crimped crown cap, 21 teeth). Used for the logo, the centre tab, the
  randomizer's spin button, the "Toep!" button, loaders and the winner screen.
- `Sheet` — bottom sheet on mobile (drag the handle down to close), centred dialog on ≥ sm.
  Portalled to `<body>`, locks scroll, closes on Escape.
- `PageLayout` — eyebrow + editorial title + subtitle, content width `default | narrow | compact`.
- `SectionHeading`, `EmptyState`, `Bubbles` (rising foam, decorative).

## Layout & navigation

- **Mobile:** sticky top bar (logo, install, theme) + floating **bottom tab bar** with 5 items;
  the centre item ("Verras me") is a raised bottle cap. Content and footer reserve
  `6.5rem + safe-area-inset-bottom` below.
- **≥ md:** tabs move into the top bar as a pill nav with a sliding active indicator.
- Safe areas: `viewport-fit=cover`, `pt-safe` on the header, `env(safe-area-inset-bottom)` on
  fixed bottom UI. Floating trays (compare, update) sit above the tab bar.
- Grids: beer cards 2 → 3 → 4 columns; gutters `px-4` → `sm:px-6`.

## Motion

Framer Motion for UI state, GSAP for the randomizer reel.

| Pattern            | Timing                                  |
|--------------------|-----------------------------------------|
| Route change       | 220ms fade + 10px rise, `expo.out`      |
| Title reveal       | 700ms per word, 70ms stagger            |
| Pills / tabs       | spring (stiffness 420–500, damping 34)  |
| Sheets             | spring (380 / 38)                       |
| Randomizer reel    | 3.35s `power4.out` + 0.45s `back.out` settle, haptic tick per row |
| Result stats       | count-up 1.1s after 450ms               |

`<MotionConfig reducedMotion="user">` plus a global `prefers-reduced-motion` CSS rule: with
reduced motion the reel is skipped, bubbles and rays are hidden, and results render immediately.

## Pre-delivery checklist (from the skill)

- [x] No emoji as icons — Lucide only (menu-builder themes are stripped of their emoji)
- [x] Text contrast ≥ 4.5:1 in both themes; focus ring = 2px gold outline
- [x] Touch targets ≥ 44px; pressed states scale without shifting layout
- [x] `prefers-reduced-motion` respected
- [x] Checked at 375px, 390px, landscape (844×390) and 1366px
- [x] Safe areas respected for header, tab bar and sheets
