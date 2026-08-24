# Bug Hunter Learnings

Accumulated patterns, false-positive filters, and codebase notes. Kept under 2000 lines.

## Codebase overview (from first exploration)

- Pure HTML/CSS/JS static site + Vercel serverless functions under `api/`.
- Auth: admin uses HMAC-signed cookies (`api/lib/auth.js`), clients use PBKDF2 + session tokens (`api/lib/client-auth.js`).
- Data lives in Upstash Redis via `api/lib/redis.js` (no npm deps).
- Two dashboards are self-contained: `thomas.html` (admin) and `client-dashboard.html` (client PWA). Neither loads `main.js` or `style.css`.
- `index.html` is the only page with `body.page-load-anim`.
- CSS cache-buster convention: `?v=N` on every `style.css` reference. Current version per CLAUDE.md is `?v=16`.

## Known intentional patterns (do NOT report as bugs)

- Clean URLs without `.html` in internal anchors — Vercel `cleanUrls: true` handles it.
- `?v=N` on the shared stylesheet — that's the cache-busting convention.
- Client cookie uses `SameSite=None; Partitioned` — intentional for Whop iframe embedding.
- Admin cookie uses `SameSite=Strict` — intentional; admin never embedded.
- Whop iframe on Safari/iOS not working — documented limitation, not a new bug.
- `body.page-load-anim` only on `index.html` — intentional, opt-in per CLAUDE.md.
- `.visible` CSS class scoped narrowly to `.animate-on-scroll.visible` — tool pages reuse bare `.visible`, and that is by design per CLAUDE.md.
- Deprecated SVG icons (`telos-icon-192.svg`, `telos-icon-512.svg`) still present in `images/` — CLAUDE.md notes they are safe to delete but the absence of deletion is not a bug.

## False-positive patterns to avoid

- (none recorded yet — feed from `decisions.jsonl` as denials accumulate)

## Areas explored so far

- 2026-08-24: first run. Skimmed `api/`, `js/`, root `.html` files, `vercel.json`, `package.json`.

## Patterns / gotchas noticed (2026-08-24)

- `api/dashboard/{clients,pipeline}.js` DELETE handlers only remove `client:{id}` + index membership. Any derived key (email lookup, dailylog, nutrition, training, 545, sidemenu, supplement, push sub, module progress) is left orphaned. Check every DELETE handler for cleanup completeness.
- `client-portal.js` and `clients.js` both manage the `client_email:{normalized}` lookup, but there's no single source of truth for its lifecycle. That split ownership is what enabled BUG-20260824-01. Worth flagging any future PR that touches these two files for consistency.
- CSS grid children on `.product-detail` (`product.html:100-108`) are hardcoded to 2 columns. Any DOM addition inside `#productDetail` risks the same row-major misplacement seen in BUG-20260824-02. Prefer wrappers over adding siblings.
- Rate-limit keys in submit endpoints use raw `x-forwarded-for` as the IP. On Vercel this is the whole hop chain, so users behind the same proxy chain share buckets. Acceptable, not a bug — noted so I don't re-report.
- `sw.js` telos-v1 cache growth: SW caches every non-API GET indefinitely (line 60-70). Not a bug, but relevant on the Performance rotation.

## Focus rotation state at end of 2026-08-24 run

- Ran Functional focus (index 0).
- Set `focus-rotation.json` `next_index` to 1 (Visual/UX) for tomorrow.
