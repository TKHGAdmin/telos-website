# Telos Bug Hunter — Learnings

Accumulated knowledge from daily runs. Keep under 2000 lines; compress older entries into a summary when it grows.

---

## 2026-10-26 — First run (Functional focus)

### Infrastructure gap
The scheduled task fired, but none of the referenced agent infrastructure existed in-repo:
- `agent/memory/` and `agent/reports/` did not exist
- `agent/memory/focus-rotation.json`, `decisions.jsonl`, `learnings.md` did not exist
- `docs/BUG_REPORT_SCHEMA.md` did not exist

I bootstrapped the memory + reports dirs myself and improvised the report schema. The run notification flags this to Thomas so he can either define the schema or confirm the one I used.

### Codebase shape (first exploration)
- Static site: 10 top-level HTML pages (`index`, `pricing`, `chs`, `product`, `shop`, `resources`, `privacy`, `terms`, plus `thomas` and `client-dashboard` which are self-contained apps). 23 blog posts under `/blog/`.
- API: 43 Vercel serverless functions under `/api/` split into `dashboard/` (admin, HMAC cookie auth), `client/` (client PBKDF2 + HMAC cookie auth), and `cron/` (CRON_SECRET).
- Shared auth helpers in `api/lib/auth.js` (admin) and `api/lib/client-auth.js` (client). PBKDF2 100k iters SHA-512 for client passwords.
- Shopify Buy SDK v3 wired via `js/shop.js` (public Storefront token in source — expected pattern, not a bug).
- CLAUDE.md documents a known P1-P3 backlog from April 2026: tool pages missing main.js, `.html` in internal links, `todayStr()` UTC bug, SW cache version bump. I did not re-flag these.

### Patterns observed (good)
- All 38 auth-protected endpoints correctly call `verifySession` or `verifyClientSession` at the top. Only `login`/`logout`/`reset-password` endpoints lack a session gate (correctly).
- Public submit endpoints (`submit-quiz`, `submit-email`, `submit-chs-application`) all implement `INCR` + `EXPIRE` rate limiting keyed on IP.
- Client-side `thomas.html` consistently escapes untrusted strings through its `esc()` helper before injecting into HTML.
- Client auth (`api/lib/client-auth.js`) uses `crypto.timingSafeEqual` for signature verification.

### Patterns observed (less good — candidates for future hunts)
- Admin auth (`api/lib/auth.js`) uses raw `!==` for HMAC signature comparison and leaks password length via early-return before `timingSafeEqual`. Inconsistent with client auth.
- `js/shop.js` concatenates Shopify-provided URLs directly into HTML attributes, including a single-quoted onclick handler. Low real-world risk, pattern is unsafe-by-construction.
- Cache-bust versioning on scripts is inconsistent across pages (`main.js?v=2` on most, bare `main.js` on `chs.html`; `shop.js?v=1` on `shop.html` vs `?v=2` on `product.html`).

### False-positive guardrails
- Don't flag the Shopify Storefront token in `js/shop.js` line 15 — it is a public read-only token and must be client-side.
- Don't flag the `todayStr()` UTC bug — already in the documented backlog.
- Don't flag the SW cache name `telos-v1` not being bumped — already in the documented backlog.
- Don't flag the Whop/Safari iframe cookie issue — documented known limitation.

### Open questions for Thomas
1. Does the agent schema (`docs/BUG_REPORT_SCHEMA.md`) exist in another repo, or should I define it here?
2. The `agent/` dir is now committed into the main repo — is that where you want it, or should it live elsewhere?
