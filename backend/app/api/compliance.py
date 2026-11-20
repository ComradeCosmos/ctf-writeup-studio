from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.regulation import RegulationRule, ComplianceCheckResult
from app.services.rule_engine import RuleEngineService

router = APIRouter(prefix="/compliance", tags=["Competition Rule Engine & Compliance"])

class AuditRequest(BaseModel):
    competition_id: str
    challenge_id: str
    writeup_content: str
    author: Optional[str] = ""
    writeup_id: Optional[str] = None

class RuleCreate(BaseModel):
    competition_id: str
    category: Optional[str] = "custom"
    title: str
    description: str
    severity: Optional[str] = "mandatory" # mandatory, restricted, forbidden, advisory
    rule_parameter: Optional[Dict[str, Any]] = None
    source_reference: Optional[str] = "User-defined custom regulation"

class RuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    is_active: Optional[bool] = None
    rule_parameter: Optional[Dict[str, Any]] = None

class GuidelinesImportRequest(BaseModel):
    competition_id: str
    raw_guidelines_text: str

@router.get("/rules/{competition_id}")
def get_competition_rules(competition_id: str, db: Session = Depends(get_db)):
    rules = RuleEngineService.get_or_create_default_rules(db, competition_id)
    return rules

@router.post("/rules")
def add_custom_rule(payload: RuleCreate, db: Session = Depends(get_db)):
    """Allows users to add their own custom competition rules and validation parameters."""
    rule = RuleEngineService.create_custom_rule(
        db=db,
        competition_id=payload.competition_id,
        category=payload.category or "custom",
        title=payload.title,
        description=payload.description,
        severity=payload.severity or "mandatory",
        rule_parameter=payload.rule_parameter or {},
        source_reference=payload.source_reference
    )
    return rule

@router.delete("/rules/{rule_id}")
def delete_rule(rule_id: str, db: Session = Depends(get_db)):
    """Deletes a rule by its ID."""
    rule = db.query(RegulationRule).filter(RegulationRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(rule)
    db.commit()
    return {"message": f"Rule {rule_id} deleted successfully."}

@router.patch("/rules/{rule_id}")
def update_rule(rule_id: str, payload: RuleUpdate, db: Session = Depends(get_db)):
    rule = db.query(RegulationRule).filter(RegulationRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(rule, k, v)
    db.commit()
    db.refresh(rule)
    return rule

@router.patch("/rules/{rule_id}/toggle")
def toggle_rule_active(rule_id: str, db: Session = Depends(get_db)):
    rule = db.query(RegulationRule).filter(RegulationRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    rule.is_active = not rule.is_active
    db.commit()
    db.refresh(rule)
    return {"id": rule.id, "is_active": rule.is_active}

@router.post("/rules/import-text")
def import_guidelines_text(payload: GuidelinesImportRequest, db: Session = Depends(get_db)):
    """Parses raw text guidelines and extracts rules automatically."""
    rules = RuleEngineService.parse_guidelines_text(
        db=db,
        competition_id=payload.competition_id,
        raw_text=payload.raw_guidelines_text
    )
    return {"imported_count": len(rules), "rules": rules}

@router.post("/audit")
def run_compliance_audit(payload: AuditRequest, db: Session = Depends(get_db)):
    """
    Executes regulation compliance check across all 12 categories plus any user-added custom rules:
    Returns Compliant, Needs Review, Non-Compliant, or Rules Not Verified,
    along with passed, failed, potential violations, and recommended corrections.
    """
    result = RuleEngineService.audit_compliance(
        db=db,
        competition_id=payload.competition_id,
        challenge_id=payload.challenge_id,
        writeup_content=payload.writeup_content,
        author=payload.author or "",
        writeup_id=payload.writeup_id
    )
    return result
