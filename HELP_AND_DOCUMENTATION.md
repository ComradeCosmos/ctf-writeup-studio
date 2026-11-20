# CTF Writeup Studio — Technical Documentation & Operational FAQ

> **Why is this documentation in Markdown rather than an in-app screen?**
>
> In high-intensity Capture The Flag (CTF) competitions and vulnerability research workflows, the workstation UI must remain distraction-free, lightweight, and focused purely on operational tasks: terminal execution, evidence capture, writeup synthesis, and compliance checks.
> 
> Moving the Help & Documentation out of the in-app web interface into this version-controlled Markdown file (`HELP_AND_DOCUMENTATION.md`) accomplishes several key design principles:
> 1. **Offline & Air-Gapped Accessibility**: Researchers competing in restricted or air-gapped lab environments can inspect this documentation directly from their terminal (`glow`, `cat`, `less`), IDE, or terminal multiplexer without launching the web server.
> 2. **Zero Runtime Overhead**: Removes unnecessary DOM weight, polling loops, and redundant UI elements from the active workspace view.
> 3. **Git-Tracked Auditability**: Changes, additions to contest regulations, and operational FAQs are tracked directly through standard Git commits alongside writeup deliverables.

---

## Technical Frequently Asked Questions (FAQ)

### 1. How does the terminal connector run commands?
- **Architecture**: The studio connects directly to your local workstation shells (Windows PowerShell, WSL 2 Ubuntu-24.04, Kali Linux, Bash, Zsh) via the local FastAPI daemon running on `127.0.0.1:8000`.
- **Telemetry & Signatures**: Every executed command records:
  - Precise start timestamp and wall-clock execution duration.
  - Process exit code (`0` for success, non-zero for errors).
  - Raw `stdout` and `stderr` output streams.
  - Immutable **SHA-256 cryptographic signatures** generated at execution time to prove provenance.
- **Safety Previews**: Commands and directories are previewed before execution; no unvetted commands execute autonomously.

### 2. How do I mark commands as evidence?
- In the **Live Session Recorder**, locate any command execution row and click **Mark as Evidence**.
- The studio extracts:
  - Exact command line invocation string.
  - Wall-clock latency and timestamp.
  - Complete terminal output payload.
- It calculates an immutable SHA-256 digest and records the artifact in the **Evidence Vault** under `data/evidence/` with a reference ID (e.g., `EV-001`), ready for 1-click citation in your writeup.

### 3. How does the AI Explainer prevent AI slop?
- The AI Explainer enforces strict **Anti-AI-Slop constraints**:
  - **Zero Conversational Preambles**: Strips out generic intros like *"In this comprehensive guide, we will explore..."*.
  - **Mandatory Command Grounding**: Every claim, exploit step, or finding must link directly to an executed terminal record or evidence file.
  - **Authentic Practitioner Tone**: Uses technical vulnerability terminology (e.g., *JWT Algorithm Confusion RS256-to-HS256 key mismatch*), exact memory offsets, tool parameters, and reproduction scripts.
- **7-Point Action Breakdown Format**:
  1. What the command does
  2. Why it was executed
  3. Important argument explanation
  4. What the output indicates
  5. What was discovered
  6. How it contributes to solving the challenge
  7. What the next logical step is

### 4. How does the Rule Engine work?
- The compliance engine audits writeups against **12 competition regulation categories**:
  - **Flag Redaction**: Automatic scanning and masking of raw flag tokens (`CTF{...}`) before export.
  - **Mandatory Screenshots**: Confirms required graphical evidence for shell access or key findings.
  - **Internal Lab IP Masking**: Enforces redaction of RFC1918 private lab addresses (`10.x.x.x`, `192.168.x.x`).
  - **Required Technical Sections**: Checks for Executive Summary, Reconnaissance, Vulnerability Identification, Step-by-Step Reproduction, and Remediation.
  - **Embargo Enforcement**: Prevents public export or publishing prior to competition end.
- **Custom Rules**: Allows defining custom regex patterns, forbidden keywords, word counts, and section checklists with severity levels (`mandatory`, `high`, `medium`, `advisory`).

### 5. Where is writeup data stored?
- **100% Localhost Storage**: All writeup Markdown files, terminal session transcripts, and evidence logs reside strictly on your local machine:
  - SQLite database: `data/ctf_studio.db`
  - Evidence repository: `data/evidence/`
- **Zero Telemetry**: Zero external analytics, cloud tracking, or external API calls are made. Your research and unpublished exploit chains remain entirely private on your machine.

---

## Workspace Status & Health Checks

- **Backend Daemon**: FastAPI on `http://127.0.0.1:8000` (FastAPI + Uvicorn)
- **Frontend Server**: Vite dev server on `http://127.0.0.1:5173`
- **Daemon Health Endpoint**: `GET /api/v1/sessions/environments` or `HEAD /docs`

To manually test daemon health from the CLI:
```bash
# Windows PowerShell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/sessions/environments"

# Linux / WSL / macOS
curl -s http://127.0.0.1:8000/api/v1/sessions/environments | jq .
```

---

## Responsible Research & Scope Policy

1. **Authorized Scope Only**: Only execute commands against challenge instances, lab ranges, and IP targets explicitly assigned by contest organizers.
2. **Embargo Adherence**: Never publish or share solution writeups, exploit payloads, or flag tokens while a competition is actively running.
3. **Evidence Integrity**: Never alter raw captured terminal outputs or screenshots. Always use non-destructive annotations to preserve original SHA-256 hashes for post-competition review and judging.
