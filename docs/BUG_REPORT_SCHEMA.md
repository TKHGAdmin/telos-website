# Bug Report Schema

Every daily report at `agent/reports/YYYY-MM-DD.md` MUST follow this structure exactly. The orchestrator parses it line-by-line.

## File template

```markdown
# Telos Bug Hunter - YYYY-MM-DD

**Focus:** Functional | Visual/UX | Performance | Security
**Bugs found:** N
**Summary:** One sentence. Plain. No padding.

---

## Bug ID — <slug-id>
- **Severity:** P0 | P1 | P2 | P3
- **File:** `path/to/file.js:LINE` (or multiple, comma-separated)
- **What's wrong:** One sentence stating the defect.
- **Repro / Trace:** Concrete steps OR exact code excerpt with line refs.
- **Expected:** What should happen instead.
- **Fix sketch:** A 1-3 line suggestion. Optional — omit if unsure.

---

(repeat per bug)
```

## Rules

1. `Focus` line uses one of the four exact strings.
2. `Bugs found:` is a non-negative integer matching the number of `## Bug ID` headings.
3. `Bug ID` slug format: `YYYY-MM-DD-NN` where NN is a 2-digit index starting at 01.
4. `Severity` must be P0, P1, P2, or P3 — see agent system prompt for definitions.
5. If `Bugs found: 0`, omit the bug sections entirely. End the file after the summary line and `---` separator.
6. No emojis. No bold-italic. No nested headings deeper than `##`.
7. No marketing language. No "Great news!" preamble. Direct, factual, terse.

## Zero-finding example

```markdown
# Telos Bug Hunter - 2026-06-25

**Focus:** Functional
**Bugs found:** 0
**Summary:** Reviewed quiz, auth, cron jobs, and form handlers. No new functional defects found.

---
```
