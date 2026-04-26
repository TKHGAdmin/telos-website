# Bug Report Schema

The orchestrator's parser expects this exact structure. Reports live at
`agent/reports/YYYY-MM-DD.md`.

## File structure

```markdown
# Telos Bug Hunter — YYYY-MM-DD

**Focus:** Functional | Visual/UX | Performance | Security
**Bugs found:** N

## Summary

One-paragraph plain-English summary. If zero bugs, say so plainly here and
omit all sections below.

## Bugs

### BUG-YYYYMMDD-NN — <Short title>

- **Severity:** P0 | P1 | P2 | P3
- **Area:** functional | visual | performance | security
- **Location:** `path/to/file.ext:LINE` (or `:LINE-LINE` for ranges)

**What's wrong**
<2-4 sentences. State the bug, not the fix.>

**Reproduction**
<Numbered steps OR a code trace pointing at the exact lines.>

**Impact**
<Who is affected and how. Be concrete: "all visitors to /pricing", not "users".>

**Suggested fix**
<One concrete sentence. Pseudo-diff acceptable for short fixes.>

---

## Notes

Optional. Things you investigated but ruled out, or context Thomas should
know that isn't a bug.
```

## Rules

1. Bug IDs are `BUG-YYYYMMDD-NN`, NN starts at 01, zero-padded.
2. Severity must be exactly one of P0/P1/P2/P3.
3. Use file:line links so Thomas can jump straight to the code.
4. Order bugs by severity (P0 → P3), then by file path.
5. Keep each bug under ~150 words. The fix-line goes in the suggested fix.
6. If zero bugs, the "Bugs" and "Notes" sections may be omitted.
7. No emojis. No filler. No "I hope this helps" tone.
