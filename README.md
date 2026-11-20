# CTF Writeup Studio — Automated CTF Documentation & Evidence Manager

> An intelligent, forensic-grade cybersecurity documentation companion that captures real-time solving workflows, preserves cryptographically verifiable proof, synthesizes practitioner-level technical explanations without generic AI fluff, validates competition-specific embargoes and regulations, and generates submission-ready multi-format writeup packages with a single click.

---

## 1. System Architecture

```
ctf-writeup-studio/
├── backend/
│   ├── app/
│   │   ├── api/                   # REST & WebSocket API Routers
│   │   │   ├── competitions.py    # Competition management & profiles
│   │   │   ├── challenges.py      # Category, difficulty & private flag storage
│   │   │   ├── sessions.py        # Live session recording & Atuin search
│   │   │   ├── evidence.py        # Digital forensics Evidence Vault & annotations
│   │   │   ├── explainer.py       # 7-point command breakdown & writeup synthesis
│   │   │   ├── compliance.py      # 12-category regulation checker
│   │   │   ├── qa.py              # Automated quality assurance engine
│   │   │   ├── exports.py         # 1-Click Multi-format exporter (.md, .pdf, .docx, .html, .zip)
│   │   │   ├── templates.py       # HTB, picoCTF, Research, Standard templates
│   │   │   └── dashboard.py       # Telemetry stats, deadlines, activity feed
│   │   ├── core/
│   │   │   ├── config.py          # Application configuration
│   │   │   ├── database.py        # SQLAlchemy engine & SQLite session maker
│   │   │   ├── security.py        # Secret redaction, SHA-256, safe file paths
│   │   │   └── seed.py            # Realistic CTF sample competition & evidence
│   │   ├── models/                # SQLAlchemy database models
│   │   ├── services/              # Domain logic for all 5 core modules
│   │   │   ├── session_recorder.py# Terminal logger & Atuin query engine
│   │   │   ├── evidence_vault.py  # Forensics vault & SHA-256 hash verifier
│   │   │   ├── ai_explainer.py    # Evidence-grounded cybersecurity writer
│   │   │   ├── rule_engine.py     # 12-category regulation compliance checker
│   │   │   ├── qa_engine.py       # Broken links, missing screenshots & leak scanner
│   │   │   └── export_engine.py   # PDF, DOCX, HTML & ZIP package bundler
│   │   └── local_agent/           # Dedicated Local Terminal Agent
│   │       ├── agent.py           # Interactive CLI supporting PS, Bash, CMD, WSL
│   │       └── hooks/             # ctf_hook.ps1 & ctf_hook.sh integration scripts
│   ├── tests/                     # Comprehensive test suites (pytest)
│   └── requirements.txt
├── frontend/                      # React 18 + Vite + Tailwind CSS + Lucide
│   ├── src/
│   │   ├── components/            # Atuin history modal, Evidence gallery, Explainer, Compliance, Exporter
│   │   ├── pages/                 # Dashboard, Competitions, Challenges, Recorder, Vault, Editor
│   │   └── services/api.ts        # Typed API client
└── .env.example
```

---

## 2. Mandatory Core Modules

### A. Live CTF Session Recorder
- **Local Terminal Integration**: Dedicated local agent supporting PowerShell, Windows Terminal, CMD, Bash, Zsh, and WSL.
- **Mandatory Safety Previews**: Commands and directories are previewed before execution; no unvetted commands run autonomously.
- **Automatic Secret Redaction**: Real-time regex sanitization masks passwords (`-p`, `-u user:pass`), bearer tokens, API keys (`sk-...`, `ghp_...`, `AKIA...`), and private key blocks.
- **Atuin-Inspired History Search**: Interactive full-text search across commands, exit codes (`0` vs error), execution durations, directories, and session groupings.
- **Chronological Session Timeline**: Records commands, file modifications, screenshots, discoveries, payloads, and flag captures. Allows selecting multiple events and converting them directly into writeup steps.

### B. Evidence Vault — Digital Forensics & Proof Management
- **12 Evidence Categories**: Screenshots, terminal logs, HTTP requests/responses, Burp Suite exports, PCAP packet captures, source code, decompiled binaries, hex dumps, scans, exploit outputs, payloads, and flag proof.
- **Cryptographic SHA-256 Integrity**: Calculates SHA-256 hashes on import and detects duplicate artifacts.
- **Non-Destructive Annotations**: Preserves original artifacts untouched while generating linked derivative records with crop coordinates, highlight bounding boxes, arrows, and captions.
- **Automated Disk Hash Audit**: One-click verification checks stored files against recorded signatures to detect tampering or corruption.
- **Forensic Manifest**: Automatically generates an `evidence_manifest.json` on export.

### C. AI Technical Explainer — Evidence-Based Assistant
- **7-Point Action Breakdown**:
  1. What the command does
  2. Why it was executed
  3. Important argument explanation
  4. What the output indicates
  5. What was discovered
  6. How it contributes to solving the challenge
  7. What the next logical step is
