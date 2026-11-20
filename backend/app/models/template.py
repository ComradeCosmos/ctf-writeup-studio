import datetime
from sqlalchemy import Column, String, Text, Boolean, DateTime, JSON
from app.core.database import Base

class WriteupTemplate(Base):
    __tablename__ = "writeup_templates"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), unique=True, nullable=False)
    category = Column(String(64), default="CTF") # CTF, Platform, Academic, Enterprise
    description = Column(Text, nullable=True)
    structure_markdown = Column(Text, nullable=False)
    required_sections = Column(JSON, default=list)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
