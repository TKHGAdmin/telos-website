# Telos Bug Hunter — Learnings

Accumulated knowledge across runs. Updated by the agent at the end of each run.
Keep under 2000 lines. Compress older entries if needed.

---

## Report schema (used in this run — docs/BUG_REPORT_SCHEMA.md was absent)

A canonical schema file was not found under `docs/`. Hard rules forbid writing
outside `agent/`, so the agent currently uses the following Markdown layout for
each daily report at `agent/reports/YYYY-MM-DD.md`:

```
# Telos Bug Hunter — <YYYY-MM-DD>

- **Focus:** Functional | Visual/UX | Performance | Security
- **Findings:** <count>
- **Zero-bug?** yes | no

## <severity> — <short title>  <!-- one block per finding -->

- **ID:** YYYY-MM-DD-NN
- **Severity:** P0 | P1 | P2 | P3
- **Area:** api/.../file.js  (or client-dashboard.html, etc.)
- **Lines:** `path/to/file.js:LINE[-LINE]`

### What's wrong
Short description of the defect.

### Reproduce
Step-by-step reproduction, pointing to exact code or user actions.

### Impact
Who feels this, how often, how badly.

### Suggested fix
Minimal change that resolves it (code sketch encouraged).
```

If `docs/BUG_REPORT_SCHEMA.md` is later added, prefer it and record the
switch here.

---

## Repository map notes

- Pure HTML/CSS/JS, no build step, hosted on Vercel.
- Serverless functions under `api/*` and `api/{dashboard,client,cron}/*`.
- All persistence is Upstash Redis via the REST client in `api/lib/redis.js`.
- Admin auth: `api/lib/auth.js` (HMAC cookie, SameSite=Strict).
- Client auth: `api/lib/client-auth.js` (PBKDF2 hashing, SameSite=None+Partitioned
  for Whop iframe embedding).
- Thomas dashboard (`thomas.html`) and client dashboard (`client-dashboard.html`)
  are self-contained (no shared CSS/JS). `js/main.js` is only loaded on public
  marketing pages.

## Known limitations (per CLAUDE.md) — DO NOT re-flag

- Whop iframe cookie blocking on Safari/iOS (documented, no server fix).
- `.html` extensions still present in some internal `<a href>` attributes
  (listed as a P1-P3 backlog item in CLAUDE.md).
- `todayStr()` UTC-timezone bug in client-dashboard streak math (backlog item).
- Tool pages missing `main.js` in older copies (backlog).
- SW cache name bump pending (backlog).

Only re-flag if a new, concrete symptom appears beyond what's already catalogued.

## False-positive patterns to avoid

- Shopify Storefront Access Tokens are PUBLIC by design — the token in
  `js/shop.js:15` is not a secret leak.
- `innerHTML` of `product.descriptionHtml` from Shopify is admin-controlled
  copy (Thomas owns the store). Not an XSS risk from an attacker.
- Rate-limit race conditions on `INCR`+`EXPIRE` pairs are standard and
  acceptable at this scale.

## Open questions / things to look at next

- `handleLogout` fires-and-forgets the POST but then unconditionally shows the
  login screen; if the server returns 500 the cookie isn't cleared.
- Password reset in `api/client/reset-password.js` does not invalidate existing
  sessions — a stolen cookie keeps working after the password changes.
- `api/client/notify.js` returns 200 "queued" when VAPID keys are missing, and
  returns 200 "warning: delivery uncertain" when the raw POST to the push
  endpoint fails. The admin's UI probably treats both as "sent".
- Several POST handlers (`client/login.js`, `client/reset-password.js`,
  `client/daily-log.js`, etc.) crash to 500 "Internal error" if `req.body` is
  undefined (non-JSON content-type) — they should return 400.

## First-run notes

- Agent infrastructure directories (`agent/`, `agent/memory/`,
  `agent/reports/`) and bootstrap files were created on 2026-10-06.
- No prior reports or decisions to compare against; confidence is being kept
  intentionally conservative.
