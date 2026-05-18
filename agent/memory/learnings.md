# Telos Bug Hunter — Learnings

Append-only knowledge base. Compress when it exceeds ~2000 lines.

---

## 2026-05-18 — First run, Functional focus

**Codebase map (key entry points for future runs)**:

- `api/lib/auth.js` — admin session (HMAC, 7-day cookie `telos_dash_session`).
- `api/lib/client-auth.js` — client portal session (PBKDF2 + HMAC, cookie `telos_client_session`).
- `api/lib/redis.js` — Upstash REST client. No npm deps. `redis(cmd, ...args)` and `redisPipeline(cmds)`.
- `api/submit-quiz.js`, `submit-email.js`, `submit-chs-application.js` — public form endpoints, all rate-limited via Redis INCR.
- `api/cron/*` — guarded by `Bearer ${CRON_SECRET}` header check, fail-closed if env unset.
- `api/dashboard/*` — guarded by `verifySession(req)`.
- `api/client/*` — guarded by `verifyClientSession(req)`.

**Redis key conventions** (matches CLAUDE.md):
- `client:{id}` stores the full client object including `passwordHash`, `passwordSalt`, `portalEnabled`, `status`, `email`.
- `client_email:{normalizedEmail}` → clientId — set/deleted by `dashboard/client-portal.js` on enable/disable, and updated by `dashboard/clients.js` PUT when email changes.
- `clients_index` ZSET scored by createdAt.

**Recurring patterns to watch**:

- **UTC date drift**: All daily-keyed endpoints derive the date string via `new Date(now - i*86400000).toISOString().split('T')[0]`. This is UTC, not local. Anything that says "today" or computes a streak at boundary times (late evening US, early morning UTC cron) is suspect. CLAUDE.md notes this is a known limitation in the client dashboard, but the same pattern exists server-side in crons.
- **Lifecycle cleanup**: Client deletion (`dashboard/clients.js` DELETE) only removes `client:{id}` and the index entry. Every other key keyed by clientId (logs, plans, supplements, 545, training, sidemenu, password resets, email lookup) is leaked. Worth scanning whenever a new key family is added.
- **Email enumeration discipline**: `reset-password.js` gets this right (always 200/`ok:true`). `client/login.js` does NOT — distinct error messages for portal-not-enabled, status-not-active, password-not-set, invalid-creds.
- **Cron dedup**: `engagement-check.js` runs daily but doesn't track per-client send timestamps. Any "send email when condition X" cron that runs more often than the natural cadence of condition X is a duplicate-send candidate.

**Files explored this run**: `api/lib/*`, `api/submit-*.js`, `api/cron/*`, `api/client/{login,reset-password,daily-log,training-log,food-search}.js`, `api/dashboard/{login,clients,client-portal}.js`, `vercel.json`.

**Not yet explored** (queue for future runs):
- `api/dashboard/{pipeline,revenue,content,adspend,modules,analytics,upload-video,delete-video,chs-applications,stats,submissions,emails,logout}.js`
- `api/client/{me,nutrition-{plan,log},mindset,resources,five-four-five,training-program,sidemenu,modules,module,module-progress,notify,push-{subscribe,unsubscribe},send-email,activity-log,supplements,supplement-log}.js`
- All HTML pages (index, pricing, chs, protein-calculator, hyrox-predictor, resources, thomas, client-dashboard)
- `js/main.js`, `js/quiz.js`, `sw.js`
- Blog directory (23 articles)
- `manifest.json`

**False-positive risks noted (avoid in future)**:
- Length-check before `crypto.timingSafeEqual` in `auth.js:55` leaks password length — but this is the standard workaround for the function's throw-on-length-mismatch behavior. Not a real bug, don't re-flag.
- `client.notes` and `client.name` are written directly into HTML strings in cron emails. The data source is the admin, so the trust boundary is internal. Don't flag as XSS unless a client-controlled field flows into an HTML context.
- The HMAC in `auth.js` is over a publicly-predictable timestamp, but the secret is server-only. The `!==` comparison on line 27 is a defense-in-depth gap, not a practical attack. Already noted; don't repeatedly re-flag at P0/P1.
