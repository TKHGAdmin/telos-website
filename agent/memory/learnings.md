# Telos Bug Hunter — Learnings

Rolling knowledge base. Compress older entries when this file exceeds 2000 lines.

## Codebase orientation

- Stack: pure HTML/CSS/JS, no build step, Vercel static + serverless functions.
- Data: Upstash Redis via REST (no npm SDK).
- Two dashboards are self-contained (thomas.html, client-dashboard.html) — they do NOT load main.js or the shared stylesheet.
- Auth cookies: admin uses `telos_dash_session` (2-part token, SameSite=Strict), client uses `telos_client_session` (3-part token, SameSite=None; Partitioned for Whop iframe).
- Clean URLs (`vercel.json` cleanUrls). Internal links must not carry `.html`.
- CSS version string on `<link>` tags is a manual cache-buster; bump on every style.css change.

## False-positive patterns to avoid

_(Populated by denials. Empty on first run.)_

## Confirmed real-bug patterns

_(Populated by approvals. Empty on first run.)_

## Notes from run 001 (2026-07-24, Functional focus)

- Bootstrap run. No memory files existed, no prior reports. Created scaffold.
- Recent commits (`f5cb8c4` back through `ad1427a`) are heavy on shop/product/cart work - an area worth extra scrutiny in the next few runs while it's still settling.
- `.claude/` is a directory that already existed at repo root - do not touch.

### Reported (4 findings)

- 20260724-01 P1 product.html grid mismatch (3 kids in 2-col grid)
- 20260724-02 P2 XFF rate-limit bypass across all 3 public POST endpoints
- 20260724-03 P2 client-portal.js:117 hijacks another client's email mapping
- 20260724-04 P3 clients.js DELETE leaves orphan client_email + log keys

### Held for Security-focus rotation (day 3)

Verified real but out of Functional scope; will surface on the security day:

- `api/client/reset-password.js` - request-token branch has NO rate limit. Enables enumeration + Resend quota drain + victim inbox spam.
- `api/lib/auth.js:27` - `signature !== expected` on HMAC hex. Sister file `client-auth.js:49` already uses `crypto.timingSafeEqual` correctly. Inconsistent.
- `api/client/food-search.js` - no rate limit, forwards to Open Food Facts under Telos's egress IP. OFF throttle risk.
- Also revisit: `req.headers['x-forwarded-for']` is untrusted everywhere - grep for other consumers before day 3.

### Areas already surveyed (won't re-hunt for 7+ days unless commits touch them)

- Shop / product / cart integration (js/shop.js, shop.html, product.html)
- Admin dashboard auth surface (all /api/dashboard/*.js gated correctly)
- Client dashboard endpoints (all use signed cookie, no IDOR)
- Cron endpoints (weekly-summary, engagement-check) - CRON_SECRET fail-closed
- Password reset token lifecycle (32 bytes, SETEX 1hr, single-use)

### Things not covered yet (candidates for future runs)

- Quiz logic (js/quiz.js, 443 lines) - untouched today
- Client dashboard PWA UI (client-dashboard.html, 278KB) - untouched today
- Thomas dashboard UI (thomas.html, 161KB) - untouched today
- Blog article HTML files (23 of them in /blog/)
- Service worker (sw.js) - cache invalidation, notification click handling
- Vercel routing (vercel.json cleanUrls + headers)

### Verification discipline (locked in for future runs)

- Every subagent finding MUST be re-read at exact file:line before entering the report.
- Low-confidence subagent findings default to EXCLUDED unless manual verification promotes them.
- Zero-bug reports are honest; padding to look busy would poison decisions.jsonl.
- Rate the security implications separately - a rate-limit bypass on a public form is functional (feature doesn't work) AND security (abuse vector). Include on Functional day only if it's clearly a "code doesn't do what it says" logic error, not a pure attack vector.
