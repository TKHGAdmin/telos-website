# Telos Bug Hunter — Accumulated Learnings

Running log of patterns, false-positive traps, and areas explored. Compress older entries once this exceeds 2000 lines.

---

## 2026-11-25 — First run

### Repo map (learned this run)
- Static site, no build step. Pure HTML/CSS/JS per CLAUDE.md.
- Three self-contained HTML pages that do NOT load `main.js` or `style.css`: `thomas.html`, `client-dashboard.html`. Their CSS/JS is inline. Any style/JS findings on those files must stay scoped to the inline blocks.
- `shop.html` and `product.html` are new (May 2026 commits) and load `js/shop.js` plus the Shopify Buy SDK v3 UMD build. Both include a large inline `<style>` block that duplicates the cart drawer CSS — keep that in mind when hunting for dead/duplicate rules.
- `set-password.html` is a Supabase auth landing page (invite + password reset). The anon key on line 195 is designed to be public — not a leaked secret.
- `coaches.html` (/coaches) is a scroll-scene gallery of app + dashboard screenshots. Lots of `<img>` tags, all with descriptive alts. Loads scroll animations from `js/main.js`.
- Blog pages live in `/blog/`, 23 files, each standalone with inline styles and Schema.org JSON-LD. Nav links use `../` prefix.
- CSS version query string is `?v=16` per CLAUDE.md. Bump on all pages together when changing `css/style.css`.

### Known-issue backlog (per CLAUDE.md — do NOT re-report)
- Tool pages missing `main.js` (P1-P3 backlog)
- `.html` extensions in internal links (P1-P3 backlog)
- `todayStr()` UTC timezone bug in client-dashboard streaks
- SW cache version bump needed
- Whop iframe cookie problem on Safari/iOS (documented limitation)

### False-positive traps
- `<img ... alt="">` on `chs.html:824` and `client-dashboard.html:5048` is correct — they are decorative images (hero poster, lazy-loaded thumbnail stand-in). Empty alt is the right accessibility choice.
- `maximum-scale=1.0, user-scalable=no` on `client-dashboard.html` viewport is intentional for the PWA shell. Don't flag unless Thomas asks about it specifically.
- The Supabase anon key on `set-password.html` is public-by-design (JWT issued for the `anon` role). Not a leak.
- `shop.html` nav uses `index.html` hrefs instead of clean URLs — this is part of the known `.html`-in-links backlog item from CLAUDE.md. Do not re-report individually.

### Observations for future runs
- Shopify Storefront token lives in `js/shop.js:15`. It's a public Storefront API token (low-risk by design), but worth keeping on the watchlist in case it ever gets elevated to Admin API.
- `product.html` does its own layout with `display: grid; grid-template-columns: 1fr 1fr` and three direct children. Watch for grid child-count mismatches after future edits.
