import React, { useState, useEffect } from 'react';
import { 
  FolderLock, 
  Download, 
  RefreshCw, 
  Layers, 
  ShieldCheck, 
  Hash, 
  FileCode, 
  Image as ImageIcon, 
  Terminal, 
  Plus, 
  Search, 
  Check, 
  Copy, 
  SlidersHorizontal,
  ExternalLink,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { api, Challenge, EvidenceItem } from '../services/api';
import { EvidenceGallery } from '../components/EvidenceGallery';

interface EvidenceVaultPageProps {
  initialChallengeId?: string;
  onNavigateToWriteup?: (challengeId: string) => void;
}

export const EvidenceVaultPage: React.FC<EvidenceVaultPageProps> = ({ 
  initialChallengeId,
  onNavigateToWriteup 
}) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChalId, setSelectedChalId] = useState<string>(initialChallengeId || '');
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [manifestDownloaded, setManifestDownloaded] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const chals = await api.getChallenges();
      setChallenges(chals);
      const targetChal = selectedChalId || (chals.length > 0 ? chals[0].id : '');
      setSelectedChalId(targetChal);

      if (targetChal) {
        const items = await api.getEvidence(targetChal);
        setEvidenceItems(items);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedChalId]);

  const currentChallenge = challenges.find(c => c.id === selectedChalId);

  const handleDownloadManifest = async () => {
    if (!selectedChalId) return;
    try {
      const manifest = await api.getManifest(selectedChalId);
      const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evidence_manifest_${selectedChalId}.json`;
      a.click();
      setManifestDownloaded(true);
      setTimeout(() => setManifestDownloaded(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // Metrics
  const totalCount = evidenceItems.length;
  const verifiedCount = evidenceItems.filter(i => i.verified !== false).length;
  const categoriesCount = new Set(evidenceItems.map(i => i.category)).size;
  const totalBytes = evidenceItems.reduce((acc, i) => acc + (i.file_size || 1024), 0);
  const formattedStorage = (totalBytes / 1024).toFixed(1) + ' KB';

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Forensics Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyber-primary/10 border border-cyber-primary/20 text-cyber-primary">
              <FolderLock className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-cyber-text font-mono flex items-center gap-2">
                Evidence Vault — Digital Forensics & Proof
              </h1>
              <p className="text-xs text-cyber-muted mt-0.5">
                Cryptographic SHA-256 verification, duplicate artifact prevention, and audit-ready manifests.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedChalId}
            onChange={(e) => setSelectedChalId(e.target.value)}
            className="bg-cyber-card border border-cyber-border rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-cyber-primary"
          >
            {challenges.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
            ))}
          </select>

          <button
            onClick={handleDownloadManifest}
            className="px-3 py-1.5 rounded-lg bg-cyber-card border border-cyber-border hover:border-cyber-primary text-zinc-200 hover:text-white text-xs font-mono flex items-center gap-1.5 transition"
            title="Download JSON cryptographic evidence manifest"
          >
            {manifestDownloaded ? (
              <Check className="w-3.5 h-3.5 text-cyber-primary" />
            ) : (
              <Download className="w-3.5 h-3.5 text-cyber-primary" />
            )}
            <span>Export Manifest</span>
          </button>
        </div>
      </div>

      {/* Forensics Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyber-surface border border-cyber-border text-cyber-primary">
            <FolderLock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-cyber-muted uppercase tracking-wider block">Total Artifacts</span>
            <span className="text-lg font-mono font-bold text-cyber-text">{totalCount}</span>
          </div>
        </div>

        <div className="bg-cyber-card border border-cyber-border rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyber-surface border border-cyber-border text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-cyber-muted uppercase tracking-wider block">Integrity Status</span>
            <span className="text-lg font-mono font-bold text-emerald-400">
              {totalCount > 0 ? `${Math.round((verifiedCount / totalCount) * 100)}%` : '100%'}
            </span>
          </div>
        </div>

        <div className="bg-cyber-card border border-cyber-border rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyber-surface border border-cyber-border text-cyber-secondary">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-cyber-muted uppercase tracking-wider block">Categories Active</span>
            <span className="text-lg font-mono font-bold text-cyber-secondary">{categoriesCount} / 12</span>
          </div>
        </div>

        <div className="bg-cyber-card border border-cyber-border rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyber-surface border border-cyber-border text-amber-400">
            <Hash className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-cyber-muted uppercase tracking-wider block">Forensic Footprint</span>
            <span className="text-lg font-mono font-bold text-zinc-200">{formattedStorage}</span>
          </div>
        </div>
      </div>

      {/* Main Evidence Gallery & Inspection */}
      <EvidenceGallery
        evidenceItems={evidenceItems}
        challengeId={selectedChalId}
        competitionId={currentChallenge?.competition_id}
        onRefresh={loadData}
        onSelectForWriteup={(item) => {
          if (onNavigateToWriteup) {
            onNavigateToWriteup(selectedChalId);
          }
        }}
      />

    </div>
  );
};
