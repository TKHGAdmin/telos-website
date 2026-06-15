# Telos Bug Hunter — Learnings

Accumulated knowledge from daily runs. Keep under 2000 lines.

## Known limitations (do not re-flag — see CLAUDE.md "Known Limitations")
- Whop iframe on Safari/iOS: third-party cookies blocked. Documented; mitigation is direct URL.
- Bug crawl P1-P3 backlog (April 2026, commit 7fa38ff):
  - Tool pages missing `main.js` (CLAUDE.md convention)
  - `.html` extensions still present in internal links across `shop.html`, `product.html`, `chs.html`, and all 23 `blog/*.html` pages
  - `todayStr()` UTC timezone bug in client dashboard streaks
  - SW cache version (`telos-v1`) needs bump when cached assets change

Do not re-report these unless they have meaningfully regressed.

## Codebase map highlights
- `api/lib/auth.js` — admin HMAC session cookies (`telos_dash_session`), 2-part token `{expires}.{sig}`. Signature comparison uses `!==` (not timing-safe) but secret is 64-char hex — practical risk is negligible.
- `api/lib/client-auth.js` — client sessions (`telos_client_session`), 3-part token `{clientId}.{expires}.{sig}`, PBKDF2 100k iterations SHA-512. Uses `timingSafeEqual`. Cookie is `SameSite=None; Partitioned` for Whop iframe.
- `api/dashboard/clients.js` — CRUD over the clients ZSET. POST checks `client_email:{normalized}` uniqueness; PUT cleans up old `client_email:` when changing email; DELETE does **not** clean it up (see 2026-06-15 P1-001).
- `api/dashboard/client-portal.js` — owns the `client_email:` lookup; sets on enable, deletes on disable.
- `api/submit-chs-application.js` — rate-limited 5/hr per IP. Validates required fields + email regex. Service whitelist matches the form values in `chs.html` (private/semi-private/mobile/event/corporate).
- `api/submit-quiz.js`, `api/submit-email.js` — rate-limited 10/hr per IP.
- `api/client/login.js` — **no rate limit**. Worth a deeper look on the Security focus day before flagging.
- `js/shop.js` — Shopify Buy SDK integration. `showEmpty()` targets shop-page IDs only; product-page failure mode (SDK unavailable) leaves the spinner up (see 2026-06-15 P3-002).
- Storefront token in `js/shop.js:15` is a Shopify Storefront API token — it is designed to be public-facing. Not a leak.

## Patterns to watch
- Redis keys named `client_*:{id}` are sprinkled across many endpoints (training, nutrition, 545, mindset, resources, supplements, activity, daily logs, modules, push subs). Anything that deletes a client should consider the orphaned cascade.
- Cron endpoints (`api/cron/*`) guard with `Bearer ${CRON_SECRET}` and gracefully skip when `RESEND_API_KEY` is missing — good pattern.
- Email HTML in cron + reset-password concatenates `client.name` without escaping. Source is the admin (trusted), so XSS is theoretical, but if client-self-edit ships later this becomes real.

## False-positive patterns (do not report)
- `.html` extensions in internal links — already in the documented backlog.
- Shopify storefront token in client JS — public by design.
- HMAC signature `!==` comparison in `api/lib/auth.js` — secret is 64-char hex; practical timing extraction is not feasible.
- "Could be cleaner" / style preferences.

## Run history
- 2026-06-15: First run. Focus = Functional. 2 findings (P1 client-delete email orphan, P3 product page SDK-failure hang).
