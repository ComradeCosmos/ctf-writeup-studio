import React, { useState, useEffect } from 'react';
import { Download, FileText, FileCode, FolderArchive, Eye, Check, ShieldCheck } from 'lucide-react';
import { api, Challenge } from '../services/api';

export const ExportCenterPage: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChalId, setSelectedChalId] = useState<string>('');
  const [redactFlag, setRedactFlag] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [packageResult, setPackageResult] = useState<any | null>(null);

  const load = async () => {
    const chals = await api.getChallenges();
    setChallenges(chals);
    if (chals.length > 0) setSelectedChalId(chals[0].id);
  };

  useEffect(() => {
    load();
  }, []);

  const handleGenerate = async () => {
    if (!selectedChalId) return;
    setGenerating(true);
    try {
      const res = await api.createExportPackage({
        challenge_id: selectedChalId,
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
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-cyber-text flex items-center gap-2">
            <Download className="w-5 h-5 text-cyber-green" />
            Writeup Export Center & Submission Bundler
          </h1>
          <p className="text-xs text-cyber-muted mt-1">
            Produce submission-ready Markdown, PDF, DOCX, HTML, and Forensics Evidence ZIP bundles.
          </p>
        </div>

        <select
          value={selectedChalId}
          onChange={(e) => setSelectedChalId(e.target.value)}
          className="bg-cyber-card border border-cyber-border rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-cyber-green"
        >
          {challenges.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
          ))}
        </select>
      </div>

      <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 shadow-lg space-y-6">
        <div>
          <h3 className="text-xs font-bold font-mono text-zinc-200 uppercase mb-3">Structured Forensics Package Specification</h3>
          <pre className="p-4 bg-cyber-bg rounded-lg border border-cyber-border text-xs font-mono text-emerald-400 overflow-x-auto">
{`CTF_Writeup/
├── README.md                 (Markdown documentation)
├── writeup.pdf               (ReportLab formatted PDF)
├── writeup.docx              (Microsoft Word report)
├── writeup.html              (Cybersecurity styled HTML)
├── evidence/
│   ├── screenshots/          (Original & annotated images)
│   ├── terminal_logs/        (Raw & redacted command logs)
│   ├── network_captures/     (PCAP and scan outputs)
│   ├── source_code/          (Exploit drivers & snippets)
│   └── other_artifacts/
├── manifest/
│   └── evidence_manifest.json (Cryptographic SHA-256 signatures)
└── metadata/
    └── competition_metadata.json (Contest regulations & authors)`}
          </pre>
        </div>

        <div className="bg-cyber-surface border border-cyber-border rounded-lg p-4 space-y-3 text-xs font-mono">
          <label className="flex items-center gap-2 text-zinc-200 cursor-pointer">
            <input
              type="checkbox"
              checked={redactFlag}
              onChange={(e) => setRedactFlag(e.target.checked)}
              className="rounded bg-cyber-card border-cyber-border text-cyber-green focus:ring-0"
            />
            <span>Redact CTF flag in exported reports (Strict Competition Compliance Mode)</span>
          </label>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={generating || !selectedChalId}
            className="px-6 py-2.5 rounded-lg bg-cyber-green text-black font-bold text-xs hover:bg-cyber-green/90 transition font-mono flex items-center gap-2 shadow"
          >
            <Download className="w-4 h-4" />
            {generating ? 'Compiling Multi-Format Bundle...' : 'Build Complete Submission Package'}
          </button>
        </div>

        {packageResult && (
          <div className="p-4 bg-cyber-green/10 border border-cyber-green/30 rounded-lg space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-cyber-green font-bold">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" /> Forensics Evidence Package Ready!
              </span>
              <span>{(packageResult.zip_size_bytes / 1024).toFixed(1)} KB</span>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <a
                href={`/api/v1/exports/download/${packageResult.zip_filename}`}
                download={packageResult.zip_filename}
                className="px-4 py-2 rounded bg-cyber-green text-black font-semibold hover:bg-cyber-green/90 transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download ZIP Package
              </a>
              <a
                href={`/api/v1/exports/preview/html/${selectedChalId}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded bg-cyber-card border border-cyber-border text-zinc-200 hover:text-white transition flex items-center gap-2"
              >
                <Eye className="w-4 h-4" /> View HTML Preview
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
