import datetime
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(String(64), primary_key=True, index=True)
    competition_id = Column(String(64), ForeignKey("competitions.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(64), nullable=False)  # Web, Pwn, Crypto, Forensics, Reverse Engineering, OSINT, Misc, Hardware, Steganography
    difficulty = Column(String(32), default="Medium")  # Easy, Medium, Hard, Insane
    points = Column(Integer, default=100)
    description = Column(Text, nullable=True)
    author = Column(String(128), nullable=True)
    
    # Privately stored flag
    flag = Column(String(256), nullable=True)
    
    # Metadata tags & techniques
    tools_used = Column(JSON, default=list)  # ["nmap", "sqlmap", "burp", "ghidra", "pwntools"]
    vulnerabilities = Column(JSON, default=list)  # ["SQLi", "Buffer Overflow", "Padding Oracle"]
    
    solution_status = Column(String(32), default="unsolved")  # unsolved, in_progress, solved
    evidence_status = Column(String(32), default="pending")  # pending, collected, verified
    writeup_status = Column(String(32), default="not_started")  # not_started, drafting, review, completed
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    competition = relationship("Competition", back_populates="challenges")
    sessions = relationship("Session", back_populates="challenge", cascade="all, delete-orphan")
    evidence_items = relationship("Evidence", back_populates="challenge", cascade="all, delete-orphan")
    timeline_events = relationship("TimelineEvent", back_populates="challenge", cascade="all, delete-orphan")
    writeup = relationship("WriteupDocument", back_populates="challenge", uselist=False, cascade="all, delete-orphan")
