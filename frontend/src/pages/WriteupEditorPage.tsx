import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  Download, 
  Search, 
  Folder, 
  Hash, 
  ChevronRight, 
  ChevronDown, 
  Share2, 
  Network, 
  Tag, 
  Clock, 
  ExternalLink,
  Shield,
  Columns
} from 'lucide-react';
import { api, Challenge } from '../services/api';
import { WriteupEditor } from '../components/WriteupEditor';
import { AIExplainerPanel } from '../components/AIExplainerPanel';
import { RuleComplianceModal } from '../components/RuleComplianceModal';
import { ExportCenterModal } from '../components/ExportCenterModal';
import { AtuinHistoryModal } from '../components/AtuinHistoryModal';

interface WriteupEditorPageProps {
  initialChallengeId?: string;
}

export const WriteupEditorPage: React.FC<WriteupEditorPageProps> = ({ initialChallengeId }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChalId, setSelectedChalId] = useState<string>(initialChallengeId || '');
  const [markdown, setMarkdown] = useState<string>('');
  
  // Left Sidebar Vault Explorer state (Image 1 style)
  const [vaultSearch, setVaultSearch] = useState('');
  const [showLeftVault, setShowLeftVault] = useState(true);
  const [activeDocName, setActiveDocName] = useState('Writeup - JWT Key Confusion.md');

  // Modals
  const [complianceOpen, setComplianceOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showAIAssist, setShowAIAssist] = useState(false);

  const loadData = async () => {
    try {
      const chals = await api.getChallenges();
      setChallenges(chals);
      const targetChal = selectedChalId || (chals.length > 0 ? chals[0].id : '');
      setSelectedChalId(targetChal);

      if (targetChal) {
        try {
          const genRes = await api.generateWriteup({
            challenge_id: targetChal,
            style_mode: 'Technical',
            author: '0xHacker',
            redact_flag_token: false
          });
          if (genRes.result?.content_markdown) {
            setMarkdown(genRes.result.content_markdown);
          }
        } catch (err) {
          console.error(err);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedChalId]);

  const currentChallenge = challenges.find(c => c.id === selectedChalId);

  // Vault tags (matching Image 1 tags list: #design, #habitat, #critical, #flag, #verified)
  const vaultTags = [
    { name: 'pwn', color: '#ff5577' },
    { name: 'jwt-auth', color: '#38bdf8' },
    { name: 'verified', color: '#a3e635' },
    { name: 'flag-proof', color: '#f59e0b' },
    { name: 'cve-2026', color: '#c084fc' },
    { name: 'forensics', color: '#2dd4bf' }
  ];

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-cyber-bg overflow-hidden select-none">
      
      {/* Left Pane: Vault Explorer & Graph (Image 1 style left panel) */}
      {showLeftVault && (
        <div className="w-64 bg-cyber-sidebar border-r border-cyber-border flex flex-col justify-between shrink-0 overflow-hidden">
          
          <div className="flex flex-col h-full overflow-hidden">
            {/* Vault Header & Search */}
            <div className="p-3 border-b border-cyber-border space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-cyber-primary" />
                  CTF-WriteupVault
                </span>
                <span className="text-[10px] text-cyber-muted">3 writeups</span>
              </div>

              <div className="relative">
                <Search className="w-3 h-3 text-cyber-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search files, tags, notes..."
                  value={vaultSearch}
                  onChange={(e) => setVaultSearch(e.target.value)}
                  className="w-full bg-cyber-bg border border-cyber-border rounded px-2.5 pl-7 py-1 text-[11px] font-mono text-zinc-300 placeholder-cyber-muted focus:outline-none focus:border-cyber-primary"
                />
              </div>
            </div>

            {/* File Tree (Image 1 style file list: audio, embeds, images, etc.) */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 font-mono text-xs">
              <div className="space-y-1">
                <div className="text-[10px] text-cyber-muted uppercase tracking-wider px-1">Writeups & Drafts</div>
                
                {challenges.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedChalId(c.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded transition flex items-center justify-between text-[11px] ${
                      selectedChalId === c.id
                        ? 'bg-cyber-surface text-cyber-primary font-bold border border-cyber-primary/30'
                        : 'text-zinc-300 hover:bg-cyber-card hover:text-white'
                    }`}
                  >
                    <span className="truncate">{c.name}.md</span>
                    <span className="text-[9px] text-cyber-muted shrink-0">{c.category}</span>
                  </button>
                ))}
              </div>

              {/* Tags Section (matching Image 1 colorful tags cloud) */}
              <div className="pt-2 border-t border-cyber-border/70 space-y-2">
                <div className="flex items-center gap-1 text-[10px] text-cyber-muted uppercase tracking-wider px-1">
                  <Tag className="w-3 h-3 text-cyber-muted" />
                  Tags
                </div>
                <div className="flex flex-wrap gap-1 px-1">
                  {vaultTags.map((tag) => (
                    <span
                      key={tag.name}
                      style={{ color: tag.color, borderColor: `${tag.color}40`, backgroundColor: `${tag.color}15` }}
                      className="text-[10px] px-2 py-0.5 rounded border font-mono font-medium"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Interactive Knowledge Graph Miniature (matching Image 1 bottom-left node graph!) */}
              <div className="pt-2 border-t border-cyber-border/70 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-cyber-muted uppercase tracking-wider px-1">
                  <span className="flex items-center gap-1">
                    <Network className="w-3 h-3 text-cyber-secondary" />
                    Target Graph View
                  </span>
                  <span className="text-[9px] text-cyber-primary">5 nodes</span>
                </div>
                
                {/* SVG Graph visual */}
                <div className="h-28 bg-cyber-bg rounded-lg border border-cyber-border p-2 relative flex items-center justify-center overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 200 100">
                    <line x1="40" y1="50" x2="100" y2="30" stroke="#252D3A" strokeWidth="1.5" />
                    <line x1="100" y1="30" x2="160" y2="50" stroke="#252D3A" strokeWidth="1.5" />
                    <line x1="100" y1="30" x2="100" y2="80" stroke="#252D3A" strokeWidth="1.5" />
                    <line x1="40" y1="50" x2="100" y2="80" stroke="#252D3A" strokeWidth="1.5" />
                    
                    {/* Nodes */}
                    <circle cx="40" cy="50" r="8" fill="#38BDF8" className="animate-pulse" />
                    <circle cx="100" cy="30" r="10" fill="#A3E635" />
                    <circle cx="160" cy="50" r="8" fill="#F59E0B" />
                    <circle cx="100" cy="80" r="7" fill="#C084FC" />
                    
                    <text x="40" y="65" textAnchor="middle" fill="#94A3B8" fontSize="6" fontFamily="monospace">Recon</text>
                    <text x="100" y="24" textAnchor="middle" fill="#A3E635" fontSize="7" fontWeight="bold" fontFamily="monospace">Target</text>
                    <text x="160" y="65" textAnchor="middle" fill="#94A3B8" fontSize="6" fontFamily="monospace">Exploit</text>
                    <text x="100" y="93" textAnchor="middle" fill="#94A3B8" fontSize="6" fontFamily="monospace">Flag</text>
                  </svg>
                </div>
              </div>

            </div>

            {/* Vault Bottom Info */}
            <div className="p-3 border-t border-cyber-border bg-cyber-card/40 flex items-center justify-between text-[10px] font-mono text-cyber-muted">
              <span>Obsidian Link Synced</span>
              <span className="text-emerald-400 font-bold">&bull; Online</span>
            </div>
          </div>

        </div>
      )}

      {/* Main Center & Right Workstation */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top File Switcher & AI Assist Header */}
        <div className="h-10 bg-cyber-sidebar border-b border-cyber-border flex items-center justify-between px-4 shrink-0 font-mono text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLeftVault(!showLeftVault)}
              className="p-1 rounded hover:bg-cyber-card text-cyber-muted hover:text-white"
              title="Toggle Vault Sidebar"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-cyber-primary" />
              <span className="text-zinc-100 font-bold">
                {currentChallenge ? `${currentChallenge.name}.md` : 'writeup.md'}
              </span>
              <span className="text-[10px] text-cyber-muted">({selectedChalId})</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAIAssist(!showAIAssist)}
              className={`px-2.5 py-1 rounded border text-xs flex items-center gap-1.5 transition ${
                showAIAssist
                  ? 'bg-cyber-primary/10 border-cyber-primary/40 text-cyber-primary font-bold'
                  : 'bg-cyber-card border-cyber-border text-zinc-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyber-primary" />
              <span>AI Technical Explainer</span>
            </button>
          </div>
        </div>

        {/* Collapsible AI Explainer Panel */}
        {showAIAssist && (
          <div className="p-4 bg-cyber-card border-b border-cyber-border animate-fade-in shrink-0">
            <AIExplainerPanel
              challengeId={selectedChalId}
              onWriteupGenerated={(newMd) => setMarkdown(newMd)}
            />
          </div>
        )}

        {/* Interactive Dual-Pane Writeup Editor Component (Obsidian Style) */}
        <div className="flex-1 overflow-hidden">
          <WriteupEditor
            content={markdown}
            onChange={(newContent) => setMarkdown(newContent)}
            challengeId={selectedChalId}
            competitionId={currentChallenge?.competition_id || ''}
            onOpenCompliance={() => setComplianceOpen(true)}
            onOpenExport={() => setExportOpen(true)}
            onOpenHistory={() => setHistoryOpen(true)}
          />
        </div>

      </div>

      {/* Compliance Modal */}
      {complianceOpen && (
        <RuleComplianceModal
          content={markdown}
          challengeId={selectedChalId}
          competitionId={currentChallenge?.competition_id || ''}
          onClose={() => setComplianceOpen(false)}
        />
      )}

      {/* Export Modal */}
      {exportOpen && (
        <ExportCenterModal
          challengeId={selectedChalId}
          onClose={() => setExportOpen(false)}
        />
      )}

      {/* Atuin Command History Modal */}
      {historyOpen && (
        <AtuinHistoryModal
          challengeId={selectedChalId}
          onSelectCommand={(cmd) => {
            const block = `\n\`\`\`bash\n$ ${cmd}\n\`\`\`\n`;
            setMarkdown(prev => prev + block);
            setHistoryOpen(false);
          }}
          onClose={() => setHistoryOpen(false)}
        />
      )}

    </div>
  );
};
