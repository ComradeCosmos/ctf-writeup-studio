import os
import logging
from pathlib import Path
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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

@app.get("/api/health")
def api_health():
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "offline_mode": getattr(settings, "OFFLINE_MODE", True)
    }

# Check for production frontend build (local unified hosting)
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if FRONTEND_DIST.exists() and (FRONTEND_DIST / "index.html").exists():
    if (FRONTEND_DIST / "assets").exists():
        app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Exclude backend API, docs, and websocket endpoints from SPA routing
        if (
            full_path.startswith("api/") or 
            full_path.startswith("docs") or 
            full_path.startswith("openapi.json") or 
            full_path.startswith("ws/")
        ):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        
        target = FRONTEND_DIST / full_path
        if target.is_file():
            return FileResponse(str(target))
        return FileResponse(str(FRONTEND_DIST / "index.html"))
else:
    @app.get("/")
    def health_check():
        return {
            "status": "online",
            "app": settings.APP_NAME,
            "version": settings.VERSION,
            "message": "Frontend build not detected. Run 'npm run build' in frontend directory to serve UI from backend."
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
