# Bug Report Schema

Every daily report at `agent/reports/YYYY-MM-DD.md` MUST follow this schema. The
`run.py` orchestrator parses these fields and turns them into an email Thomas
can approve or deny per bug. Break the schema and the parser breaks.

---

## File location

`agent/reports/YYYY-MM-DD.md` (UTC date the run started)

## Frontmatter (required)

The file must start with a YAML frontmatter block:

```yaml
---
date: YYYY-MM-DD
focus: functional | visual-ux | performance | security
run_started_utc: ISO-8601 timestamp
bug_count: integer (0 if nothing was found)
commit_sha: short SHA the run was against
---
```

## Body sections (in order)

### 1. Summary

One short paragraph. Plain prose. What was hunted, what was found. If
`bug_count` is 0, say so plainly. No padding.

### 2. Bugs

If `bug_count == 0`, omit this section entirely. Otherwise, one bug per
subsection. Each bug uses this exact structure, in this exact order:

```
### BUG-YYYY-MM-DD-NN  <one-line title>

- **Severity**: P0 | P1 | P2 | P3
- **Focus**: functional | visual-ux | performance | security
- **File(s)**: repo-relative path(s), one per line if multiple
- **Introduced by**: short SHA of the commit that introduced it, if known; otherwise `unknown`
- **Duplicate of**: bug ID from a prior report if this is a recurrence; otherwise omit this line

**What's wrong**
One or two sentences stating the defect.

**Repro / evidence**
Concrete steps to see it, or the exact lines of code that prove it. When
citing code, use `path:line` format.

**Impact**
Who is affected and how. One or two sentences.

**Suggested fix**
The smallest change that would resolve it. Do NOT write patches or code
diffs — describe the fix in plain English so Thomas can decide.
```

### 3. Notes for tomorrow (optional)

Free-form. Anything the next run should know that doesn't belong in
`learnings.md` (e.g., a half-explored lead worth continuing).

---

## Rules

1. **Bug IDs are stable**: `BUG-YYYY-MM-DD-NN` where `NN` is the 2-digit
   ordinal in this report (`01`, `02`, ...). Never reuse an ID.
2. **Severity uses the P0–P3 scale defined in the agent instructions.**
3. **No prose outside the sections above.** Anything not in a defined section
   confuses the parser.
4. **No code diffs or patches.** Suggested fixes are described, not written.
5. **Do not fabricate.** A zero-bug report is a valid report.
