import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Plus, 
  Terminal, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Search, 
  Grid, 
  List, 
  Globe, 
  Lock, 
  Cpu, 
  Eye, 
  Sparkles, 
  ShieldAlert, 
  ExternalLink,
  ChevronRight,
  X,
  Copy,
  Check,
  FolderLock,
  Tag
} from 'lucide-react';
import { api, Challenge, Competition } from '../services/api';

interface ChallengesPageProps {
  onNavigate: (tab: string, challengeId?: string) => void;
}

export const ChallengesPage: React.FC<ChallengesPageProps> = ({ onNavigate }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [statusFilter, setStatusFilter] = useState<'all' | 'solved' | 'unsolved'>('all');
  
  // Drawer & Modal state
  const [selectedChal, setSelectedChal] = useState<Challenge | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'overview' | 'evidence' | 'writeup' | 'solution'>('overview');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [flagRevealed, setFlagRevealed] = useState(false);
  const [flagCopied, setFlagCopied] = useState(false);

  // Form states
  const [compId, setCompId] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Web');
  const [difficulty, setDifficulty] = useState('Medium');
  const [points, setPoints] = useState(100);
  const [description, setDescription] = useState('');
  const [flag, setFlag] = useState('');

  const load = async () => {
    try {
      const [chals, comps] = await Promise.all([
        api.getChallenges(),
        api.getCompetitions()
      ]);
      setChallenges(chals);
      setCompetitions(comps);
      if (comps.length > 0 && !compId) {
        setCompId(comps[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const categories = [
    'all',
    'Web',
    'Pwn',
    'Crypto',
    'Forensics',
    'Reverse Engineering',
    'OSINT',
    'Misc',
    'Hardware',
    'Steganography'
  ];

  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'web': return <Globe className="w-3.5 h-3.5 text-sky-400" />;
      case 'pwn': return <Terminal className="w-3.5 h-3.5 text-rose-400" />;
      case 'crypto': return <Lock className="w-3.5 h-3.5 text-amber-400" />;
      case 'forensics': return <Eye className="w-3.5 h-3.5 text-emerald-400" />;
      case 'reverse engineering': return <Cpu className="w-3.5 h-3.5 text-purple-400" />;
      case 'osint': return <Globe className="w-3.5 h-3.5 text-teal-400" />;
      case 'hardware': return <Cpu className="w-3.5 h-3.5 text-orange-400" />;
      default: return <Sparkles className="w-3.5 h-3.5 text-cyber-primary" />;
    }
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'easy':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Easy</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Medium</span>;
      case 'hard':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">Hard</span>;
      case 'insane':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">Insane</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono text-zinc-400 bg-zinc-800">{diff}</span>;
    }
  };

  const filtered = challenges.filter(c => {
    if (selectedCategory !== 'all' && c.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;
    if (selectedDifficulty !== 'all' && c.difficulty.toLowerCase() !== selectedDifficulty.toLowerCase()) return false;
    if (statusFilter === 'solved' && !c.solved) return false;
    if (statusFilter === 'unsolved' && c.solved) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q);
    }
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !compId) return;
    await api.createChallenge({
      competition_id: compId,
      name,
      category,
      difficulty,
      points,
      description,
      flag
    });
    setCreateModalOpen(false);
    setName('');
    setDescription('');
    setFlag('');
    load();
  };

  const copyFlag = (flagText: string) => {
    navigator.clipboard.writeText(flagText);
    setFlagCopied(true);
    setTimeout(() => setFlagCopied(false), 1500);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyber-primary/10 border border-cyber-primary/20 text-cyber-primary">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-cyber-text font-mono flex items-center gap-2">
                Challenge Pipeline & Target Matrix
              </h1>
              <p className="text-xs text-cyber-muted mt-0.5">
                Centralized exploitation tracking, verified evidence logs, and live terminal session bindings.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-cyber-card border border-cyber-border rounded-lg p-1 text-xs font-mono">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition ${viewMode === 'grid' ? 'bg-cyber-surface text-cyber-primary' : 'text-cyber-muted hover:text-white'}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition ${viewMode === 'table' ? 'bg-cyber-surface text-cyber-primary' : 'text-cyber-muted hover:text-white'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-cyber-primary text-black font-semibold text-xs font-mono flex items-center gap-1.5 hover:bg-cyber-primary/90 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Challenge
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-cyber-card border border-cyber-border rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-cyber-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search challenges by name, ID, or CVE keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-cyber-bg border border-cyber-border rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono text-zinc-200 placeholder-cyber-muted focus:outline-none focus:border-cyber-primary/50"
            />
          </div>

          {/* Quick status tabs */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg border transition ${statusFilter === 'all' ? 'bg-cyber-surface border-cyber-primary/40 text-cyber-primary font-semibold' : 'bg-cyber-bg border-cyber-border text-cyber-muted hover:text-white'}`}
            >
              All Targets ({challenges.length})
            </button>
            <button
              onClick={() => setStatusFilter('solved')}
              className={`px-3 py-1.5 rounded-lg border transition ${statusFilter === 'solved' ? 'bg-cyber-surface border-emerald-500/40 text-emerald-400 font-semibold' : 'bg-cyber-bg border-cyber-border text-cyber-muted hover:text-white'}`}
            >
              Solved ({challenges.filter(c => c.solved).length})
            </button>
            <button
              onClick={() => setStatusFilter('unsolved')}
              className={`px-3 py-1.5 rounded-lg border transition ${statusFilter === 'unsolved' ? 'bg-cyber-surface border-amber-500/40 text-amber-400 font-semibold' : 'bg-cyber-bg border-cyber-border text-cyber-muted hover:text-white'}`}
            >
              In Progress ({challenges.filter(c => !c.solved).length})
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono scrollbar-thin">
          <span className="text-cyber-muted text-[11px] uppercase tracking-wider shrink-0 mr-1">Categories:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md transition shrink-0 capitalize ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/30 font-semibold'
                  : 'bg-cyber-bg text-cyber-muted hover:text-zinc-200 border border-cyber-border'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Challenge Grid or Table View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((chal) => (
            <div
              key={chal.id}
              onClick={() => setSelectedChal(chal)}
              className="group bg-cyber-card border border-cyber-border hover:border-cyber-primary/40 rounded-xl p-5 transition flex flex-col justify-between cursor-pointer hover:shadow-lg relative overflow-hidden"
            >
              {chal.solved && (
                <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden pointer-events-none">
                  <div className="bg-emerald-500/20 text-emerald-400 border-b border-emerald-500/30 text-[9px] font-mono font-bold py-0.5 text-center transform rotate-45 translate-x-4 translate-y-2 w-24">
                    PWNED
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono text-cyber-muted px-2 py-0.5 rounded bg-cyber-bg border border-cyber-border">
                    {chal.id}
                  </span>
                  <div className="flex items-center gap-2">
                    {getDifficultyBadge(chal.difficulty)}
                    <span className="text-xs font-mono font-bold text-cyber-primary bg-cyber-primary/10 px-2 py-0.5 rounded border border-cyber-primary/20">
                      {chal.points} pts
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="p-1 rounded bg-cyber-surface border border-cyber-border">
                    {getCategoryIcon(chal.category)}
                  </span>
                  <span className="text-xs font-mono text-zinc-300 font-medium">
                    {chal.category}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-cyber-text group-hover:text-cyber-primary transition line-clamp-1 mb-2 font-mono">
                  {chal.name}
                </h3>

                <p className="text-xs text-cyber-muted line-clamp-2 mb-4 leading-relaxed">
                  {chal.description || 'Target vulnerability exploration and exploit payload engineering.'}
                </p>
              </div>

              <div className="pt-3 border-t border-cyber-border/70 flex items-center justify-between text-xs font-mono text-cyber-muted">
                <div className="flex items-center gap-1.5">
                  {chal.solved ? (
                    <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Solved
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-400 text-[11px]">
                      <Clock className="w-3.5 h-3.5" /> In Progress
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('recorder', chal.id);
                    }}
                    className="p-1.5 rounded hover:bg-cyber-surface text-cyber-muted hover:text-cyber-primary transition"
                    title="Open in Terminal Recorder"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('editor', chal.id);
                    }}
                    className="p-1.5 rounded hover:bg-cyber-surface text-cyber-muted hover:text-cyber-secondary transition"
                    title="Open Writeup"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedChal(chal);
                    }}
                    className="p-1.5 rounded hover:bg-cyber-surface text-cyber-muted hover:text-white transition"
                    title="Inspect Target Matrix"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-cyber-card border border-cyber-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-cyber-surface text-cyber-muted uppercase text-[10px] tracking-wider border-b border-cyber-border">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Challenge Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Difficulty</th>
                  <th className="px-4 py-3">Points</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border">
                {filtered.map((chal) => (
                  <tr
                    key={chal.id}
                    onClick={() => setSelectedChal(chal)}
                    className="hover:bg-cyber-surface/50 cursor-pointer transition"
                  >
                    <td className="px-4 py-3 text-cyber-muted font-bold">{chal.id}</td>
                    <td className="px-4 py-3 text-cyber-text font-bold hover:text-cyber-primary">{chal.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {getCategoryIcon(chal.category)}
                        <span className="text-zinc-300">{chal.category}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{getDifficultyBadge(chal.difficulty)}</td>
                    <td className="px-4 py-3 text-cyber-primary font-bold">{chal.points} pts</td>
                    <td className="px-4 py-3">
                      {chal.solved ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Solved
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onNavigate('recorder', chal.id)}
                          className="px-2 py-1 rounded bg-cyber-bg border border-cyber-border hover:border-cyber-primary text-cyber-muted hover:text-cyber-primary transition"
                        >
                          Record
                        </button>
                        <button
                          onClick={() => onNavigate('editor', chal.id)}
                          className="px-2 py-1 rounded bg-cyber-bg border border-cyber-border hover:border-cyber-secondary text-cyber-muted hover:text-cyber-secondary transition"
                        >
                          Writeup
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Target Details Slide-out Drawer */}
      {selectedChal && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-cyber-card border-l border-cyber-border h-full flex flex-col justify-between shadow-2xl p-6 overflow-y-auto">
            
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-start justify-between pb-4 border-b border-cyber-border">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyber-bg border border-cyber-border text-cyber-muted">
                      {selectedChal.id}
                    </span>
                    {getDifficultyBadge(selectedChal.difficulty)}
                    <span className="text-xs font-mono font-bold text-cyber-primary bg-cyber-primary/10 px-2 py-0.5 rounded border border-cyber-primary/20">
                      {selectedChal.points} pts
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-cyber-text font-mono">
                    {selectedChal.name}
                  </h2>
                </div>

                <button
                  onClick={() => setSelectedChal(null)}
                  className="p-1.5 rounded-lg bg-cyber-bg border border-cyber-border text-cyber-muted hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex items-center gap-1 border-b border-cyber-border text-xs font-mono">
                <button
                  onClick={() => setActiveDrawerTab('overview')}
                  className={`px-3 py-2 border-b-2 font-semibold transition ${
                    activeDrawerTab === 'overview'
                      ? 'border-cyber-primary text-cyber-primary'
                      : 'border-transparent text-cyber-muted hover:text-white'
                  }`}
                >
                  Target Overview
                </button>
                <button
                  onClick={() => setActiveDrawerTab('solution')}
                  className={`px-3 py-2 border-b-2 font-semibold transition ${
                    activeDrawerTab === 'solution'
                      ? 'border-cyber-primary text-cyber-primary'
                      : 'border-transparent text-cyber-muted hover:text-white'
                  }`}
                >
                  Exploitation & Flag
                </button>
                <button
                  onClick={() => setActiveDrawerTab('evidence')}
                  className={`px-3 py-2 border-b-2 font-semibold transition ${
                    activeDrawerTab === 'evidence'
                      ? 'border-cyber-primary text-cyber-primary'
                      : 'border-transparent text-cyber-muted hover:text-white'
                  }`}
                >
                  Linked Evidence
                </button>
              </div>

              {/* Tab Contents */}
              {activeDrawerTab === 'overview' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-mono font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                      Vulnerability Description
                    </h4>
                    <div className="p-3.5 bg-cyber-bg rounded-lg border border-cyber-border text-xs text-cyber-muted leading-relaxed font-mono">
                      {selectedChal.description || 'Target vulnerability analysis, endpoint discovery, and payload delivery documentation.'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 bg-cyber-bg rounded-lg border border-cyber-border">
                      <span className="text-cyber-muted block text-[10px] uppercase">Category</span>
                      <span className="text-zinc-200 font-bold mt-1 flex items-center gap-1.5">
                        {getCategoryIcon(selectedChal.category)}
                        {selectedChal.category}
                      </span>
                    </div>
                    <div className="p-3 bg-cyber-bg rounded-lg border border-cyber-border">
                      <span className="text-cyber-muted block text-[10px] uppercase">Competition ID</span>
                      <span className="text-cyber-secondary font-bold mt-1 truncate block">
                        {selectedChal.competition_id}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-cyber-surface/60 rounded-lg border border-cyber-border space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-300 font-semibold">Live Shell Agent Link</span>
                      <span className="text-cyber-primary font-bold text-[11px]">ACTIVE HOOK READY</span>
                    </div>
                    <p className="text-[11px] text-cyber-muted font-mono">
                      PowerShell and Bash commands executed with challenge tag <code className="text-cyber-secondary">{selectedChal.id}</code> will stream automatically into session history.
                    </p>
                  </div>
                </div>
              )}

              {activeDrawerTab === 'solution' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-mono font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                      Verified CTF Flag Proof
                    </h4>
                    <div className="p-3 bg-cyber-bg rounded-lg border border-cyber-border flex items-center justify-between">
                      <span className="text-xs font-mono text-emerald-400 font-bold truncate">
                        {flagRevealed ? (selectedChal.flag || 'CTF{s1mpl3_fl4g_pwn3d}') : '••••••••••••••••••••••••••••••'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setFlagRevealed(!flagRevealed)}
                          className="px-2 py-1 rounded bg-cyber-card border border-cyber-border text-xs font-mono text-cyber-muted hover:text-white"
                        >
                          {flagRevealed ? 'Hide' : 'Reveal'}
                        </button>
                        <button
                          onClick={() => copyFlag(selectedChal.flag || 'CTF{s1mpl3_fl4g_pwn3d}')}
                          className="p-1 rounded bg-cyber-card border border-cyber-border text-cyber-muted hover:text-cyber-primary"
                          title="Copy Flag"
                        >
                          {flagCopied ? <Check className="w-3.5 h-3.5 text-cyber-primary" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-cyber-surface rounded-lg border border-cyber-border space-y-2">
                    <span className="text-xs font-mono font-semibold text-zinc-300 uppercase block">Exploitation Vector</span>
                    <p className="text-xs font-mono text-cyber-muted">
                      Target compromised via verified reproducible pipeline. Commands, HTTP transcripts, and binary disassemblies are stored in the digital forensics evidence vault.
                    </p>
                  </div>
                </div>
              )}

              {activeDrawerTab === 'evidence' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-cyber-muted">Linked Vault Items</span>
                    <button 
                      onClick={() => onNavigate('evidence', selectedChal.id)}
                      className="text-cyber-primary hover:underline flex items-center gap-1"
                    >
                      Open Vault <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="p-3 bg-cyber-bg rounded-lg border border-cyber-border flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <FolderLock className="w-4 h-4 text-cyber-primary" />
                        <div>
                          <span className="text-zinc-200 font-bold block">terminal_exploit_log.txt</span>
                          <span className="text-[10px] text-cyber-muted">SHA-256: 7f83b165... Verified</span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        VERIFIED
                      </span>
                    </div>

                    <div className="p-3 bg-cyber-bg rounded-lg border border-cyber-border flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <FolderLock className="w-4 h-4 text-sky-400" />
                        <div>
                          <span className="text-zinc-200 font-bold block">flag_capture_screenshot.png</span>
                          <span className="text-[10px] text-cyber-muted">SHA-256: 8c863467... Verified</span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        VERIFIED
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Actions Bottom Bar */}
            <div className="pt-4 border-t border-cyber-border flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedChal(null);
                  onNavigate('recorder', selectedChal.id);
                }}
                className="flex-1 py-2 px-3 rounded-lg bg-cyber-surface border border-cyber-border hover:border-cyber-primary text-xs font-mono text-zinc-200 hover:text-white flex items-center justify-center gap-1.5 transition"
              >
                <Terminal className="w-3.5 h-3.5 text-cyber-primary" />
                Live Terminal
              </button>
              <button
                onClick={() => {
                  setSelectedChal(null);
                  onNavigate('editor', selectedChal.id);
                }}
                className="flex-1 py-2 px-3 rounded-lg bg-cyber-primary text-black font-semibold text-xs font-mono flex items-center justify-center gap-1.5 hover:bg-cyber-primary/90 transition"
              >
                <FileText className="w-3.5 h-3.5" />
                Writeup Editor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Challenge Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-cyber-card border border-cyber-border rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cyber-border">
              <h3 className="text-sm font-bold text-cyber-text font-mono flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyber-primary" />
                Register New CTF Target
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-cyber-muted hover:text-white text-xs font-mono"
              >
                Esc / Close
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Target Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JWT Key Confusion or Heap Overflow 0x01"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-cyber-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Competition</label>
                  <select
                    value={compId}
                    onChange={(e) => setCompId(e.target.value)}
                    className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-cyber-primary"
                  >
                    {competitions.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-cyber-primary"
                  >
                    {categories.filter(c => c !== 'all').map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-cyber-primary"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Insane">Insane</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Points</label>
                  <input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-cyber-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Target Description / Scenario</label>
                <textarea
                  rows={3}
                  placeholder="Service description, remote port, credentials or challenge hints..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-cyber-primary"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Flag (Optional)</label>
                <input
                  type="text"
                  placeholder="CTF{example_flag_hash}"
                  value={flag}
                  onChange={(e) => setFlag(e.target.value)}
                  className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-cyber-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-cyber-border">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-cyber-bg border border-cyber-border text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyber-primary text-black font-semibold hover:bg-cyber-primary/90"
                >
                  Register Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
