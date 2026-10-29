# Telos Bug Hunter - Learnings

Running record of patterns, false-positive filters, and codebase notes.

## Codebase map (quick reference)

- Admin dashboard: `thomas.html` (3,174 lines, inline CSS/JS, HMAC-signed session cookie, HTML-escapes via `esc(s)` helper)
- Client portal: `client-dashboard.html` (5,206 lines, inline CSS/JS, PBKDF2 auth, 5 bottom tabs)
- Public pages: `index.html`, `pricing.html`, `chs.html`, `set-password.html`, blog articles, two tool pages
- API: `/api/{submit-*, cron/*, client/*, dashboard/*}` on Vercel serverless, Upstash Redis for persistence

## Patterns noticed

### `esc()` in thomas.html only escapes `& < >` - not `"` or `'`

The `esc()` helper (line 731) uses `textNode.innerHTML` serialization, which per HTML5 spec
only escapes `&`, `<`, `>`, and non-breaking space. **Quote characters are NOT escaped.**
Any `onclick="handler('...<esc'd>...')"` pattern can break out if the value contains
`'` or `"`. The same is true for double-quoted attributes.

Verified bug: Quiz tab's "+ Pipeline" button uses `JSON.stringify(JSON.stringify(s))` and
embeds the result in a double-quoted `onclick` - every submission contains unescaped `"`,
so the handler syntax-errors on 100% of real data (confirmed in Playwright).

### Client email mapping orphans on delete

`api/dashboard/clients.js` DELETE handler removes `client:{id}` and `clients_index` entries
but never touches `client_email:{normalizedEmail}`. The result is a dead reference that
makes the email unreusable until Redis is edited by hand. Many other per-client keys
(`client_dailylog:...`, `client_training_log:...`, etc.) also orphan.

### Cron timezone / "today" edge

`api/cron/weekly-summary.js` computes streak starting from today using UTC
`new Date(now - d*86400000).toISOString().split('T')[0]`. The streak loop breaks at
d=0 (today) if that day isn't logged yet - which it never is at 9am ET on Monday - so
the streak in the weekly email is almost always 0 or off by one. Already documented
in CLAUDE.md under "Known Limitations" as the `todayStr()` UTC timezone bug, so this
has been seen before.

## Known limitations (do NOT re-report)

Already documented in CLAUDE.md under "Known Limitations":
- Whop iframe cookies on Safari/iOS - cannot be fixed without token-based auth
- Tool pages (protein-calculator, hyrox-predictor) missing main.js include
- `.html` extensions in some internal links
- `todayStr()` UTC timezone bug in client dashboard streaks
- SW cache version bump needed (`telos-v1`)

Infra:
- `agent/` directory did not exist before this run - no orchestrator `run.py`, no
  `docs/BUG_REPORT_SCHEMA.md`. Report is written as plain Markdown.

## False-positive patterns to avoid

- Shopify Storefront Access Token in `js/shop.js:15` is **public by design** - not a
  leaked secret.
- Supabase anon key in `set-password.html:195` is **public by design** - RLS-governed.
- `verifyPassword` leaking length via `inputStr.length !== expected.length` - this is
  defensive to avoid `timingSafeEqual` throwing on mismatched buffer lengths. Fine.
- `innerHTML` with literal strings (no interpolation) - safe.
