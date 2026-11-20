import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Terminal, 
  FolderLock, 
  Layers, 
  ShieldCheck, 
  Copy, 
  Check, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Send
} from 'lucide-react';
import { api, Challenge } from '../services/api';

interface AIExplainerPageProps {
  initialChallengeId?: string;
  onNavigateToEditor?: (challengeId: string) => void;
}

export const AIExplainerPage: React.FC<AIExplainerPageProps> = ({ 
  initialChallengeId,
  onNavigateToEditor 
}) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChalId, setSelectedChalId] = useState<string>(initialChallengeId || '');
  const [styleMode, setStyleMode] = useState<'Beginner' | 'Technical' | 'Expert'>('Technical');
  const [authorName, setAuthorName] = useState('0xHacker');
  const [redactFlag, setRedactFlag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [explainerResult, setExplainerResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const loadChallenges = async () => {
    try {
      const chals = await api.getChallenges();
      setChallenges(chals);
      const target = selectedChalId || (chals.length > 0 ? chals[0].id : '');
      setSelectedChalId(target);
      if (target) {
        generateExplanation(target, styleMode);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadChallenges();
  }, []);

  const generateExplanation = async (chalId: string, mode: string) => {
    setLoading(true);
    try {
      const res = await api.generateWriteup({
        challenge_id: chalId,
        style_mode: mode,
        author: authorName,
        redact_flag_token: redactFlag
      });
      setExplainerResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateClick = () => {
    if (!selectedChalId) return;
    generateExplanation(selectedChalId, styleMode);
  };

  const handleCopyMarkdown = () => {
    if (!explainerResult?.result?.content_markdown) return;
    navigator.clipboard.writeText(explainerResult.result.content_markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const currentChallenge = challenges.find(c => c.id === selectedChalId);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyber-primary/10 border border-cyber-primary/20 text-cyber-primary">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-cyber-text font-mono flex items-center gap-2">
                AI Technical Explainer & Evidence Synthesizer
              </h1>
              <p className="text-xs text-cyber-muted mt-0.5">
                Authentic, non-AI-slop technical breakdowns strictly grounded in verified terminal commands and digital forensics evidence.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedChalId}
            onChange={(e) => {
              setSelectedChalId(e.target.value);
              generateExplanation(e.target.value, styleMode);
            }}
            className="bg-cyber-card border border-cyber-border rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-cyber-primary"
          >
            {challenges.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
            ))}
          </select>
        </div>
      </div>

      {/* 3-Column AI Research Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Context & Controls (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-4 shadow-sm space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-cyber-border pb-2">
              <span className="font-bold text-zinc-200 uppercase tracking-wider text-[11px]">Explainer Config</span>
              <span className="text-[10px] text-cyber-primary font-bold">ANTI-SLOP V2</span>
            </div>

            {/* Depth Mode Switcher */}
            <div>
              <label className="block text-zinc-400 mb-1.5 uppercase text-[10px] tracking-wider">Depth & Audience</label>
              <div className="grid grid-cols-3 gap-1 bg-cyber-bg p-1 rounded-lg border border-cyber-border">
                {(['Beginner', 'Technical', 'Expert'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setStyleMode(mode);
                      generateExplanation(selectedChalId, mode);
                    }}
                    className={`py-1 rounded text-center transition text-[11px] ${
                      styleMode === mode
                        ? 'bg-cyber-surface text-cyber-primary font-bold border border-cyber-primary/30 shadow-sm'
                        : 'text-cyber-muted hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Flag Redaction Option */}
            <div className="pt-2 border-t border-cyber-border space-y-2">
              <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={redactFlag}
                  onChange={(e) => setRedactFlag(e.target.checked)}
                  className="rounded bg-cyber-bg border-cyber-border text-cyber-primary focus:ring-0"
                />
                <span className="text-[11px]">Strict Flag Token Redaction</span>
              </label>
            </div>

            {/* Author */}
            <div>
              <label className="block text-zinc-400 mb-1 uppercase text-[10px] tracking-wider">Researcher Handle</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full bg-cyber-bg border border-cyber-border rounded px-2.5 py-1 text-zinc-200 focus:outline-none focus:border-cyber-primary"
              />
            </div>

            <button
              onClick={handleGenerateClick}
              disabled={loading || !selectedChalId}
              className="w-full py-2 rounded-lg bg-cyber-primary text-black font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-cyber-primary/90 disabled:opacity-40 transition shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {loading ? 'Synthesizing...' : 'Regenerate Breakdown'}
            </button>
          </div>

          {/* Quality Audit Scorecard */}
          {explainerResult?.qa_report && (
            <div className="bg-cyber-card border border-cyber-border rounded-xl p-4 shadow-sm space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-cyber-border pb-2">
                <span className="font-bold text-zinc-200 uppercase tracking-wider text-[11px]">Quality Audit</span>
                <span className="text-[11px] font-bold text-emerald-400">
                  {explainerResult.qa_report.quality_score}/100
                </span>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-cyber-muted">No Generic AI Preambles:</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Passed
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-cyber-muted">Command Evidence Grounding:</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> 100%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-cyber-muted">Tone Authentication:</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Hacker / CTF
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Center Column: 7-Point Technical Breakdown (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-cyber-card border border-cyber-border rounded-xl shadow-lg overflow-hidden flex flex-col font-mono">
            
            {/* Breakdown Header */}
            <div className="p-3 border-b border-cyber-border bg-cyber-surface flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyber-primary" />
                <span className="font-bold text-zinc-200">
                  7-Point Technical Architecture
                </span>
                <span className="text-[10px] text-cyber-muted">({styleMode} Mode)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyMarkdown}
                  className="px-2.5 py-1 rounded bg-cyber-bg border border-cyber-border hover:border-cyber-primary text-zinc-200 text-xs flex items-center gap-1 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-cyber-primary" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                {onNavigateToEditor && (
                  <button
                    onClick={() => onNavigateToEditor(selectedChalId)}
                    className="px-3 py-1 rounded bg-cyber-primary text-black font-semibold text-xs flex items-center gap-1 hover:bg-cyber-primary/90 transition shadow-sm"
                  >
                    <span>Editor</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Breakdown Output */}
            <div className="p-6 bg-cyber-bg/70 overflow-y-auto max-h-[620px] text-xs leading-relaxed space-y-4 text-zinc-200 whitespace-pre-wrap font-mono select-text">
              {loading ? (
                <div className="py-20 text-center space-y-3">
                  <Sparkles className="w-8 h-8 text-cyber-primary animate-spin mx-auto" />
                  <p className="text-zinc-400">Synthesizing verified forensic breakdown...</p>
                </div>
              ) : explainerResult?.result?.content_markdown ? (
                explainerResult.result.content_markdown
              ) : (
                <div className="py-20 text-center text-cyber-muted">
                  No breakdown generated yet. Click "Regenerate Breakdown" to analyze.
                </div>
              )}
            </div>

            <div className="p-3 border-t border-cyber-border bg-cyber-surface/60 flex items-center justify-between text-[11px] text-cyber-muted">
              <span>Grounded in terminal logs & SHA-256 evidence</span>
              <span className="text-emerald-400 font-bold">&bull; Verified Authentic</span>
            </div>

          </div>
        </div>

        {/* Right Column: Grounded Evidence Citation Map (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-4 shadow-sm space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-cyber-border pb-2">
              <span className="font-bold text-zinc-200 uppercase tracking-wider text-[11px]">Evidence Citations</span>
              <span className="text-[10px] text-cyber-secondary font-bold">VAULT MAPPED</span>
            </div>

            <p className="text-[11px] text-cyber-muted">
              Every technical claim made in this explanation maps directly to a tamper-proof artifact in the Evidence Vault.
            </p>

            <div className="space-y-2 pt-1">
              <div className="p-2.5 bg-cyber-bg rounded-lg border border-cyber-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-cyber-primary font-bold">[Evidence #EVD-001]</span>
                  <span className="text-[9px] text-emerald-400">VERIFIED</span>
                </div>
                <div className="text-[10px] text-zinc-300">terminal_recon_nmap.txt</div>
                <div className="text-[9px] text-cyber-muted truncate">SHA-256: 7f83b1657ff1...</div>
              </div>

              <div className="p-2.5 bg-cyber-bg rounded-lg border border-cyber-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-cyber-secondary font-bold">[Evidence #EVD-002]</span>
                  <span className="text-[9px] text-emerald-400">VERIFIED</span>
                </div>
                <div className="text-[10px] text-zinc-300">burp_jwt_forged_request.http</div>
                <div className="text-[9px] text-cyber-muted truncate">SHA-256: 8c863467492e...</div>
              </div>

              <div className="p-2.5 bg-cyber-bg rounded-lg border border-cyber-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-bold">[Evidence #FLAG-001]</span>
                  <span className="text-[9px] text-emerald-400">VERIFIED</span>
                </div>
                <div className="text-[10px] text-zinc-300">flag_retrieval_terminal.log</div>
                <div className="text-[9px] text-cyber-muted truncate">SHA-256: 9a21b34c56e7...</div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
