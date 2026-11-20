import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.competition import Competition
from app.services.rule_engine import RuleEngineService

router = APIRouter(prefix="/competitions", tags=["Competitions"])

class CompetitionCreate(BaseModel):
    name: str
    website: Optional[str] = None
    start_date: Optional[datetime.datetime] = None
    end_date: Optional[datetime.datetime] = None
    submission_deadline: Optional[datetime.datetime] = None
    status: Optional[str] = "active"
    rules_summary: Optional[str] = None
    official_rules_url: Optional[str] = None

class CompetitionOut(BaseModel):
    id: str
    name: str
    website: Optional[str]
    start_date: Optional[datetime.datetime]
    end_date: Optional[datetime.datetime]
    submission_deadline: Optional[datetime.datetime]
    status: str
    rules_summary: Optional[str]
    official_rules_url: Optional[str]
    created_at: datetime.datetime

    class Config:
        from_attributes = True

@router.get("/", response_model=List[CompetitionOut])
def list_competitions(db: Session = Depends(get_db)):
    return db.query(Competition).order_by(Competition.created_at.desc()).all()

@router.post("/", response_model=CompetitionOut)
def create_competition(payload: CompetitionCreate, db: Session = Depends(get_db)):
    comp_id = f"COMP-{uuid.uuid4().hex[:6].upper()}"
    comp = Competition(
        id=comp_id,
        name=payload.name,
        website=payload.website,
        start_date=payload.start_date,
        end_date=payload.end_date,
        submission_deadline=payload.submission_deadline,
        status=payload.status or "active",
        rules_summary=payload.rules_summary,
        official_rules_url=payload.official_rules_url
    )
    db.add(comp)
    db.commit()
    db.refresh(comp)
    
    # Initialize default 12-category regulation rules
    RuleEngineService.get_or_create_default_rules(db, comp.id)
    return comp

@router.get("/{comp_id}", response_model=CompetitionOut)
def get_competition(comp_id: str, db: Session = Depends(get_db)):
    comp = db.query(Competition).filter(Competition.id == comp_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Competition not found")
    return comp

@router.delete("/{comp_id}")
def delete_competition(comp_id: str, db: Session = Depends(get_db)):
    comp = db.query(Competition).filter(Competition.id == comp_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Competition not found")
    db.delete(comp)
    db.commit()
    return {"message": "Competition deleted successfully"}
