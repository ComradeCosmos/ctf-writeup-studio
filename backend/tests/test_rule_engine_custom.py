import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.competition import Competition
from app.models.challenge import Challenge
from app.models.regulation import RegulationRule
from app.services.rule_engine import RuleEngineService

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    SessionTesting = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionTesting()
    
    comp = Competition(
        id="COMP-CUSTOM-RULE",
        name="Security Con 2026",
        rules_summary="Strict regulations active.",
        status="active"
    )
    db.add(comp)
    
    chal = Challenge(
        id="CHAL-CUST-01",
        competition_id=comp.id,
        name="Crypto Vault",
        category="Crypto",
        points=300,
        flag="flag{aes_cbc_padding_oracle_solved}"
    )
    db.add(chal)
    db.commit()
    
    yield db
    db.close()

def test_add_and_audit_custom_rules(db_session):
    # 1. Add user-defined rule with forbidden word
    custom_rule_1 = RuleEngineService.create_custom_rule(
        db=db_session,
        competition_id="COMP-CUSTOM-RULE",
        category="custom",
        title="Prohibit Sharing Unredacted Keys",
        description="Writeups must not contain 'private_key' plaintext.",
        severity="forbidden",
        rule_parameter={"forbidden_words": ["private_key"]}
    )
    assert custom_rule_1.id.startswith("RUL-CUST-")
    
    # 2. Add user-defined rule with mandatory keyword
    custom_rule_2 = RuleEngineService.create_custom_rule(
        db=db_session,
        competition_id="COMP-CUSTOM-RULE",
        category="custom",
        title="Mandatory CVSS Citation",
        description="Writeup must state the CVSS score.",
        severity="mandatory",
        rule_parameter={"required_words": ["CVSS:3.1"]}
    )

    # 3. Audit writeup that violates both rules
    bad_writeup = """# Solution
We extracted the private_key using a padding oracle attack.
Execution succeeded.
"""
    result = RuleEngineService.audit_compliance(
        db=db_session,
        competition_id="COMP-CUSTOM-RULE",
        challenge_id="CHAL-CUST-01",
        writeup_content=bad_writeup,
        author="0xAuditor"
    )
    # Must fail because 'private_key' is forbidden and 'CVSS:3.1' is missing
    assert any("private_key" in str(f) for f in result.failed_rules)
    assert any("CVSS:3.1" in str(m) for m in result.missing_information)
    assert result.overall_status in ("Non-Compliant", "Needs Review")

    # 4. Audit writeup that satisfies both rules
    good_writeup = """# Solution
## 1. Overview
Target vulnerability scored as CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N.
We exploited the padding oracle without exposing credentials.
## 2. Exploitation
Exploit payload.
## 3. Flag Retrieval
CTF{[FLAG_REDACTED]}
## 4. Key Takeaways
Remediation details.
AI Disclosure: Generated with CTF Studio.
"""
    good_result = RuleEngineService.audit_compliance(
        db=db_session,
        competition_id="COMP-CUSTOM-RULE",
        challenge_id="CHAL-CUST-01",
        writeup_content=good_writeup,
        author="0xAuditor"
    )
    assert not any("private_key" in str(f) for f in good_result.failed_rules)
    assert not any("CVSS:3.1" in str(m) for m in good_result.missing_information)

def test_parse_guidelines_text(db_session):
    raw_guidelines = """
    Rule 1: Flags must not be disclosed in public writeups.
    Rule 2: At least 2 screenshots are mandatory for verification.
    Rule 3: DDoS and automated flood tools are prohibited.
    Rule 4: Author attribution must be included.
    """
    imported = RuleEngineService.parse_guidelines_text(
        db=db_session,
        competition_id="COMP-CUSTOM-RULE",
        raw_text=raw_guidelines
    )
    assert len(imported) >= 3
