# Telos Bug Hunter — Learnings

Accumulated knowledge across daily runs. Compress when this exceeds 2000 lines.

## Codebase orientation

- Pure HTML/CSS/JS, no build step. Hosted on Vercel + Upstash Redis.
- Public pages: index, pricing, chs, protein-calculator, hyrox-predictor, resources, blog/*.
- Dashboards (self-contained, do NOT load main.js): thomas.html (admin), client-dashboard.html (client PWA).
- API endpoints under `/api/` (Vercel serverless). Admin under `/api/dashboard/`, client under `/api/client/`.
- CLAUDE.md is the canonical reference for conventions.

## Known issues NOT to re-flag (documented in CLAUDE.md)

- tool pages missing main.js (in P1-P3 backlog)
- `.html` extensions in some internal links (in P1-P3 backlog)
- `todayStr()` UTC timezone bug in client dashboard streaks (in P1-P3 backlog)
- SW cache version bump needed (in P1-P3 backlog)
- Whop iframe on Safari/iOS does not preserve client login (documented limitation)

## False-positive patterns to avoid

(none yet — populate after first denials)

## Patterns observed

### Run 1 (2026-04-28, Functional)
- API handlers commonly return `200 ok: true` even when underlying side-effects fail silently. See `api/client/notify.js` (push fetch failure → still 200) and `js/quiz.js` lead capture (`fetch().catch(function(){})`). Treat any "success that swallows errors" path as a candidate functional bug.
- `redis()` DELETE flows tend to remove the primary record + its index entry but forget secondary lookup keys (`client_email:`, etc.) and per-entity child keys. When auditing a delete handler, list every key the create/update path writes to and check each is removed.
- Cron jobs that compute "today" stats fire **before** clients have logged today. Any logic that treats "today missing" as terminal (vs. expected) will produce wrong numbers. See `api/cron/weekly-summary.js` streak loop.
- `parseInt(x) || 0` followed by `Math.max(1, ...)` silently rewrites empty/zero inputs to 1. Probably fine when paired with stepper UIs that always emit a value, but worth re-checking if a related input ever sends `''` or `0` legitimately.
- Web Push protocol (RFC 8030 / 8291) requires VAPID JWT auth + AES-128-GCM payload encryption. A direct `fetch()` to `subscription.endpoint` with plaintext JSON does not work. The comment in `notify.js:56` flags this, but the handler is shipped anyway and masks the failure.

### Areas explored
- `api/lib/{auth,client-auth,redis}.js`
- `api/dashboard/{clients,client-portal,login,pipeline,emails,submissions,chs-applications,upload-video,delete-video}.js`
- `api/client/{login,reset-password,daily-log,activity-log,training-log,food-search,notify}.js`
- `api/{submit-quiz,submit-email,submit-chs-application}.js`
- `api/cron/{weekly-summary,engagement-check}.js`
- `js/main.js`, `js/quiz.js`
- `client-dashboard.html` (auth/init/loadDashboard regions only)

### Areas still to explore in future runs
- `thomas.html` admin UI logic (3174 lines, untouched)
- Bulk of `client-dashboard.html` (training tracker, nutrition modal, 545, side menu)
- `blog/*` pages (SEO/UX-relevant)
- `sw.js` push event handler (relevant to BUG-01 verification)
- `api/dashboard/{revenue,content,adspend,analytics,modules,stats}.js`
- `api/client/{me,mindset,nutrition-plan,nutrition-log,resources,sidemenu,training-program,supplements,supplement-log,modules,module,module-progress,push-subscribe,push-unsubscribe,send-email,five-four-five}.js`
