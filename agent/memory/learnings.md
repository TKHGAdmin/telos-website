# Telos Bug Hunter - Learnings

Accumulated knowledge from daily hunts. Kept under 2000 lines.

## First-run notes (2026-09-04)

- `agent/` scaffolding did not exist. Created `agent/memory/` and `agent/reports/`.
- `docs/BUG_REPORT_SCHEMA.md` referenced in instructions does not exist and cannot be created (hard rule: only write to `agent/memory/` and `agent/reports/`). Adopted a sensible default schema for the report - documented below. If Thomas provides an official schema later, switch to it.
- `focus-rotation.json` did not exist. Started at Day 0 (Functional).
- `decisions.jsonl` was empty (no prior approvals/denials). Starting conservative - one high-confidence P1, one P3.

## Adopted report schema (until docs/BUG_REPORT_SCHEMA.md exists)

Each report file: `agent/reports/YYYY-MM-DD.md`

```
# Bug Report - YYYY-MM-DD

**Focus:** Functional | Visual/UX | Performance | Security
**Findings:** N

---

## BUG-YYYYMMDD-NN - <one-line title>

**Severity:** P0 | P1 | P2 | P3
**Confidence:** High | Medium | Low
**Area:** <endpoint/file path>
**Status:** New (or "Recurring - previously BUG-XXXX")

### What's wrong
<2-4 sentences>

### Reproduction
1. Step
2. Step
3. Observed vs expected

### Suggested fix
<Short code sketch or approach>

### Files
- `path/to/file.js:LINE`

---
```

If zero bugs: single line "No new bugs found today." after the header block.

## Codebase notes

### Known limitations documented in CLAUDE.md (do NOT re-report)
- Whop iframe on Safari/iOS: cookie blocking, needs token-based auth for iframe.
- P1-P3 backlog from bug crawl commit 7fa38ff: tool pages missing main.js, .html extensions in internal links, `todayStr()` UTC timezone bug in client dashboard streaks, SW cache version bump needed.

### False-positive patterns to avoid
- **HMAC timing comparison in `api/lib/auth.js:27`** uses `signature !== expected` (not `timingSafeEqual`) - technically a timing side channel but exploitable only over local network with high-precision measurements. Note it if hunting Security (Day 3), skip on Functional/UX/Perf.
- **Storefront token in `js/shop.js:15`** is a public Shopify Storefront API token by design. NOT a leaked secret. Do not flag.
- **Race conditions on read-modify-write Redis client updates** (e.g., `PUT /api/dashboard/clients`) - pattern is widespread and admin-only, low blast radius. Only report if concrete abuse path exists.

### Confirmed real bug patterns
- **Redis key orphaning on delete**: several DELETE handlers only remove the primary key + index, not the secondary indexes (email lookup, per-client data). Watch this pattern in other DELETE handlers.

### Areas explored on 2026-09-04
- All `api/` endpoints (submit-*, dashboard/*, client/*, cron/*, lib/*)
- Client auth flow (login, reset-password, session cookies)
- Client dashboard init/routing (init function, showView, handleReset)
- Shop.js init and error paths (product.html vs shop.html)
- Service worker (sw.js) cache strategy

### Areas NOT yet explored
- Blog pages (`blog/*.html`) - static content, low priority
- CSS accessibility (contrast, focus states) - save for Day 1
- Bundle sizes and image weights - save for Day 2
- npm audit / dependency CVEs - save for Day 3
- Mobile viewport behavior - save for Day 1
- Charleston form UX - only spot-checked API side
