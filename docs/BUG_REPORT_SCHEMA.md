# Bug Report Schema

The Telos Bug Hunter emits one Markdown file per run to `agent/reports/YYYY-MM-DD.md`. This document is the contract between the agent and the report parser / email formatter.

## File location

`agent/reports/YYYY-MM-DD.md` — one report per calendar day, UTC.

## Top-level structure

```markdown
# Telos Bug Report — YYYY-MM-DD

**Focus:** Functional | Visual/UX | Performance | Security
**Run duration:** Nm Ns
**Findings:** N

## Summary

<One-paragraph plain-English summary. Say "zero bugs found" clearly if that's the case.>

## Findings

<Zero or more finding blocks. If zero, omit this section header and only include Summary.>

### N. <Short title> — [P0|P1|P2|P3]

- **ID:** `YYYY-MM-DD-N`
- **File:** `path/to/file.js:LINE` (or `N/A` if not code-specific)
- **Category:** functional | visual | performance | security
- **Reproduction:** <Exact steps or code trace>
- **Impact:** <Who is affected and how>
- **Suggested fix:** <One or two sentences>

<Optional prose expanding on the finding.>

---

## Notes

<Optional. Anything worth flagging to Thomas that isn't a bug — e.g. "I explored the training log endpoint for the first time and it looks solid.">
```

## Rules

- Findings are numbered starting at 1, ordered most severe first.
- Each finding must have all six bullet fields (`ID`, `File`, `Category`, `Reproduction`, `Impact`, `Suggested fix`). Missing fields break the parser.
- Severity is one of `P0`, `P1`, `P2`, `P3` — always uppercase, always in square brackets in the heading.
- IDs are formatted `YYYY-MM-DD-N` where N is the finding number within the day.
- A zero-finding report is valid. Omit the `## Findings` section and end after `## Summary` (plus optional `## Notes`).
- No trailing whitespace, no emojis, no em dashes (use hyphens).

## Categories

| Category | Meaning |
|---|---|
| `functional` | Broken behavior, dead links, logic errors, failing API paths |
| `visual` | Layout, responsiveness, accessibility, contrast, missing alt text |
| `performance` | Bundle size, images, slow queries, render-blocking |
| `security` | Auth, secrets, injection, CSRF, dependency CVEs |
