# Bug Hunter Learnings

This file accumulates patterns the agent has noticed, false-positive guidance, and notes on which areas of the codebase have been explored. Keep under 2000 lines.

---

## Stack-specific notes

- **No framework, no build step.** Pure HTML/CSS/JS + Vercel serverless. Don't suggest webpack/vite/typescript fixes — none apply.
- **No npm tests defined.** `package.json` is essentially empty. Don't run `npm test`.
- **Two auth systems coexist:** admin (`telos_dash_session`, lib/auth.js, 2-part token) and client (`telos_client_session`, lib/client-auth.js, 3-part token with PBKDF2). Don't conflate them.
- **All client portal endpoints use `requireClient()` from `lib/client-auth.js`.** Missing it = unauthenticated access bug.
- **All admin dashboard endpoints use `verifySession()` from `lib/auth.js`.** Same gate rule.
- **Public endpoints** (no auth): `submit-quiz.js`, `submit-email.js`, `submit-chs-application.js`. These should rate-limit.

## False-positive patterns to avoid

(populated as denials accumulate)

- _none yet_

## Areas explored

- `2026-05-04` (Functional) — api/lib/auth.js, api/lib/client-auth.js, api/submit-quiz.js, api/submit-email.js, api/submit-chs-application.js, api/client/login.js, api/client/food-search.js, api/client/training-log.js, api/client/reset-password.js, api/cron/weekly-summary.js, api/cron/engagement-check.js, js/quiz.js, sw.js, client-dashboard.html (skim).

## Patterns noticed

- **Listener leak pattern**: Several JS code paths re-attach `addEventListener` inside functions that re-run (e.g. `setupLeadCapture` in quiz.js). Worth a focused sweep next Functional day across `client-dashboard.html` and `thomas.html` for the same pattern.
- **Date-window-of-one bug pattern**: Streak / "today" logic in `api/cron/weekly-summary.js` and `client-dashboard.html` both struggle with the gap between cron run time, user's local time, and when the user actually logs. Whenever I see `for d=0...` over date keys, check what time the consumer expects "today" to mean.
- **Email HTML construction**: All Resend bodies are string-concatenated with no escaping of user-controlled fields (`client.name`, `firstName`). Note for Security day.
- **CORS pattern in submit-* endpoints**: All three public submission endpoints set `Access-Control-Allow-Origin: *`. Intentional (called from same-origin pages but `*` is permissive). Not a bug in this stack.

## Recurring bug clusters

(populated when ≥3 bugs in same area)

- _none yet_
