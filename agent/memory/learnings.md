# Telos Bug Hunter - Learnings

Accumulated knowledge from daily runs. Keep under 2000 lines. Prepend newest at top.

## 2026-09-20 - Bootstrap run
- First run. `agent/`, `docs/BUG_REPORT_SCHEMA.md`, and `focus-rotation.json` did not exist. Bootstrapped scaffolding.
- CLAUDE.md lists 11 top-level HTML files but `product.html` and `shop.html` are present in the repo and NOT documented in CLAUDE.md. Recent commits (f5cb8c4, a3b1e87, 4b1bd3c, e08b007, 21cc926) all touch shop/product/cart - these are the newest, least-battle-tested code paths and deserve extra scrutiny in future functional runs.
- Focus rotation index chosen so that Sunday (2026-09-20 is a Sunday) starts at index 0 = functional. Rotation advances by day.
- No decisions history yet - start conservative, high-precision only.

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
