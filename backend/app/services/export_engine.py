import os
import io
import json
import zipfile
import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session as DBSession

from app.core.config import settings, EXPORTS_DIR, EVIDENCE_DIR
from app.core.security import compute_file_sha256, safe_path
from app.models.challenge import Challenge
from app.models.competition import Competition
from app.models.evidence import Evidence
from app.models.writeup import WriteupDocument
from app.services.evidence_vault import EvidenceVaultService

# ReportLab imports for PDF export
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Preformatted

# python-docx for DOCX export
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

class ExportEngineService:
    @staticmethod
    def export_markdown(writeup: WriteupDocument) -> str:
        """Returns standard markdown writeup."""
        return writeup.content_markdown

    @staticmethod
    def export_html(writeup: WriteupDocument, challenge: Challenge) -> str:
        """Generates modern dark-mode responsive cybersecurity HTML writeup."""
        # Simple HTML renderer that formats headings, code blocks, lists, and quotes
        raw = writeup.content_markdown
        html_body = []
        in_code = False
        code_lang = ""
        code_lines = []
        
        for line in raw.splitlines():
            if line.startswith("```"):
                if in_code:
                    code_block = "\n".join(code_lines)
                    html_body.append(f"<pre class='code-block'><code class='language-{code_lang}'>{code_block}</code></pre>")
                    in_code = False
                    code_lines = []
                else:
                    in_code = True
                    code_lang = line[3:].strip()
                continue
                
            if in_code:
                code_lines.append(line.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))
                continue
                
            if line.startswith("# "):
                html_body.append(f"<h1>{line[2:]}</h1>")
            elif line.startswith("## "):
                html_body.append(f"<h2>{line[3:]}</h2>")
            elif line.startswith("### "):
                html_body.append(f"<h3>{line[4:]}</h3>")
            elif line.startswith("> "):
                html_body.append(f"<blockquote>{line[2:]}</blockquote>")
            elif line.startswith("- "):
                html_body.append(f"<li>{line[2:]}</li>")
            elif line.strip() == "":
                html_body.append("<br/>")
            else:
                html_body.append(f"<p>{line}</p>")
                
        body_content = "\n".join(html_body)
        
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{writeup.title}</title>
    <style>
        :root {{
            --bg-color: #0d1117;
            --card-bg: #161b22;
            --text-color: #c9d1d9;
            --accent-green: #2ea043;
            --accent-cyan: #58a6ff;
            --border-color: #30363d;
            --code-bg: #090d13;
        }}
        body {{
            background-color: var(--bg-color);
            color: var(--text-color);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 40px 20px;
        }}
        .container {{
            max-width: 900px;
            margin: 0 auto;
            background: var(--card-bg);
            padding: 40px;
            border-radius: 8px;
            border: 1px solid var(--border-color);
        }}
        h1 {{
            color: #58a6ff;
            border-bottom: 2px solid var(--border-color);
            padding-bottom: 12px;
        }}
        h2 {{
            color: #3fb950;
            margin-top: 28px;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 6px;
        }}
        h3 {{ color: #79c0ff; }}
        blockquote {{
            border-left: 4px solid var(--accent-green);
            background: rgba(46, 160, 67, 0.1);
            margin: 16px 0;
            padding: 10px 18px;
            border-radius: 0 4px 4px 0;
        }}
        .code-block {{
            background: var(--code-bg);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 16px;
            overflow-x: auto;
            font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
            font-size: 13.5px;
            color: #e6edf3;
        }}
        li {{ margin-left: 20px; margin-bottom: 6px; }}
        .header-meta {{
            display: flex;
            gap: 15px;
            background: #1f242c;
            padding: 12px 18px;
            border-radius: 6px;
            margin-bottom: 25px;
            font-size: 14px;
        }}
        .badge {{
            color: #58a6ff;
            font-weight: 600;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header-meta">
            <span>CTF: <strong class="badge">{challenge.competition_id}</strong></span>
            <span>Category: <strong class="badge">{challenge.category}</strong></span>
            <span>Difficulty: <strong class="badge">{challenge.difficulty}</strong></span>
            <span>Author: <strong class="badge">{writeup.author}</strong></span>
        </div>
        {body_content}
    </div>
</body>
</html>"""

    @staticmethod
    def export_docx(writeup: WriteupDocument, challenge: Challenge, output_path: Path):
        """Generates structured DOCX file using python-docx."""
        doc = docx.Document()
        
        # Title
        p_title = doc.add_paragraph()
        run_title = p_title.add_run(writeup.title)
        run_title.font.size = Pt(22)
        run_title.font.bold = True
        run_title.font.color.rgb = RGBColor(0x1F, 0x49, 0x7D)
        
        # Metadata table
        meta_table = doc.add_table(rows=2, cols=4)
        meta_table.style = 'Light Shading'
        headers = ["Competition", "Category", "Difficulty", "Author"]
        values = [challenge.competition_id, challenge.category, challenge.difficulty, writeup.author]
        for i in range(4):
            meta_table.cell(0, i).paragraphs[0].add_run(headers[i]).bold = True
            meta_table.cell(1, i).paragraphs[0].add_run(values[i])
            
        doc.add_paragraph()
        
        # Content parsing
        in_code = False
        code_lines = []
        for line in writeup.content_markdown.splitlines():
            if line.startswith("```"):
                if in_code:
                    code_para = doc.add_paragraph()
                    code_run = code_para.add_run("\n".join(code_lines))
                    code_run.font.name = "Consolas"
                    code_run.font.size = Pt(9.5)
                    code_para.paragraph_format.left_indent = Inches(0.4)
                    in_code = False
                    code_lines = []
                else:
                    in_code = True
                continue
                
            if in_code:
                code_lines.append(line)
                continue
                
            if line.startswith("# "):
                continue # Already in title
            elif line.startswith("## "):
                h = doc.add_heading(line[3:], level=1)
                h.paragraph_format.space_before = Pt(14)
            elif line.startswith("### "):
                doc.add_heading(line[4:], level=2)
            elif line.startswith("> "):
                p = doc.add_paragraph(line[2:])
                p.paragraph_format.left_indent = Inches(0.3)
                p.runs[0].font.italic = True
            elif line.startswith("- "):
                doc.add_paragraph(line[2:], style='List Bullet')
            elif line.strip():
                doc.add_paragraph(line)
                
        doc.save(output_path)

    @staticmethod
    def export_pdf(writeup: WriteupDocument, challenge: Challenge, output_path: Path):
        """Generates styled PDF file using ReportLab."""
        doc = SimpleDocTemplate(
            str(output_path),
            pagesize=letter,
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=40
        )
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CTFTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=20,
            leading=24,
            textColor=colors.HexColor('#0d47a1')
        )
        h2_style = ParagraphStyle(
            'CTFH2',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=14,
            leading=18,
            textColor=colors.HexColor('#1b5e20'),
            spaceBefore=14,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'CTFBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            spaceAfter=6
        )
        quote_style = ParagraphStyle(
            'CTFQuote',
            parent=styles['Italic'],
            fontName='Helvetica-Oblique',
            fontSize=9.5,
            leading=13,
            textColor=colors.HexColor('#37474f'),
            leftIndent=15,
            spaceAfter=6
        )
        code_style = ParagraphStyle(
            'CTFCode',
            fontName='Courier',
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor('#212121')
        )
        
        story = []
        story.append(Paragraph(writeup.title, title_style))
        story.append(Spacer(1, 10))
        
        meta_text = f"<b>Competition:</b> {challenge.competition_id} | <b>Category:</b> {challenge.category} | <b>Difficulty:</b> {challenge.difficulty} | <b>Author:</b> {writeup.author}"
        story.append(Paragraph(meta_text, body_style))
        story.append(Spacer(1, 12))
        
        in_code = False
        code_lines = []
        
        for line in writeup.content_markdown.splitlines():
            if line.startswith("```"):
                if in_code:
                    code_block = "\n".join(code_lines)
                    p_code = Preformatted(code_block, code_style)
                    code_table = Table([[p_code]], colWidths=[520])
                    code_table.setStyle(TableStyle([
                        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f5f5f5')),
                        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#e0e0e0')),
                        ('TOPPADDING', (0,0), (-1,-1), 6),
                        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                        ('LEFTPADDING', (0,0), (-1,-1), 8),
                        ('RIGHTPADDING', (0,0), (-1,-1), 8),
                    ]))
                    story.append(code_table)
                    story.append(Spacer(1, 8))
                    in_code = False
                    code_lines = []
                else:
                    in_code = True
                continue
                
            if in_code:
                code_lines.append(line)
                continue
                
            if line.startswith("# "):
                continue
            elif line.startswith("## "):
                story.append(Paragraph(line[3:], h2_style))
            elif line.startswith("> "):
                story.append(Paragraph(line[2:], quote_style))
            elif line.startswith("- "):
                story.append(Paragraph(f"&bull; {line[2:]}", body_style))
            elif line.strip():
                clean_line = line.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                story.append(Paragraph(clean_line, body_style))
                
        doc.build(story)

    @staticmethod
    def generate_full_export_package(
        db: DBSession,
        challenge_id: str,
        export_formats: List[str] = ["md", "pdf", "docx", "html", "zip"],
        redact_flag: bool = False
    ) -> Dict[str, Any]:
        """
        Creates complete forensic evidence package and multi-format files in structured ZIP archive:
        CTF_Writeup/
        ├── README.md
        ├── writeup.pdf
        ├── writeup.docx
        ├── writeup.html
        ├── evidence/
        │   ├── screenshots/
        │   ├── terminal_logs/
        │   ├── network_captures/
        │   ├── source_code/
        │   └── other_artifacts/
        ├── manifest/
        │   └── evidence_manifest.json
        └── metadata/
            └── competition_metadata.json
        """
        challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
        competition = db.query(Competition).filter(Competition.id == challenge.competition_id).first()
        writeup = db.query(WriteupDocument).filter(WriteupDocument.challenge_id == challenge_id).first()
        
        if not writeup:
            raise ValueError("No writeup exists yet for this challenge.")
            
        timestamp_str = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        export_bundle_name = f"CTF_Writeup_{challenge.id}_{timestamp_str}"
        bundle_dir = safe_path(EXPORTS_DIR, export_bundle_name)
        bundle_dir.mkdir(parents=True, exist_ok=True)
        
        # Subdirectories
        evidence_dir = bundle_dir / "evidence"
        screenshots_dir = evidence_dir / "screenshots"
        terminal_dir = evidence_dir / "terminal_logs"
        network_dir = evidence_dir / "network_captures"
        source_dir = evidence_dir / "source_code"
        other_dir = evidence_dir / "other_artifacts"
        manifest_dir = bundle_dir / "manifest"
        metadata_dir = bundle_dir / "metadata"
        
        for d in [screenshots_dir, terminal_dir, network_dir, source_dir, other_dir, manifest_dir, metadata_dir]:
            d.mkdir(parents=True, exist_ok=True)
            
        # 1. README.md / Markdown
        md_file = bundle_dir / "README.md"
        with open(md_file, "w", encoding="utf-8") as f:
            f.write(writeup.content_markdown)
            
        # 2. HTML
        html_file = bundle_dir / "writeup.html"
        with open(html_file, "w", encoding="utf-8") as f:
            f.write(ExportEngineService.export_html(writeup, challenge))
            
        # 3. DOCX
        docx_file = bundle_dir / "writeup.docx"
        ExportEngineService.export_docx(writeup, challenge, docx_file)
        
        # 4. PDF
        pdf_file = bundle_dir / "writeup.pdf"
        ExportEngineService.export_pdf(writeup, challenge, pdf_file)
        
        # 5. Populate Evidence files into category folders
        evidence_items = db.query(Evidence).filter(Evidence.challenge_id == challenge_id).all()
        for ev in evidence_items:
            src_file = safe_path(EVIDENCE_DIR, ev.stored_filename)
            if src_file.exists():
                cat = ev.category.lower()
                if "screenshot" in cat:
                    dest = screenshots_dir / ev.original_filename
                elif "terminal" in cat:
                    dest = terminal_dir / ev.original_filename
                elif "pcap" in cat or "network" in cat:
                    dest = network_dir / ev.original_filename
                elif "source" in cat or "binary" in cat:
                    dest = source_dir / ev.original_filename
                else:
                    dest = other_dir / ev.original_filename
                with open(src_file, "rb") as rf, open(dest, "wb") as wf:
                    wf.write(rf.read())
                    
        # 6. Manifest
        manifest_data = EvidenceVaultService.generate_manifest(db, challenge_id)
        with open(manifest_dir / "evidence_manifest.json", "w", encoding="utf-8") as f:
            json.dump(manifest_data, f, indent=2)
            
        # 7. Metadata
        meta_data = {
            "competition": {
                "id": competition.id if competition else "COMP-UNKNOWN",
                "name": competition.name if competition else "Independent CTF",
                "website": competition.website if competition else "",
                "submission_deadline": competition.submission_deadline.isoformat() if competition and competition.submission_deadline else None
            },
            "challenge": {
                "id": challenge.id,
                "name": challenge.name,
                "category": challenge.category,
                "difficulty": challenge.difficulty,
                "points": challenge.points,
                "vulnerabilities": challenge.vulnerabilities,
                "tools_used": challenge.tools_used
            },
            "export_info": {
                "exported_at": datetime.datetime.utcnow().isoformat(),
                "author": writeup.author,
                "compliance_status": writeup.compliance_status,
                "qa_score": writeup.qa_score
            }
        }
        with open(metadata_dir / "competition_metadata.json", "w", encoding="utf-8") as f:
            json.dump(meta_data, f, indent=2)
            
        # 8. Compress into ZIP package
        zip_path = EXPORTS_DIR / f"{export_bundle_name}.zip"
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            for root, _, files in os.walk(bundle_dir):
                for file in files:
                    file_p = Path(root) / file
                    rel_p = Path("CTF_Writeup") / file_p.relative_to(bundle_dir)
                    zipf.write(file_p, rel_p)
                    
        return {
            "bundle_name": export_bundle_name,
            "zip_filename": zip_path.name,
            "zip_size_bytes": os.path.getsize(zip_path),
            "formats_included": ["md", "html", "docx", "pdf", "zip"],
            "evidence_count": len(evidence_items)
        }
