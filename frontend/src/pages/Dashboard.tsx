import React, { useState } from 'react';
import { 
  Shield, 
  Layers, 
  FileCheck2, 
  FolderLock, 
  Terminal, 
  AlertTriangle, 
  ArrowRight, 
  Plus, 
  Radio, 
  Play, 
  Sparkles, 
  Download, 
  Clock, 
  CheckCircle2, 
  Flame,
  FileText,
  Activity,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { Competition, Challenge, EvidenceItem, INITIAL_COMPETITIONS, INITIAL_CHALLENGES, INITIAL_EVIDENCE } from '../services/mockData';

interface DashboardProps {
  onNavigate: (tab: string, challengeId?: string) => void;
  competitions?: Competition[];
  challenges?: Challenge[];
  evidence?: EvidenceItem[];
  activeSession?: any;
  onOpenQuickCreate?: (type: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  competitions = INITIAL_COMPETITIONS,
  challenges = INITIAL_CHALLENGES,
  evidence = INITIAL_EVIDENCE,
  activeSession = null,
  onOpenQuickCreate = () => {}
}) => {
  const safeCompetitions = competitions || INITIAL_COMPETITIONS || [];
  const safeChallenges = challenges || INITIAL_CHALLENGES || [];
  const safeEvidence = evidence || INITIAL_EVIDENCE || [];

  const completedWriteups = safeChallenges.filter(c => c.writeup_status === 'completed').length;
  const activeCompetitions = safeCompetitions.filter(c => c.status === 'active').length;
  const totalPoints = safeChallenges.reduce((sum, c) => sum + (c.points || 0), 0);
  const solvedChallenges = safeChallenges.filter(c => c.solution_status === 'solved').length;

  const statCards = [
    {
      title: 'Active Competitions',
      val: activeCompetitions,
      total: safeCompetitions.length,
      desc: 'Live contest battlegrounds',
      icon: Shield,
      accent: 'text-cyber-primary',
      tab: 'competitions'
    },
    {
      title: 'Total Challenges',
      val: safeChallenges.length,
      total: `${totalPoints} pts`,
      desc: `${solvedChallenges} solved / captured`,
      icon: Layers,
      accent: 'text-cyber-secondary',
      tab: 'challenges'
    },
    {
      title: 'Completed Writeups',
      val: completedWriteups,
      total: `${safeChallenges.length > 0 ? Math.round((completedWriteups / safeChallenges.length) * 100) : 0}%`,
      desc: 'Regulation-compliant docs',
      icon: FileCheck2,
      accent: 'text-cyber-success',
      tab: 'editor'
    },
    {
      title: 'Evidence Collected',
      val: safeEvidence.length,
      total: 'SHA-256',
      desc: '100% verified disk integrity',
      icon: FolderLock,
      accent: 'text-purple-400',
      tab: 'evidence'
    },
    {
      title: 'Active Sessions',
      val: activeSession ? 1 : 0,
      total: activeSession ? 'RECORDING' : 'IDLE',
      desc: activeSession ? 'PowerShell agent active' : 'Agent on standby',
      icon: Terminal,
      accent: activeSession ? 'text-cyber-primary' : 'text-zinc-500',
      tab: 'recorder'
    },
    {
      title: 'Compliance Status',
      val: '12/12',
      total: 'Compliant',
      desc: '0 critical policy blocks',
      icon: AlertTriangle,
      accent: 'text-cyber-warning',
      tab: 'compliance'
    }
  ];

  const quickAccessActions = [
    {
      title: activeSession ? 'Resume Live Session' : 'Start Recording Session',
      desc: activeSession ? 'Terminal agent is capturing commands' : 'Launch local shell agent hook',
      icon: Terminal,
      badge: activeSession ? 'LIVE' : 'AGENT',
      badgeColor: activeSession ? 'bg-cyber-error/20 text-cyber-error animate-pulse' : 'bg-cyber-primary/20 text-cyber-primary',
      action: () => onNavigate('recorder')
    },
    {
      title: 'Open Evidence Vault',
      desc: 'Inspect SHA-256 hashes & annotations',
      icon: FolderLock,
      badge: `${safeEvidence.length} ARTIFACTS`,
      badgeColor: 'bg-purple-500/20 text-purple-300',
      action: () => onNavigate('evidence')
    },
    {
      title: 'Continue Writeup Draft',
      desc: 'Active Challenge Writeup',
      icon: FileText,
      badge: 'DRAFT',
      badgeColor: 'bg-blue-500/20 text-blue-300',
      action: () => onNavigate('editor', safeChallenges[0]?.id || '')
    },
    {
      title: 'AI Technical Explainer',
      desc: 'Generate grounded 7-point breakdown',
      icon: Sparkles,
      badge: 'EVIDENCE-BASED',
      badgeColor: 'bg-cyber-primary/20 text-cyber-primary',
      action: () => onNavigate('explainer')
    }
  ];

  const recentTimeline = [
    {
      id: 1,
      title: 'Flag Captured & Proof Stored',
      meta: 'Challenge &bull; Active Investigation',
      time: '18m ago',
      type: 'flag',
      icon: Flame,
      color: 'text-cyber-primary bg-cyber-primary/10 border-cyber-primary/30'
    },
    {
      id: 2,
      title: 'Terminal Command Logged: nmap -sC -sV',
      meta: 'Port 5000 Werkzeug HTTP service enumerated',
      time: '42m ago',
      type: 'command',
      icon: Terminal,
      color: 'text-cyber-secondary bg-cyber-secondary/10 border-cyber-secondary/30'
    },
    {
      id: 3,
      title: 'Evidence Artifact Imported: auth_sqli_bypass.http',
      meta: 'SHA-256: 93f81e9bc923a10e... (Burp Export)',
      time: '1h ago',
      type: 'evidence',
      icon: FolderLock,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
    },
    {
      id: 4,
      title: 'Compliance Audit Evaluated: 12 Categories',
      meta: 'Passed flag redaction & screenshot rules',
      time: '2h ago',
      type: 'compliance',
      icon: CheckCircle2,
      color: 'text-cyber-success bg-cyber-success/10 border-cyber-success/30'
    },
    {
      id: 5,
      title: 'Full Forensics Package Exported (ZIP)',
      meta: 'Challenge_Writeup_Package.zip',
      time: '3h ago',
      type: 'export',
      icon: Download,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-cyber-card border border-cyber-border rounded-2xl p-6 shadow-subtle relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyber-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyber-primary bg-cyber-primary/10 border border-cyber-primary/20 px-2 py-0.5 rounded">
              CYBERSECURITY WORKSTATION
            </span>
            <span className="text-xs font-mono text-cyber-muted">&bull;</span>
            <span className="text-xs font-mono text-cyber-textSecondary flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-cyber-secondary" /> Telemetry Online
            </span>
          </div>

          <h1 className="text-2xl font-bold text-cyber-text tracking-tight">
            Welcome back, Researcher.
          </h1>
          <p className="text-xs text-cyber-textSecondary max-w-xl leading-relaxed">
            Your CTF workspace. Track discoveries, preserve verifiable evidence, and document every exploit into publication-ready writeups.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 relative z-10 font-mono text-xs">
          <button
            onClick={() => onOpenQuickCreate('new_competition')}
            className="px-3 py-2 rounded-lg bg-cyber-surface border border-cyber-border hover:border-cyber-primary/40 text-zinc-200 hover:text-white transition flex items-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5 text-cyber-secondary" /> New Competition
          </button>
          <button
            onClick={() => onOpenQuickCreate('new_challenge')}
            className="px-3 py-2 rounded-lg bg-cyber-surface border border-cyber-border hover:border-cyber-primary/40 text-zinc-200 hover:text-white transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-cyber-primary" /> New Challenge
          </button>
          <button
            onClick={() => onNavigate('recorder')}
            className="px-4 py-2 rounded-lg bg-cyber-primary text-black font-semibold hover:bg-cyber-primary/90 transition flex items-center gap-1.5 shadow-glow-primary"
          >
            <Terminal className="w-3.5 h-3.5" /> Start Recording
          </button>
        </div>
      </div>

      {/* 6 Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((sc, i) => {
          const Icon = sc.icon;
          return (
            <div
              key={i}
              onClick={() => onNavigate(sc.tab)}
              className="bg-cyber-card border border-cyber-border rounded-xl p-4 cursor-pointer hover:border-cyber-primary/50 transition group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-cyber-muted font-mono font-medium truncate">{sc.title}</span>
                  <Icon className={`w-4 h-4 ${sc.accent}`} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-cyber-text group-hover:text-cyber-primary transition">
                    {sc.val}
                  </span>
                  <span className="text-[10px] font-mono text-cyber-muted">{sc.total}</span>
                </div>
              </div>
              <p className="text-[10px] text-cyber-muted mt-2 font-mono truncate">{sc.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {quickAccessActions.map((qa, i) => {
          const Icon = qa.icon;
          return (
            <div
              key={i}
              onClick={qa.action}
              className="bg-cyber-card border border-cyber-border rounded-xl p-4 cursor-pointer hover:border-cyber-primary/40 hover:bg-cyber-card/80 transition flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-cyber-surface border border-cyber-border flex items-center justify-center text-cyber-text group-hover:text-cyber-primary transition">
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold ${qa.badgeColor}`}>
                  {qa.badge}
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-cyber-text group-hover:text-cyber-primary transition mb-1 font-mono">
                  {qa.title}
                </h4>
                <p className="text-[11px] text-cyber-muted line-clamp-1">{qa.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Recent Competitions & Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Active Competitions & Pipeline */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Competitions Panel */}
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-cyber-border pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyber-primary" />
                <h3 className="text-xs font-bold font-mono text-cyber-text uppercase tracking-wider">
                  Competition Progression
                </h3>
              </div>
              <button
                onClick={() => onNavigate('competitions')}
                className="text-xs text-cyber-muted hover:text-cyber-primary font-mono flex items-center gap-1 transition"
              >
                View All ({safeCompetitions.length}) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {safeCompetitions.slice(0, 2).map((comp) => {
                const percent = comp.challenges_count > 0 ? Math.round((comp.completed_writeups_count / comp.challenges_count) * 100) : 0;
                return (
                  <div
                    key={comp.id}
                    onClick={() => onNavigate('competitions')}
                    className="p-4 rounded-xl bg-cyber-surface/50 border border-cyber-border hover:border-cyber-primary/40 transition cursor-pointer space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-7 h-7 rounded bg-cyber-card border border-cyber-border flex items-center justify-center text-xs font-mono font-bold text-cyber-primary">
                          {comp.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <h4 className="text-xs font-bold text-zinc-100 truncate">{comp.name}</h4>
                          <span className="text-[10px] text-cyber-muted font-mono">{comp.platform}</span>
                        </div>
                      </div>

                      <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                        comp.status === 'active' ? 'bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/30' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {comp.status}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 font-mono text-[11px]">
                      <div className="flex items-center justify-between text-cyber-muted">
                        <span>Writeup Progress</span>
                        <span className="text-cyber-text font-bold">{comp.completed_writeups_count}/{comp.challenges_count} ({percent}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-cyber-card rounded-full overflow-hidden border border-cyber-border/40">
                        <div 
                          className="h-full bg-cyber-primary transition-all duration-500" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-cyber-muted border-t border-cyber-border/40">
                      <span>Deadline: {new Date(comp.submission_deadline).toLocaleDateString()}</span>
                      <span className="text-cyber-secondary font-semibold">Rules Enforced</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Solved Challenges Pipeline */}
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 shadow-subtle space-y-3">
            <div className="flex items-center justify-between border-b border-cyber-border pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyber-secondary" />
                <h3 className="text-xs font-bold font-mono text-cyber-text uppercase tracking-wider">
                  Target Challenge Pipeline
                </h3>
              </div>
              <button
                onClick={() => onNavigate('challenges')}
                className="text-xs text-cyber-muted hover:text-cyber-secondary font-mono flex items-center gap-1 transition"
              >
                Inspect Pipeline <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-cyber-border/40">
              {safeChallenges.slice(0, 4).map((chal) => (
                <div
                  key={chal.id}
                  onClick={() => onNavigate('editor', chal.id)}
                  className="py-2.5 flex items-center justify-between hover:bg-cyber-surface/40 px-2 rounded-lg transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${
                      chal.solution_status === 'solved' ? 'bg-cyber-primary' : 'bg-amber-400'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-100 font-mono">{chal.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyber-surface border border-cyber-border text-cyber-muted font-mono">
                          {chal.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-cyber-muted line-clamp-1 max-w-md">{chal.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-[10px] text-cyber-primary font-bold">{chal.points} pts</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold ${
                      chal.writeup_status === 'completed' ? 'bg-cyber-success/10 text-cyber-success' : 'bg-cyber-card text-cyber-muted'
                    }`}>
                      {chal.writeup_status}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-cyber-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right 1 Col: Live Activity Stream & Deadlines */}
        <div className="space-y-6">
          
          {/* Upcoming Contest Deadlines */}
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 shadow-subtle space-y-3">
            <h3 className="text-xs font-bold font-mono text-cyber-text uppercase tracking-wider flex items-center gap-2 border-b border-cyber-border pb-3">
              <Calendar className="w-4 h-4 text-cyber-warning" />
              Submission Deadlines
            </h3>

            <div className="space-y-2">
              {safeCompetitions.map((comp) => {
                const daysLeft = Math.max(0, Math.ceil((new Date(comp.submission_deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
                return (
                  <div key={comp.id} className="p-2.5 rounded-lg bg-cyber-surface/60 border border-cyber-border flex items-center justify-between text-xs font-mono">
                    <div className="truncate pr-2">
                      <div className="font-semibold text-zinc-200 truncate">{comp.name}</div>
                      <div className="text-[10px] text-cyber-muted">{new Date(comp.submission_deadline).toLocaleDateString()}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 ${
                      daysLeft <= 4 ? 'bg-cyber-warning/20 text-cyber-warning' : 'bg-cyber-card text-zinc-300'
                    }`}>
                      {daysLeft}d remaining
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chronological Activity Feed */}
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 shadow-subtle space-y-3">
            <h3 className="text-xs font-bold font-mono text-cyber-text uppercase tracking-wider flex items-center gap-2 border-b border-cyber-border pb-3">
              <Activity className="w-4 h-4 text-cyber-primary" />
              Live Telemetry Feed
            </h3>

            <div className="space-y-3 relative pl-4 before:content-[''] before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-cyber-border">
              {recentTimeline.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.id} className="relative flex items-start gap-2.5 text-xs font-mono">
                    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border ${item.color} -ml-[23px] mt-0.5`}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-zinc-200 truncate">{item.title}</span>
                        <span className="text-[9px] text-cyber-muted shrink-0 ml-1">{item.time}</span>
                      </div>
                      <p className="text-[10px] text-cyber-muted truncate mt-0.5">{item.meta}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
