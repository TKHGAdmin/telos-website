# Bug Hunter Learnings

Rolling notes the agent accumulates across runs. Compress older entries into
a summary once this file exceeds 2000 lines.

## Codebase orientation (initial run — 2026-08-11)

- Static HTML/CSS/JS site — no build step, no test runner, no linter
  installed. `npm test` and `tsc --noEmit` are not viable checks. Only
  useful bash tools are `git`, `node` (for ad-hoc parsing), `npm audit`
  against the tiny root `package.json` (only `@vercel/blob`), and grep-based
  scans.
- Serverless functions live under `api/`. Auth helpers in `api/lib/auth.js`
  (admin, HMAC-signed cookie) and `api/lib/client-auth.js` (client, PBKDF2
  password hash + signed cookie). Anything under `api/dashboard/*` must call
  the admin `verifySession`; anything under `api/client/*` other than
  login/reset/push-subscribe should validate the client session.
- `client-dashboard.html` and `thomas.html` are intentionally self-contained
  — do not report "missing shared CSS/JS include" on those two. Every other
  public page loads `js/main.js`.
- `body.page-load-anim` is homepage-only by design (see CLAUDE.md); don't
  flag its absence on other pages.
- `todayStr()` UTC-timezone bug in client dashboard streak math is a known
  open P2 (documented in CLAUDE.md "Known Limitations"). Don't re-report it
  unless the surface changes.
- Whop-iframe login on iOS Safari is documented as a known limitation. Do
  not re-report as a bug.
- `.html` extension in internal links is P3-only unless it produces a
  visibly broken nav — most links already omit `.html` under
  `cleanUrls: true`.

## False-positive patterns to avoid

- "No test coverage" — the project has no test infrastructure by design.
- "No TypeScript" — the project is pure JS by design.
- "Should use bcrypt" — client auth uses PBKDF2 with a reasonable iteration
  count and is fine as-is.
- Missing meta tags on tool pages that don't need them (SEO polish, not
  functional).
- Style/preference nits (naming, indentation, arrow vs. function).
- Flagging any file that references Whop / Calendly URLs as "hardcoded URL"
  — these are intentional external integrations.

## Signal patterns worth hunting again

- Public POST endpoints without rate limits (Charleston has one; others may
  be missing). Confirm every `/api/submit-*` before flagging.
- Redis key mismatches between reader and writer paths — coach writes under
  one name, client reads under another.
- Client-side `innerHTML =` sinks that concatenate strings from responses
  the coach can set (mindset, resources, side-menu custom items) — that's
  admin-authored, not attacker-controlled, but worth watching.
- Cron endpoints without `CRON_SECRET` — fail-closed is required.
