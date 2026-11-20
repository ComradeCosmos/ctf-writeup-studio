import datetime
from sqlalchemy import Column, String, Text, DateTime, JSON, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class Competition(Base):
    __tablename__ = "competitions"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    website = Column(String(512), nullable=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    submission_deadline = Column(DateTime, nullable=True)
    status = Column(String(32), default="active") # upcoming, active, completed, archived
    rules_summary = Column(Text, nullable=True)
    official_rules_url = Column(String(512), nullable=True)
    regulations_config = Column(JSON, default=dict)
    
    # Relationships
    challenges = relationship("Challenge", back_populates="competition", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="competition", cascade="all, delete-orphan")
    evidence_items = relationship("Evidence", back_populates="competition", cascade="all, delete-orphan")
    writeups = relationship("WriteupDocument", back_populates="competition", cascade="all, delete-orphan")
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
