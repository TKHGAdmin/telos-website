# Telos Bug Hunter — Report Schema

Every daily report at `agent/reports/YYYY-MM-DD.md` MUST follow this schema. The orchestrator parses it to build the email digest.

## File layout

````markdown
# Telos Bug Hunter — YYYY-MM-DD

**Focus:** Functional | Visual/UX | Performance | Security
**Scan window:** <date>
**Findings:** <N>  (P0: <n>, P1: <n>, P2: <n>, P3: <n>)

## Summary

<Two or three sentences. Honest. "No findings today" is a valid summary.>

## Findings

### [P<0-3>] <short title>

- **ID:** YYYY-MM-DD-<slug>
- **File:** <repo-relative path>:<line>
- **Category:** security | correctness | performance | ux | accessibility | tech-debt
- **Status:** new | recurring (see <prior-id>)

**What's wrong**
<1-3 sentences, precise.>

**Reproduce**
<Exact steps, command, URL, or code trace. A reviewer must be able to confirm without guessing.>

**Impact**
<Who is affected and how. Concrete.>

**Suggested fix**
<The smallest change that resolves it. If uncertain, say so.>

---

<repeat per finding>

## Not reported (triage notes)

<Optional. Candidates you considered and rejected, with one-line reason each. Keeps the memory honest.>
````

## Rules

1. **Headings are literal.** `# Telos Bug Hunter — YYYY-MM-DD` must be the first line.
2. **Finding IDs are stable.** Once assigned, never reused. Format: `YYYY-MM-DD-<kebab-slug>`.
3. **Severity labels are literal.** `[P0]`, `[P1]`, `[P2]`, `[P3]` — bracket + digit, no other text.
4. **One finding per `### [P?]` heading.** Separate findings with `---`.
5. **If zero findings:** omit the `## Findings` section entirely. Keep the summary and header.
6. **Never include secrets.** Redact as `sk-XXX-REDACTED` and mark P0.
7. **Line numbers are stable snapshot references.** Report the line as it appears in the current working tree at scan time.
