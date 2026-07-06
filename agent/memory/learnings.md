# Telos Bug Hunter — Accumulated Learnings

Living notebook. Each run appends observations, false-positive patterns, and areas explored.
Compress older entries when the file passes 2000 lines.

---

## 2026-07-06 — First run bootstrap

- Infrastructure did not exist prior to this run. Created `agent/memory/`, `agent/reports/`,
  and `docs/BUG_REPORT_SCHEMA.md`. Focus rotation seeded at day 0 (Functional).
- Repository shape: static HTML pages + Vercel serverless functions under `/api`.
  No build step, no test suite. Bug hunting relies on code trace + static reads.
- Redis is Upstash REST; no npm SDK. All keys documented in `CLAUDE.md`.
- Auth model: two independent cookie systems (`telos_dash_session` for admin,
  `telos_client_session` for client PWA). Different token shapes — verify against
  the right verifier before flagging.
- Dashboards (`thomas.html`, `client-dashboard.html`) are intentionally self-contained
  with inline CSS/JS. Do NOT flag "should extract to shared file" — that's a style
  preference the maintainer has explicitly ruled out (CLAUDE.md).
- Homepage-only `body.page-load-anim` is intentional per CLAUDE.md. Do not flag other
  pages for lacking it.
- `.html` extensions in internal links and tool pages missing `main.js` are known
  P1-P3 backlog items (CLAUDE.md "Known Limitations"). Only re-flag if the specific
  file is not on the backlog list.
- Everfit references were removed in a prior sweep. Any lingering mention is likely a bug.
- Focus map: 0 Functional, 1 Visual/UX, 2 Performance, 3 Security.

## False-positive patterns to avoid

- Inline styles/scripts in dashboards or tool pages — intentional, per CLAUDE.md.
- Missing `.css`/`.js` cache-bust query strings on a page the user hasn't touched.
- "This function is long" or "this file could be smaller" — not a bug.
- "Missing TypeScript" / "no tests" — architectural, out of scope.
- Shopify Storefront tokens in `js/shop.js` — these are designed to be public
  (unlike Admin API tokens). Not a security bug. Don't re-flag.
- `product.descriptionHtml` injected via `.innerHTML` in shop.js — Shopify product
  descriptions are admin-authored, same trust surface as any CMS. Not an XSS.

## Areas explored on 2026-07-06

- Session/auth libs (`api/lib/auth.js`, `api/lib/client-auth.js`) — clean.
- Public form submitters (`submit-quiz`, `submit-email`, `submit-chs-application`) — clean.
- Cron jobs (`weekly-summary`, `engagement-check`) — engagement-check has no
  dedupe (see report 2026-07-06 Bug 2).
- Shop pipeline (`js/shop.js`, `shop.html`, `product.html`) — product detail grid
  layout regression from commit f5cb8c4 (see 2026-07-06 Bug 1).
- Client `me.js` and admin `clients.js` still carry Everfit references despite
  the "Everfit removed" note in CLAUDE.md (see 2026-07-06 Bug 3).

## Patterns worth watching next run

- Any cron/emailer that has no per-recipient cooldown key is suspicious. Grep
  new cron files for a `SETEX` or `SET ... EX` on a `sent:` marker.
- When new siblings are added to an existing CSS Grid container, check
  `grid-template-columns` count against child count. This is a common
  regression pattern in a codebase without a component layer.
