# Telos Bug Hunter — Learnings

Accumulated notes across runs. Compress older entries when this file exceeds
2000 lines.

---

## Codebase orientation (bootstrap, 2026-08-28)

- Pure HTML/CSS/JS, no build step, hosted on Vercel.
- Two dashboards (`thomas.html`, `client-dashboard.html`) are self-contained
  with inline CSS and JS — they do NOT load `css/style.css` or `js/main.js`.
  Do not report "missing shared stylesheet" on them.
- All internal links use clean URLs (no `.html`); Vercel's `cleanUrls: true`
  handles it. Do not report the absence of `.html` as a bug.
- Shared CSS is version-pinned via `?v=N`. Currently `?v=16`.
- Redis access goes through `api/lib/redis.js` (Upstash REST).
- Admin session: `telos_dash_session`. Client session: `telos_client_session`
  (3-part token `{clientId}.{expires}.{signature}`).

## Known-limitation list (documented in CLAUDE.md, do not re-report)

- Whop iframe login fails on Safari/iOS (third-party cookie blocking).
- Tool pages missing `main.js` — P1 backlog item.
- `.html` extensions inside internal links — P2 backlog item.
- `todayStr()` UTC timezone bug in client dashboard streaks — P2 backlog.
- SW cache version needs a bump when static assets change — P3 backlog.
- The bug crawl from April 2026 already handled P0s; P1–P3 remain in the
  commit history (see commit `7fa38ff`).

## Focus areas explored

- **Functional (2026-08-28)**: Shop / cart / product-detail flow, CHS
  application submission API, client login + reset-password + food-search
  API, weekly-summary cron. Reviewed the most recent commits (`f5cb8c4`
  image gallery through `ad1427a` shop launch).

## False-positive patterns to avoid

_(none logged yet — populate as decisions.jsonl accumulates denials)_
