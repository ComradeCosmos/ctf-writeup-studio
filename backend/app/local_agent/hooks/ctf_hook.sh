#!/usr/bin/env bash
# CTF Writeup Studio - Bash / Zsh / WSL Hook
# Source this file: source ctf_hook.sh

export CTF_STUDIO_API="${CTF_STUDIO_API:-http://127.0.0.1:8000/api/v1}"

ctf-exec() {
    local cmd="$*"
    if [ -z "$CTF_SESSION_ID" ]; then
        echo "[!] CTF_SESSION_ID not set. Running command directly..."
        eval "$cmd"
        return
    fi

    echo -e "\033[0;36m[CTF-Studio] Executing:\033[0m $cmd"
    local start_time=$(date +%s%3N)
    
    # Run command and capture output
    local output
    output=$(eval "$cmd" 2>&1)
    local exit_code=$?
    local end_time=$(date +%s%3N)
    local duration=$((end_time - start_time))

    echo "$output"

    # Send payload to backend
    python3 -c "
import requests, os, json, sys

data = {
    'session_id': os.environ.get('CTF_SESSION_ID', ''),
    'challenge_id': os.environ.get('CTF_CHALLENGE_ID', ''),
    'command': sys.argv[1],
    'stdout': sys.argv[2],
    'stderr': '',
    'exit_code': int(sys.argv[3]),
    'duration_ms': int(sys.argv[4]),
    'cwd': os.getcwd(),
    'shell': 'bash'
}
try:
    requests.post('${CTF_STUDIO_API}/sessions/command', json=data, timeout=1.5)
except Exception:
    pass
" "$cmd" "$output" "$exit_code" "$duration"
}

echo -e "\033[0;32m[+] CTF Studio Bash/WSL Hook Active. Use 'ctf-exec <command>' to record.\033[0m"
