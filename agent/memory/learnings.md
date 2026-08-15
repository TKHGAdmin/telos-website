# Telos Bug Hunter — Learnings

Accumulated knowledge across runs. Compress older entries when this file
exceeds 2000 lines. Newest first.

---

## Run 2026-08-15 (Functional)

Filed one P1: `20260815-01` — product detail grid wraps info row-below-
image due to a third grid child added in commit `f5cb8c4`.

Areas visited: `shop.html`, `product.html`, `js/shop.js` (full), `js/main.js`,
`chs.html` (form + submit script), `api/submit-chs-application.js`,
`api/submit-quiz.js`, `api/client/login.js`, `vercel.json`.

New patterns to remember:

- The Shopify shop pages (`shop.html`, `product.html`) each duplicate the
  entire cart drawer DOM + styles. Any style change to the cart must
  land in BOTH files — an existing regression fix (commit `e08b007`)
  already had to catch that. When touching cart CSS, grep both files.
- Shop pages use the raw Shopify Buy JS SDK; `SHOPIFY_STOREFRONT_TOKEN`
  in `js/shop.js:15` is a Storefront token (public by design) — do NOT
  flag as a leaked secret.
- Rate-limit keys in `submit-quiz.js` and `submit-chs-application.js`
  key off `req.headers['x-forwarded-for']` as-is, which can be a
  comma-separated proxy chain. Keys still bucket per-request-ip in
  practice on Vercel — not a bug worth reporting.
- `req.body` on Vercel Node functions can be `undefined` if
  `Content-Type` is not JSON. `api/client/login.js:19` will TypeError in
  that case and return 500 instead of 400 — noted but not high-value
  enough to file today (defensive parsing everywhere is a bigger sweep).

## Codebase shape (2026-08-15, bootstrap run)

- Pure HTML/CSS/JS static site plus Vercel serverless functions under `api/`.
- No test suite, no `package.json` scripts, no bundler. `tsc`, `npm test`,
  `lighthouse`, `axe-core` are NOT available out of the box. Static analysis
  has to be done by reading and grepping.
- Admin auth = `api/lib/auth.js` (`telos_dash_session` cookie, HMAC-signed).
  Client auth = `api/lib/client-auth.js` (`telos_client_session`, PBKDF2).
  A prior bug (fixed in 7fa38ff) was reading the wrong cookie in
  `dashboard/analytics.js`. When reviewing new dashboard endpoints, always
  confirm `verifySession(req)` from `api/lib/auth.js` is called and the
  return is checked as `!session || !session.ok`.
- Cron endpoints must fail closed when `CRON_SECRET` is unset — a prior bug
  used `&&` short-circuit that made them public when the env var was empty.
  Pattern to look for: `req.headers.authorization === \`Bearer ${SECRET}\``
  without an explicit `if (!SECRET) return 500`.
- `cleanUrls: true` in `vercel.json` — internal links must never include
  `.html`. Grep for `href="[^"]*\.html"` in blog/ and root pages.

## False-positive patterns to AVOID reporting

- Tool pages having their own inline `<script>` — this is intentional per
  CLAUDE.md, not a duplication bug. Only report if the inline script
  duplicates hamburger/nav handlers that already live in `js/main.js`.
- Client-dashboard.html and thomas.html not loading `css/style.css` or
  `js/main.js` — intentional; they are self-contained per CLAUDE.md.
- `body.page-load-anim` missing on non-index pages — intentional; the
  fade-in animation is opt-in.
- Bare `.visible` class in tool pages — intentional; CLAUDE.md notes that
  global `.visible` should never be added to shared CSS.
- Client-dashboard using `SameSite=None; Partitioned` — intentional for
  Whop iframe embedding, and the trade-off is documented as a known
  limitation. Only report if the same cookie config appears on admin.

## Focus rotation notes

Day 0 → Functional (broken forms, dead links, failing API calls, logic errors)
Day 1 → Visual/UX (mobile responsiveness, contrast, alt/aria, labels)
Day 2 → Performance (bundle size, images, N+1, slow loads)
Day 3 → Security (secrets, missing auth, XSS, IDOR, deps)

---
