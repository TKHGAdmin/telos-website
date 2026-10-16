# Telos Bug Hunter — Accumulated Learnings

Running journal of patterns, false-positives, and codebase geography. Keep under 2000 lines.

## Codebase geography

- `/api/` — Vercel serverless functions. Split into `dashboard/` (admin-authed), `client/` (client-authed), `cron/` (CRON_SECRET-authed), and public `submit-*.js` endpoints at the top level.
- `/api/lib/auth.js` — admin HMAC session cookies (`telos_dash_session`, 2-part token).
- `/api/lib/client-auth.js` — client PBKDF2 passwords + HMAC session cookies (`telos_client_session`, 3-part token).
- `/api/lib/redis.js` — Upstash Redis REST client.
- `thomas.html` — admin dashboard (self-contained, inline CSS/JS). All DOM writes use the local `esc()` helper (DOM-encode via createTextNode) — stray `innerHTML` concatenations without `esc()` are red flags.
- `client-dashboard.html` — client PWA (self-contained).
- `.gitignore` is small (18 lines) — `.env*` files not tracked, no local secret spillover found in history.

## Known patterns

### 2026-10-16 — First run patterns (Focus: Security)

- **Rate-limit keys using raw `x-forwarded-for`** — the three public submit endpoints build their rate-limit bucket keys from `req.headers['x-forwarded-for']`, which on Vercel includes any attacker-prepended values. Expect this pattern to repeat; grep `ratelimit:` on any new endpoint before trusting it.
- **Admin login has zero rate limiting / lockout** — `api/dashboard/login.js` is a pure password check with no attempt counter. Any new admin-only route added later should either compose with a rate-limit helper or be audited manually.
- **`JSON.stringify(JSON.stringify(obj))` is NOT HTML-attribute safe** — the double-stringify trick escapes quotes for the JS parser but produces literal `\"` in the HTML, which still terminates HTML attributes. Flag any `onclick="handler(' + JSON.stringify(JSON.stringify(x)) + ')"` where `x` contains attacker-controlled strings — this is XSS, not a style issue.
- **`esc()` helper is sound** — uses `createTextNode`, so values rendered via `esc(x)` are safe. Issues appear where values skip `esc()`, especially inside inline event handler attributes.
- **Admin HMAC comparison uses `!==`** (`api/lib/auth.js:27`), while `api/lib/client-auth.js:49` uses `timingSafeEqual`. Watch for the admin side quietly diverging from the stronger client-auth patterns.

## False-positive patterns to avoid

- *(none yet — build this list from denials in `decisions.jsonl`)*

## Scope reminders

- Scope is the Telos Fitness web platform only (this repo).
- Never modify application code — read-only hunt, write only to `agent/memory/` and `agent/reports/`.
- A clean day is a valid report. Volume ≠ value.
