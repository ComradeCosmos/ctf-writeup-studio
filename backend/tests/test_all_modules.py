import os
import pytest
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.competition import Competition
from app.models.challenge import Challenge
from app.models.session import Session, TerminalCommand, TimelineEvent
from app.models.evidence import Evidence
from app.models.writeup import WriteupDocument
from app.core.security import sanitize_sensitive_data, redact_flags, compute_sha256
from app.services.session_recorder import SessionRecorderService
from app.services.evidence_vault import EvidenceVaultService
from app.services.ai_explainer import AIExplainerService
from app.services.rule_engine import RuleEngineService
from app.services.qa_engine import QAEngineService
from app.services.export_engine import ExportEngineService
from app.core.config import EXPORTS_DIR

TEST_DB_URL = "sqlite:///:memory:"

@pytest.fixture
def db_session():
    engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    SessionTesting = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionTesting()
    
    # Setup dummy competition & challenge
    comp = Competition(
        id="COMP-TEST-01",
        name="CyberSec CTF 2026",
        website="https://test.ctf",
        rules_summary="Official rules: writeups permitted after contest ends.",
        status="active"
    )
    session.add(comp)
    session.commit()
    
    chal = Challenge(
        id="CHAL-TEST-01",
        competition_id=comp.id,
        name="Buffer Overflow 101",
        category="Pwn",
        difficulty="Medium",
        points=200,
        description="Exploit vulnerable buffer to call print_flag().",
        flag="flag{pwn_r0p_succ3ss_991}",
        tools_used=["checksec", "gdb", "pwntools"],
        vulnerabilities=["Buffer Overflow"]
    )
    session.add(chal)
    session.commit()
    
    yield session
    session.close()

# MODULE A TESTS: Live Session Recorder & Atuin History
def test_session_recording_and_atuin_history(db_session):
    # 1. Create session
    rec_session = SessionRecorderService.create_session(
        db=db_session,
        competition_id="COMP-TEST-01",
        challenge_id="CHAL-TEST-01",
        name="Pwn Exploit Session",
        shell_type="bash",
        working_directory="/home/user/ctf"
    )
    assert rec_session.id.startswith("SES-")
    assert rec_session.status == "active"
    
    # 2. Record command with secret redaction
    cmd_record = SessionRecorderService.record_command(
        db=db_session,
        session_id=rec_session.id,
        challenge_id="CHAL-TEST-01",
        command_str="curl -u admin:supersecretpassword123 http://10.10.11.50/api",
        stdout="Welcome admin! Key=sk-abcdefghijklmnopqrstuvwxyz123456",
        exit_code=0,
        duration_ms=450,
        cwd="/home/user/ctf",
        shell="bash",
        user_note="Initial API enumeration"
    )
    
    # Ensure sensitive credentials were automatically sanitized
    assert "supersecretpassword123" not in cmd_record.command
    assert "sk-abcdefghijklmnopqrstuvwxyz123456" not in cmd_record.stdout
    assert cmd_record.is_sensitive == True
    
    # 3. Atuin-inspired search
    history = SessionRecorderService.query_atuin_history(
        db=db_session,
        query="curl",
        challenge_id="CHAL-TEST-01"
    )
    assert len(history) == 1
    assert "curl" in history[0]["command"]

