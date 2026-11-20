from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.template import WriteupTemplate

router = APIRouter(prefix="/templates", tags=["Templates"])

DEFAULT_TEMPLATES = [
    {
        "id": "TPL-STD",
        "name": "Standard CTF Writeup",
        "category": "CTF",
        "description": "Clean, practitioner-grade CTF walkthrough with Recon, Exploitation, and Flag sections.",
        "required_sections": ["Overview", "Reconnaissance", "Vulnerability Identification", "Exploitation", "Flag Retrieval", "Key Takeaways"],
        "structure_markdown": """# {{challenge_name}} — CTF Writeup
> **Category**: {{category}} | **Difficulty**: {{difficulty}} | **Points**: {{points}}

## 1. Challenge Overview
{{description}}

## 2. Reconnaissance & Enumeration
Detailed port scans, directory discovery, and service probing.

## 3. Vulnerability Identification
Analysis of target weakness and attack vectors.

## 4. Exploitation
Step-by-step exploit commands, scripts, and payloads.

## 5. Flag Retrieval
Verified capture and proof of execution.

## 6. Key Takeaways & Defense
Root cause analysis and defensive remediation recommendations.
"""
    },
    {
        "id": "TPL-HTB",
        "name": "HackTheBox Writeup",
        "category": "Platform",
        "description": "Structured machine writeup format with User Flag and Root/System Flag steps.",
        "required_sections": ["Overview", "Enumeration", "User Flag", "Root Flag", "Post-Exploitation"],
        "structure_markdown": """# HackTheBox — {{challenge_name}}
**OS**: Linux / Windows | **Difficulty**: {{difficulty}}

## Reconnaissance
- Nmap scanning results
- Web fuzzing

## Initial Foothold (User Flag)
Exploitation of service weakness to obtain low-privilege shell.

## Privilege Escalation (Root Flag)
Kernel exploit, SUID binary, or sudo permissions escalation.
"""
    },
    {
        "id": "TPL-PICO",
        "name": "picoCTF Writeup",
        "category": "Platform",
        "description": "Educational beginner-to-intermediate walkthrough with clear conceptual explanations.",
        "required_sections": ["Description", "Hints & Concepts", "Solution", "Flag"],
        "structure_markdown": """# picoCTF — {{challenge_name}}

## Problem Statement
{{description}}

## Relevant Concepts
Explanation of underlying cryptography, web, or binary concepts.

## Step-by-Step Solution
Commands used to reach the solution.
"""
    },
    {
        "id": "TPL-RESEARCH",
        "name": "Professional Security Research Report",
        "category": "Enterprise",
        "description": "Concise, publication-ready security advisory format with CVSS metrics and remediation.",
        "required_sections": ["Executive Summary", "Vulnerability Details", "Proof of Concept", "Impact Analysis", "Remediation"],
        "structure_markdown": """# Security Research Advisory — {{challenge_name}}

## Executive Summary
Formal technical advisory documenting discovery of security weaknesses.

## Technical Details & Attack Surface
Exact protocol, version, and input vectors involved.

## Verifiable Proof of Concept
Reproducible exploit artifact with sha256 checksums.

## Defensive Remediation
Technical code patch or configuration lockdown.
"""
    }
]

@router.get("/")
def list_templates(db: Session = Depends(get_db)):
    db_tpls = db.query(WriteupTemplate).all()
    if not db_tpls:
        for t in DEFAULT_TEMPLATES:
            item = WriteupTemplate(
                id=t["id"],
                name=t["name"],
                category=t["category"],
                description=t["description"],
                required_sections=t["required_sections"],
                structure_markdown=t["structure_markdown"],
                is_default=(t["id"] == "TPL-STD")
            )
            db.add(item)
        db.commit()
        db_tpls = db.query(WriteupTemplate).all()
    return db_tpls
