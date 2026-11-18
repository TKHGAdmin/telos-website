# Learnings

Running notes for the Telos Bug Hunter. Patterns observed, false-positive
traps to avoid, and areas of the codebase that have been explored.

## Codebase shape

- Pure HTML/CSS/JS, hosted on Vercel, no build step.
- Serverless functions under `api/` use Upstash Redis via the thin wrapper in
  `api/lib/redis.js`. Two auth libs: admin (`lib/auth.js`, cookie
  `telos_dash_session`) and client (`lib/client-auth.js`, cookie
  `telos_client_session`).
- Dashboards (`thomas.html`, `client-dashboard.html`) are self-contained HTML
  pages with inline CSS/JS. Public marketing pages share `css/style.css` and
  `js/main.js`.
- Data lives in Redis - no RDBMS - so there's no schema enforcement. Any
  key/field drift between writers and readers goes undetected until a feature
  breaks visually.

## Patterns worth hunting for

- **Field-name drift between API and HTML.** The admin dashboard was moved
  into git on 2026-04-12 as a flat copy of what was running on Vercel. It
  reads several client fields as snake_case while `api/dashboard/clients.js`
  writes them as camelCase (see 2026-11-18 report F1). Worth searching
  `thomas.html` for other `c.foo_bar` reads and cross-checking against the
  API's writes.
- **DELETE handlers that only remove the primary key.** `clients.js DELETE`
  doesn't clean up the `client_email:` lookup or any of the per-client log
  keys. Other dashboard DELETE endpoints (`pipeline.js`, `chs-applications.js`,
  `modules.js`, `content.js`, `adspend.js`) are worth auditing for the same
  pattern.
- **String compares on secrets/signatures.** `lib/auth.js:27` uses `!==` on
  an HMAC hex; `lib/client-auth.js` uses `crypto.timingSafeEqual`. Any time
  only one of a pair uses the hardened pattern, the other is a candidate.
- **Date regex passes `2026-02-30`.** Several POST handlers validate dates
  with `/^\d{4}-\d{2}-\d{2}$/` then call `new Date(body.date).getTime()`.
  Impossible dates slip through the regex and produce `NaN` scores into
  ZADD, failing the whole write. Haven't observed it in the wild yet but
  something to watch.

## Known limitations already documented (skip these)

These are in `CLAUDE.md` under "Known Limitations / Bug crawl P1-P3 backlog"
or similar. Do not re-report:

- `todayStr()` in `client-dashboard.html` returns UTC, breaks streaks near
  local midnight.
- Service worker `CACHE_NAME = 'telos-v1'` needs bumping when cached assets
  change.
- Tool pages are missing the `main.js` include in some flows.
- `.html` extensions linger in a few internal links.
- Whop iframe / Safari third-party cookie block for the client portal.
- `api/client/notify.js` Web Push is a placeholder without VAPID JWT / RFC 8291
  encryption.

## False-positive patterns to avoid

- Reporting empty-password login bypass when `DASHBOARD_PASSWORD` is unset:
  the `dashboard/login.js:10` falsy check on `password` catches `""`, and the
  frontend never sends `undefined`, so the theoretical `timingSafeEqual(0,0)`
  path is unreachable.
- Reporting incomplete Web Push - the code and CLAUDE.md both flag it as
  intentional placeholder.
- Reporting non-trim'd quiz lead inputs as a bug - lead quality concern, below
  the P3 bar on its own.

## Areas explored

- `api/lib/*` (auth, client-auth, redis)
- `api/dashboard/{login,clients,client-portal,revenue}.js`
- `api/client/{login,reset-password,daily-log,activity-log,training-log,five-four-five,food-search,notify}.js`
- `api/submit-{quiz,email,chs-application}.js`
- `api/cron/engagement-check.js`
- `thomas.html` - Clients tab, Revenue tab, api() helper
- `client-dashboard.html` - skimmed; detailed pass still pending
- `js/{quiz,main}.js`
- `sw.js`, `manifest.json`, `vercel.json`

## Areas not yet explored

- `api/dashboard/{content,adspend,modules,pipeline,emails,chs-applications,stats,submissions,analytics,upload-video,delete-video}.js`
- `api/client/{module,modules,module-progress,push-*,send-email,supplements,supplement-log,nutrition-log,nutrition-plan,sidemenu,mindset,resources,training-program,me,logout}.js`
- `api/cron/weekly-summary.js`
- Most of `thomas.html` (pipeline, content, ad spend, chs, analytics, client-portal sub-tabs)
- Most of `client-dashboard.html` (training, 545, nutrition, profile UI logic)
- Blog templates
- All public marketing HTML except quiz.js