# MODULE B TESTS: Evidence Vault, SHA-256 & Non-destructive Annotations
def test_evidence_vault_integrity_and_annotation(db_session):
    raw_payload = b"GET /vulnerable?id=1' UNION SELECT 1,2,3-- HTTP/1.1\nHost: target.ctf"
    expected_hash = compute_sha256(raw_payload)
    
    evidence, is_dup = EvidenceVaultService.store_evidence_file(
        db=db_session,
        competition_id="COMP-TEST-01",
        challenge_id="CHAL-TEST-01",
        original_filename="sqli_proof.http",
        file_bytes=raw_payload,
        category="http_traffic",
        file_type="text/plain",
        solution_step="Vulnerability Identification",
        user_description="SQL injection proof request"
    )
    assert evidence.sha256_hash == expected_hash
    assert is_dup == False
    
    # Check duplicate detection
    _, dup_detected = EvidenceVaultService.store_evidence_file(
        db=db_session,
        competition_id="COMP-TEST-01",
        challenge_id="CHAL-TEST-01",
        original_filename="sqli_copy.http",
        file_bytes=raw_payload,
        category="http_traffic"
    )
    assert dup_detected == True
    
    # Check non-destructive annotation
    annotated_bytes = raw_payload + b"\n# Annotated: high risk injection point"
    ann_item = EvidenceVaultService.create_annotated_version(
        db=db_session,
        parent_evidence_id=evidence.id,
        annotated_image_bytes=annotated_bytes,
        annotation_metadata={"highlight_box": [10, 20, 100, 200]},
        user_description="Highlighted injection point"
    )
    assert ann_item.is_annotated == True
    assert ann_item.parent_evidence_id == evidence.id
    # Parent original hash remains preserved!
    assert evidence.sha256_hash == expected_hash

# MODULE C TESTS: AI Technical Explainer & Authentic Hacker Tone
def test_ai_explainer_and_writeup_generation(db_session):
    # Test 7-point command explanation
    exp = AIExplainerService.explain_command_action(
        command="nmap -sC -sV -p 22,80 10.10.11.50",
        stdout="PORT   STATE SERVICE VERSION\n80/tcp open  http    Apache 2.4.41",
        mode="Technical"
    )
    assert "what_it_does" in exp
    assert "why_executed" in exp
    assert "important_arguments" in exp
    assert "next_logical_step" in exp
    
    # Test authentic report generation
    result = AIExplainerService.generate_authentic_writeup(
        db=db_session,
        challenge_id="CHAL-TEST-01",
        style_mode="Technical",
        author="0xValkyrie",
        redact_flag_token=True
    )
    content = result["content_markdown"]
    # Check that report is grounded and doesn't contain generic AI preamble
    assert "In this comprehensive guide" not in content
    assert "embark on a journey" not in content
    assert "Buffer Overflow 101" in content
    assert "REDACTED" in content # Flag redaction requested

# MODULE D TESTS: Competition Rule Engine & Compliance
def test_rule_engine_compliance(db_session):
    RuleEngineService.get_or_create_default_rules(db_session, "COMP-TEST-01")
    
    # Test compliant writeup
    good_content = """# Buffer Overflow 101 Writeup
## 1. Challenge Overview
Overview of challenge.
## 2. Reconnaissance & Enumeration
Scan details.
## 3. Vulnerability Identification
Buffer overflow.
## 4. Exploitation
Exploit payload.
## 5. Flag Retrieval
CTF{[REDACTED_FLAG]}
## 6. Key Takeaways
Defense steps.
"""
    result = RuleEngineService.audit_compliance(
        db=db_session,
        competition_id="COMP-TEST-01",
        challenge_id="CHAL-TEST-01",
        writeup_content=good_content,
        author="0xHacker"
    )
    assert result.overall_status in ("Compliant", "Needs Review")

# MODULE E TESTS: Export Engine Multi-Format & ZIP Package
def test_export_engine(db_session):
    # Create writeup in database
    writeup = WriteupDocument(
        id="WRP-TEST-01",
        competition_id="COMP-TEST-01",
        challenge_id="CHAL-TEST-01",
        title="Buffer Overflow 101 Solution",
        author="0xTester",
        content_markdown="# Buffer Overflow 101 Solution\n## 1. Overview\nExploiting stack.\n```bash\n$ checksec --file=vuln\n```\n## 2. Flag\nCaptured flag."
    )
    db_session.add(writeup)
    db_session.commit()
    
    # Test export package generation
    package_info = ExportEngineService.generate_full_export_package(
        db=db_session,
        challenge_id="CHAL-TEST-01"
    )
    assert "zip_filename" in package_info
    zip_path = EXPORTS_DIR / package_info["zip_filename"]
    assert zip_path.exists()
    assert zip_path.stat().st_size > 0
