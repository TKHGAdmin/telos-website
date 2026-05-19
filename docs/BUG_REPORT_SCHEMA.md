# Bug Report Schema

The Telos Bug Hunter agent writes one Markdown file per day at `agent/reports/YYYY-MM-DD.md`. The orchestrator (`run.py`) parses this file to render the daily email and to track Thomas's approve/deny decisions. Break the schema and the email won't send.

## File structure

```markdown
# Telos Bug Hunt — YYYY-MM-DD

**Focus:** <Functional | Visual/UX | Performance | Security>
**Bugs found:** <integer>
**Approval rate (last 30d):** <e.g., 72%>

## Summary

<1-3 sentences. State plainly what you looked at and what you found. If zero bugs, say so plainly.>

## Bugs

### BUG-YYYYMMDD-NN — <one-line title>

- **Severity:** P0 | P1 | P2 | P3
- **Area:** <e.g., api/dashboard/clients, client-dashboard.html, /chs landing>
- **File(s):** `path/to/file.js:line-line[, path/to/other.js:line]`
- **Status:** new | recurring (see BUG-YYYYMMDD-NN)

**What's wrong**
<2-4 sentences describing the bug with enough specificity that Thomas can verify without re-investigating.>

**Reproduction**
<Exact steps OR direct code excerpt with line numbers.>

**Impact**
<Who is affected, how often, what they see.>

**Suggested fix**
<1-3 sentences. Concrete change with file:line reference. Optional code snippet.>
```

## Rules

1. **Bug IDs:** `BUG-YYYYMMDD-NN` where `NN` is a 2-digit ordinal starting at `01` for the day. Stable across decisions log.
2. **No empty sections.** If you have nothing to report, write a Summary that says so and omit the `## Bugs` section entirely (or include `_None._`).
3. **One bug per `###` heading.** Parser splits on `### BUG-`.
4. **Severity must be P0/P1/P2/P3.** Anything else fails the parser.
5. **Recurring bugs** must cite the prior bug ID in the Status field and append `— still unresolved` to the title.
6. **Redact secrets.** Never paste API keys, tokens, or password hashes verbatim. Use `sk-…-REDACTED` or similar.
7. **No emojis. No marketing copy. No padding.** Thomas reads these on his phone.
