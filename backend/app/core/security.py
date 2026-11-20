import re
import hashlib
from pathlib import Path
from typing import Tuple, List

# Common credential & secret patterns
SECRET_PATTERNS = [
    # API Keys & Tokens (Bearer token, api_key=..., etc.)
    (re.compile(r"(?i)(api[_-]?key|apikey|access[_-]?token|auth[_-]?token|bearer)\s*[:=\s]\s*['\"]?([a-zA-Z0-9_\-\.]{12,})['\"]?"), r"\1 [REDACTED_SECRET]"),
    (re.compile(r"sk-[a-zA-Z0-9]{20,}"), "[REDACTED_OPENAI_KEY]"),
    (re.compile(r"ghp_[a-zA-Z0-9]{20,}"), "[REDACTED_GITHUB_TOKEN]"),
    (re.compile(r"AKIA[0-9A-Z]{16}"), "[REDACTED_AWS_KEY]"),
    (re.compile(r"ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*"), "[REDACTED_JWT_TOKEN]"),
    
    # Passwords in CLI args: -p password, --password=secret, export PASS=..., -u user:password
    (re.compile(r"(?i)(-u\s+[^ \t\r\n\'\":]+:)([^ \t\r\n\'\"]+)"), r"\1[REDACTED_PASSWORD]"),
    (re.compile(r"(?i)(-p\s+|--password(?:=|\s+)|password\s*=\s*['\"]?)([^ \t\r\n\'\"]+)"), r"\1[REDACTED_PASSWORD]"),
    (re.compile(r"(?i)(export\s+[A-Z0-9_]*(?:PASS|SECRET|KEY|TOKEN)[A-Z0-9_]*\s*=\s*['\"]?)([^ \t\r\n\'\"]+)"), r"\1[REDACTED_SECRET]"),
    
    # Private Key blocks
    (re.compile(r"-----BEGIN [A-Z ]+ PRIVATE KEY-----[^-]+-----END [A-Z ]+ PRIVATE KEY-----", re.DOTALL), "[REDACTED_PRIVATE_KEY_BLOCK]")
]

FLAG_PATTERNS = [
    re.compile(r"[a-zA-Z0-9_\-]+{[a-zA-Z0-9_\-!@#$%^&*+=?]+}"),
    re.compile(r"(?i)(flag|htb|picoctf|ctf){[a-zA-Z0-9_\-!@#$%^&*+=?]+}")
]

def sanitize_sensitive_data(text: str) -> Tuple[str, bool]:
    """
    Sanitizes secrets, credentials, and API tokens from terminal commands or outputs.
    Returns (sanitized_text, was_redacted).
    """
    if not text:
        return text, False
    
    original = text
    sanitized = text
    for pattern, replacement in SECRET_PATTERNS:
        sanitized = pattern.sub(replacement, sanitized)
    
    return sanitized, sanitized != original

def redact_flags(text: str, mask: str = "[FLAG_REDACTED]") -> Tuple[str, List[str]]:
    """
    Detects and masks CTF flags according to competition regulation rules.
    Returns (redacted_text, detected_flags_list).
    """
    if not text:
        return text, []
    
    detected = []
    redacted = text
    for pattern in FLAG_PATTERNS:
        matches = pattern.findall(redacted)
        if matches:
            if isinstance(matches[0], tuple):
                for m in matches:
                    detected.append(m[0])
            else:
                detected.extend(matches)
            redacted = pattern.sub(mask, redacted)
            
    return redacted, list(set(detected))

def compute_sha256(data: bytes) -> str:
    """Computes SHA-256 hash of arbitrary bytes."""
    return hashlib.sha256(data).hexdigest()

def compute_file_sha256(filepath: Path) -> str:
    """Computes SHA-256 hash of a file on disk in streaming chunks."""
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def safe_path(base_dir: Path, target_path: str) -> Path:
    """
    Ensures safe path handling and prevents directory traversal attacks.
    """
    resolved = (base_dir / target_path).resolve()
    if not str(resolved).startswith(str(base_dir.resolve())):
        raise ValueError("Directory traversal attempt detected.")
    return resolved
