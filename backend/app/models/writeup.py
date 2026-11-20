import datetime
from sqlalchemy import Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class WriteupDocument(Base):
    __tablename__ = "writeup_documents"

    id = Column(String(64), primary_key=True, index=True)
    competition_id = Column(String(64), ForeignKey("competitions.id", ondelete="CASCADE"), nullable=False, index=True)
    challenge_id = Column(String(64), ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    author = Column(String(128), default="Security Researcher")
    style_mode = Column(String(32), default="Technical") # Beginner Friendly, Technical, Professional Research
    template_name = Column(String(64), default="Standard CTF Writeup")
    
    content_markdown = Column(Text, nullable=False)
    raw_ai_analysis = Column(JSON, default=dict)
    
    # Metadata & flags
    flags_redacted = Column(Boolean, default=False)
    evidence_included = Column(JSON, default=list) # List of Evidence IDs referenced
    
    qa_score = Column(Float, default=100.0)
    qa_report = Column(JSON, default=dict)
    compliance_status = Column(String(32), default="Rules Not Verified")
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    competition = relationship("Competition", back_populates="writeups")
    challenge = relationship("Challenge", back_populates="writeup")
