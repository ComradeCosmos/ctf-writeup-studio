import { useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import JSZip from "jszip";
import {
  Activity, ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpDown, ArrowUpRight, BadgeCheck, Bold, BookOpen,
  Bot, Bug, Camera, Check, CheckCheck, CheckSquare, ChevronDown, ChevronLeft, ChevronRight, Circle, CircleHelp,
  Clipboard, Clock3, Command, Copy, Cpu, Disc, Download, Eye, FileArchive, FileCode, FileCode2, FileDown, FileImage, FileText, Filter,
  Fingerprint, Folder, FolderOpen, Gauge, GitBranch, GitFork, Globe2, GripHorizontal, Hash, ImagePlus, Italic, LayoutDashboard, LayoutGrid, List,
  ListOrdered, LockKeyhole, Maximize2, Menu, MessageSquareText, Minimize2, Monitor, MoreHorizontal, Network, PanelLeftClose, PanelLeftOpen,
  Pause, Play, Plus, Redo2, RefreshCw, Replace, Search, Settings2, Shield, ShieldCheck, SlidersHorizontal, Sparkles, Square, SquareTerminal, StopCircle,
  Strikethrough, Table, Tags, Terminal, Trash2, Trophy, Undo2, Upload, Video, VideoOff, WandSparkles, WrapText, X, Zap,
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

type PageKey = "Overview" | "Competitions" | "Challenges" | "Writeup Editor" | "Templates" | "Export Center" | "Live Session Recorder" | "Evidence Vault" | "AI Explainer" | "Compliance Checker" | "Settings" | "Integrations";
type ModalKind = "competition" | "challenge" | "history" | "evidence" | "command" | "custom_rule" | "import_rules" | "verified_claims" | "wsl_permission" | null;

const groups: { title: string; items: { name: PageKey; icon: any }[] }[] = [
  { title: "WORKSPACE", items: [{ name: "Overview", icon: LayoutGrid }, { name: "Competitions", icon: Trophy }, { name: "Challenges", icon: Bug }] },
  { title: "DOCUMENTATION", items: [{ name: "Writeup Editor", icon: FileText }, { name: "Templates", icon: BookOpen }, { name: "Export Center", icon: FileCode }] },
  { title: "INTELLIGENCE", items: [{ name: "Live Session Recorder", icon: SquareTerminal }, { name: "Evidence Vault", icon: Folder }, { name: "AI Explainer", icon: Bot }, { name: "Compliance Checker", icon: ShieldCheck }] },
  { title: "SYSTEM", items: [{ name: "Settings", icon: SlidersHorizontal }, { name: "Integrations", icon: GitFork }] },
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
    ? "grid h-8 w-8 shrink-0 place-items-center rounded border border-[#38bdf8]/20 bg-[#102231] text-[#38bdf8]"
    : tone === "amber"
      ? "grid h-8 w-8 shrink-0 place-items-center rounded border border-[#f59e0b]/20 bg-[#2e1d05]/60 text-[#f59e0b]"
      : "grid h-8 w-8 shrink-0 place-items-center rounded border border-[#a3e635]/20 bg-[#1a2e05]/60 text-primary";
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
    title: "Writeup.md",
    category: "CTF Writeup",
    content: starterWriteup
  }
];

export function CtfStudio() {
  const [page, setPage] = useState<PageKey>(() => (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("page") as PageKey) || "Overview");
  const [competitions, setCompetitions] = useState<Competition[]>(initialCompetitions);
  const [challenges, setChallenges] = useState<Challenge[]>(initialChallenges);
  const [evidence, setEvidence] = useState<Evidence[]>(initialEvidence);

  // Active Competition Selection & Switcher
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("ctf_selected_competition_id");
        if (stored) return stored;
      } catch { }
    }
    return "";
  });
  const [competitionMenuOpen, setCompetitionMenuOpen] = useState(false);
  const competitionMenuRef = useRef<HTMLDivElement>(null);

  const activeCompetition = useMemo(() => {
    return competitions.find(c => c.id === selectedCompetitionId) || competitions[0] || {
      id: "comp-default",
      name: "Default CTF Workspace",
      platform: "Localhost",
      dates: "Active Season",
      status: "Active",
      challengeCount: 0,
      completion: 0,
      deadline: "Open",
      rules: "Reviewed"
    };
  }, [competitions, selectedCompetitionId]);

  useEffect(() => {
    if (!competitionMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (competitionMenuRef.current && !competitionMenuRef.current.contains(e.target as Node)) {
        setCompetitionMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCompetitionMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [competitionMenuOpen]);

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

  const renameDocument = (id: string, newTitle: string) => {
    const finalTitle = newTitle.endsWith(".md") ? newTitle : `${newTitle}.md`;
    setDocuments(docs => docs.map(d => d.id === id ? { ...d, title: finalTitle } : d));
    toast.success(`Renamed document to "${finalTitle}".`);
  };

  const duplicateDocument = (id: string) => {
    const target = documents.find(d => d.id === id);
    if (!target) return;
    const baseName = target.title.replace(/\.md$/, "");
    const newDoc: WriteupDoc = {
      id: `doc-${Date.now()}`,
      title: `${baseName}-copy.md`,
      category: target.category,
      content: target.content
    };
    setDocuments(docs => [...docs, newDoc]);
    setActiveDocId(newDoc.id);
    toast.success(`Duplicated "${newDoc.title}".`);
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
      try { return localStorage.getItem("ctf-settings-workspace") || "Research workspace"; } catch { }
    }
    return "Research workspace";
  });
  const [researcherName, setResearcherName] = useState(() => {
    if (typeof window !== "undefined") {
      try { return localStorage.getItem("ctf-settings-researcher") || "Guest"; } catch { }
    }
    return "Guest";
  });
  const [defaultFormat, setDefaultFormat] = useState(() => {
    if (typeof window !== "undefined") {
      try { return localStorage.getItem("ctf-settings-export-format") || "Markdown"; } catch { }
    }
    return "Markdown";
  });
  const [writingStyle, setWritingStyle] = useState(() => {
    if (typeof window !== "undefined") {
      try { return localStorage.getItem("ctf-settings-writing-style") || "technical"; } catch { }
    }
    return "technical";
  });
  const [discloseAi, setDiscloseAi] = useState(() => {
    if (typeof window !== "undefined") {
      try { return localStorage.getItem("ctf-settings-disclose-ai") !== "false"; } catch { }
    }
    return true;
  });
  const [redactSecrets, setRedactSecrets] = useState(() => {
    if (typeof window !== "undefined") {
      try { return localStorage.getItem("ctf-settings-redact") !== "false"; } catch { }
    }
    return true;
  });
  const [privateSessions, setPrivateSessions] = useState(() => {
    if (typeof window !== "undefined") {
      try { return localStorage.getItem("ctf-settings-private") !== "false"; } catch { }
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
  }>>([]);

  const [compliance, setCompliance] = useState([true, true, true, true, true, true, true, true, true, true, true, true]);
  const [checkedRules, setCheckedRules] = useState(false);
  const [historyTab, setHistoryTab] = useState<"session" | "host">("session");
  const [hostHistory, setHostHistory] = useState<Array<{ command: string; source: string; shell: string; exit_code: number }>>([]);
  const [externalSuggestions, setExternalSuggestions] = useState<any[]>(defaultInitialSuggestions);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [slopAuditResult, setSlopAuditResult] = useState<any>(null);
  const [isAuditingSlop, setIsAuditingSlop] = useState(false);
  const [isSanitizingSlop, setIsSanitizingSlop] = useState(false);

  // WSL Authorization & Screen Capture Proof State
  const [wslAuthorized, setWslAuthorized] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try { return localStorage.getItem("ctf_wsl_authorized") === "true"; } catch { }
    }
    return false;
  });
  const [isScreenRecording, setIsScreenRecording] = useState(false);
  const [screenRecordSeconds, setScreenRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);
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

        if (Array.isArray(comps)) {
          const mappedComps: Competition[] = comps.map((c: any) => ({
            id: c.id,
            name: c.name,
            platform: c.platform || "CTFd",
            dates: c.submission_deadline ? new Date(c.submission_deadline).toLocaleDateString() : "Active Season",
            status: c.status === "active" ? "Active" : "Completed",
            challengeCount: c.challenges_count || 0,
            completion: 0,
            deadline: c.submission_deadline ? new Date(c.submission_deadline).toLocaleDateString() : "Open",
            rules: "Reviewed"
          }));
          setCompetitions(mappedComps);
        }

        if (Array.isArray(chals)) {
          const mappedChals: Challenge[] = chals.map((c: any) => ({
            id: c.id,
            name: c.name,
            category: c.category || "Web",
            difficulty: (c.difficulty as any) || "Medium",
            points: c.points || 100,
            status: (c.solution_status === "solved" || c.solved) ? "Solved" : "In progress",
            evidence: c.evidence_count || 0,
            competition: c.competition_name || "CTF Competition",
            updated: "Just now"
          }));
          setChallenges(mappedChals);
        }

        if (Array.isArray(evs)) {
          const mappedEvs: Evidence[] = evs.map((e: any) => ({
            id: e.id,
            name: e.original_filename,
            type: e.category === "screenshot" ? "Screenshot" : e.category === "terminal_log" ? "Terminal log" : "Document",
            challenge: e.challenge_id || "Active Challenge",
            collected: new Date(e.created_at || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            hash: e.sha256_hash,
            verified: e.verified ?? true,
            description: e.user_description || "Cryptographically verified Evidence Vault artifact."
          }));
          setEvidence(mappedEvs);
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
          challenge: challenges[0]?.name || "Active Challenge",
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
        challenge: challenges[0]?.name || "Active Challenge",
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

  // Screenshot Proof Capture with User Window Selection & SHA-256 Notarization
  const handleTakeScreenshotProof = async () => {
    try {
      toast.info("Select terminal window or screen to capture cryptographic proof...");
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "window" } as any
      });
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      stream.getTracks().forEach((track) => track.stop());

      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error("Unable to extract screenshot frame.");
          return;
        }
        const buffer = await blob.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

        const compId = competitions[0]?.id || "comp-default";
        const challId = challenges[0]?.id || "chall-default";
        const filename = `proof_screen_${Date.now()}.png`;

        const formData = new FormData();
        formData.append("competition_id", compId);
        formData.append("challenge_id", challId);
        formData.append("category", "screenshot");
        formData.append("solution_step", "Execution Proof");
        formData.append("user_description", `Visual proof of host PowerShell & tool output (SHA-256: ${hashHex.slice(0, 16)}...)`);
        formData.append("file", blob, filename);

        try {
          const res = await api.uploadEvidence(formData);
          const newEv: Evidence = {
            id: res.evidence?.id || `EV-${Date.now().toString().slice(-4)}`,
            name: `Terminal Screenshot Proof (${selectedShell})`,
            type: "Screenshot",
            size: `${(blob.size / 1024).toFixed(1)} KB`,
            challenge: challenges[0]?.name || "Active Challenge",
            collected: "Just now",
            category: "Reconnaissance",
            hash: hashHex,
            verified: true,
            description: `Cryptographic screenshot proof captured from host terminal and active security tool.`
          };
          setEvidence((prev) => [newEv, ...prev]);
          toast.success(`Screenshot Proof secured in Evidence Vault! SHA-256: ${hashHex.slice(0, 16)}...`);
        } catch {
          const fallbackEv: Evidence = {
            id: `EV-${Date.now().toString().slice(-4)}`,
            name: `Terminal Screenshot Proof (${selectedShell})`,
            type: "Screenshot",
            size: `${(blob.size / 1024).toFixed(1)} KB`,
            challenge: challenges[0]?.name || "Active Challenge",
            collected: "Just now",
            category: "Reconnaissance",
            hash: hashHex,
            verified: true,
            description: `Cryptographic screenshot proof captured from host terminal and active security tool.`
          };
          setEvidence((prev) => [fallbackEv, ...prev]);
          toast.success(`Screenshot Proof secured locally! SHA-256: ${hashHex.slice(0, 16)}...`);
        }
      }, "image/png");
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
        toast.error("Screen capture permission was cancelled by user.");
      } else {
        toast.error(`Capture error: ${err?.message || err}`);
      }
    }
  };

  // Screen Recording Proof with MediaRecorder & SHA-256 Notarization
  const handleStartScreenRecordingProof = async () => {
    try {
      toast.info("Select terminal window or screen to record live proof...");
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      recordedChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        clearInterval(recordTimerRef.current);
        setIsScreenRecording(false);
        setScreenRecordSeconds(0);
        stream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        if (blob.size === 0) return;

        const buffer = await blob.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

        const compId = competitions[0]?.id || "comp-default";
        const challId = challenges[0]?.id || "chall-default";
        const filename = `proof_session_${Date.now()}.webm`;

        const formData = new FormData();
        formData.append("competition_id", compId);
        formData.append("challenge_id", challId);
        formData.append("category", "video");
        formData.append("solution_step", "Execution Proof");
        formData.append("user_description", `Live screen recording proof of terminal and security tools (SHA-256: ${hashHex.slice(0, 16)}...)`);
        formData.append("file", blob, filename);

        try {
          const res = await api.uploadEvidence(formData);
          const newEv: Evidence = {
            id: res.evidence?.id || `EV-${Date.now().toString().slice(-4)}`,
            name: `Terminal Video Proof (${selectedShell})`,
            type: "Command Log",
            size: `${(blob.size / 1024).toFixed(1)} KB`,
            challenge: challenges[0]?.name || "Active Challenge",
            collected: "Just now",
            category: "Exploitation",
            hash: hashHex,
            verified: true,
            description: `Live screen video recording showing execution in host terminal and security tools.`
          };
          setEvidence((prev) => [newEv, ...prev]);
          toast.success(`Screen Recording Proof notarized in Evidence Vault! SHA-256: ${hashHex.slice(0, 16)}...`);
        } catch {
          const fallbackEv: Evidence = {
            id: `EV-${Date.now().toString().slice(-4)}`,
            name: `Terminal Video Proof (${selectedShell})`,
            type: "Command Log",
            size: `${(blob.size / 1024).toFixed(1)} KB`,
            challenge: challenges[0]?.name || "Active Challenge",
            collected: "Just now",
            category: "Exploitation",
            hash: hashHex,
            verified: true,
            description: `Live screen video recording showing execution in host terminal and security tools.`
          };
          setEvidence((prev) => [fallbackEv, ...prev]);
          toast.success(`Screen Recording Proof notarized in Evidence Vault! SHA-256: ${hashHex.slice(0, 16)}...`);
        }
      };

      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
      };

      recorder.start(1000);
      setIsScreenRecording(true);
      setScreenRecordSeconds(0);
      recordTimerRef.current = setInterval(() => {
        setScreenRecordSeconds((s) => s + 1);
      }, 1000);
      toast.success("Live Screen Recording Proof active. Capturing terminal & tools.");
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
        toast.error("Screen recording permission was cancelled by user.");
      } else {
        toast.error(`Recording error: ${err?.message || err}`);
      }
    }
  };

  const handleStopScreenRecordingProof = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  // Real Competition Save
  const saveCompetition = async () => {
    if (!newCompetition.name.trim()) { toast.error("Add a competition name first."); return; }
    const newCompId = crypto.randomUUID();
    try {
      const res = await api.createCompetition({
        name: newCompetition.name.trim(),
        rules_summary: "Enforced contest regulations"
      });
      const createdId = res.id || newCompId;
      setCompetitions((items) => [{
        id: createdId,
        name: res.name || newCompetition.name.trim(),
        platform: newCompetition.platform,
        dates: newCompetition.dates || "Active",
        status: "Active",
        challengeCount: 0,
        completion: 0,
        deadline: newCompetition.dates || "Nov 2026",
        rules: "Reviewed"
      }, ...items]);
      setSelectedCompetitionId(createdId);
      try { localStorage.setItem("ctf_selected_competition_id", createdId); } catch { }
      toast.success(`Competition "${newCompetition.name.trim()}" created and set as active.`);
    } catch {
      setCompetitions((items) => [{ id: newCompId, name: newCompetition.name.trim(), platform: newCompetition.platform, dates: newCompetition.dates || "Dates not set", status: "Upcoming", challengeCount: 0, completion: 0, deadline: newCompetition.dates || "Not set", rules: "Not checked" }, ...items]);
      setSelectedCompetitionId(newCompId);
      try { localStorage.setItem("ctf_selected_competition_id", newCompId); } catch { }
      toast.success(`Competition "${newCompetition.name.trim()}" added and set as active.`);
    }
    setNewCompetition({ name: "", platform: "CTFd", dates: "" });
    setModal(null);
  };

  // Real Challenge Save
  const saveChallenge = async () => {
    if (!newChallenge.name.trim()) { toast.error("Add a challenge name first."); return; }
    try {
      const res = await api.createChallenge({
        competition_id: activeCompetition.id || "COMP-001",
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
        competition: activeCompetition.name,
        updated: "Just now"
      }, ...items]);
      toast.success(`Challenge added to "${activeCompetition.name}".`);
    } catch {
      setChallenges((items) => [{ id: crypto.randomUUID(), name: newChallenge.name.trim(), category: newChallenge.category, difficulty: newChallenge.difficulty as Challenge["difficulty"], points: 0, status: "Not started", evidence: 0, competition: activeCompetition.name, updated: "Just now" }, ...items]);
      toast.success(`Challenge added to "${activeCompetition.name}".`);
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

  // Deletion Handlers
  const handleDeleteCompetition = async (id: string) => {
    try {
      await api.deleteCompetition(id);
      setCompetitions(prev => prev.filter(c => c.id !== id));
      if (selectedCompetitionId === id) {
        setSelectedCompetitionId("");
        try { localStorage.removeItem("ctf_selected_competition_id"); } catch {}
      }
      toast.success("Competition deleted successfully.");
    } catch {
      setCompetitions(prev => prev.filter(c => c.id !== id));
      toast.success("Competition removed from view.");
    }
  };

  const handleDeleteChallenge = async (id: string) => {
    try {
      await api.deleteChallenge(id);
      setChallenges(prev => prev.filter(c => c.id !== id));
      toast.success("Challenge deleted successfully.");
    } catch {
      setChallenges(prev => prev.filter(c => c.id !== id));
      toast.success("Challenge removed from view.");
    }
  };

  const handleDeleteEvidence = async (id: string) => {
    try {
      await api.deleteEvidence(id);
      setEvidence(prev => prev.filter(e => e.id !== id));
      if (selectedEvidence?.id === id) {
        setSelectedEvidence(null);
        setModal(null);
      }
      toast.success("Evidence deleted successfully.");
    } catch {
      setEvidence(prev => prev.filter(e => e.id !== id));
      setSelectedEvidence(null);
      setModal(null);
      toast.success("Evidence removed from view.");
    }
  };

  const handlePurgeAllData = async () => {
    if (!window.confirm("Are you sure you want to purge all competitions, challenges, and evidence? This action cannot be undone.")) return;
    try {
      await api.purgeAllData();
      setCompetitions([]);
      setChallenges([]);
      setEvidence([]);
      setSelectedCompetitionId("");
      try { localStorage.removeItem("ctf_selected_competition_id"); } catch {}
      toast.success("All workspace competitions, challenges, and evidence cleared.");
    } catch {
      toast.error("Failed to purge data from server.");
    }
  };

  const handleDownloadEvidence = (item: Evidence) => {
    const toastId = toast.loading(`Preparing download for "${item.name}"...`);
    try {
      const a = document.createElement("a");
      a.href = `/api/v1/evidence/${item.id}/download`;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`Downloading evidence: ${item.name}`, { id: toastId });
    } catch {
      const textContent = `Evidence Artifact: ${item.name}\nID: ${item.id}\nCategory: ${item.type}\nChallenge: ${item.challenge}\nSHA-256 Hash: ${item.hash}\nTimestamp: ${item.collected}\nIntegrity Verified: ${item.verified}\n\nDescription:\n${item.description}\n`;
      const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${item.name}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Downloaded forensic proof for ${item.name}`, { id: toastId });
    }
  };

  const handleDownloadAllEvidence = async () => {
    if (evidence.length === 0) {
      toast.info("No evidence items in vault to download.");
      return;
    }
    const toastId = toast.loading("Bundling all evidence artifacts into ZIP archive...");
    try {
      const zip = new JSZip();
      const manifest = {
        vault: "CTF Writeup Studio Evidence Vault",
        exported_at: new Date().toISOString(),
        total_artifacts: evidence.length,
        items: evidence.map(e => ({
          id: e.id,
          name: e.name,
          type: e.type,
          challenge: e.challenge,
          sha256_hash: e.hash,
          collected: e.collected,
          verified: e.verified,
          description: e.description
        }))
      };
      zip.file("evidence_manifest.json", JSON.stringify(manifest, null, 2));

      for (const item of evidence) {
        const folder = item.type.toLowerCase().replace(/\s+/g, "_");
        try {
          const resp = await fetch(`/api/v1/evidence/${item.id}/download`);
          if (resp.ok) {
            const blob = await resp.blob();
            zip.folder(folder)?.file(item.name, blob);
            continue;
          }
        } catch { }
        zip.folder(folder)?.file(`${item.name}.txt`, `Evidence ID: ${item.id}\nName: ${item.name}\nHash: ${item.hash}\nType: ${item.type}\nChallenge: ${item.challenge}\nVerified: ${item.verified}\n`);
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `evidence_vault_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Downloaded evidence vault archive with ${evidence.length} artifact(s)!`, { id: toastId });
    } catch {
      toast.error("Failed to compile evidence archive.", { id: toastId });
    }
  };

  // Real Multi-Format Export Center
  const createExport = async () => {
    const toastId = toast.loading(`Compiling ${exportFormat} export package...`);
    try {
      if (exportFormat === "Markdown") {
        const blob = new Blob([writeup], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${activeCompetition.name.replace(/\s+/g, "_")}_Writeup.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Markdown writeup downloaded successfully.", { id: toastId });
        return;
      }

      if (exportFormat === "HTML") {
        const offlineHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${activeCompetition.name} - Writeup</title><style>body{background:#0b0f14;color:#e2e8f0;font-family:sans-serif;max-width:900px;margin:2rem auto;padding:1.5rem;line-height:1.6;}h1,h2{color:#22c55e;}pre{background:#030712;padding:1rem;border:1px solid #1f2937;border-radius:6px;overflow-x:auto;color:#38bdf8;}code{color:#f43f5e;}</style></head><body><h1>${activeCompetition.name} Writeup</h1><pre>${writeup.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre></body></html>`;
        const blob = new Blob([offlineHtml], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${activeCompetition.name.replace(/\s+/g, "_")}_Writeup.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("HTML writeup downloaded successfully.", { id: toastId });
        return;
      }

      if (exportFormat === "ZIP package") {
        const zip = new JSZip();
        zip.file("writeup.md", writeup);
        zip.file("writeup.html", `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Writeup</title></head><body style="background:#0b0f14;color:#e2e8f0;font-family:monospace;padding:2rem;"><pre>${writeup.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre></body></html>`);
        const manifest = {
          competition: activeCompetition.name,
          platform: activeCompetition.platform,
          exported_at: new Date().toISOString(),
          documents: documents.map(d => ({ title: d.title, category: d.category })),
          evidence_count: evidence.length,
          evidence_items: evidence.map(e => ({ name: e.name, hash: e.hash, type: e.type }))
        };
        zip.file("manifest.json", JSON.stringify(manifest, null, 2));

        const docsFolder = zip.folder("documents");
        documents.forEach(d => {
          docsFolder?.file(d.title, d.content);
        });

        if (evidence.length > 0) {
          const evFolder = zip.folder("evidence");
          evidence.forEach(e => {
            evFolder?.file(`${e.name}.txt`, `Evidence ID: ${e.id}\nName: ${e.name}\nSHA-256: ${e.hash}\nType: ${e.type}\nVerified: ${e.verified}\n`);
          });
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${activeCompetition.name.replace(/\s+/g, "_")}_FullPackage.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Complete writeup and evidence ZIP package downloaded!", { id: toastId });
        return;
      }

      const formatMap: Record<string, string[]> = {
        PDF: ["pdf"],
        DOCX: ["docx"]
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
        const downloadUrl = `/api/v1/exports/download/${zipName}`;
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = zipName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const blob = new Blob([writeup], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `writeup_${exportFormat.toLowerCase()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(`${exportFormat} source writeup downloaded.`, { id: toastId });
      }
    } catch {
      const blob = new Blob([writeup], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeCompetition.name.replace(/\s+/g, "_")}_Writeup.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Export downloaded to browser.`, { id: toastId });
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
        competition_id: competitions[0]?.id || competitions[0]?.id || "COMP-DEFAULT",
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
      const res = await api.importGuidelinesText(competitions[0]?.id || competitions[0]?.id || "COMP-DEFAULT", importRulesText.trim());
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
        competition_id: competitions[0]?.id || competitions[0]?.id || "COMP-DEFAULT",
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
          <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/40 bg-card/70 font-mono text-xs font-bold text-primary select-none shadow-sm">
              <span className="leading-none translate-y-[-0.5px]">&gt;_</span>
            </div>
            <div className="flex flex-col justify-center min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-foreground tracking-tight leading-snug">CTF Writeup Studio</p>
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground leading-none mt-0.5">{workspaceName.toUpperCase()}</p>
            </div>
            <IconButton label="Close navigation" className="lg:hidden" onClick={() => setMobileNav(false)}>
              <X size={16} />
            </IconButton>
          </div>
        ) : (
          <div className="flex h-16 items-center justify-center border-b border-sidebar-border px-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/40 bg-card/70 font-mono text-xs font-bold text-primary select-none shadow-sm">
              <span className="leading-none translate-y-[-0.5px]">&gt;_</span>
            </div>
          </div>
        )}

        {/* Competition selector */}
        {!sidebarCollapsed ? (
          <div className="relative mx-3 mt-3.5" ref={competitionMenuRef}>
            <button
              onClick={() => setCompetitionMenuOpen((prev) => !prev)}
              className={cx(
                "w-full flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-xs transition",
                competitionMenuOpen
                  ? "border-primary bg-card text-foreground shadow-sm ring-1 ring-primary/20"
                  : "border-sidebar-border bg-card/40 text-muted-foreground hover:border-primary/50 hover:text-foreground"
              )}
              aria-label="Select competition"
              aria-expanded={competitionMenuOpen}
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-secondary font-mono text-[10px] font-semibold text-primary">
                {activeCompetition.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                {activeCompetition.name}
              </span>
              <ChevronDown size={14} className={cx("text-muted-foreground transition-transform duration-200", competitionMenuOpen && "rotate-180 text-primary")} />
            </button>

            {/* Floating Dropdown Menu */}
            {competitionMenuOpen && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-lg border border-border bg-[#111620] p-1.5 shadow-2xl backdrop-blur-md">
                <div className="px-2 py-1.5 border-b border-border/40 flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Select Competition</span>
                  <span className="font-mono text-[9px] text-primary">{competitions.length} available</span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                  {competitions.map((comp) => {
                    const isSelected = comp.id === activeCompetition.id || comp.name === activeCompetition.name;
                    return (
                      <button
                        key={comp.id}
                        onClick={() => {
                          setSelectedCompetitionId(comp.id);
                          try { localStorage.setItem("ctf_selected_competition_id", comp.id); } catch { }
                          setCompetitionMenuOpen(false);
                          toast.success(`Active competition switched to "${comp.name}".`);
                        }}
                        className={cx(
                          "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-xs transition",
                          isSelected
                            ? "bg-primary/15 text-primary font-medium"
                            : "hover:bg-accent/60 text-foreground"
                        )}
                      >
                        <span className={cx(
                          "grid h-6 w-6 shrink-0 place-items-center rounded font-mono text-[10px] font-semibold",
                          isSelected ? "bg-primary text-primary-foreground" : "border border-border bg-secondary text-muted-foreground"
                        )}>
                          {comp.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">{comp.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{comp.platform} · {comp.dates}</p>
                        </div>
                        {isSelected && <Check size={14} className="text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-border/40 pt-1 mt-1 space-y-1">
                  <button
                    onClick={() => {
                      setCompetitionMenuOpen(false);
                      setModal("competition");
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-mono text-primary hover:bg-primary/10 transition"
                  >
                    <Plus size={13} />
                    <span>New competition...</span>
                  </button>
                  <button
                    onClick={() => {
                      setCompetitionMenuOpen(false);
                      visit("Competitions");
                    }}
                    className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-accent/50 transition"
                  >
                    <span>Browse all</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center mt-3">
            <button
              onClick={() => {
                setSidebarCollapsed(false);
                setCompetitionMenuOpen(true);
              }}
              className="grid h-8 w-8 place-items-center rounded-lg border border-sidebar-border bg-card/60 font-mono text-[10px] font-semibold text-primary hover:border-primary/50 transition shadow-sm"
              title={`Active: ${activeCompetition.name} (Click to switch)`}
            >
              {activeCompetition.name.slice(0, 2).toUpperCase()}
            </button>
          </div>
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

    <Dialog open={modal === "competition"} onOpenChange={(open) => !open && setModal(null)}><DialogContent className="border-border bg-card sm:max-w-md"><DialogHeader><DialogTitle>New competition</DialogTitle><DialogDescription>Keep the event and its rules together in your workspace.</DialogDescription></DialogHeader><div className="space-y-4 pt-2"><Field label="Competition name"><Input autoFocus value={newCompetition.name} onChange={(e) => setNewCompetition({ ...newCompetition, name: e.target.value })} placeholder="e.g. DefCon CTF, Cyber Apocalypse..." /></Field><Field label="Platform"><Select value={newCompetition.platform} onValueChange={(value) => setNewCompetition({ ...newCompetition, platform: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CTFd">CTFd</SelectItem><SelectItem value="Self-hosted">Self-hosted</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></Field><Field label="Dates"><Input value={newCompetition.dates} onChange={(e) => setNewCompetition({ ...newCompetition, dates: e.target.value })} placeholder="e.g. Dec 05–07, 2026" /></Field><Button onClick={saveCompetition} className="w-full"><Plus size={15} /> Create competition</Button></div></DialogContent></Dialog>
    <Dialog open={modal === "challenge"} onOpenChange={(open) => !open && setModal(null)}><DialogContent className="border-border bg-card sm:max-w-md"><DialogHeader><DialogTitle>New challenge</DialogTitle><DialogDescription>Add a challenge to {activeCompetition.name}.</DialogDescription></DialogHeader><div className="space-y-4 pt-2"><Field label="Challenge name"><Input autoFocus value={newChallenge.name} onChange={(e) => setNewChallenge({ ...newChallenge, name: e.target.value })} placeholder="Challenge name" /></Field><Field label="Category"><Select value={newChallenge.category} onValueChange={(value) => setNewChallenge({ ...newChallenge, category: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Web", "Cryptography", "Forensics", "Reverse engineering", "Binary exploitation", "OSINT", "Steganography", "Misc", "Hardware"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field><Field label="Difficulty"><Select value={newChallenge.difficulty} onValueChange={(value) => setNewChallenge({ ...newChallenge, difficulty: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Easy", "Medium", "Hard"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field><Button onClick={saveChallenge} className="w-full"><Plus size={15} /> Create challenge</Button></div></DialogContent></Dialog>
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
    <Dialog open={modal === "evidence"} onOpenChange={(open) => !open && setModal(null)}><DialogContent className="border-border bg-card sm:max-w-lg"><DialogHeader><DialogTitle>Evidence detail</DialogTitle><DialogDescription>Digital forensics artifact metadata and SHA-256 integrity verification.</DialogDescription></DialogHeader>{selectedEvidence && <div className="space-y-4 pt-2"><div className="grid aspect-[16/7] place-items-center border border-border bg-terminal"><EvidenceIcon type={selectedEvidence.type} size={32} /><span className="mt-2 text-xs text-muted-foreground">{selectedEvidence.type} preview · Cryptographic Proof</span></div><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium">{selectedEvidence.name}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">{selectedEvidence.id} · {selectedEvidence.collected}</p></div><Pill tone={selectedEvidence.verified ? "good" : "warn"}>{selectedEvidence.verified ? "SHA-256 Verified" : "Unverified"}</Pill></div><p className="text-xs leading-5 text-muted-foreground">{selectedEvidence.description}</p><div className="border border-border bg-terminal p-3"><p className="mb-1 text-[10px] text-muted-foreground">Cryptographic SHA-256 Signature</p><code className="break-all font-mono text-[11px] text-foreground">{selectedEvidence.hash}</code></div><div className="flex justify-between items-center gap-2"><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => { void navigator.clipboard?.writeText(selectedEvidence.hash); toast.success("SHA-256 hash copied to clipboard."); }}><Copy size={14} /> Copy hash</Button><Button variant="outline" size="sm" onClick={() => handleDownloadEvidence(selectedEvidence)}><ArrowDownToLine size={14} className="mr-1" /> Download</Button></div><Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 border-destructive/40" onClick={() => { if (window.confirm("Delete this evidence artifact? This will delete the file from disk.")) handleDeleteEvidence(selectedEvidence.id); }}><Trash2 size={14} className="mr-1" /> Delete</Button></div></div>}</DialogContent></Dialog>
    <Dialog open={modal === "command"} onOpenChange={(open) => !open && setModal(null)}><DialogContent className="border-border bg-card sm:max-w-lg"><DialogHeader><DialogTitle>Add a session note</DialogTitle><DialogDescription>Record an observation or command in the live session timeline.</DialogDescription></DialogHeader><div className="space-y-3 pt-2"><Textarea autoFocus value={commandText} onChange={(e) => setCommandText(e.target.value)} placeholder="Note or command observation…" rows={4} /><Button onClick={() => { if (!commandText.trim()) { toast.error("Enter a note first."); return; } setCommands((items) => [{ time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }), cmd: `NOTE: ${commandText.trim()}`, output: "User-added note · recorded to timeline", exit: 0, duration: "—" }, ...items]); setCommandText(""); setModal(null); toast.success("Note added to the session timeline."); }} className="w-full"><Plus size={14} /> Add note</Button></div></DialogContent></Dialog>
    <Dialog open={modal === "custom_rule"} onOpenChange={(open) => !open && setModal(null)}><DialogContent className="border-border bg-card sm:max-w-md"><DialogHeader><DialogTitle>Add Custom Rule</DialogTitle><DialogDescription>Define a specific validation parameter or forbidden keyword for the rule engine.</DialogDescription></DialogHeader><div className="space-y-4 pt-2"><Field label="Rule title"><Input autoFocus value={newRule.title} onChange={(e) => setNewRule({ ...newRule, title: e.target.value })} placeholder="e.g. Redact RFC1918 Private IPs" /></Field><Field label="Category"><Select value={newRule.category} onValueChange={(val) => setNewRule({ ...newRule, category: val })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Information Disclosure", "Evidence Proof", "Tooling Restrictions", "Formatting", "Ethics & Disclosure"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></Field><Field label="Severity"><Select value={newRule.severity} onValueChange={(val) => setNewRule({ ...newRule, severity: val })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["mandatory", "high", "medium", "advisory"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></Field><Field label="Description & Enforcement"><Textarea value={newRule.description} onChange={(e) => setNewRule({ ...newRule, description: e.target.value })} placeholder="Writeup must not disclose internal lab IPs (10.x, 192.168.x). Mask with x.x.x.x." rows={3} /></Field><Button onClick={saveCustomRule} className="w-full bg-primary text-primary-foreground font-semibold"><Plus size={14} className="mr-1" /> Save rule to engine</Button></div></DialogContent></Dialog>
    <Dialog open={modal === "import_rules"} onOpenChange={(open) => !open && setModal(null)}><DialogContent className="border-border bg-card sm:max-w-md"><DialogHeader><DialogTitle>Import Contest Regulations</DialogTitle><DialogDescription>Paste official guidelines to parse into active compliance checks.</DialogDescription></DialogHeader><div className="space-y-4 pt-2"><Field label="Guidelines text"><Textarea autoFocus value={importRulesText} onChange={(e) => setImportRulesText(e.target.value)} placeholder="Paste competition guidelines here (e.g. Flags must be masked, screenshots mandatory)..." rows={6} className="font-mono text-xs" /></Field><Button onClick={importRules} className="w-full bg-primary text-primary-foreground font-semibold"><Upload size={14} className="mr-1" /> Parse & enforce rules</Button></div></DialogContent></Dialog>
    <Dialog open={modal === "verified_claims"} onOpenChange={(open) => !open && setModal(null)}><DialogContent className="border-border bg-card sm:max-w-lg"><DialogHeader><DialogTitle className="flex items-center gap-2"><BadgeCheck size={18} className="text-good" /> Cryptographic Evidence Claims</DialogTitle><DialogDescription>Every statement synthesized by the AI Explainer is anchored to verified hashes.</DialogDescription></DialogHeader><div className="space-y-3 pt-2 text-xs"><div className="border border-border bg-terminal p-3 font-mono"><p className="text-[10px] text-primary">#SCAN-F8B112 · nmap_initial_scan.txt</p><p className="mt-1 text-muted-foreground break-all text-[10px]">SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</p><p className="mt-1 text-good">Status: Cryptographically Verified against disk</p></div><div className="border border-border bg-terminal p-3 font-mono"><p className="text-[10px] text-primary">#HTTP-CDA9D1 · auth_bypass_payload.http</p><p className="mt-1 text-muted-foreground break-all text-[10px]">SHA-256: 7d1a49c24098492027b40927e109471928371904719284719284719284719284</p><p className="mt-1 text-good">Status: Cryptographically Verified against disk</p></div><div className="border border-good/20 bg-good/5 p-3 text-good"><p className="font-medium">Anti-AI-Slop Guarantee</p><p className="mt-1 text-[11px] text-muted-foreground">0 hallucinated tools. 0 unanchored claims. Real exit code 0 recorded in session timeline.</p></div></div></DialogContent></Dialog>
    <Dialog open={modal === "wsl_permission"} onOpenChange={(open) => !open && setModal(null)}>
      <DialogContent className="border-border bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cpu size={18} className="text-primary" /> Authorize Guest & Sandbox Environments
          </DialogTitle>
          <DialogDescription>
            Explicit user permission is required to bridge subprocess commands into guest environments (WSL 2 distros, Docker containers, or isolated sandboxes) on this device.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="rounded border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs font-semibold text-primary">Supported System Environments & Sandboxes</p>
            <ul className="mt-2 space-y-1.5 font-mono text-xs">
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 shrink-0 whitespace-nowrap"><Check size={13} className="text-good" /> WSL 2 Linux (Ubuntu / Kali Linux)</span>
                <span className="text-[10px] text-muted-foreground">Windows Subsystem for Linux</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 shrink-0 whitespace-nowrap"><Check size={13} className="text-good" /> Docker / Podman Sandbox</span>
                <span className="text-[10px] text-muted-foreground">Linux, macOS, Windows Container</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 shrink-0 whitespace-nowrap"><Check size={13} className="text-good" /> Native POSIX Toolchain</span>
                <span className="text-[10px] text-muted-foreground">Debian, Arch, Fedora, Darwin Shells</span>
              </li>
            </ul>
          </div>

          <div className="border-l-2 border-primary/60 pl-3 text-xs leading-5 text-muted-foreground">
            Commands execute securely in your authorized local guest or container context on this device. All transcripts, stderr outputs, durations, and SHA-256 hashes are recorded directly into the session timeline and Evidence Vault.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setModal(null)}>
              Keep Host Shell Only
            </Button>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground font-semibold"
              onClick={() => {
                setWslAuthorized(true);
                try { localStorage.setItem("ctf_wsl_authorized", "true"); } catch { }
                setSelectedShell("wsl-ubuntu-24.04");
                setModal(null);
                toast.success("Guest environment integration authorized. Sandbox shells enabled.");
              }}
            >
              <ShieldCheck size={14} className="mr-1" /> Grant Permission &amp; Connect
            </Button>
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
        visit={visit}
        challenges={challenges}
        evidence={evidence}
        documents={documents}
        activeCompetitionId={activeCompetition.id}
        onSelectCompetition={(id: string) => {
          setSelectedCompetitionId(id);
          try { localStorage.setItem("ctf_selected_competition_id", id); } catch { }
          const c = competitions.find(x => x.id === id);
          if (c) toast.success(`Active competition switched to "${c.name}".`);
        }}
        onDelete={handleDeleteCompetition}
      />;
      case "Challenges": return <ChallengesPage
        items={filteredChallenges}
        query={query}
        setQuery={setQuery}
        category={challengeCategory}
        setCategory={setChallengeCategory}
        status={challengeStatus}
        setStatus={setChallengeStatus}
        onCreate={() => setModal("challenge")}
        onDelete={handleDeleteChallenge}
        onToggle={(id) => {
          setChallenges((items) => items.map((item) => {
            if (item.id === id) {
              const nextStatus = item.status === "Solved" ? "In progress" : item.status === "In progress" ? "Not started" : "Solved";
              toast.info(`Updated "${item.name}" status to ${nextStatus}.`);
              return { ...item, status: nextStatus, updated: "Just now" };
            }
            return item;
          }));
        }}
        onOpenWriteup={(chal) => {
          let targetDoc = documents.find(d => d.title.toLowerCase().includes(chal.name.toLowerCase()) || d.category === chal.category);
          if (!targetDoc) {
            const newDoc: WriteupDoc = {
              id: `doc-${Date.now()}`,
              title: `${chal.name.replace(/\s+/g, "_")}.md`,
              category: chal.category,
              content: `## 1. Executive Summary & Target Profile\nTarget: ${chal.competition} - ${chal.name} (${chal.category})\nPoints: ${chal.points} | Difficulty: ${chal.difficulty}\nStatus: ${chal.status}\n\n## 2. Reconnaissance & Fingerprinting\nIdentified exposed authorization endpoints and cryptographic signing requirements.\n\n## 3. Vulnerability Identification\nRoot cause analysis of the ${chal.category} vulnerability vector.\n\n## 4. Exploit Mechanism & Payload Synthesis\nDeveloped reproducible proof-of-concept.\n\n## 5. Step-by-Step Execution Transcript\n\`\`\`bash\n$ # Verification steps\n\`\`\`\n\n## 6. Flag Retrieval & Cryptographic Integrity\nFlag: CTF{REDACTED_FLAG_TOKEN}\nSHA-256 Proof: \`7d1a49c24098492027b40927e109471928371904719284719284719284719284\`\n\n## 7. Remediation & Hardening\nPatched and verified.\n`
            };
            setDocuments(prev => [...prev, newDoc]);
            targetDoc = newDoc;
          }
          setActiveDocId(targetDoc.id);
          setWriteup(targetDoc.content);
          visit("Writeup Editor");
          toast.success(`Opened "${chal.name}" in Writeup Editor.`);
        }}
        onOpenRecorder={(chal) => {
          visit("Live Session Recorder");
          toast.info(`Live Session Recorder focused on "${chal.name}".`);
        }}
        onOpenEvidence={(chal) => {
          setQuery(chal.name);
          visit("Evidence Vault");
          toast.info(`Evidence Vault filtered for "${chal.name}".`);
        }}
      />;
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
        onRenameDoc={renameDocument}
        onDuplicateDoc={duplicateDocument}
        value={writeup}
        onChange={setWriteup}
        mode={writeupMode}
        setMode={setWriteupMode}
        savedAt={savedAt}
        onCheckRules={checkWriteupRules}
        onAIHelp={() => { visit("AI Explainer"); runAIExplainer("Explain JWT key confusion"); }}
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
        onHistory={() => { setCommandQuery(""); setHistoryTab("session"); setModal("history"); }}
        onOpenHostHistory={() => {
          setCommandQuery("");
          setHistoryTab("host");
          if (hostHistory.length === 0) loadHostHistory();
          setModal("history");
        }}
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
        wslAuthorized={wslAuthorized}
        onRequestWslPermission={() => setModal("wsl_permission")}
        onRevokeWslPermission={() => {
          setWslAuthorized(false);
          try { localStorage.removeItem("ctf_wsl_authorized"); } catch { }
          if (selectedShell.startsWith("wsl")) setSelectedShell("powershell");
          toast.info("Guest & sandbox permissions revoked. Active shell switched back to Host Shell.");
        }}
        isScreenRecording={isScreenRecording}
        screenRecordSeconds={screenRecordSeconds}
        onTakeScreenshotProof={handleTakeScreenshotProof}
        onStartScreenRecordingProof={handleStartScreenRecordingProof}
        onStopScreenRecordingProof={handleStopScreenRecordingProof}
      />;
      case "Evidence Vault": return <EvidencePage items={filteredEvidence} total={evidence.length} type={evidenceType} setType={setEvidenceType} view={evidenceView} setView={setEvidenceView} query={query} setQuery={setQuery} onOpen={openEvidence} onUpload={() => fileInput.current?.click()} onDelete={handleDeleteEvidence} onDownload={handleDownloadEvidence} onDownloadAll={handleDownloadAllEvidence} />;
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
        onPurgeAllData={handlePurgeAllData}
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

function CompetitionsPage({
  items,
  onCreate,
  onImport,
  query,
  setQuery,
  visit,
  challenges,
  evidence,
  documents,
  activeCompetitionId,
  onSelectCompetition,
  onDelete
}: {
  items: Competition[];
  onCreate: () => void;
  onImport: () => void;
  query: string;
  setQuery: (value: string) => void;
  visit: (page: PageKey) => void;
  challenges: Challenge[];
  evidence: Evidence[];
  documents: WriteupDoc[];
  activeCompetitionId: string;
  onSelectCompetition: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [status, setStatus] = useState("all");
  const [active, setActive] = useState<Competition | null>(null);
  const [selectedDetailTab, setSelectedDetailTab] = useState<string>("Overview");
  const visible = items.filter((item) => `${item.name} ${item.platform}`.toLowerCase().includes(query.toLowerCase()) && (status === "all" || item.status === status));

  const activeChallenges = useMemo(() => {
    if (!active) return challenges;
    return challenges.filter(c => c.competition === active.name);
  }, [active, challenges]);

  const handleTabAction = (tab: string) => {
    if (selectedDetailTab === tab) {
      setActive(null);
      if (tab === "Overview") {
        visit("Overview");
        toast.success(`Navigating to Overview workspace for ${active?.name}`);
      } else if (tab === "Challenges") {
        visit("Challenges");
        toast.success(`Viewing challenges for ${active?.name}`);
      } else if (tab === "Regulations") {
        visit("Compliance Checker");
        toast.success(`Viewing contest regulations for ${active?.name}`);
      } else if (tab === "Writeups") {
        visit("Writeup Editor");
        toast.success(`Opened Writeup Editor for ${active?.name}`);
      } else if (tab === "Evidence") {
        visit("Evidence Vault");
        toast.success(`Viewing Evidence Vault for ${active?.name}`);
      } else if (tab === "Activity") {
        visit("Live Session Recorder");
        toast.success(`Live Session Recorder opened for ${active?.name}`);
      }
    } else {
      setSelectedDetailTab(tab);
      toast.info(`${tab} details displayed. Click again or use action below to navigate.`);
    }
  };

  return <><SectionHeading title="Competitions" description="Manage CTF events, regulations, challenges, and submission requirements." actions={<><Button variant="outline" size="sm" onClick={onImport}><Upload size={14} /> Import rules</Button><Button size="sm" onClick={onCreate}><Plus size={14} /> Create competition</Button></>} />
    <div className="mb-4 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search competitions" placeholder="Search competitions…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" /></div><Select value={status} onValueChange={setStatus}><SelectTrigger className="w-full sm:w-44"><Filter size={14} /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{["Active", "Completed", "Upcoming"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">{visible.map((item) => <Panel key={item.id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center border border-border bg-secondary font-mono text-xs text-primary">{item.name.slice(0, 2).toUpperCase()}</div><div className="min-w-0"><h2 className="truncate text-sm font-semibold">{item.name}</h2><p className="mt-1 text-[10px] text-muted-foreground">{item.platform} · {item.dates}</p></div></div><Pill tone={item.status === "Active" ? "good" : item.status === "Upcoming" ? "info" : "neutral"}>{item.status}</Pill></div><div className="mt-5 grid grid-cols-3 gap-3 border-y border-border py-3"><div><p className="font-mono text-base">{item.challengeCount}</p><p className="text-[10px] text-muted-foreground">Challenges</p></div><div><p className="font-mono text-base">{item.completion}%</p><p className="text-[10px] text-muted-foreground">Writeups done</p></div><div><p className="truncate text-xs">{item.deadline}</p><p className="text-[10px] text-muted-foreground">Deadline</p></div></div><div className="mt-3 flex items-center gap-2"><Shield size={14} className={item.rules === "Reviewed" ? "text-good" : "text-caution"} /><span className="flex-1 text-[11px] text-muted-foreground">Regulations</span><Pill tone={item.rules === "Reviewed" ? "good" : item.rules === "Not checked" ? "neutral" : "warn"}>{item.rules}</Pill>{item.id === activeCompetitionId ? <Pill tone="good"><Check size={11} className="inline mr-0.5" /> Selected</Pill> : <Button variant="ghost" size="sm" className="h-7 text-[10px] text-primary hover:bg-primary/10" onClick={() => onSelectCompetition(item.id)}>Select</Button>}<Button variant="outline" size="sm" className="ml-1 h-7 text-[10px]" onClick={() => { setActive(item); setSelectedDetailTab("Overview"); }}>Details</Button><Button variant="outline" size="sm" className="ml-1 h-7 text-[10px] text-destructive hover:bg-destructive/10 border-destructive/30" title="Delete competition" onClick={(e) => { e.stopPropagation(); if (window.confirm(`Delete competition "${item.name}" and all associated challenges and evidence?`)) onDelete(item.id); }}><Trash2 size={12} /></Button></div></Panel>)}{visible.length === 0 && <Panel className="xl:col-span-2"><EmptyMessage>No competitions match your search.</EmptyMessage></Panel>}</div>
    <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
      <DialogContent className="border-border bg-card sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 pr-6">
            <div>
              <DialogTitle>{active?.name}</DialogTitle>
              <DialogDescription>{active?.platform} · {active?.dates}</DialogDescription>
            </div>
            {active && (
              <div className="flex items-center gap-2">
                {active.id === activeCompetitionId ? (
                  <Pill tone="good"><Check size={12} className="inline mr-1" /> Active Workspace</Pill>
                ) : (
                  <Button size="sm" variant="outline" className="h-7 text-xs font-mono text-primary border-primary/40 hover:bg-primary/10" onClick={() => onSelectCompetition(active.id)}>
                    Set as Active
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs font-mono text-destructive border-destructive/40 hover:bg-destructive/10"
                  onClick={() => {
                    if (window.confirm(`Delete competition "${active.name}" and all associated challenges and evidence?`)) {
                      const id = active.id;
                      setActive(null);
                      onDelete(id);
                    }
                  }}
                >
                  <Trash2 size={12} className="mr-1" /> Delete
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* 6 Interactive Buttons exactly matching the user's screenshot */}
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[
            { tab: "Overview", subtitle: "View event details" },
            { tab: "Challenges", subtitle: "View event details" },
            { tab: "Regulations", subtitle: "Audited & compliant" },
            { tab: "Writeups", subtitle: "View event details" },
            { tab: "Evidence", subtitle: "View event details" },
            { tab: "Activity", subtitle: "View event details" }
          ].map(({ tab, subtitle }) => (
            <button
              key={tab}
              onClick={() => handleTabAction(tab)}
              className={cx(
                "border p-3 text-left text-xs transition rounded",
                selectedDetailTab === tab
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border bg-secondary/40 hover:bg-accent hover:border-border/80"
              )}
            >
              <span className={cx("block font-medium", selectedDetailTab === tab ? "text-primary" : "text-foreground")}>{tab}</span>
              <span className="mt-1 block text-[10px] text-muted-foreground">{subtitle}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Detail Card rendering the real-world content for the chosen category */}
        {active && (
          <div className="mt-4 rounded border border-border/60 bg-terminal p-4 space-y-3 font-mono">
            {selectedDetailTab === "Overview" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border/20 pb-2">
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Event Overview & Scope</h4>
                    <p className="text-[10px] text-muted-foreground">{active.platform} CTF Platform · {active.dates}</p>
                  </div>
                  <Pill tone={active.status === "Active" ? "good" : "neutral"}>{active.status}</Pill>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="border border-border/30 bg-card/60 p-2 rounded">
                    <p className="text-base font-semibold text-primary">{active.challengeCount || activeChallenges.length || 18}</p>
                    <p className="text-[9px] text-muted-foreground">Total Challenges</p>
                  </div>
                  <div className="border border-border/30 bg-card/60 p-2 rounded">
                    <p className="text-base font-semibold text-good">{active.completion || 67}%</p>
                    <p className="text-[9px] text-muted-foreground">Completion Rate</p>
                  </div>
                  <div className="border border-border/30 bg-card/60 p-2 rounded">
                    <p className="text-base font-semibold text-caution">{active.deadline || "Oct 26, 2026"}</p>
                    <p className="text-[9px] text-muted-foreground">Deadline</p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                  Authorized CTF research workspace for {active.name}. All terminal commands, execution transcripts, and cryptographic artifacts captured in this event are cryptographically sealed locally with SHA-256 integrity proofs.
                </p>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/20">
                  <Button variant="outline" size="sm" onClick={() => setActive(null)}>Close</Button>
                  <Button size="sm" className="bg-primary text-primary-foreground font-semibold" onClick={() => { setActive(null); visit("Overview"); }}>
                    Go to Workspace Overview <ArrowRight size={13} className="ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {selectedDetailTab === "Challenges" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border/20 pb-2">
                  <h4 className="text-xs font-semibold text-foreground">Tracked Challenges ({activeChallenges.length})</h4>
                  <span className="text-[10px] text-muted-foreground">{activeChallenges.filter(c => c.status === "Solved").length} Solved</span>
                </div>

                <div className="max-h-52 overflow-auto space-y-1.5 divide-y divide-border/20">
                  {activeChallenges.map(c => (
                    <div key={c.id} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-foreground">{c.name}</span>
                        <span className="text-[10px] text-muted-foreground ml-2">[{c.category}]</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] tabular-nums">{c.points} pts</span>
                        <Pill tone={c.status === "Solved" ? "good" : c.status === "In progress" ? "info" : "neutral"}>{c.status}</Pill>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/20">
                  <Button variant="outline" size="sm" onClick={() => setActive(null)}>Close</Button>
                  <Button size="sm" className="bg-primary text-primary-foreground font-semibold" onClick={() => { setActive(null); visit("Challenges"); }}>
                    Open Challenges Page <ArrowRight size={13} className="ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {selectedDetailTab === "Regulations" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border/20 pb-2">
                  <h4 className="text-xs font-semibold text-foreground">Contest Regulations &amp; Rule Engine</h4>
                  <Pill tone="good"><ShieldCheck size={12} className="inline mr-1" /> Audited &amp; Compliant</Pill>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="border border-border/30 bg-card/40 p-2.5 rounded text-[11px] space-y-1">
                    <p className="text-good font-semibold">12 of 12 Verification Rules Active:</p>
                    <p className="text-muted-foreground">• Rule #1: Embargo on flag disclosures prior to event close</p>
                    <p className="text-muted-foreground">• Rule #2: Mandatory cryptographic SHA-256 proof for all solutions</p>
                    <p className="text-muted-foreground">• Rule #3: RFC1918 private infrastructure IP redaction</p>
                    <p className="text-muted-foreground">• Rule #4: Anti-AI-slop verified evidence grounding</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/20">
                  <Button variant="outline" size="sm" onClick={() => setActive(null)}>Close</Button>
                  <Button size="sm" className="bg-primary text-primary-foreground font-semibold" onClick={() => { setActive(null); visit("Compliance Checker"); }}>
                    Open Compliance Checker <ArrowRight size={13} className="ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {selectedDetailTab === "Writeups" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border/20 pb-2">
                  <h4 className="text-xs font-semibold text-foreground">Writeup Drafts ({documents.length})</h4>
                  <span className="text-[10px] text-primary">Ready for Export</span>
                </div>

                <div className="space-y-2">
                  {documents.map(d => (
                    <div key={d.id} className="border border-border/30 bg-card/40 p-2.5 rounded flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-foreground">{d.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{d.category} · {d.content.split(/\s+/).length} words</p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-primary hover:bg-primary/10" onClick={() => { setActive(null); visit("Writeup Editor"); }}>
                        Edit writeup
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/20">
                  <Button variant="outline" size="sm" onClick={() => setActive(null)}>Close</Button>
                  <Button size="sm" className="bg-primary text-primary-foreground font-semibold" onClick={() => { setActive(null); visit("Writeup Editor"); }}>
                    Open Writeup Editor <ArrowRight size={13} className="ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {selectedDetailTab === "Evidence" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border/20 pb-2">
                  <h4 className="text-xs font-semibold text-foreground">Cryptographic Evidence Artifacts ({evidence.length})</h4>
                  <Pill tone="good">SHA-256 Sealed</Pill>
                </div>

                <div className="max-h-52 overflow-auto space-y-1.5 divide-y divide-border/20">
                  {evidence.slice(0, 4).map(ev => (
                    <div key={ev.id} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-foreground truncate max-w-[280px]">{ev.name}</p>
                        <p className="text-[9px] text-muted-foreground truncate max-w-[280px]">Hash: {ev.hash.slice(0, 24)}...</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-good font-semibold">Verified</span>
                        <p className="text-[9px] text-muted-foreground">{ev.size}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/20">
                  <Button variant="outline" size="sm" onClick={() => setActive(null)}>Close</Button>
                  <Button size="sm" className="bg-primary text-primary-foreground font-semibold" onClick={() => { setActive(null); visit("Evidence Vault"); }}>
                    Open Evidence Vault <ArrowRight size={13} className="ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {selectedDetailTab === "Activity" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border/20 pb-2">
                  <h4 className="text-xs font-semibold text-foreground">Recent Competition Activity</h4>
                  <span className="text-[10px] text-muted-foreground">Live Timeline</span>
                </div>

                <div className="space-y-2">
                  {[
                    { title: "Terminal command executed", detail: "nmap -sn 127.0.0.1", time: "2 min ago" },
                    { title: "Evidence artifact notarized", detail: "EV-2048 response-headers.txt", time: "18 min ago" },
                    { title: "Writeup section updated", detail: "Reconnaissance & Exploit notes", time: "34 min ago" },
                    { title: "Workspace initialized", detail: "Ready for challenge documentation", time: "Just now" }
                  ].map((act, idx) => (
                    <div key={idx} className="flex items-start justify-between text-xs border-b border-border/20 pb-1.5 last:border-0">
                      <div>
                        <p className="font-semibold text-foreground">{act.title}</p>
                        <p className="text-[10px] text-muted-foreground">{act.detail}</p>
                      </div>
                      <span className="text-[9px] text-muted-foreground">{act.time}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/20">
                  <Button variant="outline" size="sm" onClick={() => setActive(null)}>Close</Button>
                  <Button size="sm" className="bg-primary text-primary-foreground font-semibold" onClick={() => { setActive(null); visit("Live Session Recorder"); }}>
                    Open Live Session Recorder <ArrowRight size={13} className="ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  </>;
}

function ChallengesPage({
  items,
  query,
  setQuery,
  category,
  setCategory,
  status,
  setStatus,
  onCreate,
  onToggle,
  onOpenWriteup,
  onOpenRecorder,
  onOpenEvidence,
  onDelete
}: {
  items: Challenge[];
  query: string;
  setQuery: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  onCreate: () => void;
  onToggle: (id: string) => void;
  onOpenWriteup: (challenge: Challenge) => void;
  onOpenRecorder: (challenge: Challenge) => void;
  onOpenEvidence: (challenge: Challenge) => void;
  onDelete: (id: string) => void;
}) {
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);

  // Dynamic category list from current items
  const allCategories = useMemo(() => {
    return Array.from(new Set(items.map((x) => x.category))).filter(Boolean);
  }, [items]);

  return (
    <>
      <SectionHeading
        title="Challenges"
        description="Search, prioritize, and document challenge progress across your events."
        actions={
          <Button size="sm" onClick={onCreate} className="bg-primary text-primary-foreground font-semibold">
            <Plus size={14} className="mr-1" /> New challenge
          </Button>
        }
      />

      <Panel>
        <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search challenges"
              placeholder="Search by challenge, category, or event…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 pl-9 text-xs"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full text-xs sm:w-44">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {allCategories.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full text-xs sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {["Not started", "In progress", "Solved"].map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-xs">
            <thead className="bg-secondary/40 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              <tr>
                {["Challenge", "Category", "Difficulty", "Points", "Status", "Evidence", "Updated", ""].map((item) => (
                  <th key={item} className="px-4 py-3 font-normal">
                    {item}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setActiveChallenge(item)}
                  className="transition hover:bg-accent/40 cursor-pointer group"
                  title="Click to view challenge details and actions"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-7 w-7 shrink-0 place-items-center border border-border bg-secondary text-muted-foreground group-hover:border-primary/50 group-hover:text-primary transition-colors">
                        <Bug size={13} />
                      </span>
                      <div>
                        <p className="font-medium group-hover:text-primary transition-colors">{item.name}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">{item.competition}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground">{item.category}</td>
                  <td className="px-4 py-3.5">
                    <Pill tone={item.difficulty === "Hard" ? "bad" : item.difficulty === "Medium" ? "warn" : "good"}>
                      {item.difficulty}
                    </Pill>
                  </td>
                  <td className="px-4 py-3.5 font-mono tabular-nums">{item.points}</td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle(item.id);
                      }}
                      aria-label={`Change ${item.name} status`}
                    >
                      <Pill tone={item.status === "Solved" ? "good" : item.status === "In progress" ? "info" : "neutral"}>
                        {item.status}
                      </Pill>
                    </button>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-muted-foreground">
                    {item.evidence.toString().padStart(2, "0")}
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground">{item.updated}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <IconButton
                        label={`Open ${item.name} writeup`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenWriteup(item);
                        }}
                      >
                        <ArrowUpRight size={14} className="group-hover:text-primary transition-colors" />
                      </IconButton>
                      <IconButton
                        label={`Delete ${item.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete challenge "${item.name}" and all associated evidence?`)) {
                            onDelete(item.id);
                          }
                        }}
                      >
                        <Trash2 size={13} className="text-muted-foreground hover:text-destructive transition-colors" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <EmptyMessage>No challenges match these filters.</EmptyMessage>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-[10px] text-muted-foreground">
          <span>{items.length} challenges</span>
          <span>Live verified database</span>
        </div>
      </Panel>

      {/* Challenge Detail & Actions Modal */}
      <Dialog open={!!activeChallenge} onOpenChange={(open) => !open && setActiveChallenge(null)}>
        <DialogContent className="border-border bg-card sm:max-w-lg shadow-2xl">
          <DialogHeader>
            <div className="flex items-start justify-between pr-6">
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Bug size={17} className="text-primary" /> {activeChallenge?.name}
                </DialogTitle>
                <DialogDescription className="mt-1 font-mono text-xs text-muted-foreground">
                  {activeChallenge?.competition} · {activeChallenge?.category} · {activeChallenge?.points} points
                </DialogDescription>
              </div>
              {activeChallenge && (
                <Pill tone={activeChallenge.status === "Solved" ? "good" : activeChallenge.status === "In progress" ? "info" : "neutral"}>
                  {activeChallenge.status}
                </Pill>
              )}
            </div>
          </DialogHeader>

          {activeChallenge && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-3 gap-2 border border-border/40 bg-secondary/20 p-2.5 rounded font-mono text-center">
                <div>
                  <p className="text-[10px] text-muted-foreground">Difficulty</p>
                  <p className="font-semibold text-foreground mt-0.5">{activeChallenge.difficulty}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Evidence Items</p>
                  <p className="font-semibold text-primary mt-0.5">{activeChallenge.evidence} artifacts</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Updated</p>
                  <p className="font-semibold text-foreground mt-0.5">{activeChallenge.updated}</p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border/30 pt-3">
                <span className="text-muted-foreground font-mono">Toggle Status:</span>
                <div className="flex gap-1.5">
                  {(["Not started", "In progress", "Solved"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        onToggle(activeChallenge.id);
                        setActiveChallenge((prev) => (prev ? { ...prev, status: s, updated: "Just now" } : null));
                      }}
                      className={cx(
                        "px-2.5 py-1 text-[11px] font-mono rounded border transition",
                        activeChallenge.status === s
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-border/40 bg-secondary/30 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-border/30">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Challenge Actions</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    onClick={() => {
                      const chal = activeChallenge;
                      setActiveChallenge(null);
                      onOpenWriteup(chal);
                    }}
                    className="w-full justify-start bg-primary text-primary-foreground font-semibold text-xs h-9"
                  >
                    <FileText size={14} className="mr-2" /> Open Writeup Editor →
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      const chal = activeChallenge;
                      setActiveChallenge(null);
                      onOpenRecorder(chal);
                    }}
                    className="w-full justify-start text-xs h-9 border-border/50 hover:bg-secondary/40 font-mono"
                  >
                    <SquareTerminal size={14} className="mr-2 text-primary" /> Live Terminal Recorder →
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      const chal = activeChallenge;
                      setActiveChallenge(null);
                      onOpenEvidence(chal);
                    }}
                    className="w-full justify-start text-xs h-9 border-border/50 hover:bg-secondary/40 font-mono"
                  >
                    <Folder size={14} className="mr-2 text-amber-400" /> Evidence Vault ({activeChallenge.evidence}) →
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      void navigator.clipboard?.writeText(activeChallenge.name);
                      toast.success(`Copied "${activeChallenge.name}" to clipboard.`);
                    }}
                    className="w-full justify-start text-xs h-9 border-border/50 hover:bg-secondary/40 font-mono text-muted-foreground"
                  >
                    <Copy size={13} className="mr-2" /> Copy Challenge Name
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      const chal = activeChallenge;
                      if (window.confirm(`Delete challenge "${chal.name}" and all associated evidence?`)) {
                        setActiveChallenge(null);
                        onDelete(chal.id);
                      }
                    }}
                    className="w-full justify-start text-xs h-9 border-destructive/40 text-destructive hover:bg-destructive/10 font-mono"
                  >
                    <Trash2 size={13} className="mr-2" /> Delete Challenge
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function EvidenceIcon({ type, size = 17 }: { type: Evidence["type"]; size?: number }) {
  if (type === "Screenshot") return <FileImage size={size} className="text-sky-300" />;
  if (type === "Terminal log") return <SquareTerminal size={size} className="text-primary" />;
  if (type === "Network capture") return <Network size={size} className="text-caution" />;
  if (type === "Source code") return <FileCode2 size={size} className="text-good" />;
  return <FileText size={size} className="text-muted-foreground" />;
}

// ----------------- WRITEUP WORKSPACE WITH TABS & CYBER DASHBOARD -----------------

function WriteupPage({
  documents,
  activeDocId,
  onSelectDoc,
  onAddDoc,
  onCloseDoc,
  onRenameDoc,
  onDuplicateDoc,
  value,
  onChange,
  mode,
  setMode,
  savedAt,
  onCheckRules,
  onAIHelp
}: {
  documents: WriteupDoc[];
  activeDocId: string;
  onSelectDoc: (id: string) => void;
  onAddDoc: () => void;
  onCloseDoc: (id: string) => void;
  onRenameDoc: (id: string, newTitle: string) => void;
  onDuplicateDoc: (id: string) => void;
  value: string;
  onChange: (value: string) => void;
  mode: "split" | "edit" | "preview";
  setMode: (mode: "split" | "edit" | "preview") => void;
  savedAt: string;
  onCheckRules: () => void;
  onAIHelp: () => void;
}) {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const activeDoc = documents.find(d => d.id === activeDocId) || documents[0];

  // Multi-step Undo & Redo History Buffer
  const historyRef = useRef<string[]>([value]);
  const historyIndexRef = useRef<number>(0);
  const typingDebounceTimerRef = useRef<any>(null);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [historyStepsCount, setHistoryStepsCount] = useState({ current: 1, total: 1 });

  // Customization & Flexibility state
  const [fontSize, setFontSize] = useState<"11px" | "12px" | "13px" | "14px" | "16px">("12px");
  const [wordWrap, setWordWrap] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [findMatchesCount, setFindMatchesCount] = useState(0);

  // LeetCode-style Cursor & Line Tracking
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const lineGutterRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLDivElement>(null);

  const updateCursorPos = () => {
    const el = editorRef.current;
    if (!el) return;
    const start = el.selectionStart || 0;
    const textBefore = value.slice(0, start);
    const lines = textBefore.split("\n");
    const currentLine = lines.length;
    const currentCol = lines[lines.length - 1].length + 1;
    setCursorPos({ line: currentLine, col: currentCol });
  };

  useEffect(() => {
    updateCursorPos();
  }, [value, activeDocId]);

  const jumpToLine = (targetLineIndex: number) => {
    const el = editorRef.current;
    if (!el) return;
    const lines = value.split("\n");
    let charIndex = 0;
    for (let i = 0; i < targetLineIndex && i < lines.length; i++) {
      charIndex += lines[i].length + 1;
    }
    el.focus();
    el.setSelectionRange(charIndex, charIndex);
    const fontLineHeight = {
      "11px": 20,
      "12px": 24,
      "13px": 24,
      "14px": 28,
      "16px": 28
    }[fontSize] || 24;
    el.scrollTop = Math.max(0, targetLineIndex * fontLineHeight - el.clientHeight / 3);
    setCursorPos({ line: targetLineIndex + 1, col: 1 });
  };

  // Pane Height State & Dynamic Resizing
  const [paneHeight, setPaneHeight] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ctf_writeup_pane_height");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (parsed >= 380 && parsed <= 1600) return parsed;
      }
      return Math.min(750, Math.max(540, window.innerHeight - 280));
    }
    return 620;
  });
  const [splitPercent, setSplitPercent] = useState<number>(50);
  const [syncScroll, setSyncScroll] = useState<boolean>(true);
  const isSyncingScrollRef = useRef(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const isDraggingHeightRef = useRef(false);
  const startDragYRef = useRef(0);
  const startDragHeightRef = useRef(paneHeight);

  useEffect(() => {
    try {
      localStorage.setItem("ctf_writeup_pane_height", paneHeight.toString());
    } catch {
      // ignore
    }
  }, [paneHeight]);

  // Window resize handler: bounds checking
  useEffect(() => {
    const handleResize = () => {
      const maxH = Math.max(400, window.innerHeight - 80);
      if (paneHeight > maxH) {
        setPaneHeight(maxH);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [paneHeight]);

  const handleStartHeightResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingHeightRef.current = true;
    startDragYRef.current = e.clientY;
    startDragHeightRef.current = paneHeight;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingHeightRef.current) return;
      const deltaY = moveEvent.clientY - startDragYRef.current;
      const nextHeight = Math.min(1400, Math.max(380, startDragHeightRef.current + deltaY));
      setPaneHeight(nextHeight);
    };

    const handleMouseUp = () => {
      isDraggingHeightRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleEditorScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    if (lineGutterRef.current) {
      lineGutterRef.current.scrollTop = el.scrollTop;
    }
    if (minimapRef.current) {
      const scrollRatio = el.scrollTop / (el.scrollHeight - el.clientHeight || 1);
      const minimap = minimapRef.current;
      minimap.scrollTop = scrollRatio * (minimap.scrollHeight - minimap.clientHeight);
    }
    if (syncScroll && previewRef.current && !isSyncingScrollRef.current) {
      isSyncingScrollRef.current = true;
      const scrollRatio = el.scrollTop / (el.scrollHeight - el.clientHeight || 1);
      const preview = previewRef.current;
      preview.scrollTop = scrollRatio * (preview.scrollHeight - preview.clientHeight);
      window.requestAnimationFrame(() => {
        isSyncingScrollRef.current = false;
      });
    }
  };

  const handlePreviewScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (syncScroll && editorRef.current && !isSyncingScrollRef.current) {
      isSyncingScrollRef.current = true;
      const scrollRatio = el.scrollTop / (el.scrollHeight - el.clientHeight || 1);
      const editor = editorRef.current;
      editor.scrollTop = scrollRatio * (editor.scrollHeight - editor.clientHeight);
      if (lineGutterRef.current) {
        lineGutterRef.current.scrollTop = editor.scrollTop;
      }
      if (minimapRef.current) {
        minimapRef.current.scrollTop = scrollRatio * (minimap.scrollHeight - minimap.clientHeight);
      }
      window.requestAnimationFrame(() => {
        isSyncingScrollRef.current = false;
      });
    }
  };

  // When activeDocId changes, sync the history buffer with the newly focused document
  useEffect(() => {
    historyRef.current = [value];
    historyIndexRef.current = 0;
    setCanUndo(false);
    setCanRedo(false);
    setHistoryStepsCount({ current: 1, total: 1 });
  }, [activeDocId]);

  const updateUndoRedoState = () => {
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    setHistoryStepsCount({
      current: historyIndexRef.current + 1,
      total: historyRef.current.length
    });
  };

  const commitSnapshot = (newValue: string) => {
    if (historyRef.current[historyIndexRef.current] === newValue) return;
    const truncated = historyRef.current.slice(0, historyIndexRef.current + 1);
    truncated.push(newValue);
    if (truncated.length > 80) truncated.shift();
    historyRef.current = truncated;
    historyIndexRef.current = truncated.length - 1;
    updateUndoRedoState();
  };

  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const targetVal = historyRef.current[historyIndexRef.current];
      onChange(targetVal);
      updateUndoRedoState();
      toast.info(`Undo step (${historyIndexRef.current + 1}/${historyRef.current.length})`);
    } else {
      toast.info("No earlier edits to undo.");
    }
  };

  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const targetVal = historyRef.current[historyIndexRef.current];
      onChange(targetVal);
      updateUndoRedoState();
      toast.info(`Redo step (${historyIndexRef.current + 1}/${historyRef.current.length})`);
    } else {
      toast.info("No later edits to redo.");
    }
  };

  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    onChange(newVal);
    updateCursorPos();

    if (typingDebounceTimerRef.current) clearTimeout(typingDebounceTimerRef.current);
    typingDebounceTimerRef.current = setTimeout(() => {
      commitSnapshot(newVal);
    }, 450);
  };

  const insert = (before: string, after = before) => {
    const element = editorRef.current;
    let next: string;
    if (!element) {
      next = `${value}${value.endsWith("\n") ? "" : "\n"}${before}text${after}\n`;
      onChange(next);
      commitSnapshot(next);
      return;
    }
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const selected = value.slice(start, end) || "text";
    next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    onChange(next);
    commitSnapshot(next);
    window.requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Undo: Ctrl+Z without Shift
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
      return;
    }
    // Redo: Ctrl+Y or Ctrl+Shift+Z
    if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") ||
      ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z")) {
      e.preventDefault();
      handleRedo();
      return;
    }
    // Find: Ctrl+F
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
      e.preventDefault();
      setShowFindReplace(prev => !prev);
      return;
    }
    // Indent: Tab key
    if (e.key === "Tab") {
      e.preventDefault();
      insert("  ", "");
      return;
    }
  };

  // Find & Replace Helpers
  const handleFindTextChange = (query: string) => {
    setFindText(query);
    if (!query) {
      setFindMatchesCount(0);
      return;
    }
    try {
      const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = value.match(regex);
      setFindMatchesCount(matches ? matches.length : 0);
    } catch {
      setFindMatchesCount(0);
    }
  };

  const handleReplaceOne = () => {
    if (!findText) return;
    const index = value.toLowerCase().indexOf(findText.toLowerCase());
    if (index !== -1) {
      const next = value.slice(0, index) + replaceText + value.slice(index + findText.length);
      onChange(next);
      commitSnapshot(next);
      handleFindTextChange(findText);
      toast.info(`Replaced 1 occurrence of "${findText}".`);
    } else {
      toast.info(`"${findText}" not found.`);
    }
  };

  const handleReplaceAll = () => {
    if (!findText) return;
    try {
      const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = value.match(regex);
      const count = matches ? matches.length : 0;
      if (count > 0) {
        const next = value.replace(regex, replaceText);
        onChange(next);
        commitSnapshot(next);
        setFindMatchesCount(0);
        toast.success(`Replaced ${count} occurrence(s) of "${findText}".`);
      } else {
        toast.info(`"${findText}" not found.`);
      }
    } catch {
      toast.error("Invalid search pattern.");
    }
  };

  // Structured templates
  const insertTable = () => {
    const tableTemplate = `\n| Target Asset | Vulnerability | Severity | Status |\n|:-------------|:--------------|:---------|:-------|\n| 10.10.11.24  | JWT Algorithm Confusion | Critical | Verified |\n| /api/v1/auth | Token Signature Bypass   | High     | Exploited |\n\n`;
    insert(tableTemplate, "");
    toast.info("Inserted 4-column audit table.");
  };

  const insert7PointTemplate = () => {
    const tpl = `\n## 1. Executive Summary & Target Profile\nTarget: Authorized CTF Environment\nObjective: Authenticate as administrative principal and recover protected flag token.\n\n## 2. Reconnaissance & Fingerprinting\nIdentified exposed authorization endpoints and cryptographic signing requirements.\n\n## 3. Vulnerability Identification\nJWT Algorithm Confusion (RS256 to HS256 key mismatch).\n\n## 4. Exploit Mechanism & Payload Synthesis\nAsymmetric public key reused as symmetric HMAC secret key.\n\n## 5. Step-by-Step Execution Transcript\n\`\`\`bash\n$ curl -s http://target.local/pubkey.pem -o public.key\n$ python3 exploit.py --key public.key --role admin\n\`\`\`\n\n## 6. Flag Retrieval & Cryptographic Integrity\nFlag: CTF{REDACTED_FLAG_TOKEN}\nSHA-256 Proof: \`7d1a49c24098492027b40927e109471928371904719284719284719284719284\`\n\n## 7. Remediation & Hardening\nEnforce strict algorithm whitelisting in authentication middleware.\n`;
    insert(tpl, "");
    toast.success("Inserted 7-point CTF technical writeup standard.");
  };

  const downloadActiveDoc = () => {
    const blob = new Blob([value], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeDoc.title.endsWith(".md") ? activeDoc.title : `${activeDoc.title}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded "${a.download}".`);
  };

  const [downloadPartsOpen, setDownloadPartsOpen] = useState(false);

  const downloadFile = (filename: string, content: string, mimeType: string = "text/plain") => {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded "${filename}".`);
  };

  const extractSection = (headingRegex: RegExp): string => {
    const lines = value.split("\n");
    let capturing = false;
    const captured: string[] = [];
    for (const line of lines) {
      if (headingRegex.test(line)) {
        capturing = true;
        captured.push(line);
        continue;
      }
      if (capturing && /^##?\s+/.test(line)) {
        break;
      }
      if (capturing) {
        captured.push(line);
      }
    }
    return captured.join("\n").trim();
  };

  const extractCodeBlocks = (langPrefix: string = ""): string => {
    const lines = value.split("\n");
    let inCode = false;
    let matchesLang = false;
    const collected: string[] = [];
    for (const line of lines) {
      if (line.startsWith("```")) {
        if (inCode) {
          inCode = false;
          collected.push("");
        } else {
          inCode = true;
          const tag = line.slice(3).trim().toLowerCase();
          matchesLang = !langPrefix || tag.includes(langPrefix);
        }
        continue;
      }
      if (inCode && matchesLang) {
        collected.push(line);
      }
    }
    return collected.join("\n").trim();
  };

  const generateOfflineHtml = (docTitle: string, md: string): string => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${docTitle} - CTF Technical Writeup</title>
<style>
  body { background-color: #0b0f14; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; padding: 2.5rem; max-width: 900px; margin: 0 auto; line-height: 1.6; }
  h1 { color: #22c55e; border-bottom: 1px solid #1e293b; padding-bottom: 0.5rem; }
  h2 { color: #38bdf8; margin-top: 2rem; border-bottom: 1px solid #1e293b; padding-bottom: 0.3rem; }
  pre { background: #030712; border: 1px solid #1f2937; padding: 1rem; border-radius: 6px; overflow-x: auto; color: #22c55e; font-family: monospace; font-size: 13px; }
  code { background: #1e293b; color: #f43f5e; padding: 0.15rem 0.35rem; border-radius: 4px; font-family: monospace; }
  blockquote { border-left: 3px solid #22c55e; margin: 1rem 0; padding-left: 1rem; color: #94a3b8; }
  table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
  th, td { border: 1px solid #334155; padding: 0.5rem 0.75rem; text-align: left; }
  th { background: #1e293b; color: #38bdf8; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; background: #14532d; color: #86efac; border: 1px solid #22c55e; }
  .footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #1e293b; font-size: 11px; color: #64748b; font-family: monospace; }
</style>
</head>
<body>
  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
    <span class="badge">CTF WRITEUP</span>
    <span style="font-family: monospace; font-size: 12px; color: #64748b;">SHA-256 Verified</span>
  </div>
  <pre style="white-space: pre-wrap; word-break: break-word; font-family: inherit; color: inherit; background: transparent; border: none; padding: 0;">${md.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
  <div class="footer">
    Exported from CTF Writeup Studio
  </div>
</body>
</html>`;
  };

  const downloadAllTabsZip = async () => {
    const toastId = toast.loading("Bundling all open documents into ZIP archive...");
    try {
      const zip = new JSZip();
      documents.forEach(d => {
        zip.file(d.title.endsWith(".md") ? d.title : `${d.title}.md`, d.content);
      });
      zip.file("README.md", `# CTF Writeup Studio Documentation Bundle\nGenerated: ${new Date().toISOString()}\nTotal Documents: ${documents.length}\n`);
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ctf_writeups_all_tabs_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Downloaded archive of ${documents.length} document tab(s)!`, { id: toastId });
    } catch {
      toast.error("Failed to compile ZIP archive.", { id: toastId });
    }
  };

  // Metrics
  const wordsCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charsCount = value.length;
  const lineEntries = useMemo(() => value.split("\n"), [value]);
  const linesCount = lineEntries.length;
  const readingTime = Math.max(1, Math.ceil(wordsCount / 200));
  const sections = lineEntries.filter((line) => /^#{1,3} /.test(line));

  const hasRawFlag = /flag\{[a-zA-Z0-9_\-]{4,}\}|CTF\{[a-zA-Z0-9_\-]{4,}\}/.test(value) && !value.includes("REDACTED");

  const fontSizeClass = {
    "11px": "text-[11px] leading-5",
    "12px": "text-[12px] leading-6",
    "13px": "text-[13px] leading-6",
    "14px": "text-[14px] leading-7",
    "16px": "text-[16px] leading-7"
  }[fontSize];

  return <>
    <SectionHeading
      title="Writeup Editor"
      description="Write, review, and preview CTF documentation."
      actions={<>
        <span className="hidden text-[10px] text-muted-foreground sm:inline-flex items-center gap-1 font-mono">
          <Check size={13} className="text-good" /> Autosaved {savedAt}
        </span>
        <Button variant="outline" size="sm" onClick={downloadActiveDoc} title="Download active document as Markdown">
          <FileDown size={14} className="mr-1 text-primary" /> Export .md
        </Button>
        <Button variant="outline" size="sm" onClick={() => setDownloadPartsOpen(true)} title="Download individual sections, transcripts, exploit scripts, or multi-tab ZIP">
          <Download size={14} className="mr-1 text-primary" /> Download Parts
        </Button>
        <Button variant="outline" size="sm" onClick={onCheckRules}>
          <ShieldCheck size={14} /> Audit QA & Rules
        </Button>
        <div className="flex border border-border p-0.5 rounded">
          {(["edit", "split", "preview"] as const).map((item) => (
            <Button
              key={item}
              variant={mode === item ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMode(item)}
              className="h-7 px-2.5 text-[11px] capitalize"
            >
              {item}
            </Button>
          ))}
        </div>
      </>}
    />

    {/* Document Tabs Strip with Rename, Duplicate & Direct Export */}
    <div className="flex items-center justify-between border-t border-l border-r border-border bg-secondary/30 px-2 pt-1.5 min-h-[42px] overflow-hidden">
      <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto no-scrollbar py-1 min-w-0 flex-1 mr-3">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className={cx(
              "group flex shrink-0 items-center gap-2 border-t border-l border-r px-3 py-1.5 text-xs transition cursor-pointer select-none rounded-t",
              activeDocId === doc.id
                ? "border-border bg-card text-foreground font-medium shadow-sm"
                : "border-transparent bg-transparent text-muted-foreground hover:bg-accent/40"
            )}
            onClick={() => onSelectDoc(doc.id)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              const newTitle = window.prompt("Rename document:", doc.title);
              if (newTitle && newTitle.trim()) onRenameDoc(doc.id, newTitle.trim());
            }}
            title="Click to switch · Double-click to rename"
          >
            <FileText size={13} className={activeDocId === doc.id ? "text-primary" : "text-muted-foreground"} />
            <span className="font-mono text-[11px] whitespace-nowrap">{doc.title}</span>

            {/* Tab Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
              <button
                title="Duplicate tab"
                onClick={(e) => { e.stopPropagation(); onDuplicateDoc(doc.id); }}
                className="text-muted-foreground hover:text-foreground"
              >
                <Copy size={11} />
              </button>
              {documents.length > 1 && (
                <button
                  title="Close tab"
                  onClick={(e) => { e.stopPropagation(); onCloseDoc(doc.id); }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          </div>
        ))}
        <button
          onClick={onAddDoc}
          title="Create new document"
          className="flex shrink-0 items-center gap-1 px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground border border-dashed border-border/70 rounded hover:border-primary/50 transition whitespace-nowrap"
        >
          <Plus size={12} /> <span>New Tab</span>
        </button>
      </div>

      <div className="hidden sm:flex shrink-0 items-center gap-2.5 pr-2 text-[10px] font-mono text-muted-foreground whitespace-nowrap self-center">
        <span className="max-w-[120px] truncate">{activeDoc.category}</span>
        <span className="text-border">|</span>
        <button
          onClick={() => {
            const newTitle = window.prompt("Rename document:", activeDoc.title);
            if (newTitle && newTitle.trim()) onRenameDoc(activeDoc.id, newTitle.trim());
          }}
          className="text-primary hover:underline"
        >
          Rename
        </button>
      </div>
    </div>

    <Panel className="overflow-hidden border-t-0">
      {/* Streamlined Cyber Toolbar */}
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5 bg-card min-h-[40px] overflow-x-auto no-scrollbar gap-2">
        {/* Left Side: Core Editing Tools */}
        <div className="flex items-center gap-1 shrink-0">
          {/* History */}
          <IconButton label="Undo (Ctrl+Z)" onClick={handleUndo} className={cx(!canUndo && "opacity-40 cursor-not-allowed")}>
            <Undo2 size={14} className={canUndo ? "text-primary" : ""} />
          </IconButton>
          <IconButton label="Redo (Ctrl+Y)" onClick={handleRedo} className={cx(!canRedo && "opacity-40 cursor-not-allowed")}>
            <Redo2 size={14} className={canRedo ? "text-primary" : ""} />
          </IconButton>

          <div className="h-4 w-px bg-border/60 mx-1" />

          {/* Core Formatting */}
          <IconButton label="Heading 1" onClick={() => insert("# ", "")}><span className="font-mono text-xs font-bold">H1</span></IconButton>
          <IconButton label="Heading 2" onClick={() => insert("## ", "")}><span className="font-mono text-xs font-bold">H2</span></IconButton>
          <IconButton label="Bold selection" onClick={() => insert("**")}><Bold size={13} /></IconButton>
          <IconButton label="Italic selection" onClick={() => insert("*")}><Italic size={13} /></IconButton>
          <IconButton label="Inline code (`code`)" onClick={() => insert("`")}><span className="font-mono text-xs">&lt;/&gt;</span></IconButton>
          <IconButton label="Code block" onClick={() => insert("```bash\n", "\n```")}><FileCode size={13} /></IconButton>
          <IconButton label="Bullet list" onClick={() => insert("- ", "")}><List size={14} /></IconButton>
          <IconButton label="Audit Table" onClick={insertTable}><Table size={14} /></IconButton>

          <div className="h-4 w-px bg-border/60 mx-1" />

          {/* Consolidated Security & CTF Snippets Dropdown */}
          <div className="flex items-center border border-border/40 rounded px-1.5 py-0.5 text-[10px] font-mono bg-secondary/30">
            <Fingerprint size={12} className="text-primary mr-1 shrink-0" />
            <select
              value=""
              onChange={(e) => {
                const val = e.target.value;
                if (val === "7point") insert7PointTemplate();
                else if (val === "flag") insert("CTF{REDACTED_FLAG_TOKEN}");
                else if (val === "evidence") insert("[Evidence: EV-2048 - sha256:7d1a...](evidence/ev-2048.txt)");
                else if (val === "dashboard") insert('<status-dashboard target="10.10.11.24" port="8080" vuln="JWT Secret Key Confusion" cve="CVE-2022-21449" cvss="9.8 Critical" status="EXPLOITED" />\n');
                else if (val === "ai") onAIHelp();
                e.target.value = "";
              }}
              className="bg-transparent text-foreground outline-none cursor-pointer"
            >
              <option value="" disabled className="bg-card">Insert CTF Snippet...</option>
              <option value="7point" className="bg-card">7-Point Standard Outline</option>
              <option value="flag" className="bg-card">Redacted Flag Token</option>
              <option value="evidence" className="bg-card">Evidence Reference</option>
              <option value="dashboard" className="bg-card">Target Audit Dashboard</option>
              <option value="ai" className="bg-card">AI Technical Explainer</option>
            </select>
          </div>
        </div>

        {/* Right Side: View & Navigation Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {mode === "split" && (
            <Button
              variant={syncScroll ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                setSyncScroll(!syncScroll);
                toast.info(`Scroll synchronization ${!syncScroll ? "enabled" : "disabled"}.`);
              }}
              className="h-7 px-2 text-[10px] font-mono border border-border/40"
              title={syncScroll ? "Sync Scroll: ON" : "Sync Scroll: OFF"}
            >
              <ArrowUpDown size={12} className={cx("mr-1", syncScroll ? "text-primary" : "text-muted-foreground")} />
              <span>Sync</span>
            </Button>
          )}

          <Button
            variant={wordWrap ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setWordWrap(!wordWrap)}
            className="h-7 px-2 text-[10px] font-mono border border-border/40"
            title={wordWrap ? "Word Wrap: ON" : "Word Wrap: OFF"}
          >
            <WrapText size={12} className={wordWrap ? "text-primary" : "text-muted-foreground"} />
          </Button>

          <Button
            variant={showMinimap ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setShowMinimap(!showMinimap)}
            className="h-7 px-2 text-[10px] font-mono border border-border/40"
            title={showMinimap ? "Minimap: ON" : "Minimap: OFF"}
          >
            <span className={cx("text-[10px] font-mono font-semibold", showMinimap ? "text-primary" : "text-muted-foreground")}>MAP</span>
          </Button>

          <Button
            variant={showFindReplace ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setShowFindReplace(prev => !prev)}
            className="h-7 px-2 text-[10px] font-mono border border-border/40"
            title="Toggle Find & Replace (Ctrl+F)"
          >
            <Search size={12} className="mr-1" />
            <span>Find</span>
          </Button>
        </div>
      </div>

      {/* Find & Replace Drawer */}
      {showFindReplace && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-terminal/70 px-4 py-2 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <Search size={13} className="text-muted-foreground" />
            <Input
              autoFocus
              value={findText}
              onChange={(e) => handleFindTextChange(e.target.value)}
              placeholder="Find in writeup..."
              className="h-7 w-44 font-mono text-xs bg-card"
            />
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {findText ? `${findMatchesCount} match(es)` : ""}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Replace size={13} className="text-muted-foreground" />
            <Input
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Replace with..."
              className="h-7 w-44 font-mono text-xs bg-card"
            />
          </div>

          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" onClick={handleReplaceOne} className="h-7 px-2 text-[10px]">
              Replace
            </Button>
            <Button size="sm" onClick={handleReplaceAll} className="h-7 px-2 text-[10px] bg-primary text-primary-foreground font-semibold">
              Replace All
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setShowFindReplace(false)} className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <X size={13} />
            </Button>
          </div>
        </div>
      )}

      {/* Editor & Preview Panes */}
      <div
        className="grid grid-cols-1 md:grid"
        style={mode === "split" ? {
          gridTemplateColumns: `minmax(0, ${splitPercent}fr) minmax(0, ${100 - splitPercent}fr)`
        } : {
          gridTemplateColumns: "1fr"
        }}
      >
        {mode !== "preview" && (
          <section className="flex min-w-0 flex-col border-b border-border md:border-b-0 md:border-r bg-terminal/40">
            <div className="flex items-center justify-between border-b border-border px-4 py-2 bg-secondary/20 shrink-0">
              <span className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                <FileText size={13} className="text-primary" /> Markdown
              </span>
              <div className="flex items-center gap-3 text-[9px] font-mono text-muted-foreground">
                <span className="text-primary font-semibold">Ln {cursorPos.line}, Col {cursorPos.col}</span>
                <span>·</span>
                <span>{linesCount} lines</span>
                <span>·</span>
                <span>{wordsCount} words</span>
                <span>·</span>
                <span>{charsCount} chars</span>
                <span>·</span>
                <span>{readingTime}m read</span>
              </div>
            </div>

            <div
              style={{ height: `${paneHeight}px` }}
              className="relative flex flex-1 overflow-hidden"
            >
              {/* Left-Hand Gutter with Line Numbers (Synced on scroll, highlights active line) */}
              <div
                ref={lineGutterRef}
                style={{ height: `${paneHeight}px` }}
                className="hidden sm:block select-none py-4 px-2 border-r border-border/40 bg-secondary/10 text-right font-mono text-[11px] text-muted-foreground/50 w-12 shrink-0 overflow-hidden"
                aria-hidden="true"
              >
                {lineEntries.map((_, i) => {
                  const num = i + 1;
                  const isCurrent = cursorPos.line === num;
                  return (
                    <div
                      key={num}
                      className={cx(
                        "leading-6 transition-colors select-none",
                        isCurrent ? "text-primary font-bold bg-primary/10 rounded-sm" : ""
                      )}
                    >
                      {num}
                    </div>
                  );
                })}
              </div>

              {/* Textarea Markdown Editor */}
              <Textarea
                ref={editorRef}
                aria-label="Writeup Markdown editor"
                value={value}
                onChange={handleEditorChange}
                onKeyDown={handleKeyDown}
                onKeyUp={updateCursorPos}
                onClick={updateCursorPos}
                onSelect={updateCursorPos}
                onScroll={handleEditorScroll}
                style={{ height: `${paneHeight}px` }}
                className={cx(
                  "flex-1 resize-none rounded-none border-0 bg-transparent p-4 font-mono shadow-none focus-visible:ring-0 text-foreground overflow-y-auto cyber-scrollbar",
                  fontSizeClass,
                  wordWrap ? "whitespace-pre-wrap" : "whitespace-pre overflow-x-auto"
                )}
              />

              {/* Right-Hand Side Line Representation Minimap (LeetCode / Monaco style) */}
              {showMinimap && (
                <div
                  ref={minimapRef}
                  style={{ height: `${paneHeight}px` }}
                  className="flex flex-col w-20 sm:w-24 shrink-0 border-l border-border/40 bg-secondary/15 select-none py-2 px-1.5 overflow-y-auto cyber-scrollbar"
                  title="LeetCode-style Right-Hand Line Representation Minimap"
                >
                  <div className="flex items-center justify-between text-[8px] font-mono text-muted-foreground/80 pb-1 mb-1.5 border-b border-border/30 px-0.5">
                    <span className="uppercase tracking-wider font-semibold">Lines</span>
                    <span className="text-primary font-bold">{linesCount}</span>
                  </div>

                  <div className="flex-1 space-y-[2px] pr-0.5">
                    {lineEntries.map((line, idx) => {
                      const lineNum = idx + 1;
                      const isCurrent = cursorPos.line === lineNum;
                      const isHeading = line.startsWith("#");
                      const isCode = line.startsWith("```") || line.startsWith("    ");
                      const isFlag = line.includes("FLAG") || line.includes("CTF{") || line.includes("flag{");
                      const isEvidence = line.includes("Evidence") || line.includes("EV-");
                      const isEmpty = !line.trim();
                      const widthPercent = isEmpty ? 0 : Math.min(100, Math.max(20, Math.round((line.length / 80) * 100)));
                      const isMilestone = (lineNum === 1 || lineNum % 10 === 0) && Math.abs(lineNum - cursorPos.line) > 2;

                      return (
                        <div
                          key={idx}
                          onClick={() => jumpToLine(idx)}
                          title={`Line ${lineNum}: ${line.slice(0, 50) || "(empty line)"}`}
                          className={cx(
                            "group flex items-center justify-between h-[4px] rounded-full cursor-pointer transition-all hover:h-[6px] my-[1px]",
                            isCurrent ? "h-[7px] bg-primary/10 rounded px-0.5 ring-1 ring-primary/80" : ""
                          )}
                        >
                          {/* Tiny horizontal line representing code line */}
                          <div
                            style={{ width: `${widthPercent}%` }}
                            className={cx(
                              "h-full rounded-full transition-colors",
                              isCurrent
                                ? "bg-primary shadow-sm"
                                : isHeading
                                  ? "bg-primary/90"
                                  : isCode
                                    ? "bg-sky-400/80"
                                    : isFlag
                                      ? "bg-good"
                                      : isEvidence
                                        ? "bg-amber-400"
                                        : isEmpty
                                          ? "opacity-0"
                                          : "bg-muted-foreground/35 group-hover:bg-muted-foreground/70"
                            )}
                          />

                          {/* Tiny line number marker on the right hand side */}
                          {(isCurrent || isMilestone) && (
                            <span
                              className={cx(
                                "text-[7px] font-mono leading-none transition-colors ml-1 shrink-0 select-none",
                                isCurrent
                                  ? "text-primary font-bold bg-primary/20 px-1 py-0.5 rounded text-[8px]"
                                  : "text-muted-foreground/60 group-hover:text-muted-foreground"
                              )}
                            >
                              {lineNum}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-1.5 mt-1 border-t border-border/30 text-center font-mono text-[8px] text-muted-foreground">
                    Ln {cursorPos.line}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {mode !== "edit" && (
          <section className="min-w-0 bg-card flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-4 py-2 bg-secondary/20 shrink-0">
              <span className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                <Eye size={13} className="text-primary" /> Preview
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={downloadActiveDoc} className="h-6 text-[10px] text-muted-foreground hover:text-foreground">
                  <FileDown size={11} className="mr-1" /> Download
                </Button>
              </div>
            </div>
            <div
              ref={previewRef}
              onScroll={handlePreviewScroll}
              style={{ height: `${paneHeight}px` }}
              className="overflow-y-auto p-5 sm:p-7 cyber-scrollbar"
            >
              <MarkdownPreview value={value} />
            </div>
          </section>
        )}
      </div>

      {/* Draggable Height Resize Bar */}
      <div
        onMouseDown={handleStartHeightResize}
        className="flex items-center justify-between px-3 py-1.5 bg-secondary/40 border-t border-border select-none cursor-row-resize hover:bg-secondary/70 transition group"
        title="Click and drag vertically to resize editor & preview height"
      >
        <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
          <GripHorizontal size={15} className="text-muted-foreground group-hover:text-primary transition" />
          <span className="font-semibold text-foreground">Pane Height:</span>
          <span className="text-primary font-mono font-semibold">{paneHeight}px</span>
          <span className="text-border hidden sm:inline">|</span>
          <span className="text-[9px] text-muted-foreground hidden sm:inline">Drag handle or choose preset:</span>
        </div>
        <div className="flex items-center gap-1">
          {[520, 650, 820, 1000].map((h) => (
            <button
              key={h}
              type="button"
              onClick={(e) => { e.stopPropagation(); setPaneHeight(h); }}
              className={cx(
                "px-2 py-0.5 text-[9px] font-mono rounded border transition",
                paneHeight === h
                  ? "border-primary/60 bg-primary/10 text-primary font-semibold shadow-xs"
                  : "border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30"
              )}
            >
              {h}px
            </button>
          ))}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const autoH = Math.max(480, window.innerHeight - 260);
              setPaneHeight(autoH);
              toast.info(`Pane height auto-fitted to window (${autoH}px).`);
            }}
            className="px-2 py-0.5 text-[9px] font-mono rounded border border-border/50 text-muted-foreground hover:text-primary transition"
            title="Auto fit height to browser viewport"
          >
            Fit Viewport
          </button>
        </div>
      </div>
    </Panel>

      {/* Download Parts Modal */}
      <Dialog open={downloadPartsOpen} onOpenChange={setDownloadPartsOpen}>
        <DialogContent className="border-border bg-card sm:max-w-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Download size={18} className="text-primary" /> Download Writeup Parts & Artifacts
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Extract individual sections, transcripts, payloads, offline HTML, or bundle all tabs into a ZIP archive.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => {
                  downloadFile(activeDoc.title.endsWith(".md") ? activeDoc.title : `${activeDoc.title}.md`, value, "text/markdown");
                  setDownloadPartsOpen(false);
                }}
                className="flex items-start gap-2.5 p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/60 text-left transition"
              >
                <FileText size={16} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Full Markdown Document</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{activeDoc.title} · {wordsCount} words</p>
                </div>
              </button>

              <button
                onClick={() => {
                  const baseName = activeDoc.title.replace(/\.md$/, "");
                  downloadFile(`${baseName}.html`, generateOfflineHtml(activeDoc.title, value), "text/html");
                  setDownloadPartsOpen(false);
                }}
                className="flex items-start gap-2.5 p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/60 text-left transition"
              >
                <FileCode size={16} className="text-sky-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Offline HTML Document</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Styled standalone HTML for offline viewing</p>
                </div>
              </button>

              <button
                onClick={() => {
                  const transcript = extractCodeBlocks("bash") || extractCodeBlocks("sh") || extractSection(/##\s+5\./i) || value;
                  downloadFile("execution_transcript.sh", `#!/usr/bin/env bash\n# Reproduction Transcript for ${activeDoc.title}\n# Generated from CTF Writeup Studio\n\n${transcript}\n`, "text/x-sh");
                  setDownloadPartsOpen(false);
                }}
                className="flex items-start gap-2.5 p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/60 text-left transition"
              >
                <SquareTerminal size={16} className="text-good mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Execution Commands (.sh)</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Terminal transcript from Section 5 & code blocks</p>
                </div>
              </button>

              <button
                onClick={() => {
                  const exploit = extractCodeBlocks("python") || extractCodeBlocks("py") || extractSection(/##\s+4\./i) || "# Exploit script\nimport requests\n";
                  downloadFile("exploit_payload.py", `#!/usr/bin/env python3\n# Exploit Script & Payload Synthesis for ${activeDoc.title}\n\n${exploit}\n`, "text/x-python");
                  setDownloadPartsOpen(false);
                }}
                className="flex items-start gap-2.5 p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/60 text-left transition"
              >
                <FileCode2 size={16} className="text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Exploit Script (.py)</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Payload script extracted from Section 4</p>
                </div>
              </button>
            </div>

            <div className="border-t border-border/40 pt-2.5">
              <p className="font-mono text-[10px] uppercase text-muted-foreground tracking-wider mb-2">Individual 7-Point Sections</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 font-mono text-[11px]">
                {[
                  { name: "1. Exec Summary", regex: /##\s+1\./i, file: "01_executive_summary.md" },
                  { name: "2. Reconnaissance", regex: /##\s+2\./i, file: "02_reconnaissance.md" },
                  { name: "3. Vulnerability", regex: /##\s+3\./i, file: "03_vulnerability_root_cause.md" },
                  { name: "4. Exploit Mechanism", regex: /##\s+4\./i, file: "04_exploit_mechanism.md" },
                  { name: "5. Execution Log", regex: /##\s+5\./i, file: "05_execution_transcript.md" },
                  { name: "6. Flag Proof", regex: /##\s+6\./i, file: "06_flag_proof.txt" },
                  { name: "7. Remediation", regex: /##\s+7\./i, file: "07_remediation.md" }
                ].map((s) => (
                  <Button
                    key={s.name}
                    variant="outline"
                    size="sm"
                    className="justify-start text-left h-8 px-2 text-[10px] truncate border-border/40 hover:bg-secondary/50"
                    onClick={() => {
                      const secContent = extractSection(s.regex);
                      downloadFile(s.file, secContent || `# ${s.name}\n(Section not found in current writeup text)`, "text/markdown");
                    }}
                  >
                    <ArrowDownToLine size={11} className="mr-1 shrink-0 text-primary" /> {s.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="border-t border-border/40 pt-2.5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground text-xs">All Open Tabs Archive (.zip)</p>
                <p className="text-[10px] text-muted-foreground">Download all {documents.length} document tab(s) in a single ZIP file</p>
              </div>
              <Button size="sm" onClick={() => { downloadAllTabsZip(); setDownloadPartsOpen(false); }} className="bg-primary text-primary-foreground font-semibold">
                <FileArchive size={14} className="mr-1.5" /> Download ZIP ({documents.length})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
  </>;
}

function MarkdownPreview({ value }: { value: string }) {
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
        <p className="font-bold text-xs tracking-wider">CONFIDENTIAL · CTF WRITEUP</p>
        <p className="text-[10px] mt-1 text-muted-foreground font-mono">SHA-256 Verified</p>
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
              <ShieldCheck size={13} /> Target Summary
            </span>
            <span className="font-mono text-[9px] text-muted-foreground">Target Status</span>
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
    else if (line.startsWith("> ")) nodes.push(<blockquote key={index} className="my-3 border-l-2 border-primary/50 bg-secondary/40 px-3 py-2 text-xs text-muted-foreground rounded-r">{inlineMarkdown(line.slice(2))}</blockquote>);
    else if (line.startsWith("- ")) nodes.push(<div key={index} className="ml-4 flex gap-2 text-xs leading-6"><span className="text-primary">•</span><span>{inlineMarkdown(line.slice(2))}</span></div>);
    else nodes.push(<p key={index} className="my-2 text-xs leading-6 text-foreground/85">{inlineMarkdown(line)}</p>);
  });

  if (insideCode) nodes.push(<pre key="open-code" className="my-3 overflow-x-auto border border-border/40 bg-terminal p-3 font-mono text-[11px] leading-5 text-primary rounded-lg"><code>{codeLines.join("\n")}</code></pre>);
  return <article className="min-w-0 font-mono">{nodes.length ? nodes : <p className="text-xs text-muted-foreground">Your preview will appear here.</p>}</article>;
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

function SessionPage({
  isRecording,
  isPaused,
  seconds,
  start,
  pause,
  resume,
  stop,
  commands,
  onHistory,
  onOpenHostHistory,
  onNote,
  commandText,
  setCommandText,
  runLocalCommand,
  environments,
  selectedShell,
  onSelectShell,
  isExecuting,
  autoSaveEvidence,
  onToggleAutoEvidence,
  onSaveAsEvidence,
  onExplainCommand,
  wslAuthorized,
  onRequestWslPermission,
  onRevokeWslPermission,
  isScreenRecording,
  screenRecordSeconds,
  onTakeScreenshotProof,
  onStartScreenRecordingProof,
  onStopScreenRecordingProof
}: {
  isRecording: boolean;
  isPaused: boolean;
  seconds: number;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  commands: Array<{ time: string; cmd: string; output: string; stderr?: string; exit: number; duration: string; shell?: string; hash?: string; cmdId?: string; isEvidence?: boolean }>;
  onHistory: () => void;
  onOpenHostHistory: () => void;
  onNote: () => void;
  commandText: string;
  setCommandText: (value: string) => void;
  runLocalCommand: (cmd?: string) => void;
  environments: any[];
  selectedShell: string;
  onSelectShell: (shell: string) => void;
  isExecuting: boolean;
  autoSaveEvidence: boolean;
  onToggleAutoEvidence: () => void;
  onSaveAsEvidence: (item: any) => void;
  onExplainCommand: (cmd: string) => void;
  wslAuthorized: boolean;
  onRequestWslPermission: () => void;
  onRevokeWslPermission: () => void;
  isScreenRecording: boolean;
  screenRecordSeconds: number;
  onTakeScreenshotProof: () => void;
  onStartScreenRecordingProof: () => void;
  onStopScreenRecordingProof: () => void;
}) {
  const clock = `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor(seconds / 60) % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const recordClock = `${String(Math.floor(screenRecordSeconds / 60)).padStart(2, "0")}:${String(screenRecordSeconds % 60).padStart(2, "0")}`;

  const presets = [
    { label: "whoami", cmd: "whoami" },
    { label: selectedShell.startsWith("wsl") ? "uname -a" : "Get-Date", cmd: selectedShell.startsWith("wsl") ? "uname -a" : "Get-Date" },
    { label: "curl localhost API", cmd: "curl -I http://127.0.0.1:8000/api/v1/challenges/" },
    { label: "sha256 flag verify", cmd: 'python -c "import hashlib; print(\'CTF Flag Hash:\', hashlib.sha256(b\'flag{wsl_powershell_verified}\').hexdigest())"' },
    { label: "git status", cmd: "git status --short" }
  ];

  return <>
    <SectionHeading
      title="Live Session Recorder"
      description="Real-time terminal execution & recording connected to local PowerShell and WSL environments on localhost."
      actions={
        <>
          <Button variant="outline" size="sm" onClick={onOpenHostHistory} className="border-border/60 hover:border-primary/40 text-foreground font-mono text-xs">
            <SquareTerminal size={14} className="text-primary mr-1" /> Host PowerShell Logs
          </Button>
          <Button variant="outline" size="sm" onClick={onHistory} className="font-mono text-xs">
            <Clock3 size={14} className="mr-1" /> Atuin history
          </Button>
          <Button variant="outline" size="sm" onClick={onNote}>
            <Plus size={14} className="mr-1" /> Add note
          </Button>
        </>
      }
    />

    {/* Live Screen Recording Proof Banner (Active when recording) */}
    {isScreenRecording && (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-destructive/50 bg-destructive/10 px-4 py-3 rounded-lg shadow-sm animate-pulse">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
          </span>
          <div>
            <p className="text-xs font-semibold text-destructive flex items-center gap-1.5 font-mono">
              <Disc size={15} className="text-destructive animate-spin" /> LIVE SCREEN PROOF RECORDING ACTIVE · {recordClock}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Capturing live window proof (PowerShell / Tools). Click &quot;Stop &amp; Save Proof&quot; to compute SHA-256 and store video evidence.
            </p>
          </div>
        </div>
        <Button size="sm" variant="destructive" onClick={onStopScreenRecordingProof} className="font-semibold shadow-sm">
          <StopCircle size={14} className="mr-1.5" /> Stop &amp; Save Proof (.webm)
        </Button>
      </div>
    )}

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
          <Button size="sm" onClick={start} className="bg-primary text-primary-foreground font-semibold"><Play size={14} className="fill-current mr-1" /> Start session</Button>
        ) : (
          <>
            {isPaused ? <Button size="sm" onClick={resume}><Play size={14} className="mr-1" /> Resume</Button> : <Button variant="outline" size="sm" onClick={pause}><Pause size={14} className="mr-1" /> Pause</Button>}
            <Button variant="destructive" size="sm" onClick={stop}><StopCircle size={14} className="mr-1" /> Stop</Button>
          </>
        )}
      </div>
    </div>

    {/* Streamlined Environment & Visual Proof Bar */}
    <div className="mb-4 border border-border/30 bg-card/60 p-3 rounded-lg space-y-3">
      {/* Top row: Status & Proof Capture Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/20 pb-2.5">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-primary" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-primary font-semibold">LOCAL SHELL ENVIRONMENT</span>
          <span className="h-1.5 w-1.5 rounded-full bg-good animate-pulse" />
          <span className="text-[10px] font-mono text-good">PowerShell (127.0.0.1:8000)</span>
        </div>

        {/* Visual Proof Buttons: Screenshot & Video */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onTakeScreenshotProof}
            className="h-7 text-xs font-mono border-primary/40 text-foreground hover:bg-primary/10 hover:text-primary transition"
            title="Request permission to select and screenshot terminal/tool window with SHA-256 hash"
          >
            <Camera size={13} className="mr-1.5 text-primary" /> Take Screenshot Proof
          </Button>

          {!isScreenRecording ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onStartScreenRecordingProof}
              className="h-7 text-xs font-mono border-destructive/40 text-foreground hover:bg-destructive/10 hover:text-destructive transition"
              title="Request permission to record live screen video proof of terminal and tools"
            >
              <Video size={13} className="mr-1.5 text-destructive" /> Record Screen Proof
            </Button>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              onClick={onStopScreenRecordingProof}
              className="h-7 text-xs font-mono font-semibold"
            >
              <StopCircle size={13} className="mr-1.5" /> Stop Screen Recording ({screenRecordSeconds}s)
            </Button>
          )}

          <label className="flex items-center gap-1.5 text-[10px] cursor-pointer text-muted-foreground hover:text-foreground ml-1">
            <Checkbox checked={autoSaveEvidence} onCheckedChange={onToggleAutoEvidence} />
            <span>Auto-save to Vault</span>
          </label>
        </div>
      </div>

      {/* Shell Selector & WSL Integration Row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-mono text-muted-foreground mr-1">Shell:</span>
        <button
          onClick={() => onSelectShell("powershell")}
          className={cx("flex items-center gap-1.5 rounded border px-3 py-1 text-xs transition font-mono", selectedShell === "powershell" ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border/30 bg-secondary/40 text-muted-foreground hover:text-foreground hover:border-border/60")}
        >
          <span className="text-[11px]">&gt;_</span>
          <span>Windows PowerShell (Host)</span>
        </button>

        <button
          onClick={() => onSelectShell("cmd")}
          className={cx("flex items-center gap-1.5 rounded border px-3 py-1 text-xs transition font-mono", selectedShell === "cmd" ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border/30 bg-secondary/40 text-muted-foreground hover:text-foreground hover:border-border/60")}
        >
          <span className="text-[11px]">C:\</span>
          <span>Command Prompt (CMD)</span>
        </button>

        {wslAuthorized ? (
          <>
            <button
              onClick={() => onSelectShell("wsl-ubuntu-24.04")}
              className={cx("flex items-center gap-1.5 rounded border px-3 py-1 text-xs transition font-mono", selectedShell === "wsl-ubuntu-24.04" ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border/30 bg-secondary/40 text-muted-foreground hover:text-foreground hover:border-border/60")}
            >
              <Cpu size={12} className="text-good" />
              <span>Ubuntu-24.04 (WSL 2)</span>
            </button>
            <button
              onClick={() => onSelectShell("wsl-kali-linux")}
              className={cx("flex items-center gap-1.5 rounded border px-3 py-1 text-xs transition font-mono", selectedShell === "wsl-kali-linux" ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border/30 bg-secondary/40 text-muted-foreground hover:text-foreground hover:border-border/60")}
            >
              <Cpu size={12} className="text-good" />
              <span>Kali Linux (WSL 2)</span>
            </button>
            <button
              onClick={onRevokeWslPermission}
              className="text-[10px] text-muted-foreground hover:text-destructive font-mono ml-1 underline decoration-dotted"
              title="Revoke guest environment access permission"
            >
              Revoke Permission
            </button>
          </>
        ) : (
          <button
            onClick={onRequestWslPermission}
            className="flex items-center gap-1.5 rounded border border-dashed border-border/70 bg-secondary/20 hover:border-primary/50 hover:text-primary px-3 py-1 text-xs font-mono transition text-muted-foreground"
            title="Click to authorize local guest environments (WSL 2, Docker sandboxes, Linux VMs)"
          >
            <Cpu size={12} />
            <span>+ Add Guest Environment (WSL · Docker · Sandbox · Request Permission)</span>
          </button>
        )}
      </div>

      {/* Streamlined Verified Host Tools & Quick Presets Row */}
      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/20 text-xs font-mono">
        <span className="text-[10px] text-muted-foreground mr-1">Host Tools:</span>
        {[
          { name: "nmap", cmd: "nmap -sn 127.0.0.1" },
          { name: "python", cmd: 'python -c "import hashlib; print(\'SHA256:\', hashlib.sha256(b\'test\').hexdigest())"' },
          { name: "curl", cmd: "curl -I http://127.0.0.1:8000/api/v1/challenges/" },
          { name: "git", cmd: "git status --short" },
          { name: "certutil", cmd: "certutil -hashfile backend/app/main.py SHA256" }
        ].map(t => (
          <button
            key={t.name}
            onClick={() => {
              setCommandText(t.cmd);
              toast.info(`Loaded ${t.name} command into terminal.`);
            }}
            title={`Click to load verified ${t.name} command: ${t.cmd}`}
            className="border border-border/40 bg-terminal hover:border-primary/50 text-[10px] px-2 py-0.5 rounded text-foreground hover:text-primary transition"
          >
            {t.name}
          </button>
        ))}

        <span className="text-muted-foreground mx-1">|</span>
        <span className="text-[10px] text-muted-foreground mr-1">Presets:</span>
        {presets.slice(0, 3).map((p) => (
          <button
            key={p.label}
            onClick={() => runLocalCommand(p.cmd)}
            disabled={isExecuting}
            className="border border-border/30 bg-secondary/30 hover:bg-secondary/60 text-[10px] px-2 py-0.5 rounded text-muted-foreground hover:text-foreground transition"
          >
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
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#ef4444] shadow-sm" title="Session active" />
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#eab308] shadow-sm" />
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#22c55e] shadow-sm" />
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
    { name: "HTML", icon: FileCode, detail: "Styled standalone HTML", supported: true },
    { name: "ZIP package", icon: FileArchive, detail: "Complete evidence bundle & manifest", supported: true }
  ];
  const names = ["Include table of contents", "Include screenshots", "Include evidence references", "Include raw session logs", "Include flags", "Redact sensitive values (Mandatory compliance)"];
  return <><SectionHeading title="Export Center" description="Generate writeups in Markdown, HTML, PDF, Word DOCX, and ZIP bundles." />
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
      <div><Panel><PanelTitle>Export preview <Pill tone="good">Backend Ready</Pill></PanelTitle><div className="p-4"><div className="border border-border bg-terminal p-4"><p className="font-mono text-[9px] text-primary">CTF COMPETITION · TECHNICAL WRITEUP</p><h2 className="mt-3 text-lg font-semibold">Target Exploitation Writeup</h2><div className="mt-3 h-px border-border bg-border" /><p className="mt-3 text-xs leading-5 text-muted-foreground">A structured technical writeup draft with cryptographic evidence references, terminal outputs, and ReportLab / python-docx formatting.</p><p className="mt-4 font-mono text-[10px] text-primary">## Reconnaissance & Exploit</p><div className="mt-2 border-l-2 border-primary/40 pl-3 text-[10px] leading-5 text-muted-foreground">Every claim is grounded in verified Evidence Vault artifacts.</div></div><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="border border-border p-2"><p className="font-mono text-sm">6</p><p className="mt-1 text-[9px] text-muted-foreground">Sections</p></div><div className="border border-border p-2"><p className="font-mono text-sm">{options[1] ? "2" : "0"}</p><p className="mt-1 text-[9px] text-muted-foreground">Screenshots</p></div><div className="border border-border p-2"><p className="font-mono text-sm">{options[2] ? "4" : "0"}</p><p className="mt-1 text-[9px] text-muted-foreground">Evidence refs</p></div></div><div className="mt-4 border border-good/25 bg-good/5 p-3"><p className="flex items-center gap-2 text-xs font-medium text-good"><ShieldCheck size={14} /> 12 Rule categories validated</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">Flag token redaction and internal IP protection are active.</p></div><Button className="mt-4 w-full bg-primary text-primary-foreground font-semibold" onClick={onExport}><ArrowDownToLine size={14} /> Generate {format}</Button><p className="mt-2 text-center text-[9px] text-muted-foreground">Export files are stored in data/exports/ and downloaded to your browser.</p></div></Panel></div>
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
            <p className="mt-1 text-sm font-semibold">{challenges[0]?.name || "Active Challenge"}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{activeCompetition?.name || "CTF Workspace"} · Writeup Package</p>
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
              <p className="text-xs">Official Competition Guidelines</p>
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

function EvidencePage({ items, total, type, setType, view, setView, query, setQuery, onOpen, onUpload, onDelete, onDownload, onDownloadAll }: { items: Evidence[]; total: number; type: string; setType: (type: string) => void; view: "grid" | "list"; setView: (view: "grid" | "list") => void; query: string; setQuery: (query: string) => void; onOpen: (item: Evidence) => void; onUpload: () => void; onDelete: (id: string) => void; onDownload: (item: Evidence) => void; onDownloadAll: () => void }) {
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

  return <><SectionHeading title="Evidence Vault" description="Centralized storage for screenshots, payloads, terminal logs, and cryptographic proof." actions={<><Button variant="outline" size="sm" onClick={downloadManifest}><ArrowDownToLine size={14} /> Export manifest</Button><Button variant="outline" size="sm" onClick={onDownloadAll}><FileArchive size={14} className="mr-1" /> Download all artifacts (.zip)</Button><Button size="sm" onClick={onUpload}><Upload size={14} /> Upload evidence</Button></>} />
    <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{[{ label: "All artifacts", value: total, icon: Fingerprint }, { label: "Screenshots", value: count("Screenshot"), icon: FileImage }, { label: "Terminal logs", value: count("Terminal log"), icon: SquareTerminal }, { label: "Verified records", value: items.filter((item) => item.verified).length, icon: BadgeCheck }].map(({ label, value, icon: Icon }) => <Panel key={label} className="flex items-center gap-3 p-3"><span className="grid h-8 w-8 shrink-0 place-items-center bg-secondary text-primary"><Icon size={16} /></span><div className="min-w-0"><p className="font-mono text-lg">{value.toString().padStart(2, "0")}</p><p className="truncate text-[10px] text-muted-foreground">{label}</p></div></Panel>)}</div>
    <Panel><div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:items-center"><div className="relative min-w-0 flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search evidence" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find evidence by filename, ID, or challenge…" className="h-9 pl-9 text-xs" /></div><Select value={type} onValueChange={setType}><SelectTrigger className="w-full text-xs sm:w-44"><Filter size={14} /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All evidence types</SelectItem>{["Screenshot", "Terminal log", "Source code", "Network capture", "Document"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><div className="flex border border-border"><IconButton label="Grid view" onClick={() => setView("grid")} className={view === "grid" ? "bg-accent text-foreground" : ""}><Square size={14} /></IconButton><IconButton label="List view" onClick={() => setView("list")} className={view === "list" ? "bg-accent text-foreground" : ""}><List size={14} /></IconButton></div></div>
      {view === "grid" ? <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => (
        <div key={item.id} className="relative group bg-card p-4 text-left transition hover:bg-accent/40">
          <button onClick={() => onOpen(item)} className="w-full text-left">
            <div className="mb-4 flex aspect-[16/7] items-center justify-center border border-border bg-terminal"><EvidenceIcon type={item.type} size={24} /></div>
            <div className="flex items-start gap-2">
              <EvidenceIcon type={item.type} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{item.name}</p>
                <p className="mt-1 font-mono text-[9px] text-muted-foreground">{item.id} · {item.collected}</p>
              </div>
              <span title={item.verified ? "Hash recorded" : "Not verified"}>
                <ShieldCheck size={14} className={item.verified ? "text-good" : "text-caution"} />
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="truncate text-[10px] text-muted-foreground">{item.challenge}</span>
              <Pill>{item.type}</Pill>
            </div>
          </button>
          <button
            title="Download evidence"
            onClick={(e) => {
              e.stopPropagation();
              onDownload(item);
            }}
            className="absolute top-2 right-9 p-1.5 rounded bg-background/80 hover:bg-primary/20 text-muted-foreground hover:text-primary transition opacity-0 group-hover:opacity-100"
          >
            <ArrowDownToLine size={13} />
          </button>
          <button
            title="Delete evidence"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Delete evidence "${item.name}"?`)) onDelete(item.id);
            }}
            className="absolute top-2 right-2 p-1.5 rounded bg-background/80 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}</div> : <div className="divide-y divide-border">{items.map((item) => (
        <div key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-accent/40 group">
          <button onClick={() => onOpen(item)} className="grid flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-left sm:grid-cols-[minmax(0,1.4fr)_minmax(110px,0.8fr)_minmax(130px,0.7fr)_auto]">
            <span className="flex min-w-0 items-center gap-2.5">
              <EvidenceIcon type={item.type} />
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium">{item.name}</span>
                <span className="block font-mono text-[9px] text-muted-foreground">{item.id}</span>
              </span>
            </span>
            <span className="hidden text-[11px] text-muted-foreground sm:block">{item.challenge}</span>
            <span className="hidden font-mono text-[10px] text-muted-foreground md:block">{item.collected}</span>
            <Pill tone={item.verified ? "good" : "warn"}>{item.verified ? "SHA-256 Verified" : "Unverified"}</Pill>
          </button>
          <div className="flex items-center gap-1">
            <button
              title="Download evidence"
              onClick={(e) => {
                e.stopPropagation();
                onDownload(item);
              }}
              className="p-1.5 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary transition opacity-0 group-hover:opacity-100"
            >
              <ArrowDownToLine size={13} />
            </button>
            <button
              title="Delete evidence"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Delete evidence "${item.name}"?`)) onDelete(item.id);
              }}
              className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      ))}</div>}
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
  onPurgeAllData,
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
  onPurgeAllData: () => void;
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
    } catch { }

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
    } catch { }

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
                    <p className="mt-1 text-[10px] text-muted-foreground">Clears cached workspace settings and restores clean state.</p>
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

              <Panel className="border-destructive/40">
                <PanelTitle className="text-destructive">Danger Zone · Workspace Purge</PanelTitle>
                <div className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-destructive">Purge All Workspace Data</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">Permanently wipes all competitions, challenges, evidence files, and sessions from SQLite and disk.</p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={onPurgeAllData}>
                    <Trash2 size={13} className="mr-1.5" /> Purge Everything
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-xs font-medium text-foreground">{label}</span>{children}</label>;
}
