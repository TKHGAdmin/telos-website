# Bug Hunter - Accumulated Learnings

This file is the agent's notebook. It is appended to (not overwritten) at the end of each daily run. Compress older entries when the file exceeds ~2000 lines.

---

## 2026-05-05 - First run

### Codebase shape (one-time orientation)
- Pure static HTML/CSS/JS site at the repo root - no framework, no build step. `npx serve -l 3000 .` runs it locally.
- Public marketing pages share `css/style.css` and `js/main.js`. `thomas.html` (admin) and `client-dashboard.html` (PWA) are deliberately self-contained: all CSS/JS inline, neither loads `main.js` or `style.css`. Don't grep those two when looking for shared-CSS issues.
- `js/quiz.js` is the only public JS module besides `main.js`. It runs on `index.html` (inline section) and on `pricing.html` (overlay) and stores `telosQuizCompleted` in `localStorage` to gate pricing.
- 23 blog posts in `/blog/` are each fully self-contained HTML with inline `<style>`. They prefix internal hrefs with `../`.
- Vercel serverless API in `/api/` - admin-protected endpoints under `/api/dashboard/`, client-portal under `/api/client/`, public endpoints (`submit-quiz`, `submit-email`, `submit-chs-application`) at the root.
- Upstash Redis is the only datastore; no SQL.

### Known P1-P3 backlog (DO NOT re-report - already documented in CLAUDE.md "Bug crawl P1-P3 backlog")
1. Tool pages (`protein-calculator.html`, `hyrox-predictor.html`) do not load `main.js`; they re-implement hamburger logic inline.
2. Internal links still using `.html` extensions instead of clean URLs - present in tool pages, blog pages, footers, and a couple of nav-logo `href`s.
3. `todayStr()` UTC timezone bug in client dashboard streak counters.
4. `sw.js` cache name still `telos-v1`; needs bump.

### Patterns worth re-checking on the matching focus day
- **Functional**: any new public form added since the last functional pass - verify the submit flow gates client-side state on the API's `res.ok`, not on a fire-and-forget. The quiz lead capture got this wrong.
- **Visual/UX**: when a new public root page is added (chs.html was the last one), check whether the documented site-wide nav additions (Client Login link, Tools dropdown, Charleston entry) propagated. They didn't for chs.
- **Performance**: hero-image and gallery image sizes in `images/` - `chs-hero.jpg` is 142KB which is fine; `thomas.jpeg` is 1.9MB but only used on /thomas (admin) so it's behind auth.
- **Security**: API rate limits, session cookie config (`telos_dash_session` SameSite=Strict, `telos_client_session` SameSite=None Partitioned for Whop iframe). Don't flag SameSite=None on the client cookie - it's intentional for the Whop embed.

### False-positive patterns to avoid
- `alt=""` on a hero image (`chs.html` line 824) - this is the W3C-blessed pattern for purely decorative imagery sitting behind a hero overlay. Don't flag unless the image conveys content.
- `<button type="button">` is not inherently a bug. It only becomes a bug when paired with no JS validation on a `required`-field form. Check both before reporting.
- Tool pages have inline hamburger handlers in addition to the missing `main.js`. This is on the known backlog; reporting it duplicates that.

### Tools / commands that worked
- `grep -rn --include="*.html" 'pattern' .` from repo root for cross-page checks
- `WebFetch` to `https://www.telosathleticclub.com/` and apex domain both returned 403 - the production host blocks the WebFetch user agent. For visual checks, rely on source reading + reasoning about CSS, or run a local server.

### Open questions for future runs (do not report yet, but watch)
- Is `manifest.json`'s 1024x1024 icon entry actually used by any platform? Standard PWA spec lists 192 + 512. Possibly drop on a Performance day.
- Is the production-domain 403 on WebFetch deliberate (bot blocking) or accidental (over-aggressive WAF)? Touches Performance + Security.
