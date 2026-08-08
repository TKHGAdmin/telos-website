# Bug Report Schema

Every daily report at `agent/reports/YYYY-MM-DD.md` MUST conform to this schema.
The email pipeline parses these files by section headings and bug blocks.

## File format

```markdown
# Telos Bug Hunter — YYYY-MM-DD

**Focus:** Functional | Visual/UX | Performance | Security
**Bugs found:** N
**Runtime:** ~M minutes

## Summary

One paragraph. If zero bugs, say so and stop.

## Bugs

### [P0|P1|P2|P3] <BUG-YYYYMMDD-NN> — <Short title>

**File(s):** `path/to/file.js:LINE` (list all relevant)
**Category:** functional | visual | performance | security
**Introduced by:** <commit hash> (if known, else "unknown")

**What's wrong**
One or two sentences describing the defect.

**Failure scenario**
Concrete steps or inputs → observed wrong behavior.

**Suggested fix**
One or two sentences. Do NOT include a patch — this is Thomas's call.

---

(repeat for each bug)

## Notes

Optional. Patterns noticed, followups, or context.
```

## Rules

1. Bug IDs are `BUG-YYYYMMDD-NN` where NN is a two-digit index within the day (01, 02, ...).
2. Severity tags are square-bracketed and appear FIRST in the H3 heading.
3. Every bug MUST include File(s), Category, What's wrong, Failure scenario, Suggested fix.
4. `Introduced by` is optional but preferred when discoverable via `git blame`.
5. A zero-bug report still requires the H1, Focus, Bugs found, Summary sections. Omit the `## Bugs` section entirely.
6. Never include actual secrets in the report — redact with `REDACTED`.
