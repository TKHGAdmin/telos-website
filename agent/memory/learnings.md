# Telos Bug Hunter — Learnings

## Codebase map (for quick orientation)

- **Pure HTML/CSS/JS**, no framework, no build. Vercel static + serverless functions.
- **Public pages**: `index.html`, `pricing.html`, `chs.html`, `protein-calculator.html`, `hyrox-predictor.html`, `resources.html`, plus 23 blog posts under `blog/`.
- **Admin dashboard**: `thomas.html` (self-contained, password-gated, HMAC session cookie). Backend at `api/dashboard/*`.
- **Client portal**: `client-dashboard.html` (PWA, self-contained). Backend at `api/client/*`. PBKDF2 password hashing.
- **Submission endpoints (public, no auth)**: `api/submit-quiz.js`, `api/submit-email.js`, `api/submit-chs-application.js`.
- **Cron**: `api/cron/weekly-summary.js` (Mon 9am ET), `api/cron/engagement-check.js` (daily). Both gated on `CRON_SECRET` bearer.
- **Persistence**: Upstash Redis via REST. No npm deps. Helpers in `api/lib/redis.js` (single command + pipeline).
- **Auth**: HMAC tokens. Admin = 2-part (`expires.sig`), client = 3-part (`clientId.expires.sig`). Cookie `telos_dash_session` (Strict) and `telos_client_session` (None+Partitioned for iframe).

## Patterns I've observed

- **Rate limiting is consistent on public POSTs** (`ratelimit:quiz:`, `ratelimit:email:`, `ratelimit:chs:` keys) — except admin login, which has none. Worth checking other auth endpoints for the same gap (client login, reset-password).
- **Email validation is inconsistent**: submit-chs uses regex, submit-email uses `.includes('@')`, submit-quiz uses presence-only. Worth scanning for any other endpoint that accepts an email.
- **Cron handlers iterate from `d=0` (today UTC)** in date loops. Several of these have timezone/early-morning edge cases. Worth a careful pass on any other code that does `Date.now() - i * 86400000`.
- **HTML emails are built with string concatenation** (`reset-password.js`, `send-email.js`, `weekly-summary.js`, `engagement-check.js`). Most variables interpolated are admin-controlled (client.name, etc.), so XSS via email is low-risk, but worth a sweep if any user-controlled string ever reaches them.
- **Public form handlers swallow errors silently** (`fetch(...).catch(function(){})`). Pattern shows up in `quiz.js`, likely also in `protein-calculator.html` and `hyrox-predictor.html`. When a backend validates more strictly than the frontend, the user sees success regardless. Worth checking those standalone tool pages for the same shape.
- **`type="button"` + click handler pattern** can bypass HTML5 `required` validation. Worth grepping for `quiz-see-score-btn` / `type="button"` pairs across all forms.

## Known-issue list (already documented in CLAUDE.md — DO NOT re-flag)

- Whop/Safari iframe cookie issue.
- `.html` extensions in internal links across many pages.
- `todayStr()` UTC timezone bug in client dashboard streaks.
- SW cache version bump needed when assets change.
- `api/client/notify.js` Web Push is incomplete (no VAPID/encryption).

## False-positive patterns to avoid

- (None yet — `decisions.jsonl` is empty.)

## Areas explored on first run (2026-04-29)

- `api/lib/{auth,client-auth,redis}.js`
- `api/submit-{quiz,email,chs-application}.js`
- `api/dashboard/login.js`
- `api/client/{login,reset-password,training-log,daily-log,nutrition-log,send-email,notify}.js`
- `api/cron/{engagement-check,weekly-summary}.js`
- `js/{quiz,main}.js`
- Header link patterns in `index.html`, `pricing.html`, `chs.html`, `resources.html`

## Areas NOT yet explored (good targets for future runs)

- `api/dashboard/{clients,client-portal,pipeline,revenue,content,adspend,modules,upload-video,delete-video,analytics,chs-applications,emails,submissions,stats}.js`
- `api/client/{me,mindset,resources,five-four-five,training-program,food-search,sidemenu,modules,module,module-progress,push-{subscribe,unsubscribe},activity-log,supplements,supplement-log}.js`
- All blog HTML (23 files) for dead links, broken meta, schema validation
- `client-dashboard.html` and `thomas.html` inline JS — large files, likely fertile ground for visual/UX day
- `sw.js` — push notification + cache logic
- Tool pages `protein-calculator.html` / `hyrox-predictor.html` — same fire-and-forget submit pattern as quiz; might have same validation gap

## Notes on the schema

- `docs/BUG_REPORT_SCHEMA.md` does not exist. I wrote the report in a self-consistent format (frontmatter + numbered bug entries). If the parser breaks, the schema needs to be created and earlier reports normalized.
