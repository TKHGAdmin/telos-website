# Bug Report Schema

This is the contract between the Telos Bug Hunter agent and the report-parser / emailer. Every report file at `agent/reports/YYYY-MM-DD.md` MUST conform to this structure. The parser depends on the exact heading levels and the YAML frontmatter keys.

---

## File location

`agent/reports/YYYY-MM-DD.md` — one file per run, ISO date in filename (UTC).

## Structure

```markdown
---
date: YYYY-MM-DD
focus: functional | visual-ux | performance | security
bugs_found: <int>
high_severity: <int>   # count of P0 + P1
zero_findings: true | false
---

# Telos Bug Hunter — YYYY-MM-DD

**Focus**: <focus label>
**Bugs found**: <int>

## Summary

<2-4 sentence overview of what was hunted and what was found. If zero bugs, state it plainly here.>

## Findings

### BUG-YYYYMMDD-N — <short title>

- **Severity**: P0 | P1 | P2 | P3
- **Area**: <e.g., shop/cart, client-dashboard, admin, api/submit-quiz, blog>
- **File(s)**: `path/to/file.ext:line` (one per line)
- **Status**: new | recurring (since YYYY-MM-DD)

**What's wrong**
<1-3 sentences describing the bug. Specific. No hand-waving.>

**Reproduction**
<Numbered steps OR exact lines that demonstrate the bug. A reader should be able to verify in <2 minutes.>

**Impact**
<Who is affected and how. One sentence.>

**Suggested fix**
<Concrete fix. Code snippet if small. Otherwise a sentence describing the change.>

---

<Repeat per finding.>

## Notes for next run

<Optional. Patterns noticed, areas to revisit, things deferred. Keep under 5 bullets.>
```

## Rules

1. **Frontmatter is required.** All five keys. `bugs_found` must equal the number of `### BUG-` headings.
2. **Bug IDs** follow `BUG-YYYYMMDD-N` where N starts at 1 and increments. Stable across runs (don't reuse).
3. **Severity** must be exactly P0, P1, P2, or P3.
4. **File paths** are repo-relative. Line numbers required for code bugs.
5. **Zero findings is valid.** Set `zero_findings: true`, `bugs_found: 0`, omit the `## Findings` section (or leave it with the text "None this run.").
6. **No markdown beyond what's specified.** No tables, no images, no nested headings inside a finding beyond what's shown.
7. **Plain ASCII only.** No emoji, no em dashes (use hyphens), no smart quotes.

## Severity definitions

| Severity | Definition | Examples |
|---|---|---|
| P0 | Breaks core functionality or exposes user data | Login broken, payment fails, API key in client bundle |
| P1 | Degrades experience for many users | Form validation broken, mobile layout collapsed, slow checkout |
| P2 | Affects some users or edge cases | Safari-only rendering glitch, missing empty state, minor a11y gap |
| P3 | Minor polish / tech debt worth flagging | Deprecated API, small performance win, typo |
