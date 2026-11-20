import uuid
import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session as DBSession
from sqlalchemy import or_, and_, desc, func

from app.models.session import Session, TerminalCommand, TimelineEvent
from app.models.challenge import Challenge
from app.models.evidence import Evidence
from app.core.security import sanitize_sensitive_data

class SessionRecorderService:
    @staticmethod
    def create_session(
        db: DBSession,
        competition_id: str,
        challenge_id: str,
        name: str,
        shell_type: str = "powershell",
        working_directory: str = ""
    ) -> Session:
        session = Session(
            id=f"SES-{uuid.uuid4().hex[:8].upper()}",
            competition_id=competition_id,
            challenge_id=challenge_id,
            name=name,
            status="active",
            shell_type=shell_type,
            working_directory=working_directory,
            started_at=datetime.datetime.utcnow()
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        
        # Add initial timeline event
        event = TimelineEvent(
            id=f"EVT-{uuid.uuid4().hex[:8].upper()}",
            session_id=session.id,
            challenge_id=challenge_id,
            event_type="discovery",
            title=f"Started Session: {name}",
            description=f"Initialized {shell_type} tracking session for challenge {challenge_id}",
            timestamp=datetime.datetime.utcnow(),
            suggested_step="Reconnaissance"
        )
        db.add(event)
        db.commit()
        return session

    @staticmethod
    def update_session_status(db: DBSession, session_id: str, status: str) -> Optional[Session]:
        session = db.query(Session).filter(Session.id == session_id).first()
        if not session:
            return None
        session.status = status
        if status == "stopped":
            session.ended_at = datetime.datetime.utcnow()
            if session.started_at:
                delta = session.ended_at - session.started_at
                session.duration_seconds = int(delta.total_seconds())
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def record_command(
        db: DBSession,
        session_id: str,
        challenge_id: str,
        command_str: str,
        stdout: str = "",
        stderr: str = "",
        exit_code: int = 0,
        duration_ms: int = 0,
        cwd: str = "",
        shell: str = "powershell",
        user_note: str = ""
    ) -> TerminalCommand:
        sanitized_cmd, was_redacted = sanitize_sensitive_data(command_str)
        sanitized_stdout, out_redacted = sanitize_sensitive_data(stdout)
        
        cmd_record = TerminalCommand(
            id=f"CMD-{uuid.uuid4().hex[:8].upper()}",
            session_id=session_id,
            challenge_id=challenge_id,
            command=sanitized_cmd,
            raw_command=command_str if was_redacted else None,
            stdout=sanitized_stdout,
            stderr=stderr,
            exit_code=exit_code,
            duration_ms=duration_ms,
            cwd=cwd,
            shell=shell,
            timestamp=datetime.datetime.utcnow(),
            is_sensitive=was_redacted or out_redacted,
            user_note=user_note
        )
        db.add(cmd_record)
        
        # Check if output contains flag proof or significant discovery
        event_type = "command"
        step = "Exploitation"
        title = f"Ran: {sanitized_cmd[:60]}"
        if "flag{" in sanitized_stdout.lower() or "htb{" in sanitized_stdout.lower() or "picoctf{" in sanitized_stdout.lower():
            event_type = "flag_retrieval"
            step = "Flag Retrieval"
            title = f"Captured Flag via: {sanitized_cmd[:40]}"
        elif "nmap" in sanitized_cmd.lower() or "rustscan" in sanitized_cmd.lower() or "gobuster" in sanitized_cmd.lower():
            step = "Reconnaissance"
        elif "sqlmap" in sanitized_cmd.lower() or "burp" in sanitized_cmd.lower() or "curl" in sanitized_cmd.lower():
            step = "Vulnerability Identification"
            
        timeline_event = TimelineEvent(
            id=f"EVT-{uuid.uuid4().hex[:8].upper()}",
            session_id=session_id,
            challenge_id=challenge_id,
            event_type=event_type,
            title=title,
            description=f"Command executed with exit code {exit_code} ({duration_ms}ms)",
            timestamp=datetime.datetime.utcnow(),
            suggested_step=step,
            metadata_json={"command_id": cmd_record.id, "exit_code": exit_code}
        )
        db.add(timeline_event)
        
        db.commit()
        db.refresh(cmd_record)
        return cmd_record

    @staticmethod
    def query_atuin_history(
        db: DBSession,
        query: Optional[str] = None,
        challenge_id: Optional[str] = None,
        session_id: Optional[str] = None,
        cwd: Optional[str] = None,
        only_successful: Optional[bool] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Atuin-inspired interactive full-text search and command inspection.
        """
        q = db.query(TerminalCommand)
        if challenge_id:
            q = q.filter(TerminalCommand.challenge_id == challenge_id)
        if session_id:
            q = q.filter(TerminalCommand.session_id == session_id)
        if cwd:
            q = q.filter(TerminalCommand.cwd.ilike(f"%{cwd}%"))
        if query:
            q = q.filter(or_(
                TerminalCommand.command.ilike(f"%{query}%"),
                TerminalCommand.stdout.ilike(f"%{query}%"),
                TerminalCommand.user_note.ilike(f"%{query}%")
            ))
        if only_successful is not None:
            if only_successful:
                q = q.filter(TerminalCommand.exit_code == 0)
            else:
                q = q.filter(TerminalCommand.exit_code != 0)
                
        commands = q.order_by(desc(TerminalCommand.timestamp)).limit(limit).all()
        
        results = []
        for c in commands:
            results.append({
                "id": c.id,
                "command": c.command,
                "exit_code": c.exit_code,
                "duration_ms": c.duration_ms,
                "timestamp": c.timestamp.isoformat() if c.timestamp else None,
                "cwd": c.cwd,
                "shell": c.shell,
                "is_sensitive": c.is_sensitive,
                "is_evidence": c.is_evidence,
                "user_note": c.user_note,
                "stdout_preview": (c.stdout[:200] + "...") if c.stdout and len(c.stdout) > 200 else c.stdout
            })
        return results

    @staticmethod
    def get_command_frequency_stats(db: DBSession, challenge_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Calculates most frequent commands and execution patterns like Atuin."""
        q = db.query(
            TerminalCommand.command,
            func.count(TerminalCommand.id).label("count"),
            func.avg(TerminalCommand.duration_ms).label("avg_duration")
        )
        if challenge_id:
            q = q.filter(TerminalCommand.challenge_id == challenge_id)
        q = q.group_by(TerminalCommand.command).order_by(desc("count")).limit(15)
        
        stats = []
        for cmd, count, avg_dur in q.all():
            base_cmd = cmd.strip().split()[0] if cmd.strip() else ""
            stats.append({
                "command": cmd,
                "base_cmd": base_cmd,
                "frequency": count,
                "avg_duration_ms": round(float(avg_dur or 0), 1)
            })
        return stats
