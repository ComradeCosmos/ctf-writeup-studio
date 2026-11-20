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

export const INITIAL_COMPETITIONS: Competition[] = [
  {
    id: "COMP-DEFCAMP26",
    name: "DefCamp World CTF 2026",
    platform: "CTFd Enterprise",
    website: "https://def.camp/ctf",
    start_date: "2026-11-15T09:00:00Z",
    end_date: "2026-11-20T18:00:00Z",
    submission_deadline: "2026-11-22T23:59:00Z",
    status: "active",
    challenges_count: 14,
    completed_writeups_count: 6,
    rules_summary: "Writeups embargoed until final freeze. Flags must be redacted. Mandatory screenshot proof for remote shell access.",
    official_rules_url: "https://def.camp/rules-2026",
    regulations: {
      allow_public_writeups_during_contest: false,
      disclose_flags: false,
      require_screenshots: true,
      min_screenshots: 2,
      require_ai_disclosure: true,
      protect_internal_ips: true,
      max_file_size_mb: 50,
      submission_format: "ZIP / PDF"
    }
  },
  {
    id: "COMP-HTB-CYBER",
    name: "HackTheBox Cyber Apocalypse 2026",
    platform: "HackTheBox CTF",
    website: "https://ctf.hackthebox.com",
    start_date: "2026-12-05T12:00:00Z",
    end_date: "2026-12-10T12:00:00Z",
    submission_deadline: "2026-12-12T18:00:00Z",
    status: "upcoming",
    challenges_count: 60,
    completed_writeups_count: 0,
    rules_summary: "Official writeup competition. Solvers must document methodology and mitigation recommendations.",
    official_rules_url: "https://ctf.hackthebox.com/rules",
    regulations: {
      allow_public_writeups_during_contest: false,
      disclose_flags: true,
      require_screenshots: true,
      min_screenshots: 1,
      require_ai_disclosure: true,
      protect_internal_ips: false,
      max_file_size_mb: 100,
      submission_format: "Markdown / PDF"
    }
  },
  {
    id: "COMP-PICO26",
    name: "picoCTF Spring Invitational 2026",
    platform: "Carnegie Mellon University",
    website: "https://picoctf.org",
    start_date: "2026-10-10T00:00:00Z",
    end_date: "2026-10-24T23:59:00Z",
    submission_deadline: "2026-10-25T12:00:00Z",
    status: "completed",
    challenges_count: 35,
    completed_writeups_count: 35,
    rules_summary: "Educational focus. Beginner-friendly concepts and step-by-step reproduction required for community points.",
    official_rules_url: "https://picoctf.org/guidelines",
    regulations: {
      allow_public_writeups_during_contest: false,
      disclose_flags: true,
      require_screenshots: false,
      min_screenshots: 0,
      require_ai_disclosure: false,
      protect_internal_ips: false,
      max_file_size_mb: 25,
      submission_format: "Markdown"
    }
  }
];

