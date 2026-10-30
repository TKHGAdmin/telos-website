# Telos Bug Hunter — Learnings

Accumulated knowledge about the Telos Fitness web platform, patterns to look for, and false-positive patterns to avoid.

## Architecture notes

- Pure HTML/CSS/JS site hosted on Vercel. No build step.
- Static pages are shared via `js/main.js` (nav, scroll animations, FAQ, tilt, cursor glow) and `css/style.css` (dark theme, gold accent #C9A84C).
- The convention (per `CLAUDE.md`) is to bump the `?v=N` cache-bust suffix on **every** page that references a shared file when that file changes.
- Dashboards (`thomas.html`, `client-dashboard.html`) are self-contained — no `main.js` or `style.css`. Treat them as independent apps.
- `coaches.html` is also self-contained (its own typography, nav, scroll scenes) and does NOT load `main.js`/`style.css`.
- `chs.html` is scoped via a `chs-page` body class but DOES load the shared stylesheet and `main.js`.
- Tool pages (`protein-calculator`, `hyrox-predictor`) intentionally have their own inline hamburger logic and do NOT load `main.js` (known limitation in `CLAUDE.md`).

## Patterns to look for

- **Cache-bust drift**: whenever a shared JS/CSS file is modified in a commit, verify every HTML page that references it was bumped to the same `?v=N`. Grep: `grep -h 'js/main.js\|js/shop.js\|js/quiz.js\|css/style.css' *.html blog/*.html | sort -u`.
- **`.animate-on-scroll` on initially-hidden content**: `main.js` adds `.animate-on-scroll` to all `.section-label` elements (line 328-334), which starts them at `opacity:0; filter:blur(4px)`. If a `.section-label` is inside a `[hidden]` block that is later un-hidden by JS (e.g. multi-state cards like `set-password.html`), the IntersectionObserver can miss the state transition. Solved on `set-password.html` by using a dedicated class (`.sp-label`) — any new multi-state page should follow the same pattern.
- **Rate-limited public endpoints** use the pattern `req.headers['x-forwarded-for'] || req.headers['x-real-ip']` for the IP key. On Vercel the `x-forwarded-for` header is set by the edge (client-sent copies are stripped), so this is safe — don't flag it as spoofable.
- **IP-based rate-limit keys contain commas** when traffic has an upstream proxy chain. That's fine for correctness but makes the Redis key less human-readable.

## False-positive patterns (do NOT report)

- **Supabase anon key embedded in `set-password.html`** — this is the publishable anon key, designed to live in client code. Not a secret.
- **Unused image asset `images/coaches/dash-program.jpg`** — exists in `images/coaches/` but not referenced in `coaches.html`. Likely a reserved asset for a future "Program" tab; not actionable.
- **`/coaches` and tool pages do not load `main.js`** — intentional. `/coaches` is a self-contained landing page with its own scroll engine; tool pages have inline nav handlers. Already acknowledged in `CLAUDE.md`.
- **Known P1-P3 backlog items** called out in `CLAUDE.md` (tool pages missing `main.js`, `.html` extensions on internal links, UTC timezone bug in client dashboard streaks, SW cache version bump) — don't re-report; wait for Thomas to work through that queue or ask about them.
- **Non-versioned external competitor links on `/coaches`** opening in the same tab — intentional (they're source citations).

## Areas explored

- Root pages: `index.html`, `coaches.html`, `set-password.html`, `shop.html`, `product.html`, `chs.html`, `privacy.html`, `terms.html`
- Shared assets: `js/main.js`, `js/shop.js`, `sw.js`
- Public API: `api/submit-chs-application.js`, `api/submit-email.js`, `api/submit-quiz.js`
- Config: `vercel.json`, service worker

## Still to explore (future runs)

- `js/quiz.js` and the quiz gating on `pricing.html`
- Client portal endpoints (`api/client/*`) — auth cookie handling, PBKDF2 details
- Admin dashboard endpoints (`api/dashboard/*`) — HMAC session cookie, timing-safe compare
- The 23 blog articles for schema.org / meta tag issues
- Cron endpoints and `CRON_SECRET` handling
- `client-dashboard.html` and `thomas.html` (large self-contained files, held off for a Visual/UX day)
