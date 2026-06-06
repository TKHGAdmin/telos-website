# Bug Hunter Learnings

Accumulated knowledge from past runs. Compress entries older than ~90 days when this file approaches 2000 lines.

---

## Codebase orientation

- Pure HTML/CSS/JS, no build step. Vercel hosts static pages plus serverless functions under `/api`.
- Two auth contexts: admin (`telos_dash_session`, single password, `lib/auth.js`) and client (`telos_client_session`, per-client PBKDF2, `lib/client-auth.js`).
- Redis is the only persistence layer (Upstash REST client in `lib/redis.js`). All keys are documented in `CLAUDE.md`.
- Quiz logic in `js/quiz.js` runs on both `index.html` and `pricing.html` (overlay on pricing). Same instance, context-detected via `.quiz-overlay` element.
- Shop pages (`shop.html`, `product.html`, `js/shop.js`) use Shopify Storefront SDK. The token in `js/shop.js` is a Storefront token (intentionally public, not Admin).
- Cron jobs require `CRON_SECRET` and `RESEND_API_KEY`; both fail closed if not set.

## Areas explored

- 2026-06-06: `api/lib/*`, `api/submit-*.js`, `api/cron/*.js`, `api/dashboard/clients.js`, `api/dashboard/emails.js`, `api/dashboard/login.js`, `api/client/login.js`, `api/client/daily-log.js`, `api/client/reset-password.js`, `js/quiz.js`, `js/main.js`, `js/shop.js`, `vercel.json`.

## Patterns to watch for

- **Listener accumulation on reusable DOM**: any handler attached inside a function that can run more than once (e.g. quiz `setupLeadCapture`, results' retake button) accumulates listeners across runs. Search for `addEventListener` inside `function setup*`, `function render*`, or any function called repeatedly.
- **Cron jobs without throttle state**: any cron that triggers user-visible side effects (email/push) needs a per-user cooldown key in Redis. Otherwise daily reruns spam users.
- **IP rate limiting based on `x-forwarded-for`**: Vercel sets this as a comma-separated list. Raw use of the header for rate-limit keys partially works but a single IP behind multiple proxy hops can land in different buckets. Low impact, worth noting if you see drift.
- **CLAUDE.md known-backlog items**: `.html` extensions in internal links, tool pages missing `main.js`, `todayStr()` UTC timezone bug in client dashboard streaks, SW cache version bump. These are already tracked - do NOT re-report.

## False-positive patterns (avoid reporting)

- Account enumeration messaging on the client login endpoint is partially mitigated by the password reset endpoint (which always returns `ok: true`). The login enumeration is a known security tradeoff for usability on a small B2B client roster. Not a fresh finding.
- `verifyToken` in `api/lib/auth.js` uses `!==` rather than `timingSafeEqual` on the HMAC signature. Defense-in-depth issue, but with a server-side SECRET the timing attack surface is very thin. Don't re-flag unless something else makes it exploitable.
- Storefront token in `js/shop.js` is intentionally public (Shopify Storefront API, scoped read+checkout). Not a leaked secret.

## Schema reminders

- Front matter counts MUST match section counts. The parser rejects mismatches.
- Bug heading: `## Bug N — Title` with em-dash-looking character is actually a hyphen. CLAUDE.md mandates no em dashes anywhere.
