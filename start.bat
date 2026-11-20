@echo off
REM ==============================================================================
REM CTF Writeup Studio - Windows Launch Script
REM ==============================================================================
title CTF Writeup Studio Launcher
cd /d "%~dp0"

echo ==========================================================
echo Starting CTF Writeup Studio
echo ==========================================================

REM 1. Start Backend Daemon
echo [+] Launching FastAPI Backend on http://127.0.0.1:8000...
start "CTF Studio Backend" cmd /c "cd /d "%~dp0backend" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

REM 2. Start Frontend Dev Server
echo [+] Launching Vite Frontend on http://127.0.0.1:5173...
start "CTF Studio Frontend" cmd /c "cd /d "%~dp0frontend" && npm run dev -- --host 127.0.0.1 --port 5173"

echo ==========================================================
echo CTF Writeup Studio is launching in separate background windows.
echo Frontend UI: http://127.0.0.1:5173
echo Backend API: http://127.0.0.1:8000
echo ==========================================================
timeout /t 3 >nul
start http://127.0.0.1:5173
