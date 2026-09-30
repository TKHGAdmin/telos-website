# Telos Bug Hunter — Learnings

Accumulated knowledge across runs. Newest at top. Compress older sections when file exceeds 2000 lines.

---

## 2026-09-30 · First run

### Repo shape (as of today)
- Pure static site (HTML/CSS/JS) + Vercel serverless functions under `api/`.
- Root pages: `index.html`, `pricing.html`, `chs.html`, `protein-calculator.html`, `hyrox-predictor.html`, `resources.html`, `shop.html`, `product.html`, `thomas.html` (admin), `client-dashboard.html` (client PWA), plus `blog/` (23 posts).
- Shared JS: `js/main.js` (nav/scroll), `js/quiz.js` (quiz), `js/shop.js` (Shopify Buy SDK integration for shop + product pages).
- CSS is versioned via `?v=16`; `main.js` via `?v=2`.
- `CLAUDE.md` documents a stale P1-P3 backlog from an April 2026 crawl. Cross-reference before flagging: tool pages missing `main.js`, `.html` in internal links, `todayStr()` UTC timezone bug in client dashboard streaks, SW cache version bump needed. Do **not** re-report these unless a fresh regression appears.

### Patterns worth remembering
- **Grid layouts and JS-populated wrappers.** When a container uses `grid-template-columns`, any new HTML sibling becomes an extra grid item and shifts everything after it. `product.html` broke this way in commit `f5cb8c4`. Whenever a feature adds a new sibling under a `.product-detail`-style grid, verify the child count matches the grid track count, or wrap the new element inside an existing column.
- **Shopify Storefront tokens are public by design.** `js/shop.js:15` exposes the storefront access token in client JS. This is not a security bug — Storefront tokens are meant to be embedded in client code and are rate-limited/scoped by Shopify. Do **not** file this as a leak.
- **`x-forwarded-for` rate limiting in `api/submit-chs-application.js`.** The header can be spoofed, and multi-hop values become one giant key. Common tradeoff for lightweight rate limiting; skip unless abuse is actually observed or the endpoint gets hardened elsewhere.
- **Versioned asset paths must move together.** If `shop.js` gets bumped on one page but not another (currently `?v=1` on `shop.html`, `?v=2` on `product.html`), only the bumped page busts cache. Watch for divergence.
- **Two auth systems.** Admin (`telos_dash_session`, `SameSite=Strict`) and client (`telos_client_session`, `SameSite=None; Partitioned`, 3-part token). Do not confuse the two; each has its own cookie, verifier, and endpoints.

### False-positive traps to avoid
- Flagging the Storefront access token as a leaked secret.
- Flagging `.html` extensions in internal links — the April 2026 backlog already tracks this.
- Flagging tool pages missing `main.js` — same backlog.
- Flagging empty `checkoutUrl` failing silently on `goToCheckout()` — cosmetic UX, not a functional break; only real if it becomes observable to users.

### Focus rotation
- Day 0 (today): Functional. Found one P1 in the newest feature commit (product page image gallery). Good sign that hunting recent diffs pays off.
- Tomorrow (Day 1): Visual / UX. Suggested starting points: responsiveness at 375px on `product.html` (given today's layout bug lives there), contrast ratios of gold text on dark backgrounds, missing `alt` text on Shopify-fetched images if any lack titles, and dropdown accessibility on the "Tools" nav.

### Open questions to revisit
- Is there a `docs/BUG_REPORT_SCHEMA.md` or `run.py` that the operator plans to add? Both are referenced in the agent system prompt but do not exist in the repo. Not blocking — reports use a sensible self-consistent Markdown schema for now.
