# Bug Hunter — Accumulated Learnings

Append-only. Compress when over 2000 lines.

---

## Codebase map (first pass, 2026-06-02)

- Stack: pure HTML/CSS/JS, Vercel serverless functions, Upstash Redis. No build step, no framework.
- Public marketing pages: `index.html`, `pricing.html` (quiz-gated), `protein-calculator.html`, `hyrox-predictor.html`, `chs.html`, `resources.html`, plus 23 blog posts under `/blog/`. Shop pages (`shop.html`, `product.html`) exist; not covered in CLAUDE.md yet but tracked in git.
- Admin dashboard: `thomas.html` (self-contained, password + HMAC cookie). API at `/api/dashboard/*` gated by `verifySession`.
- Client portal: `client-dashboard.html` (self-contained PWA). API at `/api/client/*` gated by `verifyClientSession`.
- Cron jobs: `weekly-summary` (Mon 14:00 UTC) and `engagement-check` (daily 15:00 UTC), both require `CRON_SECRET`.
- All quiz / email / CHS form submissions go through `/api/submit-*.js` with per-IP rate limits in Redis.

## Patterns to remember

- Date storage everywhere uses `new Date().toISOString().split('T')[0]` — pure UTC. CLAUDE.md flags this as a known timezone bug for streaks; do not re-report unless a specific user-visible regression surfaces.
- Most POST handlers use a "merge into existing if present" pattern via `redis('GET', key)` -> JSON.parse -> mutate -> `SET`. There is no transaction; concurrent writes can lose data, but the client UI is single-user-per-account so collisions are unlikely in practice.
- `req.headers['x-forwarded-for']` is used raw as a rate-limit key in three submit handlers. Vercel sets this header; clients can append values but the platform overwrites it. Not currently a defect, but worth a security-day look.
- Admin `clients.js` PUT updates the `client_email:` lookup only when `client.portalEnabled` is true and email changes. POST never creates the lookup — it's created lazily by `client-portal.js` POST when portal is enabled.
- The cron `engagement-check.js` has no per-client dedup state, so a long-inactive client will receive the reminder every single day. May be intentional; flagged as P2 for triage.

## False-positive patterns to avoid in future runs

- (none yet — first run)

## Areas explored on this run

- All 3 public submit endpoints (`submit-quiz`, `submit-email`, `submit-chs-application`).
- All auth helpers (`lib/auth.js`, `lib/client-auth.js`).
- Client portal endpoints: `login`, `reset-password`, `daily-log`, `training-log`, `nutrition-log`, `food-search`, `five-four-five`.
- Admin endpoints: `clients.js`, `client-portal.js`, `chs-applications.js`.
- Both crons: `weekly-summary.js`, `engagement-check.js`.
- Quiz JS (`js/quiz.js`) and quiz form HTML on `index.html` + `pricing.html`.
- Protein calculator and Hyrox predictor email gates.

## Areas NOT yet covered (queue for future Functional days)

- `api/client/`: activity-log, supplement-log, supplements, mindset, resources, sidemenu, modules, module-progress, push-subscribe/unsubscribe, notify, send-email.
- `api/dashboard/`: stats, submissions, emails, pipeline, revenue, content, adspend, analytics, modules, upload-video, delete-video.
- Shop pages (`shop.html`, `product.html`, `js/shop.js`) and Shopify Buy SDK integration.
- Blog navigation (all 23 articles) — cross-link audit, hamburger consistency.
- `client-dashboard.html` JS internals (large file, ~278kb) — training rest timer, FAB modal flows, nutrition macro math.
- `thomas.html` JS internals (large file, ~161kb).
- Service worker (`sw.js`) caching + push subscription lifecycle.

## Infra notes

- `docs/BUG_REPORT_SCHEMA.md` referenced in the agent system prompt does not exist in the repo. First report uses an inline schema. Thomas should either commit the schema or accept the inline format.
- No CI/lint config in the repo (`package.json` is minimal, no scripts). Static analysis on this run is purely manual code reading.
