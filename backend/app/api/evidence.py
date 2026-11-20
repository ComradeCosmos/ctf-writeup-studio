import os
import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import EVIDENCE_DIR
from app.core.security import safe_path
from app.models.evidence import Evidence
from app.services.evidence_vault import EvidenceVaultService

router = APIRouter(prefix="/evidence", tags=["Evidence Vault & Forensics"])

class EvidenceOut(BaseModel):
    id: str
    competition_id: str
    challenge_id: str
    session_id: Optional[str] = None
    category: str
    original_filename: str
    stored_filename: str
    file_type: str
    file_size: int = 0
    sha256_hash: str
    source: Optional[str] = "manual_upload"
    solution_step: Optional[str] = None
    user_description: Optional[str] = None
    verification_status: Optional[str] = "verified"
    is_annotated: bool = False
    parent_evidence_id: Optional[str] = None
    annotation_metadata: Optional[Dict[str, Any]] = None
    raw_content: Optional[str] = None
    collection_timestamp: Optional[datetime.datetime] = None
    created_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class AnnotationRequest(BaseModel):
    parent_evidence_id: str
    annotation_metadata: Dict[str, Any]
    user_description: Optional[str] = ""

class StepMappingUpdate(BaseModel):
    solution_step: str

@router.get("/", response_model=List[EvidenceOut])
def list_evidence(
    challenge_id: Optional[str] = None,
    category: Optional[str] = None,
    solution_step: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Evidence)
    if challenge_id:
        q = q.filter(Evidence.challenge_id == challenge_id)
    if category:
        q = q.filter(Evidence.category == category)
    if solution_step:
        q = q.filter(Evidence.solution_step == solution_step)
    return q.order_by(Evidence.collection_timestamp.desc()).all()

@router.post("/upload")
async def upload_evidence(
    competition_id: str = Form(...),
    challenge_id: str = Form(...),
    category: str = Form("custom"),
    solution_step: str = Form("Reconnaissance"),
    user_description: str = Form(""),
    session_id: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    file_bytes = await file.read()
    evidence_item, is_dup = EvidenceVaultService.store_evidence_file(
        db=db,
        competition_id=competition_id,
        challenge_id=challenge_id,
        original_filename=file.filename or "evidence.bin",
        file_bytes=file_bytes,
        category=category,
        file_type=file.content_type or "application/octet-stream",
        session_id=session_id,
        solution_step=solution_step,
        user_description=user_description
    )
    ev_out = EvidenceOut.model_validate(evidence_item)
    return {
        "id": ev_out.id,
        "sha256_hash": ev_out.sha256_hash,
        "original_filename": ev_out.original_filename,
        "evidence": ev_out,
        "is_duplicate_hash": is_dup,
        "message": "Duplicate artifact detected via SHA-256 hash" if is_dup else "Evidence imported successfully"
    }

@router.post("/annotate")
async def create_annotation(
    parent_id: str = Form(...),
    user_description: str = Form(""),
    annotation_metadata_json: str = Form("{}"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    import json
    annotated_bytes = await file.read()
    metadata = json.loads(annotation_metadata_json)
    
    annotated_item = EvidenceVaultService.create_annotated_version(
        db=db,
        parent_evidence_id=parent_id,
        annotated_image_bytes=annotated_bytes,
        annotation_metadata=metadata,
        user_description=user_description
    )
    return annotated_item

@router.get("/file/{stored_filename}")
def get_evidence_file(stored_filename: str):
    file_path = safe_path(EVIDENCE_DIR, stored_filename)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Evidence file not found on disk")
    return FileResponse(file_path)

@router.patch("/{evidence_id}/step")
def update_evidence_step(evidence_id: str, payload: StepMappingUpdate, db: Session = Depends(get_db)):
    ev = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence item not found")
    ev.solution_step = payload.solution_step
    db.commit()
    db.refresh(ev)
    return ev

@router.get("/verify-integrity")
def verify_integrity(challenge_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Verifies that disk hashes strictly match recorded SHA-256 evidence integrity."""
    return EvidenceVaultService.verify_all_evidence_integrity(db, challenge_id)

@router.get("/manifest/{challenge_id}")
def get_evidence_manifest(challenge_id: str, db: Session = Depends(get_db)):
    """Returns digital forensics JSON evidence manifest."""
    return EvidenceVaultService.generate_manifest(db, challenge_id)
