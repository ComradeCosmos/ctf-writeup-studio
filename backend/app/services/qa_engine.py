import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session as DBSession

from app.models.challenge import Challenge
from app.models.evidence import Evidence
from app.models.session import TerminalCommand

class QAEngineService:
    @staticmethod
    def inspect_writeup(
        db: DBSession,
        challenge_id: str,
        content_markdown: str,
        author: str = ""
    ) -> Dict[str, Any]:
        """
        Runs quality assurance checks against writeup text, evidence links, and technical commands.
        """
        challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
        evidence_items = db.query(Evidence).filter(Evidence.challenge_id == challenge_id).all()
        commands = db.query(TerminalCommand).filter(TerminalCommand.challenge_id == challenge_id).all()
        
        issues = []
        warnings = []
        score = 100.0
        
        # 1. Section checks
        required_headers = [
            ("Overview", r"(?i)#+\s*.*overview"),
            ("Reconnaissance", r"(?i)#+\s*.*(recon|enumeration|scanning)"),
            ("Exploitation", r"(?i)#+\s*.*(exploit|solution|walkthrough)"),
            ("Flag Retrieval", r"(?i)#+\s*.*(flag|capture|proof)"),
            ("Key Takeaways", r"(?i)#+\s*.*(takeaway|remediation|defense|conclusion)")
        ]
        for name, pattern in required_headers:
            if not re.search(pattern, content_markdown):
                issues.append({
                    "severity": "high",
                    "category": "Structure",
                    "message": f"Missing standard technical section: '{name}'.",
                    "fix": f"Add section header `## {name}`."
                })
                score -= 10.0
                
        # 2. Image and evidence references
        img_refs = re.findall(r"!\[(.*?)\]\((.*?)\)", content_markdown)
        valid_stored_files = {ev.stored_filename for ev in evidence_items}
        for alt, src in img_refs:
            clean_src = src.replace("evidence://", "")
            if clean_src not in valid_stored_files and not clean_src.startswith("http"):
                issues.append({
                    "severity": "medium",
                    "category": "Evidence Link",
                    "message": f"Broken image reference detected: `{src}`.",
                    "fix": "Re-link screenshot from the Evidence Vault."
                })
                score -= 5.0

        # 3. Unreferenced evidence warning
        mentioned_text = content_markdown
        for ev in evidence_items:
            if ev.id not in mentioned_text and ev.stored_filename not in mentioned_text:
                warnings.append({
                    "severity": "low",
                    "category": "Unreferenced Evidence",
                    "message": f"Evidence `{ev.id}` ({ev.original_filename}) is stored in vault but not cited in writeup text.",
                    "fix": f"Add `[Evidence #{ev.id}]` into the relevant section."
                })
                score -= 2.0
                
        # 4. Command explanation check
        code_blocks = re.findall(r"```(?:bash|sh|cmd|powershell)?\s*\n([\s\S]*?)\n```", content_markdown)
        if not code_blocks:
            issues.append({
                "severity": "high",
                "category": "Technical Rigor",
                "message": "No terminal command blocks found in writeup.",
                "fix": "Insert terminal commands from your recorded session."
            })
            score -= 15.0

        # 5. Flag leak check
        if challenge and challenge.flag and challenge.flag in content_markdown:
            warnings.append({
                "severity": "medium",
                "category": "Security / Rules",
                "message": f"Raw flag `{challenge.flag}` is visible in the writeup document.",
                "fix": "Enable flag redaction if competition rules restrict sharing raw flags."
            })

        score = max(0.0, min(100.0, round(score, 1)))
        
        return {
            "score": score,
            "status": "PASS" if score >= 80 else ("REVIEW" if score >= 60 else "FAIL"),
            "issues": issues,
            "warnings": warnings,
            "total_checks": len(required_headers) + len(evidence_items) + 3,
            "passed_checks": len(required_headers) - len(issues)
        }
