# Telos Bug Hunter — Learnings

Running log of patterns, codebase landmarks, and false-positive filters the agent builds up over time. Keep under ~2000 lines; compress older entries into summaries when it grows.

## 2026-10-21 — bootstrap run (Performance focus)

**Codebase landmarks explored for the first time**

- `CLAUDE.md` lists an existing P1–P3 backlog: tool pages missing `main.js`, stray `.html` extensions in internal links, `todayStr()` UTC timezone bug in client dashboard streaks, service-worker cache version bump needed. **Do not re-report these — they're already tracked.**
- Static site: pure HTML/CSS/JS, no build step. Images under `images/`, shared CSS under `css/style.css` (currently `?v=16`), shared JS under `js/main.js` and `js/quiz.js`.
- Admin dashboard (`thomas.html`) and client portal (`client-dashboard.html`) are self-contained monoliths with inline CSS/JS (161KB and 278KB respectively). They do NOT load `main.js` or `style.css` — that is intentional per CLAUDE.md.
- API endpoints under `api/dashboard/*` consistently use `redis()` + `redisPipeline(cmds)` for bulk reads. No N+1 pattern worth reporting at current scale (dashboards fetch all items via `ZREVRANGE 0 -1` then one pipeline round-trip).
- Cron: `api/cron/engagement-check.js` iterates clients serially with per-client pipeline — fine at coaching-business scale, flag only if the active client count grows large.

**Patterns noticed**

- Below-the-fold `<img>` tags on marketing pages (`index.html`, `chs.html`) do not use `loading="lazy"`. Only one `loading="lazy"` exists in the whole repo, inside `client-dashboard.html`.
- `images/thomas.jpeg` is 1.9MB at 1206×2136 — unresized export from a camera/Lightroom, referenced from both the homepage About section and `/chs` About section. The hero image on `/chs` (`chs-hero.jpg`, 142KB) was correctly tagged `loading="eager" fetchpriority="high"`, which shows the author knows the attribute — the misses on the About-section images look like genuine oversights, not an intentional pattern.
- Google Fonts request on `index.html` pulls 7 Outfit weights (300–900) but CSS only uses 6 of them (no 800). Marginal; not worth a finding on its own.

**False-positive patterns to avoid**

- Do NOT flag `redisPipeline()` usage as N+1. It's the correct pattern here.
- Do NOT flag `thomas.html` / `client-dashboard.html` for "not loading `main.js`" — that is intentional per CLAUDE.md ("self-contained, does NOT load main.js").
- Do NOT flag "no `defer` on scripts" when scripts are at end-of-body — the effect is equivalent for parse-blocking.
- Do NOT re-flag items already listed in CLAUDE.md "Known Limitations" or "Bug crawl P1-P3 backlog".

**Open questions for next run**

- Is `/chs` promoted enough that its ~2.5MB page weight (dominated by `thomas.jpeg`) matters, or is this a low-traffic landing page where the fix can wait? Severity of the image finding depends on this.
