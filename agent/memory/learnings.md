# Telos Bug Hunter — Learnings

Accumulated knowledge across runs. Append-only by default. Keep under 2000 lines; compress oldest entries when over.

## Repo shape (as of 2026-06-25)

- Pure HTML/CSS/JS, no build step, deployed on Vercel.
- All serverless functions live in `api/` and use the Upstash Redis REST client (`api/lib/redis.js`).
- Two auth flows: admin (`telos_dash_session`, HMAC, 2-part token, SameSite=Strict) and client (`telos_client_session`, PBKDF2 + HMAC, 3-part token, SameSite=None;Partitioned).
- Two crons in `vercel.json`: `weekly-summary` (Mon 14:00 UTC) and `engagement-check` (daily 15:00 UTC). Both gate on `CRON_SECRET` and gracefully skip if `RESEND_API_KEY` missing.
- `cleanUrls: true` rewrites `.html` to clean URLs. Internal links with `.html` still functional but violate convention (CLAUDE.md known limitation).
- Service worker `sw.js` caches static assets under `telos-v1`; API requests are network-only.
- Quiz logic in `js/quiz.js` is shared by `index.html` (inline) and `pricing.html` (overlay-gated).

## Conventions to respect (not bugs)

- `Math.max(1, Math.min(5, parseInt(x) || 0))` in `daily-log.js` for sleep/energy/stress/mood is **intentional** — scale is 1-5 not 0-5.
- Charleston application `services` field is **intentionally optional** server-side (CLAUDE.md describes it as "multi-select", not required).
- `.html` extensions in internal `<a href>` are a known stylistic violation — do not re-flag.
- Tool pages missing `main.js` is in the known-limitations backlog.

## False-positive patterns to skip

- "Streak counter could be wrong if user crosses midnight in a timezone" — UTC date keying is consistent throughout the codebase.
- "Cron schedule uses UTC instead of ET" — Vercel crons are UTC by design. Only flag if the time is materially wrong, not the timezone notation.
- "5+ days could mean 6 days actually" — the `+` suffix is honest about lower bounds.

## Areas explored

- `api/submit-quiz.js`, `api/submit-email.js`, `api/submit-chs-application.js`
- `api/lib/auth.js`, `api/lib/client-auth.js`, `api/lib/redis.js`
- `api/cron/weekly-summary.js`, `api/cron/engagement-check.js`
- `api/client/daily-log.js`, `api/client/training-log.js`
- `api/dashboard/clients.js` (skim only)
- `js/quiz.js`, `js/shop.js`
- `sw.js`, `vercel.json`

## Areas NOT yet explored

- Most of `api/client/` (five-four-five, nutrition-log, supplements, food-search, push notifications, reset-password)
- Most of `api/dashboard/` (pipeline, revenue, content, adspend, analytics, modules, upload-video, client-portal)
- `client-dashboard.html` inline JS (~278KB — large)
- `thomas.html` inline JS (~161KB — large)
- Individual blog page integrity (23 articles)
- Visual layout / accessibility — first Visual/UX pass scheduled for tomorrow
- Performance — bundle size, image weight, render path
- Security — npm audit, secret scan, XSS surface

## First-run notes

- 2026-06-25 was the bootstrap run. `agent/` directory and `docs/BUG_REPORT_SCHEMA.md` did not exist; I created them.
- `decisions.jsonl` is empty — no approval/denial signal yet. Be conservative until feedback accumulates.
