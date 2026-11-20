import React from 'react';
import { 
  HelpCircle, 
  Terminal, 
  FileText, 
  ShieldCheck, 
  FolderLock, 
  Sparkles, 
  ExternalLink,
  Keyboard,
  BookOpen
} from 'lucide-react';

export const HelpPage: React.FC = () => {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      
      {/* Banner */}
      <div className="flex items-center gap-2">
        <span className="p-1.5 rounded-lg bg-cyber-primary/10 border border-cyber-primary/20 text-cyber-primary">
          <HelpCircle className="w-5 h-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-cyber-text font-mono flex items-center gap-2">
            Documentation & Operator Handbook
          </h1>
          <p className="text-xs text-cyber-muted mt-0.5">
            Quick reference guide for terminal recording, evidence management, anti-slop writeup synthesis, and hotkeys.
          </p>
        </div>
      </div>

      {/* Keyboard Shortcuts Matrix */}
      <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 shadow-sm space-y-3 font-mono text-xs">
        <div className="flex items-center gap-2 text-zinc-200 font-bold border-b border-cyber-border pb-2">
          <Keyboard className="w-4 h-4 text-cyber-primary" />
          <span>Workstation Hotkeys</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
          <div className="flex items-center justify-between p-2.5 bg-cyber-bg rounded border border-cyber-border">
            <span className="text-zinc-300">Open Command Palette</span>
            <kbd className="px-2 py-0.5 rounded bg-cyber-surface border border-cyber-border text-cyber-primary font-bold">Ctrl + K</kbd>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-cyber-bg rounded border border-cyber-border">
            <span className="text-zinc-300">Search Atuin Command History</span>
            <kbd className="px-2 py-0.5 rounded bg-cyber-surface border border-cyber-border text-cyber-primary font-bold">Ctrl + R</kbd>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-cyber-bg rounded border border-cyber-border">
            <span className="text-zinc-300">Save Current Writeup Draft</span>
            <kbd className="px-2 py-0.5 rounded bg-cyber-surface border border-cyber-border text-cyber-primary font-bold">Ctrl + S</kbd>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-cyber-bg rounded border border-cyber-border">
            <span className="text-zinc-300">Insert Evidence Citation Tag</span>
            <kbd className="px-2 py-0.5 rounded bg-cyber-surface border border-cyber-border text-cyber-primary font-bold">Ctrl + E</kbd>
          </div>
        </div>
      </div>

      {/* Architecture Modules Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
        <div className="p-5 bg-cyber-card border border-cyber-border rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-cyber-primary font-bold">
            <Terminal className="w-4 h-4" />
            <span>1. Live Session Recorder</span>
          </div>
          <p className="text-cyber-muted text-[11px] leading-relaxed">
            Integrates directly with PowerShell, Bash, and WSL to stream command execution duration, stdout/stderr, and exit codes. Secrets and auth tokens are sanitized automatically.
          </p>
        </div>

        <div className="p-5 bg-cyber-card border border-cyber-border rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <FolderLock className="w-4 h-4" />
            <span>2. Evidence Vault</span>
          </div>
          <p className="text-cyber-muted text-[11px] leading-relaxed">
            Centralized digital forensics store supporting 12 categories. Computes cryptographic SHA-256 hashes on import to prevent tampering and generates exportable evidence manifests.
          </p>
        </div>

        <div className="p-5 bg-cyber-card border border-cyber-border rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-cyber-secondary font-bold">
            <Sparkles className="w-4 h-4" />
            <span>3. Anti-AI-Slop Explainer</span>
          </div>
          <p className="text-cyber-muted text-[11px] leading-relaxed">
            Generates rigorous 7-point breakdowns in authentic hacker tone. Omits generic chatbot pleasantries and anchors all statements in verified terminal commands.
          </p>
        </div>

        <div className="p-5 bg-cyber-card border border-cyber-border rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>4. Rule Compliance Engine</span>
          </div>
          <p className="text-cyber-muted text-[11px] leading-relaxed">
            Automates checks across 12 contest regulation categories and supports user-defined custom rules or direct rule extraction from guideline documents.
          </p>
        </div>
      </div>

    </div>
  );
};
