# Bug Report Schema

Each daily report at `agent/reports/YYYY-MM-DD.md` must follow this layout exactly. The orchestrator parses it; deviation breaks the email.

## Required structure

```markdown
# Bug Hunt - YYYY-MM-DD

**Focus:** Functional | Visual/UX | Performance | Security
**Findings:** N (P0: x, P1: y, P2: z, P3: w)

## Summary

One paragraph. What was hunted, what was found, headline takeaway.

## Bugs

### BUG-YYYY-MM-DD-N - <short title>

- **Severity:** P0 | P1 | P2 | P3
- **Area:** e.g. `product.html`, `js/shop.js`, `/api/dashboard/...`
- **Status:** new | recurring (link prior BUG ID)

**What's wrong**

Plain-English description of the defect.

**Where**

`path/to/file:line` (one or more pointers).

**How to reproduce**

Numbered steps a developer can follow in under a minute.

**Suggested fix**

Brief, concrete suggestion. Do not write the fix — Thomas decides.

---

## Scope notes

Anything that was out of scope, deferred, or worth flagging for next run.
```

## Zero-findings format

If nothing was found, the body is one paragraph stating what was hunted and that nothing actionable surfaced. No fake bugs, no padding.

```markdown
# Bug Hunt - YYYY-MM-DD

**Focus:** <area>
**Findings:** 0

## Summary

<one paragraph>
```
