# Telos Bug Hunter — Learnings

Running record of patterns, false-positive filters, and codebase areas explored.
Compress older entries into summaries once the file passes ~2000 lines.

---

## 2026-11-19 — First run (Security focus)

### Codebase map (what I explored)

- `api/lib/auth.js` — admin HMAC session cookie; single DASHBOARD_PASSWORD env var; 7-day sessions, SameSite=Strict, HttpOnly, Secure.
- `api/lib/client-auth.js` — PBKDF2-SHA512 (100k iters, 32-byte salt), timing-safe verify, client session cookie is SameSite=None + Partitioned (CHIPS).
- `api/lib/redis.js` — Upstash REST client, no deps.
- `api/client/*.js` — all client-portal endpoints use `verifyClientSession` and derive clientId from the session cookie, so user data endpoints (training-log, daily-log, nutrition-log, module-progress, 545, activity-log, supplement-log) are not vulnerable to IDOR via body/query manipulation.
- `api/dashboard/*.js` — all admin endpoints call `verifySession` from `api/lib/auth.js`.
- `api/cron/*.js` — require `Authorization: Bearer ${CRON_SECRET}` header; fail closed when CRON_SECRET missing.
- `api/submit-*.js` — public submission endpoints have IP-based rate limiting (quiz: 10/hr, email: inferred similar, chs: 5/hr).

### Patterns worth noting

- **Vercel Blob uploads are `access: 'public'`** (`api/dashboard/upload-video.js:30`). Knowing a blob URL = public viewing. So any endpoint that leaks a blob URL to an unauthorized viewer is a real access-control break, even if the URL looks random.
- **Admin-controlled content is interpolated with `esc()` on the client dashboard** (Resources `url`, side-menu `content`, etc.) — HTML-escape but not URL-scheme guard. An admin could set `url=javascript:…`, but it's self-targeted since admin controls both.
- **Food-search payload**: `name`, `brand`, `servingSize` are `esc()`-escaped at render; `calories/protein/carbs/fat` are `Math.round()` on the server, so numeric-only — no XSS surface from Open Food Facts community edits.
- **`verifyPassword` in `api/lib/auth.js` returns early on length mismatch** before `timingSafeEqual`. Technically leaks the admin password length via timing, but low practical risk unless the login endpoint is rate-limitable.

### False-positive filters (don't report these next time)

- `Access-Control-Allow-Origin: *` on `/api/submit-*` endpoints — intended, since forms must POST from any browser page; endpoints don't require credentials.
- `js/shop.js:15` Shopify Storefront token — this is a public client token by design; Shopify docs explicitly state these can live in client-side code.
- Non-escaped `c.id` in `thomas.html` select options — `c.id` comes from Redis `INCR`, always numeric.
- Service worker caching `/client-dashboard` — the file is a static shell; all authed data is fetched via API calls (which SW skips with network-only).

### Open hunches (worth returning to on future security days)

- CSRF: client cookie uses `SameSite=None; Partitioned`. In Chrome/Firefox, CHIPS protects. In Safari, `SameSite=None` cookies to third-party contexts are blocked, so legit iframe flow is broken (noted in CLAUDE.md), and attacker-page CSRF to telosathleticclub.com top-level still blocked by partitioning. Low practical risk, but revisit if any endpoint ever moves off cookie auth.
- **Content-Security-Policy / X-Frame-Options are not set in `vercel.json`.** No defense-in-depth against XSS or clickjacking. Low severity today because the attack surface is small and user-input routes are carefully `esc()`'d, but still a hardening gap.
- Push notification `endpoint` from `subscription` is `fetch()`ed directly without domain allowlisting (`api/client/notify.js:62`). If the subscription object were ever client-submittable in the future, this is an SSRF primitive. Today it's set by `push-subscribe.js` from a valid PushManager subscription, so safe — but note any future refactor.
- `api/client/reset-password.js` interpolates `client.name` into email HTML without escaping. Admin-controlled name only, so XSS risk = self-targeted admin → client. No action today but worth remembering.
