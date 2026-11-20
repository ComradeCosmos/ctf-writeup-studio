# API Router initialization
from app.api.competitions import router as competitions_router
from app.api.challenges import router as challenges_router
from app.api.sessions import router as sessions_router
from app.api.evidence import router as evidence_router
from app.api.explainer import router as explainer_router
from app.api.compliance import router as compliance_router
from app.api.qa import router as qa_router
from app.api.exports import router as exports_router
from app.api.templates import router as templates_router
from app.api.dashboard import router as dashboard_router

__all__ = [
    "competitions_router",
    "challenges_router",
    "sessions_router",
    "evidence_router",
    "explainer_router",
    "compliance_router",
    "qa_router",
    "exports_router",
    "templates_router",
    "dashboard_router"
]
