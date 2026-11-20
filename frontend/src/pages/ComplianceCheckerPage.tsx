import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  FileText,
  Plus, 
  Trash2, 
  Upload, 
  Filter, 
  ToggleLeft, 
  ToggleRight,
  HelpCircle,
  Code
} from 'lucide-react';
import { api, Competition, Challenge, ComplianceAuditResult } from '../services/api';

export const ComplianceCheckerPage: React.FC = () => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<string>('');
  const [selectedChalId, setSelectedChalId] = useState<string>('');
  const [rules, setRules] = useState<any[]>([]);
  const [auditResult, setAuditResult] = useState<ComplianceAuditResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Custom Rule Modal
  const [customRuleOpen, setCustomRuleOpen] = useState(false);
  const [ruleTitle, setRuleTitle] = useState('');
  const [ruleCategory, setRuleCategory] = useState('custom');
  const [ruleSeverity, setRuleSeverity] = useState('mandatory');
  const [ruleDesc, setRuleDesc] = useState('');
  const [ruleParamType, setRuleParamType] = useState('forbidden_words');
  const [ruleParamValue, setRuleParamValue] = useState('');
  const [sourceRef, setSourceRef] = useState('');

  // Guidelines Import Modal
  const [importOpen, setImportOpen] = useState(false);
  const [guidelinesText, setGuidelinesText] = useState('');
  const [importing, setImporting] = useState(false);

  const loadData = async () => {
    const [comps, chals] = await Promise.all([
      api.getCompetitions(),
      api.getChallenges()
    ]);
    setCompetitions(comps);
    setChallenges(chals);
    if (comps.length > 0 && !selectedCompId) setSelectedCompId(comps[0].id);
    if (chals.length > 0 && !selectedChalId) setSelectedChalId(chals[0].id);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadRules = async () => {
    if (!selectedCompId) return;
    const r = await api.getRules(selectedCompId);
    setRules(r);
  };

  useEffect(() => {
    loadRules();
  }, [selectedCompId]);

  const runAudit = async () => {
    if (!selectedCompId || !selectedChalId) return;
    setLoading(true);
    try {
      const sampleText = `# Solution Walkthrough\n## 1. Challenge Overview\nTarget vulnerability analysis.\n## 2. Reconnaissance\nNetwork and interface enumeration.\n## 3. Vulnerability Identification\nProof of concept verified.\n## 4. Exploitation\nExploit payload executed.\n## 5. Flag Retrieval\nCTF{[FLAG_REDACTED]}\n## 6. Key Takeaways\nRemediation advice.\nAI Disclosure: Generated with CTF Writeup Studio.`;
      const res = await api.auditCompliance({
        competition_id: selectedCompId,
        challenge_id: selectedChalId,
        writeup_content: sampleText,
        author: '0xHacker'
      });
      setAuditResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleTitle.trim() || !selectedCompId) return;

    let paramObj: any = {};
    if (ruleParamType === 'forbidden_words') {
      paramObj.forbidden_words = ruleParamValue.split(',').map(s => s.trim()).filter(Boolean);
    } else if (ruleParamType === 'required_words') {
      paramObj.required_words = ruleParamValue.split(',').map(s => s.trim()).filter(Boolean);
    } else if (ruleParamType === 'min_words') {
      paramObj.min_words = parseInt(ruleParamValue, 10) || 150;
    } else if (ruleParamType === 'min_screenshots') {
      paramObj.min_screenshots = parseInt(ruleParamValue, 10) || 1;
    } else if (ruleParamType === 'protect_internal_ips') {
      paramObj.protect_internal_ips = true;
    } else if (ruleParamType === 'prohibited_tools') {
      paramObj.prohibited_tools = ruleParamValue.split(',').map(s => s.trim()).filter(Boolean);
    } else if (ruleParamType === 'custom_regex_require') {
      paramObj.custom_regex_require = ruleParamValue;
    }

    try {
      await api.addRule({
        competition_id: selectedCompId,
        category: ruleCategory,
        title: ruleTitle,
        description: ruleDesc || ruleTitle,
        severity: ruleSeverity,
        rule_parameter: paramObj,
        source_reference: sourceRef || 'User-defined rule'
      });
      setCustomRuleOpen(false);
      setRuleTitle('');
      setRuleDesc('');
      setRuleParamValue('');
      setSourceRef('');
      await loadRules();
      await runAudit();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await api.deleteRule(ruleId);
      setRules(rules.filter(r => r.id !== ruleId));
      await runAudit();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    try {
      const res = await api.toggleRuleActive(ruleId);
      setRules(rules.map(r => r.id === ruleId ? { ...r, is_active: res.is_active } : r));
      await runAudit();
    } catch (err) {
      console.error(err);
    }
  };

  const handleImportGuidelines = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guidelinesText.trim() || !selectedCompId) return;
    setImporting(true);
    try {
      await api.importGuidelinesText(selectedCompId, guidelinesText);
      setImportOpen(false);
      setGuidelinesText('');
      await loadRules();
      await runAudit();
    } catch (err) {
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-cyber-text flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyber-green" />
            Competition Rule Engine & Policy Compliance
          </h1>
          <p className="text-xs text-cyber-muted mt-1">
            Enforces 12 regulation categories and customizable user rules: flag embargos, screenshot mandates, IP protection, and tool limits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-cyber-card border border-cyber-border text-zinc-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition"
          >
            <Upload className="w-3.5 h-3.5 text-blue-400" /> Import Guidelines
          </button>
          <button
            onClick={() => setCustomRuleOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-cyber-green text-black font-semibold text-xs hover:bg-cyber-green/90 transition flex items-center gap-1.5 font-mono shadow"
          >
            <Plus className="w-4 h-4" /> Add Custom Rule
          </button>
          <button
            onClick={runAudit}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-lg bg-cyber-card border border-cyber-green/40 text-cyber-green hover:bg-cyber-card/80 transition flex items-center gap-1.5 text-xs font-mono"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Run Audit
          </button>
        </div>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-2 gap-4 bg-cyber-card border border-cyber-border rounded-xl p-4">
        <div>
          <label className="text-xs font-mono text-cyber-muted block mb-1">ACTIVE COMPETITION</label>
          <select
            value={selectedCompId}
            onChange={(e) => setSelectedCompId(e.target.value)}
            className="w-full bg-cyber-surface border border-cyber-border rounded p-2 text-xs font-mono text-zinc-200"
          >
            {competitions.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-mono text-cyber-muted block mb-1">VERIFICATION CHALLENGE</label>
          <select
            value={selectedChalId}
            onChange={(e) => setSelectedChalId(e.target.value)}
            className="w-full bg-cyber-surface border border-cyber-border rounded p-2 text-xs font-mono text-zinc-200"
          >
            {challenges.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Result Display */}
      {auditResult && (
        <div className="p-5 bg-cyber-card border border-cyber-border rounded-xl shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-cyber-border">
            <span className="text-xs font-bold text-zinc-200 font-mono">
              OVERALL COMPLIANCE STATUS:
            </span>
            <span className={`px-3 py-1 rounded text-xs font-bold font-mono uppercase ${
              auditResult.overall_status === 'Compliant'
                ? 'bg-cyber-green/20 text-cyber-green border border-cyber-green/40'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}>
              {auditResult.overall_status}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 bg-cyber-surface rounded border border-cyber-border">
              <span className="text-cyber-muted block text-[10px]">PASSED POLICIES</span>
              <span className="text-lg font-bold text-cyber-green">{auditResult.passed_rules.length}</span>
            </div>
            <div className="p-3 bg-cyber-surface rounded border border-cyber-border">
              <span className="text-cyber-muted block text-[10px]">POTENTIAL VIOLATIONS</span>
              <span className="text-lg font-bold text-amber-400">{auditResult.potential_violations.length}</span>
            </div>
            <div className="p-3 bg-cyber-surface rounded border border-cyber-border">
              <span className="text-cyber-muted block text-[10px]">MISSING INFO</span>
              <span className="text-lg font-bold text-cyber-danger">{auditResult.missing_information.length}</span>
            </div>
            <div className="p-3 bg-cyber-surface rounded border border-cyber-border">
              <span className="text-cyber-muted block text-[10px]">FAILED RULES</span>
              <span className="text-lg font-bold text-cyber-danger">{auditResult.failed_rules.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Rules list across all 12 categories + custom */}
      <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-cyber-border pb-3">
          <h3 className="text-xs font-bold font-mono text-zinc-200 uppercase flex items-center gap-2">
            Active Competition Rule Registry ({rules.length} Rules Configured)
          </h3>
          <span className="text-[11px] text-cyber-muted font-mono">
            Includes official and user-defined validation checks
          </span>
        </div>

        <div className="divide-y divide-cyber-border/40">
          {rules.map((r) => (
            <div key={r.id} className="py-3 flex items-start justify-between text-xs font-mono gap-4">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${r.is_active ? 'text-zinc-100' : 'text-zinc-500 line-through'}`}>
                    {r.title}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyber-surface border border-cyber-border text-cyber-muted uppercase">
                    {r.category}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded uppercase font-bold ${
                    r.severity === 'mandatory' ? 'text-cyber-danger bg-cyber-danger/10' :
                    r.severity === 'restricted' ? 'text-amber-400 bg-amber-400/10' :
                    r.severity === 'forbidden' ? 'text-red-500 bg-red-500/10' : 'text-blue-400 bg-blue-400/10'
                  }`}>
                    {r.severity}
                  </span>
                </div>
                <p className="text-cyber-muted text-[11px]">{r.description}</p>
                {r.source_reference && (
                  <p className="text-[10px] text-zinc-500 italic">Source: {r.source_reference}</p>
                )}
              </div>

              {/* Action buttons on each rule */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggleRule(r.id)}
                  className={`text-[11px] px-2.5 py-1 rounded border font-mono transition ${
                    r.is_active
                      ? 'bg-cyber-green/10 border-cyber-green/40 text-cyber-green'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                  }`}
                  title="Toggle Rule Active/Inactive"
                >
                  {r.is_active ? 'ENABLED' : 'DISABLED'}
                </button>

                <button
                  onClick={() => handleDeleteRule(r.id)}
                  className="p-1 rounded text-cyber-muted hover:text-cyber-danger hover:bg-cyber-danger/10 transition"
                  title="Delete Custom Rule"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Custom Rule Modal */}
      {customRuleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          <form onSubmit={handleCreateCustomRule} className="bg-cyber-surface border border-cyber-border rounded-xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-cyber-border pb-3">
              <h3 className="text-sm font-bold font-mono text-cyber-text flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyber-green" /> Add Custom Regulation Rule
              </h3>
              <button type="button" onClick={() => setCustomRuleOpen(false)} className="text-cyber-muted hover:text-white font-mono">✕</button>
            </div>

            <div>
              <label className="text-xs font-mono text-cyber-muted block mb-1">RULE TITLE</label>
              <input
                type="text"
                required
                placeholder="e.g. Prohibit Raw Password Disclosure"
                value={ruleTitle}
                onChange={(e) => setRuleTitle(e.target.value)}
                className="w-full bg-cyber-card border border-cyber-border rounded p-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-cyber-green"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono text-cyber-muted block mb-1">RULE CATEGORY</label>
                <select
                  value={ruleCategory}
                  onChange={(e) => setRuleCategory(e.target.value)}
                  className="w-full bg-cyber-card border border-cyber-border rounded p-2 text-xs font-mono text-zinc-200"
                >
                  <option value="custom">Custom Policy</option>
                  <option value="flag_disclosure">Flag Disclosure</option>
                  <option value="screenshot_requirement">Screenshot Mandate</option>
                  <option value="publication_permission">Publication Embargo</option>
                  <option value="source_code_disclosure">Source Code Limit</option>
                  <option value="ai_content_restriction">AI Content Disclosure</option>
                  <option value="confidentiality">Infrastructure Confidentiality</option>
                  <option value="tool_restriction">Tool Restrictions</option>
                  <option value="attribution_credit">Attribution & Author</option>
                  <option value="file_size_limit">Word & Size Limits</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-cyber-muted block mb-1">SEVERITY LEVEL</label>
                <select
                  value={ruleSeverity}
                  onChange={(e) => setRuleSeverity(e.target.value)}
                  className="w-full bg-cyber-card border border-cyber-border rounded p-2 text-xs font-mono text-zinc-200"
                >
                  <option value="mandatory">Mandatory (Disqualification)</option>
                  <option value="forbidden">Forbidden Action</option>
                  <option value="restricted">Restricted / Review</option>
                  <option value="advisory">Advisory Guideline</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-cyber-muted block mb-1">DESCRIPTION</label>
              <textarea
                rows={2}
                placeholder="Explain the reason and regulation policy..."
                value={ruleDesc}
                onChange={(e) => setRuleDesc(e.target.value)}
                className="w-full bg-cyber-card border border-cyber-border rounded p-2 text-xs font-mono text-zinc-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono text-cyber-muted block mb-1">CHECK CONDITION TYPE</label>
                <select
                  value={ruleParamType}
                  onChange={(e) => setRuleParamType(e.target.value)}
                  className="w-full bg-cyber-card border border-cyber-border rounded p-2 text-xs font-mono text-zinc-200"
                >
                  <option value="forbidden_words">Forbidden Keywords</option>
                  <option value="required_words">Mandatory Clauses/Words</option>
                  <option value="min_words">Minimum Word Count</option>
                  <option value="min_screenshots">Minimum Screenshots</option>
                  <option value="protect_internal_ips">Protect Internal IPs (RFC1918)</option>
                  <option value="prohibited_tools">Prohibited Tool Names</option>
                  <option value="custom_regex_require">Require Regex Pattern</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-cyber-muted block mb-1">PARAMETER VALUE</label>
                <input
                  type="text"
                  placeholder="e.g. private_key, password (comma-sep)"
                  value={ruleParamValue}
                  onChange={(e) => setRuleParamValue(e.target.value)}
                  className="w-full bg-cyber-card border border-cyber-border rounded p-2 text-xs font-mono text-zinc-200"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-cyber-muted block mb-1">SOURCE REFERENCE (OPTIONAL)</label>
              <input
                type="text"
                placeholder="e.g. Official Rulebook Section 3.2"
                value={sourceRef}
                onChange={(e) => setSourceRef(e.target.value)}
                className="w-full bg-cyber-card border border-cyber-border rounded p-2 text-xs font-mono text-zinc-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-cyber-border">
              <button
                type="button"
                onClick={() => setCustomRuleOpen(false)}
                className="px-3 py-1.5 rounded bg-cyber-border text-xs text-cyber-muted hover:text-white font-mono"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-cyber-green text-black font-semibold text-xs hover:bg-cyber-green/90 transition font-mono"
              >
                Save & Enforce Rule
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Import Guidelines Modal */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          <form onSubmit={handleImportGuidelines} className="bg-cyber-surface border border-cyber-border rounded-xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-cyber-border pb-3">
              <h3 className="text-sm font-bold font-mono text-cyber-text flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyber-green" /> Import Contest Guidelines & Rulebook
              </h3>
              <button type="button" onClick={() => setImportOpen(false)} className="text-cyber-muted hover:text-white font-mono">✕</button>
            </div>

            <p className="text-xs text-cyber-muted font-mono">
              Paste the official contest rules, terms of service, or Discord/bulletin announcements. The Rule Engine will automatically parse clauses into active regulation rules.
            </p>

            <textarea
              rows={8}
              required
              placeholder="Paste rulebook text here... (e.g. Rule 1: Flags must not be shared publicly...)"
              value={guidelinesText}
              onChange={(e) => setGuidelinesText(e.target.value)}
              className="w-full bg-cyber-card border border-cyber-border rounded p-3 text-xs font-mono text-zinc-200"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-cyber-border">
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="px-3 py-1.5 rounded bg-cyber-border text-xs text-cyber-muted hover:text-white font-mono"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={importing}
                className="px-4 py-1.5 rounded bg-cyber-green text-black font-semibold text-xs hover:bg-cyber-green/90 transition font-mono"
              >
                {importing ? 'Parsing...' : 'Extract & Enforce Rules'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
