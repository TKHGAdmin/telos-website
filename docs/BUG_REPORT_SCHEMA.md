# Bug Report Schema

Every daily report at `agent/reports/YYYY-MM-DD.md` must follow this exact structure. The email pipeline parses these files by heading and marker.

## Front matter

Every report starts with a YAML front matter block:

```
---
date: YYYY-MM-DD
focus: Functional | Visual/UX | Performance | Security
bugsFound: <integer>
runDurationMinutes: <integer or null>
---
```

## Body

### Summary
A single paragraph (max 3 sentences) describing what was hunted and the headline finding. If zero bugs, say so plainly.

### Findings
Zero or more bug entries. Each finding uses this exact structure:

```
#### BUG-<YYYYMMDD>-<NN> — <one-line title>

- **Severity:** P0 | P1 | P2 | P3
- **File(s):** `path/to/file.js:LINE` (comma-separated if multiple)
- **Category:** functional | security | ux | performance | data-integrity
- **Reproduction:** 1-3 sentences describing how to trigger it
- **Impact:** 1-2 sentences on who is hurt and how
- **Suggested fix:** 1-3 sentences with a concrete direction (not a full patch)
- **Confidence:** high | medium

<optional 1-paragraph "why this matters" explaining tradeoffs>
```

The BUG ID format is `BUG-YYYYMMDD-NN` where NN is a zero-padded two-digit counter for that day (01, 02, ...).

### Not Reported (Deferred)
Optional list of things the agent noticed but chose not to include, and why. This section proves the triage gate is working. Keep entries to one line each.

### Recurring
Optional list of prior bug IDs still unresolved. Each entry: `BUG-<prior date>-<NN> — <one-line status>`.

## Parser rules

- Front matter must be valid YAML.
- The `## Findings` heading must exist even when empty.
- Every finding line beginning with `- **` must contain a bolded label followed by a colon.
- Bug IDs must be unique across all reports.
- Do not use em dashes anywhere in the report (use `-`).
