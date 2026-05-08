# Telos Bug Hunter — Learnings

This file accumulates patterns, context, and false-positive heuristics across runs.
Keep under 2000 lines. Compress older entries to summaries when nearing the cap.

---

## Run history

### 2026-05-08 (Functional, first run)
- Bootstrapped `agent/memory/` and `agent/reports/` (did not exist).
- Found 2 bugs: P1 quiz lead-capture validation gap, P2 missing Client Login nav link on `/chs`.

---

## Architecture map (build incrementally)

### Lead capture flows
- **Quiz flow** (`js/quiz.js`, used on `index.html` + `pricing.html`): trigger button is `type="button"` and handler runs on click — bypasses HTML5 `required`. See P1-001 (2026-05-08).
- **Protein calculator** (`protein-calculator.html:810`): uses `form.addEventListener('submit', ...)`. Native validation works.
- **Hyrox predictor** (`hyrox-predictor.html:1054`): button click handler with explicit JS check `if (!email || !email.includes('@'))`. Works but inconsistent with the protein-calculator pattern.
- **Charleston application** (`chs.html:1084`): submit-event handler with explicit JS validation. API also enforces required + email regex.

### API endpoints — common patterns
- All `submit-*` endpoints use `req.headers['x-forwarded-for']` as a raw rate-limit key. Vercel's proxy makes this stable enough in practice.
- Admin endpoints use `verifySession` from `api/lib/auth`. Cookie name is `telos_dash_session`.
- Client endpoints use `verifyClientSession` from `api/lib/client-auth`. Cookie name is `telos_client_session`. Client tokens are 3-part (`{clientId}.{expiry}.{signature}`); admin tokens are 2-part.
- Cron endpoints check `req.headers.authorization === 'Bearer ' + CRON_SECRET`. They fail-closed when `CRON_SECRET` is unset (fixed in commit `7fa38ff`).

### Conventions worth re-checking each run
- All root pages (currently 6: `index`, `pricing`, `chs`, `protein-calculator`, `hyrox-predictor`, `resources`) plus 23 blog pages must include a Client Login link before Book a Call in both desktop and mobile nav. CLAUDE.md still says "5 root + 23 blog = 28" — note the count is now 29 with chs.
- Stylesheet references should use `?v=N` query string. Currently `?v=16`. Bump on `style.css` changes.
- Internal links should be clean (no `.html`). Many pages still use `index.html` — already on the bug-crawl backlog, do not re-report.

---

## False-positive / low-signal patterns to avoid

- **Coach-controlled fields rendered as HTML** (e.g., `client.name` in cron emails) — these are admin-trust-boundary inputs, not public XSS sinks. Don't flag unless an unprivileged user can write to the field.
- **Login error messages with different copy** — minor enumeration concern, but standard tradeoff and not a functional bug. Save for Security day if it still bothers you, but be honest about impact.
- **`x-forwarded-for` raw use as rate-limit key** — works in practice on Vercel; only flag if you can demonstrate an actual bypass.
- **JS operator-precedence "gotchas" in food-search.js** — verified `n['x_serving'] || n['x_100g'] * qty / 100 || 0` evaluates correctly because `*` and `/` bind tighter than `||`. Don't re-flag.

---

## Known backlog (per CLAUDE.md & commit 7fa38ff) — DO NOT re-report

- Tool pages missing `main.js` (some)
- `.html` extensions in internal links
- `todayStr()` UTC timezone bug in client dashboard streaks
- Service worker `CACHE_NAME = 'telos-v1'` needs version bump
- April 2026 bug crawl P0s already fixed (analytics auth, cron secret short-circuit, telos-website/ subdir, blog canonical URLs)

---

## Open questions for future runs

- Is there a `docs/BUG_REPORT_SCHEMA.md` that should be authored, or is the orchestrator parser flexible? The 2026-05-08 report uses a self-explanatory default schema.
- `decisions.jsonl` is empty (first run). Once approvals/denials accumulate, recalibrate severity calibration here.
- Visual/UX day: confirm whether the design refs (WHOOP/Strava/Whop) imply specific contrast ratios I should test against.
- Performance day: no `dist/` directory exists (no build step) — bundle analysis will need to be HTML/JS file-size oriented.
- Security day: revisit client login enumeration messages and test the public `/api/submit-*` endpoints for obvious abuse vectors.
