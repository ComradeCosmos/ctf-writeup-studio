import React, { useState } from 'react';
import { 
  BookTemplate, 
  FileText, 
  Copy, 
  Check, 
  ExternalLink, 
  Plus, 
  Eye, 
  ShieldCheck, 
  Terminal, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';

interface TemplatesPageProps {
  onSelectTemplate?: (templateMd: string) => void;
  onNavigateToEditor?: () => void;
}

export const TemplatesPage: React.FC<TemplatesPageProps> = ({ 
  onSelectTemplate,
  onNavigateToEditor 
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const templates = [
    {
      id: 'tmpl-standard-ctf',
      title: 'Standard CTF Competition Writeup',
      category: 'Competition',
      difficulty: 'All Levels',
      sections: ['Target Metadata', 'Initial Recon & Port Scan', 'Vulnerability Discovery', 'Exploit Payload & Delivery', 'Flag Proof & Verification', 'Remediation'],
      description: 'Industry standard competition format. Clean, concise, and focused on rapid flag verification and tool reproducibility.',
      markdown: `# [CTF_NAME] — [CHALLENGE_NAME] Writeup

## Target Information
- **Category**: Web Exploitation / Pwn
- **Points**: 500
- **Difficulty**: Medium
- **Author**: 0xHacker

## 1. Vulnerability Summary
Brief 2-3 sentence overview of the vulnerability, affected components, and root cause.

## 2. Reconnaissance & Enumeration
\`\`\`bash
# Nmap port scan
$ nmap -sC -sV -p- <TARGET_IP>
\`\`\`
[Evidence #EVD-001]

## 3. Vulnerability Analysis
Detailed code analysis or decompiled binary walkthrough identifying the exact flaw.

## 4. Exploitation Methodology
\`\`\`python
# Exploit script snippet
import requests
# Payload execution
\`\`\`

## 5. Flag Retrieval
\`\`\`bash
$ cat /flag.txt
CTF{sample_flag_verified}
\`\`\`
[Evidence #FLAG-PROOF]

## 6. Remediation & Patching
How the maintainers can fix the underlying security vulnerability.
`
    },
    {
      id: 'tmpl-htb-walkthrough',
      title: 'HackTheBox Machine Walkthrough',
      category: 'Platform',
      difficulty: 'Hard',
      sections: ['Machine Telemetry', 'User Pawn', 'Privilege Escalation', 'Post-Exploitation', 'MITRE ATT&CK Matrix'],
      description: 'Comprehensive enterprise penetration testing report style. Tracks initial access through root privilege escalation.',
      markdown: `# HackTheBox — [MACHINE_NAME] Walkthrough

## Machine Telemetry
- **OS**: Linux / Windows
- **IP Address**: 10.10.11.XX
- **Difficulty**: Hard
- **Foothold**: Unauthenticated RCE via CVE-2026-XXXX
- **Privesc**: SUID Binary Misconfiguration / Token Impersonation

## Stage 1: Port Scanning & Initial Foothold
\`\`\`bash
$ nmap -sC -sV 10.10.11.XX
\`\`\`

## Stage 2: Foothold Exploitation
\`\`\`bash
$ python3 exploit.py --target 10.10.11.XX --lhost 10.10.14.X --lport 4444
\`\`\`

## Stage 3: Privilege Escalation to Root
\`\`\`bash
# Finding SUID binaries
$ find / -perm -4000 2>/dev/null
\`\`\`

## Flags Captured
- User: \`user{hash}\`
- Root: \`root{hash}\`
`
    },
    {
      id: 'tmpl-cve-advisory',
      title: 'GitHub Security Advisory & CVE Disclosure',
      category: 'Research',
      difficulty: 'Expert',
      sections: ['Advisory Header', 'Vulnerability Details', 'Proof of Concept', 'Affected Versions', 'CVSS v3.1 Metrics', 'Timeline'],
      description: 'Formal responsible disclosure format conforming to MITRE CVE and GitHub Security Advisory specifications.',
      markdown: `# Security Advisory: Remote Code Execution in [Component]

## Summary
A critical vulnerability in [Component] allows remote unauthenticated attackers to execute arbitrary system commands.

## CVSS v3.1 Severity
- **Score**: 9.8 (Critical)
- **Vector**: CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H

## Technical Breakdown & Root Cause
Detailed examination of the input validation failure in \`handlers/auth.go\`.

## Proof of Concept (PoC)
\`\`\`bash
curl -X POST https://target/api/v1/debug -d 'cmd=id'
\`\`\`

## Disclosure Timeline
- 2026-10-01: Vulnerability discovered during security audit.
- 2026-10-05: Responsible disclosure sent to vendor.
- 2026-10-18: Patch verified and advisory published.
`
    },
    {
      id: 'tmpl-picoctf-educational',
      title: 'picoCTF Educational Beginner Guide',
      category: 'Educational',
      difficulty: 'Beginner',
      sections: ['Prerequisites', 'Concepts Taught', 'Step-by-Step Solution', 'Tools Used', 'Key Takeaways'],
      description: 'Educational writeup emphasizing foundational cybersecurity concepts, tool explanations, and learning principles.',
      markdown: `# picoCTF — [CHALLENGE_NAME] Walkthrough

## What You Will Learn
- What is HTTP Header Injection?
- How to inspect web cookies using browser DevTools.
- Python requests fundamentals.

## Step 1: Inspecting the Challenge
Open your terminal or web browser and navigate to the challenge instance.

## Step 2: Understanding the Vulnerability
Explain in simple terms why the target is vulnerable.

## Step 3: Getting the Flag
\`\`\`bash
$ curl -s http://jupiter.challenges.picoctf.org:12345/
\`\`\`
`
    },
    {
      id: 'tmpl-pentest-executive',
      title: 'Professional Pentest Finding & Executive Summary',
      category: 'Professional',
      difficulty: 'Professional',
      sections: ['Executive Summary', 'Risk Rating', 'Technical Evidence', 'Business Impact', 'Strategic Remediation'],
      description: 'Corporate red-team assessment format. Features executive business risk ratings alongside technical proof.',
      markdown: `# Penetration Testing Finding: [FINDING_NAME]

## Executive Summary
During the penetration test conducted on [DATE], assessors identified a high-risk security issue in the authentication subsystem.

## Risk Assessment
- **Likelihood**: High
- **Impact**: Critical
- **Overall Rating**: High Risk

## Technical Description & Artifacts
[Evidence #EVD-001]
`
    }
  ];

  const handleCopy = (md: string, id: string) => {
    navigator.clipboard.writeText(md);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleUseTemplate = (md: string) => {
    if (onSelectTemplate) {
      onSelectTemplate(md);
    }
    if (onNavigateToEditor) {
      onNavigateToEditor();
    }
  };

  const filtered = templates.filter(t => {
    if (selectedCategory === 'all') return true;
    return t.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyber-primary/10 border border-cyber-primary/20 text-cyber-primary">
              <BookTemplate className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-cyber-text font-mono flex items-center gap-2">
                Writeup Templates Library
              </h1>
              <p className="text-xs text-cyber-muted mt-0.5">
                Curated documentation skeletons for CTFs, penetration test reports, CVE advisories, and educational guides.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          {['all', 'Competition', 'Platform', 'Research', 'Educational', 'Professional'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg border transition ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-cyber-surface border-cyber-primary/40 text-cyber-primary font-semibold'
                  : 'bg-cyber-card border-cyber-border text-cyber-muted hover:text-white'
              }`}
            >
              {cat === 'all' ? 'All Templates' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((tmpl) => (
          <div
            key={tmpl.id}
            className="bg-cyber-card border border-cyber-border hover:border-cyber-primary/40 rounded-xl p-5 transition flex flex-col justify-between hover:shadow-lg group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold text-cyber-secondary px-2 py-0.5 rounded bg-cyber-bg border border-cyber-border">
                  {tmpl.category}
                </span>
                <span className="text-[10px] font-mono text-zinc-400 bg-cyber-surface px-2 py-0.5 rounded border border-cyber-border">
                  {tmpl.difficulty}
                </span>
              </div>

              <h3 className="text-sm font-bold font-mono text-cyber-text group-hover:text-cyber-primary transition mb-2">
                {tmpl.title}
              </h3>

              <p className="text-xs text-cyber-muted leading-relaxed mb-4">
                {tmpl.description}
              </p>

              <div className="space-y-1 mb-4">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Sections Included:</span>
                <div className="flex flex-wrap gap-1">
                  {tmpl.sections.map((sec, idx) => (
                    <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-bg border border-cyber-border text-zinc-300">
                      {sec}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-cyber-border flex items-center justify-between text-xs font-mono">
              <button
                onClick={() => setPreviewTemplate(tmpl)}
                className="px-2.5 py-1.5 rounded hover:bg-cyber-surface text-cyber-muted hover:text-white flex items-center gap-1 transition"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(tmpl.markdown, tmpl.id)}
                  className="p-1.5 rounded hover:bg-cyber-surface text-cyber-muted hover:text-white transition"
                  title="Copy Markdown"
                >
                  {copiedId === tmpl.id ? <Check className="w-3.5 h-3.5 text-cyber-primary" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => handleUseTemplate(tmpl.markdown)}
                  className="px-3 py-1.5 rounded bg-cyber-primary text-black font-semibold text-xs flex items-center gap-1 hover:bg-cyber-primary/90 transition shadow-sm"
                >
                  <span>Use Template</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-2xl bg-cyber-card border border-cyber-border rounded-xl shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-cyber-border">
              <div>
                <h3 className="text-sm font-bold text-cyber-text font-mono flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyber-primary" />
                  {previewTemplate.title}
                </h3>
                <span className="text-[11px] font-mono text-cyber-muted">{previewTemplate.category} &bull; {previewTemplate.difficulty}</span>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-xs font-mono text-cyber-muted hover:text-white"
              >
                Close (Esc)
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-cyber-bg rounded-lg border border-cyber-border text-xs font-mono text-emerald-400 whitespace-pre-wrap">
              {previewTemplate.markdown}
            </div>

            <div className="pt-3 border-t border-cyber-border flex items-center justify-between text-xs font-mono">
              <button
                onClick={() => handleCopy(previewTemplate.markdown, previewTemplate.id)}
                className="px-3 py-1.5 rounded bg-cyber-surface border border-cyber-border text-zinc-200 hover:text-white flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Skeleton Markdown
              </button>

              <button
                onClick={() => {
                  handleUseTemplate(previewTemplate.markdown);
                  setPreviewTemplate(null);
                }}
                className="px-4 py-1.5 rounded bg-cyber-primary text-black font-semibold flex items-center gap-1.5 hover:bg-cyber-primary/90 shadow-sm"
              >
                Load Into Writeup Editor
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
