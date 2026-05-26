# Telos Bug Hunter — Learnings

Running log of patterns, false-positives, and codebase notes. Compress entries older than ~60 days into the **Summary** section once this file exceeds 2000 lines.

---

## Summary (compressed)

_Empty — first run was 2026-05-26._

---

## Codebase notes

### 2026-05-26 — first run, oriented around recent shop work
- The site is plain HTML/JS/CSS on Vercel. No build step, no framework, no test suite. **`npm test` is not available** — there is no `package.json` script for it. Don't waste a run pretending to lint.
- `package.json` is minimal — no dev dependencies. Static analysis means reading files. `tsc --noEmit` not applicable (no TypeScript in the public app; only ad-hoc JS).
- `js/shop.js` + `shop.html` + `product.html` were added in the last week (commits `ad1427a` → `f5cb8c4`). Lots of fresh code → high signal area for functional bugs.
- The Shopify Storefront API token in `js/shop.js` is **public by design** (per Shopify docs). Do NOT flag it as a leaked secret — it goes client-side intentionally. Server-only would be the Admin API token; this is the storefront one (read-only, scoped, rate-limited).
- `CLAUDE.md` lists a known P1-P3 backlog. **Don't re-flag** items already on that list:
  - tool pages missing `js/main.js`
  - `.html` extensions in internal links (e.g. `index.html#how-it-works`)
  - `todayStr()` UTC timezone bug in client-dashboard streaks
  - SW cache version bump pending
- Whop iframe / Safari third-party cookie issue is documented as a Known Limitation — not a bug.

### Patterns worth watching
- **Cron jobs without dedupe**: `engagement-check.js` re-sends to inactive clients every day. Look for the same shape in any future "notification" cron (push, email).
- **Quiz / form gating that relies on client-side localStorage**: `pricing.html` gate is bypassable any time the JS click-handler skips validation. If new gated content gets added, check the validation path.
- **Form buttons typed as `type="button"`** combine with HTML5 `required` to produce inert validation. The browser only enforces `required` when something triggers `form.submit()` or a `type="submit"` button is clicked. Whenever you see `type="button"` next to `required` inputs, read the JS handler.
- **`new Date(...).toISOString().split('T')[0]`** is used in cron jobs to compute "today" — this is UTC, not the client's local timezone. Already documented as an open bug for the client dashboard streak; cron code has the same pattern but cron running in UTC is at least internally consistent for server-side aggregations.

### False-positive patterns (don't re-report)
- Shopify Storefront token committed to `js/shop.js` (designed public).
- `.html` extensions on links (already on the documented backlog).
- Tool pages missing `js/main.js` (already on the documented backlog).
- The 3-part vs 2-part cookie token shape difference between admin and client auth (intentional — client cookies are `SameSite=None; Partitioned` for Whop iframe).

---

## Open questions for future runs
- The `submit-quiz.js` rate-limit uses raw `x-forwarded-for`. Vercel rewrites this header, so spoofing isn't possible — but if multiple proxies are introduced later, the comma-separated chain becomes a different rate-limit bucket per chain. Watch for that if Vercel routing changes.
- No automated test suite. If one ever lands, run it on every focus day regardless of rotation.
- The Resend "from" address (`noreply@telosathleticclub.com`) — confirm domain authentication is set up; otherwise weekly summary + engagement emails may go to spam. Out of scope for a code review, but worth raising once.
