#!/usr/bin/env bash
# ==============================================================================
# CTF Writeup Studio - Universal Launch Script (Linux / macOS / WSL)
# Supports: Ubuntu, Debian, Kali Linux, Arch Linux, Fedora, Alpine, macOS
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Starting CTF Writeup Studio ==="
echo "Operating System: $(uname -s) $(uname -r)"

# 1. Setup Backend
cd "$SCRIPT_DIR/backend"
if [ ! -d "venv" ]; then
    echo "[+] Creating Python virtual environment..."
    python3 -m venv venv || python -m venv venv
fi
source venv/bin/activate || source venv/Scripts/activate

echo "[+] Installing backend dependencies..."
pip install -q -r requirements.txt

echo "[+] Starting FastAPI daemon on http://127.0.0.1:8000..."
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# 2. Setup Frontend
cd "$SCRIPT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo "[+] Installing frontend node dependencies..."
    npm install --silent
fi

echo "[+] Starting Vite development server on http://127.0.0.1:5173..."
npm run dev -- --host 127.0.0.1 --port 5173 &
FRONTEND_PID=$!

echo "=========================================================="
echo "CTF Writeup Studio is LIVE!"
echo "Frontend: http://127.0.0.1:5173"
echo "Backend:  http://127.0.0.1:8000"
echo "=========================================================="
echo "Press Ctrl+C to terminate both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
