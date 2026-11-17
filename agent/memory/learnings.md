# Learnings

Accumulated knowledge for the Telos Bug Hunter. Keep under 2000 lines.

## Codebase shape (as of 2026-11-17)

- Pure HTML/CSS/JS, no build step. Vercel static + serverless.
- Public marketing pages share `js/main.js` and `css/style.css`. Dashboards (`thomas.html`, `client-dashboard.html`) are self-contained — do not load `main.js`.
- 23 blog articles under `/blog/` are standalone HTML.
- CLAUDE.md lists a known P1–P3 backlog (see "Known Limitations"). Do not re-report those as new.

## Known backlog — do not re-report as new

- Tool pages missing `main.js`.
- Internal links using `.html` extensions instead of clean URLs.
- `todayStr()` UTC timezone bug in client dashboard streaks.
- Service-worker cache version bump needed.
- Whop iframe third-party cookies broken on Safari / iOS.

## Patterns seen

- Admin forms in `thomas.html` are built by inline JS string concatenation. The `<label>` elements live in the generated HTML, so grep for `<label` on those files will be noisy — read the surrounding code before claiming a label is missing.
- Marketing hamburger (`.hamburger`) is wired by `js/main.js`; the client-dashboard hamburger (`#hamburgerBtn`) is wired inline inside `client-dashboard.html` and is a separate component.
- Quiz runs on both `index.html` (inline) and `pricing.html` (overlay) via shared `js/quiz.js`.

## False-positive patterns to avoid

- Reporting `.html` extensions in internal links — already tracked.
- Reporting that admin/dashboard pages don't load `main.js` — intentional.
- Reporting the absence of a build step, framework, or type system — intentional.

## Areas explored

- `js/main.js` (nav / hamburger wiring)
- `index.html` and `pricing.html` quiz lead-capture forms
- `chs.html` application form (good a11y baseline — use as reference)
- `coaches.html` (good aria coverage)
