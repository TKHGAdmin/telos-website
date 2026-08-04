# Telos Bug Hunter - Learnings

Accumulated patterns, false-positive avoidances, and codebase notes. Keep under 2000 lines.

---

## Codebase notes

### Auth layers
- **Admin session**: `api/lib/auth.js` — cookie `telos_dash_session`, format `{expires}.{signature}`, SameSite=Strict.
- **Client session**: `api/lib/client-auth.js` — cookie `telos_client_session`, format `{clientId}.{expires}.{signature}`, SameSite=None + Partitioned (for Whop iframe).
- The two files intentionally differ in cookie scope but should share HMAC verification patterns.

### Quiz flow
- `js/quiz.js` runs on both `index.html` (inline) and `pricing.html` (as overlay). Detects context via `.quiz-overlay` selector.
- `pricing.html` uses the quiz as a **gate** — completing the quiz sets `localStorage.telosQuizCompleted` and reveals prices.
- Submit button is `type="button"` (not "submit"), so HTML5 `required` attributes are bypassed unless JS validates.

### Shop system
- `js/shop.js` handles both `shop.html` (product grid) and `product.html` (detail page). Detection via `document.getElementById('productDetail')`.
- Cache-buster on `<script src="js/shop.js?v=N">` should match across both HTML files whenever shop.js changes.
- Uses Shopify Buy SDK v3 UMD from CDN.

### Client dashboard
- `client-dashboard.html` is self-contained (all CSS/JS inline).
- `todayStr()` uses UTC (`.toISOString().split('T')[0]`) — **known limitation** documented in CLAUDE.md, do NOT re-report.

---

## Known-open items (do not re-report)

Documented in CLAUDE.md's "Known Limitations":
- Whop iframe on Safari/iOS auth flow.
- `todayStr()` UTC timezone bug in client dashboard streaks.
- SW cache version bump needed.
- Some tool pages missing main.js.
- Some `.html` extensions in internal links.

---

## False-positive patterns

(Populated as denials accumulate in `decisions.jsonl`.)

- Empty. First run.

---

## Approval rate

- Total findings reported: 0 (pre-first-run)
- Approved: 0
- Denied: 0
- Rate: N/A

---

## First-run bootstrap notes (2026-08-04)

- Bootstrapped `agent/`, `docs/`, `agent/memory/`, `agent/reports/`.
- Wrote `docs/BUG_REPORT_SCHEMA.md` (schema v1).
- Wrote `agent/memory/focus-rotation.json` starting at Functional (day 0).
- Wrote empty `agent/memory/decisions.jsonl`.

---
