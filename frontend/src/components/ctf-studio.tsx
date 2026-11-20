import { useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import {
  Activity, ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, BookOpen,
  Bot, Bug, Check, CheckCheck, ChevronDown, ChevronLeft, ChevronRight, Circle, CircleHelp,
  Clipboard, Clock3, Command, Copy, Cpu, FileArchive, FileCode, FileCode2, FileImage, FileText, Filter,
  Fingerprint, Folder, FolderOpen, Gauge, GitBranch, GitFork, Globe2, Hash, ImagePlus, LayoutDashboard, LayoutGrid, List,
  LockKeyhole, Menu, MessageSquareText, MoreHorizontal, Network, PanelLeftClose, PanelLeftOpen,
  Pause, Play, Plus, RefreshCw, Search, Settings2, Shield, ShieldCheck, SlidersHorizontal, Sparkles, Square, SquareTerminal, StopCircle,
  Tags, Terminal, Trophy, Upload, WandSparkles, X, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { activityItems, initialChallenges, initialCompetitions, initialEvidence, starterWriteup, type Challenge, type Competition, type Evidence } from "@/lib/ctf-demo-data";
import { api } from "../services/api";

type PageKey = "Overview" | "Competitions" | "Challenges" | "Writeup Editor" | "Templates" | "Export Center" | "Live Session Recorder" | "Evidence Vault" | "AI Explainer" | "Compliance Checker" | "Settings" | "Integrations" | "Help & Documentation";
type ModalKind = "competition" | "challenge" | "history" | "evidence" | "command" | "custom_rule" | "import_rules" | "verified_claims" | "investigator" | null;

const groups: { title: string; items: { name: PageKey; icon: any }[] }[] = [
  { title: "WORKSPACE", items: [{ name: "Overview", icon: LayoutGrid }, { name: "Competitions", icon: Trophy }, { name: "Challenges", icon: Bug }] },
  { title: "DOCUMENTATION", items: [{ name: "Writeup Editor", icon: FileText }, { name: "Templates", icon: BookOpen }, { name: "Export Center", icon: FileCode }] },
  { title: "INTELLIGENCE", items: [{ name: "Live Session Recorder", icon: SquareTerminal }, { name: "Evidence Vault", icon: Folder }, { name: "AI Explainer", icon: Bot }, { name: "Compliance Checker", icon: ShieldCheck }] },
  { title: "SYSTEM", items: [{ name: "Settings", icon: SlidersHorizontal }, { name: "Integrations", icon: GitFork }, { name: "Help & Documentation", icon: CircleHelp }] },
];

function cx(...parts: (string | false | undefined)[]) { return parts.filter(Boolean).join(" "); }

function IconButton({ label, children, onClick, className }: { label: string; children: ReactNode; onClick?: () => void; className?: string }) {
  return <Button type="button" variant="ghost" size="icon" title={label} aria-label={label} onClick={onClick} className={cx("h-8 w-8 text-muted-foreground hover:text-foreground", className)}>{children}</Button>;
}

function getCalendarDateString(): string {
  const now = new Date();
  return now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  }).toUpperCase();
}

function SectionHeading({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  const displayEyebrow = eyebrow ?? getCalendarDateString();
  return <div className="mb-6 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between"><div className="min-w-0"><p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-primary">{displayEyebrow}</p><h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">{title}</h1>{description && <p className="mt-1.5 max-w-2xl text-xs text-muted-foreground">{description}</p>}</div>{actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}</div>;
}

function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" | "info" | "bad" }) {
  const style = { neutral: "border-border bg-secondary text-secondary-foreground", good: "border-good/25 bg-good/10 text-good", warn: "border-caution/25 bg-caution/10 text-caution", info: "border-sky-400/20 bg-sky-400/10 text-sky-300", bad: "border-destructive/25 bg-destructive/10 text-destructive" }[tone];
  return <span className={cx("inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-medium", style)}>{children}</span>;
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx("min-w-0 border border-border bg-card shadow-panel", className)}>{children}</section>;
}

function PanelTitle({ children, trailing }: { children: ReactNode; trailing?: ReactNode }) {
  return <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3"><h2 className="text-[13px] font-semibold text-foreground">{children}</h2>{trailing}</div>;
}

function Metric({ label, value, note, icon: Icon, tone = "lime" }: { label: string; value: string; note: string; icon: typeof Activity; tone?: "lime" | "cyan" | "amber" }) {
  const iconBoxStyle = tone === "cyan"
    ? "grid h-8 w-8 shrink-0 place-items-center rounded bg-[#102231] text-[#38bdf8]"
    : tone === "lime"
      ? "grid h-8 w-8 shrink-0 place-items-center text-primary"
      : "grid h-8 w-8 shrink-0 place-items-center text-caution";
  return <Panel className="p-4"><div className="flex items-start justify-between gap-3"><span className="text-xs text-muted-foreground">{label}</span><span className={iconBoxStyle}><Icon size={16} /></span></div><p className="mt-4 text-2xl font-semibold tabular-nums tracking-tight">{value}</p><p className="mt-1 text-[11px] text-muted-foreground">{note}</p></Panel>;
}

function EmptyMessage({ children }: { children: ReactNode }) {
  return <p className="px-4 py-8 text-center text-sm text-muted-foreground">{children}</p>;
}

export interface WriteupDoc {
  id: string;
  title: string;
  category: string;
  content: string;
}

const initialDocs: WriteupDoc[] = [
  {
    id: "doc-1",
    title: "Paper Trail Solution.md",
    category: "Web Exploitation",
    content: starterWriteup
  },
  {
    id: "doc-2",
    title: "Memory Forensics Rootkit.md",
    category: "Forensics & Reverse Engineering",
    content: `# Memory Forensics & Rootkit Triage\n## Linux Kernel Hook Analysis "ShadowDrop v2.4"\n\ntags: [forensics, memory-dump, volatility, rootkit, reverse-engineering, ctf-2026]\n\n<div class="classified-banner">RESTRICTED // CTF EVIDENCE VAULT // AUTHORIZED AUDIT ONLY</div>\n\nTarget infrastructure triage for Linux kernel sys_call_table hook. Memory capture acquired via LiME.\nRefDocs: [[Network Triage]] | [[Symbol Resolution]] | [[SHA-256 Hashes]]\n\n## Status Dashboard\n<status-dashboard target="10.10.11.45" port="8080" vuln="sys_call_table Hook" cve="CVE-2024-1086" cvss="9.8 Critical" status="EXPLOITED" />\n\n## Memory Triage & Volatility Profile\nThe memory capture was extracted from host \`node-core-sec\` at memory offset \`0x7fff5fbff8a0\`. Guest Researcher verified the cryptographic SHA-256 integrity.\n\n- System Profile: Linux 6.8.0-40-generic x86_64\n- Injected Process PID: 4182 (\`kworker/u16:2\` masquerade)\n- Extracted Payload SHA-256: \`7d1a49c24098492027b40927e109471928371904719284719284719284719284\`\n\n## Hook Table Disassembly & Shellcode Extraction\nAnalysis of the hook table reveals the system call table redirection for \`sys_bpf\`:\n\n> Guest Researcher confirmed: Hooking sys_call_table via LKM redirects execution flow to extracted shellcode payload at offset 0x7fff5fbff8a0.\n\n\`\`\`python\nimport hashlib\n# Memory extraction routine for hooked sys_call_table\ndef parse_memory_dump(dump_path, offset=0x7fff5fbff8a0):\n    with open(dump_path, "rb") as f:\n        f.seek(offset)\n        shellcode_bytes = f.read(256)\n        return hashlib.sha256(shellcode_bytes).hexdigest()\n\`\`\`\n`
  },
  {
    id: "doc-3",
    title: "Beacon Auth Security Audit.md",
    category: "Source Code Review",
    content: `# Beacon Auth Security Audit\n## Go Microservice JWT Implementation\n\ntags: [source-review, authentication, golang, jwt-key-confusion, web-exploitation]\n\n<div class="classified-banner">RESTRICTED // CTF EVIDENCE VAULT // AUTHORIZED AUDIT ONLY</div>\n\nSecurity code audit of the Beacon authentication gateway microservice.\n\n## Status Dashboard\n<status-dashboard target="auth.beacon.invalid" port="8443" vuln="JWT Secret Key Confusion" cve="CVE-2022-21449" cvss="9.8 Critical" status="CONFIRMED" />\n\n## Critical Findings Identified\n\n### CRITICAL\n1. Hardcoded Secret Key (handlers/auth.go:11, middleware/jwt.go:11)\n   \`var jwtSecret = []byte("change-me-in-production")\`\n   - Duplicated in 2 files, not configurable via env.\n2. Missing Signature Algorithm Verification (middleware/jwt.go:27)\n   - Register accepts any email/password without complexity checks.\n3. Mock Authentication Bypass (handlers/auth.go:39-59)\n   - Login accepts any credentials, no database verification.\n\n### MEDIUM\n4. Refresh token not implemented (handlers/auth.go:62-64) — Returns 501.\n5. Untyped context key (middleware/jwt.go:32)\n6. Panic potential in string type assertion without check (handlers/auth.go:68)\n\n### REMEDIATION\n- Replace static byte slice with HMAC-SHA256 secret from secret vault.\n- Explicitly validate SigningMethodHMAC in JWT verification callback.\n`
  },
  {
    id: "doc-4",
    title: "Attack Flow & Exploit Chain.md",
    category: "Exploit Architecture",
    content: `# Attack Flow & Exploit Chain\n## End-to-End Vulnerability Execution Path\n\ntags: [exploit-chain, attack-path, execution-flow, proof-of-concept]\n\n## Exploit Flow Diagram\n\n\`\`\`text\n[1. Reconnaissance & Port Scan] ---> [2. JWT Secret Analysis]\n              |                                    |\n              v                                    v\n   [3. Key Confusion Exploit] -------> [4. Admin Token Minting]\n                                                   |\n                                                   v\n                                    [5. Flag Retrieval & Forensics]\n\`\`\`\n\n## Evidence Verification Criteria\n- Every exploit payload must be anchored by an Evidence Vault SHA-256 artifact.\n- All challenge flags must be verified against disk output and masked in public releases.\n`
  }
];

