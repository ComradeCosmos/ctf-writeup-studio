#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "================================================================="
echo "CTF WRITEUP STUDIO - LOCAL PRODUCTION WORKSPACE"
echo "================================================================="

if [ ! -f "frontend/dist/index.html" ]; then
    echo "[*] Building production frontend..."
    cd frontend
    npm install
    npm run build
    cd "$DIR"
fi

echo "[*] Starting unified local server on http://localhost:8000 ..."
cd backend
export PYTHONPATH="$DIR/backend"
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
