# Bug Hunter Learnings

Accumulated patterns, false-positive traps, and repo notes. Keep under 2000 lines.

---

## Repo shape (as of 2026-08-21)

- Vanilla HTML/CSS/JS, no build step. Two dashboards (`thomas.html`, `client-dashboard.html`) are massive self-contained files with inline `<style>` and `<script>` — they do NOT load `js/main.js` or `css/style.css`. Do not flag missing shared assets for them.
- Serverless functions in `api/**` are single-file exports. Auth patterns:
  - Admin: `verifySession(req)` from `api/lib/auth.js` (HMAC cookie).
  - Client: `verifyClientSession(req)` from `api/lib/client-auth.js` (HMAC cookie, 3-part token).
  - Cron: `req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET`.
- Data store is Upstash Redis via `api/lib/redis.js`. Every key is namespaced (`client:{id}`, `client_email:{email}`, `chs_application:{id}`, etc.).

## Known-issue backlog (do NOT re-flag)

Documented in `CLAUDE.md` under "Known Limitations" / "Bug crawl P1-P3 backlog":

1. Whop iframe on Safari/iOS blocks client-portal login cookies.
2. `.html` extensions in internal links across many pages (root + all `blog/` files).
3. Tool pages missing `main.js` inclusion.
4. `todayStr()` UTC-timezone bug for client-dashboard streaks.
5. Service worker cache name still `telos-v1` — bump when caching new assets.
6. Push notifications endpoint is a documented placeholder (no VAPID/AES128-GCM encryption).

If a finding overlaps one of the above, note it as already tracked and skip.

## Data-model quirks

- `client.tierAccess` on **modules** is an OBJECT in the admin write path (`{rebuild:bool, growth:bool, lifestyle:bool, lifestyle_plus:bool}`) but the client read path (`api/client/module.js`, `api/client/modules.js`) treats it as an ARRAY. This mismatch produces 500s — see 2026-08-21#F1.
- Client `tier` values are `'rebuild' | 'growth' | 'lifestyle' | 'lifestyle_plus'`. Prices: 1497 / 1997 / 2497 / 6997.
- `client_email:{normalizedEmail}` is a secondary index. Only `client-portal.js` and (partially) `clients.js` PUT keep it in sync. `clients.js` DELETE does NOT — see 2026-08-21#F2.
- Daily date keys are `YYYY-MM-DD` in UTC on server-generated writes; the client's local day may differ.

## Verification heuristics

- Before claiming a code-path is unreachable, grep the admin dashboard (`thomas.html`) for the field name — the admin UI often produces shapes the API doesn't expect.
- For "always returns X" bugs, trace both POST (write) and GET (read) code paths — the mismatch usually lives at the boundary.
- Rate-limit keys look like `ratelimit:{scope}:{ip}` — Vercel sets `x-forwarded-for` reliably; not currently spoofable from browser JS.

## False-positive traps

- Missing `.html` on internal links is already-known — skip.
- `main.js` being absent on tool pages is already-known — skip.
- CLAUDE.md flags many stylistic choices as intentional (no em dashes, gold-only accents, sharp 12px radius). Do NOT flag these.

## Explored so far

- All 22 files in `api/**` reviewed at least partially.
- `js/shop.js` (Shopify integration), `js/quiz.js` (lead capture), `js/main.js` (nav/scroll) reviewed.
- `product.html`, `shop.html`, `chs.html`, `index.html` nav/head/footer reviewed.
- `manifest.json`, `sw.js`, `vercel.json` reviewed.
- NOT deeply reviewed yet: 23 blog articles, full `thomas.html` (3174 lines) beyond module editor, full `client-dashboard.html` (5206 lines) beyond auth + training-log flow.
