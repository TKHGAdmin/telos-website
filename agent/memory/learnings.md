# Telos Bug Hunter - Learnings

Accumulated knowledge across daily runs. Kept under 2000 lines; older entries get compressed as needed.

---

## 2026-09-08 (Run 1, Functional focus, bootstrap run)

### Codebase map (first pass)
- **Pure HTML/CSS/JS** - no build step. Server-side is Vercel serverless functions in `api/`.
- **Two dashboards** (`thomas.html`, `client-dashboard.html`) are self-contained: they don't load shared `style.css` or `main.js`.
- **New pages not yet in CLAUDE.md** (as of run 1): `shop.html`, `product.html`, `js/shop.js`. All Shopify Buy SDK-driven; storefront token is embedded client-side (public by design, OK).
- **Auth split**: admin cookie `telos_dash_session` (SameSite=Strict, 2-part token) vs client cookie `telos_client_session` (SameSite=None; Partitioned, 3-part token). Client uses `timingSafeEqual`, admin uses raw `!==` for HMAC comparison.
- **Redis via Upstash REST**: no npm client. All key patterns documented in CLAUDE.md.
- **Timezone**: server-side date math throughout uses `new Date().toISOString().split('T')[0]` (UTC). CLAUDE.md flags a client-side `todayStr()` UTC bug in client-dashboard as a known limitation - defer to that.

### Patterns worth flagging
- Client deletion in `api/dashboard/clients.js` DELETE handler removes only `client:{id}` and `clients_index`. It does NOT clean up:
  - `client_email:{normalizedEmail}` (blocks re-adding same email)
  - Any of the daily log keys or coach-set plan keys (orphaned data)
- Layout regressions from recent shop refactor: image-gallery commit `f5cb8c4` added a third child to `.product-detail` grid without updating the 2-column template.
- `?v=` cache-buster query strings drift between related files (e.g., `shop.js?v=1` on shop.html vs `?v=2` on product.html). No current user impact because file content is currently identical, but a future edit to `shop.js` bumping only one page would leave the other stale. Track as a discipline note, not a bug.

### False-positive patterns to avoid (self-derived)
- Shopify Storefront tokens are meant to be public - not a security bug when found in client JS.
- The `x-forwarded-for` rate-limit-key pattern used across submit-* endpoints is imperfect (proxies, comma-lists) but standard - not worth reporting unless abuse is observed.
- Admin HMAC signature check in `api/lib/auth.js:27` uses `!==` (not timing-safe). In practice the attack surface for timing an HMAC-SHA256 hex output is not exploitable in a serverless environment - flag only if a security-focused day surfaces stronger arguments.
- Cron endpoints and `submit-*` endpoints treat empty results / missing env vars as graceful skip rather than errors - intentional, not a bug.

### Areas to explore next runs
- Visual/UX (day 1): scan blog articles for consistency, check mobile breakpoints on new shop/product pages, audit contrast on new CTA colors.
- Performance (day 2): client-dashboard.html is 278KB inline - measure impact, look at image weights in `/images/`.
- Security (day 3): admin HMAC comparison (see above), CSP headers, secret scanning of git history, XSS in Shopify description HTML pass-through.

### Areas already covered
- All `api/` endpoints skimmed for req.method handling, auth guards, input validation.
- `js/shop.js` end-to-end trace (cart flow, image gallery, product detail).
- `product.html` + `shop.html` DOM structure vs CSS grid layout.
- Recent 7 commits' diffs reviewed.
