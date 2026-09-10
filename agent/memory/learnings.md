# Telos Bug Hunter — Accumulated Learnings

This file records patterns observed across runs. Kept under 2000 lines; older entries get compressed into summaries.

## Codebase shape (first-run notes, 2026-09-10)

- **No build step.** Pure HTML/CSS/JS, hosted on Vercel with serverless functions under `/api`.
- **`js/main.js`** is loaded on all public marketing pages for nav/scroll/tilt/cursor behavior. Dashboards (`thomas.html`, `client-dashboard.html`) are intentionally self-contained and do NOT load main.js.
- **Redis (Upstash)** stores everything: quiz submissions, email captures, pipeline, clients, applications, client portal state.
- **Two cookies for auth:** `telos_dash_session` for admin (SameSite=Strict), `telos_client_session` for clients (SameSite=None; Partitioned for Whop iframe).
- **Client tiers:** rebuild, growth, lifestyle, lifestyle_plus. Pipeline stages: new, contacted, consultation, proposal, closed_won, closed_lost.
- **Cron endpoints** at `api/cron/*` require `CRON_SECRET` and fail closed. Cache version tag currently `?v=16`.

## False-positive patterns to avoid

- The "intentional design decisions" list is long here — this is a bespoke site, not a framework project. Before reporting UI style issues, check whether the code intentionally deviates from convention (e.g., sharp corners, no shadows on client dashboard is intentional per CLAUDE.md).
- `.html` extensions in internal links are already known and tracked in the P1-P3 backlog (commit 7fa38ff plan file). Don't re-report unless a specific broken link is found.
- Tool pages missing `main.js` is also known and tracked in that same backlog. Don't re-report as a generic bug; only report if a specific downstream break is found.
- Everfit references were removed intentionally — do not flag as "dead reference."

## Approved-bug patterns (empty — populated by decisions.jsonl feedback)

_(none yet — awaiting Thomas's decisions on future reports)_

## Denied-bug patterns

_(none yet)_

## Run log

### 2026-09-10 (functional)

Explored api/lib/*, api/submit-*.js, api/dashboard/*.js (clients, client-portal, pipeline, modules, upload/delete-video, login), api/client/*.js (login, reset-password, daily-log, nutrition-log, training-log, five-four-five, food-search, module, notify, push-subscribe), api/cron/*.js, sw.js, js/quiz.js, and skimmed client-dashboard.html for fetch/date usage patterns.

Reported 4 findings: clients.js DELETE leaves orphan client_email lookup (P1), submit-quiz.js accepts arbitrary strings as email (P2), module.js returns "Upgrade required lifestyle_plus" for modules with empty tierAccess (P2), sw.js registered with default scope "/" (P3).

Considered but excluded:
- quiz.js `countInterval = countDuration / totalScore` with totalScore=0 - min possible total is 8 (1 point x 8 questions), so div-by-zero unreachable.
- `verifyPassword` in api/lib/auth.js with empty DASHBOARD_PASSWORD env - guarded upstream by `if (!password)` in dashboard/login.js, so safe.
- `cleanUp` on upload-video.js MIME check using `indexOf(t) !== -1` - weak but backed by extension regex; low impact.
- `credentials: 'same-origin'` in client-dashboard.html fetch - documented Whop iframe limitation, not a new bug.
- 2pm UTC != 9am ET during EDT in weekly-summary cron doc - documentation nit only.
- UTC-based todayStr() in client-dashboard.html - already in known P1-P3 backlog per CLAUDE.md.

Areas not yet explored (candidates for future runs): blog/ HTML files, resources.html, shop.html + shop.js, thomas.html interactivity (3174 lines), rendered pages under devtools, css/style.css.
