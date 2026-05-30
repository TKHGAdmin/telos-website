# Telos Bug Hunter - Accumulated Learnings

This file holds patterns the agent has learned across runs. Keep entries dated and tight.

---

## Codebase orientation

- **Tech stack**: pure HTML/CSS/JS, no build step. Vercel serverless functions in `api/`. Upstash Redis for storage.
- **Critical user flows** to recheck on most Functional runs:
  - Quiz on `index.html` + `pricing.html` (driven by `js/quiz.js`).
  - CHS application form on `chs.html` → `/api/submit-chs-application`.
  - Shopify shop on `shop.html` + `product.html` (driven by `js/shop.js`).
  - Client portal login → `/api/client/login` → cookie-based session.
  - Cron jobs in `api/cron/` (weekly-summary, engagement-check).
- **Known tech-debt backlog** documented in `CLAUDE.md` "Known Limitations": tool pages missing main.js, `.html` extensions in internal links, todayStr UTC bug, SW cache version bump. Do NOT re-report these as new bugs - they're already triaged.
- Reports/admin dashboard `thomas.html` and client dashboard `client-dashboard.html` are huge self-contained files (~3k+ lines). Treat them as separate units and dive into them rather than skimming.

## False-positive patterns to avoid

- `.html` extensions in internal links: known, in backlog.
- Missing `main.js` on some tool pages: known, in backlog.
- HMAC string comparison not timing-safe in `api/lib/auth.js`: noted as a security finding for Security day, not a Functional bug.
- Hardcoded Shopify Storefront token in `js/shop.js`: that's a public token by Shopify design - NOT a leaked secret.
- `verifyToken` in `api/lib/auth.js` uses `!==` while `verifyClientToken` uses `timingSafeEqual` - inconsistent but admin cookie is sent only over HTTPS to admin user. Save for Security day.

## Useful invariants

- Quiz: 8 questions, 4 pillars × 2 questions each. Min question points = 1, max = 5. So min total = 8, max = 40.
- `submit-quiz`, `submit-email`, `submit-chs-application` all enforce IP rate limits.
- Daily-log clamps integer fields to [1,5] via `Math.max(1, Math.min(5, ...))`. Client code never sends 0 or null for these fields, so the clamp doesn't actually misfire today - but be aware if client logic changes.

## Run 1 - 2026-05-30 (Functional)

- Found 2 bugs:
  1. Quiz duplicate submit handlers on retake (`js/quiz.js`)
  2. Weekly summary streak loop counts today's empty slot at 9am ET Monday (`api/cron/weekly-summary.js`)
- Did NOT explore: thomas.html (admin dashboard), client-dashboard.html (PWA), blog/. These are next-priority on functional rotations.
- Files inspected: api/* (lib, client/, cron/, dashboard partial, submit-*), js/quiz.js, js/main.js, js/shop.js, shop.html, product.html, chs.html, pricing.html, index.html nav region, protein-calculator.html partial.
