# Bug Hunter Learnings

Rolling notebook. Newest at the top. Compress older entries into a summary once this file exceeds 2000 lines.

---

## 2026-07-05 — bootstrap run

First run. No prior memory. Established directory layout under `agent/` and the schema at `docs/BUG_REPORT_SCHEMA.md`. Started the focus rotation at index 0 (Functional).

### Repo shape
- Static HTML/CSS/JS, no build step, Vercel + Upstash Redis.
- Two "product" surfaces: the marketing site (index/pricing/chs/tools/shop/product/blog) and two dashboards (`/thomas` admin, `/client-dashboard` PWA).
- `shop.html` + `product.html` are new (recent commits: `21cc926` product detail page, `f5cb8c4` image gallery). These are the highest-churn, lowest-tested surface right now — prioritize them for functional review while the code is fresh.
- Shared JS: `js/main.js` (nav/anim), `js/quiz.js` (Execution Score Quiz on index + pricing), `js/shop.js` (Shopify Buy SDK client for shop + product).
- Backend: serverless functions in `api/`, session cookies via HMAC (`api/lib/auth.js` admin, `api/lib/client-auth.js` client). Admin cookie is `SameSite=Strict`; client cookie is `SameSite=None; Partitioned` to work inside the Whop iframe.

### Known-safe patterns (skip these; not bugs)
- **Shopify Storefront API token in client JS** (`js/shop.js:15`). The Storefront token is designed to be public and scoped to read-only storefront ops — it is not equivalent to the Admin API token. Do NOT report it as a leaked secret.
- **`document.body.style.overflow` toggled in the cart drawer** — the mobile hamburger uses the same trick. Coexistence bug would require observation, don't speculate.
- **`x-forwarded-for` used as rate-limit key** — Vercel's edge overrides this header, so header spoofing is not a bypass vector on this platform. Not a finding.

### False-positive patterns to avoid
- Anything phrased as "could be cleaner" or "consider refactoring".
- Timing-safety nitpicks on 32-byte HMAC signatures — the search space makes a timing side-channel infeasible over a network. Only flag timing bugs against short user-controlled inputs (passwords, PINs).
- Stripping unused local variables in JS. Not a bug.

### Areas explored this run
- `shop.html`, `product.html`, `js/shop.js` — full read.
- `api/lib/auth.js`, `api/submit-quiz.js`, `api/submit-chs-application.js` — full read.
- `js/quiz.js` — first 80 lines, skimmed.

### Areas NOT yet explored (candidates for future runs)
- `client-dashboard.html` (largest single file; PWA logic, 545 method, training, nutrition).
- `thomas.html` admin dashboard (10 tabs).
- `api/client/*` (auth, daily-log, training-log, food-search, push notifications).
- `api/dashboard/*` (pipeline, clients, revenue, etc.).
- All 23 blog posts.
- `sw.js` service worker.
- Cron jobs under `api/cron/`.
