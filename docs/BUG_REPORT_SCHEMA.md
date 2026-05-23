# Bug Report Schema

This is the contract between the Telos Bug Hunter agent and the email/parsing pipeline. The orchestrator (`run.py`) parses these files and renders them to email. Break this schema and the email won't send.

## File location

`agent/reports/YYYY-MM-DD.md` (one file per day, UTC date).

## File structure

```markdown
# Telos Bug Report - YYYY-MM-DD

**Focus:** Functional | Visual/UX | Performance | Security
**Bugs found:** N

---

## BUG-YYYYMMDD-NN | P0 | Short title

**Severity:** P0 | P1 | P2 | P3
**Area:** subsystem name (e.g., "client portal", "checkout", "admin dashboard")
**File(s):** path/to/file.js:LINE-LINE, other/file.js:LINE

### Symptom
What a user or developer would observe. One paragraph max.

### Reproduction
1. Step one
2. Step two
3. Step three

### Root cause
Why it happens, in plain language. Reference specific lines.

### Suggested fix
One or two sentences. Pseudocode allowed but not required.

### Confidence
high | medium | low - why you're sure / where you're unsure.

---

## BUG-YYYYMMDD-NN | P1 | Short title

(repeat block per bug)
```

## Header rules

- `# Telos Bug Report - YYYY-MM-DD` - exact format, used as email subject
- `**Focus:**` - today's rotation
- `**Bugs found:**` - integer, 0 is valid

## Bug ID rules

- Format: `BUG-YYYYMMDD-NN` where NN is two-digit zero-padded counter, starting at 01
- Globally unique across all reports - if you reference a prior bug, use its original ID
- The bug ID, severity, and short title MUST appear on a single line separated by ` | ` (pipe + space) for the parser

## Severity rules

- `P0` - breaks core functionality or exposes user data
- `P1` - degrades experience for many users
- `P2` - affects some users or edge cases
- `P3` - polish, tech debt, minor wins

## Sections per bug (required in order)

1. **Symptom** - one paragraph, observable behavior
2. **Reproduction** - numbered list, concrete steps OR description of the user flow that triggers it
3. **Root cause** - reference file:line, explain mechanism
4. **Suggested fix** - terse, actionable
5. **Confidence** - one of high/medium/low + one-line justification

## Zero-bug report

If no bugs are found, the body after the header is:

```markdown
No issues found in today's focus area. The codebase passes the {focus} checks I ran:

- (bullet list of what you checked and confirmed clean)

Next focus: {tomorrow's focus area}
```

A zero-bug report is a valid and honest report. Do not pad.

## Style rules

- No em dashes (`---` is reserved as the section divider only)
- Use hyphens for ranges and joins
- No emojis
- Reference file paths as `path/file.js:LINE` (parser-friendly)
- Keep each bug under ~300 words total
