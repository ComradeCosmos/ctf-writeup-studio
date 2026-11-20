"""
CTF Writeup Studio — Dedicated Local Terminal Agent
Supports: PowerShell, Windows Terminal, CMD, Bash, Zsh, and WSL.
Captures commands, stdout, stderr, timestamps, duration, exit codes, and directories.
Features:
- Mandatory explicit user action and pre-execution command display
- Real-time secret and credential redaction
- Safe local-only communication with the CTF Studio backend
"""

import sys
import os
import time
import subprocess
import argparse
import requests
import json

class LocalTerminalAgent:
    def __init__(self, api_url: str = "http://127.0.0.1:8000/api/v1", token: str = "ctf-local-agent-token-9842"):
        self.api_url = api_url.rstrip("/")
        self.token = token
        self.headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        self.active_session_id = None
        self.active_challenge_id = None
        self.active_competition_id = None

    def start_session(self, competition_id: str, challenge_id: str, session_name: str, shell_type: str = "powershell"):
        payload = {
            "competition_id": competition_id,
            "challenge_id": challenge_id,
            "name": session_name,
            "shell_type": shell_type,
            "working_directory": os.getcwd()
        }
        res = requests.post(f"{self.api_url}/sessions/", json=payload, headers=self.headers)
        if res.status_code in (200, 201):
            data = res.json()
            self.active_session_id = data["id"]
            self.active_challenge_id = challenge_id
            self.active_competition_id = competition_id
            print(f"[+] Live CTF Session Initialized: {self.active_session_id}")
            print(f"[+] Recording terminal activity for Challenge: {challenge_id}")
            return self.active_session_id
        else:
            print(f"[-] Failed to start session: {res.text}")
            return None

    def execute_and_record(self, command_str: str, user_note: str = ""):
        if not self.active_session_id:
            print("[-] No active CTF session. Please initialize a session first.")
            return

        # Mandatory Safety: Explicit preview before execution
        print(f"\n[CTF-Studio-Agent] Preparing execution:")
        print(f"  Command : {command_str}")
        print(f"  Directory: {os.getcwd()}")
        print(f"  Session  : {self.active_session_id}")
        
        start_time = time.time()
        try:
            # Execute with user shell
            process = subprocess.Popen(
                command_str,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            stdout, stderr = process.communicate()
            exit_code = process.returncode
        except Exception as e:
            stdout = ""
            stderr = str(e)
            exit_code = -1

        duration_ms = int((time.time() - start_time) * 1000)

        # Print output to terminal for user
        if stdout:
            sys.stdout.write(stdout)
        if stderr:
            sys.stderr.write(stderr)

        # Transmit to CTF Studio backend for recording and redaction
        record_payload = {
            "session_id": self.active_session_id,
            "challenge_id": self.active_challenge_id,
            "command": command_str,
            "stdout": stdout,
            "stderr": stderr,
            "exit_code": exit_code,
            "duration_ms": duration_ms,
            "cwd": os.getcwd(),
            "shell": "powershell" if os.name == "nt" else "bash",
            "user_note": user_note
        }
        try:
            r = requests.post(f"{self.api_url}/sessions/command", json=record_payload, headers=self.headers)
            if r.status_code in (200, 201):
                res_data = r.json()
                print(f"[✓ Logged to Session Timeline (ID: {res_data.get('id')})]")
            else:
                print(f"[!] Warning: Backend recording returned code {r.status_code}")
        except Exception as ex:
            print(f"[!] Warning: Could not reach CTF Studio server: {ex}")

    def stop_session(self):
        if not self.active_session_id:
            return
        requests.patch(f"{self.api_url}/sessions/{self.active_session_id}/status", json={"status": "stopped"}, headers=self.headers)
        print(f"[+] CTF Session {self.active_session_id} stopped and preserved.")
        self.active_session_id = None

def main():
    parser = argparse.ArgumentParser(description="CTF Writeup Studio Local Terminal Agent")
    parser.add_argument("--comp", help="Competition ID", default="COMP-SAMPLE")
    parser.add_argument("--chal", help="Challenge ID", default="CHAL-WEB-001")
    parser.add_argument("--name", help="Session Name", default="Interactive Solving Session")
    parser.add_argument("--url", help="API URL", default="http://127.0.0.1:8000/api/v1")
    args = parser.parse_args()

    agent = LocalTerminalAgent(api_url=args.url)
    session_id = agent.start_session(args.comp, args.chal, args.name)
    if not session_id:
        return

    print("\n--- CTF Writeup Studio Interactive Terminal Shell ---")
    print("Type commands as usual. Commands, exit codes, and output will be recorded.")
    print("Type 'exit' or 'stop' to conclude session.\n")

    try:
        while True:
            cmd = input(f"ctf-studio [{args.chal}] $ ")
            if not cmd.strip():
                continue
            if cmd.strip().lower() in ("exit", "stop", "quit"):
                break
            agent.execute_and_record(cmd)
    except KeyboardInterrupt:
        print("\n[!] User interrupted session.")
    finally:
        agent.stop_session()

if __name__ == "__main__":
    main()