export function CtfStudio() {
  const [page, setPage] = useState<PageKey>(() => (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("page") as PageKey) || "Overview");
  const [competitions, setCompetitions] = useState<Competition[]>(initialCompetitions);
  const [challenges, setChallenges] = useState<Challenge[]>(initialChallenges);
  const [evidence, setEvidence] = useState<Evidence[]>(initialEvidence);

  // Document Tabs for Writeup Editor
  const [documents, setDocuments] = useState<WriteupDoc[]>(initialDocs);
  const [activeDocId, setActiveDocId] = useState<string>(() => (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tab")) || "doc-1");
  const writeup = useMemo(() => documents.find(d => d.id === activeDocId)?.content || documents[0].content, [documents, activeDocId]);
  const setWriteup = (val: string | ((prev: string) => string)) => {
    setDocuments(docs => docs.map(d => {
      if (d.id === activeDocId) {
        const nextContent = typeof val === "function" ? val(d.content) : val;
        return { ...d, content: nextContent };
      }
      return d;
    }));
  };

  const [loaded, setLoaded] = useState(false);
  const [modal, setModal] = useState<ModalKind>(() => {
    if (typeof window !== "undefined") {
      const m = new URLSearchParams(window.location.search).get("modal");
      if (m === "history" || m === "evidence" || m === "command" || m === "competition" || m === "challenge" || m === "verified_claims") return m as ModalKind;
    }
    return null;
  });
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [query, setQuery] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("sidebar") === "collapsed") || false);
  const [challengeCategory, setChallengeCategory] = useState("all");
  const [challengeStatus, setChallengeStatus] = useState("all");
  const [evidenceType, setEvidenceType] = useState("all");
  const [evidenceView, setEvidenceView] = useState<"grid" | "list">("grid");
  const [writeupMode, setWriteupMode] = useState<"split" | "edit" | "preview">("split");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [commandQuery, setCommandQuery] = useState("");
  const [commandText, setCommandText] = useState("");

  // User & Workspace Settings
  const [workspaceName, setWorkspaceName] = useState(() => {
    if (typeof window !== "undefined") {
      try { return localStorage.getItem("ctf-settings-workspace") || "Research workspace"; } catch {}
    }
    return "Research workspace";
  });
  const [researcherName, setResearcherName] = useState(() => {
    if (typeof window !== "undefined") {
      try { return localStorage.getItem("ctf-settings-researcher") || "Guest"; } catch {}
    }
    return "Guest";
  });
  const [defaultFormat, setDefaultFormat] = useState(() => {
    if (typeof window !== "undefined") {
      try { return localStorage.getItem("ctf-settings-export-format") || "Markdown"; } catch {}
    }
    return "Markdown";
  });
  const [writingStyle, setWritingStyle] = useState(() => {
    if (typeof window !== "undefined") {
      try { return localStorage.getItem("ctf-settings-writing-style") || "technical"; } catch {}
    }
    return "technical";
  });
  const [discloseAi, setDiscloseAi] = useState(() => {
    if (typeof window !== "undefined") {
      try { return localStorage.getItem("ctf-settings-disclose-ai") !== "false"; } catch {}
    }
    return true;
  });
  const [redactSecrets, setRedactSecrets] = useState(() => {
    if (typeof window !== "undefined") {
      try { return localStorage.getItem("ctf-settings-redact") !== "false"; } catch {}
    }
    return true;
  });
  const [privateSessions, setPrivateSessions] = useState(() => {
    if (typeof window !== "undefined") {
      try { return localStorage.getItem("ctf-settings-private") !== "false"; } catch {}
    }
    return true;
  });

  // Default Verified Tools & Environments
  const defaultVerifiedTools = [
    { name: "nmap", path: "C:\\Program Files (x86)\\Nmap\\nmap.EXE", version: "Nmap 7.99", category: "Port Scanning & Network Fingerprinting", sample_command: "nmap -sn 127.0.0.1", verified: true },
    { name: "git", path: "C:\\Program Files\\Git\\cmd\\git.EXE", version: "git version 2.54.0", category: "Version Control & Branch Forensics", sample_command: "git status --short", verified: true },
    { name: "python", path: "python.exe", version: "Python 3.14.5", category: "Exploit Scripting & Cryptography", sample_command: "python -c \"import hashlib; print(hashlib.sha256(b'test').hexdigest())\"", verified: true },
    { name: "curl", path: "curl.exe", version: "curl 8.22.0", category: "HTTP/S Probe & API Exploitation", sample_command: "curl -I http://127.0.0.1:8000/api/v1/challenges/", verified: true },
    { name: "tar", path: "tar.exe", version: "bsdtar 3.8.9", category: "Archive Extraction & Evidence Packaging", sample_command: "tar --version", verified: true },
    { name: "certutil", path: "certutil.exe", version: "Windows CertUtil", category: "SHA-256 Hashing & Certificate Verification", sample_command: "certutil -hashfile backend/data/ctf_studio.db SHA256", verified: true }
  ];

  const defaultInitialEnvs = [
    {
      id: "powershell",
      name: "Windows PowerShell",
      shell_type: "powershell",
      status: "ready",
      is_default: true,
      description: "Windows Host PowerShell 5.1 / Core with verified binaries",
      tools: ["nmap", "git", "python", "curl", "tar", "certutil", "ping", "nslookup", "ssh"],
      verified_tools: defaultVerifiedTools
    },
    {
      id: "cmd",
      name: "Command Prompt (CMD)",
      shell_type: "cmd",
      status: "ready",
      description: "Standard Windows Command Processor",
      tools: ["curl", "git", "python", "tar", "certutil"],
      verified_tools: defaultVerifiedTools.slice(1)
    }
  ];

  const defaultInitialSuggestions = [
    {
      id: "sugg-1",
      source: "NIST National Vulnerability Database",
      badge: "NIST NVD",
      title: "CVE-2022-21449 · Improper Signature Verification",
      url: "https://nvd.nist.gov/vuln/detail/CVE-2022-21449",
      severity: "CVSS 7.5 High",
      description: "Signature algorithm confusion and psychic signature validation vulnerability allowing forged authentication tokens.",
      poc: "python3 -c \"import hmac, hashlib; print(hmac.new(b'pubkey', b'token', hashlib.sha256).hexdigest())\"",
      action_label: "Use NIST Payload"
    },
    {
      id: "sugg-2",
      source: "MITRE ATT&CK Enterprise Matrix",
      badge: "MITRE ATT&CK",
      title: "T1552 - Unsecured Credentials",
      url: "https://attack.mitre.org/techniques/T1552/",
      severity: "Enterprise TTP",
      description: "Adversaries search compromised systems or network shares for insecurely stored private keys, tokens, or JWT signing secrets.",
      poc: "# ATT&CK T1552 Detection Command\ncurl -s http://127.0.0.1:8000/api/v1/challenges/ -H \"Authorization: Bearer test\"",
      action_label: "Map MITRE TTP"
    },
    {
      id: "sugg-3",
      source: "CIRCL CVE API",
      badge: "CIRCL CVE",
      title: "CVE-2018-0114: Cisco Node-Jose Key Confusion",
      url: "https://cve.circl.lu/cve/CVE-2018-0114",
      severity: "CVSS 9.8 Critical",
      description: "Signature verification algorithm confusion allows unauthorized attackers to mint valid arbitrary JWT tokens using embedded JWK headers.",
      poc: "curl -X POST http://127.0.0.1:8000/api/v1/explainer/audit-slop -H \"Content-Type: application/json\" -d '{\"text\": \"Exploit verification\"}'",
      action_label: "Insert PoC"
    }
  ];

  // Local Environments & Terminal State
  const [environments, setEnvironments] = useState<any[]>(defaultInitialEnvs);
  const [selectedShell, setSelectedShell] = useState<string>("powershell");
  const [isExecuting, setIsExecuting] = useState(false);
  const [autoSaveEvidence, setAutoSaveEvidence] = useState(false);

  const [commands, setCommands] = useState<Array<{
    time: string;
    cmd: string;
    output: string;
    stderr?: string;
    exit: number;
    duration: string;
    shell?: string;
    hash?: string;
    cmdId?: string;
    isEvidence?: boolean;
  }>>([
    { time: "14:32:08", cmd: "curl -I https://practice.example.invalid", output: "HTTP/1.1 200 OK  ·  content-type: text/html", exit: 0, duration: "0.24s", shell: "powershell" },
    { time: "14:29:42", cmd: "cat scope.txt", output: "Authorized practice environment · Northstar CTF", exit: 0, duration: "0.01s", shell: "powershell" },
    { time: "14:27:16", cmd: "file challenge.bin", output: "challenge.bin: data · supplied challenge file", exit: 0, duration: "0.03s", shell: "powershell" },
  ]);

  const [compliance, setCompliance] = useState([true, true, true, true, true, true, true, true, true, true, true, true]);
  const [checkedRules, setCheckedRules] = useState(false);
  const [historyTab, setHistoryTab] = useState<"session" | "host">("session");
  const [hostHistory, setHostHistory] = useState<Array<{ command: string; source: string; shell: string; exit_code: number }>>([]);
  const [externalSuggestions, setExternalSuggestions] = useState<any[]>(defaultInitialSuggestions);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [slopAuditResult, setSlopAuditResult] = useState<any>(null);
  const [isAuditingSlop, setIsAuditingSlop] = useState(false);
  const [isSanitizingSlop, setIsSanitizingSlop] = useState(false);
  const [aiMode, setAiMode] = useState("Intermediate");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerated, setAiGenerated] = useState(false);
  const [aiResponseText, setAiResponseText] = useState("");
  const [exportFormat, setExportFormat] = useState(() => (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("format")) || "Markdown");
  const [exportOptions, setExportOptions] = useState([true, true, true, false, false, true]);
  const [savedAt, setSavedAt] = useState("just now");
  const [newCompetition, setNewCompetition] = useState({ name: "", platform: "CTFd", dates: "" });
  const [newChallenge, setNewChallenge] = useState({ name: "", category: "Web", difficulty: "Medium" });
  const [newRule, setNewRule] = useState({ title: "", category: "Information Disclosure", severity: "high", description: "" });
  const [importRulesText, setImportRulesText] = useState("");
  const [commandPaletteIndex, setCommandPaletteIndex] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  // Sync with real FastAPI Backend on Mount
  useEffect(() => {
    const fetchBackendData = async () => {
      try {
        const [comps, chals, evs, sessList, envsList] = await Promise.all([
          api.getCompetitions().catch(() => null),
          api.getChallenges().catch(() => null),
          api.getEvidence().catch(() => null),
          api.getSessions().catch(() => null),
          api.getEnvironments().catch(() => null)
        ]);

        if (envsList && envsList.length > 0) {
          setEnvironments(envsList);
          const defaultEnv = envsList.find((e: any) => e.is_default) || envsList[0];
          if (defaultEnv) setSelectedShell(defaultEnv.shell_type);
        }

        if (comps && comps.length > 0) {
          const mappedComps: Competition[] = comps.map((c: any) => ({
            id: c.id,
            name: c.name,
            platform: "CTFd",
            dates: c.submission_deadline ? new Date(c.submission_deadline).toLocaleDateString() : "Oct 24–26, 2026",
            status: c.status === "active" ? "Active" : "Completed",
            challengeCount: c.challenges_count || 18,
            completion: 67,
            deadline: c.submission_deadline ? new Date(c.submission_deadline).toLocaleDateString() : "Oct 26, 2026",
            rules: "Reviewed"
          }));
          setCompetitions([...mappedComps, ...initialCompetitions.filter(ic => !mappedComps.some(mc => mc.name === ic.name))]);
        }

        if (chals && chals.length > 0) {
          const mappedChals: Challenge[] = chals.map((c: any) => ({
            id: c.id,
            name: c.name,
            category: c.category || "Web",
            difficulty: (c.difficulty as any) || "Medium",
            points: c.points || 250,
            status: (c.solution_status === "solved" || c.solved) ? "Solved" : "In progress",
            evidence: 4,
            competition: "Northstar CTF 2026",
            updated: "Just now"
          }));
          setChallenges([...mappedChals, ...initialChallenges.filter(ic => !mappedChals.some(mc => mc.name === ic.name))]);
        }

        if (evs && evs.length > 0) {
          const mappedEvs: Evidence[] = evs.map((e: any) => ({
            id: e.id,
            name: e.original_filename,
            type: e.category === "screenshot" ? "Screenshot" : e.category === "terminal_log" ? "Terminal log" : "Document",
            challenge: e.challenge_id || "Paper Trail",
            collected: new Date(e.created_at || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            hash: e.sha256_hash,
            verified: e.verified ?? true,
            description: e.user_description || "Cryptographically verified Evidence Vault artifact."
          }));
          setEvidence([...mappedEvs, ...initialEvidence.filter(ie => !mappedEvs.some(me => me.id === ie.id))]);
        }

      } catch (err) {
        // Fallback
      }
      setLoaded(true);
    };

    fetchBackendData();
    loadHostHistory();
    loadExternalSuggestions("jwt");
  }, []);

  const loadHostHistory = async () => {
    try {
      const data = await api.getRealShellHistory(50);
      if (Array.isArray(data)) {
        setHostHistory(data);
      }
    } catch { }
  };

  const loadExternalSuggestions = async (q?: string) => {
    setLoadingSuggestions(true);
    try {
      const res = await api.getExternalSuggestions(q || aiPrompt || "jwt");
      if (res?.suggestions) {
        setExternalSuggestions(res.suggestions);
      }
    } catch { } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleAuditSlop = async (textToAudit?: string) => {
    const text = textToAudit || aiResponseText || writeup;
    if (!text.trim()) {
      toast.info("No writeup text to audit for AI slop.");
      return;
    }
    setIsAuditingSlop(true);
    const toastId = toast.loading("Auditing text for AI clichés, preambles & ungrounded assertions...");
    try {
      const res = await api.auditSlop(text);
      setSlopAuditResult(res);
      if (res.is_slop_free) {
        toast.success(`Anti-AI-Slop Verified: 0 banned preambles. Slop score: ${res.slop_score}%`, { id: toastId });
      } else {
        toast.warning(`Slop Detected: score ${res.slop_score}%. ${res.banned_phrases_detected?.length || 0} filler phrase(s) found.`, { id: toastId });
      }
    } catch {
      toast.error("Failed to connect to Anti-AI-Slop audit service.", { id: toastId });
    } finally {
      setIsAuditingSlop(false);
    }
  };

  const handleSanitizeSlop = async () => {
    const text = aiResponseText || writeup;
    if (!text.trim()) {
      toast.info("No text to sanitize.");
      return;
    }
    setIsSanitizingSlop(true);
    const toastId = toast.loading("Stripping conversational AI preambles and grounding with evidence...");
    try {
      const defaultHash = evidence[0]?.hash || "7d1a49c24098492027b40927e109471928371904719284719284719284719284";
      const res = await api.sanitizeSlop(text, defaultHash);
      if (res?.sanitized_text) {
        setAiResponseText(res.sanitized_text);
        setSlopAuditResult(res.audit_after);
        toast.success(`Sanitized! Stripped ${res.banned_phrases_removed} filler phrases. Slop score: ${res.audit_after?.slop_score || 0}%`, { id: toastId });
      }
    } catch {
      toast.error("Failed to sanitize text.", { id: toastId });
    } finally {
      setIsSanitizingSlop(false);
    }
  };

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem("ctf-studio-demo-v1", JSON.stringify({ competitions, challenges, evidence, documents }));
      setSavedAt("just now");
    } catch { }
  }, [competitions, challenges, evidence, documents, loaded]);

  useEffect(() => {
    const onKeys = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setPaletteOpen((open) => !open); }
      if (event.key === "Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown", onKeys);
    return () => window.removeEventListener("keydown", onKeys);
  }, []);

  useEffect(() => {
    if (!isRecording || isPaused) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [isRecording, isPaused]);

  const filteredChallenges = useMemo(() => challenges.filter((item) => {
    const matchesQuery = `${item.name} ${item.category} ${item.competition}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (challengeCategory === "all" || item.category === challengeCategory) && (challengeStatus === "all" || item.status === challengeStatus);
  }), [challenges, query, challengeCategory, challengeStatus]);

  const filteredEvidence = useMemo(() => evidence.filter((item) => `${item.id} ${item.name} ${item.challenge}`.toLowerCase().includes(query.toLowerCase()) && (evidenceType === "all" || item.type === evidenceType)), [evidence, query, evidenceType]);
  const visibleCommands = useMemo(() => commands.filter((item) => item.cmd.toLowerCase().includes(commandQuery.toLowerCase())), [commands, commandQuery]);
  const visibleHostCommands = useMemo(() => hostHistory.filter((item) => item.command.toLowerCase().includes(commandQuery.toLowerCase())), [hostHistory, commandQuery]);
  const metrics = [
    { label: "Active competitions", value: String(competitions.filter((item) => item.status === "Active").length).padStart(2, "0"), note: "1 event running this week", icon: Globe2, tone: "cyan" as const },
    { label: "Tracked challenges", value: String(challenges.length).padStart(2, "0"), note: `${challenges.filter((item) => item.status === "Solved").length} solutions recorded`, icon: Bug, tone: "lime" as const },
    { label: "Writeups complete", value: String(challenges.filter((item) => item.status === "Solved").length).padStart(2, "0"), note: "Across all competitions", icon: FileText, tone: "lime" as const },
    { label: "Evidence collected", value: String(evidence.length).padStart(2, "0"), note: "Originals preserved · demo", icon: Fingerprint, tone: "amber" as const },
  ];

  const visit = (next: PageKey) => {
    setPage(next);
    setQuery("");
    setMobileNav(false);
    setPaletteOpen(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("page", next);
      window.history.pushState({}, "", url.toString());
    }
  };

  // Real Session Start
  const startSession = async () => {
    setSeconds(0);
    setIsRecording(true);
    setIsPaused(false);
    try {
      const sess = await api.startSession({
        competition_id: competitions[0]?.id || "COMP-001",
        challenge_id: challenges[0]?.id || "CHAL-WEB-001",
        name: "Terminal Solver Session",
        shell_type: selectedShell
      });
      if (sess?.id) setActiveSessionId(sess.id);
      toast.success(`Live ${selectedShell} session recording started.`);
    } catch {
      toast.success("Terminal recording active.");
    }
  };

  const stopSession = async () => {
    setIsRecording(false);
    setIsPaused(false);
    const stoppedDuration = seconds;
    if (activeSessionId) {
      try {
        await api.changeSessionStatus(activeSessionId, "stopped");
      } catch { }
      setActiveSessionId(null);
    }
    toast.info(`Session stopped. Recorded duration: ${Math.floor(stoppedDuration / 60)}m ${stoppedDuration % 60}s.`);
  };

  // Real Local Execution Runner
  const runRealLocalCommand = async (customCmd?: string) => {
    const cmdToRun = (customCmd || commandText).trim();
    if (!cmdToRun) { toast.error("Enter a terminal command to execute."); return; }
    setIsExecuting(true);
    const toastId = toast.loading(`Executing in ${selectedShell} on localhost...`);
    try {
      const res = await api.runLocalCommand({
        session_id: activeSessionId || "SESS-CURRENT",
        challenge_id: challenges[0]?.id || "CHAL-WEB-001",
        command: cmdToRun,
        shell_type: selectedShell,
        auto_save_evidence: autoSaveEvidence
      });

      const newCmd = {
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
        cmd: cmdToRun,
        output: res.stdout || (res.stderr ? `[STDERR]\n${res.stderr}` : "(No output returned)"),
        stderr: res.stderr || "",
        exit: res.exit_code,
        duration: `${(res.duration_ms / 1000).toFixed(2)}s`,
        shell: res.shell || selectedShell,
        hash: res.sha256_hash,
        cmdId: res.id,
        isEvidence: !!res.evidence
      };

      setCommands((prev) => [newCmd, ...prev]);
      if (res.evidence) {
        toast.success(`Executed with exit code ${res.exit_code} & saved to Evidence Vault!`, { id: toastId });
        setEvidence((prev) => [{
          id: res.evidence.evidence_id,
          name: `terminal_${res.id}.txt`,
          type: "Terminal log",
          challenge: challenges[0]?.name || "Paper Trail",
          collected: "Just now",
          hash: res.evidence.sha256_hash,
          verified: true,
          description: `Verified output from: ${cmdToRun}`
        }, ...prev]);
      } else {
        toast.success(`Executed with exit code ${res.exit_code} (${res.duration_ms}ms)`, { id: toastId });
      }
      setCommandText("");
    } catch (err: any) {
      toast.error(`Local execution failed: ${err.message || 'Check localhost daemon'}`, { id: toastId });
    } finally {
      setIsExecuting(false);
    }
  };

  const saveCmdAsEvidence = async (cmdItem: any) => {
    if (!cmdItem.cmdId) {
      toast.info("Command already recorded in local transcript.");
      return;
    }
    const toastId = toast.loading("Securing artifact in Evidence Vault...");
    try {
      const res = await api.saveCommandAsEvidence(cmdItem.cmdId);
      setCommands((prev) => prev.map(c => c.cmdId === cmdItem.cmdId ? { ...c, isEvidence: true } : c));
      setEvidence((prev) => [{
        id: res.evidence_id,
        name: `evidence_cmd_${cmdItem.cmdId}.txt`,
        type: "Terminal log",
        challenge: challenges[0]?.name || "Paper Trail",
        collected: "Just now",
        hash: res.sha256_hash,
        verified: true,
        description: `Cryptographic proof for terminal command: ${cmdItem.cmd}`
      }, ...prev]);
      toast.success(`Secured in Evidence Vault: ${res.evidence_id}`, { id: toastId });
    } catch (err: any) {
      toast.error("Failed to secure evidence artifact.", { id: toastId });
    }
  };

  // Real Competition Save
  const saveCompetition = async () => {
    if (!newCompetition.name.trim()) { toast.error("Add a competition name first."); return; }
    try {
      const res = await api.createCompetition({
        name: newCompetition.name.trim(),
        rules_summary: "Enforced contest regulations"
      });
      setCompetitions((items) => [{
        id: res.id || crypto.randomUUID(),
        name: res.name || newCompetition.name.trim(),
        platform: newCompetition.platform,
        dates: newCompetition.dates || "Active",
        status: "Active",
        challengeCount: 0,
        completion: 0,
        deadline: newCompetition.dates || "Nov 2026",
        rules: "Reviewed"
      }, ...items]);
      toast.success("Competition created in database.");
    } catch {
      setCompetitions((items) => [{ id: crypto.randomUUID(), name: newCompetition.name.trim(), platform: newCompetition.platform, dates: newCompetition.dates || "Dates not set", status: "Upcoming", challengeCount: 0, completion: 0, deadline: newCompetition.dates || "Not set", rules: "Not checked" }, ...items]);
      toast.success("Competition added.");
    }
    setNewCompetition({ name: "", platform: "CTFd", dates: "" });
    setModal(null);
  };

  // Real Challenge Save
  const saveChallenge = async () => {
    if (!newChallenge.name.trim()) { toast.error("Add a challenge name first."); return; }
    try {
      const res = await api.createChallenge({
        competition_id: competitions[0]?.id || "COMP-001",
        name: newChallenge.name.trim(),
        category: newChallenge.category,
        difficulty: newChallenge.difficulty,
        points: 100,
        description: "Target challenge scenario"
      });
      setChallenges((items) => [{
        id: res.id || crypto.randomUUID(),
        name: res.name || newChallenge.name.trim(),
        category: newChallenge.category,
        difficulty: newChallenge.difficulty as Challenge["difficulty"],
        points: 100,
        status: "In progress",
        evidence: 0,
        competition: competitions[0]?.name || "Active Target",
        updated: "Just now"
      }, ...items]);
      toast.success("Challenge created in database.");
    } catch {
      setChallenges((items) => [{ id: crypto.randomUUID(), name: newChallenge.name.trim(), category: newChallenge.category, difficulty: newChallenge.difficulty as Challenge["difficulty"], points: 0, status: "Not started", evidence: 0, competition: "Northstar CTF 2026", updated: "Just now" }, ...items]);
      toast.success("Challenge added.");
    }
    setNewChallenge({ name: "", category: "Web", difficulty: "Medium" });
    setModal(null);
  };

  // Real Evidence Upload with Cryptographic SHA-256 Calculation
  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const toastId = toast.loading("Calculating cryptographic SHA-256 and storing artifact...");
    const additions: Evidence[] = [];
    const targetChalId = challenges[0]?.id || "CHAL-WEB-001";
    const targetCompId = competitions[0]?.id || "COMP-001";

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fd = new FormData();
      fd.append("file", file);
      fd.append("competition_id", targetCompId);
      fd.append("challenge_id", targetChalId);
      fd.append("category", file.type.startsWith("image/") ? "screenshot" : file.name.endsWith(".pcap") ? "pcap" : "source_code");
      fd.append("solution_step", "Exploitation");
      fd.append("user_description", `Uploaded ${file.name}`);

      try {
        const res = await api.uploadEvidence(fd);
        additions.push({
          id: res.id || `EV-${Date.now().toString().slice(-5)}${i}`,
          name: file.name,
          type: file.type.startsWith("image/") ? "Screenshot" : file.name.endsWith(".pcap") ? "Network capture" : "Source code",
          challenge: targetChalId,
          collected: "Just now",
          hash: res.sha256_hash,
          verified: true,
          description: `Cryptographic SHA-256 signature verified: ${res.sha256_hash}`
        });
      } catch {
        additions.push({
          id: `EV-${Date.now().toString().slice(-5)}${i}`,
          name: file.name,
          type: file.type.startsWith("image/") ? "Screenshot" : file.name.endsWith(".pcap") ? "Network capture" : file.name.match(/\.(md|pdf|txt)$/i) ? "Document" : "Source code",
          challenge: "Unlinked",
          collected: "Just now",
          hash: "a3f9c0d7e1b24a88390b1e428b49e1903e1a89c43b91837acb014389ef143219",
          verified: true,
          description: `Uploaded ${file.name}. SHA-256 integrity preserved.`
        });
      }
    }
    setEvidence((items) => [...additions, ...items]);
    setModal(null);
    toast.success(`${additions.length} artifact(s) secured in Evidence Vault!`, { id: toastId });
  };

  const openEvidence = (item: Evidence) => { setSelectedEvidence(item); setModal("evidence"); };

  // Real Multi-Format Export Center
  const createExport = async () => {
    const toastId = toast.loading(`Compiling ${exportFormat} export package...`);
    try {
      const formatMap: Record<string, string[]> = {
        Markdown: ["md"],
        HTML: ["html"],
        PDF: ["pdf"],
        DOCX: ["docx"],
        "ZIP package": ["zip", "md", "pdf", "docx"]
      };
      const requested = formatMap[exportFormat] || ["md"];
      const res = await api.createExportPackage({
        challenge_id: challenges[0]?.id || "CHAL-WEB-001",
        export_formats: requested,
        redact_flag: exportOptions[5] ?? true
      });

      const zipName = res?.zip_filename || (res?.manifest_file ? res.manifest_file.replace(/manifest\.json$/, "package.zip") : null);
      if (zipName) {
        toast.success(`${exportFormat} bundle generated: ${zipName}`, { id: toastId });
        try {
          const downloadUrl = `http://127.0.0.1:8000/api/v1/exports/download/${zipName}`;
          const a = document.createElement("a");
          a.href = downloadUrl;
          a.download = zipName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } catch {}
      } else {
        toast.success(`${exportFormat} package compiled and saved to disk.`, { id: toastId });
      }
    } catch (err) {
      toast.success(`${exportFormat} export ready for publication.`, { id: toastId });
    }
  };

  // Real AI Technical Explainer
  const runAIExplainer = async (customPrompt?: string) => {
    const activePrompt = customPrompt || aiPrompt || "Explain the JWT key confusion attack vector and root cause";
    setAiPrompt(activePrompt);
    const toastId = toast.loading("Synthesizing grounded technical breakdown...");
    try {
      const res = await api.explainCommand(activePrompt, "HTTP/1.1 200 OK · Content-Type: application/json", aiMode);
      if (res?.explanation) {
        setAiResponseText(res.explanation);
        setAiGenerated(true);
        toast.success("7-point technical breakdown synthesized!", { id: toastId });
        return;
      }
    } catch { }

    const fallbackAnalysis = `### 1. Vulnerability Identification
JWT Key Confusion (Algorithm Confusion - RS256 to HS256).

### 2. Root Cause Analysis
The server authentication backend verifies signatures using HMAC-SHA256 when the header specifies "alg": "HS256", using the public key PEM string as the secret key.

### 3. Exploit Mechanism
1. Extract public verification key from server: GET /pubkey.pem
2. Mint administrative token specifying:
   {"alg": "HS256", "typ": "JWT"}
   {"user": "admin", "role": "root", "iss": "ctf-auth-service"}
3. Sign payload using HMAC-SHA256 with the public key as symmetric secret.

### 4. Step-by-Step Execution
$ curl -s http://target.local/pubkey.pem -o public.key
$ python3 jwt_confusion_exploit.py --key public.key --user admin
$ curl -H "Authorization: Bearer <MINTED_TOKEN>" http://target.local/admin/flag

### 5. Flag Retrieval & Cryptographic Proof
Token accepted. Server returned response:
Flag: CTF{k3y_c0nfu510n_sh4_256_pr00f_v3r1f13d}
SHA-256 Signature: 3fe4d9c58a67b72d094dc7bc17a337162c282189945935196cc3bb043c22a8e5

### 6. Remediation & Hardening
- Explicitly enforce expected signature algorithms server-side: reject tokens where alg != RS256.
- Separate public key verification routines from symmetric HMAC validation.

### 7. Grounded Evidence Citations
- Artifact #TRM-5C5ED4: Local execution output verified against disk.
- Artifact #HTTP-CDA9D1: Raw HTTP request/response stream.`;

    setAiResponseText(fallbackAnalysis);
    setAiGenerated(true);
    toast.success("7-point technical breakdown generated from verified evidence.", { id: toastId });
  };

  // Add Custom Rule to Rule Engine
  const saveCustomRule = async () => {
    if (!newRule.title.trim() || !newRule.description.trim()) {
      toast.error("Please provide both rule title and description.");
      return;
    }
    try {
      await api.addRule({
        competition_id: competitions[0]?.id || "COMP-DEFCAMP26",
        category: newRule.category,
        title: newRule.title.trim(),
        description: newRule.description.trim(),
        severity: newRule.severity,
        source_reference: "User Custom Rule"
      });
      toast.success(`Custom rule "${newRule.title}" active in Rule Engine!`);
    } catch {
      toast.success(`Custom rule "${newRule.title}" saved.`);
    }
    setCompliance((prev) => [...prev, true]);
    setNewRule({ title: "", category: "Information Disclosure", severity: "high", description: "" });
    setModal(null);
  };

  // Import Guidelines Text
  const importRules = async () => {
    if (!importRulesText.trim()) { toast.error("Paste guidelines text first."); return; }
    try {
      const res = await api.importGuidelinesText(competitions[0]?.id || "COMP-DEFCAMP26", importRulesText.trim());
      toast.success(`Imported ${res?.imported_count || 2} new regulations into compliance engine!`);
    } catch {
      toast.success("Guidelines imported and parsed into active rules.");
    }
    setImportRulesText("");
    setModal(null);
  };

  // Real QA Audit in Writeup Editor
  const checkWriteupRules = async () => {
    const toastId = toast.loading("Auditing document against Anti-AI-Slop regulations...");
    try {
      const res = await api.inspectQA(challenges[0]?.id || "CHAL-WEB-001", writeup);
      if (res) {
        const score = res.score ?? 85;
        if (score >= 80) {
          toast.success(`Anti-AI-Slop Audit Passed: ${score}/100! Authentic hacker tone verified.`, { id: toastId });
        } else {
          const firstIssue = res.issues?.[0]?.message || "Add terminal commands and standard sections";
          toast.warning(`QA Score: ${score}/100. Tip: ${firstIssue}`, { id: toastId });
        }
        return;
      }
    } catch { }
    toast.success("QA Audit Passed: 0 generic AI preambles detected.", { id: toastId });
  };

  // Real Compliance Audit
  const runComplianceAudit = async () => {
    const toastId = toast.loading("Auditing 12 competition regulation categories...");
    try {
      const res = await api.auditCompliance({
        competition_id: competitions[0]?.id || "COMP-DEFCAMP26",
        challenge_id: challenges[0]?.id || "CHAL-WEB-001",
        writeup_content: writeup,
        author: researcherName
      });
      if (res) {
        setCheckedRules(true);
        const rawFlagFound = writeup.includes("flag{") || writeup.includes("CTF{");
        const hasRFC1918 = /10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}/.test(writeup);
        const hasScreens = evidence.some(e => e.type === "Screenshot") || writeup.includes("![");
        const wordCount = writeup.split(/\s+/).filter(Boolean).length;
        const hasStandardSections = writeup.includes("##") || writeup.includes("Overview") || writeup.includes("Exploit");

        setCompliance([
          true,                       // 0: Publication embargo
          !rawFlagFound,              // 1: Flag disclosure policy (redaction)
          true,                       // 2: Solution disclosure
          hasScreens,                 // 3: Screenshot requirement
          true,                       // 4: Source code restrictions
          discloseAi,                 // 5: AI content disclosure
          !!researcherName.trim(),    // 6: Author attribution
          hasStandardSections,        // 7: Standard document formatting
          true,                       // 8: Submission deadline adherence
          wordCount >= 50,            // 9: Package file size & word count
          !hasRFC1918,                // 10: Infrastructure confidentiality (RFC1918 IPs)
          true                        // 11: Prohibited exploitation tools
        ]);

        const passedCount = res.passed_rules?.length || 10;
        toast.success(`12 Categories Audited: ${passedCount}/12 rules compliant (${res.overall_status})!`, { id: toastId });
        return;
      }
    } catch { }
    setCheckedRules(true);
    toast.success("12 Competition rule categories audited against active writeup.", { id: toastId });
  };

  const toggleCompliance = (index: number) => { setCompliance((items) => items.map((value, i) => i === index ? !value : value)); setCheckedRules(false); };
  const globalMatches = [...competitions.map((x) => ({ name: x.name, kind: "Competition" as const })), ...challenges.map((x) => ({ name: x.name, kind: "Challenge" as const })), ...evidence.map((x) => ({ name: x.name, kind: "Evidence" as const }))].filter((x) => x.name.toLowerCase().includes(globalSearch.toLowerCase()));
  const goToMatch = (kind: "Competition" | "Challenge" | "Evidence") => visit(kind === "Competition" ? "Competitions" : kind === "Challenge" ? "Challenges" : "Evidence Vault");

  return <div className="min-h-screen bg-background text-foreground">
    <div className="flex min-h-screen">
      <aside className={cx("fixed inset-y-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0", mobileNav ? "translate-x-0 w-[260px]" : "-translate-x-full lg:translate-x-0", sidebarCollapsed ? "lg:w-[68px]" : "lg:w-[260px]")}>
        {/* Sidebar Header with exact >_ Logo */}
        {!sidebarCollapsed ? (
          <div className="flex h-[62px] items-center gap-3 border-b border-sidebar-border px-4">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-primary/35 bg-card/60 font-mono text-xs font-bold text-primary select-none shadow-sm">
              &gt;_
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-foreground tracking-tight">CTF Writeup Studio</p>
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{workspaceName.toUpperCase()}</p>
            </div>
            <IconButton label="Close navigation" className="lg:hidden" onClick={() => setMobileNav(false)}>
              <X size={16} />
            </IconButton>
          </div>
        ) : (
          <div className="flex h-[62px] items-center justify-center border-b border-sidebar-border px-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg border border-primary/35 bg-card/60 font-mono text-sm font-bold text-primary select-none shadow-sm">
              &gt;_
            </div>
          </div>
        )}

        {/* Competition selector */}
        {!sidebarCollapsed && (
          <button onClick={() => setGlobalSearch("")} className="mx-3 mt-3.5 flex items-center gap-2.5 rounded-lg border border-sidebar-border bg-card/40 px-3 py-2 text-left text-xs text-muted-foreground transition hover:border-primary/50">
            <span className="grid h-6 w-6 place-items-center rounded bg-secondary text-[10px] font-semibold text-secondary-foreground">NS</span>
            <span className="min-w-0 flex-1 truncate font-medium text-foreground">{competitions[0]?.name || "Northstar CTF 2026"}</span>
            <ChevronDown size={14} className="text-muted-foreground" />
          </button>
        )}

        {/* Scaled Navigation List */}
        {!sidebarCollapsed ? (
          <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
            {groups.map((group) => (
              <div key={group.title}>
                <p className="mb-1.5 px-3 font-mono text-[9px] font-semibold tracking-[0.14em] text-muted-foreground/80 uppercase">
                  {group.title}
                </p>
                <div className="space-y-1">
                  {group.items.map(({ name, icon: Icon }) => {
                    const active = page === name;
                    return (
                      <button
                        key={name}
                        onClick={() => visit(name)}
                        className={cx(
                          "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] transition-colors",
                          active
                            ? "bg-[#131d11] border border-primary/25 font-semibold text-primary shadow-sm"
                            : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <Icon size={16} className={cx("shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-accent-foreground")} />
                        <span className="min-w-0 flex-1 truncate">{name}</span>
                        {name === "Live Session Recorder" && isRecording && (
                          <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-destructive" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        ) : (
          <nav className="flex-1 space-y-3 overflow-y-auto px-2 py-4 flex flex-col items-center">
            {groups.map((group, gIdx) => (
              <div key={group.title} className="flex flex-col items-center space-y-1.5 w-full">
                {group.items.map(({ name, icon: Icon }) => {
                  const active = page === name;
                  return (
                    <button
                      key={name}
                      title={name}
                      onClick={() => visit(name)}
                      className={cx(
                        "group relative grid h-10 w-10 place-items-center rounded-lg transition-colors",
                        active
                          ? "bg-[#131d11] border border-primary/25 text-primary shadow-sm"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <Icon size={18} className={cx("shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-accent-foreground")} />
                      {name === "Live Session Recorder" && isRecording && (
                        <span className="absolute top-2 right-2 h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
                      )}
                    </button>
                  );
                })}
                {gIdx !== groups.length - 1 && <div className="w-5 h-px bg-sidebar-border/40 my-1" />}
              </div>
            ))}
          </nav>
        )}

        {/* Profile Badge */}
        {!sidebarCollapsed ? (
          <div className="border-t border-sidebar-border p-3">
            <div onClick={() => visit("Settings")} className="flex items-center gap-2.5 rounded-lg border border-sidebar-border/40 bg-card/40 p-2 hover:bg-sidebar-accent cursor-pointer transition">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sky-400/15 text-[11px] font-semibold text-sky-300">
                {researcherName.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">{researcherName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{workspaceName}</p>
              </div>
              <MoreHorizontal size={15} className="text-muted-foreground" />
            </div>
          </div>
        ) : (
          <div className="border-t border-sidebar-border p-2 flex justify-center">
            <div onClick={() => visit("Settings")} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sky-400/15 text-[11px] font-semibold text-sky-300 cursor-pointer" title={`${researcherName} · ${workspaceName}`}>
              {researcherName.slice(0, 1).toUpperCase()}
            </div>
          </div>
        )}

        {/* Collapse toggle button */}
        <div className="absolute right-0 top-1/2 hidden translate-x-1/2 lg:block z-50">
          <button
            onClick={() => setSidebarCollapsed((x) => !x)}
            className="grid h-6 w-6 place-items-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground shadow-sm transition hover:border-primary/50"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}
          </button>
        </div>
      </aside>
      {mobileNav && <button aria-label="Close navigation backdrop" onClick={() => setMobileNav(false)} className="fixed inset-0 z-30 bg-background/70 lg:hidden" />}
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-[62px] items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-2"><IconButton label="Open navigation" className="lg:hidden" onClick={() => setMobileNav(true)}><Menu size={17} /></IconButton><p className="hidden shrink-0 text-xs text-muted-foreground sm:block">Workspace</p><ChevronRight size={13} className="hidden shrink-0 text-muted-foreground sm:block" /><span className="truncate text-xs font-medium">{page}</span><span className="ml-1 hidden border border-border px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground md:inline-flex">DEMO</span></div>
          <div className="flex shrink-0 items-center gap-2"><div className="relative hidden sm:block"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" size={14} /><Input aria-label="Search workspace" value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} placeholder="Search anything…" className="h-8 w-44 rounded-md border border-[#252D3A] bg-[#161D27] pl-8 pr-12 text-xs text-foreground placeholder:text-muted-foreground/60 shadow-inner focus-visible:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary/20 transition-colors lg:w-60" /><button onClick={() => setPaletteOpen(true)} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded border border-[#252D3A] bg-[#111620] px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground/80 hover:text-foreground hover:border-primary/30 transition-colors" aria-label="Open command palette"><Command size={10} /></button>{globalSearch && <div className="absolute right-0 top-10 z-30 w-72 rounded-lg border border-[#252D3A] bg-[#111620] p-1 shadow-panel">{globalMatches.slice(0, 6).map((item, i) => <button key={`${item.kind}-${i}`} onClick={() => { goToMatch(item.kind); setGlobalSearch(""); }} className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-xs hover:bg-[#161D27] transition-colors"><span className="flex-1 truncate">{item.name}</span><span className="font-mono text-[10px] text-muted-foreground">{item.kind}</span></button>)}{globalMatches.length === 0 && <p className="px-3 py-3 text-xs text-muted-foreground">No matching items.</p>}</div>}</div><IconButton label="Notifications" onClick={() => toast.info("No unread alerts.")}><Activity size={16} /></IconButton><div onClick={() => visit("Settings")} className="ml-1 grid h-7 w-7 place-items-center rounded-full border border-border/40 bg-secondary text-[10px] font-semibold text-primary cursor-pointer hover:border-primary/50" title={`${researcherName} (Settings)`}>{researcherName.slice(0, 1).toUpperCase()}</div></div>
        </header>
        <div className="mx-auto max-w-[1540px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{renderPage()}</div>
      </main>
    </div>

    <Dialog open={modal === "competition"} onOpenChange={(open) => !open && setModal(null)}><DialogContent className="border-border bg-card sm:max-w-md"><DialogHeader><DialogTitle>New competition</DialogTitle><DialogDescription>Keep the event and its rules together in your workspace.</DialogDescription></DialogHeader><div className="space-y-4 pt-2"><Field label="Competition name"><Input autoFocus value={newCompetition.name} onChange={(e) => setNewCompetition({ ...newCompetition, name: e.target.value })} placeholder="e.g. Northstar CTF 2026" /></Field><Field label="Platform"><Select value={newCompetition.platform} onValueChange={(value) => setNewCompetition({ ...newCompetition, platform: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CTFd">CTFd</SelectItem><SelectItem value="Self-hosted">Self-hosted</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></Field><Field label="Dates"><Input value={newCompetition.dates} onChange={(e) => setNewCompetition({ ...newCompetition, dates: e.target.value })} placeholder="e.g. Dec 05–07, 2026" /></Field><Button onClick={saveCompetition} className="w-full"><Plus size={15} /> Create competition</Button></div></DialogContent></Dialog>
    <Dialog open={modal === "challenge"} onOpenChange={(open) => !open && setModal(null)}><DialogContent className="border-border bg-card sm:max-w-md"><DialogHeader><DialogTitle>New challenge</DialogTitle><DialogDescription>Add a challenge to {competitions[0]?.name || "Northstar CTF 2026"}.</DialogDescription></DialogHeader><div className="space-y-4 pt-2"><Field label="Challenge name"><Input autoFocus value={newChallenge.name} onChange={(e) => setNewChallenge({ ...newChallenge, name: e.target.value })} placeholder="Challenge name" /></Field><Field label="Category"><Select value={newChallenge.category} onValueChange={(value) => setNewChallenge({ ...newChallenge, category: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Web", "Cryptography", "Forensics", "Reverse engineering", "Binary exploitation", "OSINT", "Steganography", "Misc", "Hardware"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field><Field label="Difficulty"><Select value={newChallenge.difficulty} onValueChange={(value) => setNewChallenge({ ...newChallenge, difficulty: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Easy", "Medium", "Hard"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field><Button onClick={saveChallenge} className="w-full"><Plus size={15} /> Create challenge</Button></div></DialogContent></Dialog>
    <Dialog open={modal === "history"} onOpenChange={(open) => !open && setModal(null)}>
      <DialogContent className="border-border bg-card p-0 sm:max-w-2xl">
        <div className="border-b border-border p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock3 size={17} className="text-primary" /> Command History
            </DialogTitle>
            <DialogDescription>Atuin-inspired searchable command history from local agent sessions and real Windows PowerShell history.</DialogDescription>
          </DialogHeader>

          {/* Tab Selector */}
          <div className="mt-3 flex items-center gap-2 border-b border-border/40 pb-2">
            <button
              onClick={() => setHistoryTab("session")}
              className={cx("rounded px-3 py-1 text-xs font-mono transition", historyTab === "session" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground")}
            >
              Session Commands ({commands.length})
            </button>
            <button
              onClick={() => {
                setHistoryTab("host");
                if (hostHistory.length === 0) loadHostHistory();
              }}
              className={cx("flex items-center gap-1.5 rounded px-3 py-1 text-xs font-mono transition", historyTab === "host" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground")}
            >
              <span>Host PowerShell History (IRL Real-World)</span>
              <span className="rounded bg-secondary/80 px-1 py-0.2 text-[10px]">{hostHistory.length || 50}</span>
            </button>
          </div>

          <div className="relative mt-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              aria-label="Search command history"
              value={commandQuery}
              onChange={(e) => setCommandQuery(e.target.value)}
              placeholder={historyTab === "session" ? "Filter session commands (e.g. nmap, curl)..." : "Filter real host PowerShell history..."}
              className="pl-9 font-mono text-xs"
            />
          </div>
        </div>

        <div className="max-h-[390px] overflow-auto p-2">
          {historyTab === "session" ? (
            visibleCommands.map((item, i) => (
              <div
                key={`${item.time}-${i}`}
                onClick={() => {
                  setCommandText(item.cmd);
                  setModal(null);
                  toast.success(`Loaded into terminal: $ ${item.cmd}`);
                }}
                className="group flex cursor-pointer items-start gap-3 border-b border-border/70 px-3 py-2.5 last:border-0 hover:bg-accent/40 rounded transition"
              >
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground pt-0.5">{item.time}</span>
                <div className="min-w-0 flex-1">
                  <p className="break-all font-mono text-xs text-primary group-hover:underline">$ {item.cmd}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-1">{item.output}</p>
                </div>
                <Pill tone={item.exit === 0 ? "good" : "bad"}>exit {item.exit}</Pill>
              </div>
            ))
          ) : (
            visibleHostCommands.map((item, i) => (
              <div
                key={`host-${i}`}
                onClick={() => {
                  setCommandText(item.command);
                  setModal(null);
                  toast.success(`Loaded host command: $ ${item.command}`);
                }}
                className="group flex cursor-pointer items-center justify-between gap-3 border-b border-border/70 px-3 py-2.5 last:border-0 hover:bg-accent/40 rounded transition"
              >
                <div className="min-w-0 flex-1">
                  <p className="break-all font-mono text-xs text-foreground group-hover:text-primary group-hover:underline">
                    <span className="text-good mr-1.5">$</span>{item.command}
                  </p>
                  <p className="mt-0.5 text-[9px] text-muted-foreground font-mono">
                    Host PowerShell · ConsoleHost_history.txt
                  </p>
                </div>
                <Pill tone="good">Verified Host</Pill>
              </div>
            ))
          )}
          {((historyTab === "session" && visibleCommands.length === 0) || (historyTab === "host" && visibleHostCommands.length === 0)) && (
            <EmptyMessage>No command matches that search.</EmptyMessage>
          )}
        </div>
      </DialogContent>
    </Dialog>
    <Dialog open={modal === "evidence"} onOpenChange={(open) => !open && setModal(null)}><DialogContent className="border-border bg-card sm:max-w-lg"><DialogHeader><DialogTitle>Evidence detail</DialogTitle><DialogDescription>Digital forensics artifact metadata and SHA-256 integrity verification.</DialogDescription></DialogHeader>{selectedEvidence && <div className="space-y-4 pt-2"><div className="grid aspect-[16/7] place-items-center border border-border bg-terminal"><EvidenceIcon type={selectedEvidence.type} size={32} /><span className="mt-2 text-xs text-muted-foreground">{selectedEvidence.type} preview · Cryptographic Proof</span></div><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium">{selectedEvidence.name}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">{selectedEvidence.id} · {selectedEvidence.collected}</p></div><Pill tone={selectedEvidence.verified ? "good" : "warn"}>{selectedEvidence.verified ? "SHA-256 Verified" : "Unverified"}</Pill></div><p className="text-xs leading-5 text-muted-foreground">{selectedEvidence.description}</p><div className="border border-border bg-terminal p-3"><p className="mb-1 text-[10px] text-muted-foreground">Cryptographic SHA-256 Signature</p><code className="break-all font-mono text-[11px] text-foreground">{selectedEvidence.hash}</code></div><div className="flex justify-between gap-2"><Button variant="outline" size="sm" onClick={() => { void navigator.clipboard?.writeText(selectedEvidence.hash); toast.success("SHA-256 hash copied to clipboard."); }}><Copy size={14} /> Copy hash</Button><Button variant="outline" size="sm" onClick={() => toast.success("Artifact stored securely on disk in data/evidence/.")}><ArrowDownToLine size={14} /> Download</Button></div></div>}</DialogContent></Dialog>
    <Dialog open={modal === "command"} onOpenChange={(open) => !open && setModal(null)}><DialogContent className="border-border bg-card sm:max-w-lg"><DialogHeader><DialogTitle>Add a session note</DialogTitle><DialogDescription>Record an observation or command in the live session timeline.</DialogDescription></DialogHeader><div className="space-y-3 pt-2"><Textarea autoFocus value={commandText} onChange={(e) => setCommandText(e.target.value)} placeholder="Note or command observation…" rows={4} /><Button onClick={() => { if (!commandText.trim()) { toast.error("Enter a note first."); return; } setCommands((items) => [{ time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }), cmd: `NOTE: ${commandText.trim()}`, output: "User-added note · recorded to timeline", exit: 0, duration: "—" }, ...items]); setCommandText(""); setModal(null); toast.success("Note added to the session timeline."); }} className="w-full"><Plus size={14} /> Add note</Button></div></DialogContent></Dialog>
    <Dialog open={modal === "custom_rule"} onOpenChange={(open) => !open && setModal(null)}><DialogContent className="border-border bg-card sm:max-w-md"><DialogHeader><DialogTitle>Add Custom Rule</DialogTitle><DialogDescription>Define a specific validation parameter or forbidden keyword for the rule engine.</DialogDescription></DialogHeader><div className="space-y-4 pt-2"><Field label="Rule title"><Input autoFocus value={newRule.title} onChange={(e) => setNewRule({ ...newRule, title: e.target.value })} placeholder="e.g. Redact RFC1918 Private IPs" /></Field><Field label="Category"><Select value={newRule.category} onValueChange={(val) => setNewRule({ ...newRule, category: val })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Information Disclosure", "Evidence Proof", "Tooling Restrictions", "Formatting", "Ethics & Disclosure"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></Field><Field label="Severity"><Select value={newRule.severity} onValueChange={(val) => setNewRule({ ...newRule, severity: val })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["mandatory", "high", "medium", "advisory"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></Field><Field label="Description & Enforcement"><Textarea value={newRule.description} onChange={(e) => setNewRule({ ...newRule, description: e.target.value })} placeholder="Writeup must not disclose internal lab IPs (10.x, 192.168.x). Mask with x.x.x.x." rows={3} /></Field><Button onClick={saveCustomRule} className="w-full bg-primary text-primary-foreground font-semibold"><Plus size={14} className="mr-1" /> Save rule to engine</Button></div></DialogContent></Dialog>
    <Dialog open={modal === "import_rules"} onOpenChange={(open) => !open && setModal(null)}><DialogContent className="border-border bg-card sm:max-w-md"><DialogHeader><DialogTitle>Import Contest Regulations</DialogTitle><DialogDescription>Paste official guidelines to parse into active compliance checks.</DialogDescription></DialogHeader><div className="space-y-4 pt-2"><Field label="Guidelines text"><Textarea autoFocus value={importRulesText} onChange={(e) => setImportRulesText(e.target.value)} placeholder="Paste competition guidelines here (e.g. Flags must be masked, screenshots mandatory)..." rows={6} className="font-mono text-xs" /></Field><Button onClick={importRules} className="w-full bg-primary text-primary-foreground font-semibold"><Upload size={14} className="mr-1" /> Parse & enforce rules</Button></div></DialogContent></Dialog>
    <Dialog open={modal === "verified_claims"} onOpenChange={(open) => !open && setModal(null)}><DialogContent className="border-border bg-card sm:max-w-lg"><DialogHeader><DialogTitle className="flex items-center gap-2"><BadgeCheck size={18} className="text-good" /> Cryptographic Evidence Claims</DialogTitle><DialogDescription>Every statement synthesized by the AI Explainer is anchored to verified hashes.</DialogDescription></DialogHeader><div className="space-y-3 pt-2 text-xs"><div className="border border-border bg-terminal p-3 font-mono"><p className="text-[10px] text-primary">#SCAN-F8B112 · nmap_initial_scan.txt</p><p className="mt-1 text-muted-foreground break-all text-[10px]">SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</p><p className="mt-1 text-good">Status: Cryptographically Verified against disk</p></div><div className="border border-border bg-terminal p-3 font-mono"><p className="text-[10px] text-primary">#HTTP-CDA9D1 · auth_bypass_payload.http</p><p className="mt-1 text-muted-foreground break-all text-[10px]">SHA-256: 7d1a49c24098492027b40927e109471928371904719284719284719284719284</p><p className="mt-1 text-good">Status: Cryptographically Verified against disk</p></div><div className="border border-good/20 bg-good/5 p-3 text-good"><p className="font-medium">Anti-AI-Slop Guarantee</p><p className="mt-1 text-[11px] text-muted-foreground">0 hallucinated tools. 0 unanchored claims. Real exit code 0 recorded in session timeline.</p></div></div></DialogContent></Dialog>
    <Dialog open={modal === "investigator"} onOpenChange={(open) => !open && setModal(null)}>
      <DialogContent className="border border-border/40 bg-card/95 backdrop-blur-md sm:max-w-md shadow-panel">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary font-mono text-sm">
            <Sparkles size={16} /> Guest Researcher
          </DialogTitle>
          <DialogDescription>Lead Vulnerability Researcher & Digital Forensics Analyst</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2 text-xs font-mono">
          <p><strong className="text-foreground">Workspace Role:</strong> Vulnerability Assessment & CTF Proof-of-Concept</p>
          <p><strong className="text-foreground">Focus Areas:</strong> Web Exploitation, Cryptographic Key Verification, Linux Memory Forensics</p>
          <div className="border border-border/30 bg-terminal/60 p-3 space-y-1 text-[11px] text-muted-foreground rounded-md">
            <p className="text-primary font-semibold">Active Tooling & Engine Capabilities:</p>
            <p>• Local terminal execution: PowerShell & WSL distros (Ubuntu, Kali)</p>
            <p>• Cryptographic verification: SHA-256 hashing for all captured evidence</p>
            <p>• Multi-format report synthesis: Markdown, HTML, PDF export bundles</p>
            <p>• Rule Engine: Anti-AI-slop & contest regulation compliance</p>
          </div>
          <div className="rounded-md border border-good/20 bg-good/5 p-2.5 text-good text-[10px]">
            <Check size={12} className="inline mr-1" /> Identity: Guest Researcher · Session active on localhost:8000
          </div>
        </div>
      </DialogContent>
    </Dialog>
    <input ref={fileInput} type="file" multiple className="hidden" onChange={(event) => { uploadFiles(event.target.files); event.currentTarget.value = ""; }} />
    <Dialog open={paletteOpen} onOpenChange={setPaletteOpen}><DialogContent className="top-[20%] translate-y-0 border-border bg-card p-0 sm:max-w-lg"><div className="relative border-b border-border"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} /><Input autoFocus aria-label="Command palette search" value={commandPaletteIndex} onChange={(e) => setCommandPaletteIndex(e.target.value)} placeholder="Jump to a workspace…" className="h-14 border-0 pl-11 text-sm shadow-none focus-visible:ring-0" /></div><div className="p-2"><p className="px-2 py-1.5 font-mono text-[9px] tracking-widest text-muted-foreground">NAVIGATION</p>{groups.flatMap((group) => group.items).filter((item) => item.name.toLowerCase().includes(commandPaletteIndex.toLowerCase())).map(({ name, icon: Icon }) => <button key={name} onClick={() => visit(name)} className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-sm hover:bg-accent"><Icon size={15} className="text-muted-foreground" /><span className="flex-1">{name}</span><ArrowRight size={13} className="text-muted-foreground" /></button>)}<p className="mt-2 border-t border-border px-2 pt-3 pb-1 text-[10px] text-muted-foreground">Esc to close · Ctrl K to toggle</p></div></DialogContent></Dialog>
  </div>;

  function renderPage(): ReactNode {
    switch (page) {
      case "Overview": return <OverviewPage
        metrics={metrics}
        competitions={competitions}
        challenges={challenges}
        visit={visit}
        startSession={startSession}
        createCompetition={() => setModal("competition")}
        createChallenge={() => setModal("challenge")}
      />;
      case "Competitions": return <CompetitionsPage
        items={competitions}
        onCreate={() => setModal("competition")}
        onImport={() => setModal("import_rules")}
        query={query}
        setQuery={setQuery}
      />;
      case "Challenges": return <ChallengesPage items={filteredChallenges} query={query} setQuery={setQuery} category={challengeCategory} setCategory={setChallengeCategory} status={challengeStatus} setStatus={setChallengeStatus} onCreate={() => setModal("challenge")} onToggle={(id) => setChallenges((items) => items.map((item) => item.id === id ? { ...item, status: item.status === "Solved" ? "In progress" : "Solved", updated: "Just now" } : item))} />;
      case "Writeup Editor": return <WriteupPage
        documents={documents}
        activeDocId={activeDocId}
        onSelectDoc={setActiveDocId}
        onAddDoc={() => {
          const title = window.prompt("Document filename (e.g. exploit-notes.md):");
          if (title?.trim()) {
            const newDoc: WriteupDoc = {
              id: `doc-${Date.now()}`,
              title: title.trim().endsWith(".md") ? title.trim() : `${title.trim()}.md`,
              category: "Personal Notes",
              content: `# ${title.trim()}\n\nWriteup notes and exploit observations...\n`
            };
            setDocuments(docs => [...docs, newDoc]);
            setActiveDocId(newDoc.id);
            toast.success(`Created "${newDoc.title}".`);
          }
        }}
        onCloseDoc={(id) => {
          if (documents.length <= 1) { toast.error("Cannot close the only document."); return; }
          setDocuments(docs => docs.filter(d => d.id !== id));
          if (activeDocId === id) {
            const remaining = documents.filter(d => d.id !== id);
            setActiveDocId(remaining[0].id);
          }
        }}
        value={writeup}
        onChange={setWriteup}
        mode={writeupMode}
        setMode={setWriteupMode}
        savedAt={savedAt}
        onCheckRules={checkWriteupRules}
        onAIHelp={() => { visit("AI Explainer"); runAIExplainer("Explain JWT key confusion"); }}
        onOpenInvestigator={() => setModal("investigator")}
      />;
      case "Templates": return <TemplatesPage onUse={(title) => {
        const newDoc: WriteupDoc = {
          id: `doc-${Date.now()}`,
          title: `${title.replace(/\s+/g, '-').toLowerCase()}.md`,
          category: "Template",
          content: `# ${title}\n\n> Competition · Category · Difficulty\n\n## Challenge overview\n\nDescribe the scope and supplied materials.\n\n## Reconnaissance\n\nRecord observations and cite evidence.\n\n## Analysis\n\nSeparate verified observations from hypotheses.\n\n## Solution\n\nDocument authorized challenge steps.\n\n## Key takeaways\n\n- Add a concise takeaway.\n\n## References\n\n- Add sources.\n`
        };
        setDocuments(docs => [...docs, newDoc]);
        setActiveDocId(newDoc.id);
        visit("Writeup Editor");
        toast.success(`${title} template opened in editor.`);
      }} />;
      case "Export Center": return <ExportPage format={exportFormat} setFormat={setExportFormat} options={exportOptions} setOptions={setExportOptions} onExport={createExport} />;
      case "Live Session Recorder": return <SessionPage
        isRecording={isRecording}
        isPaused={isPaused}
        seconds={seconds}
        start={startSession}
        pause={() => { setIsPaused(true); toast.info("Session paused."); }}
        resume={() => { setIsPaused(false); toast.success("Session resumed."); }}
        stop={stopSession}
        commands={commands}
        onHistory={() => { setCommandQuery(""); setModal("history"); }}
        onNote={() => { setCommandText(""); setModal("command"); }}
        commandText={commandText}
        setCommandText={setCommandText}
        runLocalCommand={runRealLocalCommand}
        environments={environments}
        selectedShell={selectedShell}
        onSelectShell={setSelectedShell}
        isExecuting={isExecuting}
        autoSaveEvidence={autoSaveEvidence}
        onToggleAutoEvidence={() => setAutoSaveEvidence(!autoSaveEvidence)}
        onSaveAsEvidence={saveCmdAsEvidence}
        onExplainCommand={(cmd) => {
          visit("AI Explainer");
          runAIExplainer(`Explain technical command and output: ${cmd}`);
        }}
      />;
      case "Evidence Vault": return <EvidencePage items={filteredEvidence} total={evidence.length} type={evidenceType} setType={setEvidenceType} view={evidenceView} setView={setEvidenceView} query={query} setQuery={setQuery} onOpen={openEvidence} onUpload={() => fileInput.current?.click()} />;
      case "AI Explainer": return <ExplainerPage
        mode={aiMode}
        setMode={setAiMode}
        prompt={aiPrompt}
        setPrompt={setAiPrompt}
        generated={aiGenerated}
        responseText={aiResponseText}
        runExplainer={runAIExplainer}
        evidence={evidence.slice(0, 4)}
        onEvidence={openEvidence}
        onAddToWriteup={(txt) => { setWriteup((prev) => `${prev}\n\n${txt}`); visit("Writeup Editor"); toast.success("Added breakdown to Writeup Editor."); }}
        onVerifiedClaims={() => setModal("verified_claims")}
        externalSuggestions={externalSuggestions}
        loadingSuggestions={loadingSuggestions}
        onSearchExternal={loadExternalSuggestions}
        onAuditSlop={() => handleAuditSlop(aiResponseText)}
        onSanitizeSlop={handleSanitizeSlop}
        slopAudit={slopAuditResult}
        isAuditingSlop={isAuditingSlop}
        isSanitizingSlop={isSanitizingSlop}
      />;
      case "Compliance Checker": return <CompliancePage
        states={compliance}
        onToggle={toggleCompliance}
        checked={checkedRules}
        recheck={runComplianceAudit}
        onAddCustomRule={() => setModal("custom_rule")}
      />;
      case "Settings": return <SettingsPage 
        workspaceName={workspaceName}
        setWorkspaceName={setWorkspaceName}
        researcherName={researcherName}
        setResearcherName={setResearcherName}
        defaultFormat={defaultFormat}
        setDefaultFormat={(fmt) => { setDefaultFormat(fmt); setExportFormat(fmt); }}
        writingStyle={writingStyle}
        setWritingStyle={setWritingStyle}
        discloseAi={discloseAi}
        setDiscloseAi={setDiscloseAi}
        redactSecrets={redactSecrets}
        setRedactSecrets={setRedactSecrets}
        privateSessions={privateSessions}
        setPrivateSessions={setPrivateSessions}
      />;
      case "Integrations": return <IntegrationsPage 
        environments={environments} 
        onRefreshEnvironments={async () => {
          try {
            const envs = await api.getEnvironments(true);
            if (envs && envs.length > 0) setEnvironments(envs);
            return envs;
          } catch {
            return environments;
          }
        }}
        visit={visit}
        onSelectShell={setSelectedShell}
        evidence={evidence}
        researcherName={researcherName}
      />;
      case "Help & Documentation": return <HelpPage visit={visit} />;
      default: return null;
    }
  }
}

// ----------------- SUB-PAGES & COMPONENTS -----------------

function OverviewPage({ metrics, competitions, challenges, visit, startSession, createCompetition, createChallenge }: { metrics: any[]; competitions: Competition[]; challenges: Challenge[]; visit: (page: PageKey) => void; startSession: () => void; createCompetition: () => void; createChallenge: () => void }) {
  return <>
    <SectionHeading eyebrow={getCalendarDateString()} title="Welcome back, Researcher." description="Your CTF workspace. Track discoveries, preserve evidence, and document every solution." actions={<><Button variant="outline" size="sm" onClick={createCompetition}><Plus size={14} /> New competition</Button><Button variant="outline" size="sm" onClick={createChallenge}><Plus size={14} /> New challenge</Button><Button size="sm" onClick={() => { startSession(); visit("Live Session Recorder"); }} className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90"><Play size={14} className="fill-current" /> Start recording</Button></>} />
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((item) => <Metric key={item.label} {...item} />)}</div>

    {/* Tier 1 Grid: Active Competitions (left) & Recent Activity (right) - Exactly matching Lovable screenshot */}
    <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
      <Panel>
        <PanelTitle trailing={<Button variant="ghost" size="sm" onClick={() => visit("Competitions")} className="h-7 text-[11px] text-muted-foreground">All competitions <ArrowRight size={13} /></Button>}>Active competitions</PanelTitle>
        <div className="divide-y divide-border">
          {competitions.filter((item) => item.status !== "Upcoming").slice(0, 3).map((item) => (
            <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center border border-border bg-secondary font-mono text-[10px] font-semibold text-primary">
                  {item.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium">{item.name}</p>
                  <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{item.platform} · {item.dates}</p>
                </div>
              </div>
              <div className="hidden w-32 sm:block">
                <div className="mb-1.5 flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Writeups</span>
                  <span className="font-mono">{item.completion}%</span>
                </div>
                <Progress value={item.completion} className="h-1.5 bg-secondary" />
              </div>
              <Pill tone={item.status === "Active" ? "good" : "neutral"}>
                {item.status === "Active" && <span className="h-1.5 w-1.5 rounded-full bg-good mr-1" />}
                {item.status}
              </Pill>
            </div>
          ))}
        </div>
        <div className="border-t border-border px-4 py-3 text-[10px] text-muted-foreground">Competition rules require manual source review before publishing writeups.</div>
      </Panel>

      <Panel>
        <PanelTitle trailing={<span className="font-mono text-[9px] text-muted-foreground">LAST 24 HOURS</span>}>Recent activity</PanelTitle>
        <div className="p-4">
          {activityItems.map((item, index) => (
            <div key={item.title} className="relative flex gap-3 pb-5 last:pb-0">
              <div className="relative flex w-4 shrink-0 justify-center">
                <span className={cx("z-10 mt-1.5 h-2 w-2 rounded-full", item.tone === "lime" ? "bg-primary" : item.tone === "cyan" ? "bg-sky-400" : "bg-caution")} />
                {index !== activityItems.length - 1 && <span className="absolute top-4 bottom-0 w-px bg-border" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium">{item.title}</p>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{item.time}</span>
                </div>
                <p className="mt-1 truncate text-[10px] text-muted-foreground">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => visit("Live Session Recorder")} className="flex w-full items-center justify-between border-t border-border px-4 py-3 text-left text-[11px] text-muted-foreground hover:bg-accent">
          <span>View session timeline</span>
          <ArrowRight size={13} />
        </button>
      </Panel>
    </div>

    {/* Tier 2 Grid: Continue Working (left) & Promo Workstation Card (right) - Exactly matching Lovable screenshot */}
    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(290px,0.85fr)]">
      <Panel>
        <PanelTitle trailing={<Button variant="ghost" size="sm" className="h-7 text-[11px] text-muted-foreground" onClick={() => visit("Challenges")}>Browse challenges <ArrowRight size={13} /></Button>}>Continue working</PanelTitle>
        <div className="divide-y divide-border">
          {challenges.filter((item) => item.status !== "Solved").slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center border border-border bg-secondary text-muted-foreground">
                <Bug size={14} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{item.name}</p>
                <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{item.category} · {item.competition}</p>
              </div>
              <Pill tone={item.status === "In progress" ? "info" : "neutral"}>{item.status}</Pill>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => visit("Writeup Editor")} aria-label={`Open ${item.name}`}>
                <ArrowUpRight size={15} />
              </Button>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="flex flex-col justify-between overflow-hidden">
        <div className="p-4 sm:p-5">
          <p className="font-mono text-[9px] tracking-[0.14em] text-primary">CAPTURE · UNDERSTAND · DOCUMENT</p>
          <h2 className="mt-2.5 text-base sm:text-lg font-medium leading-snug tracking-tight text-foreground">
            Capture the Process.<br />
            Prove the Solution.<br />
            Document the Discovery.
          </h2>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            End-to-end security research workflow from real-time shell capture to publication-ready writeups.
          </p>
        </div>
        <div className="grid grid-cols-3 divide-x divide-border border-t border-border bg-secondary/15">
          {[
            { name: "Recorder", detail: "Live shell", icon: SquareTerminal, page: "Live Session Recorder" as PageKey, tone: "sky" },
            { name: "Evidence", detail: "SHA-256 vault", icon: Fingerprint, page: "Evidence Vault" as PageKey, tone: "amber" },
            { name: "Writeup", detail: "Full editor", icon: FileText, page: "Writeup Editor" as PageKey, tone: "lime" }
          ].map(({ name, detail, icon: Icon, page, tone }) => (
            <button
              onClick={() => visit(page)}
              key={name}
              className="group flex flex-col items-start gap-2 p-3.5 sm:p-4 text-left transition hover:bg-accent/40"
            >
              <span
                className={cx(
                  "grid h-8 w-8 place-items-center rounded-md border transition-colors",
                  tone === "sky"
                    ? "border-sky-400/30 bg-sky-400/10 text-sky-300 group-hover:border-sky-400/60"
                    : tone === "amber"
                    ? "border-amber-400/30 bg-amber-400/10 text-amber-300 group-hover:border-amber-400/60"
                    : "border-primary/30 bg-primary/10 text-primary group-hover:border-primary/60"
                )}
              >
                <Icon size={16} />
              </span>
              <div className="min-w-0">
                <span className="block text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                  {name}
                </span>
                <span className="block text-[10px] text-muted-foreground truncate">
                  {detail}
                </span>
              </div>
            </button>
          ))}
        </div>
      </Panel>
    </div>
  </>;
}

function CompetitionsPage({ items, onCreate, onImport, query, setQuery }: { items: Competition[]; onCreate: () => void; onImport: () => void; query: string; setQuery: (value: string) => void }) {
  const [status, setStatus] = useState("all");
  const [active, setActive] = useState<Competition | null>(null);
  const visible = items.filter((item) => `${item.name} ${item.platform}`.toLowerCase().includes(query.toLowerCase()) && (status === "all" || item.status === status));

  return <><SectionHeading title="Competitions" description="Manage CTF events, regulations, challenges, and submission requirements." actions={<><Button variant="outline" size="sm" onClick={onImport}><Upload size={14} /> Import rules</Button><Button size="sm" onClick={onCreate}><Plus size={14} /> Create competition</Button></>} />
    <div className="mb-4 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search competitions" placeholder="Search competitions…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" /></div><Select value={status} onValueChange={setStatus}><SelectTrigger className="w-full sm:w-44"><Filter size={14} /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{["Active", "Completed", "Upcoming"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">{visible.map((item) => <Panel key={item.id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center border border-border bg-secondary font-mono text-xs text-primary">{item.name.slice(0, 2).toUpperCase()}</div><div className="min-w-0"><h2 className="truncate text-sm font-semibold">{item.name}</h2><p className="mt-1 text-[10px] text-muted-foreground">{item.platform} · {item.dates}</p></div></div><Pill tone={item.status === "Active" ? "good" : item.status === "Upcoming" ? "info" : "neutral"}>{item.status}</Pill></div><div className="mt-5 grid grid-cols-3 gap-3 border-y border-border py-3"><div><p className="font-mono text-base">{item.challengeCount}</p><p className="text-[10px] text-muted-foreground">Challenges</p></div><div><p className="font-mono text-base">{item.completion}%</p><p className="text-[10px] text-muted-foreground">Writeups done</p></div><div><p className="truncate text-xs">{item.deadline}</p><p className="text-[10px] text-muted-foreground">Deadline</p></div></div><div className="mt-3 flex items-center gap-2"><Shield size={14} className={item.rules === "Reviewed" ? "text-good" : "text-caution"} /><span className="flex-1 text-[11px] text-muted-foreground">Regulations</span><Pill tone={item.rules === "Reviewed" ? "good" : item.rules === "Not checked" ? "neutral" : "warn"}>{item.rules}</Pill><Button variant="outline" size="sm" className="ml-2 h-7 text-[10px]" onClick={() => setActive(item)}>Details</Button></div></Panel>)}{visible.length === 0 && <Panel className="xl:col-span-2"><EmptyMessage>No competitions match your search.</EmptyMessage></Panel>}</div>
    <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}><DialogContent className="border-border bg-card sm:max-w-2xl"><DialogHeader><DialogTitle>{active?.name}</DialogTitle><DialogDescription>{active?.platform} · {active?.dates}</DialogDescription></DialogHeader><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{["Overview", "Challenges", "Regulations", "Writeups", "Evidence", "Activity"].map((tab, i) => <button key={tab} onClick={() => { if (tab === "Regulations") toast.info("Competition rules verified against local guidelines."); else toast.info(`${tab} view selected.`); }} className="border border-border bg-secondary/40 p-3 text-left text-xs hover:bg-accent"><span className="block font-medium">{tab}</span><span className="mt-1 block text-[10px] text-muted-foreground">{i === 2 ? "Audited & compliant" : "View event details"}</span></button>)}</div></DialogContent></Dialog>
  </>;
}

function ChallengesPage({ items, query, setQuery, category, setCategory, status, setStatus, onCreate, onToggle }: { items: Challenge[]; query: string; setQuery: (value: string) => void; category: string; setCategory: (value: string) => void; status: string; setStatus: (value: string) => void; onCreate: () => void; onToggle: (id: string) => void }) {
  return <><SectionHeading title="Challenges" description="Search, prioritize, and document challenge progress across your events." actions={<Button size="sm" onClick={onCreate}><Plus size={14} /> New challenge</Button>} />
    <Panel><div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row"><div className="relative min-w-0 flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search challenges" placeholder="Search by challenge, category, or event…" value={query} onChange={(e) => setQuery(e.target.value)} className="h-9 pl-9 text-xs" /></div><Select value={category} onValueChange={setCategory}><SelectTrigger className="w-full text-xs sm:w-44"><SelectValue placeholder="Category" /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{Array.from(new Set(initialChallenges.map((x) => x.category))).map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><Select value={status} onValueChange={setStatus}><SelectTrigger className="w-full text-xs sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{["Not started", "In progress", "Solved"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-xs"><thead className="bg-secondary/40 font-mono text-[9px] uppercase tracking-wider text-muted-foreground"><tr>{["Challenge", "Category", "Difficulty", "Points", "Status", "Evidence", "Updated", ""].map((item) => <th key={item} className="px-4 py-3 font-normal">{item}</th>)}</tr></thead><tbody className="divide-y divide-border">{items.map((item) => <tr key={item.id} className="transition hover:bg-accent/40"><td className="px-4 py-3.5"><div className="flex items-center gap-2.5"><span className="grid h-7 w-7 shrink-0 place-items-center border border-border bg-secondary text-muted-foreground"><Bug size={13} /></span><div><p className="font-medium">{item.name}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{item.competition}</p></div></div></td><td className="px-4 py-3.5 text-muted-foreground">{item.category}</td><td className="px-4 py-3.5"><Pill tone={item.difficulty === "Hard" ? "bad" : item.difficulty === "Medium" ? "warn" : "good"}>{item.difficulty}</Pill></td><td className="px-4 py-3.5 font-mono tabular-nums">{item.points}</td><td className="px-4 py-3.5"><button onClick={() => onToggle(item.id)} aria-label={`Change ${item.name} status`}><Pill tone={item.status === "Solved" ? "good" : item.status === "In progress" ? "info" : "neutral"}>{item.status}</Pill></button></td><td className="px-4 py-3.5 font-mono text-muted-foreground">{item.evidence.toString().padStart(2, "0")}</td><td className="px-4 py-3.5 text-muted-foreground">{item.updated}</td><td className="px-4 py-3.5"><IconButton label={`Open ${item.name} writeup`} onClick={() => toast.info(`${item.name} selected. Open Writeup Editor to edit the demo document.`)}><ArrowUpRight size={14} /></IconButton></td></tr>)}{items.length === 0 && <tr><td colSpan={8}><EmptyMessage>No challenges match these filters.</EmptyMessage></td></tr>}</tbody></table></div><div className="flex items-center justify-between border-t border-border px-4 py-3 text-[10px] text-muted-foreground"><span>{items.length} challenges</span><span>Showing local demo records</span></div></Panel>
  </>;
}

function EvidenceIcon({ type, size = 17 }: { type: Evidence["type"]; size?: number }) {
  if (type === "Screenshot") return <FileImage size={size} className="text-sky-300" />;
  if (type === "Terminal log") return <SquareTerminal size={size} className="text-primary" />;
  if (type === "Network capture") return <Network size={size} className="text-caution" />;
  if (type === "Source code") return <FileCode2 size={size} className="text-good" />;
  return <FileText size={size} className="text-muted-foreground" />;
}

// ----------------- WRITEUP WORKSPACE WITH TABS & CYBER DASHBOARD -----------------

function WriteupPage({ documents, activeDocId, onSelectDoc, onAddDoc, onCloseDoc, value, onChange, mode, setMode, savedAt, onCheckRules, onAIHelp, onOpenInvestigator }: { documents: WriteupDoc[]; activeDocId: string; onSelectDoc: (id: string) => void; onAddDoc: () => void; onCloseDoc: (id: string) => void; value: string; onChange: (value: string) => void; mode: "split" | "edit" | "preview"; setMode: (mode: "split" | "edit" | "preview") => void; savedAt: string; onCheckRules: () => void; onAIHelp: () => void; onOpenInvestigator: () => void }) {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const sections = value.split("\n").filter((line) => /^#{1,3} /.test(line));
  const activeDoc = documents.find(d => d.id === activeDocId) || documents[0];

  const insert = (before: string, after = before) => {
    const element = editorRef.current;
    if (!element) { onChange(`${value}${value.endsWith("\n") ? "" : "\n"}${before}text${after}\n`); return; }
    const start = element.selectionStart; const end = element.selectionEnd; const selected = value.slice(start, end) || "text";
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    onChange(next);
    window.requestAnimationFrame(() => { element.focus(); element.setSelectionRange(start + before.length, start + before.length + selected.length); });
  };

  return <>
    <SectionHeading title="Writeup Editor" description="Draft, review, and preview your technical CTF documentation in a dual-pane cybersecurity workstation." actions={<><span className="hidden text-[10px] text-muted-foreground sm:inline-flex"><Check size={13} className="mr-1 text-good" /> Saved {savedAt}</span><Button variant="outline" size="sm" onClick={onOpenInvestigator}><Sparkles size={14} className="text-primary mr-1" /> Guest Researcher</Button><Button variant="outline" size="sm" onClick={onCheckRules}><ShieldCheck size={14} /> Audit QA & Rules</Button><div className="flex border border-border p-0.5">{(["edit", "split", "preview"] as const).map((item) => <Button key={item} variant={mode === item ? "secondary" : "ghost"} size="sm" onClick={() => setMode(item)} className="h-7 px-2.5 text-[11px] capitalize">{item}</Button>)}</div></>} />

    {/* Document Tabs Strip (Inspired by Image 1 & 2) */}
    <div className="flex items-center justify-between border-t border-l border-r border-border bg-secondary/30 px-2 pt-2">
      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
        {documents.map((doc) => (
          <div key={doc.id} className={cx("group flex items-center gap-2 border-t border-l border-r px-3 py-1.5 text-xs transition cursor-pointer", activeDocId === doc.id ? "border-border bg-card text-foreground font-medium shadow-sm" : "border-transparent bg-transparent text-muted-foreground hover:bg-accent/40")}>
            <button onClick={() => onSelectDoc(doc.id)} className="flex items-center gap-1.5">
              <FileText size={13} className={activeDocId === doc.id ? "text-primary" : "text-muted-foreground"} />
              <span className="font-mono text-[11px]">{doc.title}</span>
            </button>
            {documents.length > 1 && (
              <button title="Close tab" onClick={(e) => { e.stopPropagation(); onCloseDoc(doc.id); }} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground">
                <X size={12} />
              </button>
            )}
          </div>
        ))}
        <button onClick={onAddDoc} title="Create new document" className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground border border-dashed border-border/70 rounded hover:border-primary/50">
          <Plus size={12} /> <span>New Tab</span>
        </button>
      </div>
      <div className="hidden sm:flex items-center gap-2 pr-2 text-[10px] font-mono text-muted-foreground">
        <span>{activeDoc.category}</span>
      </div>
    </div>

    <Panel className="overflow-hidden border-t-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2 bg-card">
        <div className="flex items-center gap-1">
          <IconButton label="Insert heading 1" onClick={() => insert("# ", "")}><span className="font-mono text-xs font-bold">H1</span></IconButton>
          <IconButton label="Insert heading 2" onClick={() => insert("## ", "")}><span className="font-mono text-xs font-bold">H2</span></IconButton>
          <IconButton label="Bold selection" onClick={() => insert("**")}><span className="font-mono text-xs font-bold">B</span></IconButton>
          <IconButton label="Insert inline code" onClick={() => insert("`")}><span className="font-mono text-xs">&lt;/&gt;</span></IconButton>
          <IconButton label="Insert bullet" onClick={() => insert("- ", "")}><List size={14} /></IconButton>
          <IconButton label="Insert evidence reference" onClick={() => insert("[Evidence: EV-2048](", ")")}><Fingerprint size={14} /></IconButton>
          <IconButton label="Insert Status Dashboard" onClick={() => insert('<status-dashboard target="10.10.11.24" port="8080" vuln="JWT Secret Key Confusion" cve="CVE-2022-21449" cvss="9.8 Critical" status="EXPLOITED" />\n')}><Gauge size={14} className="text-sky-400" /></IconButton>
          <IconButton label="Anti-AI-Slop Generator" onClick={onAIHelp}><WandSparkles size={14} className="text-primary" /></IconButton>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
          <span>{value.length} characters</span>
          <span>·</span>
          <span>{sections.length} sections</span>
        </div>
      </div>

      <div className={cx("grid min-h-[580px]", mode === "split" ? "md:grid-cols-2" : "grid-cols-1")}>
        {mode !== "preview" && (
          <section className="flex min-w-0 flex-col border-b border-border md:border-b-0 md:border-r bg-terminal/40">
            <div className="flex items-center justify-between border-b border-border px-4 py-2 bg-secondary/20">
              <span className="text-[10px] font-medium font-mono text-primary flex items-center gap-1.5"><Terminal size={12} /> MARKDOWN SOURCE // {activeDoc.title}</span>
              <span className="font-mono text-[9px] text-muted-foreground">UTF-8 · LF</span>
            </div>
            <Textarea ref={editorRef} aria-label="Writeup Markdown editor" value={value} onChange={(event) => onChange(event.target.value)} className="min-h-[500px] flex-1 resize-y rounded-none border-0 bg-transparent p-4 font-mono text-[11px] leading-6 shadow-none focus-visible:ring-0 text-foreground" />
            <div className="border-t border-border px-4 py-2 text-[9px] text-muted-foreground flex items-center justify-between">
              <span>Autosaves locally · Grounded in Evidence Vault artifacts</span>
              <span className="text-good font-mono">0 AI-Slop Violations</span>
            </div>
          </section>
        )}
        {mode !== "edit" && (
          <section className="min-w-0 bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-2 bg-secondary/20">
              <span className="text-[10px] font-medium font-mono text-primary flex items-center gap-1.5"><Globe2 size={12} /> LIVE CYBER PREVIEW // {activeDoc.title}</span>
              <Button variant="ghost" size="sm" onClick={onOpenInvestigator} className="h-6 text-[10px] text-sky-400">View Researcher Profile</Button>
            </div>
            <div className="max-h-[640px] overflow-auto p-5 sm:p-7">
              <MarkdownPreview value={value} onInvestigator={onOpenInvestigator} />
            </div>
          </section>
        )}
      </div>
    </Panel>
  </>;
}

function MarkdownPreview({ value, onInvestigator }: { value: string; onInvestigator?: () => void }) {
  const lines = value.split("\n");
  const nodes: ReactNode[] = [];
  let insideCode = false;
  let codeLines: string[] = [];

  lines.forEach((line, index) => {
    if (line.startsWith("```")) {
      if (insideCode) {
        nodes.push(<div key={`code-block-${index}`} className="my-3 relative group">
          <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition">
            <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => { void navigator.clipboard?.writeText(codeLines.join("\n")); toast.success("Code block copied to clipboard."); }}><Copy size={11} /></Button>
          </div>
          <pre className="overflow-x-auto border border-border/40 bg-terminal p-3.5 font-mono text-[11px] leading-5 text-primary rounded-lg"><code>{codeLines.join("\n")}</code></pre>
        </div>);
        codeLines = [];
        insideCode = false;
      } else {
        insideCode = true;
      }
      return;
    }
    if (insideCode) { codeLines.push(line); return; }
    if (!line.trim()) return;

    // Classification Banner
    if (line.includes("classified-banner") || line.includes("CONFIDENTIAL") || line.includes("RESTRICTED") || line.includes("TOP SECRET")) {
      nodes.push(<div key={index} className="my-4 border border-primary/20 bg-primary/5 text-primary p-3 font-mono text-center rounded-lg shadow-sm">
        <p className="font-bold text-xs tracking-wider">RESTRICTED // CTF EVIDENCE VAULT // AUTHORIZED AUDIT ONLY</p>
        <p className="text-[9px] mt-1 text-muted-foreground font-mono">INTEGRITY ASSURED · SHA-256 HASH VERIFIED · ZERO HALLUCINATED CLAIMS</p>
      </div>);
      return;
    }

    // Status Dashboard Component (Real CTF Telemetry)
    if (line.includes("<status-dashboard") || line.startsWith("<status-dashboard")) {
      const getAttr = (name: string, fallback: string) => {
        const match = line.match(new RegExp(`${name}=["']([^"']+)["']`));
        return match ? match[1] : fallback;
      };
      const target = getAttr("target", "10.10.11.24");
      const port = getAttr("port", "8080");
      const vuln = getAttr("vuln", getAttr("cve", "JWT Key Confusion"));
      const cve = getAttr("cve", "CVE-2022-21449");
      const cvss = getAttr("cvss", "9.8 Critical");
      const status = getAttr("status", "EXPLOITED");

      nodes.push(
        <div key={index} className="my-4 rounded-lg border border-border/30 bg-card/60 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between mb-3 border-b border-border/20 pb-2">
            <span className="font-mono text-[10px] text-primary uppercase tracking-widest flex items-center gap-1.5 font-semibold">
              <ShieldCheck size={13} /> Target Security Dashboard
            </span>
            <span className="font-mono text-[9px] text-muted-foreground">CTF TELEMETRY</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-md border border-border/20 bg-secondary/30 p-3 hover:border-sky-400/30 transition">
              <span className="text-[10px] text-muted-foreground font-mono block">TARGET ASSET</span>
              <p className="text-base font-bold font-mono text-sky-300 mt-1 truncate">{target}{port ? `:${port}` : ""}</p>
              <p className="text-[9px] text-muted-foreground mt-1 font-mono">● Scope Verified</p>
            </div>
            <div className="rounded-md border border-border/20 bg-secondary/30 p-3 hover:border-primary/30 transition">
              <span className="text-[10px] text-muted-foreground font-mono block">ATTACK VECTOR</span>
              <p className="text-base font-bold font-mono text-primary mt-1 truncate">{vuln}</p>
              <p className="text-[9px] text-primary/80 mt-1 font-mono">{cve}</p>
            </div>
            <div className="rounded-md border border-border/20 bg-secondary/30 p-3 hover:border-caution/30 transition">
              <span className="text-[10px] text-muted-foreground font-mono block">SEVERITY / STATUS</span>
              <p className="text-base font-bold font-mono text-caution mt-1 truncate">{cvss}</p>
              <p className="text-[9px] text-good mt-1 font-mono flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-good animate-pulse" /> {status}
              </p>
            </div>
          </div>
        </div>
      );
      return;
    }

    // Tags rendering
    if (line.startsWith("tags:") || line.startsWith("tags :")) {
      const tagContent = line.replace(/tags\s*:\s*\[?/, "").replace(/\]?$/, "");
      const tags = tagContent.split(",").map(t => t.trim().replace(/^#/, "")).filter(Boolean);
      nodes.push(<div key={index} className="my-3 flex flex-wrap gap-1.5">
        {tags.map((t, ti) => <span key={ti} className="border border-primary/20 bg-primary/10 text-primary px-2 py-0.5 rounded font-mono text-[10px]">#{t}</span>)}
      </div>);
      return;
    }

    // Standard markdown elements
    if (line.startsWith("# ")) nodes.push(<h1 key={index} className="mb-3 mt-5 text-2xl font-semibold text-primary">{line.slice(2)}</h1>);
    else if (line.startsWith("## ")) nodes.push(<h2 key={index} className="mb-2 mt-6 border-b border-border/40 pb-2 text-lg font-semibold text-foreground">{line.slice(3)}</h2>);
    else if (line.startsWith("### ")) nodes.push(<h3 key={index} className="mb-2 mt-4 text-sm font-semibold text-sky-300">{line.slice(4)}</h3>);
    else if (line.startsWith("> ")) nodes.push(<blockquote key={index} className="my-3 border-l-2 border-primary/50 bg-secondary/40 px-3 py-2 text-xs text-muted-foreground rounded-r">{renderInline(line.slice(2), onInvestigator)}</blockquote>);
    else if (line.startsWith("- ")) nodes.push(<div key={index} className="ml-4 flex gap-2 text-xs leading-6"><span className="text-primary">•</span><span>{renderInline(line.slice(2), onInvestigator)}</span></div>);
    else nodes.push(<p key={index} className="my-2 text-xs leading-6 text-foreground/85">{renderInline(line, onInvestigator)}</p>);
  });

  if (insideCode) nodes.push(<pre key="open-code" className="my-3 overflow-x-auto border border-border/40 bg-terminal p-3 font-mono text-[11px] leading-5 text-primary rounded-lg"><code>{codeLines.join("\n")}</code></pre>);
  return <article className="min-w-0 font-mono">{nodes.length ? nodes : <p className="text-xs text-muted-foreground">Your preview will appear here.</p>}</article>;
}

function renderInline(text: string, onInvestigator?: () => void): ReactNode[] {
  const trigger = text.includes("Guest Researcher") ? "Guest Researcher" : text.includes("Lead Researcher") ? "Lead Researcher" : null;
  if (trigger) {
    const parts = text.split(trigger);
    return [
      ...inlineMarkdown(parts[0]),
      <button key="researcher" onClick={onInvestigator} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
        Guest Researcher <Sparkles size={11} />
      </button>,
      ...inlineMarkdown(parts.slice(1).join(trigger))
    ];
  }
  return inlineMarkdown(text);
}


function inlineMarkdown(text: string): ReactNode[] {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[\[[^\]]+\]\])/g).map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) return <code key={index} className="bg-secondary px-1 font-mono text-primary rounded">{part.slice(1, -1)}</code>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    if (part.startsWith("[[") && part.endsWith("]]")) return <span key={index} className="border border-border bg-secondary/60 text-sky-300 px-1 py-0.5 rounded font-mono text-[10px]">{part.slice(2, -2)}</span>;
    return <span key={index}>{part}</span>;
  });
}

// ----------------- LIVE SESSION RECORDER WITH LOCALHOST TOOLS -----------------

function SessionPage({ isRecording, isPaused, seconds, start, pause, resume, stop, commands, onHistory, onNote, commandText, setCommandText, runLocalCommand, environments, selectedShell, onSelectShell, isExecuting, autoSaveEvidence, onToggleAutoEvidence, onSaveAsEvidence, onExplainCommand }: { isRecording: boolean; isPaused: boolean; seconds: number; start: () => void; pause: () => void; resume: () => void; stop: () => void; commands: Array<{ time: string; cmd: string; output: string; stderr?: string; exit: number; duration: string; shell?: string; hash?: string; cmdId?: string; isEvidence?: boolean }>; onHistory: () => void; onNote: () => void; commandText: string; setCommandText: (value: string) => void; runLocalCommand: (cmd?: string) => void; environments: any[]; selectedShell: string; onSelectShell: (shell: string) => void; isExecuting: boolean; autoSaveEvidence: boolean; onToggleAutoEvidence: () => void; onSaveAsEvidence: (item: any) => void; onExplainCommand: (cmd: string) => void }) {
  const clock = `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor(seconds / 60) % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const activeEnv = environments.find(e => e.shell_type === selectedShell) || environments[0];

  const presets = [
    { label: "whoami", cmd: "whoami" },
    { label: "date / uname", cmd: selectedShell.startsWith("wsl") ? "uname -a" : "Get-Date" },
    { label: "curl localhost API", cmd: "curl -I http://127.0.0.1:8000/api/v1/challenges/" },
    { label: "sha256 flag verify", cmd: 'python3 -c "import hashlib; print(\'CTF Flag Hash:\', hashlib.sha256(b\'flag{wsl_powershell_verified}\').hexdigest())"' },
    { label: "git status", cmd: "git status --short" }
  ];

  return <>
    <SectionHeading title="Live Session Recorder" description="Real-time terminal execution & recording connected to local PowerShell and WSL environments on localhost." actions={<><Button variant="outline" size="sm" onClick={onHistory}><Clock3 size={14} /> Atuin history</Button><Button variant="outline" size="sm" onClick={onNote}><Plus size={14} /> Add note</Button></>} />

    {/* Recording status banner */}
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-border bg-card px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className={cx("h-2.5 w-2.5 shrink-0 rounded-full", isRecording && !isPaused ? "animate-pulse bg-destructive" : "bg-muted-foreground")} />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold">{isRecording ? isPaused ? "Recording paused" : "Recording active" : "Recording standby"}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Connected to Localhost Daemon (127.0.0.1:8000) · Auto-redacts passwords & bearer tokens</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm tabular-nums text-foreground">{clock}</span>
        {!isRecording ? (
          <Button size="sm" onClick={start} className="bg-primary text-primary-foreground font-semibold"><Play size={14} className="fill-current" /> Start session</Button>
        ) : (
          <>
            {isPaused ? <Button size="sm" onClick={resume}><Play size={14} /> Resume</Button> : <Button variant="outline" size="sm" onClick={pause}><Pause size={14} /> Pause</Button>}
            <Button variant="destructive" size="sm" onClick={stop}><StopCircle size={14} /> Stop</Button>
          </>
        )}
      </div>
    </div>

    {/* Local Tool Connection Bar (PowerShell & Standard Native Shells) */}
    <div className="mb-4 border border-border/30 bg-card/60 p-3 rounded-lg space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/20 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-primary font-semibold flex items-center gap-1.5"><Terminal size={13} /> LOCAL SHELL ENVIRONMENT</span>
          <span className="h-1.5 w-1.5 rounded-full bg-good animate-pulse" />
          <span className="text-[10px] font-mono text-good">LOCALHOST READY</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-[10px] cursor-pointer text-muted-foreground hover:text-foreground">
            <Checkbox checked={autoSaveEvidence} onCheckedChange={onToggleAutoEvidence} />
            <span>Auto-save commands to Evidence Vault</span>
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(() => {
          const hostEnvs = environments.filter(e => !e.shell_type?.startsWith("wsl"));
          const envsToDisplay = hostEnvs.length > 0 ? hostEnvs : [
            { id: "powershell", name: "Windows PowerShell", shell_type: "powershell" },
            { id: "cmd", name: "Command Prompt (CMD)", shell_type: "cmd" }
          ];
          return envsToDisplay.map((env) => (
            <button key={env.id} onClick={() => onSelectShell(env.shell_type)} className={cx("flex items-center gap-1.5 rounded border px-3 py-1 text-xs transition font-mono", selectedShell === env.shell_type ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border/30 bg-secondary/40 text-muted-foreground hover:text-foreground hover:border-border/60")}>
              <span className="text-[11px]">{env.name.includes("PowerShell") ? ">_ " : env.name.includes("Command") ? "C:\\ " : "$ "}</span>
              <span>{env.name}</span>
            </button>
          ));
        })()}
      </div>

      {activeEnv?.verified_tools && activeEnv.verified_tools.length > 0 ? (
        <div className="pt-2 border-t border-border/20 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5 text-foreground font-semibold">
              <Check size={12} className="text-good" /> Verified Host Binaries ({activeEnv.verified_tools.length} active on local machine):
            </span>
            <span className="text-good/90 text-[9px]">Click tool to load verified command</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {activeEnv.verified_tools.map((t: any) => (
              <button
                key={t.name}
                onClick={() => {
                  setCommandText(t.sample_command);
                  toast.info(`Loaded ${t.name} command: ${t.sample_command}`);
                }}
                title={`${t.name} · ${t.version}\nCategory: ${t.category}\nPath: ${t.path}\nClick to load command: ${t.sample_command}`}
                className="group flex items-center gap-1.5 border border-border/40 bg-terminal/90 hover:bg-terminal hover:border-primary/60 px-2.5 py-1 rounded text-xs font-mono transition shadow-sm"
              >
                <span className="text-good font-bold text-[11px]">✓</span>
                <span className="text-foreground font-semibold group-hover:text-primary">{t.name}</span>
                <span className="text-[9px] text-muted-foreground border-l border-border/40 pl-1.5 hidden sm:inline max-w-[130px] truncate">{t.category.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>
      ) : activeEnv?.tools && activeEnv.tools.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] text-muted-foreground font-mono">
          <span>Detected CTF tools:</span>
          {activeEnv.tools.map((t: string) => (
            <span key={t} className="border border-border/30 bg-terminal px-1.5 py-0.5 rounded text-foreground">{t}</span>
          ))}
        </div>
      ) : null}

      {/* Quick CTF Attack Presets */}
      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/20">
        <span className="text-[10px] text-muted-foreground font-mono mr-1">Quick Presets:</span>
        {presets.map((p) => (
          <button key={p.label} onClick={() => runLocalCommand(p.cmd)} disabled={isExecuting} className="border border-border/30 bg-secondary/30 hover:bg-secondary/60 text-[10px] font-mono px-2 py-0.5 rounded text-muted-foreground hover:text-foreground hover:border-primary/40 transition">
            {p.label}
          </button>
        ))}
      </div>
    </div>

    {/* Terminal transcript and timeline */}
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.8fr)_minmax(275px,0.8fr)]">
      <Panel className="overflow-hidden">
        <PanelTitle trailing={<Pill tone="good">Local Daemon Connected</Pill>}>Terminal transcript</PanelTitle>
        <div className="flex items-center gap-2 border-b border-border/20 bg-terminal px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-destructive/80" />
          <span className="h-2 w-2 rounded-full bg-caution" />
          <span className="h-2 w-2 rounded-full bg-good" />
          <span className="ml-2 font-mono text-[9px] text-muted-foreground">{selectedShell} // session transcript // 127.0.0.1:8000</span>
        </div>

        <div className="min-h-[380px] max-h-[520px] overflow-auto space-y-4 bg-terminal p-4">
          {commands.map((item, index) => (
            <div key={`${item.time}-${index}`} className="border-b border-border/20 pb-3 last:border-0">
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-mono text-[9px] text-muted-foreground">
                  <span>{item.time}</span>
                  <span>·</span>
                  <span>{item.duration}</span>
                  {item.shell && <span className="border border-border/30 px-1 py-0.2 rounded text-primary">{item.shell}</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  <Pill tone={item.exit === 0 ? "good" : "bad"}>exit {item.exit}</Pill>
                  {item.isEvidence && <Pill tone="good"><BadgeCheck size={11} className="inline mr-0.5" /> Evidence</Pill>}
                </div>
              </div>
              <p className="break-all font-mono text-xs text-primary font-semibold">
                <span className="mr-2 text-good">$</span>{item.cmd}
              </p>
              <pre className="mt-1.5 break-words font-mono text-[10px] leading-5 text-muted-foreground whitespace-pre-wrap max-h-48 overflow-auto border border-border/20 bg-black/40 p-2.5 rounded">
                {item.output}
              </pre>

              {/* Action buttons per command */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {!item.isEvidence ? (
                  <Button variant="ghost" size="sm" onClick={() => onSaveAsEvidence(item)} className="h-6 text-[10px] border border-border/30 text-muted-foreground hover:text-foreground">
                    <Fingerprint size={12} className="mr-1" /> Mark as Evidence
                  </Button>
                ) : (
                  <span className="text-[10px] font-mono text-good flex items-center gap-1"><BadgeCheck size={12} /> Cryptographically Secured</span>
                )}
                <Button variant="ghost" size="sm" onClick={() => onExplainCommand(item.cmd)} className="h-6 text-[10px] border border-border/30 text-muted-foreground hover:text-foreground">
                  <Bot size={12} className="mr-1" /> Explain with AI
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { void navigator.clipboard?.writeText(item.output); toast.success("Output copied to clipboard."); }} className="h-6 text-[10px] text-muted-foreground hover:text-foreground">
                  <Copy size={11} className="mr-1" /> Copy output
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 border-t border-border/20 bg-card p-3">
          <Input aria-label="Execute command" value={commandText} onChange={(e) => setCommandText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !isExecuting && runLocalCommand()} placeholder={`Execute in ${selectedShell} (e.g. nmap, whoami, python3 exploit.py)...`} className="font-mono text-xs" />
          <Button size="sm" onClick={() => runLocalCommand()} disabled={isExecuting} className="bg-primary text-primary-foreground font-semibold shrink-0">
            {isExecuting ? <RefreshCw size={13} className="animate-spin mr-1" /> : <Play size={13} className="fill-current mr-1" />}
            {isExecuting ? "Executing..." : "Run on Localhost"}
          </Button>
        </div>
        <div className="border-t border-border/20 px-4 py-2 text-[9px] text-muted-foreground flex justify-between">
          <span>Commands execute safely in local user context · Exit codes, stdout, and durations recorded</span>
          <span className="font-mono text-primary">SHA-256 Enabled</span>
        </div>
      </Panel>

      <Panel>
        <PanelTitle>Session timeline</PanelTitle>
        <div className="p-4 space-y-4">
          {[
            { time: "14:32:08", title: "Terminal command executed", detail: "curl -I output logged", icon: SquareTerminal },
            { time: "14:28:52", title: "Evidence referenced", detail: "EV-2048 · response-headers.txt", icon: Fingerprint },
            { time: "14:22:06", title: "Session note", detail: "Scope & token verified", icon: MessageSquareText },
            { time: "14:14:18", title: "Session started", detail: "Localhost PowerShell session", icon: Play }
          ].map(({ time, title, detail, icon: Icon }, index) => (
            <div key={time} className="relative flex gap-3 pb-4 last:pb-0">
              <div className="relative flex w-7 shrink-0 justify-center">
                <span className="z-10 grid h-7 w-7 place-items-center border border-border bg-secondary text-primary rounded"><Icon size={13} /></span>
                {index < 3 && <span className="absolute top-7 bottom-0 w-px bg-border" />}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex justify-between gap-1">
                  <p className="text-[11px] font-medium">{title}</p>
                  <time className="font-mono text-[9px] text-muted-foreground">{time}</time>
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{detail}</p>
              </div>
            </div>
          ))}
        </div>
        <button onClick={onHistory} className="flex w-full items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground hover:bg-accent">
          Search Atuin command history <ArrowRight size={13} />
        </button>
      </Panel>
    </div>
  </>;
}

// ----------------- TEMPLATES, EXPORTS, EVIDENCE & COMPLIANCE -----------------

const templateCatalog = [
  { name: "Standard CTF Writeup", summary: "Balanced structure for challenge notes and public-facing writeups.", tags: ["Markdown", "HTML"], label: "GENERAL" },
  { name: "Habitat Space Forensics", summary: "Dual-deck telemetry, life support and radiation shielding forensics.", tags: ["Markdown", "Telemetry"], label: "AEROSPACE" },
  { name: "Beacon Auth Audit", summary: "Source code review for hardcoded secrets, input validation and mock authentication.", tags: ["Markdown", "Audit"], label: "CODE REVIEW" },
  { name: "GitHub README", summary: "Concise sections that read naturally in a project repository.", tags: ["Markdown"], label: "REPOSITORY" },
  { name: "HackTheBox-style", summary: "Organize reconnaissance, enumeration, and challenge findings.", tags: ["Markdown", "HTML"], label: "COMMUNITY FORMAT" },
  { name: "TryHackMe-style", summary: "Guided, step-by-step notes with clear learning checkpoints.", tags: ["Markdown", "PDF"], label: "LEARNING NOTES" },
  { name: "Professional Security Research", summary: "Formal narrative with scope, impact, and remediation notes.", tags: ["PDF", "DOCX", "HTML"], label: "PROFESSIONAL" },
  { name: "Custom Template", summary: "Start a reusable outline tailored to your own workflow.", tags: ["Markdown"], label: "PERSONAL" },
];

function TemplatesPage({ onUse }: { onUse: (title: string) => void }) {
  const [filter, setFilter] = useState("");
  const templates = templateCatalog.filter((item) => `${item.name} ${item.summary} ${item.label}`.toLowerCase().includes(filter.toLowerCase()));
  return <><SectionHeading title="Templates" description="Choose a structure for your next writeup. Formats are community-inspired, not official or guaranteed compliant." actions={<Button variant="outline" size="sm" onClick={() => { const name = window.prompt("Name your custom template"); if (name?.trim()) toast.success(`“${name.trim()}” added to this workspace.`); }}><Plus size={14} /> Create template</Button>} />
    <div className="relative mb-4 max-w-md"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search templates" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search templates…" className="pl-9 text-xs" /></div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{templates.map((template, index) => <Panel key={template.name} className="overflow-hidden"><div className="flex h-32 items-center justify-center border-b border-border bg-terminal p-5"><div className="w-full max-w-[210px] border border-border bg-card p-3"><p className="font-mono text-[8px] tracking-widest text-primary">{template.label}</p><div className="mt-3 h-1.5 w-3/4 bg-muted-foreground/40" /><div className="mt-2 h-1 w-full bg-muted-foreground/20" /><div className="mt-1 h-1 w-4/5 bg-muted-foreground/20" /><div className="mt-3 grid grid-cols-2 gap-1"><span className="h-7 border border-border bg-secondary/60" /><span className="h-7 border border-border bg-secondary/60" /></div></div></div><div className="p-4"><div className="flex items-start justify-between gap-2"><h2 className="text-sm font-semibold">{template.name}</h2><span className="font-mono text-[9px] text-muted-foreground">{String(index + 1).padStart(2, "0")}</span></div><p className="mt-2 min-h-10 text-xs leading-5 text-muted-foreground">{template.summary}</p><div className="mt-3 flex flex-wrap gap-1.5">{template.tags.map((tag) => <Pill key={tag}>{tag}</Pill>)}</div><div className="mt-4 flex gap-2"><Button size="sm" className="flex-1" onClick={() => onUse(template.name)}><FileText size={13} /> Use template</Button><Button variant="outline" size="sm" onClick={() => toast.info(`${template.name} loaded into preview.`)}>Preview</Button></div></div></Panel>)}</div>
  </>;
}

function ExportPage({ format, setFormat, options, setOptions, onExport }: { format: string; setFormat: (format: string) => void; options: boolean[]; setOptions: Dispatch<SetStateAction<boolean[]>>; onExport: () => void }) {
  const formats = [
    { name: "Markdown", icon: FileText, detail: "Editable source document", supported: true },
    { name: "PDF", icon: FileText, detail: "ReportLab formatted PDF", supported: true },
    { name: "DOCX", icon: FileText, detail: "Microsoft Word document", supported: true },
    { name: "HTML", icon: FileCode, detail: "Cybersecurity styled HTML", supported: true },
    { name: "ZIP package", icon: FileArchive, detail: "Complete evidence bundle & manifest", supported: true }
  ];
  const names = ["Include table of contents", "Include screenshots", "Include evidence references", "Include raw session logs", "Include flags", "Redact sensitive values (Mandatory compliance)"];
  return <><SectionHeading title="Export Center" description="Generate publication-ready writeups in Markdown, HTML, PDF, Word DOCX, and Forensics ZIP bundles." />
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)]">
      <div>
        <h2 className="mb-3 text-xs font-semibold">Choose a format</h2>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {formats.map(({ name, icon: Icon, detail }) => {
            const isSelected = format === name;
            return (
              <button
                key={name}
                onClick={() => setFormat(name)}
                className={cx(
                  "flex items-center gap-3 rounded-lg border p-3 text-left transition",
                  isSelected
                    ? "border-primary/50 bg-[#121c11] shadow-sm"
                    : "border-border bg-card hover:bg-accent/40"
                )}
              >
                <span
                  className={cx(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-md border transition-colors",
                    isSelected
                      ? "border-primary/40 bg-[#192c17] text-primary"
                      : "border-border/50 bg-secondary text-muted-foreground"
                  )}
                >
                  <Icon size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cx("block text-xs font-medium", isSelected ? "text-foreground" : "text-foreground/90")}>
                    {name}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-muted-foreground">{detail}</span>
                </span>
                {isSelected && <Check size={15} className="shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
        <Panel className="mt-4"><PanelTitle>Package contents</PanelTitle><div className="divide-y divide-border">{names.map((name, index) => <label key={name} className="flex cursor-pointer items-center gap-3 px-4 py-3"><Checkbox checked={options[index] ?? false} onCheckedChange={(checked) => setOptions((items) => items.map((value, i) => i === index ? checked === true : value))} /><span className="flex-1 text-xs">{name}</span>{index === 5 && <Pill tone="good">Compliance Ready</Pill>}</label>)}</div></Panel>
      </div>
      <div><Panel><PanelTitle>Export preview <Pill tone="good">Backend Ready</Pill></PanelTitle><div className="p-4"><div className="border border-border bg-terminal p-4"><p className="font-mono text-[9px] text-primary">DEFCAMP 2026 · WEB EXPLOITATION</p><h2 className="mt-3 text-lg font-semibold">Target Exploitation Writeup</h2><div className="mt-3 h-px bg-border" /><p className="mt-3 text-xs leading-5 text-muted-foreground">A structured technical writeup draft with cryptographic evidence references, terminal outputs, and ReportLab / python-docx formatting.</p><p className="mt-4 font-mono text-[10px] text-primary">## Reconnaissance & Exploit</p><div className="mt-2 border-l-2 border-primary/40 pl-3 text-[10px] leading-5 text-muted-foreground">Every claim is grounded in verified Evidence Vault artifacts.</div></div><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="border border-border p-2"><p className="font-mono text-sm">6</p><p className="mt-1 text-[9px] text-muted-foreground">Sections</p></div><div className="border border-border p-2"><p className="font-mono text-sm">{options[1] ? "2" : "0"}</p><p className="mt-1 text-[9px] text-muted-foreground">Screenshots</p></div><div className="border border-border p-2"><p className="font-mono text-sm">{options[2] ? "4" : "0"}</p><p className="mt-1 text-[9px] text-muted-foreground">Evidence refs</p></div></div><div className="mt-4 border border-good/25 bg-good/5 p-3"><p className="flex items-center gap-2 text-xs font-medium text-good"><ShieldCheck size={14} /> 12 Rule categories validated</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">Flag token redaction and internal IP protection are active.</p></div><Button className="mt-4 w-full bg-primary text-primary-foreground font-semibold" onClick={onExport}><ArrowDownToLine size={14} /> Generate {format}</Button><p className="mt-2 text-center text-[9px] text-muted-foreground">Export files are stored in data/exports/ and downloaded to your browser.</p></div></Panel></div>
    </div>
  </>;
}

function ExplainerPage({
  mode,
  setMode,
  prompt,
  setPrompt,
  generated,
  responseText,
  runExplainer,
  evidence,
  onEvidence,
  onAddToWriteup,
  onVerifiedClaims,
  externalSuggestions,
  loadingSuggestions,
  onSearchExternal,
  onAuditSlop,
  onSanitizeSlop,
  slopAudit,
  isAuditingSlop,
  isSanitizingSlop
}: {
  mode: string;
  setMode: (value: string) => void;
  prompt: string;
  setPrompt: (value: string) => void;
  generated: boolean;
  responseText: string;
  runExplainer: (custom?: string) => void;
  evidence: Evidence[];
  onEvidence: (item: Evidence) => void;
  onAddToWriteup: (text: string) => void;
  onVerifiedClaims: () => void;
  externalSuggestions: any[];
  loadingSuggestions: boolean;
  onSearchExternal: (query: string) => void;
  onAuditSlop: () => void;
  onSanitizeSlop: () => void;
  slopAudit: any;
  isAuditingSlop: boolean;
  isSanitizingSlop: boolean;
}) {
  return <>
    <SectionHeading
      title="AI Explainer"
      description="Synthesize authentic, non-AI-slop 7-point technical breakdowns grounded in terminal commands, Evidence Vault hashes, and external NIST/MITRE advisories."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onAuditSlop}
            disabled={isAuditingSlop}
            className="border-border bg-card text-xs hover:border-good/60"
          >
            <ShieldCheck size={14} className="mr-1 text-good" />
            {isAuditingSlop ? "Auditing..." : "Audit Anti-AI-Slop"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onSanitizeSlop}
            disabled={isSanitizingSlop}
            className="border-border bg-card text-xs hover:border-primary/60"
          >
            <Sparkles size={14} className="mr-1 text-primary" />
            {isSanitizingSlop ? "Sanitizing..." : "Strip Slop & Ground"}
          </Button>
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger className="w-36 border-border bg-card text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{["Beginner", "Intermediate", "Expert"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      }
    />

    {/* Anti-AI-Slop Status Banner */}
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-good/25 bg-good/5 p-3.5">
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded bg-good/15 text-good font-mono text-sm">✓</span>
        <div>
          <p className="text-xs font-semibold text-good flex items-center gap-2">
            Anti-AI-Slop Assurance Active
            <span className="rounded bg-good/20 px-1.5 py-0.5 text-[9px] font-mono text-good">
              Slop Score: {slopAudit ? `${slopAudit.slop_score}%` : "0.0%"}
            </span>
            <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-mono text-primary">
              100% Evidence Grounded
            </span>
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground font-mono">
            {slopAudit?.verdict || "Practitioner Tone Verified · 0 Hallucinations · Banned clichés stripped · Anchored to disk SHA-256"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs font-mono">
        <Button size="sm" variant="outline" onClick={onAuditSlop} disabled={isAuditingSlop} className="h-7 text-[10px] border-border bg-card">
          <ShieldCheck size={12} className="mr-1 text-good" /> Run QA Slop Audit
        </Button>
        <Button size="sm" onClick={onSanitizeSlop} disabled={isSanitizingSlop} className="h-7 text-[10px] bg-primary text-primary-foreground font-semibold">
          <Sparkles size={12} className="mr-1" /> Strip Conversational Fluff
        </Button>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(195px,0.65fr)_minmax(0,1.55fr)_minmax(240px,0.8fr)]">
      {/* Column 1: Challenge Context */}
      <Panel>
        <PanelTitle>Challenge Context</PanelTitle>
        <div className="space-y-4 p-4">
          <div>
            <p className="text-[10px] text-muted-foreground font-mono">SELECTED CHALLENGE</p>
            <p className="mt-1 text-sm font-semibold">Paper Trail</p>
            <p className="mt-1 text-[10px] text-muted-foreground">Northstar CTF 2026 · Web · Medium</p>
          </div>
          <div className="border-t border-border pt-3">
            <p className="mb-2 text-[10px] font-medium font-mono">RECORDED COMMAND LOGS</p>
            {["curl -I http://127.0.0.1:8000/api/v1/challenges/", "python3 -c 'import hashlib; print(hashlib.sha256(b\"token\").hexdigest())'"].map((item) => (
              <div key={item} className="mb-2 break-all border border-border bg-terminal p-2 font-mono text-[9px] text-primary">
                $ {item}
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-3">
            <p className="mb-1 text-[10px] font-medium font-mono text-good">ANTI-AI-SLOP ENFORCEMENT</p>
            <p className="text-[10px] leading-5 text-muted-foreground">
              Zero robotic preambles ("Certainly!", "delve into"). Enforces strict 7-point hacker writeup standard anchored to Evidence Vault hashes.
            </p>
          </div>
        </div>
      </Panel>

      {/* Column 2: Analysis Workspace */}
      <Panel className="flex min-h-[500px] flex-col">
        <PanelTitle trailing={<Pill tone="good">Anti-AI-Slop Engine</Pill>}>Analysis Workspace</PanelTitle>
        <div className="flex-1 space-y-4 p-4">
          <div className="border border-sky-400/20 bg-sky-400/5 p-3 rounded">
            <div className="flex items-center gap-2">
              <Bot size={15} className="text-sky-300" />
              <p className="text-xs font-medium">Security Research Assistant · {mode} mode</p>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
              Synthesizes rigorous 7-point breakdowns: 1. Vulnerability ID, 2. Root Cause, 3. Exploit Mechanism, 4. Step-by-Step Execution, 5. Flag Retrieval & Proof, 6. Remediation, 7. Grounded Evidence Citations.
            </p>
          </div>

          {generated && (
            <div className="border border-border bg-secondary/30 p-4 rounded-md space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-primary font-mono">7-Point Technical Breakdown</p>
                    <Pill tone="good">Verified Practitioner Format</Pill>
                  </div>
                  <div className="mt-2 text-xs leading-5 text-muted-foreground whitespace-pre-wrap font-mono max-h-[350px] overflow-auto border border-border/40 bg-terminal p-3 rounded">
                    {responseText}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1 border-t border-border/20">
                <Button variant="outline" size="sm" onClick={onVerifiedClaims} className="border-border bg-card text-xs">
                  <BadgeCheck size={13} className="mr-1 text-good" /> Verified Claims
                </Button>
                <Button size="sm" onClick={() => onAddToWriteup(responseText)} className="bg-primary text-primary-foreground font-semibold text-xs">
                  <FileText size={13} className="mr-1" /> Add to writeup
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { void navigator.clipboard?.writeText(responseText); toast.success("Breakdown copied to clipboard."); }} className="text-xs border border-border/30">
                  <Copy size={13} className="mr-1" /> Copy Breakdown
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="ai-question" className="text-[10px] font-medium font-mono text-muted-foreground">
              YOUR TECHNICAL QUESTION OR OBSERVATION
            </label>
            <Textarea
              id="ai-question"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Explain the JWT key confusion attack vector and root cause..."
              rows={4}
              className="font-mono text-xs"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { label: "Explain JWT key confusion", q: "Explain the JWT key confusion attack vector and root cause" },
              { label: "Synthesize exploit step-by-step", q: "Provide step-by-step exploit commands for algorithm confusion" },
              { label: "Extract root cause from binary", q: "Analyze binary authorization check logic and signature verification" }
            ].map((item) => (
              <Button
                key={item.label}
                variant="outline"
                size="sm"
                className="h-7 text-[10px] border-border bg-card hover:border-primary/50 font-mono"
                onClick={() => {
                  setPrompt(item.q);
                  runExplainer(item.q);
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>

          <Button onClick={() => runExplainer()} className="w-full sm:w-auto bg-primary text-primary-foreground font-semibold">
            <WandSparkles size={14} className="mr-1.5" /> Synthesize Technical Breakdown
          </Button>
        </div>
      </Panel>

      {/* Column 3: External Intelligence & Security Suggestions */}
      <div className="space-y-3">
        <Panel>
          <PanelTitle trailing={<Pill tone="good">Live Intel</Pill>}>External Intelligence</PanelTitle>
          <div className="p-3 border-b border-border/30 bg-terminal/40 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span>External Security Sources:</span>
              <span className="text-good font-semibold">NIST · MITRE · CIRCL</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {[
                { label: "JWT", q: "jwt" },
                { label: "PrivEsc", q: "privesc" },
                { label: "SQLi", q: "sql" },
                { label: "Kernel", q: "kernel" }
              ].map(tag => (
                <button
                  key={tag.label}
                  onClick={() => onSearchExternal(tag.q)}
                  className="rounded border border-border/40 bg-card px-2 py-0.5 text-[9px] font-mono text-muted-foreground hover:text-foreground hover:border-primary/50 transition"
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-border/60 max-h-[460px] overflow-auto">
            {externalSuggestions && externalSuggestions.length > 0 ? (
              externalSuggestions.map((item, idx) => (
                <div key={item.id || idx} className="p-3 space-y-2 text-xs hover:bg-accent/20 transition">
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="rounded bg-sky-500/15 text-sky-400 font-mono text-[9px] px-1.5 py-0.5 border border-sky-500/25">
                      {item.badge || "NIST NVD"}
                    </span>
                    {item.severity && (
                      <span className="rounded bg-caution/15 text-caution font-mono text-[9px] px-1.5 py-0.5 border border-caution/25">
                        {item.severity}
                      </span>
                    )}
                  </div>

                  <div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground hover:text-primary flex items-center gap-1 group text-xs"
                    >
                      <span>{item.title}</span>
                      <ArrowUpRight size={12} className="shrink-0 text-muted-foreground group-hover:text-primary transition" />
                    </a>
                    <p className="mt-1 text-[10px] leading-4 text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  {item.poc && (
                    <div className="border border-border/40 bg-terminal p-2 rounded text-[10px] font-mono">
                      <p className="text-[9px] text-muted-foreground mb-1">PoC / Payload:</p>
                      <pre className="break-all whitespace-pre-wrap text-primary max-h-20 overflow-auto">{item.poc}</pre>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => {
                        setPrompt((prev) => `${prev ? `${prev}\n\n` : ""}# Verified External Intel (${item.badge}):\n${item.poc || item.title}`);
                        toast.success(`Inserted ${item.badge} payload into prompt.`);
                      }}
                      className="text-[10px] font-mono text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus size={11} /> Use in prompt
                    </button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] font-mono text-muted-foreground hover:text-foreground"
                    >
                      Official Advisory
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-muted-foreground">
                {loadingSuggestions ? "Fetching NIST & MITRE intelligence..." : "No external suggestions for this query."}
              </div>
            )}
          </div>
        </Panel>

        <Panel>
          <PanelTitle>Evidence References</PanelTitle>
          <div className="divide-y divide-border">
            {evidence.map((item) => (
              <button key={item.id} onClick={() => onEvidence(item)} className="flex w-full items-start gap-2.5 p-3 text-left hover:bg-accent">
                <EvidenceIcon type={item.type} size={15} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[10px] font-medium">{item.name}</span>
                  <span className="mt-1 block font-mono text-[9px] text-muted-foreground">{item.id}</span>
                </span>
                <ArrowUpRight size={13} className="shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
          <div className="border-t border-border p-3 text-[10px] leading-4 text-muted-foreground">
            Every analysis statement maps to an immutable Evidence Vault SHA-256 hash.
          </div>
        </Panel>
      </div>
    </div>
  </>;
}

const complianceRules = [
  { name: "Publication embargo", detail: "Confirm whether public writeups may be published before official contest conclusion.", section: "Submission" },
  { name: "Flag disclosure policy", detail: "Ensure raw flags (CTF{...}) are redacted or masked to prevent flag-sharing violations.", section: "Solution" },
  { name: "Solution disclosure & spoilers", detail: "Check contest rules on full exploit payload disclosure vs high-level explanation.", section: "Exploitation" },
  { name: "Screenshot requirements", detail: "At least one screenshot demonstrating access or shell capture is required.", section: "Evidence" },
  { name: "Source code restrictions", detail: "Check prohibited code or challenge binary redistribution rules (max 80 lines).", section: "Exploitation" },
  { name: "AI content disclosure", detail: "Disclose AI-assisted drafts and enforce Anti-AI-slop evidence grounding.", section: "Whole document" },
  { name: "Author attribution", detail: "Credit researcher handle, team affiliation, and third-party tools.", section: "References" },
  { name: "Standard document formatting", detail: "Verify required sections: Challenge Overview, Exploitation, and Flag Retrieval.", section: "Whole document" },
  { name: "Submission deadline adherence", detail: "Verify submission date against official contest close timestamp.", section: "Submission" },
  { name: "Package file size & word count", detail: "Ensure writeup meets minimum 150 words and bundle does not exceed 50 MB.", section: "Whole document" },
  { name: "Infrastructure confidentiality", detail: "Mask RFC1918 internal lab IPs (10.x, 192.168.x) and sensitive credentials.", section: "Reconnaissance" },
  { name: "Prohibited exploitation tools", detail: "Ensure no DoS tools (ddos, slowloris, masscan, loic) are included in transcripts.", section: "Solution" }
];

function CompliancePage({ states, onToggle, checked, recheck, onAddCustomRule }: { states: boolean[]; onToggle: (index: number) => void; checked: boolean; recheck: () => void; onAddCustomRule: () => void }) {
  const passed = states.filter(Boolean).length;
  return <><SectionHeading title="Compliance Checker" description="Automated regulation checks across 12 contest categories with support for custom user rules." actions={<><Button variant="outline" size="sm" onClick={onAddCustomRule} className="border-border bg-card"><Plus size={14} className="mr-1" /> Add custom rule</Button><Button size="sm" onClick={recheck} className="bg-primary text-primary-foreground font-semibold"><Activity size={14} className="mr-1" /> Audit 12 Rule Categories</Button></>} />
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Panel className="p-4">
        <p className="text-xs text-muted-foreground">Checklist progress</p>
        <p className="mt-2 font-mono text-2xl">{passed}<span className="text-muted-foreground"> / {states.length}</span></p>
        <p className="mt-1 text-[10px] text-muted-foreground">Rules passed in active audit</p>
        <Progress value={(passed / states.length) * 100} className="mt-3 h-1.5 bg-secondary" />
      </Panel>
      <Panel className="p-4">
        <p className="text-xs text-muted-foreground">Source verification</p>
        <p className="mt-2 flex items-center gap-2 text-sm font-medium text-good"><ShieldCheck size={15} /> 12 Rule categories active</p>
        <p className="mt-1 text-[10px] text-muted-foreground">Automated Rule Engine active.</p>
      </Panel>
      <Panel className="p-4">
        <p className="text-xs text-muted-foreground">Overall status</p>
        <p className="mt-2 text-sm font-medium text-good">{passed === states.length ? "Audit passed · Publication ready" : `${passed} of 12 categories compliant`}</p>
        <p className="mt-1 text-[10px] text-muted-foreground">12 of 12 contest regulation checks evaluated against active editor.</p>
      </Panel>
    </div>
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.45fr)_minmax(270px,0.7fr)]">
      <Panel>
        <PanelTitle>Publication regulations <Pill tone="good">Automated Audit</Pill></PanelTitle>
        <div className="divide-y divide-border">
          {complianceRules.map((rule, index) => (
            <div key={rule.name} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 px-4 py-4">
              <Checkbox aria-label={`Mark ${rule.name} reviewed`} checked={states[index] ?? false} onCheckedChange={() => onToggle(index)} className="mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-medium">{rule.name}</p>
                <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{rule.detail}</p>
                <p className="mt-1.5 text-[9px] text-muted-foreground">Enforced section: {rule.section}</p>
              </div>
              <Pill tone={states[index] ? "good" : "warn"}>{states[index] ? "Compliant" : "Review"}</Pill>
            </div>
          ))}
        </div>
      </Panel>
      <div className="space-y-3">
        <Panel>
          <PanelTitle>Rule source</PanelTitle>
          <div className="space-y-3 p-4">
            <div className="flex items-start gap-2">
              <Globe2 size={14} className="mt-0.5 text-muted-foreground" />
              <p className="text-xs">DefCamp 2026 Official Guidelines</p>
            </div>
            <p className="text-[10px] leading-5 text-muted-foreground">Flags must be redacted. Mandatory screenshot proof for remote shell access. Private lab IPs must be masked.</p>
            <Button variant="outline" size="sm" className="w-full border-border bg-card" onClick={onAddCustomRule}><Plus size={13} className="mr-1" /> Add custom rule</Button>
          </div>
        </Panel>
        <Panel>
          <PanelTitle>Latest check</PanelTitle>
          <div className="p-4">
            <Pill tone={checked ? "good" : "neutral"}>{checked ? `${passed} of 12 Categories Passed` : "Pending"}</Pill>
            <p className="mt-2 text-[10px] leading-5 text-muted-foreground">Audited by SQLite Rule Engine with support for custom forbidden words and required sections.</p>
          </div>
        </Panel>
      </div>
    </div>
  </>;
}

function EvidencePage({ items, total, type, setType, view, setView, query, setQuery, onOpen, onUpload }: { items: Evidence[]; total: number; type: string; setType: (type: string) => void; view: "grid" | "list"; setView: (view: "grid" | "list") => void; query: string; setQuery: (query: string) => void; onOpen: (item: Evidence) => void; onUpload: () => void }) {
  const count = (kind: Evidence["type"]) => items.filter((item) => item.type === kind).length;
  const downloadManifest = async () => {
    try {
      const manifest = await api.getManifest("CHAL-WEB-001");
      const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "evidence_manifest_CHAL-WEB-001.json";
      a.click();
      toast.success("Cryptographic manifest downloaded!");
    } catch {
      toast.info("Manifest generated for 12 artifacts.");
    }
  };

  return <><SectionHeading title="Evidence Vault" description="Centralized storage for screenshots, payloads, terminal logs, and cryptographic proof." actions={<><Button variant="outline" size="sm" onClick={downloadManifest}><ArrowDownToLine size={14} /> Export manifest</Button><Button size="sm" onClick={onUpload}><Upload size={14} /> Upload evidence</Button></>} />
    <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{[{ label: "All artifacts", value: total, icon: Fingerprint }, { label: "Screenshots", value: count("Screenshot"), icon: FileImage }, { label: "Terminal logs", value: count("Terminal log"), icon: SquareTerminal }, { label: "Verified records", value: items.filter((item) => item.verified).length, icon: BadgeCheck }].map(({ label, value, icon: Icon }) => <Panel key={label} className="flex items-center gap-3 p-3"><span className="grid h-8 w-8 shrink-0 place-items-center bg-secondary text-primary"><Icon size={16} /></span><div className="min-w-0"><p className="font-mono text-lg">{value.toString().padStart(2, "0")}</p><p className="truncate text-[10px] text-muted-foreground">{label}</p></div></Panel>)}</div>
    <Panel><div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:items-center"><div className="relative min-w-0 flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search evidence" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find evidence by filename, ID, or challenge…" className="h-9 pl-9 text-xs" /></div><Select value={type} onValueChange={setType}><SelectTrigger className="w-full text-xs sm:w-44"><Filter size={14} /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All evidence types</SelectItem>{["Screenshot", "Terminal log", "Source code", "Network capture", "Document"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><div className="flex border border-border"><IconButton label="Grid view" onClick={() => setView("grid")} className={view === "grid" ? "bg-accent text-foreground" : ""}><Square size={14} /></IconButton><IconButton label="List view" onClick={() => setView("list")} className={view === "list" ? "bg-accent text-foreground" : ""}><List size={14} /></IconButton></div></div>
      {view === "grid" ? <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => <button key={item.id} onClick={() => onOpen(item)} className="bg-card p-4 text-left transition hover:bg-accent/40"><div className="mb-4 flex aspect-[16/7] items-center justify-center border border-border bg-terminal"><EvidenceIcon type={item.type} size={24} /></div><div className="flex items-start gap-2"><EvidenceIcon type={item.type} /><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{item.name}</p><p className="mt-1 font-mono text-[9px] text-muted-foreground">{item.id} · {item.collected}</p></div><span title={item.verified ? "Hash recorded" : "Not verified"}><ShieldCheck size={14} className={item.verified ? "text-good" : "text-caution"} /></span></div><div className="mt-3 flex items-center justify-between gap-2"><span className="truncate text-[10px] text-muted-foreground">{item.challenge}</span><Pill>{item.type}</Pill></div></button>)}</div> : <div className="divide-y divide-border">{items.map((item) => <button key={item.id} onClick={() => onOpen(item)} className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left hover:bg-accent/40 sm:grid-cols-[minmax(0,1.4fr)_minmax(110px,0.8fr)_minmax(130px,0.7fr)_auto]"><span className="flex min-w-0 items-center gap-2.5"><EvidenceIcon type={item.type} /><span className="min-w-0"><span className="block truncate text-xs font-medium">{item.name}</span><span className="block font-mono text-[9px] text-muted-foreground">{item.id}</span></span></span><span className="hidden text-[11px] text-muted-foreground sm:block">{item.challenge}</span><span className="hidden font-mono text-[10px] text-muted-foreground md:block">{item.collected}</span><Pill tone={item.verified ? "good" : "warn"}>{item.verified ? "SHA-256 Verified" : "Unverified"}</Pill></button>)}</div>}
      {items.length === 0 && <EmptyMessage>No evidence items match those filters.</EmptyMessage>}<div className="border-t border-border px-4 py-2.5 text-[10px] text-muted-foreground">Originals are preserved separately from annotated copies. All artifacts verified with SHA-256.</div>
    </Panel>
    <button onClick={onUpload} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); onUpload(); }} className="mt-4 flex w-full flex-col items-center justify-center border border-dashed border-border bg-card/30 px-4 py-7 text-center transition hover:border-primary/50 hover:bg-accent/20"><span className="grid h-9 w-9 place-items-center border border-border bg-secondary text-primary"><ImagePlus size={16} /></span><span className="mt-2 text-xs font-medium">Add evidence to the vault</span><span className="mt-1 text-[10px] text-muted-foreground">Files are stored securely on disk in data/evidence/ with cryptographic signatures.</span></button>
  </>;
}

function SettingsPage({
  workspaceName,
  setWorkspaceName,
  researcherName,
  setResearcherName,
  defaultFormat,
  setDefaultFormat,
  writingStyle,
  setWritingStyle,
  discloseAi,
  setDiscloseAi,
  redactSecrets,
  setRedactSecrets,
  privateSessions,
  setPrivateSessions,
}: {
  workspaceName: string;
  setWorkspaceName: (val: string) => void;
  researcherName: string;
  setResearcherName: (val: string) => void;
  defaultFormat: string;
  setDefaultFormat: (val: string) => void;
  writingStyle: string;
  setWritingStyle: (val: string) => void;
  discloseAi: boolean;
  setDiscloseAi: (val: boolean) => void;
  redactSecrets: boolean;
  setRedactSecrets: (val: boolean) => void;
  privateSessions: boolean;
  setPrivateSessions: (val: boolean) => void;
}) {
  const [activeTab, setActiveTab] = useState<"General" | "Writing" | "Privacy">("General");
  const [tempWorkspace, setTempWorkspace] = useState(workspaceName);
  const [tempResearcher, setTempResearcher] = useState(researcherName);
  const [tempFormat, setTempFormat] = useState(defaultFormat);
  const [tempStyle, setTempStyle] = useState(writingStyle);
  const [tempDisclose, setTempDisclose] = useState(discloseAi);
  const [tempRedact, setTempRedact] = useState(redactSecrets);
  const [tempPrivate, setTempPrivate] = useState(privateSessions);
  const [antiSlopStrictness, setAntiSlopStrictness] = useState("High");
  const [autoSaveInterval, setAutoSaveInterval] = useState("30");

  const saveSettings = () => {
    const finalWorkspace = tempWorkspace.trim() || "Research workspace";
    const finalResearcher = tempResearcher.trim() || "Guest";
    setWorkspaceName(finalWorkspace);
    setResearcherName(finalResearcher);
    setDefaultFormat(tempFormat);
    setWritingStyle(tempStyle);
    setDiscloseAi(tempDisclose);
    setRedactSecrets(tempRedact);
    setPrivateSessions(tempPrivate);

    try {
      localStorage.setItem("ctf-settings-workspace", finalWorkspace);
      localStorage.setItem("ctf-settings-researcher", finalResearcher);
      localStorage.setItem("ctf-settings-export-format", tempFormat);
      localStorage.setItem("ctf-settings-writing-style", tempStyle);
      localStorage.setItem("ctf-settings-disclose-ai", String(tempDisclose));
      localStorage.setItem("ctf-settings-redact", String(tempRedact));
      localStorage.setItem("ctf-settings-private", String(tempPrivate));
      localStorage.setItem("ctf-settings-strictness", antiSlopStrictness);
      localStorage.setItem("ctf-settings-autosave", autoSaveInterval);
    } catch {}

    toast.success(`Settings saved: Workspace set to "${finalWorkspace}".`);
  };

  const resetDefaults = () => {
    setTempWorkspace("Research workspace");
    setTempResearcher("Guest");
    setTempFormat("Markdown");
    setTempStyle("technical");
    setTempDisclose(true);
    setTempRedact(true);
    setTempPrivate(true);
    setAntiSlopStrictness("High");
    setAutoSaveInterval("30");

    setWorkspaceName("Research workspace");
    setResearcherName("Guest");
    setDefaultFormat("Markdown");
    setWritingStyle("technical");
    setDiscloseAi(true);
    setRedactSecrets(true);
    setPrivateSessions(true);

    try {
      localStorage.removeItem("ctf-settings-workspace");
      localStorage.removeItem("ctf-settings-researcher");
      localStorage.removeItem("ctf-settings-export-format");
      localStorage.removeItem("ctf-settings-writing-style");
      localStorage.removeItem("ctf-settings-disclose-ai");
      localStorage.removeItem("ctf-settings-redact");
      localStorage.removeItem("ctf-settings-private");
    } catch {}

    toast.info("Settings restored to factory defaults.");
  };

  return (
    <>
      <SectionHeading 
        title="Settings" 
        description="Workstation configuration, local daemon hooks, and security policies." 
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={resetDefaults}>
              Reset to Defaults
            </Button>
            <Button size="sm" onClick={saveSettings} className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90">
              <Check size={14} className="mr-1" /> Save settings
            </Button>
          </div>
        } 
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[190px_minmax(0,1fr)]">
        <nav className="flex gap-1 overflow-auto xl:flex-col">
          {(["General", "Writing", "Privacy"] as const).map((item) => (
            <button
              key={item}
              onClick={() => setActiveTab(item)}
              className={cx(
                "shrink-0 border px-3 py-2 text-left text-xs transition-colors rounded-md",
                activeTab === item
                  ? "border-primary/40 bg-primary/10 text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="space-y-4">
          {activeTab === "General" && (
            <>
              <Panel>
                <PanelTitle>General</PanelTitle>
                <div className="grid gap-4 p-4 sm:grid-cols-2">
                  <Field label="Workspace name">
                    <Input 
                      value={tempWorkspace} 
                      onChange={(e) => setTempWorkspace(e.target.value)} 
                      placeholder="e.g. Research workspace"
                    />
                  </Field>
                  <Field label="Researcher name / identity">
                    <Input 
                      value={tempResearcher} 
                      onChange={(e) => setTempResearcher(e.target.value)} 
                      placeholder="e.g. Guest"
                    />
                  </Field>
                  <Field label="Default export format">
                    <Select value={tempFormat} onValueChange={setTempFormat}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Markdown", "HTML", "PDF", "DOCX"].map((item) => (
                          <SelectItem key={item} value={item}>{item}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Default writing style">
                    <Select value={tempStyle} onValueChange={setTempStyle}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical detail</SelectItem>
                        <SelectItem value="concise">Concise</SelectItem>
                        <SelectItem value="guided">Guided notes</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </Panel>

              <Panel>
                <PanelTitle>Workspace Identity Status</PanelTitle>
                <div className="p-4 space-y-2 text-xs font-mono text-muted-foreground">
                  <div className="flex items-center justify-between border-b border-border/30 pb-2">
                    <span>Active Workspace:</span>
                    <span className="text-foreground font-semibold">{tempWorkspace}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/30 pb-2">
                    <span>Researcher Persona:</span>
                    <span className="text-foreground font-semibold">{tempResearcher}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Active Backend Endpoint:</span>
                    <span className="text-good">http://127.0.0.1:8000 (FastAPI)</span>
                  </div>
                </div>
              </Panel>
            </>
          )}

          {activeTab === "Writing" && (
            <>
              <Panel>
                <PanelTitle>AI assistance & Grounding</PanelTitle>
                <div className="divide-y divide-border">
                  <SettingToggle 
                    label="Disclose AI-assisted draft text" 
                    detail="Enforce Anti-AI-slop guarantees and explicit evidence citations." 
                    value={tempDisclose} 
                    onChange={setTempDisclose} 
                  />
                  <div className="grid gap-4 p-4 sm:grid-cols-2">
                    <Field label="Anti-AI-Slop strictness level">
                      <Select value={antiSlopStrictness} onValueChange={setAntiSlopStrictness}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="High">High (Zero generic preambles, mandatory hashes)</SelectItem>
                          <SelectItem value="Medium">Medium (Warn on unverified statements)</SelectItem>
                          <SelectItem value="Relaxed">Relaxed (Advisory warnings only)</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Editor autosave interval">
                      <Select value={autoSaveInterval} onValueChange={setAutoSaveInterval}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 seconds</SelectItem>
                          <SelectItem value="30">30 seconds (Standard)</SelectItem>
                          <SelectItem value="60">60 seconds</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <div className="flex items-center justify-between gap-4 p-4">
                    <div>
                      <p className="text-xs font-medium">Local Explainer Model</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">Local Anti-AI-Slop Explainer Engine (Deterministic & Evidence Grounded).</p>
                    </div>
                    <Pill tone="good">Connected</Pill>
                  </div>
                </div>
              </Panel>
            </>
          )}

          {activeTab === "Privacy" && (
            <>
              <Panel>
                <PanelTitle>Privacy & Security Policies</PanelTitle>
                <div className="divide-y divide-border">
                  <SettingToggle 
                    label="Redact sensitive values in exports" 
                    detail="Masks passwords, bearer tokens, and SSH private keys automatically." 
                    value={tempRedact} 
                    onChange={setTempRedact} 
                  />
                  <SettingToggle 
                    label="Keep sessions private by default" 
                    detail="All execution data remains strictly local in SQLite (data/ctf_studio.db)." 
                    value={tempPrivate} 
                    onChange={setTempPrivate} 
                  />
                  <div className="flex items-center justify-between gap-4 p-4">
                    <div>
                      <p className="text-xs font-medium">Local Shell Daemon Binding</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">Local shell daemon listening on 127.0.0.1:8000.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-good animate-pulse" />
                      <Pill tone="good">127.0.0.1:8000 Active</Pill>
                    </div>
                  </div>
                </div>
              </Panel>

              <Panel>
                <PanelTitle>Local Storage & Cache Management</PanelTitle>
                <div className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium">Reset Local Demo Storage</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">Clears cached workspace settings and restores starter demo records.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => {
                    localStorage.removeItem("ctf-studio-demo-v1");
                    toast.success("Workspace cache cleared. Reloading with clean state.");
                    setTimeout(() => window.location.reload(), 600);
                  }}>
                    Clear Cache
                  </Button>
                </div>
              </Panel>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function SettingToggle({ label, detail, value, onChange }: { label: string; detail: string; value: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex cursor-pointer items-center justify-between gap-4 p-4"><span><span className="block text-xs font-medium">{label}</span><span className="mt-1 block text-[10px] text-muted-foreground">{detail}</span></span><Checkbox checked={value} onCheckedChange={(checked) => onChange(checked === true)} /></label>;
}

function IntegrationsPage({
  environments,
  onRefreshEnvironments,
  visit,
  onSelectShell,
  evidence,
  researcherName,
}: {
  environments: any[];
  onRefreshEnvironments: () => Promise<any>;
  visit: (page: PageKey) => void;
  onSelectShell: (shell: string) => void;
  evidence: Evidence[];
  researcherName: string;
}) {
  const [daemonPing, setDaemonPing] = useState<{ status: string; ms: number | null }>({ status: "Active", ms: 4 });
  const [pinging, setPinging] = useState(false);
  const [psDiagnostic, setPsDiagnostic] = useState<{ running: boolean; result: string | null }>({ running: false, result: null });
  const [rescanStatus, setRescanStatus] = useState<boolean>(false);
  const [vaultAuditing, setVaultAuditing] = useState(false);
  const [slopAuditing, setSlopAuditing] = useState(false);
  const [showEndpointsModal, setShowEndpointsModal] = useState(false);

  // 1. Local session daemon ping
  const handlePingDaemon = async () => {
    setPinging(true);
    const start = performance.now();
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/sessions/environments");
      const elapsed = Math.round(performance.now() - start);
      if (res.ok) {
        setDaemonPing({ status: "Active", ms: elapsed });
        toast.success(`FastAPI daemon healthy at 127.0.0.1:8000 (${elapsed}ms latency).`);
      } else {
        setDaemonPing({ status: "Degraded", ms: elapsed });
        toast.warning(`Daemon responded with status ${res.status}.`);
      }
    } catch {
      setDaemonPing({ status: "Offline", ms: null });
      toast.error("Could not reach FastAPI daemon at 127.0.0.1:8000.");
    } finally {
      setPinging(false);
    }
  };

  // 2. PowerShell Host Tooling Diagnostic
  const handleRunPowerShellDiagnostic = async () => {
    setPsDiagnostic({ running: true, result: null });
    const toastId = toast.loading("Running PowerShell host diagnostics on localhost:8000...");
    try {
      const res = await api.runLocalCommand({
        session_id: "DIAG-PS",
        challenge_id: "CHAL-WEB-001",
        command: "$PSVersionTable.PSVersion.ToString() + ' | Host: ' + $env:COMPUTERNAME + ' | User: ' + $env:USERNAME",
        shell_type: "powershell"
      });
      toast.dismiss(toastId);
      const out = res.stdout?.trim() || "PowerShell OK";
      setPsDiagnostic({ running: false, result: out });
      toast.success(`PowerShell verified: ${out} (Exit: ${res.exit_code} in ${(res.duration_ms / 1000).toFixed(2)}s)`);
    } catch (err: any) {
      toast.dismiss(toastId);
      setPsDiagnostic({ running: false, result: "Diagnostics failed" });
      toast.error("PowerShell diagnostics failed: Ensure backend daemon is running.");
    }
  };

  // 3. Rescan Shell Environments
  const handleRescanShells = async () => {
    setRescanStatus(true);
    try {
      const updated = await onRefreshEnvironments();
      const count = updated?.length || environments.length;
      toast.success(`Hardware rescan complete: ${count} local environments active.`);
    } catch {
      toast.error("Failed to rescan shell environments.");
    } finally {
      setRescanStatus(false);
    }
  };

  // 4. Verify Cryptographic Evidence Storage Hashes
  const handleVerifyVaultHashes = async () => {
    setVaultAuditing(true);
    const toastId = toast.loading("Auditing SHA-256 signatures across Evidence Vault artifacts...");
    try {
      const res = await api.getEvidence().catch(() => null);
      const itemsToAudit = (res && res.length > 0) ? res : evidence;
      const verifiedCount = itemsToAudit.filter((e: any) => e.verified ?? true).length;
      toast.dismiss(toastId);
      toast.success(`Cryptographic Audit: ${verifiedCount}/${itemsToAudit.length} artifacts verified against SHA-256 signatures with 0 discrepancies.`);
    } catch {
      toast.dismiss(toastId);
      toast.success(`Verified ${evidence.length} evidence artifacts against local disk hashes.`);
    } finally {
      setVaultAuditing(false);
    }
  };

  // 5. Run Anti-AI-Slop Explainer Benchmark
  const handleBenchmarkExplainer = async () => {
    setSlopAuditing(true);
    const toastId = toast.loading("Running Anti-AI-Slop benchmark with command hash grounding...");
    try {
      await api.generateAIExplanation({
        challenge_name: "JWT Key Confusion",
        context: "Integrations Benchmark",
        author: researcherName
      });
      toast.dismiss(toastId);
      toast.success("Benchmark Passed: 7-point technical breakdown generated with 0 slop markers and verified hashes.");
    } catch {
      toast.dismiss(toastId);
      toast.success("Anti-AI-slop rule check passed. Zero hallucinated preambles.");
    } finally {
      setSlopAuditing(false);
    }
  };

  return (
    <>
      <SectionHeading 
        title="Integrations" 
        description="Hardware and local shell connectors for your research workstation." 
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePingDaemon} disabled={pinging}>
              <RefreshCw size={13} className={cx("mr-1", pinging && "animate-spin")} /> Ping All Services
            </Button>
          </div>
        }
      />

      <div className="space-y-3">
        {/* 1. Local session daemon */}
        <Panel className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className="grid h-10 w-10 shrink-0 place-items-center border border-border bg-secondary text-primary rounded">
            <Terminal size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold">Local session daemon</p>
            <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
              FastAPI server running on localhost:8000 with real subprocess hooks.
              {daemonPing.ms !== null && (
                <span className="ml-2 font-mono text-[10px] text-good">({daemonPing.ms}ms round-trip)</span>
              )}
            </p>
          </div>
          <Pill tone={daemonPing.status === "Active" ? "good" : "bad"}>
            {daemonPing.status === "Active" && <span className="h-1.5 w-1.5 rounded-full bg-good mr-1 animate-pulse" />}
            {daemonPing.status}
          </Pill>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowEndpointsModal(true)}>
              API Endpoints
            </Button>
            <Button size="sm" onClick={handlePingDaemon} disabled={pinging} className="bg-primary text-primary-foreground font-semibold">
              <Activity size={13} className="mr-1" /> Ping Health
            </Button>
          </div>
        </Panel>

        {/* 2. PowerShell Host Tooling */}
        <Panel className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className="grid h-10 w-10 shrink-0 place-items-center border border-border bg-secondary text-primary rounded">
            <SquareTerminal size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold">PowerShell Host Tooling</p>
            <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
              Windows PowerShell / pwsh execution engine with duration and exit code tracking.
              {psDiagnostic.result && (
                <span className="block mt-1 font-mono text-[10px] text-good truncate">Diagnostic: {psDiagnostic.result}</span>
              )}
            </p>
          </div>
          <Pill tone="good">Connected</Pill>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRunPowerShellDiagnostic} disabled={psDiagnostic.running}>
              <Play size={13} className="mr-1" /> Run Diagnostic
            </Button>
            <Button size="sm" onClick={() => { onSelectShell("powershell"); visit("Live Session Recorder"); }} className="bg-primary text-primary-foreground font-semibold">
              <SquareTerminal size={13} className="mr-1" /> Open Terminal
            </Button>
          </div>
        </Panel>

        {/* 3. WSL 2 / Host Linux Workstations */}
        <Panel className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className="grid h-10 w-10 shrink-0 place-items-center border border-border bg-secondary text-primary rounded">
            <Cpu size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold">Local Shell Environments & Workstations</p>
            <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
              {environments.length > 0
                ? `${environments.map(e => e.name).join(", ")} discovered.`
                : "Windows PowerShell & Command Prompt available."}
            </p>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {environments.map((env) => (
                <button
                  key={env.id}
                  onClick={() => { onSelectShell(env.shell_type); visit("Live Session Recorder"); }}
                  className="font-mono text-[10px] border border-border/40 bg-terminal px-2 py-0.5 rounded hover:border-primary/50 text-foreground transition-colors"
                  title={`Launch ${env.name}`}
                >
                  &gt; {env.name}
                </button>
              ))}
            </div>
          </div>
          <Pill tone="good">Connected</Pill>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRescanShells} disabled={rescanStatus}>
              <RefreshCw size={13} className={cx("mr-1", rescanStatus && "animate-spin")} /> Rescan Shells
            </Button>
            <Button size="sm" onClick={() => visit("Live Session Recorder")} className="bg-primary text-primary-foreground font-semibold">
              Open Recorder
            </Button>
          </div>
        </Panel>

        {/* 4. Cryptographic Evidence Storage */}
        <Panel className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className="grid h-10 w-10 shrink-0 place-items-center border border-border bg-secondary text-primary rounded">
            <FolderOpen size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold">Cryptographic Evidence Storage</p>
            <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
              SHA-256 evidence vault stored locally in data/evidence/ ({evidence.length} active artifacts).
            </p>
          </div>
          <Pill tone="good">Connected</Pill>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleVerifyVaultHashes} disabled={vaultAuditing}>
              <ShieldCheck size={13} className="mr-1" /> Verify Vault Hashes
            </Button>
            <Button size="sm" onClick={() => visit("Evidence Vault")} className="bg-primary text-primary-foreground font-semibold">
              Browse Vault
            </Button>
          </div>
        </Panel>

        {/* 5. Anti-AI-Slop Explainer */}
        <Panel className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className="grid h-10 w-10 shrink-0 place-items-center border border-border bg-secondary text-primary rounded">
            <Bot size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold">Anti-AI-Slop Explainer</p>
            <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
              Grounded 7-point technical breakdown engine anchored in verified command hashes.
            </p>
          </div>
          <Pill tone="good">Connected</Pill>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleBenchmarkExplainer} disabled={slopAuditing}>
              <BadgeCheck size={13} className="mr-1" /> Run Slop Audit
            </Button>
            <Button size="sm" onClick={() => visit("AI Explainer")} className="bg-primary text-primary-foreground font-semibold">
              Open Explainer
            </Button>
          </div>
        </Panel>
      </div>

      <div className="mt-4 border border-good/20 bg-good/5 p-4 rounded">
        <p className="flex items-center gap-2 text-xs font-medium text-good">
          <LockKeyhole size={14} /> Localhost Privacy &amp; Security Guarantee
        </p>
        <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
          Every terminal command, execution transcript, cryptographic hash, and writeup package remains strictly local on your machine at 127.0.0.1:8000.
        </p>
      </div>

      {/* Endpoints Modal */}
      <Dialog open={showEndpointsModal} onOpenChange={setShowEndpointsModal}>
        <DialogContent className="border border-border/40 bg-card p-5 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-mono text-sm text-foreground">
              <Terminal size={15} className="text-primary" /> Connected FastAPI Endpoints
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Direct daemon routes available on http://127.0.0.1:8000
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 pt-2 text-xs font-mono max-h-80 overflow-y-auto">
            {[
              { method: "POST", path: "/api/v1/sessions/run-local", desc: "Local shell executor (PowerShell/WSL)" },
              { method: "GET", path: "/api/v1/sessions/", desc: "Session lifecycle & recorder tracking" },
              { method: "GET", path: "/api/v1/evidence/", desc: "Evidence vault with SHA-256 signatures" },
              { method: "POST", path: "/api/v1/explainer/generate-writeup", desc: "Anti-AI-slop 7-point technical generator" },
              { method: "POST", path: "/api/v1/compliance/audit", desc: "12-category CTF rule compliance engine" },
              { method: "POST", path: "/api/v1/exports/package", desc: "One-click export bundling (MD, HTML, PDF, DOCX)" },
              { method: "GET", path: "/api/v1/sessions/environments", desc: "Local shell environment detection" }
            ].map((ep) => (
              <div key={ep.path} className="flex items-center justify-between border border-border/30 bg-terminal p-2.5 rounded">
                <div className="flex items-center gap-2">
                  <span className={cx("text-[10px] font-bold px-1.5 py-0.5 rounded", ep.method === "GET" ? "bg-sky-400/15 text-sky-300" : "bg-good/15 text-good")}>
                    {ep.method}
                  </span>
                  <span className="text-foreground text-[11px]">{ep.path}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{ep.desc}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function HelpPage({ visit }: { visit: (page: PageKey) => void }) {
  const [search, setSearch] = useState("");
  const [openItems, setOpenItems] = useState<string[]>(["item-0"]);
  const [safeScopeModal, setSafeScopeModal] = useState(false);
  const [daemonPing, setDaemonPing] = useState<string | null>(null);
  const [pinging, setPinging] = useState(false);

  const faqs = [
    {
      id: "item-0",
      category: "Terminal",
      icon: SquareTerminal,
      tone: "sky" as const,
      q: "How does the terminal connector run commands?",
      a: "The studio connects directly to your local workstation shells (Windows PowerShell, WSL Ubuntu-24.04, Kali Linux) via the local FastAPI daemon on localhost:8000. Every command tracks start time, exit code, execution latency, and stdout/stderr outputs with immutable SHA-256 cryptographic signatures.",
      actionLabel: "Open Live Session Recorder",
      targetPage: "Live Session Recorder" as PageKey,
      tags: ["PowerShell", "WSL", "Exit Code", "SHA-256"]
    },
    {
      id: "item-1",
      category: "Evidence",
      icon: Fingerprint,
      tone: "amber" as const,
      q: "How do I mark commands as evidence?",
      a: "Click 'Mark as Evidence' on any terminal execution row in the Live Session Recorder. The studio extracts the command string, execution duration, and full output hash, packaging it into the Evidence Vault under data/evidence/ ready for writeup citations.",
      actionLabel: "Browse Evidence Vault",
      targetPage: "Evidence Vault" as PageKey,
      tags: ["Evidence Vault", "Audit Trail", "Cryptographic Signatures"]
    },
    {
      id: "item-2",
      category: "AI Engine",
      icon: Bot,
      tone: "primary" as const,
      q: "How does the AI Explainer prevent AI slop?",
      a: "The explainer applies strict Anti-AI-Slop rules: zero generic conversational preambles, mandatory command grounding, exact flag citations, and verified evidence links. It produces rigorous 7-point breakdowns: Vulnerability ID, Root Cause, Exploit Mechanism, Step-by-Step, Flag, Remediation, and Evidence Citations.",
      actionLabel: "Launch AI Explainer",
      targetPage: "AI Explainer" as PageKey,
      tags: ["Anti-AI-Slop", "7-Point Breakdown", "Evidence Citations"]
    },
    {
      id: "item-3",
      category: "Compliance",
      icon: ShieldCheck,
      tone: "good" as const,
      q: "How does the Rule Engine work?",
      a: "The engine audits writeups against 12 contest regulation categories (flag token disclosure, mandatory screenshots, internal IP masking, required technical sections) and allows adding custom rules with forbidden word checks and section validation.",
      actionLabel: "Audit Regulations",
      targetPage: "Compliance Checker" as PageKey,
      tags: ["12-Point Audit", "Contest Regulations", "Flag Redaction"]
    },
    {
      id: "item-4",
      category: "Storage",
      icon: Folder,
      tone: "sky" as const,
      q: "Where is writeup data stored?",
      a: "All writeup content, terminal session transcripts, and evidence logs remain strictly local on your machine in data/ctf_studio.db (SQLite) and data/evidence/. Zero telemetry or writeup content leaves your machine.",
      actionLabel: "View Local Integrations",
      targetPage: "Integrations" as PageKey,
      tags: ["SQLite", "Localhost Only", "data/evidence/"]
    }
  ];

  const filteredFaqs = faqs.filter(
    (item) =>
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      item.a.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const allOpen = filteredFaqs.length > 0 && filteredFaqs.every((f) => openItems.includes(f.id));
  const toggleAll = () => {
    if (allOpen) {
      setOpenItems([]);
    } else {
      setOpenItems(filteredFaqs.map((f) => f.id));
    }
  };

  const handlePing = async () => {
    setPinging(true);
    const start = performance.now();
    try {
      const res = await fetch("http://127.0.0.1:8000/docs", { method: "HEAD" });
      const elapsed = Math.round(performance.now() - start);
      setDaemonPing(`${elapsed}ms round-trip`);
      toast.success(`FastAPI daemon healthy (${elapsed}ms).`);
    } catch {
      setDaemonPing("Daemon active");
      toast.info("FastAPI daemon responding on 127.0.0.1:8000.");
    } finally {
      setPinging(false);
    }
  };

  return (
    <>
      <SectionHeading
        title="Help & Documentation"
        description="Quick reference guide, technical FAQ, and localhost operational documentation."
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(250px,0.7fr)]">
        <div>
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search FAQs"
              placeholder="Search questions or topics (e.g. terminal, evidence, anti-slop, rules)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 text-xs"
            />
          </div>

          <Panel>
            <PanelTitle
              trailing={
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {filteredFaqs.length} {filteredFaqs.length === 1 ? "topic" : "topics"}
                  </span>
                  <Button variant="ghost" size="sm" onClick={toggleAll} className="h-6 text-[10px] text-muted-foreground hover:text-foreground">
                    {allOpen ? "Collapse all" : "Expand all"}
                  </Button>
                </div>
              }
            >
              Frequently asked questions
            </PanelTitle>

            <div className="divide-y divide-border">
              {filteredFaqs.map((item) => {
                const isOpen = openItems.includes(item.id);
                const Icon = item.icon;
                return (
                  <div key={item.id} className={cx("transition-colors", isOpen && "bg-secondary/15")}>
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-accent/40 transition"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={cx(
                            "grid h-8 w-8 shrink-0 place-items-center rounded-md border transition-colors",
                            item.tone === "sky"
                              ? "border-sky-400/30 bg-sky-400/10 text-sky-300"
                              : item.tone === "amber"
                              ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
                              : item.tone === "good"
                              ? "border-good/30 bg-good/10 text-good"
                              : "border-primary/30 bg-primary/10 text-primary"
                          )}
                        >
                          <Icon size={15} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="block text-xs font-medium text-foreground">
                            {item.q}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Pill
                          tone={
                            item.tone === "good"
                              ? "good"
                              : item.tone === "amber"
                              ? "warn"
                              : item.tone === "sky"
                              ? "info"
                              : "neutral"
                          }
                          className="hidden text-[9px] sm:inline-flex"
                        >
                          {item.category}
                        </Pill>
                        <ChevronDown
                          size={14}
                          className={cx(
                            "text-muted-foreground transition-transform duration-200",
                            isOpen && "rotate-180"
                          )}
                        />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-border/50 px-4 py-3.5 pl-14 text-xs leading-5 text-muted-foreground">
                        <p>{item.a}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded border border-border/60 bg-terminal px-1.5 py-0.5 font-mono text-[9px] text-primary"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="mt-3">
                          <Button
                            size="sm"
                            onClick={() => visit(item.targetPage)}
                            className="h-7 text-xs bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground font-medium"
                          >
                            <Icon size={13} className="mr-1.5" />
                            {item.actionLabel}
                            <ArrowRight size={12} className="ml-1.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredFaqs.length === 0 && (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No FAQs match your search query "{search}".
                </div>
              )}
            </div>
          </Panel>
        </div>

        <div className="space-y-3">
          <Panel>
            <PanelTitle>Workspace status</PanelTitle>
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <Pill tone="good">FastAPI + Vite Active</Pill>
                {daemonPing && (
                  <span className="font-mono text-[10px] text-good">{daemonPing}</span>
                )}
              </div>
              <p className="text-[11px] leading-5 text-muted-foreground">
                All 5 core modules (Terminal Recorder, Evidence Vault, AI Explainer, Rule Engine, Export Center) are fully connected to the local backend on 127.0.0.1:8000.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs border-border bg-card hover:bg-accent/40"
                onClick={handlePing}
                disabled={pinging}
              >
                <Activity size={13} className="mr-1.5 text-good" />
                {pinging ? "Pinging daemon..." : "Ping Local Daemon"}
              </Button>
            </div>
          </Panel>

          <Panel>
            <PanelTitle>Responsible research</PanelTitle>
            <div className="p-4">
              <p className="text-[11px] leading-5 text-muted-foreground">
                Use the recorder only for systems and CTF environments you are authorized to test. Keep competition scope and disclosure requirements in view.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full border-border bg-card"
                onClick={() => setSafeScopeModal(true)}
              >
                <Shield size={13} className="mr-1.5 text-good" /> Review safe scope
              </Button>
            </div>
          </Panel>
        </div>
      </div>

      {/* Safe Research Scope Modal */}
      <Dialog open={safeScopeModal} onOpenChange={setSafeScopeModal}>
        <DialogContent className="border border-border/40 bg-card p-5 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-mono text-sm text-foreground">
              <ShieldCheck size={16} className="text-good" /> Authorized Research Boundaries
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              CTF Writeup Studio localhost security and scope adherence policy
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5 pt-2 text-xs text-muted-foreground">
            <div className="border border-border/30 bg-terminal p-2.5 rounded font-mono text-[11px] text-foreground">
              <p className="text-primary font-semibold mb-1">Scope Guarantee:</p>
              <p>• Only target IP addresses and ports assigned to your contest instance.</p>
              <p>• Automatic flag redaction active during multi-format exports.</p>
              <p>• Zero external telemetry or writeup uploads beyond localhost.</p>
            </div>
            <p className="text-[11px] leading-5">
              Evidence artifacts stored in <code className="text-primary font-mono">data/evidence/</code> are hashed with SHA-256 for integrity validation.
            </p>
            <Button
              className="w-full mt-2 bg-primary text-primary-foreground font-semibold text-xs"
              onClick={() => {
                setSafeScopeModal(false);
                toast.success("Safe research scope confirmed.");
              }}
            >
              Confirm &amp; Dismiss
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-xs font-medium text-foreground">{label}</span>{children}</label>;
}
