# Bug Report Schema

The Telos Bug Hunter agent emits one Markdown file per run at `agent/reports/YYYY-MM-DD.md`. The downstream parser depends on this schema. Do not deviate.

## File header (required)

```
---
date: YYYY-MM-DD
focus: functional | visual-ux | performance | security
bug_count: <integer>
run_id: <YYYY-MM-DD>-<focus>
---
```

## Body

After the front matter, the body is one of:

### Zero-bug report

A single line:

```
No actionable bugs found today. <one short sentence explaining what you looked at>.
```

### One or more bugs

Each bug is a level-2 heading followed by a fixed set of fields. Bugs are ordered by severity (P0 first).

```
## BUG-<YYYY-MM-DD>-<NN>: <short title>

- **Severity:** P0 | P1 | P2 | P3
- **Area:** <e.g. client-dashboard, api/dashboard, blog, chs, pricing>
- **File(s):** path/to/file.html:LINE, path/to/other.js:LINE
- **Reproduction:** <exact steps or code path>
- **Impact:** <who is affected and how>
- **Suggested fix:** <one short sentence, not a patch>
- **Confidence:** high | medium
```

Rules:
- `<NN>` is a 2-digit sequence number for that day's report, starting at 01.
- `Confidence` is `high` by default. Use `medium` only when there is genuine ambiguity; never include a bug below medium confidence.
- File paths are repo-relative.
- No code blocks longer than 10 lines. If the bug requires more context, link to file:line instead.
- No emojis.
- No marketing language.

## Footer (optional)

```
---
**Recurring / unresolved from prior runs:**
- BUG-YYYY-MM-DD-NN — <one line> — still unresolved as of today
```

Only include the footer if there are recurring items. Otherwise omit it entirely.
