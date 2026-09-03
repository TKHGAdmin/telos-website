# Bug Hunter Learnings

Accumulated knowledge about the Telos Fitness codebase. Read this at the top of every run. Append new lessons at the bottom under a dated heading.

## Codebase shape (first-run baseline, 2026-09-03)
- Pure static site + Vercel serverless functions under `api/`. No build step.
- Two auth systems that share `SESSION_SECRET`:
  - Admin `/thomas`: HMAC session cookie, timing-safe password check against `DASHBOARD_PASSWORD`.
  - Client portal: PBKDF2 hashed passwords stored on client record, session cookie `telos_client_session` with 3-part token `{clientId}.{expiry}.{sig}`.
- Redis (Upstash) is the only datastore. See CLAUDE.md for the key namespace map.
- `todayStr()` in client-dashboard.html uses `new Date().toISOString().split('T')[0]` — CLAUDE.md documents this as a known UTC-timezone bug in the P1-P3 backlog. Do NOT re-flag as new; if raising it, note "still unresolved" and reference the CLAUDE.md Known Limitations entry.

## Known false-positive patterns
- Shopify Storefront API tokens (`js/shop.js`) are designed to be public. Do not flag them as "exposed secret."
- Ratelimit key `unknown` bucket for missing `X-Forwarded-For` is defensive-only; not actionable on Vercel where the header is always populated.

## Focus rotation notes
- Day 0 = Functional | Day 1 = Visual/UX | Day 2 = Performance | Day 3 = Security.
- Rotation is stored in `agent/memory/focus-rotation.json` and advanced at the end of each run.

## 2026-09-03 (Functional)
- Public POST handlers `submit-quiz`, `submit-email`, `submit-chs-application` all follow the same rate-limit shape (`ratelimit:<name>:{ip}` + INCR + EXPIRE 3600 + cap). Any new public POST should mirror this pattern - `reset-password.js` was found missing it.
- Client `DELETE` in `api/dashboard/clients.js` is under-scoped: only clears the two top-level keys. When flagging cleanup bugs, verify against the full Redis key namespace in CLAUDE.md.
- Shopify Storefront token in `js/shop.js` is intentional. Skip in any future "committed secret" sweep.
- `verifyPassword` fallback (`|| ''`) in `api/lib/auth.js` is a latent misconfig risk - flag only under a Security-focus day and only as defense-in-depth.
- `sw.js` still on `telos-v1`; CLAUDE.md notes a cache bump is backlogged. Fix pairs naturally with the `cache.addAll` fragility bug.
