import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Shield, 
  Layers, 
  FileText, 
  BookTemplate, 
  Download, 
  Terminal, 
  FolderLock, 
  Sparkles, 
  CheckCircle2, 
  Settings, 
  Cpu, 
  HelpCircle, 
  ChevronDown, 
  Radio, 
  Command,
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Competition } from '../services/mockData';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  competitions: Competition[];
  selectedCompId: string;
  onSelectCompetition: (id: string) => void;
  activeSession: any;
  onOpenCommandPalette: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  competitions,
  selectedCompId,
  onSelectCompetition,
  activeSession,
  onOpenCommandPalette
}) => {
  const [compDropdownOpen, setCompDropdownOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<{ [key: string]: boolean }>({});

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const navSections = [
    {
      title: 'Workspace',
      id: 'workspace',
      items: [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, badge: null },
        { id: 'competitions', label: 'Competitions', icon: Shield, badge: competitions.length },
        { id: 'challenges', label: 'Challenges', icon: Layers, badge: null },
      ]
    },
    {
      title: 'Documentation',
      id: 'documentation',
      items: [
        { id: 'editor', label: 'Writeup Editor', icon: FileText, badge: 'PRO' },
        { id: 'templates', label: 'Templates Library', icon: BookTemplate, badge: null },
        { id: 'export', label: 'Export Center', icon: Download, badge: null },
      ]
    },
    {
      title: 'Intelligence',
      id: 'intelligence',
      items: [
        { id: 'recorder', label: 'Session Recorder', icon: Terminal, badge: activeSession ? 'REC' : null, isRec: !!activeSession },
        { id: 'evidence', label: 'Evidence Vault', icon: FolderLock, badge: 'SHA-256' },
        { id: 'explainer', label: 'AI Explainer', icon: Sparkles, badge: null },
        { id: 'compliance', label: 'Compliance Checker', icon: CheckCircle2, badge: null },
      ]
    },
    {
      title: 'System',
      id: 'system',
      items: [
        { id: 'settings', label: 'Settings', icon: Settings, badge: null },
        { id: 'integrations', label: 'Local Agent & CLI', icon: Cpu, badge: 'HOOK' },
        { id: 'help', label: 'Help & Docs', icon: HelpCircle, badge: null },
      ]
    }
  ];

  const currentComp = competitions.find(c => c.id === selectedCompId) || competitions[0];

  return (
    <aside className="w-64 bg-cyber-sidebar border-r border-cyber-border flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-30">
      
      {/* Top Branding & Workspace Switcher */}
      <div className="flex flex-col">
        {/* Logo & Tagline */}
        <div className="p-4 border-b border-cyber-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyber-card border border-cyber-primary/40 flex items-center justify-center text-cyber-primary shadow-glow-primary">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-cyber-text tracking-wider uppercase font-mono flex items-center gap-1.5">
                CTF Writeup Studio
              </div>
              <p className="text-[10px] text-cyber-muted truncate font-mono">v2.4.0 &bull; FORENSICS</p>
            </div>
          </div>
        </div>

        {/* Competition Quick Switcher */}
        <div className="p-3 border-b border-cyber-border bg-cyber-card/30 relative">
          <div className="text-[10px] uppercase font-mono text-cyber-muted tracking-wider mb-1.5 flex items-center justify-between px-1">
            <span>Active Contest</span>
            <span className="text-[9px] text-cyber-primary bg-cyber-primary/10 px-1 py-0.2 rounded font-mono">
              {currentComp?.status?.toUpperCase()}
            </span>
          </div>

          <button
            onClick={() => setCompDropdownOpen(!compDropdownOpen)}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-cyber-card border border-cyber-border hover:border-cyber-primary/40 text-xs font-mono text-zinc-200 transition"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-cyber-primary" />
              <span className="truncate font-semibold">{currentComp?.name || 'Select Competition'}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-cyber-muted shrink-0 ml-1" />
          </button>

          {/* Switcher dropdown */}
          {compDropdownOpen && (
            <div className="absolute top-full left-3 right-3 mt-1 bg-cyber-surface border border-cyber-border rounded-lg shadow-2xl py-1.5 z-50 text-xs font-mono">
              {competitions.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    onSelectCompetition(c.id);
                    setCompDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-cyber-card transition ${c.id === selectedCompId ? 'text-cyber-primary bg-cyber-card/80 font-bold' : 'text-zinc-300'}`}
                >
                  <span className="truncate">{c.name}</span>
                  <span className="text-[10px] text-cyber-muted shrink-0">{c.challenges_count} chals</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Global Search / Command Palette Trigger */}
        <div className="px-3 pt-3">
          <button
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-cyber-card/50 border border-cyber-border hover:border-cyber-primary/40 text-xs font-mono text-cyber-textSecondary transition group"
          >
            <span className="flex items-center gap-2 text-cyber-muted group-hover:text-zinc-300">
              <Search className="w-3.5 h-3.5" />
              <span className="text-[11px]">Command Palette</span>
            </span>
            <kbd className="text-[10px] bg-cyber-surface border border-cyber-border px-1.5 py-0.5 rounded text-cyber-muted font-mono">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-270px)]">
          {navSections.map((section) => {
            const isCollapsed = collapsedGroups[section.id];
            return (
              <div key={section.id} className="space-y-1">
                <button
                  onClick={() => toggleGroup(section.id)}
                  className="w-full flex items-center justify-between px-2 py-1 text-[10px] uppercase font-mono font-bold tracking-wider text-cyber-muted hover:text-zinc-300 transition"
                >
                  <span>{section.title}</span>
                  {isCollapsed ? (
                    <ChevronRight className="w-3 h-3 text-cyber-muted" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-cyber-muted" />
                  )}
                </button>

                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = currentTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setCurrentTab(item.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                            active
                              ? 'bg-cyber-card text-cyber-primary border border-cyber-primary/30 font-semibold shadow-sm'
                              : 'text-cyber-textSecondary hover:text-cyber-text hover:bg-cyber-card/40'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-cyber-primary' : 'text-cyber-muted'}`} />
                            <span className="truncate">{item.label}</span>
                          </div>

                          {item.badge && (
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase shrink-0 ${
                              item.isRec 
                                ? 'bg-cyber-error/20 text-cyber-error animate-pulse'
                                : active
                                ? 'bg-cyber-primary/20 text-cyber-primary'
                                : 'bg-cyber-card border border-cyber-border text-cyber-muted'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* User Footer Profile & Local Agent Status */}
      <div className="p-3 border-t border-cyber-border bg-cyber-sidebar">
        <div className="flex items-center justify-between p-2 rounded-lg bg-cyber-card/60 border border-cyber-border">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-7 h-7 rounded-full bg-cyber-surface border border-cyber-border flex items-center justify-center text-cyber-primary text-xs font-mono font-bold">
              0x
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-cyber-text truncate">Security Researcher</div>
              <div className="text-[10px] text-cyber-muted font-mono flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${activeSession ? 'bg-cyber-primary pulse-lime' : 'bg-zinc-500'}`} />
                {activeSession ? 'Agent Hook Active' : 'Agent Standby'}
              </div>
            </div>
          </div>
        </div>
      </div>

    </aside>
  );
};
