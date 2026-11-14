# Bug Report Schema

Every daily bug report MUST follow this schema. The parser depends on it. Deviations break email delivery.

## File location

`agent/reports/YYYY-MM-DD.md` — one file per run, named after the UTC date.

## Required structure

```markdown
# Telos Bug Hunt — YYYY-MM-DD

**Focus:** <Functional | Visual/UX | Performance | Security>
**Run time:** <ISO-8601 timestamp>
**Bugs found:** <integer>

## Summary

<One short paragraph. If zero bugs, state so plainly and briefly describe what was checked.>

## Findings

<For each finding, repeat the block below. Omit the entire "Findings" section if bugs found is 0.>

### [ID] <P0 | P1 | P2 | P3> — <short title, <=80 chars>

**File:** `<path/to/file.ext>:<line>` (or "N/A" if not code-local)
**Category:** <functional | visual-ux | performance | security>
**Reproduction:**

1. <step>
2. <step>

**Impact:** <one sentence — who is affected, and how>

**Suggested fix:** <one or two sentences, or "unclear — needs investigation">

---

## Notes

<Optional: anything else Thomas should know — e.g., areas you skipped because of time, hypotheses you want to follow up on.>
```

## ID format

`BUG-YYYYMMDD-NN` where NN is a zero-padded index within the day (01, 02, …).

## Severity definitions

| Level | Definition |
|---|---|
| P0 | Breaks core functionality or exposes user data |
| P1 | Degrades experience for many users |
| P2 | Affects some users or edge cases |
| P3 | Minor polish / tech debt worth flagging |

## Rules

- Use plain Markdown. No HTML, no emojis in headings.
- Put code paths in backticks. Line numbers follow a colon: `api/client/login.js:42`.
- One finding per `###` heading. Horizontal rules (`---`) separate findings.
- If zero bugs, omit the entire `## Findings` section. Keep the header and summary.
- The parser extracts fields by heading text — do not rename sections.
