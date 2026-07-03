# Bug Report Schema

The Telos Bug Hunter emits one report per day at `agent/reports/YYYY-MM-DD.md`.
The report parser and email templates depend on this exact structure.

## File layout

```markdown
# Bug Report - YYYY-MM-DD

**Focus:** Functional | Visual/UX | Performance | Security
**Bugs found:** N

---

## BUG-YYYY-MM-DD-NNN

**Severity:** P0 | P1 | P2 | P3
**Area:** short label (e.g. "product page", "client dashboard", "cart drawer")
**File(s):** repo-relative path[:line]

### Summary
One or two sentences stating what is wrong.

### Reproduce
Numbered steps or a URL. Concrete inputs and expected vs actual.

### Root cause
Point to the exact lines and explain the mechanism. Cite git commit if known.

### Suggested fix
The smallest change that resolves the issue.

---

## BUG-YYYY-MM-DD-NNN
...
```

## Rules

1. **Heading pattern:** every bug starts with `## BUG-YYYY-MM-DD-NNN` where NNN
   is a zero-padded index starting at 001. The parser uses this as the bug ID
   and dedup key.
2. **Fields:** `Severity`, `Area`, `File(s)` on their own lines with bold labels
   and colons. Missing any of them fails the parser.
3. **Sections:** `Summary`, `Reproduce`, `Root cause`, `Suggested fix` as `###`
   headings, in that order.
4. **Zero-bug reports:** the file still exists, contains the header block, and
   uses `**Bugs found:** 0` followed by a single-paragraph note explaining what
   was checked. No `## BUG-` sections.
5. **Severity labels:** exactly `P0`, `P1`, `P2`, or `P3` (see agent
   instructions for definitions).
6. **No em dashes** anywhere in the report body (project convention).
