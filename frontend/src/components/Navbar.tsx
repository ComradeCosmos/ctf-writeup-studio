import React from 'react';
import { 
  Shield, 
  Terminal, 
  FolderLock, 
  FileText, 
  CheckCircle2, 
  Download, 
  Layers, 
  LayoutDashboard,
  Radio
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  activeSession: any;
  onStopSession?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, activeSession, onStopSession }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'competitions', label: 'Competitions', icon: Shield },
    { id: 'challenges', label: 'Challenges', icon: Layers },
    { id: 'recorder', label: 'Session Recorder', icon: Terminal },
    { id: 'evidence', label: 'Evidence Vault', icon: FolderLock },
    { id: 'editor', label: 'Writeup Editor', icon: FileText },
    { id: 'compliance', label: 'Rule Engine', icon: CheckCircle2 },
    { id: 'export', label: 'Export Center', icon: Download },
  ];

  return (
    <aside className="w-64 bg-cyber-surface border-r border-cyber-border flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* App Title */}
        <div className="p-5 border-b border-cyber-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyber-green/10 border border-cyber-green/30 flex items-center justify-center text-cyber-green">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-cyber-text tracking-wide uppercase">CTF Studio</h1>
            <p className="text-[11px] text-cyber-muted font-mono">v2.4.0 &bull; FORENSICS</p>
          </div>
        </div>

        {/* Live Session Status Pill */}
        <div className="p-3 mx-3 my-3 bg-cyber-card border border-cyber-border rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${activeSession ? 'bg-cyber-green pulse-green' : 'bg-zinc-600'}`}></span>
              <span className="text-xs font-mono font-medium">
                {activeSession ? 'AGENT RECORDING' : 'AGENT IDLE'}
              </span>
            </div>
            {activeSession && (
              <button 
                onClick={onStopSession}
                className="text-[10px] px-2 py-0.5 rounded bg-cyber-danger/20 text-cyber-danger hover:bg-cyber-danger/30 font-mono transition"
              >
                STOP
              </button>
            )}
          </div>
          {activeSession ? (
            <div className="mt-2 text-[11px] text-cyber-muted truncate font-mono">
              {activeSession.name}
            </div>
          ) : (
            <p className="text-[10px] text-cyber-muted mt-1">Terminal Agent standby</p>
          )}
        </div>

        {/* Navigation items */}
        <nav className="px-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  active 
                    ? 'bg-cyber-card text-cyber-green border border-cyber-border font-semibold shadow-sm' 
                    : 'text-cyber-muted hover:text-cyber-text hover:bg-cyber-card/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-cyber-green' : 'text-cyber-muted'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Terminal Agent Integration Helper */}
      <div className="p-4 border-t border-cyber-border bg-cyber-bg/40">
        <div className="flex items-center gap-2 mb-1.5 text-xs text-cyber-muted font-mono">
          <Radio className="w-3.5 h-3.5 text-cyber-green animate-pulse" />
          <span>Local Agent Hook</span>
        </div>
        <p className="text-[11px] text-zinc-400">
          Capture PS, CMD, Bash & WSL directly into Evidence Vault.
        </p>
      </div>
    </aside>
  );
};
