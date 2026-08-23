# Bug Report Schema

The daily bug report is a single Markdown file at `agent/reports/YYYY-MM-DD.md`.
The parser (used by `run.py` when emailing) depends on this exact layout.

## File layout

```
# Telos Bug Report - YYYY-MM-DD

**Focus:** <Functional | Visual/UX | Performance | Security>
**Findings:** <count> (P0: <n>, P1: <n>, P2: <n>, P3: <n>)
**Approval-rate context:** <one line, e.g. "First run - no prior decisions">

## Summary

<2-4 sentence executive summary. What you looked at, what you found, what to
prioritize. If zero findings: say so, name what you covered, stop.>

---

## Findings

### <ID> - <P0|P1|P2|P3> - <One-line title>

- **File:** `path/to/file.js:LINE` (or a range like `:120-135`)
- **Symptom:** What breaks, in one sentence.
- **Repro:** Concrete steps or inputs that trigger it.
- **Impact:** Who is affected and how (users, admins, revenue, data).
- **Fix sketch:** One-paragraph or bulleted proposal. Do NOT commit the fix -
  Thomas approves before code changes.

### <next finding>
...

---

## Not-bugs (verified negative)

Optional. Short list of things you checked and cleared, so Thomas knows the
scope of the pass. Keep to one line each.

- `path/to/file.js`: <what you checked, one line>
```

## ID convention

`YYYYMMDD-<seq>` where seq is a two-digit zero-padded counter starting at `01`.
Example: `20260823-01`. IDs are permanent; future reports reference denied or
still-unresolved findings by ID.

## Severity definitions

| Severity | Definition |
|---|---|
| **P0** | Breaks core functionality or exposes user data (login broken, payment fails, API key in client bundle) |
| **P1** | Degrades experience for many users (form validation broken, mobile layout collapsed, slow checkout) |
| **P2** | Affects some users or edge cases (Safari-only glitch, missing empty state, minor a11y gap) |
| **P3** | Minor polish / tech debt worth flagging (deprecated API, small perf win, typo) |

## Hard requirements

- Every finding must have `File`, `Symptom`, `Repro`, `Impact`, `Fix sketch`.
- No fabricated findings. Zero is a valid answer.
- Do not re-report bugs from the last 14 days without marking them "still unresolved" and referencing the prior ID.
- Do not include stylistic preferences, "code could be cleaner", or "might want to consider".
