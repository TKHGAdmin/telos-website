# Telos Bug Hunter - Learnings

Accumulated knowledge from daily runs. Keep under 2000 lines. Prepend newest at top.

## 2026-09-21 - Visual/UX pass
- 9 bugs filed. 4 P1 (client dashboard a11y - FAB, modal close, login link, tab contrast), 4 P2 (form labels missing across every lead-gen page), 1 P3 (CHS form label contrast).
- Client dashboard is huge (~280KB inline) and does a lot with `<div onclick>` instead of `<button>`. That pattern shows up in FAB menu, login links, and probably elsewhere. Worth grepping `<div[^>]*onclick` for a follow-up sweep next visual pass.
- Every public lead-gen form uses placeholder-as-label. Same shape: `<input placeholder="Email address">` with no `<label>` and no `aria-label`. If this recurs on new pages, it will be a persistent pattern.
- hyrox-predictor.html has `<label for="fiveKTime">` pointing at an ID that does not exist. Pattern to watch: when two inputs form a compound value (min:sec, dollars.cents), a single label often points at neither. Worth grepping `for="[^"]*"` against all `id="..."` on future runs to catch orphan `for`s.
- CHS page uses its own scoped palette (`--chs-text-dim: #6b6660`) that is dimmer than the shared palette. When a page overrides shared design tokens, contrast should be re-checked page-by-page.

### False positives to avoid (visual)
- `<button>` inside a `<form>` without `type="button"` is a common a11y flag, but on the Telos public forms most such buttons are inside forms that either have `onsubmit="return handleFoo(event)"` returning false or use `type="submit"` explicitly. Verify per file; do not report as a class.
- Arrow character (&#8592; / &#8594;) inside a button provides its own accessible name via the character. Do NOT flag those as unlabeled the way we flag SVG-only buttons.
- The pricing quiz overlay has no submit button. Browsers do NOT implicit-submit a form that has more than one text input and no submit control (per HTML spec). Pressing Enter is a no-op, not a page reload. Do not file.

## 2026-09-20 - Bootstrap run (focus: functional)
- First run. `agent/`, `docs/BUG_REPORT_SCHEMA.md`, and `focus-rotation.json` did not exist. Bootstrapped scaffolding.
- CLAUDE.md lists 11 top-level HTML files but `product.html` and `shop.html` are present in the repo and NOT documented in CLAUDE.md. Recent commits (f5cb8c4, a3b1e87, 4b1bd3c, e08b007, 21cc926) all touch shop/product/cart - these are the newest, least-battle-tested code paths and deserve extra scrutiny in future functional runs.
- Focus rotation index chosen so that today starts at index 0 = functional. Rotation advances by day.
- No decisions history yet - start conservative, high-precision only.

### Patterns noticed this run
- Cron jobs (engagement-check, weekly-summary) have no idempotency guard - they re-send on every scheduled invocation while the trigger condition holds. Worth revisiting when doing another functional pass.
- The client lifecycle is asymmetric: creation, portal enablement, and per-day data spread writes across ~15 Redis key families, but DELETE only removes two of them. When something touches multiple key families on create, always check the corresponding delete/rollback path.
- Empty-array defaulting is a recurring hazard: `(arr || []).forEach` combined with a sentinel like `minTier = 999` is a classic "empty means no access" trap. Check both list and detail endpoints for the same primitive.
- Public form/submission endpoints use `ratelimit:*:{ip}` INCR + EXPIRE. Auth endpoints (client login) do NOT. Worth grepping `ratelimit:` on future security passes to find gaps.

### False-positive patterns to avoid
- Shopify Storefront tokens (16 hex chars) in client JS are PUBLIC BY DESIGN. Do not report them as secret leaks. Only flag Shopify tokens shaped like `shpat_*` (Admin) or `shpss_*` (session).
- Admin `verifyToken` in api/lib/auth.js compares HMAC signatures with `!==` rather than timing-safe compare. It looks scary but the compared value is an HMAC hex output, not a secret plaintext, so the practical timing signal is nil. Skip.
- `todayStr()` UTC timezone bug in client-dashboard.html is already in CLAUDE.md's Known Limitations backlog. Do not re-file.

## False-positive patterns to avoid
(To be populated as denials accumulate in `decisions.jsonl`.)

## Codebase notes
- Pure HTML/CSS/JS, no framework, no build step. Vercel-hosted.
- `cleanUrls: true` in vercel.json - internal links should NOT include `.html`.
- Redis via Upstash REST API (no npm deps) - see api/lib/redis.js.
- Admin auth: `telos_dash_session` cookie, HMAC-signed via api/lib/auth.js.
- Client auth: `telos_client_session` cookie, 3-part `{clientId}.{expiry}.{signature}` via api/lib/client-auth.js.
- Dashboard (thomas.html) and client dashboard (client-dashboard.html) are self-contained - do NOT load main.js or shared style.css.
- All dashboard API endpoints must call `verifySession` (admin) or the client session verifier before serving data.
