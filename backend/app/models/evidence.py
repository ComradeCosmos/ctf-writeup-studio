import datetime
from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Evidence(Base):
    __tablename__ = "evidence_items"

    id = Column(String(64), primary_key=True, index=True)
    competition_id = Column(String(64), ForeignKey("competitions.id", ondelete="CASCADE"), nullable=False, index=True)
    challenge_id = Column(String(64), ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(String(64), ForeignKey("sessions.id", ondelete="SET NULL"), nullable=True, index=True)
    
    category = Column(String(64), nullable=False)
    # screenshot, terminal_log, http_traffic, burp_export, pcap, source_code, binary, hex_dump, network_scan, exploit_output, payload, flag_proof, custom
    
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_type = Column(String(64), nullable=False)  # image/png, text/plain, application/json, application/vnd.tcpdump.pcap
    file_size = Column(Integer, default=0)
    sha256_hash = Column(String(64), nullable=False, index=True)
    
    source = Column(String(64), default="manual_upload") # terminal_agent, screenshot_tool, burp, wireshark, manual_upload
    solution_step = Column(String(64), nullable=True) # Overview, Reconnaissance, Vulnerability Identification, Exploitation, Flag Retrieval, Key Takeaways
    user_description = Column(Text, nullable=True)
    verification_status = Column(String(32), default="verified") # unverified, verified, flagged, modified
    
    # Non-destructive annotation support
    is_annotated = Column(Boolean, default=False)
    parent_evidence_id = Column(String(64), ForeignKey("evidence_items.id", ondelete="SET NULL"), nullable=True)
    annotation_metadata = Column(JSON, default=dict) # highlights, crops, arrows, bounding_boxes, captions
    
    # Text or preview payload (e.g. for terminal logs, HTTP requests, hex dumps)
    raw_content = Column(Text, nullable=True)
    
    collection_timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    competition = relationship("Competition", back_populates="evidence_items")
    challenge = relationship("Challenge", back_populates="evidence_items")
    annotated_versions = relationship("Evidence", backref="original_artifact", remote_side=[id])

class EvidenceAuditLog(Base):
    __tablename__ = "evidence_audit_logs"

    id = Column(String(64), primary_key=True, index=True)
    evidence_id = Column(String(64), ForeignKey("evidence_items.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(64), nullable=False) # imported, verified, annotated, cropped, tag_updated, step_mapped
    previous_hash = Column(String(64), nullable=True)
    new_hash = Column(String(64), nullable=True)
    details = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
