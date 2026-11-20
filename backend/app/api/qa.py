from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.qa_engine import QAEngineService

router = APIRouter(prefix="/qa", tags=["Quality Assurance"])

class QARequest(BaseModel):
    challenge_id: str
    content_markdown: str
    author: Optional[str] = ""

@router.post("/inspect")
def inspect_writeup_quality(payload: QARequest, db: Session = Depends(get_db)):
    """Runs automated QA inspection on missing sections, broken links, flag leaks, commands."""
    return QAEngineService.inspect_writeup(
        db=db,
        challenge_id=payload.challenge_id,
        content_markdown=payload.content_markdown,
        author=payload.author or ""
    )
