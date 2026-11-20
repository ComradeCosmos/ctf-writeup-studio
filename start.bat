@echo off
title CTF Writeup Studio - Local Production Server
echo =================================================================
echo CTF WRITEUP STUDIO - LOCAL PRODUCTION WORKSPACE
echo =================================================================
echo.
cd /d "%~dp0"

echo [*] Checking frontend build...
if not exist "frontend\dist\index.html" (
    echo [*] Building production frontend...
    cd frontend
    call npm install
    call npm run build
    cd ..
)

echo [*] Starting unified local server on http://localhost:8000 ...
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
pause
