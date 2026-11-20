export interface Competition {
  id: string;
  name: string;
  platform: string;
  website?: string;
  start_date: string;
  end_date: string;
  submission_deadline: string;
  status: 'active' | 'completed' | 'upcoming' | 'needs_review';
  challenges_count: number;
  completed_writeups_count: number;
  rules_summary?: string;
  official_rules_url?: string;
  regulations: {
    allow_public_writeups_during_contest: boolean;
    disclose_flags: boolean;
    require_screenshots: boolean;
    min_screenshots: number;
    require_ai_disclosure: boolean;
    protect_internal_ips: boolean;
    max_file_size_mb: number;
    submission_format: string;
  };
}

export interface Challenge {
  id: string;
  competition_id: string;
  name: string;
  category: 'Web Exploitation' | 'Binary Exploitation' | 'Cryptography' | 'Reverse Engineering' | 'Digital Forensics' | 'OSINT' | 'Steganography' | 'Miscellaneous' | 'Hardware';
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Insane';
  points: number;
  description: string;
  author: string;
  flag?: string;
  tools_used: string[];
  vulnerabilities: string[];
  solution_status: 'solved' | 'in_progress' | 'unsolved';
  evidence_status: 'verified' | 'collected' | 'pending';
  writeup_status: 'completed' | 'drafting' | 'not_started';
  evidence_count: number;
  last_updated: string;
}

export interface EvidenceItem {
  id: string;
  competition_id: string;
  challenge_id: string;
  category: 'screenshot' | 'terminal_log' | 'http_traffic' | 'burp_export' | 'pcap' | 'source_code' | 'binary' | 'hex_dump' | 'network_scan' | 'exploit_output' | 'payload' | 'flag_proof';
  original_filename: string;
  stored_filename: string;
  file_type: string;
  file_size: number;
  sha256_hash: string;
  source: string;
  solution_step: 'Overview' | 'Reconnaissance' | 'Vulnerability Identification' | 'Exploitation' | 'Flag Retrieval' | 'Key Takeaways';
  user_description: string;
  verification_status: 'verified' | 'unverified' | 'flagged';
  is_annotated: boolean;
  parent_evidence_id?: string;
  collection_timestamp: string;
  preview_content?: string;
}

export interface TerminalCommand {
  id: string;
  session_id: string;
  challenge_id: string;
  command: string;
  stdout: string;
  stderr: string;
  exit_code: number;
  duration_ms: number;
  cwd: string;
  shell: string;
  timestamp: string;
  is_sensitive: boolean;
  is_evidence: boolean;
  user_note?: string;
}

export interface WriteupTemplate {
  id: string;
  name: string;
  platform: string;
  description: string;
  formats: string[];
  required_sections: string[];
  structure_markdown: string;
}

export const INITIAL_COMPETITIONS: Competition[] = [];

export const INITIAL_CHALLENGES: Challenge[] = [];

export const INITIAL_EVIDENCE: EvidenceItem[] = [];

export const INITIAL_TERMINAL_COMMANDS: TerminalCommand[] = [];

export const INITIAL_TEMPLATES: WriteupTemplate[] = [
  {
    id: "TPL-STD",
    name: "Standard CTF Writeup",
    platform: "Universal / CTFtime",
    description: "Clean, direct, practitioner-grade technical walkthrough with Recon, Vulnerability, Exploitation, and Flag sections.",
    formats: ["Markdown", "PDF", "DOCX", "HTML", "ZIP"],
    required_sections: ["Overview", "Reconnaissance", "Vulnerability Identification", "Exploitation", "Flag Retrieval", "Key Takeaways"],
    structure_markdown: `# {{challenge_name}} — CTF Writeup
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
Root cause analysis and defensive remediation recommendations.`
  },
  {
    id: "TPL-HTB",
    name: "HackTheBox Writeup",
    platform: "HackTheBox",
    description: "Structured machine walkthrough format focusing on User Flag initial foothold and Root/System Flag privilege escalation.",
    formats: ["Markdown", "PDF", "HTML"],
    required_sections: ["Overview", "Enumeration", "User Flag", "Root Flag", "Post-Exploitation"],
    structure_markdown: `# HackTheBox — {{challenge_name}}
**OS**: Linux / Windows | **Difficulty**: {{difficulty}}

## Reconnaissance
- Nmap scanning results
- Web fuzzing

## Initial Foothold (User Flag)
Exploitation of service weakness to obtain low-privilege shell.

## Privilege Escalation (Root Flag)
Kernel exploit, SUID binary, or sudo permissions escalation.`
  },
  {
    id: "TPL-PICO",
    name: "picoCTF Educational Walkthrough",
    platform: "picoCTF",
    description: "Pedagogical walkthrough with clear conceptual breakdowns, prerequisite knowledge, and alternative approaches.",
    formats: ["Markdown", "PDF", "HTML"],
    required_sections: ["Problem Statement", "Relevant Concepts", "Step-by-Step Solution", "Flag"],
    structure_markdown: `# picoCTF — {{challenge_name}}

## Problem Statement
{{description}}

## Relevant Concepts
Explanation of underlying cryptography, web, or binary concepts.

## Step-by-Step Solution
Commands used to reach the solution.`
  },
  {
    id: "TPL-RESEARCH",
    name: "Professional Security Research Report",
    platform: "Enterprise / Advisory",
    description: "Publication-ready technical vulnerability advisory with CVSS 3.1 scoring, verifiable PoC, and defensive remediation.",
    formats: ["PDF", "DOCX", "HTML", "ZIP"],
    required_sections: ["Executive Summary", "Vulnerability Details", "Proof of Concept", "Impact Analysis", "Remediation"],
    structure_markdown: `# Security Research Advisory — {{challenge_name}}

## Executive Summary
Formal technical advisory documenting discovery of security weaknesses.

## Technical Details & Attack Surface
Exact protocol, version, and input vectors involved.

## Verifiable Proof of Concept
Reproducible exploit artifact with sha256 checksums.

## Defensive Remediation
Technical code patch or configuration lockdown.`
  },
  {
    id: "TPL-GITHUB",
    name: "GitHub Repository README",
    platform: "GitHub",
    description: "Formatted specifically for GitHub markdown rendering with badge shields, collapsible details, and syntax blocks.",
    formats: ["Markdown"],
    required_sections: ["Overview", "Quick Reproduction", "Exploit Script", "Flag"],
    structure_markdown: `# {{challenge_name}} Writeup
[![Category](https://img.shields.io/badge/category-{{category}}-blue.svg)](#)

## Quick Reproduction
Commands required to execute the exploit.

## Flag
\`\`\`text
{{flag}}
\`\`\``
  }
];
