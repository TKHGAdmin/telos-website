# Telos Bug Hunter - Learnings

Accumulated knowledge about the Telos Fitness codebase, false-positive patterns
to avoid, and areas already explored. Older entries get compressed once this
file exceeds 2000 lines.

---

## Areas explored

### 2026-08-23 (Functional, first run)
- All Vercel serverless endpoints under `api/`, `api/client/`, `api/dashboard/`,
  `api/cron/`, and `api/lib/`.
- `client-dashboard.html` (inline JS - state, tabs, modals, rest timer, FAB,
  auth flow).
- `js/quiz.js` (quiz overlay logic).
- Verified: `main.js`, `sw.js`, `manifest.json` at a spot-check level.

## False-positive patterns to avoid

None yet. Populate this section as denials arrive in `decisions.jsonl`.

## Known items already documented by Thomas

Skip these unless you find a *new* concrete manifestation - CLAUDE.md's
"Known Limitations" section already tracks them, so re-flagging just spends
review attention:

- `todayStr()` and `daysSince()` in `client-dashboard.html` return UTC dates -
  streak / heatmap / range logic is off in non-UTC timezones. Documented in
  CLAUDE.md as "todayStr() UTC timezone bug in client dashboard streaks".
- Service worker cache name `telos-v1` never bumped when assets change.
- Some tool pages missing `js/main.js`.
- Internal links still using `.html` extension in a few spots.
- Whop iframe login on Safari/iOS: third-party cookie policy blocks the
  session cookie; documented workaround is the direct URL or PWA install.

If any of these gets *worse* (bigger blast radius, new visible failure), it is
worth re-reporting with a fresh scenario. Otherwise leave them alone.

## Codebase notes (helpful cross-run context)

- Redis keys use `client_email:<normalized>` for email->id lookup. This is a
  single writer with no owner check inside `api/dashboard/client-portal.js`
  POST - anything that mints a lookup should verify or use SETNX. See the
  finding in the 2026-08-23 report for the concrete hijack scenario.
- `verifySession` in `api/lib/auth.js` uses raw `!==` for HMAC compare; the
  client version in `client-auth.js` uses `timingSafeEqual`. Practical exploit
  over the network against a 256-bit HMAC is negligible, so don't re-report
  as anything above P3.
- All cron endpoints correctly require `CRON_SECRET` via
  `req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET`.
- Public POST endpoints (`submit-quiz`, `submit-email`, `submit-chs-application`)
  correctly rate-limit by IP.
- Client dashboard is fully self-contained: it does NOT load `css/style.css`
  or `js/main.js`. Same for `thomas.html`. Don't flag "missing main.js" on
  either.
- FAB button pattern is `display:'block'` / `'none'`, NOT empty string. Both
  paths in `client-dashboard.html` follow the pattern; the CLAUDE.md note
  documents past regressions.
