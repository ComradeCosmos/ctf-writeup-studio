import React, { useState } from 'react';
import { 
  Shield, 
  Plus, 
  Search, 
  Globe, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Layers, 
  FolderLock, 
  Activity, 
  Upload, 
  ExternalLink,
  ChevronRight,
  Filter,
  X,
  Edit2
} from 'lucide-react';
import { Competition, Challenge, EvidenceItem, INITIAL_COMPETITIONS, INITIAL_CHALLENGES, INITIAL_EVIDENCE } from '../services/mockData';

interface CompetitionsPageProps {
  competitions?: Competition[];
  challenges?: Challenge[];
  evidence?: EvidenceItem[];
  onSelectCompetition?: (id: string) => void;
  onNavigate?: (tab: string, challengeId?: string) => void;
  onAddCompetition?: (comp: Competition) => void;
  onUpdateCompetition?: (comp: Competition) => void;
}

export const CompetitionsPage: React.FC<CompetitionsPageProps> = ({
  competitions = INITIAL_COMPETITIONS,
  challenges = INITIAL_CHALLENGES,
  evidence = INITIAL_EVIDENCE,
  onSelectCompetition = () => {},
  onNavigate = () => {},
  onAddCompetition = () => {},
  onUpdateCompetition = () => {}
}) => {
  const safeCompetitions = competitions || INITIAL_COMPETITIONS || [];
  const safeChallenges = challenges || INITIAL_CHALLENGES || [];
  const safeEvidence = evidence || INITIAL_EVIDENCE || [];
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedComp, setSelectedComp] = useState<Competition | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'challenges' | 'regulations' | 'writeups' | 'evidence' | 'activity'>('overview');
  
  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPlatform, setNewPlatform] = useState('CTFd');
  const [newWebsite, setNewWebsite] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newRulesSummary, setNewRulesSummary] = useState('');

  const filtered = safeCompetitions.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.platform.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newComp: Competition = {
      id: `COMP-${Date.now().toString().slice(-6)}`,
      name: newName,
      platform: newPlatform,
      website: newWebsite || 'https://ctf.org',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 7 * 86400000).toISOString(),
      submission_deadline: newDeadline || new Date(Date.now() + 9 * 86400000).toISOString(),
      status: 'active',
      challenges_count: 0,
      completed_writeups_count: 0,
      rules_summary: newRulesSummary || 'Standard contest regulations enforced.',
      official_rules_url: newWebsite ? `${newWebsite}/rules` : '',
      regulations: {
        allow_public_writeups_during_contest: false,
        disclose_flags: false,
        require_screenshots: true,
        min_screenshots: 1,
        require_ai_disclosure: true,
        protect_internal_ips: true,
        max_file_size_mb: 50,
        submission_format: 'ZIP / PDF'
      }
    };
    onAddCompetition(newComp);
    setCreateModalOpen(false);
    setNewName('');
    setNewWebsite('');
    setNewRulesSummary('');
  };

  const handleToggleRegulation = (key: keyof Competition['regulations']) => {
    if (!selectedComp) return;
    const updated = {
      ...selectedComp,
      regulations: {
        ...selectedComp.regulations,
        [key]: !selectedComp.regulations[key]
      }
    };
    setSelectedComp(updated);
    onUpdateCompetition(updated);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cyber-text font-mono flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyber-primary" />
            Competitions
          </h1>
          <p className="text-xs text-cyber-textSecondary mt-1">
            Manage CTF events, regulations, challenges, and submission requirements.
          </p>
        </div>

        <div className="flex items-center gap-2.5 font-mono text-xs">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-cyber-primary text-black font-semibold hover:bg-cyber-primary/90 transition flex items-center gap-1.5 shadow-glow-primary"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Create Competition
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-cyber-card border border-cyber-border rounded-xl p-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-cyber-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search competitions or platforms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-cyber-surface border border-cyber-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-cyber-text placeholder:text-cyber-muted focus:outline-none focus:border-cyber-primary font-mono"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono w-full sm:w-auto overflow-x-auto">
          {['all', 'active', 'upcoming', 'completed'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg border uppercase transition text-[10px] font-bold ${
                filterStatus === st
                  ? 'bg-cyber-primary/20 text-cyber-primary border-cyber-primary/40 font-semibold'
                  : 'bg-cyber-surface border-cyber-border text-cyber-muted hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Competitions Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((comp) => {
          const percent = comp.challenges_count > 0 ? Math.round((comp.completed_writeups_count / comp.challenges_count) * 100) : 0;
          return (
            <div
              key={comp.id}
              onClick={() => setSelectedComp(comp)}
              className="bg-cyber-card border border-cyber-border hover:border-cyber-primary/50 rounded-xl p-5 shadow-subtle transition cursor-pointer flex flex-col justify-between group space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-cyber-surface border border-cyber-border flex items-center justify-center font-mono font-bold text-xs text-cyber-primary">
                      {comp.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-zinc-100 group-hover:text-cyber-primary transition line-clamp-1">
                        {comp.name}
                      </h3>
                      <span className="text-[10px] text-cyber-muted font-mono">{comp.platform}</span>
                    </div>
                  </div>

                  <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                    comp.status === 'active' ? 'bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/30' :
                    comp.status === 'upcoming' ? 'bg-cyber-secondary/10 text-cyber-secondary border border-cyber-secondary/30' :
                    'bg-zinc-800 text-zinc-400'
                  }`}>
                    {comp.status}
                  </span>
                </div>

                <p className="text-[11px] text-cyber-muted line-clamp-2 mb-3">
                  {comp.rules_summary || 'No custom regulations specified.'}
                </p>

                {/* Progress bar */}
                <div className="space-y-1 font-mono text-[10px]">
                  <div className="flex items-center justify-between text-cyber-muted">
                    <span>Completed Writeups</span>
                    <span className="text-cyber-text font-bold">{comp.completed_writeups_count}/{comp.challenges_count} ({percent}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-cyber-surface rounded-full overflow-hidden border border-cyber-border/40">
                    <div className="h-full bg-cyber-primary transition-all duration-300" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-cyber-border flex items-center justify-between text-[10px] font-mono text-cyber-muted">
                <span>Deadline: {new Date(comp.submission_deadline).toLocaleDateString()}</span>
                <span className="text-cyber-primary group-hover:underline flex items-center gap-1 font-semibold">
                  Inspect <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Competition Details Modal / Drawer */}
      {selectedComp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-in fade-in duration-150">
          <div className="bg-cyber-surface border border-cyber-border rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden font-mono text-xs">
            
            {/* Header */}
            <div className="p-5 border-b border-cyber-border bg-cyber-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyber-surface border border-cyber-primary/40 flex items-center justify-center font-bold text-cyber-primary text-sm">
                  {selectedComp.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-cyber-text">{selectedComp.name}</h2>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyber-primary/10 text-cyber-primary uppercase font-bold">
                      {selectedComp.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-cyber-muted">Platform: {selectedComp.platform} &bull; Deadline: {new Date(selectedComp.submission_deadline).toLocaleDateString()}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedComp(null)}
                className="p-1.5 rounded-lg text-cyber-muted hover:text-white hover:bg-cyber-border transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 px-6 border-b border-cyber-border bg-cyber-card/40 text-xs">
              {(['overview', 'challenges', 'regulations', 'writeups', 'evidence', 'activity'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveDetailTab(tab)}
                  className={`py-3 px-3 uppercase text-[11px] font-bold border-b-2 transition ${
                    activeDetailTab === tab
                      ? 'border-cyber-primary text-cyber-primary'
                      : 'border-transparent text-cyber-muted hover:text-zinc-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              
              {/* Overview Tab */}
              {activeDetailTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 bg-cyber-card rounded-xl border border-cyber-border">
                      <span className="text-cyber-muted text-[10px] block">TOTAL CHALLENGES</span>
                      <span className="text-xl font-bold text-cyber-text">{selectedComp.challenges_count}</span>
                    </div>
                    <div className="p-4 bg-cyber-card rounded-xl border border-cyber-border">
                      <span className="text-cyber-muted text-[10px] block">COMPLETED WRITEUPS</span>
                      <span className="text-xl font-bold text-cyber-primary">{selectedComp.completed_writeups_count}</span>
                    </div>
                    <div className="p-4 bg-cyber-card rounded-xl border border-cyber-border">
                      <span className="text-cyber-muted text-[10px] block">REGULATION STATUS</span>
                      <span className="text-xl font-bold text-cyber-secondary">Enforced</span>
                    </div>
                  </div>

                  <div className="p-4 bg-cyber-card rounded-xl border border-cyber-border space-y-2">
                    <span className="text-cyber-muted text-[10px] uppercase font-bold block">Contest Description & Rules Summary</span>
                    <p className="text-zinc-300 leading-relaxed">{selectedComp.rules_summary}</p>
                    {selectedComp.website && (
                      <a
                        href={selectedComp.website}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-cyber-primary hover:underline pt-2 text-[11px]"
                      >
                        <Globe className="w-3.5 h-3.5" /> Official Competition Portal ({selectedComp.website})
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Challenges Tab */}
              {activeDetailTab === 'challenges' && (
                <div className="space-y-2">
                  {safeChallenges.filter(c => c.competition_id === selectedComp.id).map(chal => (
                    <div key={chal.id} className="p-3 bg-cyber-card rounded-xl border border-cyber-border flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-zinc-100">{chal.name}</div>
                        <div className="text-[10px] text-cyber-muted">{chal.category} &bull; {chal.difficulty} &bull; {chal.points} pts</div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedComp(null);
                          onNavigate('editor', chal.id);
                        }}
                        className="px-3 py-1 bg-cyber-surface hover:bg-cyber-card text-cyber-primary border border-cyber-border rounded text-[10px]"
                      >
                        Open Writeup
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Regulations Tab with interactive toggles */}
              {activeDetailTab === 'regulations' && (
                <div className="space-y-3">
                  <div className="p-3 bg-cyber-primary/10 border border-cyber-primary/30 rounded-xl flex items-center justify-between">
                    <span>Automated Rule Engine active for this contest</span>
                    <span className="font-bold text-cyber-primary">12 Categories Enforced</span>
                  </div>

                  <div className="divide-y divide-cyber-border bg-cyber-card rounded-xl border border-cyber-border p-4">
                    <div className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-zinc-200">Flag Disclosure Policy</div>
                        <div className="text-[10px] text-cyber-muted">Redact raw flags in exported writeups</div>
                      </div>
                      <button
                        onClick={() => handleToggleRegulation('disclose_flags')}
                        className={`px-3 py-1 rounded text-[10px] font-bold ${
                          selectedComp.regulations.disclose_flags ? 'bg-cyber-primary/20 text-cyber-primary' : 'bg-cyber-error/20 text-cyber-error'
                        }`}
                      >
                        {selectedComp.regulations.disclose_flags ? 'PERMITTED' : 'REDACTED (MANDATORY)'}
                      </button>
                    </div>

                    <div className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-zinc-200">Mandatory Screenshots Requirement</div>
                        <div className="text-[10px] text-cyber-muted">At least {selectedComp.regulations.min_screenshots} screenshot proof required</div>
                      </div>
                      <button
                        onClick={() => handleToggleRegulation('require_screenshots')}
                        className={`px-3 py-1 rounded text-[10px] font-bold ${
                          selectedComp.regulations.require_screenshots ? 'bg-cyber-primary/20 text-cyber-primary' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {selectedComp.regulations.require_screenshots ? 'ENFORCED' : 'OPTIONAL'}
                      </button>
                    </div>

                    <div className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-zinc-200">AI Content Disclosure</div>
                        <div className="text-[10px] text-cyber-muted">State when writeup content is AI-assisted</div>
                      </div>
                      <button
                        onClick={() => handleToggleRegulation('require_ai_disclosure')}
                        className={`px-3 py-1 rounded text-[10px] font-bold ${
                          selectedComp.regulations.require_ai_disclosure ? 'bg-cyber-primary/20 text-cyber-primary' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {selectedComp.regulations.require_ai_disclosure ? 'MANDATORY' : 'NOT REQUIRED'}
                      </button>
                    </div>

                    <div className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-zinc-200">Protect Internal Infrastructure IPs</div>
                        <div className="text-[10px] text-cyber-muted">Mask RFC1918 private lab addresses</div>
                      </div>
                      <button
                        onClick={() => handleToggleRegulation('protect_internal_ips')}
                        className={`px-3 py-1 rounded text-[10px] font-bold ${
                          selectedComp.regulations.protect_internal_ips ? 'bg-cyber-primary/20 text-cyber-primary' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {selectedComp.regulations.protect_internal_ips ? 'PROTECTED' : 'ALLOW'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Evidence Tab */}
              {activeDetailTab === 'evidence' && (
                <div className="grid grid-cols-2 gap-3">
                  {safeEvidence.filter(e => e.competition_id === selectedComp.id).map(ev => (
                    <div key={ev.id} className="p-3 bg-cyber-card rounded-xl border border-cyber-border space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-cyber-primary">{ev.id}</span>
                        <span className="text-[9px] uppercase text-cyber-muted">{ev.category}</span>
                      </div>
                      <div className="text-zinc-200 font-semibold truncate">{ev.original_filename}</div>
                      <div className="text-[10px] text-cyber-muted font-mono truncate">SHA-256: {ev.sha256_hash.slice(0, 16)}...</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Writeups Tab */}
              {activeDetailTab === 'writeups' && (
                <div className="p-4 bg-cyber-card rounded-xl border border-cyber-border text-center py-8 space-y-2">
                  <FileText className="w-8 h-8 text-cyber-primary mx-auto" />
                  <div className="font-bold text-zinc-200">Writeup Documents Linked</div>
                  <p className="text-cyber-muted max-w-sm mx-auto">
                    {selectedComp.completed_writeups_count} completed writeups are ready for 1-click export package compilation.
                  </p>
                </div>
              )}

              {/* Activity Tab */}
              {activeDetailTab === 'activity' && (
                <div className="space-y-2">
                  <div className="p-2.5 rounded bg-cyber-card border border-cyber-border text-[11px] text-zinc-300">
                    &bull; Flag captured for active challenge (18m ago)
                  </div>
                  <div className="p-2.5 rounded bg-cyber-card border border-cyber-border text-[11px] text-zinc-300">
                    &bull; 4 Terminal Commands recorded via Local Agent (42m ago)
                  </div>
                  <div className="p-2.5 rounded bg-cyber-card border border-cyber-border text-[11px] text-zinc-300">
                    &bull; Compliance rule engine initialized (2d ago)
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* Create Competition Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 font-mono text-xs">
          <form onSubmit={handleCreateSubmit} className="bg-cyber-surface border border-cyber-border rounded-xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-cyber-border pb-3">
              <h3 className="text-sm font-bold text-cyber-text flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyber-primary" /> Create Competition Profile
              </h3>
              <button type="button" onClick={() => setCreateModalOpen(false)} className="text-cyber-muted hover:text-white">✕</button>
            </div>

            <div>
              <label className="text-cyber-muted block mb-1">COMPETITION NAME</label>
              <input
                type="text"
                required
                placeholder="e.g. DEF CON CTF 34 Quals"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-cyber-card border border-cyber-border rounded p-2 text-zinc-200 focus:outline-none focus:border-cyber-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-cyber-muted block mb-1">PLATFORM</label>
                <select
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value)}
                  className="w-full bg-cyber-card border border-cyber-border rounded p-2 text-zinc-200"
                >
                  <option value="CTFd">CTFd</option>
                  <option value="HackTheBox">HackTheBox</option>
                  <option value="picoCTF">picoCTF</option>
                  <option value="MetaCTF">MetaCTF</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="text-cyber-muted block mb-1">DEADLINE</label>
                <input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full bg-cyber-card border border-cyber-border rounded p-2 text-zinc-200"
                />
              </div>
            </div>

            <div>
              <label className="text-cyber-muted block mb-1">PORTAL URL</label>
              <input
                type="url"
                placeholder="https://ctf.defcon.org"
                value={newWebsite}
                onChange={(e) => setNewWebsite(e.target.value)}
                className="w-full bg-cyber-card border border-cyber-border rounded p-2 text-zinc-200"
              />
            </div>

            <div>
              <label className="text-cyber-muted block mb-1">REGULATION SUMMARY</label>
              <textarea
                rows={2}
                placeholder="Embargo rules, flag redactions, and screenshot policies..."
                value={newRulesSummary}
                onChange={(e) => setNewRulesSummary(e.target.value)}
                className="w-full bg-cyber-card border border-cyber-border rounded p-2 text-zinc-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-cyber-border">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-3 py-1.5 rounded bg-cyber-border text-cyber-muted hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-cyber-primary text-black font-semibold hover:bg-cyber-primary/90"
              >
                Save Competition
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
