# Telos Bug Hunter — Learnings

Accumulated knowledge about the Telos Fitness codebase. Grows over runs.

## Known non-bugs (do NOT re-report)

Per CLAUDE.md "Known Limitations" section (April 2026 P1-P3 backlog):
- Tool pages (protein-calculator, hyrox-predictor) missing main.js
- .html extensions in some internal links (chs.html nav logo/links, footer links on shop/product)
- todayStr() UTC timezone bug in client dashboard streaks
- Service worker cache version bump needed
- Whop iframe on Safari/iOS: client portal cookies blocked (third-party cookies)

Do not re-flag any of these unless the impact changes or scope grows.

## Codebase architecture notes

- Pure static HTML + Vercel serverless functions. No framework, no build step.
- Client and admin dashboards (thomas.html, client-dashboard.html) are self-contained — inline CSS/JS only; do NOT load main.js or style.css.
- All public marketing pages should load `js/main.js` per convention. Tool pages already missing this per known-limitation.
- CSS cache-busting: `?v=16` everywhere in style.css refs. Bumped together.
- Client auth cookie: `telos_client_session` (3-part token). Admin cookie: `telos_dash_session` (2-part).

## Patterns observed on first run (2026-07-04)

- Shop (shop.html + product.html + js/shop.js) is brand-new: uses Shopify Buy SDK v3, cart drawer, localStorage-persisted checkout ID.
- Nav pattern varies by page group: index/pricing/shop/product use standard "System / About / Charleston / Tools / Shop / Client Login / Book" desktop nav. chs.html uses a custom hotel-style nav ("Services / Events / Coach / Online / Apply") and does NOT include Shop or Tools links.
- Calendly URLs are semantically confusing: `1-1-growth-consultation-call-clone` is actually the *Lifestyle* tier consultation, not Growth. This is CLAUDE.md's stated mapping — do not report generic "Book a Call" CTAs using this URL as a mismatch unless the tier context clearly conflicts (e.g., a Growth-tier CTA using it).
- A refactor in commit 9319f9d moved Resources & FAQ into a Tools dropdown. It appears only the desktop nav was fully updated across pages; mobile menus were not consistently reworked. This is a real ongoing inconsistency worth watching.

## False-positive patterns to avoid

- Reporting `.html` in internal links → known backlog.
- Reporting tool pages missing main.js → known backlog.
- Reporting SW cache staleness → known backlog.
- Reporting "code could be cleaner" style suggestions → out of scope.
- Reporting theoretical XSS in code that only accepts trusted Shopify CDN URLs → too speculative.

## Files explored on first run

- shop.html, product.html, js/shop.js (new — deep read)
- chs.html (new — deep read of nav + form submission)
- js/main.js (skim)
- js/quiz.js (recent change reviewed)
- All public HTML nav sections (mobile menu audit)
- api/submit-quiz.js, api/submit-email.js, api/submit-chs-application.js
- vercel.json, sw.js
