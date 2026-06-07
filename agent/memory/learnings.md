# Telos Bug Hunter — Accumulated Learnings

Living notes the agent maintains across runs. Keep under 2000 lines; compress aggressively.

---

## Codebase shape (verified 2026-06-07)

- **Static HTML + Vercel serverless** — no build step, no framework. `npm test` doesn't exist; there is no test harness in this repo. Linters aren't configured.
- **Two big self-contained pages**: `thomas.html` (admin, ~161 KB) and `client-dashboard.html` (PWA, ~278 KB). Both have inline `<style>` and `<script>` and do NOT load `js/main.js` or `css/style.css`. When auditing them, work inside those files only.
- **API directories**: `api/submit-*` (public), `api/dashboard/*` (admin, requires `verifySession`), `api/client/*` (requires client session cookie), `api/cron/*` (requires `Bearer $CRON_SECRET` auth header). Auth lives in `api/lib/auth.js` (admin) and `api/lib/client-auth.js` (client). Redis wrapper in `api/lib/redis.js`.
- **Cron jobs run from Vercel**:
  - `weekly-summary` — Monday 14:00 UTC (9 AM ET)
  - `engagement-check` — daily 15:00 UTC
- **Shop integration is Shopify Storefront API** loaded client-side via `js/shop.js`. The token in `js/shop.js:15` is a public read-only Storefront token by design — not a leaked secret. Don't flag it.

## Known patterns / things NOT to flag

- `index.html` extensions in internal hrefs across pages. CLAUDE.md says clean URLs are the convention, but Vercel's `cleanUrls: true` rewrites `.html` → no-ext, so these work in production. Convention-violation only; not a functional bug.
- Permissive CORS (`Access-Control-Allow-Origin: *`) on the public `submit-*` endpoints (set in `vercel.json`). Intentional for the public lead-capture forms.
- `js/shop.js?v=1` vs `js/shop.js?v=2` mismatch between `shop.html` and `product.html`. The browser caches per-URL, so both will fetch the latest. Worth a one-line nit at most, not a bug.
- `body.page-load-anim` only on `index.html` — intentional, per CLAUDE.md.
- `client-dashboard.html` and `thomas.html` not loading the shared CSS/JS — intentional self-contained pattern.
- `descriptionHtml` from Shopify rendered via `innerHTML` in `js/shop.js`. Shopify sanitizes on the admin side; treat the merchant's own store as trusted source.

## Real-bug signals to remember

- **CSS Grid child count mismatch.** When `grid-template-columns: 1fr 1fr` and someone inserts a third child as a sibling, the layout silently wraps. Easy bug to introduce in this codebase because most product/dashboard layouts are simple two-col grids.
- **Cron time-of-day timing.** `weekly-summary` runs Monday morning — any logic that includes "today" in a 7-day lookback will misbehave because Monday at 9 AM ET has no day-of activity yet. Always check whether cron windows include the day the cron runs on.
- **No de-dup keys for periodic emails.** When you see a Resend POST inside a daily cron with no `last_sent_at` check or per-day lock key, it's almost certainly an unintentional daily-spam source.

## Areas not yet explored

- `thomas.html` internal logic (massive file, deferred)
- `client-dashboard.html` Home tab calculations (execution score formula, streak math)
- Push notification flow (`api/client/push-*`, `sw.js`)
- Modules/training video upload flow end-to-end
- `js/quiz.js` execution score logic + the gating on pricing page
- Blog HTML for cross-link consistency

## False-positive log (avoid these in future reports)

(empty — no decisions yet to derive false-positives from)

---

## Run 2026-06-07 (Functional)

- Focus: Functional. Bootstrapped the `agent/` infra (this is run 1).
- Findings: 3 bugs (P1 product layout, P1 weekly streak, P2 engagement spam).
- Time spent: heavy reads of shop.html, product.html, js/shop.js, both cron files, auth.js, chs form. Skipped thomas.html and client-dashboard.html for this run because they're huge and the lower-hanging fruit lived in recent commits.
- Next run (Visual/UX): worth eyeballing the new product/shop pages on mobile breakpoints. Also CHS form labels for accessibility, and missing `alt` text across blog pages.
