# Bug Hunter Learnings

Persistent notes the agent accumulates across runs. Keep under 2000 lines — compress older entries when the file grows.

## Repo facts (stable)
- Pure HTML/CSS/JS site, no build step. Vercel serverless functions for the API.
- Two dashboards (`thomas.html`, `client-dashboard.html`) are self-contained and do NOT load `js/main.js` or `css/style.css`. Bugs scoped to "missing main.js" do NOT apply to these two files.
- Tool pages (`protein-calculator.html`, `hyrox-predictor.html`) have inline `<script>` but should still load `js/main.js` for nav.
- Clean URLs are enabled (`cleanUrls: true` in `vercel.json`). Internal links should NOT include `.html`.
- CSS version pin is `?v=16` across pages — must be bumped together when editing `style.css`.

## False-positive patterns (do NOT report)
- Inline styles in `thomas.html` and `client-dashboard.html` (these are intentionally self-contained).
- Missing `.html` extension on internal links (intentional, see `cleanUrls`).
- The Whop iframe / Safari third-party cookie limitation in client login (known and documented in CLAUDE.md).

## Approved bug patterns (good signal — hunt for more like these)
_(populated as decisions arrive)_

## Denied bug patterns (noise — stop reporting)
_(populated as decisions arrive)_

## Patterns noticed
- `submit-quiz.js`, `submit-email.js`, `submit-chs-application.js` all share the same `req.headers['x-forwarded-for']`-as-key rate-limit pattern. Any future change to rate limiting should touch all three together.
- `api/lib/auth.js` (admin) and `api/lib/client-auth.js` (client) diverged on the same primitive (HMAC signature compare). Worth a sweep next time something else lands in both: token expiry parsing, cookie attributes, etc.
- Crons rely on Date math against `Date.now()` and UTC strings. Edge cases around day boundaries (streak counts, "last log days ago") are recurring. The known `todayStr()` bug in client-dashboard probably has cousins in `cron/weekly-summary.js` and `cron/engagement-check.js`.
- JS UI handlers in `js/quiz.js` are bound inside render functions that re-run on retake — listener-leak shape. Worth checking `js/main.js` and other inline tool scripts (`protein-calculator.html`, `hyrox-predictor.html`) for the same pattern.

## Coverage log
- 2026-06-04 (run 1, Functional): scanned `api/submit-*`, `api/lib/{auth,client-auth,redis}.js`, `api/client/{login,reset-password,daily-log,food-search}.js`, `api/dashboard/{login,clients,client-portal,chs-applications}.js`, `api/cron/{weekly-summary,engagement-check}.js`, `js/quiz.js`, `vercel.json`. First-time pass — used as baseline. Filed 5 findings (2× P2, 3× P3).
