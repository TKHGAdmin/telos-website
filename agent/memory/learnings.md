# Telos Bug Hunter - Learnings

> Accumulated knowledge across runs. Kept under 2000 lines; compress older entries into summaries when the file grows.

## Codebase map (first-pass notes)

- **No build step.** Pure HTML/CSS/JS. Serverless functions in `api/` run on Vercel. Data in Upstash Redis via `api/lib/redis.js`.
- **Two auth systems:**
  - `api/lib/auth.js` — admin (`/thomas`), HMAC-signed cookie `telos_dash_session`. Uses `crypto.timingSafeEqual` for password, but **plain `!==`** for HMAC signature compare (line 27).
  - `api/lib/client-auth.js` — client portal (`/client-dashboard`), PBKDF2 passwords + HMAC cookie `telos_client_session`. Uses `crypto.timingSafeEqual` for both password and signature.
- **Public submission endpoints** (`api/submit-*.js`) rely on IP rate-limit via Redis INCR+EXPIRE. IP is read as a raw `x-forwarded-for` header without taking the first hop — on Vercel this is usually fine, but it means multi-hop `x-forwarded-for: fake,real` values become part of the rate-limit key.
- **Date handling is UTC everywhere.** `client-dashboard.html#todayStr()` uses `new Date().toISOString().split('T')[0]`. The engagement-check cron and `daily-log.js` range query do the same. That makes them internally consistent, but the client-side can still show a user in US time zones the "wrong" day near midnight (acknowledged in CLAUDE.md known limitations).
- **Quiz submission flow:** `js/quiz.js` captures name/email/phone via a `type="button"` click handler, so native HTML5 `required` / `type="email"` validation never runs. Server-side (`api/submit-quiz.js`) only checks `!email || !name`, no format regex. By contrast, `api/submit-chs-application.js` does run a regex check and `api/submit-email.js` does an `email.includes('@')` check.
- **Shopify Storefront token is exposed in `js/shop.js`.** This is by design — Storefront API tokens are public. Not a secret.
- **Supabase anon key is exposed in `set-password.html`.** Also by design — anon keys are public.
- **Client IDs are numeric** (`INCR id:clients`), so the `{clientId}.{expiry}.{signature}` cookie token split('.')==3 is safe. Don't flag that as a parser hazard.

## False-positive patterns to avoid

1. **Public API keys exposed in client JS** — Shopify Storefront, Supabase anon, VAPID public. These are intentionally public. Only flag private keys (service_role, admin API tokens, webhook secrets, `*_SECRET`, DB connection strings).
2. **UTC date usage** — already acknowledged in CLAUDE.md. Don't re-report unless there's a concrete data-loss case.
3. **`.html` extensions in internal links** — tracked P1 in the prior bug crawl (commit 7fa38ff). Don't re-flag without a reason.
4. **Tool pages missing main.js** — tracked P1 in prior bug crawl.
5. **SW cache version `telos-v1`** — tracked P1 in prior bug crawl.
6. **Hardcoded `querySelector(8)` in quiz progress** — the quiz only has 8 questions; this is intentional.

## Open items to investigate next

- **Visual/UX day (next, day 1):** Review responsive breakpoints on `pricing.html` quiz overlay, `chs.html` application form, and `client-dashboard.html` modals at 320px width. Check color contrast on muted text (`#505058`, `#8a8a94`) against `#060608` for WCAG AA.
- **Performance day (day 2):** `index.html` is 56KB, `thomas.html` is 161KB, `client-dashboard.html` is 278KB. Admin/client dashboards are inlined on purpose and only load for logged-in users, so they are not a public-page concern. But check `index.html` and blog posts for unoptimized images in `images/` and render-blocking Google Fonts without `font-display: swap`.
- **Security day (day 3):**
  - `api/lib/auth.js` line 27: non-constant-time signature compare (`signature !== expected`). Not practically exploitable (64-hex HMAC + network jitter) but inconsistent with `client-auth.js`. Low-priority consistency finding.
  - `x-forwarded-for` used directly as rate-limit key across `submit-*.js` and `submit-chs-application.js` — spoofable in principle on platforms that do not strip the header; benign on Vercel but worth noting.
  - `api/submit-email.js` only validates `email.includes('@')` — same shape as the quiz issue, worth a consolidated note.

## Run history

- **2026-11-06** — First run. Bootstrapped `agent/` scaffolding. Focus: functional. Reported 1 P2 (quiz endpoint accepts malformed emails).
