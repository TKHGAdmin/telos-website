# Bug Report Schema

Every daily report is a single Markdown file at `agent/reports/YYYY-MM-DD.md`. The parser (in `run.py`) depends on this shape — don't deviate.

## File structure

```markdown
# Telos Bug Hunter - YYYY-MM-DD

**Focus:** Functional | Visual/UX | Performance | Security
**Findings:** N (P0: n, P1: n, P2: n, P3: n)

## Summary

One or two sentences describing the run. If zero findings, say so plainly.

## Findings

### F1 - [Pxx] Short title (<= 70 chars)

- **Severity:** P0 | P1 | P2 | P3
- **File(s):** `path:line` (comma-separated if multiple)
- **Category:** correctness | security | perf | a11y | ux | tech-debt

**What's wrong.** One-paragraph description of the actual defect.

**Reproduction / evidence.** The exact steps or the code snippet that proves it.

**Impact.** Who's affected and how, in concrete terms.

**Suggested fix.** One short paragraph or a code diff hint. Don't write the full patch.

---

### F2 - [Pxx] ...

(repeat)

## Notes

Optional. Anything the human reviewer needs to know - false positives considered and rejected, scope decisions, follow-up ideas.
```

## Rules

1. One finding per `### Fn` block. Numbered sequentially within the file.
2. Severity follows the P0-P3 definitions in `agent/AGENT.md` (the system prompt).
3. `File(s)` must be real paths relative to repo root, with line numbers. The parser uses this to open the file for the reviewer.
4. If findings is zero, omit the `## Findings` section entirely and keep only Summary (and Notes if any).
5. No em dashes (`---`) except as the block separator.
