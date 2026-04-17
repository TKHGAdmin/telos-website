# Bug Hunter Learnings

Accumulated knowledge across runs. Kept under 2000 lines.

## Codebase map (high-level)

- Pure HTML/CSS/JS static site on Vercel. No build step.
- Vercel serverless functions under `/api/` backed by Upstash Redis (REST).
- Two auth systems: admin (`lib/auth.js`, cookie `telos_dash_session`) and client (`lib/client-auth.js`, cookie `telos_client_session`). Admin is HMAC of expiry only; client token is `{clientId}.{expiry}.{sig}`.
- Client data keyed by date strings derived from `new Date().toISOString().split('T')[0]` (UTC). CLAUDE.md calls out this known UTC/timezone issue for streaks.
- Two cron jobs: `weekly-summary` (Mon 14:00 UTC) and `engagement-check` (daily 15:00 UTC). Both gated by `CRON_SECRET` and skip gracefully if `RESEND_API_KEY` is unset.

## Patterns observed

- Admin endpoints consistently use `if (!verifySession(req)) return 401` at the top. Client endpoints use `verifyClientSession(req)`. No endpoint seen bypasses auth incorrectly.
- Public POST endpoints (`/api/submit-*`) use per-IP rate limits keyed off `x-forwarded-for || x-real-ip || 'unknown'`. Ceiling handled by `INCR` + `EXPIRE` on first increment.
- CRUD resources follow the pattern: primary `resource:{id}` hash + `resource_index` ZSET keyed by timestamp for reverse-chrono listing. Most DELETE handlers remove both the primary key and the index entry.

## Known pitfalls to avoid reporting as bugs

- `.html` extensions in internal links on tool pages and blog — acknowledged P1-P3 backlog in CLAUDE.md.
- `todayStr()` using UTC in `client-dashboard.html` — acknowledged backlog item.
- Service worker cache version bump needed — acknowledged backlog item.
- `api/client/notify.js` placeholder push implementation without RFC 8291 encryption — deliberately gated on VAPID env vars; documented TODO, not a bug.
- Coach-supplied HTML (side-menu `content`, training notes, mindset) rendered as innerHTML. This is intentional: coach is trusted. Do NOT flag as XSS.
- Pricing page `p-*` inline styles are intentional per CLAUDE.md — not a duplication bug.

## First-run notes (2026-04-17)

- No prior reports or decisions yet; running cold with no feedback signal.
- Starting conservative: only high-confidence, reproducible bugs with a clear user or admin impact.
- Bootstrap created: `agent/memory/focus-rotation.json`, `agent/memory/decisions.jsonl`, and this file.
- Rotation seeded Functional → Visual/UX → Performance → Security.
