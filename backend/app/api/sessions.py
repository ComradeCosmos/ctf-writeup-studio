import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.session import Session as CTFSession, TerminalCommand, TimelineEvent
from app.services.session_recorder import SessionRecorderService
from app.services.local_runner import LocalRunnerService
from app.services.evidence_vault import EvidenceVaultService

router = APIRouter(prefix="/sessions", tags=["Live Session Recorder & Atuin History"])

class SessionCreate(BaseModel):
    competition_id: str
    challenge_id: str
    name: str
    shell_type: Optional[str] = "powershell"
    working_directory: Optional[str] = ""

class StatusUpdate(BaseModel):
    status: str # active, paused, stopped

class CommandRecordRequest(BaseModel):
    session_id: str
    challenge_id: str
    command: str
    stdout: Optional[str] = ""
    stderr: Optional[str] = ""
    exit_code: Optional[int] = 0
    duration_ms: Optional[int] = 0
    cwd: Optional[str] = ""
    shell: Optional[str] = "powershell"
    user_note: Optional[str] = ""

class LocalExecutionRequest(BaseModel):
    session_id: str
    challenge_id: str
    command: str
    shell_type: Optional[str] = "powershell"
    cwd: Optional[str] = ""
    timeout_seconds: Optional[int] = 30
    auto_save_evidence: Optional[bool] = False
    user_note: Optional[str] = ""

class NoteUpdate(BaseModel):
    user_note: str

@router.get("/environments")
def get_available_environments(refresh: bool = False):
    """
    Returns all locally available shell environments (PowerShell, WSL distros, CMD)
    with detected security tools and active statuses.
    """
    return LocalRunnerService.detect_environments(force_refresh=refresh)

@router.post("/run-local")
def execute_local_command(payload: LocalExecutionRequest, db: Session = Depends(get_db)):
    """
    Executes a real terminal command locally on localhost in the requested shell (PowerShell, WSL),
    capturing stdout, stderr, exit code, execution time, and SHA-256 cryptographic signature.
    Automatically logs into session history, timeline, and optionally secures into Evidence Vault.
    """
    clean_cmd = payload.command.strip()
    if not clean_cmd:
        raise HTTPException(status_code=400, detail="Command cannot be empty")

    exec_result = LocalRunnerService.execute_command(
        command=clean_cmd,
        shell_type=payload.shell_type or "powershell",
        cwd=payload.cwd,
        timeout_seconds=payload.timeout_seconds or 30
    )

    # Record into Session Database
    cmd_record = SessionRecorderService.record_command(
        db=db,
        session_id=payload.session_id,
        challenge_id=payload.challenge_id,
        command_str=clean_cmd,
        stdout=exec_result["stdout"],
        stderr=exec_result["stderr"],
        exit_code=exec_result["exit_code"],
        duration_ms=exec_result["duration_ms"],
        cwd=exec_result["cwd"],
        shell=payload.shell_type or "powershell",
        user_note=payload.user_note or ""
    )

    evidence_info = None
    if payload.auto_save_evidence:
        # Create Evidence Artifact
        session = db.query(CTFSession).filter(CTFSession.id == payload.session_id).first()
        comp_id = session.competition_id if session else "COMP-001"
        evidence_content = f"$ {clean_cmd}\n[Exit: {exec_result['exit_code']}]\n\n{exec_result['stdout']}".encode("utf-8")
        evidence_item, _ = EvidenceVaultService.store_evidence_file(
            db=db,
            competition_id=comp_id,
            challenge_id=payload.challenge_id,
            original_filename=f"terminal_{cmd_record.id}.txt",
            file_bytes=evidence_content,
            category="terminal_log",
            file_type="text/plain",
            session_id=payload.session_id,
            solution_step="Exploitation",
            user_description=f"Local execution output for: {clean_cmd}"
        )
        cmd_record.is_evidence = True
        db.commit()
        evidence_info = {
            "evidence_id": evidence_item.id,
            "sha256_hash": evidence_item.sha256_hash,
            "verified": True
        }

    return {
        "id": cmd_record.id,
        "session_id": payload.session_id,
        "challenge_id": payload.challenge_id,
        "command": cmd_record.command,
        "stdout": exec_result["stdout"],
        "stderr": exec_result["stderr"],
        "exit_code": exec_result["exit_code"],
        "duration_ms": exec_result["duration_ms"],
        "shell": payload.shell_type or "powershell",
        "sha256_hash": exec_result["sha256_hash"],
        "timestamp": cmd_record.timestamp.isoformat() if cmd_record.timestamp else None,
        "evidence": evidence_info
    }

