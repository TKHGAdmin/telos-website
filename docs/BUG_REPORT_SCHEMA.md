# Bug Report Schema

This is the contract for daily reports written by the Telos Bug Hunter agent. The orchestrator that emails the report depends on this exact structure. Do not deviate.

## File location

`agent/reports/YYYY-MM-DD.md` — one file per run, ISO date in UTC.

## Required structure

```markdown
# Telos Bug Report — YYYY-MM-DD

**Focus:** Functional | Visual/UX | Performance | Security
**Bugs found:** N
**Approval rate (rolling 14d):** XX% (placeholder until decisions.jsonl has entries)

## Summary

One short paragraph (1-3 sentences) describing the scan and overall posture.
If zero bugs were found, say so plainly here. Do not pad.

## Bugs

(Repeat the block below per bug, sorted P0 → P3. Skip this section entirely if zero bugs.)

### [P0|P1|P2|P3] <Short title — one line, under 70 chars>

**ID:** bug-YYYY-MM-DD-NN  (sequence within the day, two-digit)
**File:** path/to/file.ext:line-range
**Type:** functional | visual | performance | security | accessibility

**What:**
One sentence describing what's wrong.

**Why it matters:**
One or two sentences on user impact. Be concrete (who is affected, what happens).

**Repro:**
1. Step-by-step OR a code snippet pointing at the offending lines.
2. ...

**Suggested fix:**
A short patch sketch (1-5 lines of pseudocode/diff). Not a full PR — just enough that Thomas can decide quickly.

---

## Notes

Optional. Anything Thomas should know that isn't a bug — e.g. "audit blocked because X is offline", "earlier P2 bug-2026-05-18-02 still unresolved", or links to related context.
```

## Required fields per bug

- Severity tag in the heading (`[P0]`, `[P1]`, `[P2]`, `[P3]`)
- Short title (under 70 chars)
- `ID:` — `bug-YYYY-MM-DD-NN`, where NN is a two-digit sequence within the day
- `File:` — at least one `path:line` reference
- `Type:` — one of: functional, visual, performance, security, accessibility
- `What:`, `Why it matters:`, `Repro:`, `Suggested fix:` blocks

## Severity definitions

| Tag | Meaning |
|---|---|
| P0 | Breaks core functionality or exposes user data (login, payments, secrets, auth bypass). |
| P1 | Degrades experience for many users (broken layout on a key page, form failure, mobile collapse). |
| P2 | Affects some users or edge cases (Safari glitch, missing empty state, minor a11y gap, low-traffic flow). |
| P3 | Polish / tech debt worth flagging (deprecated API, small perf win, typo). |

## Zero-bug reports

A zero-bug day is honest and valuable. In that case, omit the `## Bugs` section, set `**Bugs found:** 0`, and use the summary to briefly describe what was scanned. Do not pad with false positives.

## What to exclude

- Style preferences ("could be cleaner")
- Bugs already reported in the last 14 days (reference the prior ID if recurring)
- Theoretical bugs you cannot reproduce or point at concrete lines
- Items already in `agent/memory/learnings.md` as known false-positive patterns

## ID stability

Bug IDs are immutable. Once `bug-2026-05-25-01` is assigned, never reuse the ID even if the bug is denied or invalidated. Future references (in `decisions.jsonl`, future reports) point at this ID.
