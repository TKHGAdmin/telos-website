# Telos Bug Hunter — Learnings

Compounding knowledge from daily runs. Append-only; compress when exceeding 2000 lines.

---

## 2026-06-13 — Run 1 (Functional)

### Repo orientation

- Static HTML/CSS/JS, no framework. Vercel hosts static + serverless functions.
- 28+ public HTML pages: `index.html`, `pricing.html`, `chs.html`, `shop.html`, `product.html`, `resources.html`, `protein-calculator.html`, `hyrox-predictor.html`, plus 23 blog articles in `/blog/`.
- Two self-contained dashboards: `thomas.html` (admin) and `client-dashboard.html` (PWA client portal). Both inline all CSS/JS; do NOT load `js/main.js` or `css/style.css`.
- Three shared JS files: `js/main.js` (nav, hamburger, scroll animations on every public page), `js/quiz.js` (Execution Score Quiz on index + pricing), `js/shop.js` (Shopify integration on shop + product).
- API surface in `/api/`: 3 public POST endpoints (submit-quiz, submit-email, submit-chs-application), 16 client-portal endpoints, 16 admin-dashboard endpoints, 2 cron jobs.

### Recent context (commits before this run)

- Shop and product detail pages are new (commits f5cb8c4, 21cc926, 8512e4e).
- Charleston landing page (`chs.html`) is the newest in-person service flow (commit 3d87367).
- Nav was restructured to move Resources + FAQ into a Tools dropdown on `index.html` (commit 9319f9d). Other pages were not all updated to match.
- Shopify Buy SDK URL was fixed to v3 (commit c1e3162) — the SDK v3 is the current CDN URL.

### Patterns noticed

- **Static HTML, multiple pages, shared nav copy-pasted**: any nav-shape change has to ripple to ~28 files. Drift is the failure mode. Worth periodic spot-checks.
- **Inline `<style>` is the norm** on tool pages and dashboards. Bug hunts must look inside the HTML file, not just `css/style.css`.
- **JS forms post JSON, not multipart**. APIs read `req.body` directly (Vercel parses JSON automatically). Field-name mismatches between form and API are a real risk class; verified `chs.html` ↔ `submit-chs-application.js` align today.

### False-positive patterns (DO NOT re-flag)

- **Shopify Storefront Access Token in `js/shop.js`**: by design, these tokens are public (analogous to Stripe publishable keys). Not a security bug.
- **`href="index.html"` instead of `href="/"`**: 308-redirects via Vercel `cleanUrls: true`, so links still work. Convention violation only — not P0/P1. Bundle into a single "nav hygiene" finding if it recurs, do not file per-link.
- **Pre-9319f9d flat nav on tool pages (hyrox-predictor, protein-calculator)**: links work, Resources is still reachable. Consistency, not breakage. Not a bug.
- **Empty `decisions.jsonl`**: first run, no signal yet. Expected.

### Verified-clean areas (skip re-investigating without a code change here)

- `api/cron/weekly-summary.js` and `api/cron/engagement-check.js` correctly fail closed when `CRON_SECRET` missing (return 401) and skip cleanly when `RESEND_API_KEY` missing (return 200 with `skipped:true`).
- `sw.js` cache name is `telos-v1`; static assets listed match files in `/images/`. No stale paths.
- `chs.html` form field names match the `submit-chs-application.js` server-side parse exactly. Required-field validation is enforced both client- and server-side. Rate limit is 5/hour/IP.
- `js/shop.js:491-498` exposes `switchProductImage` as a top-level function, so the inline `onclick` handlers in the thumb HTML actually resolve.

### Investigation focus areas to revisit

- **Shop flow end-to-end** (next functional run): cart drawer persistence across `shop.html` ↔ `product.html` navigation, checkout URL handling, empty-cart UX. Did not exhaust today.
- **`switchProductImage` thumb HTML uses unescaped `img.src` in a string concatenation** (`js/shop.js:170`). Shopify CDN URLs are normalized so this does not break in practice, but if a non-Shopify image source ever lands there, a single quote would break the inline `onclick`. Watch on Security day.
- **`api/submit-chs-application.js:40`** rate-limit key uses raw `x-forwarded-for` (can be CSV of IPs). Not exploitable for breaking the user flow, but worth a small fix later.
- **Quiz vs pricing-page state**: `localStorage.telosQuizCompleted` gates the pricing page. Edge cases (cleared storage, two browsers, deep-link to `/pricing`) not yet exercised.

### Tooling notes for future runs

- `Grep` for exact strings with quotes needs the HTML-decoded form (`href="index.html"`, not `href=&quot;index.html&quot;`). Easy mistake on first try.
- `Read` paginates at 2000 lines by default; for 280k-byte `client-dashboard.html` and 161k-byte `thomas.html`, plan multiple reads or grep first.
- Always start with `git log --oneline -20` to find recent additions — those are the highest-yield hunting grounds.
