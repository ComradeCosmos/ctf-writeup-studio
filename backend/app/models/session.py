import datetime
from sqlalchemy import Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Session(Base):
    __tablename__ = "sessions"

    id = Column(String(64), primary_key=True, index=True)
    competition_id = Column(String(64), ForeignKey("competitions.id", ondelete="CASCADE"), nullable=False, index=True)
    challenge_id = Column(String(64), ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False, index=True)
    
    name = Column(String(255), nullable=False)
    status = Column(String(32), default="active")  # active, paused, stopped
    shell_type = Column(String(32), default="powershell")  # powershell, bash, zsh, cmd, wsl
    working_directory = Column(String(512), nullable=True)
    
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0)
    notes = Column(Text, nullable=True)

    # Relationships
    competition = relationship("Competition", back_populates="sessions")
    challenge = relationship("Challenge", back_populates="sessions")
    commands = relationship("TerminalCommand", back_populates="session", cascade="all, delete-orphan", order_by="TerminalCommand.timestamp")
    timeline_events = relationship("TimelineEvent", back_populates="session", cascade="all, delete-orphan", order_by="TimelineEvent.timestamp")

class TerminalCommand(Base):
    __tablename__ = "terminal_commands"

    id = Column(String(64), primary_key=True, index=True)
    session_id = Column(String(64), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    challenge_id = Column(String(64), ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False, index=True)
    
    command = Column(Text, nullable=False)  # Sanitized/redacted
    raw_command = Column(Text, nullable=True)  # Stored locally securely
    stdout = Column(Text, nullable=True)
    stderr = Column(Text, nullable=True)
    exit_code = Column(Integer, default=0)
    
    duration_ms = Column(Integer, default=0)
    cwd = Column(String(512), nullable=True)
    shell = Column(String(32), default="powershell")
    host = Column(String(64), default="local")
    
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    is_sensitive = Column(Boolean, default=False)
    is_evidence = Column(Boolean, default=False)
    
    # User / AI annotations
    user_note = Column(Text, nullable=True)
    technical_explanation = Column(Text, nullable=True)
    
    session = relationship("Session", back_populates="commands")

class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id = Column(String(64), primary_key=True, index=True)
    session_id = Column(String(64), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    challenge_id = Column(String(64), ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False, index=True)
    
    event_type = Column(String(64), nullable=False)  
    # command, file_change, screenshot, discovery, http_request, payload, flag_retrieval, user_note
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    
    evidence_id = Column(String(64), ForeignKey("evidence_items.id", ondelete="SET NULL"), nullable=True)
    is_included_in_writeup = Column(Boolean, default=True)
    suggested_step = Column(String(64), nullable=True) # Reconnaissance, Vulnerability Identification, Exploitation, Flag Retrieval, Key Takeaways
    
    metadata_json = Column(JSON, default=dict)
    
    session = relationship("Session", back_populates="timeline_events")
    challenge = relationship("Challenge", back_populates="timeline_events")
    evidence = relationship("Evidence", foreign_keys=[evidence_id])
