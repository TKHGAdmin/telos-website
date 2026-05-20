# Bug Report Schema

Each daily report is a single Markdown file at `agent/reports/YYYY-MM-DD.md`. The orchestrator parses it to assemble the email, so the structure below is a contract — don't deviate.

## File template

```markdown
# Telos Bug Hunter — YYYY-MM-DD

**Focus:** Functional | Visual/UX | Performance | Security
**Bugs found:** N (P0: X, P1: X, P2: X, P3: X)
**Run summary:** One sentence describing what was hunted today.

---

## Bugs

### [P0|P1|P2|P3] BUG-YYYY-MM-DD-NN — Short title

- **Where:** `path/to/file.ext:line` (multiple paths allowed, one per line)
- **What:** One-paragraph description of the defect.
- **Repro:** Exact steps or code citation a reader can verify in under a minute.
- **Why it matters:** Who is affected and how.
- **Suggested fix:** One sentence pointing at the change.

### [next bug...]

---

## Notes

Optional: patterns noticed, follow-ups, anything Thomas should know that isn't a bug.
```

## Rules

1. **Bug IDs**: `BUG-YYYY-MM-DD-NN` where NN starts at 01 each day and increments. Stable across re-runs of the same day.
2. **One H3 per bug.** No collapsed bugs, no nested issues. If two things share a root cause, pick one as primary and reference it from a "Notes" line.
3. **Severity in the H3 line** — required so the parser can extract it via regex `^### \[(P[0-3])\]`.
4. **Where field** uses backticks and `path:line` format so editors auto-link.
5. **Zero-bug days**: omit the `## Bugs` section entirely and set `**Bugs found:** 0` in the header. The Notes section is still allowed.
6. **No code blocks longer than 15 lines.** Cite line numbers instead.
7. **No images, no diagrams.** Text only.
