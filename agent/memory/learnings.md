# Telos Bug Hunter — Learnings

Rolling notebook of patterns, codebase conventions, and false-positive categories the agent has observed. Keep under 2000 lines; compress older entries into the "Historical summary" section when needed.

---

## Codebase conventions (Telos Fitness website)

- **No framework / no build step.** Pure HTML/CSS/JS with Vercel serverless functions.
- **Admin dashboard (`/thomas`) and client dashboard (`/client-dashboard`) are self-contained** — they do not load `main.js` or `style.css`. All CSS/JS is inline.
- **Public marketing pages load `js/main.js`** for nav/hamburger/scroll. Tool pages (protein-calculator, hyrox-predictor) have page-local scripts but should not duplicate hamburger handlers.
- **CSS cache-bust pattern:** `style.css?v=N`. Bump `N` on all pages when editing shared CSS.
- **Known footgun:** FAB button on client dashboard has CSS `display: none` by default. JS must set `display:'block'`, not `''`, to show it (`''` leaves it hidden).
- **CLAUDE.md documents a known P1-P3 backlog:** tool pages missing main.js, `.html` extensions in internal links, `todayStr()` UTC timezone bug in client dashboard streaks, SW cache version bump pending. **Do not re-flag these** unless they appear in a NEW location.

## Known false-positive categories (do not report)

(none yet — populate from denials as they come in)

## Patterns observed

- **Rate limiting is inconsistent.** Public submission endpoints (`/api/submit-quiz`, `/api/submit-email`, `/api/submit-chs-application`) have per-IP hourly rate limits via Redis INCR. But sensitive auth endpoints (`/api/client/login`, `/api/dashboard/login`, `/api/client/reset-password`) have no rate limiting at all — vulnerable to credential stuffing / password reset email spam.
- **IP identity derived from `x-forwarded-for` without parsing.** All rate-limit keys use the raw header value, which can be a comma-separated list; a client that injects a leading IP shifts to a new bucket. Likely acceptable for now but worth flagging if it becomes exploitable.
- **No native form validation on buttons with `type="button"`.** The quiz lead-capture form has `required` inputs but a `type="button"` submit, so HTML5 validation never fires. The JS handler must then validate explicitly.
- **Email-to-client-id lookup (`client_email:*`) is only written in two places**: when the portal is enabled (`client-portal.js`) and when an email changes while the portal is already enabled (`clients.js` PUT). The `clients.js` POST creates a client but never writes the lookup, so uniqueness is enforced via a lookup query that may not yet exist.
- **Cron handlers send emails inside a `for` loop with no rate limiting or backoff**, and no "last sent" tracking. The engagement-check cron will re-send daily to inactive clients.

## Areas explored

- `api/submit-quiz.js`, `api/submit-email.js`, `api/submit-chs-application.js`
- `api/lib/auth.js`, `api/lib/client-auth.js`
- `api/client/login.js`, `api/client/reset-password.js`, `api/client/daily-log.js`, `api/client/training-log.js`, `api/client/nutrition-log.js`, `api/client/modules.js`, `api/client/food-search.js`
- `api/dashboard/clients.js`, `api/dashboard/client-portal.js`
- `api/cron/engagement-check.js`, `api/cron/weekly-summary.js`
- `js/quiz.js`, `js/main.js`
- `index.html` (quiz section), `pricing.html` (gate), `chs.html` (application form), `protein-calculator.html`, `hyrox-predictor.html`
- `vercel.json` (cron schedule)
- `client-dashboard.html` (FAB handling)

## Historical summary

(none yet)