@router.post("/commands/{cmd_id}/save-as-evidence")
def save_command_as_evidence(cmd_id: str, db: Session = Depends(get_db)):
    """
    Saves an existing recorded terminal command into the Evidence Vault as a verified artifact.
    """
    cmd = db.query(TerminalCommand).filter(TerminalCommand.id == cmd_id).first()
    if not cmd:
        raise HTTPException(status_code=404, detail="Terminal command not found")

    session = db.query(CTFSession).filter(CTFSession.id == cmd.session_id).first()
    comp_id = session.competition_id if session else "COMP-001"
    
    content = f"$ {cmd.command}\n[Exit: {cmd.exit_code}]\n\n{cmd.stdout}".encode("utf-8")
    evidence_item, _ = EvidenceVaultService.store_evidence_file(
        db=db,
        competition_id=comp_id,
        challenge_id=cmd.challenge_id,
        original_filename=f"evidence_cmd_{cmd.id}.txt",
        file_bytes=content,
        category="terminal_log",
        file_type="text/plain",
        session_id=cmd.session_id,
        solution_step="Exploitation",
        user_description=f"Verified terminal evidence for: {cmd.command}"
    )

    cmd.is_evidence = True
    db.commit()

    return {
        "command_id": cmd.id,
        "evidence_id": evidence_item.id,
        "sha256_hash": evidence_item.sha256_hash,
        "verified": True
    }

@router.get("/")
def list_sessions(challenge_id: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(CTFSession)
    if challenge_id:
        q = q.filter(CTFSession.challenge_id == challenge_id)
    return q.order_by(CTFSession.started_at.desc()).all()

@router.post("/")
def start_session(payload: SessionCreate, db: Session = Depends(get_db)):
    return SessionRecorderService.create_session(
        db,
        competition_id=payload.competition_id,
        challenge_id=payload.challenge_id,
        name=payload.name,
        shell_type=payload.shell_type or "powershell",
        working_directory=payload.working_directory or ""
    )

@router.patch("/{session_id}/status")
def change_session_status(session_id: str, payload: StatusUpdate, db: Session = Depends(get_db)):
    res = SessionRecorderService.update_session_status(db, session_id, payload.status)
    if not res:
        raise HTTPException(status_code=404, detail="Session not found")
    return res

@router.post("/command")
def log_terminal_command(payload: CommandRecordRequest, db: Session = Depends(get_db)):
    cmd_record = SessionRecorderService.record_command(
        db=db,
        session_id=payload.session_id,
        challenge_id=payload.challenge_id,
        command_str=payload.command,
        stdout=payload.stdout or "",
        stderr=payload.stderr or "",
        exit_code=payload.exit_code or 0,
        duration_ms=payload.duration_ms or 0,
        cwd=payload.cwd or "",
        shell=payload.shell or "powershell",
        user_note=payload.user_note or ""
    )
    return cmd_record

@router.patch("/commands/{cmd_id}/note")
def update_command_note(cmd_id: str, payload: NoteUpdate, db: Session = Depends(get_db)):
    cmd = db.query(TerminalCommand).filter(TerminalCommand.id == cmd_id).first()
    if not cmd:
        raise HTTPException(status_code=404, detail="Command record not found")
    cmd.user_note = payload.user_note
    db.commit()
    db.refresh(cmd)
    return cmd

@router.patch("/commands/{cmd_id}/evidence-toggle")
def toggle_command_evidence(cmd_id: str, db: Session = Depends(get_db)):
    cmd = db.query(TerminalCommand).filter(TerminalCommand.id == cmd_id).first()
    if not cmd:
        raise HTTPException(status_code=404, detail="Command record not found")
    cmd.is_evidence = not cmd.is_evidence
    db.commit()
    db.refresh(cmd)
    return {"id": cmd.id, "is_evidence": cmd.is_evidence}

@router.get("/atuin-history")
def search_atuin_history(
    q: Optional[str] = None,
    challenge_id: Optional[str] = None,
    session_id: Optional[str] = None,
    cwd: Optional[str] = None,
    only_successful: Optional[bool] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Atuin-inspired interactive command history search endpoint."""
    return SessionRecorderService.query_atuin_history(
        db=db,
        query=q,
        challenge_id=challenge_id,
        session_id=session_id,
        cwd=cwd,
        only_successful=only_successful,
        limit=limit
    )

@router.get("/command-stats")
def get_command_frequency_stats(challenge_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Atuin-inspired command frequency and execution duration statistics."""
    return SessionRecorderService.get_command_frequency_stats(db, challenge_id)

@router.get("/timeline/{challenge_id}")
def get_timeline(challenge_id: str, db: Session = Depends(get_db)):
    """Chronological CTF session timeline."""
    events = db.query(TimelineEvent).filter(
        TimelineEvent.challenge_id == challenge_id
    ).order_by(TimelineEvent.timestamp.asc()).all()
    
    return events
