# Approval Protocol

How your approve/deny decisions get back to the agent.

## Phase 1 - Email (starting now)

Each morning, you receive an email with the day's report. To approve or deny bugs, **reply to the email** with this exact format:

```
BUG-2026-04-16-001: approve
BUG-2026-04-16-002: deny - false positive, that timeout is intentional for rate-limiting
BUG-2026-04-16-003: approve
BUG-2026-04-16-004: fixed
```

### Valid verdicts

| Verdict | Meaning | Effect on agent |
|---|---|---|
| `approve` | Real bug, worth fixing | Agent reinforces this pattern as a signal of real bugs |
| `deny` | False positive or not actually a bug | Agent avoids this pattern going forward |
| `fixed` | Real bug, already addressed | Agent stops tracking it; learns the pattern was valid |
| `defer` | Real bug, not now | Agent stops re-reporting for 14 days |

### Rules

- One verdict per line
- Anything after `-` or `#` on a verdict line is treated as a reason and logged (helpful for `deny` especially)
- Bugs not mentioned in your reply default to **still-pending** - they'll appear in tomorrow's report as recurring
- Subject line must start with `RE:` so the agent's inbox poller picks it up

### What the agent does with your replies

On each run, the agent checks the reply-to inbox for new responses, parses them, and appends to `agent/memory/decisions.jsonl`:

```jsonl
{"bug_id":"BUG-2026-04-16-001","verdict":"approve","reason":null,"ts":"2026-04-16T14:22:11Z"}
{"bug_id":"BUG-2026-04-16-002","verdict":"deny","reason":"false positive, that timeout is intentional for rate-limiting","ts":"2026-04-16T14:22:11Z"}
```

This file is the agent's training signal. More data = better agent.

## Phase 2 - Dashboard (future)

When `telosathleticclub.com/thomas` is ready, the agent POSTs the report to your endpoint instead of emailing. Payload:

```json
{
  "report_date": "2026-04-16",
  "focus": "functional",
  "commit_scanned": "abc123def456",
  "bugs": [
    {
      "id": "BUG-2026-04-16-001",
      "severity": "P0",
      "area": "Checkout / Payment",
      "files": ["src/components/Checkout.tsx:142-168"],
      "first_seen": "2026-04-16",
      "whats_wrong": "...",
      "how_to_reproduce": "...",
      "suggested_fix": "...",
      "evidence": "...",
      "status": "pending-review"
    }
  ]
}
```

Your dashboard then POSTs verdicts back to an endpoint the agent polls:

```
POST https://telosathleticclub.com/api/agent/verdicts
{
  "verdicts": [
    {"bug_id": "BUG-2026-04-16-001", "verdict": "approve"},
    {"bug_id": "BUG-2026-04-16-002", "verdict": "deny", "reason": "..."}
  ]
}
```

To swap from email → dashboard: edit `agent/run.py`, change `from reporters.email import send` to `from reporters.webhook import send`. Everything else stays the same.

## Why this matters

The agent has no ability to self-correct without your verdicts. If you go a month without responding:

- The agent assumes every bug it reported was valid
- It expands its hunting scope based on false confidence
- Reports get noisier over time

Minimum useful cadence: respond to at least 3 reports per week. If you can't, pause the agent (disable the GitHub Action) until you can engage with it.
