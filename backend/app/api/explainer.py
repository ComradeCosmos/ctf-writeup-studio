from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.challenge import Challenge
from app.models.writeup import WriteupDocument
from app.services.ai_explainer import AIExplainerService

from app.core.config import settings
from app.services.llm_client import LLMClientService

router = APIRouter(prefix="/explainer", tags=["AI Technical Explainer"])

class CommandExplainRequest(BaseModel):
    command: str
    stdout: Optional[str] = ""
    mode: Optional[str] = "Technical" # Beginner Friendly, Technical, Professional Research
    provider: Optional[str] = None
    api_key: Optional[str] = None

class WriteupGenerateRequest(BaseModel):
    challenge_id: str
    style_mode: Optional[str] = "Technical"
    template_name: Optional[str] = "Standard CTF Writeup"
    author: Optional[str] = "0xHacker"
    redact_flag_token: Optional[bool] = False
    provider: Optional[str] = None
    api_key: Optional[str] = None

class TestKeyRequest(BaseModel):
    provider: str
    api_key: str

class UpdateConfigRequest(BaseModel):
    ai_provider: Optional[str] = None
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None

@router.get("/config")
def get_ai_config():
    """Returns active AI explainer provider and configured key indicators (masked)."""
    return {
        "active_provider": settings.AI_PROVIDER,
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "openai_configured": bool(settings.OPENAI_API_KEY),
        "anthropic_configured": bool(settings.ANTHROPIC_API_KEY),
        "offline_fallback_active": True
    }

@router.post("/config")
def update_ai_config(payload: UpdateConfigRequest):
    """Updates AI provider and API keys in runtime settings."""
    if payload.ai_provider:
        settings.AI_PROVIDER = payload.ai_provider
    if payload.gemini_api_key is not None:
        settings.GEMINI_API_KEY = payload.gemini_api_key
    if payload.openai_api_key is not None:
        settings.OPENAI_API_KEY = payload.openai_api_key
    if payload.anthropic_api_key is not None:
        settings.ANTHROPIC_API_KEY = payload.anthropic_api_key
    return {
        "status": "updated",
        "active_provider": settings.AI_PROVIDER
    }

@router.post("/test-key")
def test_ai_key(payload: TestKeyRequest):
    """Verifies that an external LLM API key connects and functions properly."""
    return LLMClientService.test_key(payload.provider, payload.api_key)

@router.post("/explain-command")
def explain_command(payload: CommandExplainRequest):
    return AIExplainerService.explain_command_action(
        command=payload.command,
        stdout=payload.stdout or "",
        mode=payload.mode or "Technical",
        provider=payload.provider,
        api_key=payload.api_key
    )

@router.post("/generate-writeup")
def generate_writeup(payload: WriteupGenerateRequest, db: Session = Depends(get_db)):
    result = AIExplainerService.generate_authentic_writeup(
        db=db,
        challenge_id=payload.challenge_id,
        style_mode=payload.style_mode or "Technical",
        template_name=payload.template_name or "Standard CTF Writeup",
        author=payload.author or "0xHacker",
        redact_flag_token=payload.redact_flag_token or False
    )
    
    # Save or update WriteupDocument record in database
    challenge = db.query(Challenge).filter(Challenge.id == payload.challenge_id).first()
    writeup = db.query(WriteupDocument).filter(WriteupDocument.challenge_id == payload.challenge_id).first()
    if not writeup:
        import uuid
        writeup = WriteupDocument(
            id=f"WRP-{uuid.uuid4().hex[:6].upper()}",
            competition_id=challenge.competition_id,
            challenge_id=challenge.id,
            title=result["title"],
            author=result["author"],
            style_mode=result["style_mode"],
            template_name=result["template_name"],
            content_markdown=result["content_markdown"],
            flags_redacted=result["flags_redacted"],
            evidence_included=result["evidence_referenced"]
        )
        db.add(writeup)
    else:
        writeup.title = result["title"]
        writeup.author = result["author"]
        writeup.style_mode = result["style_mode"]
        writeup.template_name = result["template_name"]
        writeup.content_markdown = result["content_markdown"]
        writeup.flags_redacted = result["flags_redacted"]
        writeup.evidence_included = result["evidence_referenced"]
        
    db.commit()
    db.refresh(writeup)
    
    return {
        "writeup_id": writeup.id,
        "result": result
    }

class SlopAuditRequest(BaseModel):
    text: str

@router.post("/audit-slop")
def audit_slop(payload: SlopAuditRequest):
    """Rigorous Anti-AI-Slop evaluation auditing text for banned clichés and evidence grounding."""
    return AIExplainerService.audit_anti_ai_slop(payload.text)

class SlopSanitizeRequest(BaseModel):
    text: str
    default_hash: Optional[str] = "7d1a49c24098492027b40927e109471928371904719284719284719284719284"

@router.post("/sanitize-slop")
def sanitize_slop(payload: SlopSanitizeRequest):
    """Automatically strips conversational AI fluff and anchors claims with cryptographic hashes."""
    return AIExplainerService.sanitize_anti_ai_slop(payload.text, payload.default_hash or "7d1a49c24098492027b40927e109471928371904719284719284719284719284")

from app.services.external_intel import ExternalIntelService

class ExternalIntelRequest(BaseModel):
    query: str

@router.post("/external-suggestions")
def get_external_suggestions(payload: ExternalIntelRequest):
    """Queries external security sources (NIST NVD, CIRCL CVE, MITRE ATT&CK, GTFOBins) for suggestions."""
    return ExternalIntelService.get_external_suggestions(payload.query)
