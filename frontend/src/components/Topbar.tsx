import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Bell, 
  Terminal, 
  FileText, 
  FolderLock, 
  Shield, 
  ChevronRight, 
  Radio,
  Check,
  ExternalLink,
  Command
} from 'lucide-react';
import { Competition } from '../services/mockData';

interface TopbarProps {
  currentTab: string;
  selectedCompetition?: Competition;
  onOpenCommandPalette: () => void;
  onQuickAction: (action: string) => void;
  activeSession: any;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentTab,
  selectedCompetition,
  onOpenCommandPalette,
  onQuickAction,
  activeSession
}) => {
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const notifications = [
    { id: 1, title: 'Compliance Check Completed', desc: 'All 12 regulation checks passed for active competition', time: '10m ago', unread: true },
    { id: 2, title: 'SHA-256 Verified', desc: 'Artifact SCR-9A21 matched disk signature', time: '35m ago', unread: false },
    { id: 3, title: 'New Terminal Activity', desc: 'Received 4 commands from PowerShell hook', time: '1h ago', unread: false },
  ];

  const getBreadcrumb = () => {
    switch (currentTab) {
      case 'dashboard': return ['Workspace', 'Overview & Telemetry'];
      case 'competitions': return ['Workspace', 'Competitions'];
      case 'challenges': return ['Workspace', 'Challenge Pipeline'];
      case 'editor': return ['Documentation', 'Writeup Editor'];
      case 'templates': return ['Documentation', 'Templates Library'];
      case 'export': return ['Documentation', 'Export Center'];
      case 'recorder': return ['Intelligence', 'Live Session Recorder'];
      case 'evidence': return ['Intelligence', 'Evidence Vault'];
      case 'explainer': return ['Intelligence', 'AI Technical Explainer'];
      case 'compliance': return ['Intelligence', 'Compliance Checker'];
      case 'settings': return ['System', 'Settings'];
      case 'integrations': return ['System', 'Local Agent & Shell Hooks'];
      default: return ['Workspace', 'CTF Writeup Studio'];
    }
  };

  const breadcrumbs = getBreadcrumb();

  return (
    <header className="h-14 bg-cyber-sidebar border-b border-cyber-border flex items-center justify-between px-6 sticky top-0 z-20 select-none">
      
      {/* Left: Window Controls + Breadcrumb */}
      <div className="flex items-center gap-4">
        {/* macOS style dots */}
        <div className="flex items-center gap-1.5 pr-2 border-r border-cyber-border/60">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]/80 hover:bg-[#FF5F56] transition cursor-pointer" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]/80 hover:bg-[#FFBD2E] transition cursor-pointer" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]/80 hover:bg-[#27C93F] transition cursor-pointer" />
        </div>

        {/* Breadcrumb path */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-cyber-muted">{breadcrumbs[0]}</span>
          <ChevronRight className="w-3.5 h-3.5 text-cyber-muted" />
          <span className="text-cyber-text font-semibold">{breadcrumbs[1]}</span>
          {selectedCompetition && (
            <>
              <span className="text-cyber-border">/</span>
              <span className="text-cyber-secondary text-[11px] truncate max-w-[150px]">
                {selectedCompetition.name}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Center: Tagline */}
      <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-cyber-muted bg-cyber-card/40 px-3 py-1 rounded-full border border-cyber-border/60">
        <span className="text-cyber-primary font-bold">CAPTURE</span> &bull;
        <span className="text-cyber-secondary font-bold">UNDERSTAND</span> &bull;
        <span className="text-zinc-300 font-bold">DOCUMENT</span>
      </div>

      {/* Right: Actions, Search, Quick Create & Notifications */}
      <div className="flex items-center gap-3">
        
        {/* Command Palette button */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-cyber-card border border-cyber-border hover:border-cyber-primary/40 text-xs font-mono text-cyber-muted hover:text-zinc-200 transition"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">Search...</span>
          <kbd className="text-[10px] bg-cyber-surface px-1.5 py-0.5 rounded text-cyber-muted border border-cyber-border">
            Ctrl+K
          </kbd>
        </button>

        {/* Quick Create Dropdown */}
        <div className="relative">
          <button
            onClick={() => setQuickCreateOpen(!quickCreateOpen)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyber-primary text-black font-semibold text-xs font-mono hover:bg-cyber-primary/90 transition shadow-glow-primary"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">New</span>
          </button>

          {quickCreateOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-cyber-surface border border-cyber-border rounded-xl shadow-2xl p-1.5 z-50 text-xs font-mono space-y-1">
              <button
                onClick={() => {
                  onQuickAction('new_challenge');
                  setQuickCreateOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-cyber-card text-zinc-200 hover:text-cyber-primary transition text-left"
              >
                <Plus className="w-3.5 h-3.5 text-cyber-primary" /> New Challenge
              </button>
              <button
                onClick={() => {
                  onQuickAction('new_session');
                  setQuickCreateOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-cyber-card text-zinc-200 hover:text-cyber-secondary transition text-left"
              >
                <Terminal className="w-3.5 h-3.5 text-cyber-secondary" /> Start Recording Session
              </button>
              <button
                onClick={() => {
                  onQuickAction('upload_evidence');
                  setQuickCreateOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-cyber-card text-zinc-200 hover:text-amber-400 transition text-left"
              >
                <FolderLock className="w-3.5 h-3.5 text-amber-400" /> Upload Evidence Artifact
              </button>
              <button
                onClick={() => {
                  onQuickAction('synthesize_writeup');
                  setQuickCreateOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-cyber-card text-zinc-200 hover:text-purple-400 transition text-left"
              >
                <FileText className="w-3.5 h-3.5 text-purple-400" /> Synthesize Writeup
              </button>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-1.5 rounded-lg bg-cyber-card border border-cyber-border hover:border-cyber-primary/40 text-cyber-muted hover:text-white transition relative"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-cyber-primary absolute top-1 right-1" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-cyber-surface border border-cyber-border rounded-xl shadow-2xl p-3 z-50 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between border-b border-cyber-border pb-2">
                <span className="font-bold text-zinc-200">Notifications</span>
                <span className="text-[10px] text-cyber-primary">1 Unread</span>
              </div>
              <div className="space-y-1.5">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2 rounded bg-cyber-card/60 border border-cyber-border/40 hover:bg-cyber-card transition space-y-0.5">
                    <div className="font-semibold text-zinc-200 text-[11px] flex items-center justify-between">
                      <span>{n.title}</span>
                      <span className="text-[9px] text-cyber-muted font-normal">{n.time}</span>
                    </div>
                    <p className="text-[10px] text-cyber-muted leading-relaxed">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

    </header>
  );
};
