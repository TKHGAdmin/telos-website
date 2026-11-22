# Bug Hunter — Accumulated Learnings

This file is the agent's long-term memory. Append new learnings; compress oldest entries when the file exceeds 2000 lines.

---

## 2026-11-22 (first run, Functional focus)

### Codebase map
- Telos is a pure HTML/CSS/JS static site + Vercel serverless functions. No framework, no build step.
- Public marketing pages: `index.html`, `pricing.html`, `chs.html`, `coaches.html`, `shop.html`, `product.html`, `set-password.html`, `privacy.html`, `terms.html`, `protein-calculator.html`, `hyrox-predictor.html`, `resources.html`.
- Blog: `/blog/*.html` (23 articles).
- Self-contained pages (own `<style>`, don't load `css/style.css` or `js/main.js`): `thomas.html`, `client-dashboard.html`, `coaches.html`.
- API: `api/` with sub-dirs `client/` (client portal), `dashboard/` (admin, requires `verifySession`), `cron/` (requires `CRON_SECRET`). Public submit endpoints at the top of `api/`.
- Auth: `api/lib/auth.js` (admin, HMAC + timing-safe password check) and `api/lib/client-auth.js` (client, PBKDF2 + HMAC token).

### Known limitations documented in CLAUDE.md (do NOT re-flag)
- Whop iframe on Safari/iOS: third-party cookies blocked. Documented workaround (direct URL / PWA).
- `todayStr()` UTC timezone bug in client-dashboard streaks (documented backlog item).
- Tool pages missing `main.js` (`protein-calculator.html`, `hyrox-predictor.html` — documented).
- `.html` extensions in internal links on some pages (documented).
- SW cache version bump needed (documented).

### Known-intentional design choices (not bugs)
- Shopify Storefront API token hardcoded in `js/shop.js` — Storefront tokens are designed to be public; protected by Shopify-side scopes.
- Supabase anon key in `set-password.html` — anon keys are public by design; protected by RLS policies.
- Admin dashboard (`thomas.html`) uses `SameSite=Strict`; client portal uses `SameSite=None; Partitioned` for Whop iframe embedding — this is intentional per CLAUDE.md.

### Patterns worth watching
- Multiple public `api/submit-*.js` endpoints share the same `x-forwarded-for` rate-limit pattern. Changes to IP parsing should be applied consistently to all three (`submit-chs-application.js`, `submit-email.js`, `submit-quiz.js`).
- Error messages in auth endpoints: compare against the OWASP enumeration pattern. The reset-password endpoint correctly returns success for all cases; the login endpoint does not.
- Standalone landing pages (`coaches.html`, `chs.html`) have their own custom nav. When reviewing, check they still provide a path back to the main site.

### False-positive patterns to avoid next time
- (none yet — this is the first run)

### Open questions for Thomas
- Is `coaches.html` intentionally a dead-end from a marketing/campaign standpoint (meant to be a landing page that only exits to WhatsApp or email), or should it link back into the main site?
- The admin login HMAC signature compare is non-timing-safe (`!==`). The client version uses `crypto.timingSafeEqual`. Is the inconsistency intentional (single-user dashboard, no practical timing attack) or a pure oversight?

### Scaffolding status
- First run — no prior reports, no decisions log, no focus rotation. Created `agent/memory/` and `agent/reports/` fresh. `docs/BUG_REPORT_SCHEMA.md` referenced in the agent prompt does NOT exist in the repo; defaulted to a sensible Markdown layout (headings: Summary, Findings, each finding has File / Severity / Category / Problem / Reproduction / Recommendation). If Thomas adds the formal schema later, adapt to match.
