# Telos Bug Hunter — Learnings

Append-only (compress >2000 lines). One section per run, newest at top.

---

## 2026-10-18 (Security — run 1, bootstrap)

### Codebase map (built from scratch — no prior reports)

- Pure HTML/CSS/JS static site + Vercel serverless functions. No frontend framework, no build step.
- Two completely parallel auth stacks:
  - **Admin:** `api/lib/auth.js` → `telos_dash_session` cookie → `{expires}.{sig}`. Guards `api/dashboard/*` and the two "admin triggers client action" endpoints `api/client/notify.js` and `api/client/send-email.js`.
  - **Client:** `api/lib/client-auth.js` → `telos_client_session` cookie → `{clientId}.{expires}.{sig}`. Guards every other `api/client/*` endpoint.
  - The two libs implement very similar logic — any inconsistency between them is a strong signal of a bug (that's how finding 3 surfaced).
- **Rate limiting pattern:** Redis `INCR` + conditional `EXPIRE 3600`. Used in all three `submit-*.js` endpoints and `nowhere else`. Any new sensitive endpoint should probably use it; absence of it in auth-adjacent endpoints is a red flag.
- Cron jobs auth via `Bearer ${CRON_SECRET}` header match (`api/cron/*.js:9`).
- Admin's `verifyPassword` is correctly timing-safe (`auth.js:52-59`) — the bug is one layer up in `verifyToken`.
- Client passwords: PBKDF2-SHA512, 100k iterations, 32-byte salt, 64-byte derived. Verify uses `timingSafeEqual`.
- Redis is Upstash via REST, no npm dep. All keys documented in `CLAUDE.md`.
- Only two public endpoints that accept user-supplied data stored in Redis long-term: `submit-quiz`, `submit-chs-application`. Both have server-side validation of a fixed shape.

### Patterns worth remembering

- `innerHTML` is used ~80 times across `js/*.js` and the two dashboards, but almost always on template literals of static content or `esc()`-wrapped values. The `esc`/`escapeHtml` helper exists; grep for places that build HTML without going through it.
- `shop.js:199,262` writes `product.descriptionHtml` from Shopify directly to the DOM. Shopify-sourced HTML has traditionally been considered trusted but it's a theme-authored field — flag only if Thomas ever lets a non-admin edit it.
- The Shopify Storefront token (`shop.js:15`) is **public by design**. Don't re-flag it.
- Client email names (`(client.name || '').split(' ')[0]`) are interpolated into email HTML without escaping. Admin-set today, so trusted. Would become unsafe if clients ever get a "change my name" endpoint.
- The admin dashboard (`thomas.html`) and client dashboard (`client-dashboard.html`) are self-contained — do NOT share CSS or JS with marketing pages. A bug in `main.js` won't affect them; a bug in them won't affect marketing pages.

### False-positive patterns to avoid

- Flagging the Shopify Storefront token as a leaked secret. It's a public token.
- Flagging `innerHTML` where the input is a known-safe template literal with no interpolation.
- Flagging email HTML built from admin-set fields (client name/tier/email) as XSS. Admin is the trust boundary.
- Flagging `x-forwarded-for` as spoofable — on Vercel the platform sets it.

### Open questions for next runs

- Does `api/dashboard/clients.js` paginate? If not, listing clients could be slow at scale (performance day).
- Service worker caches `/client-dashboard` HTML aggressively — bump `CACHE_NAME = 'telos-v1'` whenever that file changes, or stale UI will persist. CLAUDE.md calls this out as a known limitation.
- Mobile responsiveness of `thomas.html` (10 tabs) was not inspected — reserve for visual-ux day.
- `/api/dashboard/upload-video.js` accepts filename directly without path-traversal check beyond extension regex. Vercel Blob storage is scoped to the project so blast radius is limited, but worth re-inspecting.

### Memory discipline

- `decisions.jsonl` is empty — no approvals or denials to calibrate against yet. First-run findings must be strongest-signal-only. Precision > volume.
- Reports are scoped to `agent/reports/YYYY-MM-DD.md`. Schema lives in `docs/BUG_REPORT_SCHEMA.md`.
