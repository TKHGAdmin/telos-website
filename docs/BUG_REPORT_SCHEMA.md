# Bug Report Schema

Daily reports live at `agent/reports/YYYY-MM-DD.md` and MUST follow this schema. The downstream parser (and Thomas's approve/deny workflow) depend on it.

---

## File header (required)

```markdown
# Telos Bug Hunt — YYYY-MM-DD

- **Focus**: Functional | Visual/UX | Performance | Security
- **Run**: <ordinal, e.g. "Run 1">
- **Branch**: <git branch the run hunted>
- **Bugs found**: <integer>
- **Summary**: <one sentence>
```

## Zero-bug body (optional, replaces bug list)

If no bugs are found, the body is exactly:

```markdown
## No bugs found

<one paragraph: what was inspected, what was ruled out, why this is honest, not lazy>
```

## Bug list (required when bugs found)

Each bug is a `## Bug` section in this exact order. Repeat per bug.

```markdown
## Bug B-YYYYMMDD-N — <one-line title>

- **Severity**: P0 | P1 | P2 | P3
- **Area**: <file path or component name>
- **Confidence**: high | medium
- **Status**: new | recurring (from B-YYYYMMDD-N)

### Evidence
<file:line citations + verbatim quoted code snippet in a fenced block>

### Reproduction
<numbered steps a developer can follow to see the bug>

### Impact
<who is affected, what they observe, how often>

### Suggested fix
<one-line direction, NOT an implementation>
```

## Footer (required)

```markdown
---

## Notes for Thomas

<optional 1-3 sentence context: prior bugs to compare against, false-positive patterns to watch, anything that affects approve/deny>
```

---

## Hard rules

1. **Bug IDs must be unique per day.** Format `B-YYYYMMDD-N` (N starts at 1).
2. **No code suggestions in the report itself.** "Suggested fix" is direction only — the human applies the fix.
3. **Severities are evidence-based.** A P0 must demonstrate user impact or data exposure. A P3 is honest tech debt.
4. **Confidence drives inclusion.** Only ship findings the agent would defend in code review. "medium" should be rare — when in doubt, exclude.
5. **No emojis.** This is a tooling document.
