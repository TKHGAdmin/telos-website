# Telos Bug Hunter - Accumulated Learnings

> This file holds patterns, false-positive avoidance notes, and codebase landmarks picked up across runs.
> Keep under 2000 lines - compress older entries into summaries once exceeded.

---

## Bootstrap notes (2026-11-03, first run)

- `agent/` scaffolding was created on this run. Prior to today there was no memory, no prior reports, and no `decisions.jsonl` content.
- `docs/BUG_REPORT_SCHEMA.md` referenced in the agent instructions does **not** exist in the repo. Hard rule 2 restricts writes to `agent/memory/` and `agent/reports/`, so I did not create it. Today's report uses a pragmatic self-describing format - Thomas should either add the schema or let the current report shape become the convention.
- `vercel.json` has cleanUrls: true, 60s function maxDuration, two crons (weekly-summary Mon 14 UTC, engagement-check daily 15 UTC).
- Repo pages beyond CLAUDE.md's docs: `coaches.html`, `product.html`, `shop.html`, `set-password.html` exist and aren't in the project-structure block of CLAUDE.md. CLAUDE.md is out of date on structure (not a bug, but worth noting when auditing).

## Codebase landmarks

- Auth: two cookie systems. Admin (`telos_dash_session`, SameSite=Strict, 2-part token) via `api/lib/auth.js`. Client (`telos_client_session`, SameSite=None; Partitioned, 3-part token) via `api/lib/client-auth.js`.
- `verifyToken` in `api/lib/auth.js` uses non-timing-safe `!==` for HMAC compare (line 27). `verifyClientToken` in `client-auth.js` uses `crypto.timingSafeEqual`. Inconsistent - note it, but HMAC-signature timing attacks are impractical over the public internet so this is at best P3 and better saved for the security-focus day.
- `client_email:{normalized}` lookup is only populated when a client's portal is enabled, not when the client row is created. Any correctness logic that relies on it being present after client creation is wrong.
- Public form rate limits (chs/quiz/email) use `req.headers['x-forwarded-for']` as the rate-limit key verbatim. Vercel appends the client IP to the header, so an attacker can prepend a random IP to vary the key and bypass the limit. Reserve for the security day.
- Client logs are keyed by `YYYY-MM-DD`. `new Date(dateStr).getTime()` on a YYYY-MM-DD string = UTC midnight. For sort order within the ZSET this is fine; CLAUDE.md already acknowledges a related UTC bug in client-dashboard streak math as known.
- Email HTML construction (reset-password.js, send-email.js, both crons) all interpolate `client.name` into HTML without escaping. Client name is set by the admin, so it's an admin-trust surface, not a public injection vector. Only flag if an admin-created template path is exposed to untrusted input.

## False-positive patterns to avoid

- Don't flag "non-timing-safe HMAC compare" as high severity. Hard to exploit against a signature over an HTTPS connection; low practical risk.
- Don't flag "email in User-Agent" for `api/client/food-search.js` - that's the public business email per CLAUDE.md.
- Don't flag "no CSRF token" on JSON-body endpoints that require `Content-Type: application/json` from a cookie that's SameSite=None; Partitioned. Browser same-site + CORS realistically block the common CSRF shapes. (Revisit on the security day with a concrete attack sketch.)
- Don't flag `credentials: 'same-origin'` as a bug - the client dashboard is served from the same origin as the API.
- Don't flag "no .html extension in internal link" - CLAUDE.md calls this out as the project convention under `cleanUrls: true`.

## Recurring unresolved items (reference by prior report date + title)

- 2026-11-03: Daily engagement reminders can spam a client every day they stay inactive (no last-sent-at suppression). Watch for a fix adding a `lastEngagementSentAt` field on the client record or a `client_engagement_sent:{id}:{date}` redis key.
- 2026-11-03: `api/dashboard/clients.js` POST never writes the `client_email:` lookup it checks, so the duplicate-email guard is a no-op for new clients.
- 2026-11-03: `api/dashboard/client-portal.js` POST overwrites `client_email:` without checking existing owner.
