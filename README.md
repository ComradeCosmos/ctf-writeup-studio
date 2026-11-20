# CTF Writeup Studio

An automated documentation companion for Capture The Flag (CTF) players and security researchers. Capture solving workflows, preserve evidence, generate clear technical writeups, check competition rules, and export submission-ready reports.

## Features

- **Live Session Recorder**: Track commands, exit codes, and terminal outputs from PowerShell, CMD, Bash, or WSL with automatic secret and credential redaction.
- **Evidence Vault**: Store screenshots, network captures, exploit outputs, and logs with SHA-256 cryptographic hashing to maintain proof of flag capture.
- **AI Explainer**: Generate grounded, 7-point practitioner explanations for technical commands and exploit steps without generic AI filler.
- **Markdown Writeup Editor**: Split-screen live preview editor with custom templates (HackTheBox, PicoCTF, standard research formats), synchronized scrolling, and quick formatting tools.
- **Compliance & Rule Checker**: Verify writeups against competition rules, detect accidental flag disclosures, ensure required sections, and meet contest guidelines.
- **One-Click Export**: Export complete writeups into Markdown (.md), PDF, HTML, Word (.docx), or bundled ZIP packages containing all referenced evidence.

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.
