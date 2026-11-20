import React, { useState } from 'react';
import { 
  FileText, 
  Eye, 
  Edit3, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle, 
  Copy, 
  Save, 
  Download,
  Terminal,
  FolderLock,
  Columns,
  Hash,
  Share2,
  Check,
  AlertTriangle,
  Code,
  Table,
  Image as ImageIcon,
  Quote,
  ShieldCheck,
  ListOrdered
} from 'lucide-react';
import { api } from '../services/api';

interface WriteupEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  challengeId: string;
  competitionId: string;
  onOpenCompliance: () => void;
  onOpenExport: () => void;
  onOpenHistory: () => void;
}

export const WriteupEditor: React.FC<WriteupEditorProps> = ({
  content,
  onChange,
  challengeId,
  competitionId,
  onOpenCompliance,
  onOpenExport,
  onOpenHistory
}) => {
  const [activeView, setActiveView] = useState<'split' | 'edit' | 'preview'>('split');
  const [qaReport, setQaReport] = useState<any | null>(null);
  const [inspectingQA, setInspectingQA] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const runQACheck = async () => {
    setInspectingQA(true);
    try {
      const res = await api.inspectQA(challengeId, content);
      setQaReport(res);
    } catch (e) {
      console.error(e);
    } finally {
      setInspectingQA(false);
    }
  };

  const copyMarkdown = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const insertSnippet = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('writeup-textarea') as HTMLTextAreaElement;
    if (!textarea) {
      onChange(content + '\n' + prefix + suffix);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = prefix + (selected || 'text') + suffix;
    const newContent = text.substring(0, start) + replacement + text.substring(end);
    onChange(newContent);
  };

  const insertEvidenceTag = () => {
    insertSnippet('[Evidence #EVD-001]');
  };

  const insertTerminalBlock = () => {
    const block = '\n```bash\n# Exploitation execution\n$ python3 exploit.py --target 10.10.11.24\n[+] Vulnerability confirmed: HTTP 200 OK\n[+] Retrieved flag: CTF{s1mpl3_fl4g_pwn3d}\n```\n';
    onChange(content + block);
  };

  const insertCallout = () => {
    const callout = '\n> [!IMPORTANT]\n> Critical finding: Asymmetric key confusion allows forged admin tokens.\n';
    onChange(content + callout);
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="flex flex-col h-full bg-cyber-card border border-cyber-border rounded-xl shadow-2xl overflow-hidden select-none">
      
      {/* Editor Main Toolbar (Obsidian/GitBook style) */}
      <div className="p-2.5 border-b border-cyber-border bg-cyber-sidebar flex items-center justify-between shrink-0">
        
        {/* Left: View Mode Switches & Document Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-cyber-bg border border-cyber-border rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() => setActiveView('split')}
              className={`px-3 py-1 rounded transition flex items-center gap-1.5 ${
                activeView === 'split' ? 'bg-cyber-surface text-cyber-primary font-bold shadow-sm' : 'text-cyber-muted hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              Split View
            </button>
            <button
              onClick={() => setActiveView('edit')}
              className={`px-3 py-1 rounded transition flex items-center gap-1.5 ${
                activeView === 'edit' ? 'bg-cyber-surface text-cyber-primary font-bold shadow-sm' : 'text-cyber-muted hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Editor
            </button>
            <button
              onClick={() => setActiveView('preview')}
              className={`px-3 py-1 rounded transition flex items-center gap-1.5 ${
                activeView === 'preview' ? 'bg-cyber-surface text-cyber-primary font-bold shadow-sm' : 'text-cyber-muted hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </button>
          </div>

          <span className="text-[11px] text-cyber-muted font-mono hidden md:inline">
            <span className="text-zinc-200 font-semibold">{wordCount}</span> words &bull;{' '}
            <span className="text-zinc-200 font-semibold">{charCount}</span> chars &bull;{' '}
            <span className="text-cyber-primary">{readingTime} min</span> read
          </span>
        </div>

        {/* Center: Formatting Shortcuts Toolbar */}
        <div className="hidden lg:flex items-center gap-1 bg-cyber-bg/60 border border-cyber-border/70 rounded-lg p-1 text-xs font-mono">
          <button
            onClick={() => insertSnippet('## ')}
            className="px-2 py-0.5 rounded hover:bg-cyber-card text-zinc-300 hover:text-white font-bold"
            title="Heading 2"
          >
            H2
          </button>
          <button
            onClick={() => insertSnippet('### ')}
            className="px-2 py-0.5 rounded hover:bg-cyber-card text-zinc-300 hover:text-white font-bold"
            title="Heading 3"
          >
            H3
          </button>
          <button
            onClick={() => insertSnippet('**', '**')}
            className="px-2 py-0.5 rounded hover:bg-cyber-card text-zinc-300 hover:text-white font-bold"
            title="Bold"
          >
            B
          </button>
          <button
            onClick={() => insertSnippet('`', '`')}
            className="px-2 py-0.5 rounded hover:bg-cyber-card text-zinc-300 hover:text-white font-mono"
            title="Inline Code"
          >
            &lt;/&gt;
          </button>
          <button
            onClick={insertTerminalBlock}
            className="px-2 py-0.5 rounded hover:bg-cyber-card text-cyber-primary hover:text-white font-mono flex items-center gap-1"
            title="Terminal Block"
          >
            <Terminal className="w-3 h-3" /> Term
          </button>
          <button
            onClick={insertEvidenceTag}
            className="px-2 py-0.5 rounded hover:bg-cyber-card text-cyber-secondary hover:text-white font-mono flex items-center gap-1"
            title="Evidence Vault Citation"
          >
            <FolderLock className="w-3 h-3" /> Evidence
          </button>
          <button
            onClick={insertCallout}
            className="px-2 py-0.5 rounded hover:bg-cyber-card text-amber-400 hover:text-white font-mono flex items-center gap-1"
            title="Callout Block"
          >
            <Quote className="w-3 h-3" /> Callout
          </button>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            onClick={runQACheck}
            disabled={inspectingQA}
            className="px-2.5 py-1 rounded bg-cyber-bg border border-cyber-border hover:border-amber-400/50 text-amber-400 text-xs flex items-center gap-1 transition"
            title="Run Anti-AI-Slop & Quality Audit"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">QA Audit</span>
          </button>

          <button
            onClick={onOpenCompliance}
            className="px-2.5 py-1 rounded bg-cyber-bg border border-cyber-border hover:border-emerald-500/50 text-emerald-400 text-xs flex items-center gap-1 transition"
            title="Competition Rule Checker"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rules</span>
          </button>

          <button
            onClick={onOpenExport}
            className="px-2.5 py-1 rounded bg-cyber-bg border border-cyber-border hover:border-cyber-primary text-zinc-200 text-xs flex items-center gap-1 transition"
            title="Export Writeup"
          >
            <Download className="w-3.5 h-3.5 text-cyber-primary" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={copyMarkdown}
            className="p-1.5 rounded bg-cyber-bg border border-cyber-border text-zinc-300 hover:text-white transition"
            title="Copy Raw Markdown"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-cyber-primary" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleSave}
            className="px-3 py-1 rounded bg-cyber-primary text-black font-semibold text-xs flex items-center gap-1 hover:bg-cyber-primary/90 transition shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            {saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      {/* QA Warning Banner if triggered */}
      {qaReport && (
        <div className={`px-4 py-2 text-xs font-mono flex items-center justify-between border-b ${
          qaReport.quality_score >= 80 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
        }`}>
          <div className="flex items-center gap-2">
            {qaReport.quality_score >= 80 ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span className="font-bold">Anti-AI-Slop & Quality Score: {qaReport.quality_score}/100</span>
            <span className="text-zinc-400 hidden sm:inline">&bull; {qaReport.verdict}</span>
          </div>
          <button onClick={() => setQaReport(null)} className="text-zinc-400 hover:text-white">Dismiss</button>
        </div>
      )}

      {/* Main Split Area (Obsidian Style - Image 1) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left/Center Pane: Raw Markdown Editor with Classification Banner */}
        {(activeView === 'split' || activeView === 'edit') && (
          <div className={`${activeView === 'split' ? 'w-1/2 border-r border-cyber-border' : 'w-full'} flex flex-col bg-cyber-bg overflow-hidden`}>
            
            {/* Classification banner (Image 1 aesthetic) */}
            <div className="p-3 bg-cyber-sidebar/80 border-b border-cyber-border text-center select-none">
              <div className="inline-block px-4 py-1 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-bold tracking-widest uppercase">
                CONFIDENTIAL // CTF FORENSIC EXPLOIT REPORT // PERIHELION // ORCON
              </div>
            </div>

            {/* Code / Markdown Textarea with syntax feel */}
            <div className="flex-1 relative flex">
              {/* Line Numbers Simulation */}
              <div className="w-10 bg-cyber-sidebar/40 border-r border-cyber-border/40 select-none py-4 text-right pr-2 font-mono text-[11px] text-cyber-muted/50 leading-relaxed overflow-hidden">
                {Array.from({ length: 60 }).map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              <textarea
                id="writeup-textarea"
                value={content}
                onChange={(e) => onChange(e.target.value)}
                placeholder="# Challenge Title&#10;&#10;## Target Metadata&#10;- Challenge ID: CHAL-WEB-001&#10;- Category: Web Exploitation&#10;&#10;## 1. Vulnerability Analysis&#10;..."
                className="flex-1 bg-transparent p-4 text-xs font-mono text-zinc-200 leading-relaxed resize-none focus:outline-none selection:bg-cyber-primary/20 selection:text-white"
                spellCheck={false}
              />
            </div>
          </div>
        )}

        {/* Right Pane: Live Document Preview with Metrics Cards (Image 1 right side) */}
        {(activeView === 'split' || activeView === 'preview') && (
          <div className={`${activeView === 'split' ? 'w-1/2' : 'w-full'} bg-cyber-card flex flex-col overflow-y-auto p-6 space-y-6 select-text`}>
            
            {/* Document Header & Telemetry Cards (Image 1 style Status Dashboard) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyber-muted tracking-widest uppercase">
                    CYBERSECURITY WRITEUP REPORT
                  </span>
                  <h1 className="text-xl font-bold text-cyber-text font-mono mt-0.5">
                    {challengeId}: Target Exploitation & Forensics
                  </h1>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  VERIFIED PWNED
                </div>
              </div>

              {/* Status Dashboard with 3 Cards (Directly matching Image 1: Module Mass 18.4t, Crew Capacity 12, Pressurized Vol 148m³) */}
              <div className="grid grid-cols-3 gap-3 font-mono">
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#171D29] to-[#111620] border border-cyber-border shadow-sm">
                  <span className="text-[10px] text-cyber-muted uppercase tracking-wider block">TARGET SCORE</span>
                  <div className="text-2xl font-bold text-cyber-secondary mt-1">500 pts</div>
                  <span className="text-[10px] text-emerald-400 mt-0.5 block">&Delta; Within budget</span>
                </div>

                <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#171D29] to-[#111620] border border-cyber-border shadow-sm">
                  <span className="text-[10px] text-cyber-muted uppercase tracking-wider block">EVIDENCE COUNT</span>
                  <div className="text-2xl font-bold text-cyber-primary mt-1">12 items</div>
                  <span className="text-[10px] text-cyber-muted mt-0.5 block">100% SHA-256 verified</span>
                </div>

                <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#171D29] to-[#111620] border border-cyber-border shadow-sm">
                  <span className="text-[10px] text-cyber-muted uppercase tracking-wider block">COMPLIANCE SCORE</span>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">100%</div>
                  <span className="text-[10px] text-cyber-muted mt-0.5 block">12 of 12 rules passed</span>
                </div>
              </div>
            </div>

            {/* Attack Surface & Floor Plan / Exploit Sequence Diagram (Image 1 style) */}
            <div className="space-y-2 font-mono">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Exploitation Execution Flow
              </h3>
              <div className="p-4 rounded-xl bg-cyber-bg border border-cyber-border space-y-3 text-xs">
                <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                  <div className="p-2 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400">
                    RECON [80, 443]
                  </div>
                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    KEY CONFUSION
                  </div>
                  <div className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400">
                    HMAC FORGERY
                  </div>
                  <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    FLAG CAPTURED
                  </div>
                </div>
                <div className="text-[11px] text-cyber-muted leading-relaxed">
                  Dual-phase attack flow: The server accepts public RSA keys as symmetric HMAC secret verification tokens, allowing arbitrary privilege escalation.
                </div>
              </div>
            </div>

            {/* Formatted Rendered Content */}
            <div className="prose prose-invert max-w-none text-xs font-mono space-y-4 leading-relaxed">
              {content.split('\n\n').map((paragraph, idx) => {
                if (paragraph.startsWith('# ')) {
                  return (
                    <h1 key={idx} className="text-lg font-bold text-cyber-primary pb-2 border-b border-cyber-border">
                      {paragraph.replace('# ', '')}
                    </h1>
                  );
                }
                if (paragraph.startsWith('## ')) {
                  return (
                    <h2 key={idx} className="text-sm font-bold text-cyber-text pt-2 border-b border-cyber-border/40 pb-1">
                      {paragraph.replace('## ', '')}
                    </h2>
                  );
                }
                if (paragraph.startsWith('### ')) {
                  return (
                    <h3 key={idx} className="text-xs font-bold text-zinc-200">
                      {paragraph.replace('### ', '')}
                    </h3>
                  );
                }
                if (paragraph.startsWith('```')) {
                  return (
                    <div key={idx} className="p-3 bg-cyber-bg rounded-lg border border-cyber-border text-emerald-400 text-[11px] overflow-x-auto">
                      <pre className="font-mono">{paragraph.replace(/```[a-z]*/g, '')}</pre>
                    </div>
                  );
                }
                if (paragraph.startsWith('> ')) {
                  return (
                    <div key={idx} className="p-3 bg-amber-500/10 border-l-4 border-amber-400 text-amber-200 text-xs rounded-r">
                      {paragraph.replace('> ', '')}
                    </div>
                  );
                }
                return (
                  <p key={idx} className="text-zinc-300">
                    {paragraph}
                  </p>
                );
              })}
            </div>

            {/* Document Footer (Image 1 style) */}
            <div className="pt-4 border-t border-cyber-border flex items-center justify-between text-[11px] font-mono text-cyber-muted">
              <span>CTF Writeup Studio &bull; Cryptographically Verified</span>
              <span>{wordCount} words &bull; {charCount} chars &bull; {readingTime} min read</span>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
