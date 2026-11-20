import React, { useState } from 'react';
import { 
  Sparkles, 
  Terminal, 
  HelpCircle, 
  Send, 
  BookOpen, 
  ShieldAlert, 
  FileText,
  CheckCircle,
  Copy
} from 'lucide-react';
import { api } from '../services/api';

interface AIExplainerPanelProps {
  challengeId?: string;
  onWriteupGenerated?: (markdown: string) => void;
}

export const AIExplainerPanel: React.FC<AIExplainerPanelProps> = ({ challengeId, onWriteupGenerated }) => {
  const [commandInput, setCommandInput] = useState('');
  const [stdoutInput, setStdoutInput] = useState('');
  const [mode, setMode] = useState<string>('Technical');
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState<any | null>(null);
  
  // Full writeup generation
  const [generating, setGenerating] = useState(false);
  const [authorName, setAuthorName] = useState('0xHacker');
  const [redactFlag, setRedactFlag] = useState(false);

  const handleExplainCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    setExplaining(true);
    try {
      const res = await api.explainCommand(commandInput, stdoutInput, mode);
      setExplanation(res);
    } catch (err) {
      console.error(err);
    } finally {
      setExplaining(false);
    }
  };

  const handleGenerateFullWriteup = async () => {
    if (!challengeId) return;
    setGenerating(true);
    try {
      const res = await api.generateWriteup({
        challenge_id: challengeId,
        style_mode: mode,
        author: authorName,
        redact_flag_token: redactFlag
      });
      if (onWriteupGenerated && res.result?.content_markdown) {
        onWriteupGenerated(res.result.content_markdown);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 shadow-lg space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-cyber-border pb-4">
        <div>
          <h3 className="text-sm font-bold text-cyber-text flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyber-green" />
            AI Technical Explainer & Evidence Synthesizer
          </h3>
          <p className="text-xs text-cyber-muted">
            Evidence-grounded explanations with 0% AI-slop; strictly derived from observed outputs
          </p>
        </div>

        {/* Style mode selector */}
        <div className="flex items-center gap-1 bg-cyber-surface border border-cyber-border rounded-lg p-1 text-xs font-mono">
          {['Beginner Friendly', 'Technical', 'Professional Research'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 rounded text-[11px] transition ${
                mode === m ? 'bg-cyber-green text-black font-semibold' : 'text-cyber-muted hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Section 1: 7-Point Command Action Explainer */}
      <div>
        <h4 className="text-xs font-bold text-zinc-300 font-mono mb-2 flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-cyber-green" />
          Interactive 7-Point Command Inspector
        </h4>

        <form onSubmit={handleExplainCommand} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-cyber-muted font-mono block mb-1">TERMINAL COMMAND</label>
              <input
                type="text"
                placeholder="e.g. nmap -sC -sV -p 80,5000 10.10.11.23"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                className="w-full bg-cyber-surface border border-cyber-border rounded p-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-cyber-green"
              />
            </div>
            <div>
              <label className="text-[11px] text-cyber-muted font-mono block mb-1">OUTPUT SNIPPET (OPTIONAL)</label>
              <input
                type="text"
                placeholder="e.g. 5000/tcp open http Werkzeug 3.0.1"
                value={stdoutInput}
                onChange={(e) => setStdoutInput(e.target.value)}
                className="w-full bg-cyber-surface border border-cyber-border rounded p-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-cyber-green"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={explaining || !commandInput.trim()}
              className="text-xs px-3 py-1.5 rounded bg-cyber-border hover:bg-cyber-surface text-white border border-cyber-border transition flex items-center gap-1.5 font-mono disabled:opacity-50"
            >
              {explaining ? 'Analyzing...' : 'Generate 7-Point Technical Breakdown'}
            </button>
          </div>
        </form>

        {/* 7-Point Breakdown Results */}
        {explanation && (
          <div className="mt-4 bg-cyber-surface border border-cyber-border rounded-lg p-4 space-y-3 text-xs font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-cyber-border">
              <span className="text-cyber-green font-bold">Analysis for: {explanation.command}</span>
              <span className="text-[10px] text-cyber-muted uppercase">{explanation.mode}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <span className="text-cyber-muted block text-[10px]">1. WHAT IT DOES</span>
                <p className="text-zinc-200">{explanation.what_it_does}</p>
              </div>
              <div>
                <span className="text-cyber-muted block text-[10px]">2. WHY IT WAS EXECUTED</span>
                <p className="text-zinc-200">{explanation.why_executed}</p>
              </div>
              <div className="col-span-2">
                <span className="text-cyber-muted block text-[10px]">3. IMPORTANT ARGUMENTS</span>
                <ul className="list-disc pl-4 space-y-0.5 text-zinc-300">
                  {explanation.important_arguments.map((arg: string, i: number) => (
                    <li key={i}>{arg}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="text-cyber-muted block text-[10px]">4. OUTPUT INDICATION</span>
                <p className="text-zinc-200">{explanation.output_indication}</p>
              </div>
              <div>
                <span className="text-cyber-muted block text-[10px]">5. DISCOVERED INTEL</span>
                <p className="text-zinc-200">{explanation.discovered}</p>
              </div>
              <div>
                <span className="text-cyber-muted block text-[10px]">6. CONTRIBUTION TO SOLVE</span>
                <p className="text-zinc-200">{explanation.contribution_to_solution}</p>
              </div>
              <div>
                <span className="text-cyber-muted block text-[10px]">7. NEXT LOGICAL STEP</span>
                <p className="text-emerald-400">{explanation.next_logical_step}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Grounded Writeup Synthesizer */}
      <div className="pt-4 border-t border-cyber-border flex items-center justify-between bg-cyber-surface/60 p-4 rounded-xl">
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-zinc-200 font-mono flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-cyber-green" />
            Synthesize Complete Writeup Document
          </h4>
          <p className="text-[11px] text-cyber-muted">
            Aggregates all recorded commands, timestamps, and Evidence Vault artifacts into the editor.
          </p>
          <div className="flex items-center gap-4 pt-1 text-xs font-mono">
            <label className="flex items-center gap-1.5 text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={redactFlag}
                onChange={(e) => setRedactFlag(e.target.checked)}
                className="rounded bg-cyber-card border-cyber-border text-cyber-green focus:ring-0"
              />
              Redact Flag string in report
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-cyber-muted">Author:</span>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="bg-cyber-card border border-cyber-border rounded px-2 py-0.5 text-xs font-mono text-zinc-200 w-28"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerateFullWriteup}
          disabled={generating || !challengeId}
          className="px-4 py-2 rounded-lg bg-cyber-green text-black font-semibold text-xs hover:bg-cyber-green/90 transition flex items-center gap-2 shadow disabled:opacity-50 font-mono"
        >
          <Sparkles className="w-4 h-4" />
          {generating ? 'Synthesizing...' : 'Synthesize Writeup'}
        </button>
      </div>
    </div>
  );
};
