"""
Telos Bug Hunter - orchestrator.

Runs once per GitHub Actions invocation. Loads the agent's memory, invokes
Claude with the system prompt from AGENT_INSTRUCTIONS.md, writes the report,
updates memory, and emails Thomas.

This file is intentionally simple. The intelligence lives in AGENT_INSTRUCTIONS.md
and in learnings.md - edit those, not this.
"""

import json
import os
import smtplib
import subprocess
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from zoneinfo import ZoneInfo

import anthropic

ROOT = Path(__file__).parent.parent
AGENT_DIR = ROOT / "agent"
MEMORY_DIR = AGENT_DIR / "memory"
REPORTS_DIR = AGENT_DIR / "reports"
TARGET_APP = Path(os.environ.get("TARGET_APP_DIR", "./target-app")).resolve()

MODEL = "claude-opus-4-7"  # Swap to claude-sonnet-4-6 to cut costs ~5x
MAX_TOKENS = 8000

ET = ZoneInfo("America/New_York")


def load_system_prompt() -> str:
    """The agent's role definition."""
    return (ROOT / "AGENT_INSTRUCTIONS.md").read_text()


def load_context() -> str:
    """Everything the agent needs to know about past runs."""
    parts = []

    # Memory
    learnings = MEMORY_DIR / "learnings.md"
    if learnings.exists():
        parts.append(f"## Accumulated learnings\n\n{learnings.read_text()}")

    decisions = MEMORY_DIR / "decisions.jsonl"
    if decisions.exists():
        parts.append(f"## Past approval decisions\n\n```\n{decisions.read_text()}\n```")

    # Recent reports (last 7)
    recent = sorted(REPORTS_DIR.glob("*.md"), reverse=True)[:7]
    if recent:
        parts.append("## Last 7 days of reports\n")
        for r in recent:
            parts.append(f"### {r.name}\n\n{r.read_text()}\n")

    # Focus rotation
    focus_file = MEMORY_DIR / "focus-rotation.json"
    if focus_file.exists():
        focus = json.loads(focus_file.read_text())
    else:
        focus = {"next": "functional", "cycle": ["functional", "visual", "performance", "security"]}
    parts.append(f"## Today's focus: **{focus['next']}**")

    # Current commit
    try:
        commit = subprocess.check_output(
            ["git", "-C", str(TARGET_APP), "rev-parse", "HEAD"], text=True
        ).strip()
        parts.append(f"## Target app commit: `{commit}`")
    except subprocess.CalledProcessError:
        parts.append("## Target app commit: unknown")

    return "\n\n".join(parts)


def rotate_focus() -> str:
    focus_file = MEMORY_DIR / "focus-rotation.json"
    if focus_file.exists():
        data = json.loads(focus_file.read_text())
    else:
        data = {"next": "functional", "cycle": ["functional", "visual", "performance", "security"]}
    current = data["next"]
    idx = data["cycle"].index(current)
    data["next"] = data["cycle"][(idx + 1) % len(data["cycle"])]
    focus_file.write_text(json.dumps(data, indent=2))
    return current


def run_agent(system: str, context: str, focus: str) -> str:
    """Invoke Claude and return the generated report Markdown."""
    client = anthropic.Anthropic()

    user_message = f"""Today's run.

{context}

Execute your daily routine per AGENT_INSTRUCTIONS.md. Today's focus is **{focus}**.

The target app repo is cloned at `{TARGET_APP}`. You can use bash to run commands against it (lint, audit, build, etc.).

Produce the full Markdown report as your response. Do not include any preamble or explanation outside the report itself - your entire response will be written directly to `agent/reports/{datetime.now(ET).date()}.md`.
"""

    # Note: in GitHub Actions, the agent runs as a single large completion.
    # For true tool use (bash, file reads), swap this to the Messages API with
    # tool_use blocks. This simpler version relies on the context already being
    # prepared - suitable for static analysis. Upgrade path documented in README.
    response = client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=system,
        messages=[{"role": "user", "content": user_message}],
    )

    return response.content[0].text


def write_report(markdown: str) -> Path:
    date_str = datetime.now(ET).date().isoformat()
    path = REPORTS_DIR / f"{date_str}.md"
    path.write_text(markdown)
    return path


def count_bugs(report: str) -> int:
    # Simple heuristic - counts bug headings
    return sum(1 for line in report.splitlines() if line.startswith("## BUG-"))


def send_email(report_path: Path, bug_count: int) -> None:
    gmail_user = os.environ["GMAIL_USER"]
    gmail_pw = os.environ["GMAIL_APP_PASSWORD"]
    to = os.environ["APPROVAL_EMAIL"]

    subject = f"Telos Bug Hunter - {report_path.stem} - {bug_count} bug{'s' if bug_count != 1 else ''}"

    body_intro = (
        "Reply to this email with approve/deny verdicts per docs/APPROVAL_PROTOCOL.md.\n\n"
        "Format example:\n"
        "  BUG-2026-04-16-001: approve\n"
        "  BUG-2026-04-16-002: deny - reason here\n\n"
        "---\n\n"
    )

    msg = MIMEMultipart()
    msg["From"] = gmail_user
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(body_intro + report_path.read_text(), "plain"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(gmail_user, gmail_pw)
        server.send_message(msg)


def main() -> None:
    MEMORY_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    system = load_system_prompt()
    context = load_context()
    focus = rotate_focus()

    print(f"[{datetime.now(timezone.utc).isoformat()}] Starting hunt. Focus: {focus}")

    report_md = run_agent(system, context, focus)
    report_path = write_report(report_md)
    bug_count = count_bugs(report_md)

    print(f"Report written to {report_path} - {bug_count} bugs")

    send_email(report_path, bug_count)
    print("Email sent.")


if __name__ == "__main__":
    main()
