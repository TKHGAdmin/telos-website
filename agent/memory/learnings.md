# Bug Hunter Learnings

Living notes accumulated across runs. Kept under 2000 lines - compress older entries when exceeded.

## Codebase orientation

- Pure static site (HTML/CSS/JS, no build step) + Vercel Serverless functions under `/api/`
- Two auth systems in `api/lib/`:
  - `auth.js` - admin dashboard, single shared password + HMAC session cookie (7-day)
  - `client-auth.js` - clients, PBKDF2-hashed passwords + 3-part signed token
- Data lives entirely in Upstash Redis (REST API, no npm client)
- Public submission endpoints (`submit-quiz`, `submit-email`, `submit-chs-application`) all rate-limit by `x-forwarded-for` IP with `INCR + EXPIRE` pattern (10/hr for quiz+email, 5/hr for CHS)
- Client-facing endpoints under `api/client/*` all gate on `verifyClientSession`
- Admin endpoints under `api/dashboard/*` all gate on `verifySession`
- Cron endpoints in `api/cron/*` expect Vercel to inject `CRON_SECRET`
- Front-end dashboards (`thomas.html`, `client-dashboard.html`) are self-contained (inline CSS/JS, do NOT load `main.js` or shared `style.css`)

## Rate-limit inventory (as of 2026-08-20)

| Endpoint | Rate limit |
|---|---|
| `/api/submit-quiz` | 10 / hr / IP |
| `/api/submit-email` | 10 / hr / IP |
| `/api/submit-chs-application` | 5 / hr / IP |
| `/api/client/reset-password` | NONE - see BUG-20260820-01 |
| `/api/dashboard/login` | NONE - see BUG-20260820-02 |
| `/api/client/login` | NONE (PBKDF2 still slows brute force) |

## Redis key inventory

Deletion of a `client:{id}` record does NOT cascade to any of these dependent keys:
- `client_email:{normalizedEmail}` (used for login lookup)
- `client_dailylog:{id}:{date}` and index
- `client_nutrition_log:{id}:{date}` and index
- `client_nutrition_plan:{id}`, `client_mindset:{id}`, `client_resources:{id}`
- `client_545_goals:{id}`, `client_545_routine:{id}`, `client_545_daily:{id}:{date}` and index
- `client_training_program:{id}`, `client_training_log:{id}:{date}` and index
- `client_sidemenu:{id}`, `client_supplement_plan:{id}`, `client_supplement_log:{id}:{date}` and index
- `client_activity_log:{id}:{date}` and index

BUG-20260820-03 flags the email-lookup case as a P1 because it blocks Thomas from re-adding a client with the same email after deletion. The others are storage bloat but not user-visible.

## Frontend patterns

- All internal links use clean URLs (Vercel `cleanUrls: true`)
- `main.js` bound to `DOMContentLoaded` only - re-navigation via SPA-style routing would break bindings (but there is no SPA router today)
- `quiz.js` has hardcoded assumptions: exactly 8 questions, exactly 4 pillars, score range 0-40, `getResultTier` boundaries touch (0-15, 16-25, 26-32, 33-40). Adding/removing a question would silently break the progress bar, results tier, and pillar-breakdown math.

## False-positive patterns to avoid

- Do NOT flag "email address stored without normalization in `submit-email`" as a P1 - it is a P3 data-quality issue, not a bug. Only flag as a bug if Thomas reports duplicate emails hurting his workflow.
- Do NOT flag `parseInt(...) || 0` idioms as bugs - they are intentional for optional numeric inputs.
- Do NOT flag missing rate limits on GET endpoints - only on POSTs that trigger cost (Resend email, Redis writes).
- Do NOT flag the client dashboard's `todayStr()` UTC bug as new - CLAUDE.md acknowledges it in "Known Limitations".

## Focus rotation

Day counter cycles 0=Functional, 1=Visual/UX, 2=Performance, 3=Security. Rotate in `focus-rotation.json` after each run.

## Run history

- 2026-08-20: Day 0 (Functional). First run - bootstrapped infrastructure. 3 P1 findings.
