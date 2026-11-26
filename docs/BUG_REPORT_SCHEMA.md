# Bug Report Schema

The daily bug hunter writes a single Markdown file at `agent/reports/YYYY-MM-DD.md`
that conforms to the shape below. The `run.py` orchestrator (not yet written)
parses this file to build the daily email.

## File shape

```markdown
# Telos Bug Hunter - YYYY-MM-DD

**Focus:** <Functional | Visual/UX | Performance | Security>
**Findings:** <count>
**Previous open items referenced:** <count or "none">

---

## Summary

<One short paragraph. If zero findings, say so plainly.>

---

## Findings

### <bug-id>: <short title> [<severity>]

- **File:** `<repo-relative path>:<line>` (one or more lines)
- **Severity:** P0 | P1 | P2 | P3
- **Category:** correctness | security | performance | a11y | ux | tech-debt
- **Reproduce / failure scenario:** <concrete inputs/state -> wrong output or crash>
- **Why it matters:** <who it hits, how often>
- **Suggested fix:** <one-paragraph pointer, not a patch>
- **Status:** new | recurring (previously bug-id XXX)

---

## Memory delta

- Patterns noticed:
  - <bullet>
- False-positive patterns to avoid:
  - <bullet>
- New areas explored:
  - <bullet>
```

## Bug ID convention

`YYYYMMDD-NN` where `NN` is a zero-padded sequence within the day,
e.g. `20261126-01`.

## Severity definitions

- **P0** - Breaks core functionality or exposes user data (login broken, secret in bundle)
- **P1** - Degrades experience for many users (form validation broken, mobile layout collapsed)
- **P2** - Affects some users or edge cases (Safari-only glitch, missing empty state)
- **P3** - Minor polish / tech debt (deprecated API, small perf win, typo)

## Hard rules the report must satisfy

1. Every finding cites a specific file and line.
2. Every finding has a reproducible failure scenario; no "could be improved".
3. Zero findings is a valid report - do not pad.
4. Never fabricate; cross-check against the last 14 days of reports before including.
