# Bug Hunter Learnings

Accumulated knowledge across runs. Kept short. Older entries compressed as this
grows past ~2000 lines.

## Repo shape (learned 2026-07-27, first run)

- Pure static HTML/CSS/JS. Vercel serverless in `api/`. Upstash Redis for state.
- Two protected apps live inside `/thomas` (admin) and `/client-dashboard`
  (client PWA). Both are self-contained single-file HTML — do NOT load
  `js/main.js` or `css/style.css`.
- Public pages all load `js/main.js` for shared nav/hamburger/scroll behavior.
- Client auth cookie is `telos_client_session`, admin auth is
  `telos_dash_session` (different formats).
- `CLAUDE.md` documents a "P1-P3 bug crawl backlog" — items already listed
  there are NOT eligible to report as new. Currently listed as known:
  - Tool pages missing `main.js`
  - `.html` extensions in internal links
  - `todayStr()` UTC timezone bug in client dashboard streaks
  - SW cache version bump needed

## Patterns worth revisiting

- `client_email:<email>` Redis lookup is only ever written on portal-enable in
  `client-portal.js`, never on client creation. Duplicate-detection paths
  depending on this key can be misled.
- Cross-file version-string bumps: `?v=` query params on CSS/JS are the only
  cache-busting mechanism. Any page whose version drifts from the rest is a
  red flag.
- Shopify Buy SDK v3 returns prices as `{amount, currencyCode}` objects. Code
  that does `price.amount || price` works for both v3 and stringly-typed
  fallbacks, but breaks if `price = 0` becomes `variant.price.amount`
  === undefined AND `variant.price` === 0 (returns 0, which is fine — but
  worth a spot-check next round).

## False-positive patterns to avoid

- Do not report `.html` extensions in internal links — known backlog item.
- Do not report `todayStr()` UTC — known backlog item.
- Do not report SW cache name still being `telos-v1` — known backlog item.
- Do not report "code could be cleaner" issues (per hard rules).
- Do not report XSS from admin-controlled inputs (client names, tier labels,
  etc.) as high-severity — Thomas is the only writer; treat as P3 hygiene at
  most, and only if a real injection path exists.

## Approval rate

Empty (first run). Target: get above 70% before broadening scope.
