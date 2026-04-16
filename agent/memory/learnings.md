# Accumulated Learnings

This file is the agent's self-authored playbook. It grows over time as the agent discovers patterns, gets feedback, and refines its approach.

**This file is written by the agent, for the agent. Thomas can read it to understand what the agent has learned, but should not edit it directly unless resetting.**

## Format

Each entry has a date, a category, and a lesson. Oldest at top. When this file exceeds 2000 lines, the agent compresses entries older than 30 days into a summary block.

## Entries

### 2026-04-16 - Initial state

No prior runs. Starting conservatively:
- Focus on high-confidence static analysis findings
- Do not report anything without a concrete file/line reference
- Prefer zero-bug reports over speculative bugs
- Learn the shape of the Telos Fitness codebase before expanding scope

Target areas to familiarize with on the first pass:
- Entry points (root page component, API routes, auth flow)
- Payment / checkout code (highest impact if broken)
- Any file ending in `.test.ts` or `.spec.ts` (understand what's already tested)

<!-- Agent: append new entries below this line -->

### 2026-04-16 - Codebase shape (functional focus, first pass)

- Stack: pure HTML/CSS/JS + Vercel serverless functions. No build step, no TypeScript, no test suite. `npm test` and `tsc --noEmit` are not options. `package.json` is effectively empty and there is no lockfile, so `npm audit` will not produce useful output on future Security days - hunt for exposed secrets / XSS / auth gaps manually instead.
- Redis access is via a bespoke REST wrapper at `api/lib/redis.js` rather than an npm client. Treat the wrapper as intentional; do not file findings about retry logic or dependency choice.
- Two separate auth systems: admin (`telos_dash_session`, 2-part token, `SameSite=Strict`) and client (`telos_client_session`, 3-part token, `SameSite=None; Partitioned`). Check which `verifySession` a handler imports before reasoning about who is allowed to call it.
- CLAUDE.md is the authoritative architecture doc. The "Known Limitations" and "P1-P3 backlog" (commit `7fa38ff`) list things that are already tracked: tool pages missing `main.js`, `.html` extensions in internal links, `todayStr()` UTC timezone bug in streaks, SW cache version bump. Do not re-file these.

### 2026-04-16 - Category: auth / client-email lookup (high-signal area)

The client portal's only source of truth for email uniqueness is `client_email:{normalizedEmail}` in Redis. That single key is touched in:
- Writes: `api/dashboard/client-portal.js:115-124`, `api/dashboard/clients.js:121-131`
- Reads: `api/dashboard/clients.js:70` (POST uniqueness), `api/client/login.js:24`, `api/client/reset-password.js:22`
- Deletes: `api/dashboard/client-portal.js:121-124` (only on portal disable)

Any write path that sets `client.email` without touching this key can create phantom collisions (see BUG-2026-04-16-001). Any delete path that removes a client record without removing this key creates orphan lookups (see BUG-2026-04-16-002). Rule for future runs: when reviewing anything in this area, grep `client_email:` across `api/**/*.js` and cross-check every write/delete pairs cleanly.

### 2026-04-16 - Category: false-positive patterns to avoid

- "Tool pages missing main.js" - already on the known backlog.
- "Internal links use .html extensions" - already on the known backlog.
- "Missing alt text on decorative images" - only worth filing if the image conveys meaning (hero photos, diagrams). Purely decorative SVGs with `aria-hidden` are fine.
- "Redis calls lack explicit retries" - the wrapper is intentionally minimal; Upstash handles transient errors.
- "Code could be more DRY / cleaner" - out of scope per the hard rules.
- "Non-timing-safe HMAC signature comparison in `verifyToken`" - `api/lib/auth.js:27` uses `!==` on HMAC hex output. Marginal over HTTPS. Do not file as a P-class bug unless a concrete attack is demonstrable.
- "todayStr() UTC vs local date in streaks" - already on the backlog, do not re-report.

### 2026-04-16 - Category: save for future rotations

- Security day: `api/client/reset-password.js` has no rate limit on the request-reset path. Anyone can flood a client's inbox with reset emails and burn Resend quota.
- Performance day: `api/dashboard/client-portal.js` parses the same `existing` blob three separate times inside PUT/POST. Static-analyzable win if bundling is ever introduced, but not a user-visible perf issue.
- Functional day (next cycle): verify `api/client/module.js:50` behavior when an admin saves a module with an empty `tierAccess` array - it currently rejects all clients with "lifestyle_plus required" which is misleading but only triggers on admin misconfiguration.
