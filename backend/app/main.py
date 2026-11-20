import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.core.seed import populate_seed_data
from app.api import (
    competitions_router,
    challenges_router,
    sessions_router,
    evidence_router,
    explainer_router,
    compliance_router,
    qa_router,
    exports_router,
    templates_router,
    dashboard_router
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ctf_studio")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed
    logger.info("Initializing CTF Writeup Studio database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        populate_seed_data(db)
    finally:
        db.close()
    logger.info("Backend initialized successfully.")
    yield
    logger.info("CTF Writeup Studio backend shutting down.")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Automated CTF Documentation, Live Session Recording & Verifiable Evidence Manager",
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
api_prefix = settings.API_V1_PREFIX
app.include_router(competitions_router, prefix=api_prefix)
app.include_router(challenges_router, prefix=api_prefix)
app.include_router(sessions_router, prefix=api_prefix)
app.include_router(evidence_router, prefix=api_prefix)
app.include_router(explainer_router, prefix=api_prefix)
app.include_router(compliance_router, prefix=api_prefix)
app.include_router(qa_router, prefix=api_prefix)
app.include_router(exports_router, prefix=api_prefix)
app.include_router(templates_router, prefix=api_prefix)
app.include_router(dashboard_router, prefix=api_prefix)

# WebSocket manager for terminal live broadcasting
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

ws_manager = ConnectionManager()

@app.websocket("/ws/terminal")
async def websocket_terminal_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # Broadcast to all connected UI clients (terminal viewers)
            await ws_manager.broadcast(data)
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

@app.get("/")
def health_check():
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "modules": [
            "A. Live CTF Session Recorder",
            "B. Evidence Vault (Digital Forensics & Proof)",
            "C. AI Technical Explainer (Evidence-Based)",
            "D. Competition Rule Engine (Regulation Compliance)",
            "E. One-Click Writeup Export Center"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
