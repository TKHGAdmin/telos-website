# Bug Report Schema

Every daily bug report at `agent/reports/YYYY-MM-DD.md` must follow this schema exactly. The parser (email pipeline) reads it — don't deviate.

## File location

`agent/reports/YYYY-MM-DD.md` (one per run, ISO date).

## Structure

```markdown
# Bug Report YYYY-MM-DD

**Focus:** Functional | Visual/UX | Performance | Security
**Bugs found:** N
**Summary:** One sentence.

---

## BUG-YYYY-MM-DD-NN — [P0|P1|P2|P3] Short title

**Severity:** P0 | P1 | P2 | P3
**Area:** file path (or subsystem)
**Anchor:** `path/to/file.ext:line` (or `line-range`)

**What's wrong**
Concise description of the defect. State it, don't speculate.

**Repro / evidence**
- Exact steps, or a code excerpt with line numbers.
- What a real user or developer would see.

**Proposed fix**
One or two lines. Not required to be exhaustive, but must be actionable.

---

(repeat per bug, incrementing NN, most-severe first)
```

## Rules

1. **Most severe first.** P0 before P1 before P2 before P3.
2. **Unique IDs.** `BUG-YYYY-MM-DD-01`, `-02`, etc. Never reuse across days.
3. **Anchor required.** Every bug names a file and line (or line range).
4. **No padding.** If you have zero bugs, the body is:
   ```
   No bugs found this run.
   ```
   Nothing else.
5. **No fabricated bugs.** Every finding must be reproducible from the anchor.
6. **Cross-reference recurring bugs.** If a bug was reported in the last 14 days and is still unresolved, note `Previously: BUG-YYYY-MM-DD-NN` under the anchor line.
