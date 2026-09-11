# Telos Bug Hunter — Learnings

Accumulated knowledge across runs. Kept under 2000 lines; older entries get compressed.

## Codebase orientation

- **Pure HTML/CSS/JS, no build step.** No `dist/`, no bundler — the source IS the deploy artifact. Bundle-size checks apply to the single-file HTML pages themselves (thomas.html ~161KB, client-dashboard.html ~278KB).
- **API is Vercel serverless functions** using CommonJS (`module.exports`). Redis is Upstash via REST client (`api/lib/redis.js`, no npm deps).
- **Two separate auth systems.** Admin uses `telos_dash_session` (HMAC, 2-part token) via `api/lib/auth.js`. Clients use `telos_client_session` (HMAC, 3-part token: `{clientId}.{expiry}.{sig}`) via `api/lib/client-auth.js`. `SameSite=None; Partitioned` on client cookie so it works inside the Whop iframe.
- **HTML string rendering is the norm** in `thomas.html` and `client-dashboard.html` — both build UI by concatenating strings and setting `innerHTML`. There is an `esc()` helper (`document.createTextNode` + read `innerHTML`) which escapes `<`, `>`, `&` but **NOT** `"` or `'`. Interpolating user data into `value="..."`, `onclick="..."`, or any attribute context is unsafe with `esc()` alone.
- **Pipeline lead & client IDs** are auto-incrementing integers from Redis `INCR`. Safe to embed in tokens/URLs without escaping issues.
- **Quiz submissions come from a public endpoint** (`api/submit-quiz.js`) — any string a public visitor types into name/email will end up rendered in the admin dashboard.

## Patterns that turned out to be real bugs

- **Rate limit keys that read `x-forwarded-for` before `x-real-ip`.** On Vercel, `x-forwarded-for` is client-appendable — trivially spoofable to bypass rate limits. Always use `x-real-ip` first (Vercel sets it to the actual client IP), or take the LAST comma-separated element of `x-forwarded-for`.
- **`JSON.stringify(JSON.stringify(obj))` inside an HTML attribute value** — produces literal `"` characters inside `onclick="..."`, which HTML parses as attribute terminators. Result: broken JS, `SyntaxError: Unexpected end of input`. Fix: HTML-encode the outer quotes (`&quot;`) or use `.addEventListener` after render.
- **User-enumeration via distinct error messages on login endpoints.** `api/client/login.js` returns different responses for "no such email", "portal disabled", "not active", "no password set", and "wrong password". `reset-password.js` correctly returns success unconditionally — login should be consistent with that.

## False-positive patterns to avoid

- The empty-password bypass on admin login is NOT a bug — `api/dashboard/login.js` guards with `!password` before calling `verifyPassword`. The `verifyPassword` function alone would return true on two empty strings if `DASHBOARD_PASSWORD` were unset, but the guard blocks that path.
- Client `innerHTML` on coach-authored side-menu custom panels (`item.content`) is intentional — the coach explicitly needs to embed HTML content. This is admin-controlled and not a real XSS vector.
- Streak calculation in `weekly-summary.js` breaking at the first missing day is likely intentional UX ("miss a day, restart") — not a bug unless product says otherwise.

## Areas explored this run

- `api/lib/auth.js`, `api/lib/client-auth.js` — admin & client auth
- `api/dashboard/login.js`, `api/client/login.js`, `api/client/reset-password.js`
- `api/submit-quiz.js`, `api/submit-email.js`, `api/submit-chs-application.js`
- `api/client/food-search.js`, `api/client/training-log.js`
- `api/cron/weekly-summary.js`
- `api/dashboard/upload-video.js`
- `thomas.html` (quiz submissions rendering, esc helper)
- `client-dashboard.html` (innerHTML usage survey)

## Not yet explored (for future runs)

- `js/main.js`, `js/quiz.js` — client-side scroll animations, quiz logic
- `sw.js` — service worker cache/notification handling
- `api/dashboard/pipeline.js`, `clients.js`, `client-portal.js` — CRUD for CRM data
- `api/dashboard/analytics.js` — Vercel Web Analytics proxy
- `api/cron/engagement-check.js` — daily reminder cron
- Blog pages (23 articles under `blog/`)
- `chs.html`, `pricing.html` — public marketing pages under a11y / mobile lens
