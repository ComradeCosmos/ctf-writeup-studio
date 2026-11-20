import datetime
from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey, JSON
from app.core.database import Base

class RegulationRule(Base):
    __tablename__ = "regulation_rules"

    id = Column(String(64), primary_key=True, index=True)
    competition_id = Column(String(64), ForeignKey("competitions.id", ondelete="CASCADE"), nullable=False, index=True)
    
    category = Column(String(64), nullable=False)
    # publication_permission, flag_disclosure, solution_disclosure, screenshot_requirement, 
    # source_code_disclosure, ai_content_restriction, attribution_credit, required_formatting,
    # submission_deadline, file_size_limit, confidentiality, tool_restriction
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(32), default="mandatory") # mandatory, restricted, forbidden, advisory
    
    rule_parameter = Column(JSON, default=dict) 
    # e.g. {"disclose_flags": False, "min_screenshots": 2, "require_ai_disclosure": True, "max_file_size_mb": 25}
    
    is_active = Column(Boolean, default=True)
    source_reference = Column(String(255), nullable=True) # e.g. "Section 4.2 of Rules.pdf"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ComplianceCheckResult(Base):
    __tablename__ = "compliance_check_results"

    id = Column(String(64), primary_key=True, index=True)
    competition_id = Column(String(64), ForeignKey("competitions.id", ondelete="CASCADE"), nullable=False, index=True)
    challenge_id = Column(String(64), ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False, index=True)
    writeup_id = Column(String(64), nullable=True)
    
    overall_status = Column(String(32), default="Rules Not Verified") 
    # Compliant, Needs Review, Non-Compliant, Rules Not Verified
    
    passed_rules = Column(JSON, default=list)
    failed_rules = Column(JSON, default=list)
    potential_violations = Column(JSON, default=list)
    missing_information = Column(JSON, default=list)
    restricted_content = Column(JSON, default=list)
    recommended_corrections = Column(JSON, default=list)
    
    evaluated_at = Column(DateTime, default=datetime.datetime.utcnow)
