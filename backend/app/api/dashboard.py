import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.competition import Competition
from app.models.challenge import Challenge
from app.models.evidence import Evidence
from app.models.writeup import WriteupDocument
from app.models.regulation import ComplianceCheckResult
from app.models.session import TimelineEvent

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_comps = db.query(Competition).count()
    total_chals = db.query(Challenge).count()
    completed_writeups = db.query(WriteupDocument).count()
    pending_writeups = max(0, total_chals - completed_writeups)
    total_evidence = db.query(Evidence).count()
    
    # Non-compliant or review required audits
    compliance_warnings = db.query(ComplianceCheckResult).filter(
        ComplianceCheckResult.overall_status.in_(["Needs Review", "Non-Compliant"])
    ).count()
    
    # Upcoming deadlines (within 30 days)
    now = datetime.datetime.utcnow()
    upcoming_deadlines = db.query(Competition).filter(
        Competition.submission_deadline != None,
        Competition.submission_deadline >= now
    ).order_by(Competition.submission_deadline.asc()).limit(5).all()
    
    deadlines_list = []
    for c in upcoming_deadlines:
        deadlines_list.append({
            "competition_id": c.id,
            "name": c.name,
            "deadline": c.submission_deadline.isoformat(),
            "days_left": max(0, (c.submission_deadline - now).days)
        })

    recent_events = db.query(TimelineEvent).order_by(TimelineEvent.timestamp.desc()).limit(8).all()
    events_list = []
    for e in recent_events:
        events_list.append({
            "id": e.id,
            "challenge_id": e.challenge_id,
            "event_type": e.event_type,
            "title": e.title,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None,
            "suggested_step": e.suggested_step
        })

    return {
        "total_competitions": total_comps,
        "total_challenges": total_chals,
        "completed_writeups": completed_writeups,
        "pending_writeups": pending_writeups,
        "total_evidence": total_evidence,
        "compliance_warnings": compliance_warnings,
        "upcoming_deadlines": deadlines_list,
        "recent_activity": events_list
    }