export const INITIAL_CHALLENGES: Challenge[] = [
  {
    id: "CHAL-WEB-001",
    competition_id: "COMP-DEFCAMP26",
    name: "Quantum Infiltrator",
    category: "Web Exploitation",
    difficulty: "Medium",
    points: 350,
    description: "A telemetry monitoring portal runs on port 5000. Find the hidden administrator interface, bypass authentication tokens, and extract the system flag.",
    author: "Spectre",
    flag: "flag{sql1_2_auth_byp4ss_0921}",
    tools_used: ["nmap", "gobuster", "sqlmap", "curl", "burp"],
    vulnerabilities: ["SQL Injection", "Authentication Bypass"],
    solution_status: "solved",
    evidence_status: "verified",
    writeup_status: "completed",
    evidence_count: 4,
    last_updated: "2026-11-17 19:42"
  },
  {
    id: "CHAL-PWN-002",
    competition_id: "COMP-DEFCAMP26",
    name: "Binary Pulse",
    category: "Binary Exploitation",
    difficulty: "Hard",
    points: 450,
    description: "A vulnerable 64-bit ELF binary listening on netcat port 9001. Defeat ASLR and stack canaries using a precise Return-Oriented Programming (ROP) chain to spawn /bin/sh.",
    author: "Ret2Libc",
    flag: "flag{r0p_ch41n_b1nsh_succ3ss_882}",
    tools_used: ["checksec", "gdb-gef", "pwntools", "ROPgadget"],
    vulnerabilities: ["Stack Buffer Overflow", "Return-Oriented Programming"],
    solution_status: "solved",
    evidence_status: "verified",
    writeup_status: "drafting",
    evidence_count: 3,
    last_updated: "2026-11-17 18:15"
  },
  {
    id: "CHAL-CRYPTO-003",
    competition_id: "COMP-DEFCAMP26",
    name: "Elliptic Shadows",
    category: "Cryptography",
    difficulty: "Hard",
    points: 400,
    description: "Custom ECDSA implementation with a faulty pseudorandom nonce generator. Exploit repeated nonces using lattice reduction to recover the private key.",
    author: "Galois",
    flag: "flag{ecdsa_n0nc3_r3us3_k3y_r3c0v3r}",
    tools_used: ["SageMath", "python3", "sympy"],
    vulnerabilities: ["Biased Nonce ECDSA", "Lattice Reduction"],
    solution_status: "in_progress",
    evidence_status: "collected",
    writeup_status: "drafting",
    evidence_count: 2,
    last_updated: "2026-11-17 16:30"
  },
  {
    id: "CHAL-REV-004",
    competition_id: "COMP-DEFCAMP26",
    name: "Vortex Kernel Bytecode",
    category: "Reverse Engineering",
    difficulty: "Insane",
    points: 500,
    description: "Heavily obfuscated virtualized bytecode interpreter written in Rust. Deobfuscate the VM dispatch loop to extract the decryption keystream.",
    author: "0xBytecode",
    flag: "",
    tools_used: ["Ghidra", "IDA Pro", "angr", "x64dbg"],
    vulnerabilities: ["Virtual Machine Obfuscation"],
    solution_status: "in_progress",
    evidence_status: "collected",
    writeup_status: "not_started",
    evidence_count: 2,
    last_updated: "2026-11-17 14:10"
  },
  {
    id: "CHAL-FOR-005",
    competition_id: "COMP-DEFCAMP26",
    name: "Memory Leakage Incident",
    category: "Digital Forensics",
    difficulty: "Medium",
    points: 300,
    description: "A captured memory dump (raw DD format) from a compromised domain controller. Identify the LSASS injection artifact and recover the dumped NTLM hashes.",
    author: "TriageLead",
    flag: "flag{lsass_m1m1k4tz_ntlm_h4sh_dumpe0}",
    tools_used: ["Volatility 3", "Rekall", "strings", "hashcat"],
    vulnerabilities: ["Process Memory Injection", "Credential Harvesting"],
    solution_status: "solved",
    evidence_status: "verified",
    writeup_status: "completed",
    evidence_count: 3,
    last_updated: "2026-11-16 22:50"
  },
  {
    id: "CHAL-OSINT-006",
    competition_id: "COMP-DEFCAMP26",
    name: "Operation Nightfall",
    category: "OSINT",
    difficulty: "Easy",
    points: 150,
    description: "A compromised rogue developer leaked a cryptographic signing key inside a forgotten git commit history. Locate the deleted commit and reconstruct the commit author's alias.",
    author: "ReconMaster",
    flag: "flag{git_r3fl0g_l34k3d_c0mm1t_f0und}",
    tools_used: ["git", "trufflehog", "Wayback Machine", "Sherlock"],
    vulnerabilities: ["Repository Secret Leakage"],
    solution_status: "solved",
    evidence_status: "verified",
    writeup_status: "completed",
    evidence_count: 2,
    last_updated: "2026-11-16 19:20"
  },
  {
    id: "CHAL-STEGO-007",
    competition_id: "COMP-DEFCAMP26",
    name: "Polyglot Spectrum",
    category: "Steganography",
    difficulty: "Medium",
    points: 250,
    description: "A dual-header PNG that functions as both an uncompressed audio WAV and an encrypted ZIP archive. Demux the LSB audio channels.",
    author: "AudioHertz",
    flag: "",
    tools_used: ["zsteg", "sonic-visualiser", "binwalk", "exiftool"],
    vulnerabilities: ["LSB Audio Embedding", "Polyglot File Structure"],
    solution_status: "unsolved",
    evidence_status: "pending",
    writeup_status: "not_started",
    evidence_count: 1,
    last_updated: "2026-11-16 15:00"
  },
  {
    id: "CHAL-HARD-008",
    competition_id: "COMP-DEFCAMP26",
    name: "UART Glitch Matrix",
    category: "Hardware",
    difficulty: "Hard",
    points: 400,
    description: "Logic analyzer trace of an SPI flash chip booting a secure microcontroller. Reconstruct the firmware address bus and locate the decrypted bootloader stage.",
    author: "SiliconFault",
    flag: "",
    tools_used: ["PulseView", "sigrok", "Saleae Logic"],
    vulnerabilities: ["Unencrypted SPI Flash Bus", "Voltage Glitching"],
    solution_status: "unsolved",
    evidence_status: "pending",
    writeup_status: "not_started",
    evidence_count: 0,
    last_updated: "2026-11-15 11:30"
  }
];

