from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, PlainTextResponse, HTMLResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import EXPORTS_DIR
from app.core.security import safe_path
from app.models.challenge import Challenge
from app.models.writeup import WriteupDocument
from app.services.export_engine import ExportEngineService

router = APIRouter(prefix="/exports", tags=["Export Center"])

class ExportPackageRequest(BaseModel):
    challenge_id: str
    export_formats: Optional[List[str]] = ["md", "pdf", "docx", "html", "zip"]
    redact_flag: Optional[bool] = False

@router.post("/package")
def create_export_package(payload: ExportPackageRequest, db: Session = Depends(get_db)):
    """Generates complete multi-format documentation and forensics evidence ZIP bundle."""
    try:
        result = ExportEngineService.generate_full_export_package(
            db=db,
            challenge_id=payload.challenge_id,
            export_formats=payload.export_formats or ["md", "pdf", "docx", "html", "zip"],
            redact_flag=payload.redact_flag or False
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/download/{filename}")
def download_export_file(filename: str):
    file_path = safe_path(EXPORTS_DIR, filename)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Requested export file does not exist")
    return FileResponse(
        file_path,
        filename=filename,
        media_type="application/octet-stream"
    )

@router.get("/preview/html/{challenge_id}")
def preview_html_writeup(challenge_id: str, db: Session = Depends(get_db)):
    writeup = db.query(WriteupDocument).filter(WriteupDocument.challenge_id == challenge_id).first()
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not writeup or not challenge:
        raise HTTPException(status_code=404, detail="Writeup or challenge not found")
    html_content = ExportEngineService.export_html(writeup, challenge)
    return HTMLResponse(content=html_content)
