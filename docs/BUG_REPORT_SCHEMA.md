# Bug Report Schema

Daily reports MUST follow this exact structure so the orchestrator can parse, dedupe, and email them.

## File location

`agent/reports/YYYY-MM-DD.md` — one file per run.

## File structure

```markdown
# Telos Bug Hunt — YYYY-MM-DD

**Focus:** Functional | Visual/UX | Performance | Security
**Bugs found:** N

---

## BUG-YYYY-MM-DD-001 — <one-line title>

- **Severity:** P0 | P1 | P2 | P3
- **File(s):** `path/to/file.js:LINE` (or multiple, comma-separated)
- **Category:** functional | visual | performance | security

### What's wrong
<2-4 sentences. Concrete. Reference the exact lines.>

### How to reproduce
<Numbered steps OR exact code trace. Must let Thomas verify in under 60 seconds.>

### Suggested fix
<One paragraph. Don't write the patch — describe the approach.>

---

## BUG-YYYY-MM-DD-002 — ...

(same structure)
```

## Rules

1. **Bug IDs** are `BUG-YYYY-MM-DD-NNN` — date of the report + 3-digit sequence starting at 001.
2. **Severity** is required and must be one of P0/P1/P2/P3.
3. **File paths** must be relative to repo root and include line numbers when applicable.
4. **One H2 per bug** — the parser splits on `## BUG-`.
5. **Zero bugs?** Write the header, set "Bugs found: 0", then write a single paragraph explaining what was checked. Do not pad.

## Example zero-bug report

```markdown
# Telos Bug Hunt — 2026-06-08

**Focus:** Performance
**Bugs found:** 0

Reviewed bundle size of style.css (52 KB), the inline scripts in thomas.html and
client-dashboard.html, and image sizes in /images. Nothing crossed the threshold
for a real performance bug. Lighthouse mobile score on /index was 94. No findings.
```
