# Telos Bug Hunter — Learnings

This file accumulates the agent's institutional memory across runs. Keep entries short and factual. Compress older material into summaries once this file exceeds 2000 lines.

## Codebase shape (confirmed on first run, 2026-10-08)
- Pure HTML/CSS/JS, no build step. Vercel-hosted. Serverless functions in `/api`.
- Admin dashboard `/thomas` and client dashboard `/client-dashboard` are self-contained single HTML files with inline CSS/JS — they do NOT load `js/main.js` or `css/style.css`.
- Public marketing pages (`index.html`, `pricing.html`, `chs.html`, tool pages, blog) load the shared `js/main.js` for nav/hamburger/scroll animations.
- Redis-backed via Upstash REST, no npm deps for the client (see `api/lib/redis.js`).
- Auth: HMAC-signed session cookies (`api/lib/auth.js` for admin, `api/lib/client-auth.js` for clients).
- Clean URLs via `vercel.json` → internal links must omit `.html`.

## Known-intentional patterns (do NOT report as bugs)
- Inline `<style>` and inline `<script>` blocks on dashboard pages — self-contained by design.
- Tool pages carry their own inline scripts for page-specific logic; the hamburger/nav handlers live in main.js only.
- Pricing page uses a localStorage gate (`telosQuizCompleted`) before revealing prices.
- `?v=16` cache-busting query param on `css/style.css` across all pages.
- Charleston (`chs.html`) uses `.chs-page` body class to scope its hotel-aesthetic overrides.

## False-positive patterns to avoid
- (none yet — populated from decisions.jsonl denials over time)

## Open watchlist (from CLAUDE.md "Known Limitations" and recent commits)
- Whop iframe cookies fail on Safari/iOS — documented limitation, do not re-flag.
- CLAUDE.md references a backlog of P1-P3 items in commit 7fa38ff. Confirm each is still present before flagging as new.

## Patterns noticed (2026-10-08)
- Form submit handlers across the codebase access inputs as `form.<name>` (named-element getter). The Charleston form hit a landmine with `form.name` because `name` is a defined IDL attribute on `HTMLFormElement` and shadows the named getter. **Watchlist of collision names**: `name`, `action`, `method`, `target`, `enctype`, `elements`, `length`, `autocomplete`, `noValidate`, `acceptCharset`, `rel`, `relList`. Any time a form input is named one of these, the `form.<x>` pattern silently fails — grep next time.
- Admin DELETE handlers (`clients.js`, `pipeline.js`, `chs-applications.js`) do not clean up derived index keys. The `client_email:` orphan is a confirmed bug; the pipeline and CHS DELETEs don't have the same hazard (no derived lookup keys there).
- Scheduled Resend-based emails (`weekly-summary`, `engagement-check`) have no per-client send-receipt or cooldown field. If anyone adds a new scheduled email, remember to add dedup state too.

## New areas explored (2026-10-08)
- `api/lib/auth.js` and `api/lib/client-auth.js` — admin and client session cookie plumbing. Admin's `verifyToken` uses `!==` for signature compare (not timing-safe) but the HMAC-SHA256 signature space makes a timing attack impractical in Vercel's edge; filing is marginal, left for a future security rotation to weigh.
- `api/cron/*` — both crons require `CRON_SECRET` and fail-closed if `RESEND_API_KEY` is missing.
- `js/shop.js` — Shopify Storefront token in client is intended (public token by design), not a secret leak.
