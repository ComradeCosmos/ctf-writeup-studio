import os
import uuid
import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session as DBSession

from app.core.config import settings, EVIDENCE_DIR
from app.core.security import compute_file_sha256, compute_sha256, safe_path
from app.models.evidence import Evidence, EvidenceAuditLog
from app.models.session import TimelineEvent

class EvidenceVaultService:
    @staticmethod
    def store_evidence_file(
        db: DBSession,
        competition_id: str,
        challenge_id: str,
        original_filename: str,
        file_bytes: bytes,
        category: str = "custom",
        file_type: str = "application/octet-stream",
        session_id: Optional[str] = None,
        source: str = "manual_upload",
        solution_step: Optional[str] = None,
        user_description: str = "",
        raw_content: Optional[str] = None
    ) -> Tuple[Evidence, bool]:
        """
        Stores evidence, calculates SHA-256, checks for duplicate hashes,
        and saves securely in local Evidence Vault.
        Returns (evidence_item, is_duplicate).
        """
        file_hash = compute_sha256(file_bytes)
        file_size = len(file_bytes)
        
        # Check duplicate hash within the same challenge
        existing_dup = db.query(Evidence).filter(
            Evidence.challenge_id == challenge_id,
            Evidence.sha256_hash == file_hash
        ).first()
        
        # Unique ID with category prefix
        prefix_map = {
            "screenshot": "SCR",
            "terminal_log": "TRM",
            "http_traffic": "HTTP",
            "burp_export": "BURP",
            "pcap": "PCAP",
            "source_code": "SRC",
            "binary": "BIN",
            "hex_dump": "HEX",
            "network_scan": "SCAN",
            "exploit_output": "EXP",
            "payload": "PLD",
            "flag_proof": "FLAG"
        }
        pfx = prefix_map.get(category.lower(), "EVD")
        evidence_id = f"{pfx}-{uuid.uuid4().hex[:6].upper()}"
        
        ext = Path(original_filename).suffix or ".bin"
        stored_filename = f"{evidence_id}_{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}{ext}"
        destination = safe_path(EVIDENCE_DIR, stored_filename)
        
        with open(destination, "wb") as f:
            f.write(file_bytes)
            
        evidence = Evidence(
            id=evidence_id,
            competition_id=competition_id,
            challenge_id=challenge_id,
            session_id=session_id,
            category=category,
            original_filename=original_filename,
            stored_filename=stored_filename,
            file_type=file_type,
            file_size=file_size,
            sha256_hash=file_hash,
            source=source,
            solution_step=solution_step or "Reconnaissance",
            user_description=user_description,
            verification_status="verified",
            raw_content=raw_content,
            collection_timestamp=datetime.datetime.utcnow()
        )
        db.add(evidence)
        
        # Audit log entry
        audit = EvidenceAuditLog(
            id=f"AUD-{uuid.uuid4().hex[:8].upper()}",
            evidence_id=evidence.id,
            action="imported",
            new_hash=file_hash,
            details={"original_filename": original_filename, "size": file_size, "is_duplicate": existing_dup is not None}
        )
        db.add(audit)
        
        # Create corresponding timeline event
        timeline_event = TimelineEvent(
            id=f"EVT-{uuid.uuid4().hex[:8].upper()}",
            session_id=session_id or f"SES-GEN-{uuid.uuid4().hex[:4].upper()}",
            challenge_id=challenge_id,
            event_type="screenshot" if category == "screenshot" else "discovery",
            title=f"Captured {category.replace('_', ' ').title()}: {original_filename}",
            description=user_description or f"Added {category} evidence ({file_size} bytes)",
            timestamp=datetime.datetime.utcnow(),
            evidence_id=evidence.id,
            suggested_step=solution_step or "Reconnaissance"
        )
        db.add(timeline_event)
        
        db.commit()
        db.refresh(evidence)
        return evidence, (existing_dup is not None)

    @staticmethod
    def create_annotated_version(
        db: DBSession,
        parent_evidence_id: str,
        annotated_image_bytes: bytes,
        annotation_metadata: Dict[str, Any],
        user_description: str = ""
    ) -> Evidence:
        """
        Creates an annotated derivative artifact while preserving original evidence intact.
        """
        parent = db.query(Evidence).filter(Evidence.id == parent_evidence_id).first()
        if not parent:
            raise ValueError("Parent evidence not found.")
            
        annotated_id = f"ANN-{uuid.uuid4().hex[:6].upper()}"
        ext = Path(parent.stored_filename).suffix
        stored_filename = f"{annotated_id}_{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}{ext}"
        dest = safe_path(EVIDENCE_DIR, stored_filename)
        
        with open(dest, "wb") as f:
            f.write(annotated_image_bytes)
            
        new_hash = compute_sha256(annotated_image_bytes)
        
        annotated_evidence = Evidence(
            id=annotated_id,
            competition_id=parent.competition_id,
            challenge_id=parent.challenge_id,
            session_id=parent.session_id,
            category=parent.category,
            original_filename=f"annotated_{parent.original_filename}",
            stored_filename=stored_filename,
            file_type=parent.file_type,
            file_size=len(annotated_image_bytes),
            sha256_hash=new_hash,
            source="annotator_tool",
            solution_step=parent.solution_step,
            user_description=user_description or f"Annotated highlight of {parent.id}",
            verification_status="verified",
            is_annotated=True,
            parent_evidence_id=parent.id,
            annotation_metadata=annotation_metadata,
            collection_timestamp=datetime.datetime.utcnow()
        )
        db.add(annotated_evidence)
        
        audit = EvidenceAuditLog(
            id=f"AUD-{uuid.uuid4().hex[:8].upper()}",
            evidence_id=parent.id,
            action="annotated",
            previous_hash=parent.sha256_hash,
            new_hash=new_hash,
            details={"child_evidence_id": annotated_id, "metadata": annotation_metadata}
        )
        db.add(audit)
        db.commit()
        db.refresh(annotated_evidence)
        return annotated_evidence

    @staticmethod
    def verify_all_evidence_integrity(db: DBSession, challenge_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Recalculates SHA-256 for all stored evidence on disk and confirms integrity matches.
        """
        q = db.query(Evidence)
        if challenge_id:
            q = q.filter(Evidence.challenge_id == challenge_id)
        items = q.all()
        
        verified_count = 0
        corrupted = []
        missing = []
        
        for item in items:
            filepath = EVIDENCE_DIR / item.stored_filename
            if not filepath.exists():
                missing.append({"id": item.id, "filename": item.stored_filename, "expected_hash": item.sha256_hash})
                item.verification_status = "flagged"
                continue
                
            current_hash = compute_file_sha256(filepath)
            if current_hash == item.sha256_hash:
                verified_count += 1
                item.verification_status = "verified"
            else:
                corrupted.append({
                    "id": item.id,
                    "filename": item.stored_filename,
                    "stored_hash": item.sha256_hash,
                    "actual_disk_hash": current_hash
                })
                item.verification_status = "flagged"
                
        db.commit()
        return {
            "total_items": len(items),
            "verified": verified_count,
            "corrupted": corrupted,
            "missing": missing,
            "integrity_healthy": (len(corrupted) == 0 and len(missing) == 0)
        }

    @staticmethod
    def generate_manifest(db: DBSession, challenge_id: str) -> Dict[str, Any]:
        """
        Generates structured digital forensics evidence manifest for exports.
        """
        items = db.query(Evidence).filter(Evidence.challenge_id == challenge_id).all()
        manifest_items = []
        for it in items:
            manifest_items.append({
                "evidence_id": it.id,
                "category": it.category,
                "original_filename": it.original_filename,
                "stored_filename": it.stored_filename,
                "sha256_hash": it.sha256_hash,
                "file_size_bytes": it.file_size,
                "file_type": it.file_type,
                "source": it.source,
                "solution_step": it.solution_step,
                "user_description": it.user_description,
                "verification_status": it.verification_status,
                "is_annotated": it.is_annotated,
                "parent_evidence_id": it.parent_evidence_id,
                "timestamp_utc": it.collection_timestamp.isoformat() if it.collection_timestamp else None
            })
            
        return {
            "manifest_version": "1.2.0",
            "challenge_id": challenge_id,
            "generated_at": datetime.datetime.utcnow().isoformat(),
            "evidence_count": len(manifest_items),
            "artifacts": manifest_items
        }
