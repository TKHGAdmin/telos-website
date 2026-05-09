# Bug Hunter Learnings

Accumulated knowledge from daily runs. Keep under 2000 lines; compress old
entries when nearing the cap.

## Codebase shape (orientation)

- Pure HTML/CSS/JS site on Vercel + Upstash Redis (REST). No build step,
  no test suite, no `npm test`. Functional bugs must be found via code trace.
- Two auth systems: admin (`api/lib/auth.js`, cookie `telos_dash_session`,
  HMAC-signed `{expires}.{sig}`) and client (`api/lib/client-auth.js`, cookie
  `telos_client_session`, HMAC-signed `{clientId}.{expires}.{sig}`). Client
  passwords use PBKDF2-SHA512 100k iterations. Both verifiers use
  `crypto.timingSafeEqual` for password and (for client) signature
  comparison; admin signature comparison is plain `!==` (string-time, but
  HMAC over a 256-bit secret).
- Redis access via `api/lib/redis.js` — single REST endpoint, command + args.
  Pipeline returns array of `{ result | error }` per command.
- ID generation: `INCR id:{collection}` for monotonic int IDs (clients,
  leads, adspend, modules). CHS applications use `chs_{ts}_{rand}` strings.
- Dual-write index pattern: every primary `entity:{id}` blob is mirrored in
  `<entity>_index` ZSET (score = createdAt epoch, member = id). Time-keyed
  per-client data uses `client_<thing>:{clientId}:{YYYY-MM-DD}` plus
  `client_<thing>_index:{clientId}` ZSET (score = date epoch, member = date
  string).

## Patterns that produce real bugs

### Index/lookup desync on mutation
Whenever code writes both a primary record and a secondary index/lookup,
check every mutation path (POST, PUT, DELETE) for cleanup. `clients.js`
DELETE (BUG-20260509-1) misses the `client_email:` reverse lookup and the
per-client time-keyed data. `adspend.js` PUT (BUG-20260509-3) misses the
score refresh when `date` changes. `modules.js` DELETE is the gold-standard
counterexample — fully cascades through `course_modules_index`,
`course_series:*`, `course_pillars:*`.

Hunt heuristic: grep for every place a `_index` ZADD or a reverse-lookup
SET happens, then look at the corresponding DELETE/PUT in the same file.

### UTC date strings vs. user-local "today"
The codebase consistently uses `new Date(now - d*86400000).toISOString()
.split('T')[0]` for daily keys. CLAUDE.md notes this UTC-bias as a known
limitation in client streak logic. The cron in `weekly-summary.js`
inherits the same model — combined with Monday 14:00 UTC scheduling, that
makes the "today" slot reliably empty when the email is generated, breaking
the streak-from-today loop (BUG-20260509-2). When you see "loop from d=0",
ask: at the time this code runs, is the d=0 slot likely populated yet?

### Status filters vs. portal-enabled vs. email lookup
`client_email:{x}` is only written when `client-portal.js` POST runs with
`enabled: true`. It's deleted on `enabled: false`. It's NEVER touched by
`clients.js` POST/PUT/DELETE. Several flows assume the lookup tracks the
current email — be skeptical of that assumption and trace every email-mutation
path.

## False positives to avoid

(Empty — populate as denials accumulate in `decisions.jsonl`.)

## Areas not yet explored in depth

- `js/main.js` (nav/scroll/animation interactivity) — only skimmed.
- Inline JS inside `client-dashboard.html`, `thomas.html`, `pricing.html`,
  `chs.html`. These are the largest behavior surfaces.
- All 23 blog pages (probably low signal — static HTML).
- `sw.js` (service worker push handling, cache strategy).
- Module/learning content endpoints (`api/client/modules.js`,
  `api/client/module.js`, `api/client/module-progress.js`).
- Vercel Blob upload paths in `upload-video.js` (filename traversal? mime
  mismatch?).

## Prior runs

- 2026-05-09 (Functional, first run) — 3 bugs reported (1 P1 client DELETE
  orphan, 1 P1 weekly-summary streak, 1 P2 adspend PUT score). Bootstrapped
  agent infra (memory + reports + schema) on this run.
