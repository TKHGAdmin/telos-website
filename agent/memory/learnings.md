# Bug Hunter Learnings

Accumulated knowledge across runs. Compress when this exceeds 2000 lines.

## Codebase orientation

- Pure HTML/CSS/JS static site + Vercel serverless. No build step, no test suite, no framework.
- Public marketing pages: `index.html`, `pricing.html`, `chs.html`, `product.html`, `shop.html`, `resources.html`, `hyrox-predictor.html`, `protein-calculator.html`, plus 23 blog articles under `blog/`.
- Dashboards (`thomas.html`, `client-dashboard.html`) are self-contained and intentionally do NOT load `js/main.js` or `css/style.css` - they have inline CSS/JS. Do NOT flag missing main.js on these two.
- CLAUDE.md's "Known Limitations" section documents an existing P1-P3 backlog (bug crawl April 2026). Cross-reference before flagging so we don't duplicate what Thomas already knows.

## Nav patterns (as of 2026-07-28)

Three distinct nav layouts are live in production:

1. **Dropdown pattern** (index, pricing, chs, product, resources, shop): uses `.nav-dropdown-toggle` "Tools" dropdown containing Quiz / Protein Calc / Hyrox / Resources / FAQ.
2. **Flat pattern A** (`protein-calculator.html`): 10 top-level items, no dropdown, includes About + Quiz + FAQ + Protein Calc + Hyrox but no Shop.
3. **Flat pattern B** (`hyrox-predictor.html`): 8 top-level items, no dropdown, "Home" instead of "System"/"About", missing Quiz + FAQ, includes Shop.

The two tool pages are the outliers - they should be migrated to pattern 1 for consistency.

## `js/main.js` inventory

Handles: nav glassmorphism-on-scroll, mobile menu toggle, nav-dropdown-toggle click handlers, smooth scroll on hash links, `.animate-on-scroll` -> `.visible` observer, FAQ accordion, active nav link highlighting, cursor glow (desktop), hero spotlight, `.card-tilt` 3D tilt, `[data-count]` stat counters, `.btn-primary/.btn-outline` magnetic hover, hero parallax on scroll, `.btn` click ripple, `.section-label` slide-in reveal.

Pages that don't load `main.js` lose all of the above. `hyrox-predictor.html` and `protein-calculator.html` don't load it. Neither uses `.animate-on-scroll` or `.card-tilt`, so those specific misses are inert - but glassmorphism, magnetic btn, ripple, and cursor glow are broken there.

## False-positive patterns to avoid

- `alt=""` on images wrapped in `aria-hidden="true"` container (e.g. `chs.html:824`) - correct for decorative images. Do NOT flag.
- `novalidate` on forms with `required` fields where a custom JS validator handles messaging (e.g. chs application form) - intentional to render styled errors instead of native browser tooltips. Do NOT flag.
- Services checkbox group on `chs.html` allowing zero selection - CLAUDE.md documents services as optional multi-select, not required. Do NOT flag.
- Old SVG icons `telos-icon-192.svg` / `telos-icon-512.svg` in `images/` - documented as deprecated. Do NOT flag as unused.

## Known limitations already documented by Thomas (do not re-report cold)

Per CLAUDE.md "Known Limitations":
- Whop iframe on Safari/iOS: client portal cookie auth fails; workaround documented (direct URL / PWA).
- Tool pages missing `main.js`: known P1-P3 backlog item.
- `.html` extensions in internal links: known P1-P3 backlog item.
- `todayStr()` UTC timezone bug in client dashboard streaks: known P1-P3 backlog item.
- SW cache version bump needed: known P1-P3 backlog item.

When flagging any of these, note "still unresolved" and cite the CLAUDE.md reference. Don't dress them up as fresh discoveries.

## Rotation notes

- Day-of-year mod 4: 0=Functional, 1=Visual/UX, 2=Performance, 3=Security.
- 2026-07-28 = DOY 209 -> Visual/UX.
