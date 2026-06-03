# Telos Bug Hunter - Learnings

Accumulated knowledge across runs. Compact older entries when this exceeds 2000 lines.

## Known false-positives / do not re-report

These are documented in `CLAUDE.md` under "Known Limitations" or the P1-P3 bug crawl backlog (commit 7fa38ff). Do NOT re-flag without new evidence:

- Tool pages (`protein-calculator.html`, `hyrox-predictor.html`) missing `js/main.js` - already in backlog.
- `.html` extensions appearing in some internal links - already in backlog.
- `todayStr()` UTC timezone bug in client dashboard streak math - already in backlog.
- Service worker (`sw.js`) cache name still `telos-v1` - bump needed, already in backlog.
- Whop iframe on Safari/iOS: client portal login blocked by Safari third-party cookie policy - architectural limitation, not a bug.
- CORS `Access-Control-Allow-Origin: *` only set on success path in `submit-quiz.js` - same-origin in practice, not user-visible.

## Codebase conventions worth remembering

- No build step. Pure HTML/CSS/JS. Cache busting via `?v=N` query string on `style.css`, `main.js`, `quiz.js`.
- `thomas.html` and `client-dashboard.html` are self-contained: all CSS/JS inline, do NOT load `main.js` or `style.css`.
- Tool pages (protein calc, hyrox) have inline scripts; they currently skip `main.js`.
- Blog pages live under `/blog/` and prefix asset paths with `../`.
- Quiz logic is shared between `index.html` (inline) and `pricing.html` (overlay) via `js/quiz.js`.
- Public marketing pages: `index.html`, `pricing.html`, `chs.html`, `resources.html`, `protein-calculator.html`, `hyrox-predictor.html`, `product.html`, `shop.html` + 23 blog pages.

## Patterns observed

- 2026-06-03: Cache-busting version params on shared assets drift between pages. When `quiz.js` is bumped on one page, sibling pages can be missed - worth grepping all references when a version bumps.
- 2026-06-03: All 11 `<img>` tags on public pages lack `loading="lazy"` and intrinsic `width`/`height`. The 1.9MB `thomas.jpeg` is the biggest cost on the homepage.

## Tools / commands that worked

- `grep -rn "<img " --include="*.html"` to enumerate all image tags.
- `file images/*.jpeg` to get pixel dimensions for size sanity checks.
- `grep -rohn "<asset>" --include="*.html"` to find every page that references a shared file.

## Unexplored areas (next time)

- API auth flows (admin + client session cookie internals).
- Cron jobs N+1 risk under client growth.
- Service worker caching strategy correctness (network-first vs cache-first race).
- Blog SEO (Schema.org JSON-LD validity, canonical tags).
- Accessibility: focus management on modals, ARIA on quiz, keyboard nav on hamburger.