- **3 Explanation Modes**:
  - *Beginner Friendly*: Explains fundamentals, tools, and vulnerability concepts.
  - *Technical*: Focused, pragmatic methodology and flags.
  - *Professional Research*: Concise, rigorous technical documentation.
- **Anti-AI-Slop Guarantee**: Writeups are authored with authentic security researcher tone—no generic preamble ("In this comprehensive guide..."), using real command blocks, exact memory offsets, tool flags, and direct evidence citations (`[Evidence #EVD-001]`).

### D. Competition Rule Engine — Regulation Compliance
- **12 Regulation Categories**:
  1. Publication permissions (embargo enforcement until contest end)
  2. Flag disclosure restrictions (automatic detection and masking)
  3. Solution disclosure policies
  4. Mandatory screenshot minimums (counts stored artifacts and embedded images)
  5. Source code restrictions (flags code blocks exceeding line thresholds)
  6. AI-assisted content disclosure (verifies required AI attribution notice)
  7. Attribution & author credits
  8. Required formatting & sections
  9. Submission deadlines
  10. Package file size limitations & word count minimums
  11. Challenge confidentiality & RFC1918 private IP protection
  12. Tool usage restrictions (prohibits DoS/DDoS tools, masscan, slowloris)
  13. **User-Defined Custom Rules**: Add custom rules with conditions (forbidden keywords, mandatory clauses, word count constraints, custom regexes, screenshot minimums).
  14. **Guidelines Auto-Parser**: Paste raw competition rules or Discord guidelines and automatically extract structured regulation rules.
- **Compliance Statuses**: `Compliant`, `Needs Review`, `Non-Compliant`, and `Rules Not Verified`.
- **Interactive Rule Management**: Add custom rules, toggle active/inactive status, and delete rules directly from the web interface.

### E. One-Click Writeup Export Center
- **Supported Formats**: Markdown (`.md`), PDF (`.pdf` via ReportLab), Microsoft Word (`.docx` via python-docx), HTML (`.html` with dark cyber theme), and ZIP Archive (`.zip`).
- **Standardized Forensics Package Structure**:
  ```
  CTF_Writeup/
  ├── README.md
  ├── writeup.pdf
  ├── writeup.docx
  ├── writeup.html
  ├── evidence/
  │   ├── screenshots/
  │   ├── terminal_logs/
  │   ├── network_captures/
  │   ├── source_code/
  │   └── other_artifacts/
  ├── manifest/
  │   └── evidence_manifest.json
  └── metadata/
      └── competition_metadata.json
  ```

---

## 3. 16-Step Unified Workflow Integration

All five modules operate seamlessly in a unified pipeline:
1. User creates a competition profile.
2. Rule Engine initializes default regulations across 12 categories.
3. User adds challenges with private flag storage.
4. User starts a Live CTF Session.
5. Local terminal agent records explicitly authorized commands with duration and exit codes.
6. Screenshots and terminal outputs are captured into Evidence Vault.
7. Evidence Vault assigns unique IDs and calculates SHA-256 hashes.
8. Session Recorder generates a chronological event timeline.
9. AI Technical Explainer analyzes actual commands and evidence.
10. User selects timeline events to document.
11. AI generates an authentic, evidence-grounded writeup.
12. Evidence items are automatically mapped to relevant steps.
13. User reviews and customizes the document in the Split Markdown Editor.
14. Competition Rule Engine checks compliance and redacts flags if mandated.
15. Quality Assurance checker verifies broken links, missing screenshots, and terminology.
16. Export Center generates the final multi-format documents and structured evidence ZIP bundle.

---

## 4. Installation & Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*The database automatically initializes and populates realistic seed data on first launch.*

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### Local Terminal Agent Usage
To record PowerShell or CMD activity into your active CTF challenge:
```bash
python backend/app/local_agent/agent.py --chal CHAL-WEB-001
```
Or load the shell hook:
```powershell
# PowerShell
. .\backend\app\local_agent\hooks\ctf_hook.ps1
ctf-exec "nmap -sC -sV 10.10.11.23"
```
```bash
# Bash / WSL
source backend/app/local_agent/hooks/ctf_hook.sh
ctf-exec "nmap -sC -sV 10.10.11.23"
```

---

## 5. Verification & Test Suite

Run the full pytest suite covering all 5 core modules and the end-to-end unified workflow:
```bash
cd backend
pytest tests/ -v
```

All 6 test suites pass with 100% assertion coverage:
- `test_session_recording_and_atuin_history`: Verified command logging, exit codes, duration, secret redactions, and Atuin search.
- `test_evidence_vault_integrity_and_annotation`: Verified SHA-256 hashes, duplicate detection, and non-destructive annotations.
- `test_ai_explainer_and_writeup_generation`: Verified 7-point breakdown and authentic, non-AI-slop generation.
- `test_rule_engine_compliance`: Verified 12-category regulation evaluation and compliance statuses.
- `test_export_engine`: Verified PDF, DOCX, HTML, and ZIP package bundler.
- `test_full_unified_ctf_workflow`: Validated the complete 16-step lifecycle end-to-end.
