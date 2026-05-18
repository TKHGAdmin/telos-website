# Bug Report Schema

This is the contract for daily reports produced by the Telos Bug Hunter agent. The parser (and Thomas) depend on this structure. Do not deviate without updating both this doc and the parser.

## File location

`agent/reports/YYYY-MM-DD.md` — one file per run, named for the run date in ISO format.

## Structure

```markdown
# Telos Bug Hunter — YYYY-MM-DD

- **Focus**: <Functional | Visual/UX | Performance | Security>
- **Findings**: <count>
- **Tools used**: <comma-separated short list>

## Summary

<One paragraph. What you looked at, what you concluded. Plain prose, no bullets.>

## Findings

### <ID> — <Title>

- **Severity**: <P0 | P1 | P2 | P3>
- **Area**: <short tag, e.g. "client portal auth" or "cron / email">
- **Location**: `path/to/file.ext:LINE` (or a range `LINE-LINE`)

**What's wrong**

<2-4 sentences describing the bug. Concrete. No hedging.>

**How to reproduce**

<Numbered steps, OR a code excerpt + explanation if the bug is purely in code logic.>

**Why it matters**

<1-2 sentences on user/business impact. Skip if obvious from the title.>

**Suggested fix**

<Direct, specific. Reference file:line. Keep to 1-3 sentences or a short diff.>

---

### <next finding...>
```

## Rules

1. **ID format**: `YYYYMMDD-N` where N is 1-indexed within the report (e.g. `20260518-1`, `20260518-2`).
2. **Severity must be one of**: P0, P1, P2, P3 (uppercase, exact). See agent.md for definitions.
3. **Location must point to real lines** that exist in the current HEAD. Verify before writing.
4. **One bug per finding**. Don't combine unrelated issues.
5. **No "could be improved" bugs**. If you wouldn't bet $20 it's a real defect, leave it out.
6. **Zero findings is valid**. If you found nothing, the Findings section reads:

   ```markdown
   ## Findings

   No bugs to report today.
   ```

   Do not pad. Do not invent. Honesty is the product.

7. **No code edits in the report**. The agent never modifies application code; the report is read-only output.