export const INITIAL_EVIDENCE: EvidenceItem[] = [
  {
    id: "SCR-9A21",
    competition_id: "COMP-DEFCAMP26",
    challenge_id: "CHAL-WEB-001",
    category: "screenshot",
    original_filename: "telemetry_portal_login.png",
    stored_filename: "SCR-9A21_202611171800.png",
    file_type: "image/png",
    file_size: 148200,
    sha256_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    source: "terminal_agent",
    solution_step: "Reconnaissance",
    user_description: "Initial reconnaissance screenshot of web login portal on port 5000",
    verification_status: "verified",
    is_annotated: false,
    collection_timestamp: "2026-11-17T18:00:12Z"
  },
  {
    id: "SCAN-4F11",
    competition_id: "COMP-DEFCAMP26",
    challenge_id: "CHAL-WEB-001",
    category: "network_scan",
    original_filename: "nmap_full_service_scan.txt",
    stored_filename: "SCAN-4F11_202611171805.txt",
    file_type: "text/plain",
    file_size: 3420,
    sha256_hash: "a4f2c9817be082ea57143924f9c3fcf932de0714b184918e9a28cf1b982ef331",
    source: "local_agent",
    solution_step: "Reconnaissance",
    user_description: "Full TCP port scan showing exposed Nginx 1.18.0 and Werkzeug 3.0.1 Python service",
    verification_status: "verified",
    is_annotated: false,
    collection_timestamp: "2026-11-17T18:05:40Z",
    preview_content: "PORT     STATE SERVICE VERSION\n80/tcp   open  http    nginx 1.18.0\n5000/tcp open  http    Werkzeug 3.0.1 (Python 3.11.4)"
  },
  {
    id: "HTTP-812C",
    competition_id: "COMP-DEFCAMP26",
    challenge_id: "CHAL-WEB-001",
    category: "http_traffic",
    original_filename: "auth_sqli_bypass.http",
    stored_filename: "HTTP-812C_202611171822.http",
    file_type: "text/plain",
    file_size: 1120,
    sha256_hash: "93f81e9bc923a10e829374029410928374928174092187391827391827391827",
    source: "burp_export",
    solution_step: "Vulnerability Identification",
    user_description: "HTTP POST request with ' OR '1'='1 SQL injection confirming authentication bypass",
    verification_status: "verified",
    is_annotated: false,
    collection_timestamp: "2026-11-17T18:22:15Z",
    preview_content: "POST /login HTTP/1.1\nHost: 10.10.11.23:5000\nContent-Type: application/x-www-form-urlencoded\n\nuser=admin' OR '1'='1&pass=foo"
  },
  {
    id: "FLAG-001A",
    competition_id: "COMP-DEFCAMP26",
    challenge_id: "CHAL-WEB-001",
    category: "flag_proof",
    original_filename: "flag_capture_stdout.txt",
    stored_filename: "FLAG-001A_202611171830.txt",
    file_type: "text/plain",
    file_size: 450,
    sha256_hash: "bc82710398471203984712903847120938471209384710923874102938471029",
    source: "local_agent",
    solution_step: "Flag Retrieval",
    user_description: "Verified flag string response from authenticated administrator telemetry route",
    verification_status: "verified",
    is_annotated: false,
    collection_timestamp: "2026-11-17T18:30:00Z",
    preview_content: "{\"status\": \"success\", \"flag\": \"flag{sql1_2_auth_byp4ss_0921}\"}"
  },
  {
    id: "BIN-9921",
    competition_id: "COMP-DEFCAMP26",
    challenge_id: "CHAL-PWN-002",
    category: "binary",
    original_filename: "pulse_server_elf64",
    stored_filename: "BIN-9921_202611171640.bin",
    file_type: "application/x-executable",
    file_size: 18490,
    sha256_hash: "4729183749102938471029384710293847102938471029384710293847102938",
    source: "manual_upload",
    solution_step: "Overview",
    user_description: "Target 64-bit ELF executable compiled with NX enabled, no stack canary",
    verification_status: "verified",
    is_annotated: false,
    collection_timestamp: "2026-11-17T16:40:10Z"
  },
  {
    id: "HEX-3310",
    competition_id: "COMP-DEFCAMP26",
    challenge_id: "CHAL-PWN-002",
    category: "hex_dump",
    original_filename: "stack_buffer_offset.hex",
    stored_filename: "HEX-3310_202611171705.hex",
    file_type: "text/plain",
    file_size: 2190,
    sha256_hash: "7481920394810293847102938471029384710293847102938471029384710293",
    source: "terminal_agent",
    solution_step: "Vulnerability Identification",
    user_description: "GDB cyclic pattern inspection revealing RIP control at offset 72 bytes",
    verification_status: "verified",
    is_annotated: false,
    collection_timestamp: "2026-11-17T17:05:22Z",
    preview_content: "0x00007fffffffde30: 0x6161616161616161 0x6161616161616162\n0x00007fffffffde40: 0x6161616161616163 0x6161616161616164\n$rip = 0x616161616161616a (Offset 72)"
  },
  {
    id: "EXP-1044",
    competition_id: "COMP-DEFCAMP26",
    challenge_id: "CHAL-PWN-002",
    category: "exploit_output",
    original_filename: "rop_payload_driver.py",
    stored_filename: "EXP-1044_202611171745.py",
    file_type: "text/x-python",
    file_size: 1480,
    sha256_hash: "9182739182739182739182739182739182739182739182739182739182739182",
    source: "local_agent",
    solution_step: "Exploitation",
    user_description: "Pwntools ROP chain script executing ret2libc against target libc 2.35",
    verification_status: "verified",
    is_annotated: false,
    collection_timestamp: "2026-11-17T17:45:00Z"
  },
  {
    id: "SRC-5511",
    competition_id: "COMP-DEFCAMP26",
    challenge_id: "CHAL-CRYPTO-003",
    category: "source_code",
    original_filename: "ecdsa_prng_vuln.py",
    stored_filename: "SRC-5511_202611171610.py",
    file_type: "text/x-python",
    file_size: 2850,
    sha256_hash: "2837491827391827391827391827391827391827391827391827391827391827",
    source: "manual_upload",
    solution_step: "Vulnerability Identification",
    user_description: "Vulnerable nonce generator using biased 16-bit linear congruential generator",
    verification_status: "verified",
    is_annotated: false,
    collection_timestamp: "2026-11-17T16:10:45Z"
  },
  {
    id: "PCAP-1200",
    competition_id: "COMP-DEFCAMP26",
    challenge_id: "CHAL-FOR-005",
    category: "pcap",
    original_filename: "incident_domain_c2.pcap",
    stored_filename: "PCAP-1200_202611162130.pcap",
    file_type: "application/vnd.tcpdump.pcap",
    file_size: 842000,
    sha256_hash: "8273918273918273918273918273918273918273918273918273918273918273",
    source: "manual_upload",
    solution_step: "Reconnaissance",
    user_description: "Network capture of Cobalt Strike malleable C2 DNS tunnel",
    verification_status: "verified",
    is_annotated: false,
    collection_timestamp: "2026-11-16T21:30:00Z"
  },
  {
    id: "TRM-7701",
    competition_id: "COMP-DEFCAMP26",
    challenge_id: "CHAL-FOR-005",
    category: "terminal_log",
    original_filename: "volatility_pslist_output.txt",
    stored_filename: "TRM-7701_202611162210.txt",
    file_type: "text/plain",
    file_size: 4200,
    sha256_hash: "1928374918273918273918273918273918273918273918273918273918273918",
    source: "local_agent",
    solution_step: "Vulnerability Identification",
    user_description: "Volatility 3 windows.pslist command exposing anomalous PID 3812 injected into lsass.exe",
    verification_status: "verified",
    is_annotated: false,
    collection_timestamp: "2026-11-16T22:10:15Z"
  },
  {
    id: "PLD-8820",
    competition_id: "COMP-DEFCAMP26",
    challenge_id: "CHAL-OSINT-006",
    category: "payload",
    original_filename: "git_reflog_inspect.sh",
    stored_filename: "PLD-8820_202611161905.sh",
    file_type: "text/x-shellscript",
    file_size: 340,
    sha256_hash: "3847192837491827391827391827391827391827391827391827391827391827",
    source: "local_agent",
    solution_step: "Exploitation",
    user_description: "Bash one-liner iterating through dangling git commits in reflog",
    verification_status: "verified",
    is_annotated: false,
    collection_timestamp: "2026-11-16T19:05:00Z"
  },
  {
    id: "BURP-9011",
    competition_id: "COMP-DEFCAMP26",
    challenge_id: "CHAL-WEB-001",
    category: "burp_export",
    original_filename: "repeater_telemetry_admin.xml",
    stored_filename: "BURP-9011_202611171828.xml",
    file_type: "application/xml",
    file_size: 6890,
    sha256_hash: "4928174092187391827391827391827391827391827391827391827391827391",
    source: "burp_export",
    solution_step: "Exploitation",
    user_description: "Burp Repeater XML session items extracting administrator session cookie",
    verification_status: "verified",
    is_annotated: false,
    collection_timestamp: "2026-11-17T18:28:40Z"
  }
];

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

