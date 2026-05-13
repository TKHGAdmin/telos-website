# Telos Bug Hunter — Learnings

This file accumulates patterns the agent has noticed and false-positive patterns to avoid. Keep under 2000 lines; compress older entries when needed.

## Codebase shape (initial orientation — 2026-05-13)

- Pure HTML/CSS/JS, no build step. Hosted on Vercel (static + serverless).
- Two self-contained dashboards (thomas.html, client-dashboard.html) have inline CSS/JS and do NOT load `js/main.js` or `css/style.css`.
- All public pages share `css/style.css?v=16` and `js/main.js`.
- API is in `/api/` as Vercel serverless functions, with `/api/lib/` providing auth + Redis helpers.
- Two auth systems with distinct cookies: admin (`telos_dash_session`, SameSite=Strict) and client (`telos_client_session`, SameSite=None; Partitioned for Whop iframe).

## Known-intentional patterns (do NOT report as bugs)

- **No build step / pure HTML** — intentional. Don't flag missing webpack/vite.
- **`?v=N` cache-busting on stylesheet** — intentional. Bumping is required, but presence is fine.
- **Em dashes absent** — intentional house style. Don't flag missing en/em dashes.
- **Body class `page-load-anim` only on index.html** — intentional; opt-in fade-in.
- **Tool pages have inline `<script>`** — intentional, but they MUST also load `js/main.js` for shared nav.
- **`SameSite=None; Partitioned` on client cookie** — intentional for Whop iframe embedding.
- **Whop iframe on Safari/iOS does not work** — known limitation, documented.
- **Inline `<style>` blocks on chs.html, pricing.html, dashboards** — intentional scoping.

## False-positive patterns to avoid

(Populate as denials come in via `decisions.jsonl`.)

## Open backlog (per CLAUDE.md, April 2026 bug crawl)

- Some tool pages may be missing `main.js` (verify before flagging)
- Some internal links may still carry `.html` extensions
- `todayStr()` UTC timezone bug in client dashboard streaks
- SW cache version bump may be needed

## Verified-but-not-reported (already in known backlog)

- `protein-calculator.html` and `hyrox-predictor.html` do NOT load `js/main.js` — confirmed by `grep -l 'main.js'`. Already in backlog.
- 5 pages (`hyrox-predictor`, `resources`, `chs`, `pricing`, `protein-calculator`) carry 28 internal `.html` hrefs. Already in backlog.

## Patterns noticed (2026-05-13, Functional run)

- **Event-listener leak pattern**: Several flows re-bind `addEventListener` on every state transition (quiz lead capture, retake button) without removing prior listeners or guarding with a "bound" flag. Worth checking other reset/replay flows (training reset, daily-log reset, food-search modal reopens) on future runs.
- **Cascade-delete gap**: Admin DELETE handlers in `clients.js` only remove the primary record + index entry. Per-client data (logs, plans, supplements, push subs, email lookup) is never cleaned. Similar pattern likely in other delete handlers — worth a future sweep.
- **Cron throttling absent**: Both crons (`engagement-check`, `weekly-summary`) lack any "last-sent" guard. If new crons are added, look for the same pattern.
- **Email error-message detail leakage** in `api/client/login.js` (portal-not-enabled / account-not-active / password-not-set) — defer to Security focus.
- **No rate limiting on `/api/client/login`** — defer to Security focus.

## Codebase areas explored (2026-05-13)

- `api/lib/auth.js`, `api/lib/client-auth.js`
- `api/dashboard/login.js`, `clients.js`, `client-portal.js`, `chs-applications.js`
- `api/submit-quiz.js`, `submit-email.js`, `submit-chs-application.js`
- `api/client/login.js`
- `api/cron/engagement-check.js`, `weekly-summary.js`
- `js/quiz.js`, `js/main.js`
- `protein-calculator.html`, `hyrox-predictor.html` (scripts + nav only)

## Areas NOT yet explored

- Client-dashboard inline JS (`client-dashboard.html` is ~278KB — needs careful targeted reads, not full read)
- `thomas.html` inline JS (~161KB)
- Blog templates (23 articles)
- Push notification flow (`sw.js`, `push-subscribe.js`, `push-unsubscribe.js`, `notify.js`)
- Module / video upload flow (`upload-video.js`, `modules.js`)
- Food-search proxy (`food-search.js`) — Open Food Facts edge cases
- Password reset flow (`reset-password.js`)

