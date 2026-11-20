import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.challenge import Challenge
from app.models.competition import Competition

router = APIRouter(prefix="/challenges", tags=["Challenges"])

class ChallengeCreate(BaseModel):
    competition_id: str
    name: str
    category: str
    difficulty: Optional[str] = "Medium"
    points: Optional[int] = 100
    description: Optional[str] = ""
    author: Optional[str] = ""
    flag: Optional[str] = ""
    tools_used: Optional[List[str]] = []
    vulnerabilities: Optional[List[str]] = []

class ChallengeUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[str] = None
    points: Optional[int] = None
    description: Optional[str] = None
    author: Optional[str] = None
    flag: Optional[str] = None
    tools_used: Optional[List[str]] = None
    vulnerabilities: Optional[List[str]] = None
    solution_status: Optional[str] = None
    evidence_status: Optional[str] = None
    writeup_status: Optional[str] = None

class ChallengeOut(BaseModel):
    id: str
    competition_id: str
    name: str
    category: str
    difficulty: str
    points: int
    description: Optional[str]
    author: Optional[str]
    flag: Optional[str]
    tools_used: List[str]
    vulnerabilities: List[str]
    solution_status: str
    evidence_status: str
    writeup_status: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

@router.get("/", response_model=List[ChallengeOut])
def list_challenges(
    competition_id: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Challenge)
    if competition_id:
        q = q.filter(Challenge.competition_id == competition_id)
    if category:
        q = q.filter(Challenge.category == category)
    if status:
        q = q.filter(Challenge.solution_status == status)
    return q.order_by(Challenge.created_at.desc()).all()

@router.post("/", response_model=ChallengeOut)
def create_challenge(payload: ChallengeCreate, db: Session = Depends(get_db)):
    comp = db.query(Competition).filter(Competition.id == payload.competition_id).first()
    if not comp:
        raise HTTPException(status_code=400, detail="Associated competition does not exist")
        
    chal_id = f"CHAL-{uuid.uuid4().hex[:6].upper()}"
    chal = Challenge(
        id=chal_id,
        competition_id=payload.competition_id,
        name=payload.name,
        category=payload.category,
        difficulty=payload.difficulty or "Medium",
        points=payload.points or 100,
        description=payload.description or "",
        author=payload.author or "",
        flag=payload.flag or "",
        tools_used=payload.tools_used or [],
        vulnerabilities=payload.vulnerabilities or [],
        solution_status="solved" if payload.flag else "unsolved",
        evidence_status="pending",
        writeup_status="not_started"
    )
    db.add(chal)
    db.commit()
    db.refresh(chal)
    return chal

@router.get("/{chal_id}", response_model=ChallengeOut)
def get_challenge(chal_id: str, db: Session = Depends(get_db)):
    chal = db.query(Challenge).filter(Challenge.id == chal_id).first()
    if not chal:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return chal

@router.patch("/{chal_id}", response_model=ChallengeOut)
def update_challenge(chal_id: str, payload: ChallengeUpdate, db: Session = Depends(get_db)):
    chal = db.query(Challenge).filter(Challenge.id == chal_id).first()
    if not chal:
        raise HTTPException(status_code=404, detail="Challenge not found")
        
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(chal, k, v)
        
    db.commit()
    db.refresh(chal)
    return chal

@router.delete("/{chal_id}")
def delete_challenge(chal_id: str, db: Session = Depends(get_db)):
    chal = db.query(Challenge).filter(Challenge.id == chal_id).first()
    if not chal:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    from app.core.config import EVIDENCE_DIR
    from app.core.security import safe_path
    from app.models.evidence import Evidence
    from app.models.writeup import WriteupDocument
    from app.models.session import Session as CTFSession, TerminalCommand, TimelineEvent
    
    # Delete associated evidence files from disk
    ev_items = db.query(Evidence).filter(Evidence.challenge_id == chal_id).all()
    for ev in ev_items:
        try:
            fpath = safe_path(EVIDENCE_DIR, ev.stored_filename)
            if fpath.exists():
                fpath.unlink()
        except Exception:
            pass
        db.delete(ev)
        
    db.query(WriteupDocument).filter(WriteupDocument.challenge_id == chal_id).delete()
    db.query(TimelineEvent).filter(TimelineEvent.challenge_id == chal_id).delete()
    db.query(TerminalCommand).filter(TerminalCommand.challenge_id == chal_id).delete()
    db.query(CTFSession).filter(CTFSession.challenge_id == chal_id).delete()
    
    db.delete(chal)
    db.commit()
    return {"message": "Challenge and associated evidence deleted successfully", "id": chal_id}
