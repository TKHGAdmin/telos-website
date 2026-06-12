# Bug Report Schema

Daily bug reports live at `agent/reports/YYYY-MM-DD.md` and MUST follow this exact format. The orchestrator parser depends on it.

## File header

```
# Telos Bug Hunter Report - YYYY-MM-DD

**Focus:** Functional | Visual/UX | Performance | Security
**Total findings:** N
**Scope:** brief description of what was reviewed
```

## Zero-finding report

If no bugs were found, the body is exactly:

```
## Summary

No actionable bugs found during today's pass. See `agent/memory/learnings.md` for what was reviewed.
```

That's it. No padding. A zero-bug report is a valid report.

## Bug entry format

Each bug is a section, in priority order (P0 first):

```
## BUG-YYYYMMDD-NN — <short title>

- **Severity:** P0 | P1 | P2 | P3
- **Area:** <directory or feature, e.g. api/dashboard, client-dashboard, blog>
- **File(s):** <relative path>:<line> (one per line if multiple)

### What's wrong

One paragraph. State the bug, not the exploration that found it.

### Repro / evidence

Concrete steps OR code excerpts showing the exact problem. Use fenced code blocks for snippets.

### Suggested fix

One paragraph or a short numbered list. Do not include patch diffs — the agent does not modify code.

### Confidence

high | medium | low — and one sentence explaining why.
```

## Rules

1. Bug IDs are `BUG-YYYYMMDD-NN` where NN is a zero-padded counter starting at 01 each day.
2. Severity definitions are in `AGENT.md` — do not invent new levels.
3. Every bug MUST have all five subsections (What's wrong, Repro/evidence, Suggested fix, Confidence) plus the metadata bullets.
4. Do NOT include screenshots, attachments, or links to external tools — the email is plain Markdown.
5. Do NOT reference past bug IDs from other reports unless explicitly noting "still unresolved" to flag recurrence.

## Footer

After all bugs (or after the Summary in a zero-bug report), include:

```
---

**Next focus:** <whatever today's rotation advances to>
```
