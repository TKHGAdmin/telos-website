# Bug Report Schema

Every daily report at `agent/reports/YYYY-MM-DD.md` MUST follow this format so the email pipeline can parse it.

## File name
`agent/reports/YYYY-MM-DD.md` (UTC date of the run)

## Top-of-file frontmatter (required)
```
---
date: YYYY-MM-DD
focus: functional | visual-ux | performance | security
findings: <integer>
approval_rate_note: <optional short string, e.g. "no decisions yet">
---
```

## Body

### Summary (required, 1-3 sentences)
Plain-English one-liner of what was checked and what was found. If zero bugs, say so.

### Findings

Zero or more `## Bug <n>` sections, each with exactly these subsections in this order:

```
## Bug 1
**Severity:** P0 | P1 | P2 | P3
**Area:** <file or subsystem, e.g. "product.html / shop.js">
**Focus:** functional | visual-ux | performance | security

### What is wrong
<one paragraph, factual, no hedging>

### Reproduction
<numbered steps, or exact file:line reference>

### Impact
<who is affected and how — one paragraph>

### Suggested fix
<one paragraph — do NOT include patched code>

### Confidence
CONFIRMED | HIGH | MEDIUM
```

Rules:
- Bug IDs restart at 1 each day.
- If confidence is not CONFIRMED, explain what would confirm it.
- Do not embed patched code — the agent must not attempt fixes.
- Do not use em dashes or emojis.

### No findings

If nothing was found, replace the Findings section with a single line:

```
_No findings today._
```

The parser treats this as an intentional zero-bug report and does not raise a "possibly stuck agent" flag.
