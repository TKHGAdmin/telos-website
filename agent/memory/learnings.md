# Telos Bug Hunter — Learnings

This file accumulates patterns the agent has noticed across runs. Keep entries short and dated. Compress aggressively once the file exceeds ~2000 lines.

---

## 2026-05-31 (Run #1, security focus)

### Codebase orientation
- Pure HTML/CSS/JS site + Vercel serverless functions. No bundler, no test suite, no lockfile (`package.json` only declares `@vercel/blob`).
- Two auth surfaces: `api/lib/auth.js` (admin, single shared password, HMAC cookie) and `api/lib/client-auth.js` (per-client PBKDF2, HMAC cookie). They were written separately and have drifted apart in small ways — worth diffing them whenever either is touched.
- Public submission endpoints are `api/submit-{quiz,email,chs-application}.js`. All three share the same IP-based rate-limit pattern via Upstash `INCR` + `EXPIRE`.
- Cron jobs (`api/cron/*`) are correctly fail-closed against a missing `CRON_SECRET`.
- No hardcoded secrets found in the tracked source (all `process.env`).

### Patterns / heuristics
- **IP rate-limit pattern:** Vercel's `x-forwarded-for` includes any client-supplied prefix. Anything that uses it raw as a Redis key is bypassable. Vercel's `x-real-ip` is the trusted single client IP.
- **`innerHTML` audit shortcut:** `grep -n innerHTML client-dashboard.html`. Most uses are escaped through the `esc()` helper at line 1831. The exceptions worth re-checking each time anything new is added: the side-drawer `panel.content` (line 2749, intentional), `resource-card href` (line 4929, unescaped scheme), and any new `onclick="..."` strings that concatenate user data.
- **Auth library symmetry:** When one of `api/lib/auth.js` and `api/lib/client-auth.js` is changed, diff the other. Inconsistencies (e.g. timing-safe compare on one side, `!==` on the other) tend to be unintentional.
- **Email template HTML:** Both `reset-password.js` and `cron/*.js` build email HTML by string concatenation with `client.name` interpolated raw. Admin-XSS only, but flag if name field ever becomes user-editable.

### False-positive patterns to avoid
- The CORS `Access-Control-Allow-Origin: *` on `/api/submit-*` is **by design** — those endpoints are public marketing forms with no credentials. Don't flag.
- The "always return 200 on reset request" pattern in `reset-password.js` is **intentional** anti-enumeration — don't flag as "missing error reporting."
- `body-parser` is **disabled** on `upload-video.js` (`config.api.bodyParser=false`) so the request stream can be piped to Vercel Blob. Don't flag as "missing JSON parsing."
- Many client-dashboard `innerHTML` writes look scary in isolation but interpolate values through `esc()`. Trace the variable, not the call.

### Areas not yet explored
- Frontend JavaScript outside `client-dashboard.html` — `js/main.js`, `js/quiz.js`, the tool pages, individual blog files.
- Service worker (`sw.js`) cache versioning vs. content updates.
- The 23 blog files under `blog/`.
- Vercel project settings (we can't see them from the repo).
- Browser-side behavior of the PWA in standalone mode.
- Whether the Charleston rate limit (`ratelimit:chs:{ip}`) actually fires under load — same x-forwarded-for issue as the others.

### Open questions for the operator
- Is `DASHBOARD_PASSWORD` long/random, or is it a memorable phrase? The brute-force finding is much more urgent if the latter.
- Are there ever legitimate reasons to embed `/thomas` in an iframe? (Assumed no — flagged clickjacking as P3 with `frame-ancestors 'none'`.)
