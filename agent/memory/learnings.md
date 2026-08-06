# Telos Bug Hunter — Learnings

## Codebase mental model
- Pure static HTML/CSS/JS, no build step, hosted on Vercel.
- Two "app" pages are self-contained mega-files with inline CSS/JS by design:
  `thomas.html` (160 KB admin dashboard) and `client-dashboard.html` (272 KB PWA).
  Do NOT report these sizes as bugs — CLAUDE.md documents this convention.
- All public marketing pages load `css/style.css?v=16` and `js/main.js`. Blog uses `../` prefix.
- API is Vercel Serverless Functions under `api/`, backed by Upstash Redis via a
  thin REST wrapper (`api/lib/redis.js`). Pipeline helper exists — most list
  endpoints already use it, so N+1 to Redis is rare.

## Areas explored so far
- **Static assets**: sizes of every HTML page, JS bundle, image; image references
  across `index.html` and `chs.html`; `<img loading=…>` usage site-wide.
- **CSS**: `about-photo` sizing, style.css `?v=` version consistency across all 8
  root HTML pages and all 23 blog pages (all on `?v=16`).
- **Service worker**: `sw.js` full read — network-first for non-API GETs, cache-first
  for fonts, unbounded cache, `telos-v1` name.
- **Dashboard APIs**: `clients.js`, `pipeline.js`, `chs-applications.js`,
  `submissions.js`, `emails.js`, `training-log.js` — all use `redisPipeline` correctly.
- **Client dashboard on-load**: `loadDashboard` → `loadHomeData` fires 9 API calls
  in parallel via `Promise.all`. Not an issue.

## Confirmed real-issue patterns (raise similar ones with confidence)
- Oversized JPEG served without responsive variants when CSS caps display size.
  Check ratio `naturalDimensions / renderedDimensions`; anything > 2× on high-traffic
  pages is worth flagging.
- Below-fold `<img>` without `loading="lazy"` — only `chs.html` hero has an
  explicit loading hint; every other `<img>` inherits `eager`.

## Known-fine patterns (do NOT re-flag)
- `client-dashboard.html` and `thomas.html` being large single files — intentional.
- 14 Google Font weights on homepage — `display=swap` set, not render-blocking.
- Service worker registered at root scope from `client-dashboard` — intended;
  network-first strategy prevents stale content.
- `redis()` + `redisPipeline()` REST calls — no npm deps by design (CLAUDE.md).
- `js/main.js?v=2` version drift vs `?v=16` on CSS — separate cache-bust knobs, intentional.
- Deprecated `images/telos-icon-{192,512}.svg` — CLAUDE.md already marks safe to delete.

## Missing infrastructure (bootstrap gaps)
- `docs/BUG_REPORT_SCHEMA.md` referenced by the agent prompt does not exist.
  This report used a self-consistent Markdown structure. Future runs will follow
  the same shape until a schema is authored.
- No prior reports or `decisions.jsonl` entries yet — approval-rate feedback loop
  is empty. Staying conservative on volume until signal arrives.

## Notes for next run (2026-08-07, focus: security)
- `.gitignore` is short — verify no `.env` or credential files are tracked.
- `api/lib/auth.js` HMAC session cookies + `api/lib/client-auth.js` PBKDF2 hashing —
  audit for timing safety, secret length checks, and cookie flags.
- Public POST endpoints: `submit-quiz.js`, `submit-email.js`, `submit-chs-application.js`
  — check rate limiting (CLAUDE.md claims 5/hr on CHS; verify others), input length caps,
  and CORS behavior in `vercel.json`.
- `client-dashboard.html` inline JS renders user-provided text (nutrition names,
  activity notes, coach content) — scan for unescaped innerHTML sinks.
- Push notification subscription endpoints — validate origin.
