# Bug Hunter Learnings

## Codebase orientation notes

- **Stack:** pure HTML/CSS/JS, no build step. Vercel serverless functions in `/api/**/*.js`. Upstash Redis for all persistence.
- **Auth model:** two separate cookie-based sessions.
  - Admin (`telos_dash_session`, SameSite=Strict, HMAC-signed token of `expiry`) — files under `api/dashboard/**`.
  - Client (`telos_client_session`, SameSite=None Partitioned, token = `{clientId}.{expiry}.{signature}`) — files under `api/client/**`.
- **Redis wrapper:** `api/lib/redis.js` provides `redis(command, ...args)` and `redisPipeline(commands)` via Upstash REST. No `MULTI/EXEC`, so multi-step updates aren't atomic.
- **Two long self-contained files** with inline CSS/JS: `thomas.html` (admin, ~3.2k lines), `client-dashboard.html` (~5.2k lines). Neither loads `main.js` or `style.css`.
- **CLAUDE.md P1-P3 backlog** — already known and should not be re-reported:
  - `main.js` missing on `protein-calculator.html`, `hyrox-predictor.html`
  - `.html` extensions in internal links throughout root + blog pages
  - `todayStr()` uses UTC (`toISOString().split('T')[0]`) in `client-dashboard.html` streak math — off-by-one on days for non-UTC timezones
  - SW cache version bump needed when static assets change
  - Whop iframe login broken on Safari/iOS (third-party cookie policy, not a code bug)

## Cron pattern to watch for

Both cron endpoints (`weekly-summary`, `engagement-check`) require `CRON_SECRET` and gracefully skip if `RESEND_API_KEY` isn't set. Neither has a per-client dedupe key. Daily/weekly senders that fire on a fixed cadence with a "state-driven if" instead of an "edge-triggered if" tend to spam. Check any future cron additions for the same pattern.

## Recurring code shapes worth double-checking

- `parseInt(x) || 0` / `parseFloat(x) || null` silently coerces `0` inputs to the fallback; check for legit-zero values (weight, water, steps) being dropped.
- Inline `onclick="..."` with string interpolation of Shopify IDs / image URLs — quote-injection is theoretically possible; low priority because Shopify content is trusted, but flag if a code path takes user input into an attribute.
- Event listeners attached inside a function that can be called multiple times (e.g. `setupLeadCapture`, `renderResults`) — accumulate on re-render if not cloned/removed. Cause of `BUG-2026-08-05-02`.
- `renderResults()` also has an issue: `getResultTier(score)` returns `undefined` if score is out of `minScore..maxScore` range. Because `resultTiers` array covers `0..40`, an inflated score from BUG-03 breaks `tier.name`.

## Known false-positive patterns (don't re-report)

- `Math.max(1, Math.min(5, ...))` clamps on daily-log integer fields — intentional, matches the 1-5 rating UI.
- Weekly-summary streak resets when today isn't logged yet — intentional streak definition.
- `client.name` interpolated unescaped into email HTML — admin-controlled input, low practical risk.

## Files inspected on 2026-08-05

- All `api/**/*.js` files
- `js/main.js`, `js/quiz.js`, `js/shop.js`
- Skimmed: `client-dashboard.html`, `thomas.html`, `chs.html`, root HTML pages
- Verified: all 23 blog articles from `resources.html` exist in `/blog/`

## Focus rotation

Focus cycles by day-of-year mod 4 (see `focus-rotation.json`):
- 0: Functional
- 1: Visual/UX
- 2: Performance
- 3: Security

## Meta

- First run of the Bug Hunter. `docs/BUG_REPORT_SCHEMA.md` was not present in the repo, so today's report uses an ad-hoc but consistent format (ID, severity, file:line, summary, repro, suggested fix). Recommend Thomas write a canonical schema doc before too many reports diverge.
- Hard rule respected: no application code modified. Only `agent/**` files written.
