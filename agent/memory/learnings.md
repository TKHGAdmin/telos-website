# Telos Bug Hunter — Learnings

## 2026-11-10 (Performance — first run)

### Codebase shape

- Pure static HTML/CSS/JS. No build step, no bundler. Perf wins are mostly in HTML authoring (image sizes, `loading`/`decoding`, `fetchpriority`) and in `images/` payloads, not in JS bundle analysis.
- Shared stylesheet `css/style.css` is 69 KB. Each dashboard page (`thomas.html` 158 KB, `client-dashboard.html` 272 KB) is self-contained with inline CSS/JS — NOT a public perf concern because they are gated.
- Public pages that matter for first-paint perf: `index.html` (56 KB), `pricing.html` (43 KB), `chs.html` (37 KB), `coaches.html` (54 KB), `resources.html` (35 KB), `protein-calculator.html` (45 KB), `hyrox-predictor.html` (39 KB), `product.html` (25 KB), `shop.html` (26 KB).
- `/images` is 4.6 MB total; the single file `thomas.jpeg` is 1.9 MB.
- Service worker (`sw.js`) is on `telos-v1` — CLAUDE.md already flags "SW cache version bump needed" as a known backlog item, so do not re-report.

### Known backlog items in CLAUDE.md to skip
Tool pages missing main.js, `.html` extensions in internal links, `todayStr()` UTC timezone bug in client-dashboard streaks, SW cache version bump — all already tracked, do NOT re-report.

### Tool notes
- Outbound HTTPS from this environment is sandboxed; `curl` to `telosathleticclub.com` returns 403 from the proxy. Live-site inspection isn't available; local repo inspection is authoritative.
- `identify` (ImageMagick) and `file` are both available for image dimension checks.

### Patterns worth tracking next rotation
- `grep -nE '<img[^>]+>' *.html | grep -v 'loading='` quickly surfaces below-the-fold images missing lazy. Keep running this as the image inventory grows.
- Hero-section scroll scenes in `coaches.html` stack multiple screenshots with CSS `.on` toggling. Browser can't infer which is actually visible — add `loading="lazy"` on the ones not shown on first paint, and `fetchpriority="high"` on the first.
