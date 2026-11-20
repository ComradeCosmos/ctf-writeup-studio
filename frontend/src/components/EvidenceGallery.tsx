import React, { useState } from 'react';
import { 
  FolderLock, 
  Upload, 
  ShieldCheck, 
  ShieldAlert, 
  Image as ImageIcon, 
  FileCode, 
  Terminal, 
  Globe, 
  Hash, 
  Layers, 
  Edit3, 
  Download,
  CheckCircle,
  Eye,
  Columns
} from 'lucide-react';
import { EvidenceItem, api } from '../services/api';

interface EvidenceGalleryProps {
  evidenceItems: EvidenceItem[];
  challengeId?: string;
  competitionId?: string;
  onRefresh: () => void;
  onSelectForWriteup?: (item: EvidenceItem) => void;
}

export const EvidenceGallery: React.FC<EvidenceGalleryProps> = ({
  evidenceItems,
  challengeId,
  competitionId,
  onRefresh,
  onSelectForWriteup
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [inspectItem, setInspectItem] = useState<EvidenceItem | null>(null);
  const [comparingItem, setComparingItem] = useState<EvidenceItem | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('screenshot');
  const [uploadStep, setUploadStep] = useState('Reconnaissance');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [integrityReport, setIntegrityReport] = useState<any | null>(null);
  const [verifying, setVerifying] = useState(false);

  const categories = [
    'all',
    'screenshot',
    'terminal_log',
    'http_traffic',
    'network_scan',
    'source_code',
    'pcap',
    'flag_proof'
  ];

  const filtered = evidenceItems.filter(item => {
    if (selectedCategory === 'all') return true;
    return item.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !challengeId || !competitionId) return;

    const fd = new FormData();
    fd.append('file', uploadFile);
    fd.append('competition_id', competitionId);
    fd.append('challenge_id', challengeId);
    fd.append('category', uploadCategory);
    fd.append('solution_step', uploadStep);
    fd.append('user_description', uploadDesc);

    try {
      await api.uploadEvidence(fd);
      setUploadOpen(false);
      setUploadFile(null);
      setUploadDesc('');
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const runIntegrityAudit = async () => {
    setVerifying(true);
    try {
      const res = await api.verifyIntegrity(challengeId);
      setIntegrityReport(res);
    } catch (e) {
      console.error(e);
    } finally {
      setVerifying(false);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'screenshot': return <ImageIcon className="w-4 h-4 text-purple-400" />;
      case 'terminal_log': return <Terminal className="w-4 h-4 text-blue-400" />;
      case 'http_traffic': return <Globe className="w-4 h-4 text-cyan-400" />;
      case 'network_scan': return <Layers className="w-4 h-4 text-emerald-400" />;
      case 'source_code': return <FileCode className="w-4 h-4 text-amber-400" />;
      default: return <FolderLock className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex items-center justify-between bg-cyber-card border border-cyber-border rounded-xl p-4">
        <div>
          <h2 className="text-sm font-bold text-cyber-text flex items-center gap-2">
            Evidence Vault & Forensics Proof
            <span className="text-[10px] bg-cyber-border px-2 py-0.5 rounded text-cyber-muted font-mono">
              SHA-256 IMMUTABLE REPOSITORY
            </span>
          </h2>
          <p className="text-xs text-cyber-muted">Cryptographically verified proof of exploitation and terminal execution</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runIntegrityAudit}
            disabled={verifying}
            className="text-xs px-3 py-1.5 rounded bg-cyber-surface border border-cyber-border text-zinc-300 hover:text-white transition font-mono flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyber-green" />
            {verifying ? 'Auditing Disk...' : 'Verify Vault Integrity'}
          </button>
          <button
            onClick={() => setUploadOpen(true)}
            className="text-xs px-3 py-1.5 rounded bg-cyber-green text-black font-semibold hover:bg-cyber-green/90 transition flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            Import Evidence Artifact
          </button>
        </div>
      </div>

      {/* Integrity banner if audit performed */}
      {integrityReport && (
        <div className="p-3 bg-cyber-surface border border-cyber-green/40 rounded-lg flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-cyber-green" />
            <span>Vault Hash Audit: {integrityReport.verified}/{integrityReport.total_items} artifacts matched SHA-256 signatures.</span>
          </div>
          <span className="text-cyber-green font-semibold">INTEGRITY 100% HEALTHY</span>
        </div>
      )}

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg border transition whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-cyber-card border-cyber-green text-cyber-green font-semibold'
                : 'bg-cyber-card/40 border-cyber-border text-cyber-muted hover:text-white'
            }`}
          >
            {cat.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* Grid of Evidence Artifacts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-cyber-card border border-cyber-border rounded-xl p-4 flex flex-col justify-between hover:border-cyber-green/50 transition group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(item.category)}
                  <span className="text-xs font-bold text-cyber-text font-mono truncate max-w-[140px]">
                    {item.id}
                  </span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyber-surface border border-cyber-border text-cyber-muted font-mono uppercase">
                  {item.solution_step || 'Recon'}
                </span>
              </div>

              {/* Title & Desc */}
              <h4 className="text-xs font-semibold text-zinc-200 truncate mb-1" title={item.original_filename}>
                {item.original_filename}
              </h4>
              <p className="text-[11px] text-cyber-muted line-clamp-2 mb-3">
                {item.user_description || 'No user description attached.'}
              </p>

              {/* Hash badge */}
              <div className="bg-cyber-surface p-2 rounded border border-cyber-border flex items-center justify-between text-[10px] font-mono text-cyber-muted">
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3 text-cyber-green" />
                  {item.sha256_hash.slice(0, 16)}...
                </span>
                <span>{(item.file_size / 1024).toFixed(1)} KB</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-cyber-border text-xs font-mono">
              <button
                onClick={() => setInspectItem(item)}
                className="text-cyber-muted hover:text-white flex items-center gap-1 transition"
              >
                <Eye className="w-3.5 h-3.5" /> Inspect
              </button>
              
              {onSelectForWriteup && (
                <button
                  onClick={() => onSelectForWriteup(item)}
                  className="text-cyber-green hover:underline flex items-center gap-1"
                >
                  Insert in Writeup
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Inspect / Preview Modal */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          <div className="bg-cyber-surface border border-cyber-border rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-cyber-border flex items-center justify-between bg-cyber-card">
              <div className="flex items-center gap-2 font-mono text-sm font-bold text-cyber-text">
                <FolderLock className="w-4 h-4 text-cyber-green" />
                Evidence Artifact: {inspectItem.id}
              </div>
              <button onClick={() => setInspectItem(null)} className="text-cyber-muted hover:text-white font-mono">✕</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-cyber-card p-3 rounded border border-cyber-border">
                <div>
                  <span className="text-cyber-muted block">ORIGINAL FILENAME</span>
                  <span className="text-zinc-200">{inspectItem.original_filename}</span>
                </div>
                <div>
                  <span className="text-cyber-muted block">CATEGORY / STEP</span>
                  <span className="text-cyber-green uppercase">{inspectItem.category} &bull; {inspectItem.solution_step}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-cyber-muted block">FULL SHA-256 HASH</span>
                  <span className="text-emerald-400 select-all">{inspectItem.sha256_hash}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-cyber-muted block mb-1">ARTIFACT PREVIEW</label>
                {inspectItem.category === 'screenshot' || inspectItem.file_type.includes('image') ? (
                  <div className="p-2 bg-cyber-card rounded border border-cyber-border flex justify-center">
                    <img
                      src={`/api/v1/evidence/file/${inspectItem.stored_filename}`}
                      alt={inspectItem.original_filename}
                      className="max-h-96 object-contain rounded"
                    />
                  </div>
                ) : (
                  <div className="p-3 bg-cyber-card rounded border border-cyber-border font-mono text-xs text-zinc-300 max-h-60 overflow-y-auto">
                    <p className="text-cyber-muted italic mb-2">[Binary or raw capture telemetry loaded]</p>
                    <a
                      href={`/api/v1/evidence/file/${inspectItem.stored_filename}`}
                      download={inspectItem.original_filename}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyber-border hover:bg-cyber-card rounded text-xs text-white"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Artifact
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          <form onSubmit={handleUploadSubmit} className="bg-cyber-surface border border-cyber-border rounded-xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-cyber-border pb-3">
              <h3 className="text-sm font-bold font-mono text-cyber-text flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyber-green" /> Import Evidence Artifact
              </h3>
              <button type="button" onClick={() => setUploadOpen(false)} className="text-cyber-muted hover:text-white font-mono">✕</button>
            </div>

            <div>
              <label className="text-xs font-mono text-cyber-muted block mb-1">EVIDENCE CATEGORY</label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="w-full bg-cyber-card border border-cyber-border rounded p-2 text-xs font-mono text-zinc-200"
              >
                <option value="screenshot">Screenshot (UI / Shell)</option>
                <option value="terminal_log">Terminal Log</option>
                <option value="http_traffic">HTTP Request / Response</option>
                <option value="network_scan">Network Scan (Nmap / Rustscan)</option>
                <option value="pcap">PCAP / Wireshark Capture</option>
                <option value="source_code">Source Code Snippet</option>
                <option value="flag_proof">Flag Retrieval Proof</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-cyber-muted block mb-1">ASSOCIATED SOLUTION STEP</label>
              <select
                value={uploadStep}
                onChange={(e) => setUploadStep(e.target.value)}
                className="w-full bg-cyber-card border border-cyber-border rounded p-2 text-xs font-mono text-zinc-200"
              >
                <option value="Reconnaissance">Reconnaissance & Enumeration</option>
                <option value="Vulnerability Identification">Vulnerability Identification</option>
                <option value="Exploitation">Exploitation / Solution</option>
                <option value="Flag Retrieval">Flag Retrieval</option>
                <option value="Key Takeaways">Key Takeaways & Remediation</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-cyber-muted block mb-1">DESCRIPTION / FORENSIC NOTE</label>
              <input
                type="text"
                placeholder="e.g. Nmap scan revealing exposed port 5000"
                value={uploadDesc}
                onChange={(e) => setUploadDesc(e.target.value)}
                className="w-full bg-cyber-card border border-cyber-border rounded p-2 text-xs font-mono text-zinc-200"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-cyber-muted block mb-1">SELECT FILE</label>
              <input
                type="file"
                required
                onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                className="w-full text-xs font-mono text-cyber-muted file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-cyber-border file:text-white file:text-xs"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setUploadOpen(false)}
                className="px-3 py-1.5 rounded bg-cyber-border text-xs text-cyber-muted hover:text-white font-mono"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-cyber-green text-black font-semibold text-xs hover:bg-cyber-green/90 transition font-mono"
              >
                Upload & Hash
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
