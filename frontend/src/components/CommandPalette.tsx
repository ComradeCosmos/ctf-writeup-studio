import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Terminal, 
  Layers, 
  FolderLock, 
  FileText, 
  ShieldCheck, 
  Download, 
  Settings, 
  ArrowRight,
  Shield,
  BookTemplate,
  X
} from 'lucide-react';
import { Challenge, Competition, INITIAL_CHALLENGES, INITIAL_COMPETITIONS } from '../services/mockData';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, challengeId?: string) => void;
  challenges?: Challenge[];
  competitions?: Competition[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  challenges = INITIAL_CHALLENGES,
  competitions = INITIAL_COMPETITIONS
}) => {
  const safeChallenges = challenges || INITIAL_CHALLENGES || [];
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const staticActions = [
    { title: 'Open Dashboard & Telemetry', category: 'Navigation', icon: Layers, action: () => onNavigate('dashboard') },
    { title: 'Start Live Terminal Recording', category: 'Session', icon: Terminal, action: () => onNavigate('recorder') },
    { title: 'Inspect Forensic Evidence Vault', category: 'Evidence', icon: FolderLock, action: () => onNavigate('evidence') },
    { title: 'Launch Writeup Editor', category: 'Documentation', icon: FileText, action: () => onNavigate('editor') },
    { title: 'Run Regulation Compliance Audit', category: 'Compliance', icon: ShieldCheck, action: () => onNavigate('compliance') },
    { title: 'Build 1-Click Export Package', category: 'Export', icon: Download, action: () => onNavigate('export') },
    { title: 'Browse Writeup Templates', category: 'Templates', icon: BookTemplate, action: () => onNavigate('templates') },
    { title: 'Workspace Settings & AI Config', category: 'Settings', icon: Settings, action: () => onNavigate('settings') },
  ];

  const filteredChallenges = safeChallenges.filter(c => 
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  const filteredActions = staticActions.filter(a =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-cyber-surface border border-cyber-border rounded-xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col font-mono text-xs">
        
        {/* Search Input Bar */}
        <div className="p-3 border-b border-cyber-border flex items-center gap-3 bg-cyber-card">
          <Search className="w-4 h-4 text-cyber-muted ml-1" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command, challenge name, or action (e.g. 'nmap', 'pwn', 'export')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-cyber-text placeholder:text-cyber-muted focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-cyber-surface border border-cyber-border text-[10px] text-cyber-muted">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-3">
          
          {/* Actions group */}
          {filteredActions.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] text-cyber-muted uppercase font-bold tracking-wider">
                Quick Actions
              </div>
              <div className="space-y-0.5">
                {filteredActions.map((act, i) => {
                  const Icon = act.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        act.action();
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-cyber-card text-zinc-300 hover:text-cyber-primary transition group"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className="w-4 h-4 text-cyber-muted group-hover:text-cyber-primary" />
                        <span className="truncate">{act.title}</span>
                      </div>
                      <span className="text-[10px] text-cyber-muted bg-cyber-card px-2 py-0.5 rounded border border-cyber-border/40">
                        {act.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Challenges group */}
          {filteredChallenges.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] text-cyber-muted uppercase font-bold tracking-wider">
                Jump to Challenge
              </div>
              <div className="space-y-0.5">
                {filteredChallenges.map((chal) => (
                  <button
                    key={chal.id}
                    onClick={() => {
                      onNavigate('editor', chal.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-cyber-card text-zinc-300 hover:text-cyber-secondary transition group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Layers className="w-4 h-4 text-cyber-muted group-hover:text-cyber-secondary" />
                      <div className="truncate text-left">
                        <div className="font-semibold text-zinc-200">{chal.name}</div>
                        <div className="text-[10px] text-cyber-muted">{chal.category} &bull; {chal.difficulty}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-cyber-primary font-bold">{chal.points} pts</span>
                      <ArrowRight className="w-3.5 h-3.5 text-cyber-muted group-hover:translate-x-0.5 transition" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredActions.length === 0 && filteredChallenges.length === 0 && (
            <div className="p-8 text-center text-xs text-cyber-muted">
              No matching actions or challenges found.
            </div>
          )}

        </div>

        {/* Footer shortcuts */}
        <div className="p-2.5 border-t border-cyber-border bg-cyber-card flex items-center justify-between text-[10px] text-cyber-muted">
          <span>Navigate with <kbd className="bg-cyber-surface px-1 py-0.5 rounded border border-cyber-border">↑</kbd> <kbd className="bg-cyber-surface px-1 py-0.5 rounded border border-cyber-border">↓</kbd></span>
          <span>Select with <kbd className="bg-cyber-surface px-1 py-0.5 rounded border border-cyber-border">↵</kbd></span>
        </div>

      </div>
    </div>
  );
};
