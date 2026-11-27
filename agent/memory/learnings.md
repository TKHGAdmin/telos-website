# Bug Hunter Learnings

Running knowledge the agent accumulates across runs. Compressed when past 2000 lines.

## 2026-11-27 (first run, focus: security)

### Patterns noticed
- `esc()` in `thomas.html:731` uses `createTextNode` + `innerHTML` - this escapes `<`, `>`, `&` but NOT `'` or `"`. Any interpolation into an attribute's JS string context (e.g., `onclick="fn('...')"`) that uses `esc()` alone is an XSS vector when the value is user-controlled. Flagged occurrence: `addLeadFromEmail('...')`. The quiz row uses `JSON.stringify(JSON.stringify(s))` which is the correct pattern.
- Public submit endpoints (`/api/submit-quiz`, `/api/submit-email`, `/api/submit-chs-application`) use `req.headers['x-forwarded-for']` as-is for rate-limit keys. Vercel's X-Forwarded-For can contain multiple IPs; if attackers can manipulate it to vary per request, rate limits are bypassable. Not confirmed exploitable today - worth testing against the live Vercel deployment next security rotation.
- Client-facing endpoints that are authentication-related (`/api/client/login`, `/api/client/reset-password`, `/api/dashboard/login`) have NO rate limiting. Public submission endpoints do. Inconsistent.
- Admin auth cookie uses `SameSite=Strict` (good). Client auth uses `SameSite=None; Partitioned` (required for Whop iframe - documented tradeoff).
- `verifyToken` in `api/lib/auth.js:27` compares HMAC signatures with `!==` instead of `crypto.timingSafeEqual`. Client auth lib uses timingSafeEqual correctly. Minor inconsistency - timing-attacking a SHA-256 HMAC over a network is impractical, but worth cleaning up.

### Code areas explored (first time)
- `api/lib/auth.js`, `api/lib/client-auth.js`, `api/lib/redis.js`
- All `api/submit-*.js` public endpoints
- `api/client/login.js`, `api/client/reset-password.js`, `api/client/notify.js`, `api/client/send-email.js`, `api/client/food-search.js`, `api/client/sidemenu.js`
- `api/dashboard/login.js`, `api/dashboard/upload-video.js`
- `thomas.html` innerHTML sinks (leads/CHS table rendering)
- `vercel.json` CORS and cron configuration

### False-positive patterns avoided
- Admin-controlled content flowing into client-facing HTML (coach-set mindset, resources, sidemenu custom panels): admin is trusted, so stored admin-to-client HTML is intentional per CLAUDE.md design, not a bug.
- `req.query.type` being user-controlled in `upload-video.js`: route is behind admin auth, so admin can already upload whatever they want.
- Resend/Blob API keys: all referenced via `process.env.*` - no committed secrets. `.gitignore` covers `.env*.local`.

### Next rotation hints
- Functional (tomorrow): trace the quiz flow through `js/quiz.js` -> `/api/submit-quiz` -> `/thomas` leads tab end-to-end. Check CHS application detail modal. Check client dashboard training log for the P1 backlog bug around `todayStr()` UTC timezone.
- Review the `x-forwarded-for` rate-limit bypass hypothesis against live Vercel headers.
