# Telos Bug Hunter — Learnings

Accumulated knowledge across runs. Patterns, false-positive avoidance, and notes on the codebase.

Keep under 2000 lines. Compress older entries into a Summary section when exceeded.

---

## Codebase orientation

- Pure HTML/CSS/JS, no build step. Pages are full standalone HTML files.
- Dashboards (thomas.html, client-dashboard.html, chs.html) are self-contained with inline styles and inline scripts — they do NOT load `js/main.js` or `css/style.css` (or in chs's case, they DO load shared assets but scope custom CSS via a body class).
- Marketing pages all share `css/style.css` and `js/main.js`.
- All client-portal and admin-portal logic is server-side at `api/`. Public form posts use rate-limited public endpoints.
- Pricing page is quiz-gated (localStorage `telosQuizCompleted` reveals prices).

## False-positive patterns to avoid

- **"Tool pages don't load main.js"** — already documented in CLAUDE.md as a known P1-P3 backlog item. Do not re-report unless something new breaks because of it.
- **".html in internal links"** — same; documented in the existing bug crawl backlog.
- **Inline styles on `body class="page-load-anim"` only on index.html** — intentional per CLAUDE.md ("opt-in, not global").
- **No CSP / no Subresource Integrity on CDN scripts** — known; out of scope unless a new CDN is added without review.
- **Shopify Buy SDK uses `latest` channel** — note, but only flag if it actually breaks.

## True-positive patterns worth hunting

- **New code from the last 7-14 days of commits** is where bugs cluster. The shop/cart/product flow was added recently and is a hot spot.
- **CSS grid templates whose child count doesn't match the column count** — easy class of bug, mechanical to verify.
- **Cache busting versions (`?v=N`)** drifting between pages — find with grep across HTML files.
- **localStorage reads with no JSON.parse try/catch** — silent corruption can break pages.

## Domain notes

- Default admin password / session secret are env vars — never grep for hardcoded secrets in the repo, but DO check git history occasionally for accidental commits.
- Service worker (`sw.js`) scope is site root and applies to ALL visitors who've ever loaded `/client-dashboard` — be cautious about caching strategies that affect public pages.
- The cart drawer (z-index 9999) sits above the mobile menu (z-index 999). Mobile menu doesn't auto-close when a cart open is triggered from inside it — minor UX wart, low priority.

## Open questions to investigate later

- Is the Shopify checkout `webUrl` HTTPS-locked? (Quick check: addLineItems response → cart.checkoutUrl)
- Do the cron jobs (`api/cron/*`) verify `CRON_SECRET` correctly when Vercel injects the auth header?
- Are there N+1 Redis fetches in any of the admin dashboard endpoints when client count grows?

---

## Run log

### 2026-06-19 (first run, focus: functional)

- Bootstrapped agent infra (this directory).
- Created `docs/BUG_REPORT_SCHEMA.md`.
- Focus: functional. Targeted the recent shop/product/cart additions (commits f5cb8c4 → a3b1e87 → 4b1bd3c).
- Found 2 bugs: 1 P1 (product page desktop layout broken — grid has 3 children in 2 columns) and 1 P3 (shop.js cache version mismatch between shop.html and product.html).
