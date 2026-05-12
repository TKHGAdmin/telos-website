# Telos Bug Hunter — Learnings

Accumulated knowledge across runs. Keep terse. Prune when over 2000 lines.

## Codebase shape (initial survey 2026-05-12)

- Pure HTML/CSS/JS frontend; Vercel serverless functions in `/api`.
- Two auth realms: admin (`telos_dash_session`, 2-part token) and client (`telos_client_session`, 3-part token).
- Redis (Upstash REST) for all persistence. No npm deps in API.
- Public POST endpoints: `submit-quiz`, `submit-email`, `submit-chs-application`. Each rate-limits per IP.
- Tool pages: `protein-calculator.html`, `hyrox-predictor.html`. Self-contained inline scripts.
- Client dashboard (`client-dashboard.html`) and admin dashboard (`thomas.html`) are huge self-contained files with inline CSS/JS — high-density areas for bugs.

## Conventions to respect (avoid false positives)

- `cleanUrls: true` in vercel.json — internal links intentionally omit `.html`.
- Tool pages use bare `.visible` for results sections (NOT a global rule). Don't flag as inconsistent.
- Dashboards do NOT load `main.js` or `style.css` by design — self-contained.
- `body.page-load-anim` only on index.html — intentional opt-in.
- Em dashes are banned everywhere (use hyphens).

## Known unresolved backlog (per CLAUDE.md)

- Tool pages missing main.js (intentional? to verify)
- `.html` extensions in some internal links
- `todayStr()` UTC timezone bug in client dashboard streaks
- SW cache version bump needed
- Whop iframe on Safari/iOS — third-party cookie limitation (not a fixable bug; accepted limitation)

## False-positive patterns to avoid

- (none yet — populate as denials accumulate)

## Patterns observed in 2026-05-12 run

- Public submit endpoints have inconsistent validation: `submit-email` checks
  `includes('@')`, `submit-chs-application` uses a regex, `submit-quiz` only
  checks truthy. Inconsistencies like this are usually fertile — when
  reviewing API endpoints, diff them against siblings.
- The dashboard CRUD endpoints generally don't clean up secondary indexes
  on DELETE. `clients.js` leaves `client_email:` orphaned. Worth grepping
  other DELETE branches (`pipeline.js`, `chs-applications.js`,
  `client-portal.js`, `modules.js`) on a future Functional day for the
  same pattern — keyed secondary indexes that aren't torn down.
- `Math.max(min, Math.min(max, parseInt(x, 10) || 0))` is used a lot in
  `daily-log.js`. The `|| 0` fallback means deliberate-null inputs get
  clamped to the floor (1). Probably intentional; not flagged.

## Open questions for next runs

- Confirm whether `tool pages missing main.js` is intentional or backlog.
- Check if `verifyToken` in `api/lib/auth.js` is timing-safe (uses `!==` on
  HMAC). Already noted in 2026-05-12 report under Notes; revisit on the
  Security focus day.
- Audit other DELETE handlers for orphaned secondary indexes (same pattern
  as BUG-2026-05-12-01).
- `weekly-summary` cron: confirm intended semantics of "Avg Execution Score"
  (averaged over 7 fixed days vs. only logged days).
