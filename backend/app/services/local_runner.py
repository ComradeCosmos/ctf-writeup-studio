import os
import sys
import time
import shutil
import hashlib
import logging
import platform
import subprocess
from pathlib import Path
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

def get_linux_distro_name() -> str:
    """Detects Linux distribution name from /etc/os-release or fallback."""
    os_release = Path("/etc/os-release")
    if os_release.exists():
        try:
            with open(os_release, "r", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    if line.startswith("PRETTY_NAME="):
                        return line.split("=", 1)[1].strip().strip('"')
                    if line.startswith("NAME="):
                        return line.split("=", 1)[1].strip().strip('"')
        except Exception:
            pass
    return "Linux Workstation"

class LocalRunnerService:
    @staticmethod
    def detect_environments(force_refresh: bool = False) -> List[Dict[str, Any]]:
        global _CACHED_ENVIRONMENTS, _LAST_DISCOVERY_TIME
        now = time.time()
        if not force_refresh and _CACHED_ENVIRONMENTS is not None and (now - _LAST_DISCOVERY_TIME < 60.0):
            return _CACHED_ENVIRONMENTS

        environments: List[Dict[str, Any]] = []
        current_os = platform.system().lower()

        # Common security & audit tool candidates across all operating systems
        tool_candidates = [
            ("nmap", ["--version"], "Port Scanning & Network Fingerprinting", "nmap -sn 127.0.0.1"),
            ("git", ["--version"], "Version Control & Branch Forensics", "git status"),
            ("python3", ["--version"], "Exploit Scripting & Cryptography", "python3 -c \"import hashlib; print(hashlib.sha256(b'test').hexdigest())\""),
            ("python", ["--version"], "Python Runtime", "python -c \"import hashlib; print(hashlib.sha256(b'test').hexdigest())\""),
            ("curl", ["--version"], "HTTP/S Probe & API Exploitation", "curl -I http://127.0.0.1:8000/docs"),
            ("tar", ["--version"], "Archive Extraction & Evidence Packaging", "tar --version"),
            ("ping", ["-c", "1", "127.0.0.1"] if current_os != "windows" else ["-?"], "ICMP Network Discovery", "ping 127.0.0.1"),
            ("nslookup", ["-?"], "DNS Records & Reconnaissance", "nslookup localhost"),
            ("ssh", ["-V"], "Remote Shell & SSH Tunneling", "ssh -V"),
            ("node", ["--version"], "Node.js Runtime & Frontend Tooling", "node -v"),
            ("npm", ["--version"], "Package Manager", "npm -v"),
            ("gobuster", ["version"], "Directory / DNS Brute-forcing", "gobuster version"),
            ("nikto", ["-Version"], "Web Server Vulnerability Scanner", "nikto -Version"),
            ("sqlmap", ["--version"], "SQL Injection Assessment", "sqlmap --version"),
            ("gh", ["--version"], "GitHub Command Line Interface", "gh --version"),
            ("docker", ["--version"], "Container Sandbox Runner", "docker --version"),
            ("nc", ["-h"], "Arbitrary TCP/UDP Connections", "nc -h"),
            ("file", ["--version"], "File Type Identification", "file --version"),
            ("strings", ["--version"], "Binary Strings Extraction", "strings --version")
        ]

        if current_os == "windows":
            tool_candidates.append(
                ("certutil", ["-?"], "Windows Certificate & SHA-256 Hashing", "certutil -hashfile backend/data/ctf_studio.db SHA256")
            )

        # 1. Native POSIX Shells (Linux & macOS / Darwin)
        if current_os in ("linux", "darwin"):
            distro_name = get_linux_distro_name() if current_os == "linux" else f"macOS ({platform.mac_ver()[0] or 'Darwin'})"
            is_kali = "kali" in distro_name.lower()

            # Bash environment
            bash_bin = shutil.which("bash") or "/bin/bash"
            if os.path.exists(bash_bin) or shutil.which("bash"):
                verified_tools = []
                tools_list = []
                for t_name, ver_args, cat, sample in tool_candidates:
                    bin_path = shutil.which(t_name)
                    if bin_path:
                        tools_list.append(t_name)
                        ver_str = "Verified"
                        try:
                            r = subprocess.run([t_name] + ver_args, capture_output=True, timeout=1.5)
                            raw_v = decode_output(r.stdout) or decode_output(r.stderr)
                            fl = raw_v.splitlines()[0] if raw_v else ""
                            if fl and not any(e in fl.lower() for e in ["unknown arg", "bad option"]):
                                ver_str = fl[:50]
                        except Exception:
                            pass
                        verified_tools.append({
                            "name": t_name,
                            "path": bin_path,
                            "version": ver_str,
                            "category": cat,
                            "sample_command": sample,
                            "verified": True
                        })

                environments.append({
                    "id": "bash",
                    "name": f"{distro_name} (Bash)",
                    "shell_type": "bash",
                    "status": "ready",
                    "is_default": True,
                    "icon": "linux" if current_os == "linux" else "terminal",
                    "description": f"Native {'Kali Linux' if is_kali else 'Linux'} shell environment with audit binaries",
                    "tools": tools_list,
                    "verified_tools": verified_tools
                })

            # Zsh environment (Default on macOS, popular on Kali/Arch)
            zsh_bin = shutil.which("zsh") or "/bin/zsh"
            if os.path.exists(zsh_bin) or shutil.which("zsh"):
                environments.append({
                    "id": "zsh",
                    "name": f"{distro_name} (Zsh)",
                    "shell_type": "zsh",
                    "status": "ready",
                    "is_default": (current_os == "darwin" or is_kali),
                    "icon": "terminal",
                    "description": f"Z-Shell on {distro_name}",
                    "tools": ["zsh", "curl", "git", "python3"]
                })

            # PowerShell Core on Linux/macOS if installed (pwsh)
            pwsh_bin = shutil.which("pwsh")
            if pwsh_bin:
                environments.append({
                    "id": "pwsh",
                    "name": "PowerShell Core (pwsh)",
                    "shell_type": "pwsh",
                    "status": "ready",
                    "is_default": False,
                    "icon": "terminal",
                    "description": "Microsoft PowerShell Core for Linux / macOS",
                    "tools": ["pwsh"]
                })

        # 2. Windows PowerShell & CMD (Windows Host)
        if current_os == "windows":
            ps_installed = shutil.which("powershell.exe") is not None or shutil.which("powershell") is not None
            ps_tools = []
            verified_tools = []
            if ps_installed:
                for t_name, ver_args, cat, sample in tool_candidates:
                    bin_path = shutil.which(t_name)
                    if bin_path:
                        ps_tools.append(t_name)
                        version_str = "Verified"
                        try:
                            r = subprocess.run([t_name] + ver_args, capture_output=True, timeout=1.5)
                            raw_v = decode_output(r.stdout) or decode_output(r.stderr)
                            first_line = raw_v.splitlines()[0] if raw_v else ""
                            if first_line and not any(err in first_line.lower() for err in ["unknown arg", "bad option"]):
                                version_str = first_line[:50]
                        except Exception:
                            pass
                        verified_tools.append({
                            "name": t_name,
                            "path": bin_path,
                            "version": version_str,
                            "category": cat,
                            "sample_command": sample,
                            "verified": True
                        })

                environments.append({
                    "id": "powershell",
                    "name": "Windows PowerShell",
                    "shell_type": "powershell",
                    "status": "ready",
                    "is_default": True,
                    "icon": "terminal",
                    "description": "Windows Host PowerShell 5.1 / Core with verified binaries",
                    "tools": ps_tools,
                    "verified_tools": verified_tools
                })

            # Command Prompt
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

            # WSL Distros
            wsl_exe = shutil.which("wsl.exe")
            if wsl_exe:
                try:
                    res = subprocess.run([wsl_exe, "-l", "-q"], capture_output=True, timeout=5)
                    raw_out = decode_output(res.stdout)
                    distros = [line.strip() for line in raw_out.splitlines() if line.strip()]
                    
                    for distro in distros:
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

                        environments.append({
                            "id": f"wsl:{distro}",
                            "name": display_name,
                            "shell_type": f"wsl:{distro}",
                            "distro": distro,
                            "status": "ready" if is_ready else "installed",
                            "is_default": ("ubuntu-24.04" in distro.lower()),
                            "icon": "linux",
                            "description": desc,
                            "tools": tools_found if tools_found else ["bash", "curl", "python3", "git"]
                        })
                except Exception as e:
                    logger.warning(f"Error querying WSL distros: {e}")

        # Safe fallback if no environments were registered
        if not environments:
            environments.append({
                "id": "sh",
                "name": "Standard POSIX Shell",
                "shell_type": "sh",
                "status": "ready",
                "is_default": True,
                "icon": "terminal",
                "description": "Standard system command shell",
                "tools": ["sh", "curl", "python"]
            })

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
        Executes a command locally in the specified shell environment across
        any platform (Windows, macOS, Linux distributions: Kali, Ubuntu, Arch, Debian, Fedora, Alpine).
        Captures stdout, stderr, exit code, execution latency, and SHA-256 signature.
        """
        t0 = time.time()
        sanitized_input, was_redacted = sanitize_sensitive_data(command)
        current_os = platform.system().lower()

        args = []
        if shell_type in ("bash", "sh", "zsh", "fish"):
            shell_bin = shutil.which(shell_type) or f"/bin/{shell_type}"
            if not os.path.exists(shell_bin):
                shell_bin = shutil.which("bash") or shutil.which("sh") or "sh"
            args = [shell_bin, "-c", command]

        elif shell_type == "pwsh":
            pwsh_bin = shutil.which("pwsh") or "pwsh"
            args = [pwsh_bin, "-NoProfile", "-NonInteractive", "-Command", command]

        elif shell_type == "powershell":
            if current_os == "windows":
                ps_bin = shutil.which("powershell.exe") or shutil.which("powershell") or "powershell.exe"
                args = [ps_bin, "-NoProfile", "-NonInteractive", "-Command", command]
            else:
                # Linux or macOS fallback: use pwsh if present, else bash
                if shutil.which("pwsh"):
                    args = ["pwsh", "-NoProfile", "-NonInteractive", "-Command", command]
                else:
                    shell_bin = shutil.which("bash") or shutil.which("sh") or "sh"
                    args = [shell_bin, "-c", command]

        elif shell_type == "cmd":
            if current_os == "windows":
                cmd_bin = shutil.which("cmd.exe") or "cmd.exe"
                args = [cmd_bin, "/c", command]
            else:
                shell_bin = shutil.which("sh") or "sh"
                args = [shell_bin, "-c", command]

        elif shell_type.startswith("wsl"):
            if current_os == "windows":
                wsl_bin = shutil.which("wsl.exe") or "wsl.exe"
                distro = shell_type.split(":", 1)[1] if ":" in shell_type else None
                if distro:
                    args = [wsl_bin, "-d", distro, "--", "bash", "-c", command]
                else:
                    args = [wsl_bin, "--", "bash", "-c", command]
            else:
                # On native Linux, execute directly in native bash
                shell_bin = shutil.which("bash") or shutil.which("sh") or "sh"
                args = [shell_bin, "-c", command]

        else:
            # Universal fallback based on OS
            if current_os == "windows":
                ps_bin = shutil.which("powershell.exe") or "powershell.exe"
                args = [ps_bin, "-NoProfile", "-NonInteractive", "-Command", command]
            else:
                shell_bin = shutil.which("bash") or shutil.which("sh") or "sh"
                args = [shell_bin, "-c", command]

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

    @staticmethod
    def get_real_host_history(limit: int = 50) -> List[Dict[str, Any]]:
        """
        Reads actual commands from the host shell history files:
        - Windows: PowerShell ConsoleHost_history.txt
        - Linux & macOS: ~/.bash_history, ~/.zsh_history, ~/.local/share/atuin/history.db
        """
        commands = []
        current_os = platform.system().lower()
        seen = set()

        history_files: List[Tuple[str, str, str]] = []

        if current_os == "windows":
            appdata = os.environ.get("APPDATA", "")
            ps_history = os.path.join(appdata, "Microsoft", "Windows", "PowerShell", "PSReadLine", "ConsoleHost_history.txt")
            history_files.append((ps_history, "Host PowerShell", "powershell"))

        # POSIX history paths (works on Linux, macOS, WSL, or Git Bash)
        home = str(Path.home())
        history_files.extend([
            (os.path.join(home, ".bash_history"), "Host Bash", "bash"),
            (os.path.join(home, ".zsh_history"), "Host Zsh", "zsh"),
            (os.path.join(home, ".histfile"), "Host Shell", "sh")
        ])

        for path, source_label, sh_name in history_files:
            if os.path.exists(path):
                try:
                    with open(path, "r", encoding="utf-8", errors="ignore") as f:
                        raw_lines = [l.strip() for l in f if l.strip()]
                    for cmd in reversed(raw_lines):
                        # Clean zsh timestamp format : 1732000000:0;command
                        cleaned_cmd = cmd
                        if cleaned_cmd.startswith(":") and ";" in cleaned_cmd:
                            cleaned_cmd = cleaned_cmd.split(";", 1)[1].strip()

                        if cleaned_cmd not in seen and len(cleaned_cmd) > 2 and not cleaned_cmd.startswith("#"):
                            seen.add(cleaned_cmd)
                            commands.append({
                                "command": cleaned_cmd,
                                "source": f"{source_label} (Real-world)",
                                "shell": sh_name,
                                "exit_code": 0
                            })
                        if len(commands) >= limit:
                            break
                except Exception as e:
                    logger.warning(f"Error reading history from {path}: {e}")

            if len(commands) >= limit:
                break

        return commands
