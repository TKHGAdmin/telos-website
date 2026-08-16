# Bug Report Schema

Every daily report at `agent/reports/YYYY-MM-DD.md` must follow this schema. The parser depends on it.

## File layout

```markdown
# Telos Bug Hunter Report — YYYY-MM-DD

**Focus:** Functional | Visual/UX | Performance | Security
**Bugs found:** N
**Approval rate (last 30d):** X% (or "no data")

---

## Summary

One-paragraph summary. If zero bugs found, say so plainly:
"No new bugs found today. Focus was <focus>. Scanned <what>."

---

## Findings

<Repeat the block below for each finding, ranked most-severe first.>

### [SEVERITY] Short title

- **Severity:** P0 | P1 | P2 | P3
- **Area:** e.g. `js/shop.js`, `api/submit-*`, `client-dashboard.html`
- **Repro:** Steps or code path to reproduce.
- **Impact:** Who is affected and how.
- **Suggested fix:** One-liner or short code snippet.
- **Evidence:** File paths with line numbers (`file:line`).

---

## Notes

Optional. Things worth mentioning but not bugs:
- Patterns noticed
- Areas explored but no findings
- Follow-ups for next run

---

## Metadata

- **Focus tomorrow:** <next focus>
- **Files scanned:** <count or list>
- **New learnings recorded:** yes | no
```

## Severity guide

| Severity | Definition |
|---|---|
| P0 | Breaks core functionality or exposes user data |
| P1 | Degrades experience for many users |
| P2 | Affects some users / edge cases / consistency |
| P3 | Minor polish or tech debt worth flagging |

## Rules

1. Every finding must include reproduction context and specific line references.
2. Do not include a finding you cannot describe concretely.
3. Zero findings is valid. Do not pad.
4. If a finding is a duplicate of an unresolved item from the last 14 days, reference the prior report and note "still unresolved".
