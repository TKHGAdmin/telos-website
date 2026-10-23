# Telos Bug Hunter — Accumulated Learnings

Running log of patterns, false-positive filters, and codebase knowledge gathered across daily runs.
Keep under 2000 lines; compress older entries into summaries as needed.

---

## Codebase map (what I've explored)

### 2026-10-23 — initial sweep (Functional focus)

- **Repo**: pure HTML/CSS/JS static site + Vercel serverless functions. No build step, no npm deps (one devDep: `serve`).
- **Server code** lives entirely under `api/` — three groups:
  - `api/*.js` — public submission endpoints (quiz, email capture, Charleston application). Rate-limited by IP via Redis INCR+EXPIRE.
  - `api/dashboard/*.js` — admin endpoints, gated by `verifySession` (HMAC-signed `telos_dash_session` cookie, 7-day).
  - `api/client/*.js` — client portal endpoints, gated by `verifyClientSession` (3-part token `clientId.expiry.sig` in `telos_client_session`).
  - `api/cron/*.js` — Vercel cron jobs, gated by `Authorization: Bearer ${CRON_SECRET}`.
- **State** is entirely in Upstash Redis via a tiny REST client in `api/lib/redis.js`. Keys follow namespaced colon-separated patterns (`client:{id}`, `client_email:{normalizedEmail}`, `client_dailylog:{clientId}:{YYYY-MM-DD}`, etc.) with ZSET indexes for ordering.
- **Auth**: admin uses `SameSite=Strict`; client uses `SameSite=None; Partitioned` to survive Whop iframe. PBKDF2-SHA512, 100k iters for client passwords. HMAC-SHA256 for session signatures.
- **Pages**: 10 top-level HTML pages + 23 blog posts under `/blog/`. Only `index.html` loads the page-load fade-in; other pages must opt in. `thomas.html` and `client-dashboard.html` are self-contained (no shared `main.js`/`style.css`).

### Key invariants worth remembering

- The `client_email:{normalized}` key uniquely maps a login email to a `client:{id}`. Any flow that touches client email changes MUST update this map; any delete flow MUST remove it to keep "Email already in use" from firing on re-create.
- `verifyClientSession` only validates the token signature + expiry. It does NOT re-check `client.status` or `client.portalEnabled` on each request. Access revocation thus requires either a logout, 7-day cookie expiry, or a complementary status check inside each endpoint.
- CORS is `*` on `/api/submit-*` by design (public pages from any origin can POST). Those endpoints never read cookies, so classic CSRF via auth is not applicable there.
- `vercel.json` sets `maxDuration: 60` for all api functions and runs two crons (`weekly-summary` Mon 14:00 UTC, `engagement-check` daily 15:00 UTC). CLAUDE.md's "9am ET" is 14:00 UTC during EST only — in EDT this fires 10am ET. Not necessarily a bug but worth watching if the user complains about send time.

### False-positive patterns to avoid

- **"CORS wildcard = vulnerability"** on `/api/submit-*`: not here — those endpoints are stateless, cookie-less, and rate-limited by IP. Reporting it as a bug would be noise.
- **"Admin-controlled HTML interpolation"** in `send-email.js`, `weekly-summary.js`, `reset-password.js` client-name splat: the admin controls client names, so this is XSS-into-your-own-email at worst. Low-signal to report unless we discover a vector where an untrusted party controls a value.
- **"Missing CSRF token on dashboard endpoints"**: cookies are `SameSite=Strict` on admin, so classic cross-site POST is already blocked. Reporting the absence is noise.
- **`body.date` parsed via `new Date(body.date).getTime()`** for `YYYY-MM-DD`: this is UTC midnight, which is slightly off from local wall-clock but used symmetrically everywhere. Only flag it if a cross-timezone user reports streaks resetting mid-day. CLAUDE.md already acknowledges a `todayStr()` UTC timezone issue in the P1-P3 backlog.

### Patterns to hunt next

- Deletes that only remove the primary record and forget the auxiliary keys (ZSET indexes, lookup maps, logs). I confirmed one in `clients.js`; look for the same shape in `chs-applications` (clean), modules admin, pipeline admin, content admin.
- Endpoints gated only by session-token signature without a per-request status recheck. Confirmed as a class problem in 20+ `api/client/*` files.
- Public rate-limit keys using `x-forwarded-for` whole — Vercel typically forwards a comma-separated list. First IP is the real client; the whole string is still unique enough to work, but a shared NAT and the quoted header form could produce split buckets. Low priority.

---

## Daily entries

### 2026-10-23 (Functional)

- Discovered the DELETE handler shape issue in `api/dashboard/clients.js` and the session-recheck gap in `api/client/*`. Reported as D1 and D2.
- Noted a minor race in `js/quiz.js` where tapping two options inside the 400ms auto-advance window double-adds pillar points. Reported as D3.
- Did NOT report: no rate limit on `/api/dashboard/login` and no rate limit on `/api/client/reset-password`. Both are legitimate findings but belong to the Security focus day (mod 4 == 3). Noted here so I don't double-report them when that day rolls around; if they're still present, re-raise them then with a proper severity framing.
- Did NOT report: `weekly-summary.js` adds +10 per completed `ffs.tasks` entry with no cap, while `CLAUDE.md` says tasks are capped at 50%. The `Math.min(100)` cap hides this unless a client has >5 tasks. Can't be exercised today without wiring up admin + client flows together. Hold until I can verify what the client dashboard caps at vs what the email reports.