export const INITIAL_TERMINAL_COMMANDS: TerminalCommand[] = [
  {
    id: "CMD-001",
    session_id: "SES-LIVE-01",
    challenge_id: "CHAL-WEB-001",
    command: "nmap -sC -sV -p 80,5000 10.10.11.23",
    stdout: "PORT     STATE SERVICE VERSION\n80/tcp   open  http    nginx 1.18.0\n5000/tcp open  http    Werkzeug 3.0.1 (Python 3.11.4)",
    stderr: "",
    exit_code: 0,
    duration_ms: 1420,
    cwd: "C:\\CTF\\DefCamp2026\\Web",
    shell: "powershell",
    timestamp: "2026-11-17T18:05:40Z",
    is_sensitive: false,
    is_evidence: true,
    user_note: "Identified exposed Python Werkzeug HTTP service on port 5000"
  },
  {
    id: "CMD-002",
    session_id: "SES-LIVE-01",
    challenge_id: "CHAL-WEB-001",
    command: "gobuster dir -u http://10.10.11.23:5000 -w /usr/share/wordlists/dirb/common.txt",
    stdout: "/login (Status: 200) [Size: 1423]\n/api/telemetry (Status: 401) [Size: 45]\n/admin (Status: 302) -> /login",
    stderr: "",
    exit_code: 0,
    duration_ms: 3100,
    cwd: "C:\\CTF\\DefCamp2026\\Web",
    shell: "powershell",
    timestamp: "2026-11-17T18:12:10Z",
    is_sensitive: false,
    is_evidence: true,
    user_note: "Located /login and /admin endpoints"
  },
  {
    id: "CMD-003",
    session_id: "SES-LIVE-01",
    challenge_id: "CHAL-WEB-001",
    command: "curl -i -X POST http://10.10.11.23:5000/login -d \"user=admin' OR '1'='1&pass=foo\"",
    stdout: "HTTP/1.0 302 FOUND\nLocation: /admin\nSet-Cookie: session=eyJ1c2VyIjoiYWRtaW4ifQ...; Path=/",
    stderr: "",
    exit_code: 0,
    duration_ms: 320,
    cwd: "C:\\CTF\\DefCamp2026\\Web",
    shell: "powershell",
    timestamp: "2026-11-17T18:22:15Z",
    is_sensitive: false,
    is_evidence: true,
    user_note: "SQL injection in user login parameter yields session cookie"
  },
  {
    id: "CMD-004",
    session_id: "SES-LIVE-01",
    challenge_id: "CHAL-WEB-001",
    command: "curl -s -H \"Cookie: session=eyJ1c2VyIjoiYWRtaW4ifQ...\" http://10.10.11.23:5000/admin/flag",
    stdout: "{\"status\": \"success\", \"flag\": \"flag{sql1_2_auth_byp4ss_0921}\"}",
    stderr: "",
    exit_code: 0,
    duration_ms: 210,
    cwd: "C:\\CTF\\DefCamp2026\\Web",
    shell: "powershell",
    timestamp: "2026-11-17T18:30:00Z",
    is_sensitive: false,
    is_evidence: true,
    user_note: "Flag captured through authenticated admin route"
  }
];
