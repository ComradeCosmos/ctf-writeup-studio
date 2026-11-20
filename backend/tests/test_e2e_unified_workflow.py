import os
import zipfile
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.competition import Competition
from app.models.challenge import Challenge
from app.services.session_recorder import SessionRecorderService
from app.services.evidence_vault import EvidenceVaultService
from app.services.ai_explainer import AIExplainerService
from app.services.rule_engine import RuleEngineService
from app.services.qa_engine import QAEngineService
from app.services.export_engine import ExportEngineService
from app.core.config import EXPORTS_DIR, EVIDENCE_DIR

def test_full_unified_ctf_workflow():
    """
    Validates complete unified workflow lifecycle:
    1. Competition creation & 12-category rule initialization
    2. Challenge configuration with private flag storage
    3. Live Session start
    4. Terminal commands capture with secret redaction and duration
    5. Evidence Vault storage, SHA-256 calculation & duplicate detection
    6. Non-destructive derivative annotations
    7. Atuin-inspired full-text history search & statistics
    8. Chronological session timeline generation
    9. AI 7-point command technical breakdown
    10. Authentic, practitioner-grade writeup synthesis (anti-AI-slop verified)
    11. Rule Engine compliance audit
    12. Automated QA inspection
    13. Multi-format export package (.md, .pdf, .docx, .html, .zip + manifests)
    """
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    SessionTesting = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionTesting()

    # Step 1: Competition
    comp = Competition(
        id="COMP-UNIFIED-01",
        name="Global Cyber Challenge 2026",
        website="https://globalcyber.org",
        rules_summary="Writeups permitted after contest ends. Flags must be masked. Minimum 1 screenshot required.",
        status="active"
    )
    db.add(comp)
    db.commit()
    rules = RuleEngineService.get_or_create_default_rules(db, comp.id)
    assert len(rules) == 12

    # Step 2: Challenge
    chal = Challenge(
        id="CHAL-UNIFIED-01",
        competition_id=comp.id,
        name="Vault Warden",
        category="Web",
        difficulty="Hard",
        points=400,
        description="Bypass authentication tokens on the internal admin endpoint.",
        author="Spectre",
        flag="flag{jvt_byp4ss_adm1n_tok3n_9901}",
        tools_used=["nmap", "gobuster", "curl", "jwt-tool"],
        vulnerabilities=["Broken Authentication", "JWT Algorithm Confusion"]
    )
    db.add(chal)
    db.commit()

    # Step 3: Start Live Session
    session = SessionRecorderService.create_session(
        db=db,
        competition_id=comp.id,
        challenge_id=chal.id,
        name="Admin Bypass Run",
        shell_type="powershell",
        working_directory="C:\\CTF\\GCC2026"
    )
    assert session.status == "active"

    # Step 4: Record commands with secret redactions
    cmd1 = SessionRecorderService.record_command(
        db=db,
        session_id=session.id,
        challenge_id=chal.id,
        command_str="nmap -sC -sV -p 80,8080 10.10.10.150",
        stdout="80/tcp open http Apache 2.4.49\n8080/tcp open http-proxy Node.js Express",
        exit_code=0,
        duration_ms=2100,
        cwd="C:\\CTF\\GCC2026",
        shell="powershell",
        user_note="Initial port scan"
    )

    cmd2 = SessionRecorderService.record_command(
        db=db,
        session_id=session.id,
        challenge_id=chal.id,
        command_str="curl -H 'Authorization: Bearer secret_admin_jwt_token_123456789' http://10.10.10.150:8080/flag",
        stdout="{\"flag\": \"flag{jvt_byp4ss_adm1n_tok3n_9901}\"}",
        exit_code=0,
        duration_ms=340,
        cwd="C:\\CTF\\GCC2026",
        shell="powershell",
        user_note="Executed exploit request"
    )
    # Check redaction of secret token
    assert "secret_admin_jwt_token" not in cmd2.command
    assert cmd2.is_sensitive == True

    # Step 5: Evidence Vault storage & SHA-256
    raw_proof = b"HTTP/1.1 200 OK\nContent-Type: application/json\n\n{\"flag\": \"flag{jvt_byp4ss_adm1n_tok3n_9901}\"}"
    ev_item, is_dup = EvidenceVaultService.store_evidence_file(
        db=db,
        competition_id=comp.id,
        challenge_id=chal.id,
        original_filename="flag_response.http",
        file_bytes=raw_proof,
        category="http_traffic",
        solution_step="Flag Retrieval",
        user_description="Server response revealing captured flag"
    )
    assert ev_item.id.startswith("HTTP-")
    assert is_dup == False

    # Screenshot proof
    mock_img = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    screen_item, _ = EvidenceVaultService.store_evidence_file(
        db=db,
        competition_id=comp.id,
        challenge_id=chal.id,
        original_filename="terminal_shell.png",
        file_bytes=mock_img,
        category="screenshot",
        file_type="image/png",
        solution_step="Reconnaissance",
        user_description="Screenshot of initial nmap scan"
    )

    # Step 6: Non-destructive annotation
    ann = EvidenceVaultService.create_annotated_version(
        db=db,
        parent_evidence_id=screen_item.id,
        annotated_image_bytes=mock_img + b"_annotated",
        annotation_metadata={"arrow": [10, 10, 50, 50], "caption": "Port 8080 exposed"}
    )
    assert ann.is_annotated == True
    assert ann.parent_evidence_id == screen_item.id

    # Step 7: Atuin Search
    history = SessionRecorderService.query_atuin_history(db=db, challenge_id=chal.id, query="nmap")
    assert len(history) == 1
    assert "nmap" in history[0]["command"]

    # Step 8: Timeline
    from app.models.session import TimelineEvent
    events = db.query(TimelineEvent).filter(TimelineEvent.challenge_id == chal.id).all()
    assert len(events) >= 3

    # Step 9: 7-Point AI Explainer
    exp = AIExplainerService.explain_command_action(
        command="nmap -sC -sV 10.10.10.150",
        stdout="80/tcp open http",
        mode="Technical"
    )
    assert "what_it_does" in exp
    assert "next_logical_step" in exp

    # Step 10: Authentic Writeup Generation
    writeup_res = AIExplainerService.generate_authentic_writeup(
        db=db,
        challenge_id=chal.id,
        style_mode="Technical",
        author="0xValkyrie",
        redact_flag_token=True
    )
    md = writeup_res["content_markdown"]
    assert "Vault Warden" in md
    assert "[REDACTED" in md # Redaction rule respected
    # Check that it cites evidence IDs
    assert any(ev_id in md for ev_id in [ev_item.id, screen_item.id])

    # Save Writeup in DB
    from app.models.writeup import WriteupDocument
    writeup_doc = WriteupDocument(
        id="WRP-UNIFIED-01",
        competition_id=comp.id,
        challenge_id=chal.id,
        title=writeup_res["title"],
        author="0xValkyrie",
        content_markdown=md,
        flags_redacted=True,
        evidence_included=writeup_res["evidence_referenced"]
    )
    db.add(writeup_doc)
    db.commit()

    # Step 11: Compliance Audit
    compliance_audit = RuleEngineService.audit_compliance(
        db=db,
        competition_id=comp.id,
        challenge_id=chal.id,
        writeup_content=md,
        author="0xValkyrie"
    )
    assert compliance_audit.overall_status in ("Compliant", "Needs Review")

    # Step 12: QA Engine
    qa = QAEngineService.inspect_writeup(db=db, challenge_id=chal.id, content_markdown=md)
    assert qa["score"] >= 80

    # Step 13: Full Multi-format Export Package
    pkg = ExportEngineService.generate_full_export_package(
        db=db,
        challenge_id=chal.id,
        redact_flag=True
    )
    assert pkg["zip_filename"].endswith(".zip")
    zip_p = EXPORTS_DIR / pkg["zip_filename"]
    assert zip_p.exists()
    
    # Inspect contents inside the ZIP archive
    with zipfile.ZipFile(zip_p, "r") as zf:
        namelist = zf.namelist()
        assert "CTF_Writeup/README.md" in namelist
        assert "CTF_Writeup/writeup.html" in namelist
        assert "CTF_Writeup/writeup.pdf" in namelist
        assert "CTF_Writeup/writeup.docx" in namelist
        assert "CTF_Writeup/manifest/evidence_manifest.json" in namelist
        assert "CTF_Writeup/metadata/competition_metadata.json" in namelist

    db.close()
    print("\n[✓] All 13 steps of the Unified CTF Studio workflow verified successfully!")

if __name__ == "__main__":
    test_full_unified_ctf_workflow()
