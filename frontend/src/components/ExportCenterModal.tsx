import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  FileCode, 
  FolderArchive, 
  Eye, 
  Check, 
  ShieldCheck, 
  Lock, 
  X,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

interface ExportCenterModalProps {
  challengeId: string;
  onClose: () => void;
}

export const ExportCenterModal: React.FC<ExportCenterModalProps> = ({ challengeId, onClose }) => {
  const [redactFlag, setRedactFlag] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [packageResult, setPackageResult] = useState<any | null>(null);

  const handleGeneratePackage = async () => {
    setGenerating(true);
    try {
      const res = await api.createExportPackage({
        challenge_id: challengeId,
        export_formats: ['md', 'pdf', 'docx', 'html', 'zip'],
        redact_flag: redactFlag
      });
      setPackageResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
      <div className="bg-cyber-surface border border-cyber-border rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-cyber-border flex items-center justify-between bg-cyber-card">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-cyber-green/10 border border-cyber-green/30 flex items-center justify-center text-cyber-green">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-cyber-text">One-Click Writeup Export Center</h2>
              <p className="text-xs text-cyber-muted">Generate submission-ready documents and digital forensics ZIP evidence bundle</p>
            </div>
          </div>
          <button onClick={onClose} className="text-cyber-muted hover:text-white font-mono">✕</button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Format Cards */}
          <div>
            <label className="text-xs font-mono text-cyber-muted block mb-2 uppercase">Bundled Export Formats</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-cyber-card p-3 rounded-lg border border-cyber-border flex items-center gap-2.5">
                <FileCode className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="font-bold text-zinc-200">Markdown</div>
                  <div className="text-[10px] text-cyber-muted">README.md</div>
                </div>
              </div>
              <div className="bg-cyber-card p-3 rounded-lg border border-cyber-border flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-red-400" />
                <div>
                  <div className="font-bold text-zinc-200">PDF Report</div>
                  <div className="text-[10px] text-cyber-muted">ReportLab Engine</div>
                </div>
              </div>
              <div className="bg-cyber-card p-3 rounded-lg border border-cyber-border flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-blue-500" />
                <div>
                  <div className="font-bold text-zinc-200">Word DOCX</div>
                  <div className="text-[10px] text-cyber-muted">python-docx</div>
                </div>
              </div>
              <div className="bg-cyber-card p-3 rounded-lg border border-cyber-border flex items-center gap-2.5">
                <FolderArchive className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-bold text-zinc-200">Forensics ZIP</div>
                  <div className="text-[10px] text-cyber-muted">Full Evidence Pack</div>
                </div>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="bg-cyber-card border border-cyber-border rounded-lg p-4 space-y-3 text-xs font-mono">
            <span className="text-cyber-muted block text-[11px] uppercase">Export Controls & Compliance</span>
            <label className="flex items-center gap-2 text-zinc-200 cursor-pointer">
              <input
                type="checkbox"
                checked={redactFlag}
                onChange={(e) => setRedactFlag(e.target.checked)}
                className="rounded bg-cyber-surface border-cyber-border text-cyber-green focus:ring-0"
              />
              <span>Redact raw flag strings (replaces flag with [REDACTED_BY_COMPETITION_RULES])</span>
            </label>
            <div className="text-[11px] text-cyber-muted">
              Evidence package automatically includes <code className="text-cyber-green">evidence_manifest.json</code> (with SHA-256 hashes) and <code className="text-cyber-green">competition_metadata.json</code>.
            </div>
          </div>

          {/* Generate Button & Status */}
          {packageResult ? (
            <div className="p-4 bg-cyber-green/10 border border-cyber-green/30 rounded-lg space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-cyber-green font-bold">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4" /> Export Package Generated Successfully!
                </span>
                <span>{(packageResult.zip_size_bytes / 1024).toFixed(1)} KB</span>
              </div>
              <p className="text-zinc-300 text-[11px]">
                Created complete forensic archive with {packageResult.evidence_count} evidence files, HTML, PDF, DOCX, and manifests.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <a
                  href={`/api/v1/exports/download/${packageResult.zip_filename}`}
                  download={packageResult.zip_filename}
                  className="px-4 py-2 rounded bg-cyber-green text-black font-semibold hover:bg-cyber-green/90 transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download Complete ZIP Bundle
                </a>
                <a
                  href={`/api/v1/exports/preview/html/${challengeId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded bg-cyber-card border border-cyber-border text-zinc-200 hover:text-white transition flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" /> Open HTML Preview in New Tab
                </a>
              </div>
            </div>
          ) : (
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded bg-cyber-card border border-cyber-border text-xs text-cyber-muted hover:text-white font-mono"
              >
                Cancel
              </button>
              <button
                onClick={handleGeneratePackage}
                disabled={generating}
                className="px-5 py-2 rounded bg-cyber-green text-black font-bold text-xs hover:bg-cyber-green/90 transition font-mono flex items-center gap-2 shadow"
              >
                <Download className="w-4 h-4" />
                {generating ? 'Compiling Bundle & Evidence...' : 'Generate 1-Click Export Package'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
