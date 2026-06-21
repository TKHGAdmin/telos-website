# Bug Report Schema

Daily reports live at `agent/reports/YYYY-MM-DD.md` and must follow this exact structure so the `run.py` orchestrator can parse them.

---

## File header (required)

```markdown
# Telos Bug Hunter Report — YYYY-MM-DD

**Focus:** Functional | Visual/UX | Performance | Security
**Branch scanned:** <branch name>
**Commits inspected:** <git short-SHA range>
**Bugs found:** N
```

## Bugs section (zero or more)

For each finding, use the following block. Repeat as needed. Order P0 → P3.

```markdown
## BUG-YYYYMMDD-NN  P0 | P1 | P2 | P3  <short title>

**Status:** new | recurring (link to prior bug ID if recurring)
**Area:** <e.g. product-page, client-dashboard, api/submit-chs-application>
**Files:** path/to/file.html:LINE, path/to/file.js:LINE

### What's broken
One paragraph describing the issue concretely.

### Reproduction
1. Step
2. Step
3. Step

### Expected vs actual
- Expected: ...
- Actual: ...

### Suggested fix
Concrete suggestion (1-3 sentences). No code diffs unless necessary.
```

## Footer (required)

```markdown
---

## Notes
Any context the user might want (false-positive patterns avoided, areas not yet explored, etc.). Keep under 150 words.
```

---

## Rules

- **Bug IDs**: `BUG-YYYYMMDD-NN` where `NN` is zero-padded order in the report (`01`, `02`, …).
- **Severity** is one of `P0`, `P1`, `P2`, `P3` — exact strings.
- **Zero bugs**: Skip the bugs section entirely. The header and a one-line "No new bugs found today." after the header is sufficient.
- **No padding**: Do not invent issues to fill the report. Honesty > volume.
- **Markdown only**: No HTML, no images, no code blocks longer than 20 lines.
