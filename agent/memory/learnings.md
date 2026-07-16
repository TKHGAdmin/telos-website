# Bug Hunter — Learnings

Accumulated knowledge that survives across runs. Keep entries dated. Compress when this file exceeds 2000 lines.

---

## 2026-07-16 (first run, focus: Functional)

### Areas of the codebase explored
- `js/shop.js` (Shopify Buy SDK integration, cart drawer, product cards)
- `product.html`, `shop.html` (DOM ids referenced by shop.js)
- `api/dashboard/clients.js` (client CRUD)
- `api/dashboard/client-portal.js` (portal enable/disable, email index maintenance)
- Recent commits since `b9b065a` — mostly the shop/product feature (shop.html, product.html, js/shop.js) plus Client Login nav-link additions.

### Patterns worth remembering
- **`escapeHtml()` on `js/shop.js:509` uses DOM text-node serialization** — only escapes `&`, `<`, `>`. Not safe for attribute contexts (`"`, `'`). Any *new* code that pipes untrusted strings into `alt="..."`, `title="..."`, `onclick="..."` via this helper is a bug candidate.
- **The email login index (`client_email:{normalizedEmail}`) has a split ownership problem**: it's set/cleared only in `client-portal.js`, but the client lifecycle (create/delete) lives in `clients.js`. Any lifecycle op in `clients.js` that touches an email-adjacent field is worth checking against the index.
- **Redis client-scoped keys**: `client_dailylog:*`, `client_nutrition_log:*`, `client_training_log:*`, `client_supplement_log:*`, `client_activity_log:*`, `client_545_*`, `client_supplement_plan:*`, `client_nutrition_plan:*`, `client_mindset:*`, `client_resources:*`, `client_sidemenu:*`, `client_training_program:*`. **None** are cleaned up when a client is deleted — orphan data accumulates. Not currently harmful but worth revisiting when I have signal.

### False-positive patterns to avoid
- **`.html` extensions in internal `href`s**: covered by CLAUDE.md's "Known Limitations" — do NOT re-report. The April 2026 crawl already catalogued this.
- **Whop iframe on Safari/iOS**: known, do NOT re-report.
- **Products with 0 variants crash `product.variants[0]`**: theoretically possible but Shopify's fetchByHandle rarely returns unpublished products. Deferring unless I see a concrete report.
- **Admin endpoints returning `passwordHash`/`passwordSalt`**: single-admin site, PBKDF2 is one-way. Below the P0-P2 precision bar for a first-run report. Reconsider if approval rate is high.

### Codebase conventions to internalize
- Pages are self-contained HTML (no build step). Client dashboard and thomas dashboard have all CSS/JS inline; they do NOT load `main.js` or `style.css`.
- Every marketing page loads `main.js` for nav/hamburger — never duplicate hamburger handlers on tool pages.
- CSS cache-busting: `?v=N` on stylesheet — bump when style.css changes.
- Cronable endpoints under `api/cron/` require `CRON_SECRET`.
- All admin endpoints under `api/dashboard/` gate on `verifySession(req)`; all `api/client/` endpoints gate on a client session cookie.

### Recent commit heat map (as of 2026-07-16)
- `js/shop.js`, `shop.html`, `product.html` — brand new (last ~8 commits). Highest bug probability this week.
- `pricing.html`, `resources.html`, `index.html`, `hyrox-predictor.html`, `protein-calculator.html`, all `blog/*.html` — recent nav-link additions ("Client Login"). Low-risk drive-by edits.
- Client dashboard (`client-dashboard.html`) — stable since `510992e` (major rebuild).
