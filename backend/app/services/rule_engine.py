import re
import datetime
import uuid
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session as DBSession

from app.models.competition import Competition
from app.models.challenge import Challenge
from app.models.evidence import Evidence
from app.models.regulation import RegulationRule, ComplianceCheckResult
from app.models.writeup import WriteupDocument

class RuleEngineService:
    @staticmethod
    def get_or_create_default_rules(db: DBSession, competition_id: str) -> List[RegulationRule]:
        """Ensures default rules across the 12 standard categories exist for a competition."""
        existing = db.query(RegulationRule).filter(RegulationRule.competition_id == competition_id).all()
        if existing:
            return existing
            
        defaults = [
            ("publication_permission", "Publication Embargo Until Competition End", "Writeups must not be published publicly until the official contest conclusion.", "mandatory", {"allow_during_contest": False}),
            ("flag_disclosure", "Flag Disclosure Policy", "Flags must be partially or completely masked in writeups to prevent flag sharing.", "mandatory", {"disclose_flags": False, "mask": "CTF{...}"}),
            ("solution_disclosure", "Solution Disclosure & Spoilers", "Detailed exploit payloads can only be published after verification.", "mandatory", {"allow_payload_publication": True}),
            ("screenshot_requirement", "Mandatory Screenshots for Proof", "At least one screenshot demonstrating access or shell capture is required.", "mandatory", {"min_screenshots": 1}),
            ("source_code_disclosure", "Challenge Source Code Restrictions", "Do not redistribute full proprietary challenge binary/source code; only snippets permitted.", "restricted", {"allow_full_source": False, "max_code_lines": 80}),
            ("ai_content_restriction", "AI-Assisted Writing Disclosure", "Any writeup generated with AI assistance must clearly state the tool and model used.", "mandatory", {"require_ai_disclosure": True}),
            ("attribution_credit", "Author & Teammate Attribution", "Writeup must include author handle and team affiliation.", "mandatory", {"require_author": True}),
            ("required_formatting", "Standard Markdown / PDF Sections", "Writeup must contain Challenge Overview, Exploitation, and Flag Retrieval sections.", "mandatory", {"required_sections": ["Overview", "Exploitation", "Flag Retrieval"]}),
            ("submission_deadline", "Adherence to Submission Deadline", "Submissions after deadline timestamp are disqualified.", "mandatory", {}),
            ("file_size_limit", "Maximum Package File Size", "Complete export package must not exceed 50 MB and writeup must be detailed (min 150 words).", "restricted", {"max_size_mb": 50, "min_words": 150}),
            ("confidentiality", "Challenge Infrastructure Protection", "Do not disclose target internal RFC1918 IP addresses or non-public server credentials.", "mandatory", {"protect_internal_ips": True}),
            ("tool_restriction", "Prohibited Automated Exploitation Tools", "DoS tools and uncontrolled automated scanners (ddos, masscan, slowloris) are strictly prohibited.", "mandatory", {"prohibited_tools": ["ddos", "slowloris", "masscan", "loic"]})
        ]
        
        created = []
        comp_prefix = competition_id.replace("COMP-", "").replace("-", "")[:4]
        for i, (cat, title, desc, sev, params) in enumerate(defaults, 1):
            rule = RegulationRule(
                id=f"RUL-{comp_prefix}-{uuid.uuid4().hex[:4].upper()}-{i:02d}",
                competition_id=competition_id,
                category=cat,
                title=title,
                description=desc,
                severity=sev,
                rule_parameter=params,
                is_active=True
            )
            db.add(rule)
            created.append(rule)
            
        db.commit()
        return created

    @staticmethod
    def create_custom_rule(
        db: DBSession,
        competition_id: str,
        category: str,
        title: str,
        description: str,
        severity: str = "mandatory",
        rule_parameter: Optional[Dict[str, Any]] = None,
        source_reference: Optional[str] = None
    ) -> RegulationRule:
        """Allows users to define custom competition regulations with automated checks."""
        rule_id = f"RUL-CUST-{uuid.uuid4().hex[:6].upper()}"
        rule = RegulationRule(
            id=rule_id,
            competition_id=competition_id,
            category=category,
            title=title,
            description=description,
            severity=severity,
            rule_parameter=rule_parameter or {},
            source_reference=source_reference or "User-defined custom regulation",
            is_active=True
        )
        db.add(rule)
        db.commit()
        db.refresh(rule)
        return rule

    @staticmethod
    def parse_guidelines_text(
        db: DBSession,
        competition_id: str,
        raw_text: str
    ) -> List[RegulationRule]:
        """
        Parses raw text or markdown guidelines and extracts structured rules automatically.
        """
        lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
        imported_rules = []
        
        for line in lines:
            line_lower = line.lower()
            if any(k in line_lower for k in ["rule", "must", "prohibited", "forbidden", "require", "mandatory", "shall not", "don't"]):
                # Categorize rule based on keywords
                cat = "custom"
                sev = "mandatory"
                params = {}
                
                if "flag" in line_lower:
                    cat = "flag_disclosure"
                    params = {"disclose_flags": False}
                elif "screenshot" in line_lower or "proof" in line_lower:
                    cat = "screenshot_requirement"
                    params = {"min_screenshots": 1}
                elif "publish" in line_lower or "embargo" in line_lower or "after contest" in line_lower:
                    cat = "publication_permission"
                    params = {"allow_during_contest": False}
                elif "ai" in line_lower or "chatgpt" in line_lower or "llm" in line_lower:
                    cat = "ai_content_restriction"
                    params = {"require_ai_disclosure": True}
                elif "ip" in line_lower or "internal" in line_lower or "infrastructure" in line_lower:
                    cat = "confidentiality"
                    params = {"protect_internal_ips": True}
                elif "tool" in line_lower or "dos" in line_lower or "automated" in line_lower:
                    cat = "tool_restriction"
                    params = {"prohibited_tools": ["ddos", "slowloris", "masscan"]}
                elif "author" in line_lower or "credit" in line_lower or "team" in line_lower:
                    cat = "attribution_credit"
                    params = {"require_author": True}
                elif "word" in line_lower or "length" in line_lower:
                    cat = "file_size_limit"
                    params = {"min_words": 150}
                    
                rule = RuleEngineService.create_custom_rule(
                    db=db,
                    competition_id=competition_id,
                    category=cat,
                    title=f"Extracted: {line[:50]}...",
                    description=line,
                    severity=sev,
                    rule_parameter=params,
                    source_reference="Imported Guidelines"
                )
                imported_rules.append(rule)
                
        return imported_rules

    @staticmethod
    def audit_compliance(
        db: DBSession,
        competition_id: str,
        challenge_id: str,
        writeup_content: str,
        author: str = "",
        writeup_id: Optional[str] = None
    ) -> ComplianceCheckResult:
        """
        Audits a writeup against the competition's active regulation rules across all categories,
        including built-in and user-added custom rules.
        """
        competition = db.query(Competition).filter(Competition.id == competition_id).first()
        challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
        rules = db.query(RegulationRule).filter(
            RegulationRule.competition_id == competition_id,
            RegulationRule.is_active == True
        ).all()
        
        if not rules:
            rules = RuleEngineService.get_or_create_default_rules(db, competition_id)
            
        passed = []
        failed = []
        potential_violations = []
        missing_info = []
        restricted_content = []
        recommended_corrections = []
        
        now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
        screenshots = db.query(Evidence).filter(
            Evidence.challenge_id == challenge_id,
            Evidence.category == "screenshot"
        ).count()
        word_count = len(writeup_content.split())
        
        for rule in rules:
            cat = rule.category
            params = rule.rule_parameter or {}
            
            # 1. Publication permission check
            if cat == "publication_permission":
                if competition and competition.end_date and now < competition.end_date:
                    potential_violations.append({
                        "rule_id": rule.id,
                        "rule_title": rule.title,
                        "issue": f"Competition is currently active until {competition.end_date.strftime('%Y-%m-%d %H:%M UTC')}. Public writeup distribution is restricted.",
                        "remedy": "Hold writeup release until the competition deadline passes."
                    })
                else:
                    passed.append({"rule_id": rule.id, "title": rule.title})

            # 2. Flag disclosure check
            elif cat == "flag_disclosure":
                disclose = params.get("disclose_flags", False)
                if not disclose and challenge and challenge.flag and challenge.flag in writeup_content:
                    failed.append({
                        "rule_id": rule.id,
                        "rule_title": rule.title,
                        "issue": f"Raw flag string '{challenge.flag}' detected in writeup. Flag disclosure is prohibited.",
                        "remedy": "Enable flag redaction option in Export Center to automatically mask flag."
                    })
                    restricted_content.append(f"Flag string: {challenge.flag}")
                    recommended_corrections.append("Redact unmasked flag token.")
                else:
                    passed.append({"rule_id": rule.id, "title": rule.title})

            # 3. Screenshot requirement
            elif cat == "screenshot_requirement":
                min_screens = params.get("min_screenshots", 1)
                # Count either evidence items or embedded images in markdown
                embedded_images = len(re.findall(r"!\[.*?\]\(.*?\)", writeup_content))
                effective_screens = max(screenshots, embedded_images)
                if effective_screens < min_screens:
                    missing_info.append({
                        "rule_id": rule.id,
                        "rule_title": rule.title,
                        "issue": f"Found {effective_screens} screenshot(s). Rule mandates at least {min_screens} screenshot(s).",
                        "remedy": "Capture or import terminal/browser proof in the Evidence Vault."
                    })
                    recommended_corrections.append(f"Upload at least {min_screens - effective_screens} additional screenshot(s).")
                else:
                    passed.append({"rule_id": rule.id, "title": rule.title})

            # 4. Attribution check
            elif cat == "attribution_credit":
                if not author or author.strip() in ("", "Anonymous"):
                    missing_info.append({
                        "rule_id": rule.id,
                        "rule_title": rule.title,
                        "issue": "Author attribution is missing or set to Anonymous.",
                        "remedy": "Specify your handle or team name in Writeup Metadata."
                    })
                else:
                    passed.append({"rule_id": rule.id, "title": rule.title})

            # 5. Required formatting & sections
            elif cat == "required_formatting":
                req_sections = params.get("required_sections", ["Overview", "Exploitation", "Flag Retrieval"])
                missing_sec = [s for s in req_sections if s.lower() not in writeup_content.lower()]
                if missing_sec:
                    failed.append({
                        "rule_id": rule.id,
                        "rule_title": rule.title,
                        "issue": f"Required section(s) missing from writeup: {', '.join(missing_sec)}.",
                        "remedy": f"Add heading `## {missing_sec[0]}` to the writeup document."
                    })
                    recommended_corrections.append(f"Include required section: {missing_sec[0]}")
                else:
                    passed.append({"rule_id": rule.id, "title": rule.title})

            # 6. Submission deadline
            elif cat == "submission_deadline":
                if competition and competition.submission_deadline and now > competition.submission_deadline:
                    failed.append({
                        "rule_id": rule.id,
                        "rule_title": rule.title,
                        "issue": f"Submission deadline has passed ({competition.submission_deadline.strftime('%Y-%m-%d %H:%M UTC')}).",
                        "remedy": "Official points will not be awarded; archive for educational research."
                    })
                else:
                    passed.append({"rule_id": rule.id, "title": rule.title})

            # 7. AI content disclosure restriction
            elif cat == "ai_content_restriction":
                require_ai_disc = params.get("require_ai_disclosure", True)
                ai_keywords = ["ai disclosure", "generated with", "ai-assisted", "model:", "synthesized with ctf studio"]
                has_ai_mention = any(k in writeup_content.lower() for k in ai_keywords)
                if require_ai_disc and not has_ai_mention:
                    missing_info.append({
                        "rule_id": rule.id,
                        "rule_title": rule.title,
                        "issue": "AI disclosure notice is missing from the writeup.",
                        "remedy": "Add an 'AI Disclosure' section specifying tools or assistance used."
                    })
                    recommended_corrections.append("Include brief AI Tool Disclosure statement.")
                else:
                    passed.append({"rule_id": rule.id, "title": rule.title})

            # 8. Source code disclosure restrictions
            elif cat == "source_code_disclosure":
                max_lines = params.get("max_code_lines", 80)
                code_blocks = re.findall(r"```(?:\w+)?\n([\s\S]*?)\n```", writeup_content)
                oversized_blocks = [len(cb.splitlines()) for cb in code_blocks if len(cb.splitlines()) > max_lines]
                if oversized_blocks:
                    potential_violations.append({
                        "rule_id": rule.id,
                        "rule_title": rule.title,
                        "issue": f"Code block with {oversized_blocks[0]} lines exceeds the allowed threshold of {max_lines} lines. Full source redistribution is restricted.",
                        "remedy": "Truncate full binary/source dump and only display relevant exploitation snippet."
                    })
                    recommended_corrections.append("Shorten code snippet to satisfy source code disclosure limit.")
                else:
                    passed.append({"rule_id": rule.id, "title": rule.title})

            # 9. Confidentiality & Internal IP address protection
            elif cat == "confidentiality":
                if params.get("protect_internal_ips", True):
                    internal_ip_regex = r"\b(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3})\b"
                    found_ips = re.findall(internal_ip_regex, writeup_content)
                    if found_ips:
                        potential_violations.append({
                            "rule_id": rule.id,
                            "rule_title": rule.title,
                            "issue": f"Internal private network IP address detected ({found_ips[0] if isinstance(found_ips[0], str) else found_ips[0][0]}). Contest rules forbid disclosing internal infrastructure IPs.",
                            "remedy": "Replace internal IP addresses with sanitised placeholders (e.g. 10.10.X.X or TARGET_IP)."
                        })
                        recommended_corrections.append("Sanitize internal private IP addresses.")
                    else:
                        passed.append({"rule_id": rule.id, "title": rule.title})
                else:
                    passed.append({"rule_id": rule.id, "title": rule.title})

            # 10. Prohibited Tools restriction
            elif cat == "tool_restriction":
                prohibited = params.get("prohibited_tools", ["ddos", "slowloris", "masscan", "loic"])
                found_bad_tools = [t for t in prohibited if re.search(rf"\b{re.escape(t)}\b", writeup_content, re.IGNORECASE)]
                if found_bad_tools:
                    failed.append({
                        "rule_id": rule.id,
                        "rule_title": rule.title,
                        "issue": f"Prohibited automated exploitation/DoS tool cited: '{found_bad_tools[0]}'.",
                        "remedy": f"Remove references to prohibited tool '{found_bad_tools[0]}' and use standard precision tooling."
                    })
                    recommended_corrections.append(f"Remove prohibited tool reference: {found_bad_tools[0]}")
                else:
                    passed.append({"rule_id": rule.id, "title": rule.title})

            # 11. Word count / file size limitations
            elif cat == "file_size_limit":
                min_words = params.get("min_words", 0)
                if min_words > 0 and word_count < min_words:
                    missing_info.append({
                        "rule_id": rule.id,
                        "rule_title": rule.title,
                        "issue": f"Writeup contains {word_count} words, which is below the minimum required {min_words} words.",
                        "remedy": f"Expand technical explanations and methodology by at least {min_words - word_count} words."
                    })
                    recommended_corrections.append(f"Expand writeup depth to reach minimum {min_words} words.")
                else:
                    passed.append({"rule_id": rule.id, "title": rule.title})

            # 12. User-Defined Custom Rules (Custom parameters check)
            else:
                custom_failed = False
                
                # Check forbidden words
                forbidden_words = params.get("forbidden_words", [])
                for fw in forbidden_words:
                    if fw.lower() in writeup_content.lower():
                        failed.append({
                            "rule_id": rule.id,
                            "rule_title": rule.title,
                            "issue": f"Forbidden keyword '{fw}' detected in writeup text.",
                            "remedy": f"Remove '{fw}' from the document to satisfy custom competition rule."
                        })
                        custom_failed = True
                        break

                # Check required keywords
                required_words = params.get("required_words", [])
                for rw in required_words:
                    if rw.lower() not in writeup_content.lower():
                        missing_info.append({
                            "rule_id": rule.id,
                            "rule_title": rule.title,
                            "issue": f"Mandatory custom keyword or clause '{rw}' is missing.",
                            "remedy": f"Incorporate '{rw}' in the writeup document."
                        })
                        custom_failed = True
                        break

                # Check custom regex requirement
                req_regex = params.get("custom_regex_require")
                if req_regex and not re.search(req_regex, writeup_content, re.IGNORECASE):
                    missing_info.append({
                        "rule_id": rule.id,
                        "rule_title": rule.title,
                        "issue": f"Content fails required custom regex pattern: `{req_regex}`.",
                        "remedy": "Ensure required pattern format is present in the document."
                    })
                    custom_failed = True

                # Check custom regex ban
                ban_regex = params.get("custom_regex_ban")
                if ban_regex and re.search(ban_regex, writeup_content, re.IGNORECASE):
                    failed.append({
                        "rule_id": rule.id,
                        "rule_title": rule.title,
                        "issue": f"Content violates banned custom regex pattern: `{ban_regex}`.",
                        "remedy": "Remove matching prohibited pattern from the document."
                    })
                    custom_failed = True

                if not custom_failed:
                    passed.append({"rule_id": rule.id, "title": rule.title})

        # Calculate overall compliance status
        if not competition or (not competition.official_rules_url and not competition.rules_summary):
            overall = "Rules Not Verified"
        elif len(failed) > 0:
            overall = "Non-Compliant"
        elif len(potential_violations) > 0 or len(missing_info) > 0:
            overall = "Needs Review"
        else:
            overall = "Compliant"

        result = ComplianceCheckResult(
            id=f"CMP-{datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}",
            competition_id=competition_id,
            challenge_id=challenge_id,
            writeup_id=writeup_id,
            overall_status=overall,
            passed_rules=passed,
            failed_rules=failed,
            potential_violations=potential_violations,
            missing_information=missing_info,
            restricted_content=restricted_content,
            recommended_corrections=recommended_corrections,
            evaluated_at=datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
        )
        db.add(result)
        db.commit()
        db.refresh(result)
        return result
