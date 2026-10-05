# Telos Bug Hunter - Learnings

Living notebook of patterns, false-positive traps, and context the agent has accumulated. Keep under 2000 lines; compress older entries into a summary once that cap is reached.

---

## Bootstrap - 2026-10-05

**Context**: First run. No `agent/memory/*` or prior reports existed. Bootstrapped scaffolding and ran a Functional-focus hunt on the current head of `main` (merged into `claude/ecstatic-gauss-ajklwc`).

### Repo shape
- Pure HTML/CSS/JS, no build step, Vercel-hosted.
- `index.html`, `pricing.html`, `chs.html`, `shop.html`, `product.html`, `protein-calculator.html`, `hyrox-predictor.html`, `resources.html`, `client-dashboard.html`, `thomas.html` + 23 blog articles.
- API lives in `/api/` (serverless), split into `api/client/`, `api/dashboard/`, `api/cron/`, plus a few top-level public endpoints and `api/lib/{auth,client-auth,redis}.js`.
- `CLAUDE.md` already documents convention: clean URLs (no `.html` extension), inline `<style>` on dashboard pages, `?v=16` cache-busting on `css/style.css`, main.js on every public page except dashboards.
- Shop + product pages are brand new (last 7 commits: `6fb77e9` through `f5cb8c4`, May 2026). Integrated via Shopify Buy SDK v3 CDN. Storefront access token hardcoded in `js/shop.js:15` is public-by-design (Shopify Storefront API tokens are intended for client-side use) - do NOT flag this as a secret leak.

### False-positive traps (do NOT report these)
- **Shopify Storefront access token in `js/shop.js`.** It's public by design. Not a secret.
- **`.html` extensions in internal links.** CLAUDE.md flags this as a known P1-P3 backlog item ("tool pages missing main.js, .html extensions in internal links..."). Vercel `cleanUrls` 308-redirects both ways. Don't re-report; cite the backlog instead.
- **`todayStr()` UTC timezone bug in client dashboard streaks.** Known, in backlog. Don't re-report.
- **SW cache version bump needed.** Known, in backlog.
- **Tool pages missing `main.js`.** Known, in backlog.

### Codebase patterns
- Admin session auth: `telos_dash_session` cookie (HMAC-signed), `SameSite=Strict`.
- Client session auth: `telos_client_session` cookie, `SameSite=None; Partitioned` (for Whop iframe).
- Rate limits use `req.headers['x-forwarded-for']` as the key - a comma-joined list for proxied requests. Consistent enough per-client that it's not a bug, just noteworthy.
- Dashboard pages (`thomas.html`, `client-dashboard.html`) are intentionally self-contained; they do NOT load shared `css/style.css` or `js/main.js`.

### Schema note
`docs/BUG_REPORT_SCHEMA.md` is referenced by the system prompt but does not yet exist in the repo. Reports use the sensible markdown schema below until Thomas creates the canonical one. The hard rules only permit writes to `agent/memory/` and `agent/reports/`, so this agent cannot create the schema file itself.

Current report schema (one `.md` per day at `agent/reports/YYYY-MM-DD.md`):

```markdown
# Telos Bug Report - YYYY-MM-DD

- **Focus**: Functional | Visual/UX | Performance | Security
- **Commit**: <short-sha>
- **Findings**: N

## Summary
<one paragraph>

## Findings

### [P0|P1|P2|P3] <title>
- **ID**: YYYY-MM-DD-NN
- **File(s)**: `path/to/file.ext:L`
- **Reproduce**: <steps or exact lines>
- **Impact**: <who/what breaks>
- **Suggested fix**: <concrete pointer, not a prescription>
```

Zero-finding days are reported with the body "No bugs found this run." - that is a valid result.
