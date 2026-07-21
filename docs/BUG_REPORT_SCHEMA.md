# Bug Report Schema

This is the contract the Telos Bug Hunter agent MUST follow when writing a daily
report. The email delivery step assumes this shape — deviating breaks the parser.

## Filename

`agent/reports/YYYY-MM-DD.md` — ISO date matching the run day (UTC).

## Top-level structure

```markdown
# Telos Bug Report — YYYY-MM-DD

**Focus:** <Functional | Visual/UX | Performance | Security>
**Findings:** <N>
**Runtime notes:** <one-line status, e.g. "First-run bootstrap; no prior memory">

---

## Summary

<One-paragraph plain-English summary. If zero bugs found, say so plainly here
and stop. Do not pad.>

---

## Findings

### <ID>. [<SEVERITY>] <Short title>

- **File:** `<repo/relative/path.js>[:<line>]`
- **Severity:** P0 | P1 | P2 | P3
- **Category:** <one of: functional, ui, performance, security, data-integrity>
- **Repro steps:**
  1. <step>
  2. <step>
- **Expected:** <what should happen>
- **Actual:** <what does happen>
- **Suggested fix:** <one-sentence pointer or code hint>
- **Confidence:** high | medium | low

<repeat per finding, in P0→P3 order>

---

## Notes for tomorrow

<Optional. Patterns to explore, files skipped for time, false-positives to
avoid. Fed back into learnings.md.>
```

## Severity guide

| Severity | Definition |
|---|---|
| **P0** | Breaks core functionality or exposes user data |
| **P1** | Degrades experience for many users |
| **P2** | Affects some users or edge cases |
| **P3** | Minor polish / tech debt worth flagging |

## Rules

- Every finding MUST have a `File:` pointer (with line number when applicable).
- Repro steps MUST be concrete enough for a developer to reproduce or verify
  by reading the code.
- Findings ordered P0 → P1 → P2 → P3, numbered sequentially (`1.`, `2.`, ...).
- IDs are per-report, not global.
- Zero findings is valid — write the Summary and stop. Do not fabricate.
