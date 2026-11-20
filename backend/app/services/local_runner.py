import os
import sys
import time
import shutil
import hashlib
import logging
import subprocess
from typing import Dict, Any, List, Optional, Tuple

from app.core.security import sanitize_sensitive_data, compute_sha256

logger = logging.getLogger("ctf_studio.local_runner")

_CACHED_ENVIRONMENTS: Optional[List[Dict[str, Any]]] = None
_LAST_DISCOVERY_TIME = 0.0

def decode_output(raw_bytes: bytes) -> str:
    if not raw_bytes:
        return ""
    if b"\x00" in raw_bytes[:40]:
        try:
            return raw_bytes.decode("utf-16le", errors="ignore").strip()
        except Exception:
            pass
    return raw_bytes.decode("utf-8", errors="ignore").strip()

class LocalRunnerService:
    @staticmethod
    def detect_environments(force_refresh: bool = False) -> List[Dict[str, Any]]:
        global _CACHED_ENVIRONMENTS, _LAST_DISCOVERY_TIME
        now = time.time()
        if not force_refresh and _CACHED_ENVIRONMENTS is not None and (now - _LAST_DISCOVERY_TIME < 60.0):
            return _CACHED_ENVIRONMENTS

        environments: List[Dict[str, Any]] = []

        # 1. Windows PowerShell
        ps_installed = shutil.which("powershell.exe") is not None or shutil.which("powershell") is not None
        ps_tools = []
        if ps_installed:
            for tool in ["curl", "git", "python", "ping", "nslookup", "certutil", "tar"]:
                if shutil.which(tool):
                    ps_tools.append(tool)
            environments.append({
                "id": "powershell",
                "name": "Windows PowerShell",
                "shell_type": "powershell",
                "status": "ready",
                "is_default": True,
                "icon": "terminal",
                "description": "Windows Host PowerShell 5.1 / Core",
                "tools": ps_tools
            })

        # 2. Command Prompt
        cmd_installed = shutil.which("cmd.exe") is not None
        if cmd_installed:
            environments.append({
                "id": "cmd",
                "name": "Command Prompt (CMD)",
                "shell_type": "cmd",
                "status": "ready",
                "is_default": False,
                "icon": "terminal",
                "description": "Windows Command Prompt",
                "tools": ["ping", "curl", "findstr"]
            })

        # 3. WSL Distros
        wsl_exe = shutil.which("wsl.exe")
        if wsl_exe:
            try:
                res = subprocess.run([wsl_exe, "-l", "-q"], capture_output=True, timeout=5)
                raw_out = decode_output(res.stdout)
                distros = [line.strip() for line in raw_out.splitlines() if line.strip()]
                
                for distro in distros:
                    # Test responsive
                    is_ready = False
                    tools_found = []
                    try:
                        test_res = subprocess.run(
                            [wsl_exe, "-d", distro, "--", "which", "nmap", "curl", "python3", "file", "strings", "git", "gobuster", "nc"],
                            capture_output=True,
                            timeout=4
                        )
                        out_text = decode_output(test_res.stdout)
                        if test_res.returncode == 0 and ("/" in out_text or "nmap" in out_text or "python" in out_text):
                            is_ready = True
                            for line in out_text.splitlines():
                                t = line.strip().split("/")[-1]
                                if t and t not in tools_found and not any(err_word in t for err_word in ["Failed", "Error", "WSL2"]):
                                    tools_found.append(t)
                        elif test_res.returncode == 0:
                            is_ready = True
                    except Exception:
                        is_ready = False

                    display_name = f"WSL ({distro})"
                    desc = f"WSL2 Linux Environment ({distro})"
                    if "kali" in distro.lower():
                        desc = "Kali Linux Penetration Testing Environment"
                    elif "ubuntu" in distro.lower():
                        desc = "Ubuntu Linux Research Workstation"

                    if is_ready:
                        environments.append({
                            "id": f"wsl:{distro}",
                            "name": display_name,
                            "shell_type": f"wsl:{distro}",
                            "distro": distro,
                            "status": "ready",
                            "is_default": ("ubuntu-24.04" in distro.lower()),
                            "icon": "linux",
                            "description": desc,
                            "tools": tools_found if tools_found else ["bash", "curl", "python3", "git"]
                        })
                    else:
                        # Distro is installed in registry but currently stopped or disk unattached
                        environments.append({
                            "id": f"wsl:{distro}",
                            "name": display_name,
                            "shell_type": f"wsl:{distro}",
                            "distro": distro,
                            "status": "installed",
                            "is_default": False,
                            "icon": "linux",
                            "description": f"{desc} (Offline / Standby)",
                            "tools": ["bash"]
                        })
            except Exception as e:
                logger.warning(f"Error querying WSL distros: {e}")

        _CACHED_ENVIRONMENTS = environments
        _LAST_DISCOVERY_TIME = now
        return environments

    @staticmethod
    def execute_command(
        command: str,
        shell_type: str = "powershell",
        cwd: Optional[str] = None,
        timeout_seconds: int = 30
    ) -> Dict[str, Any]:
        """
        Executes a command locally in the specified shell environment,
        capturing stdout, stderr, exit code, execution time, and SHA-256 signature.
        """
        t0 = time.time()
        sanitized_input, was_redacted = sanitize_sensitive_data(command)

        args = []
        if shell_type == "powershell":
            args = ["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", command]
        elif shell_type == "cmd":
            args = ["cmd.exe", "/c", command]
        elif shell_type.startswith("wsl"):
            distro = shell_type.split(":", 1)[1] if ":" in shell_type else None
            if distro:
                args = ["wsl.exe", "-d", distro, "--", "bash", "-c", command]
            else:
                args = ["wsl.exe", "--", "bash", "-c", command]
        else:
            args = ["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", command]

        exit_code = 0
        stdout_str = ""
        stderr_str = ""

        try:
            res = subprocess.run(
                args,
                capture_output=True,
                cwd=cwd if cwd and os.path.exists(cwd) else None,
                timeout=timeout_seconds
            )
            exit_code = res.returncode
            stdout_str = decode_output(res.stdout)
            stderr_str = decode_output(res.stderr)
        except subprocess.TimeoutExpired:
            exit_code = 124
            stderr_str = f"Execution timed out after {timeout_seconds} seconds."
        except Exception as e:
            exit_code = 1
            stderr_str = f"Execution error: {str(e)}"

        dur_ms = int((time.time() - t0) * 1000)

        # Sanitize outputs (redact sensitive tokens/passwords if present)
        clean_stdout, _ = sanitize_sensitive_data(stdout_str)
        clean_stderr, _ = sanitize_sensitive_data(stderr_str)

        # Cryptographic SHA-256 of the combined execution payload
        execution_transcript = f"{shell_type}:{command}\nSTDOUT:\n{clean_stdout}\nSTDERR:\n{clean_stderr}\nEXIT:{exit_code}".encode("utf-8")
        sha256_hash = compute_sha256(execution_transcript)

        return {
            "command": sanitized_input,
            "raw_command": command if was_redacted else None,
            "shell_type": shell_type,
            "stdout": clean_stdout,
            "stderr": clean_stderr,
            "exit_code": exit_code,
            "duration_ms": dur_ms,
            "sha256_hash": sha256_hash,
            "cwd": cwd or "",
            "is_sensitive": was_redacted
        }
