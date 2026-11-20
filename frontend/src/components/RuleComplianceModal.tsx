import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  Shield, 
  RefreshCw, 
  Plus, 
  Trash2,
  X
} from 'lucide-react';
import { api, ComplianceAuditResult } from '../services/api';

interface RuleComplianceModalProps {
  competitionId: string;
  challengeId: string;
  writeupContent: string;
  author?: string;
  onClose: () => void;
}

export const RuleComplianceModal: React.FC<RuleComplianceModalProps> = ({
  competitionId,
  challengeId,
  writeupContent,
  author,
  onClose
}) => {
  const [result, setResult] = useState<ComplianceAuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);

  // New rule form states
  const [ruleTitle, setRuleTitle] = useState('');
  const [ruleCategory, setRuleCategory] = useState('custom');
  const [ruleSeverity, setRuleSeverity] = useState('mandatory');
  const [ruleDesc, setRuleDesc] = useState('');
  const [paramType, setParamType] = useState('forbidden_words');
  const [paramVal, setParamVal] = useState('');

  const runAudit = async () => {
    setLoading(true);
    try {
      const res = await api.auditCompliance({
        competition_id: competitionId,
        challenge_id: challengeId,
        writeup_content: writeupContent,
        author: author || 'Security Researcher'
      });
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAudit();
  }, [competitionId, challengeId]);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleTitle.trim()) return;

    let paramObj: any = {};
    if (paramType === 'forbidden_words') {
      paramObj.forbidden_words = paramVal.split(',').map(s => s.trim()).filter(Boolean);
    } else if (paramType === 'required_words') {
      paramObj.required_words = paramVal.split(',').map(s => s.trim()).filter(Boolean);
    } else if (paramType === 'min_words') {
      paramObj.min_words = parseInt(paramVal, 10) || 150;
    } else if (paramType === 'protect_internal_ips') {
      paramObj.protect_internal_ips = true;
    } else if (paramType === 'prohibited_tools') {
      paramObj.prohibited_tools = paramVal.split(',').map(s => s.trim()).filter(Boolean);
    }

    try {
      await api.addRule({
        competition_id: competitionId,
        category: ruleCategory,
        title: ruleTitle,
        description: ruleDesc || ruleTitle,
        severity: ruleSeverity,
        rule_parameter: paramObj
      });
      setShowAddCustom(false);
      setRuleTitle('');
      setRuleDesc('');
      setParamVal('');
      await runAudit();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Compliant':
        return (
          <span className="px-2.5 py-1 rounded bg-cyber-green/20 text-cyber-green border border-cyber-green/30 text-xs font-mono font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> COMPLIANT
          </span>
        );
      case 'Needs Review':
        return (
          <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> NEEDS REVIEW
          </span>
        );
      case 'Non-Compliant':
        return (
          <span className="px-2.5 py-1 rounded bg-cyber-danger/20 text-cyber-danger border border-cyber-danger/30 text-xs font-mono font-bold flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" /> NON-COMPLIANT
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded bg-zinc-700/40 text-zinc-300 border border-zinc-600 text-xs font-mono font-bold flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" /> RULES NOT VERIFIED
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
      <div className="bg-cyber-surface border border-cyber-border rounded-xl w-full max-w-4xl h-[82vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-cyber-border flex items-center justify-between bg-cyber-card">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-cyber-green/10 border border-cyber-green/30 flex items-center justify-center text-cyber-green">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-cyber-text flex items-center gap-2">
                Competition Rule Engine & Compliance Audit
                {result && getStatusBadge(result.overall_status)}
              </h2>
              <p className="text-xs text-cyber-muted">Evaluated against 12 regulation categories and user-defined rules</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddCustom(!showAddCustom)}
              className="px-2.5 py-1 rounded-lg bg-cyber-green text-black font-semibold hover:bg-cyber-green/90 transition flex items-center gap-1 text-xs font-mono"
            >
              <Plus className="w-3.5 h-3.5" /> {showAddCustom ? 'View Audit' : 'Add Rule'}
            </button>
            <button
              onClick={runAudit}
              disabled={loading}
              className="p-1.5 rounded-lg text-cyber-muted hover:text-white hover:bg-cyber-border transition flex items-center gap-1 text-xs font-mono"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Re-verify
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-cyber-muted hover:text-white hover:bg-cyber-border transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {showAddCustom ? (
            /* Add Custom Rule Form */
            <form onSubmit={handleAddRule} className="bg-cyber-card border border-cyber-border rounded-xl p-5 space-y-4 font-mono text-xs">
              <h3 className="text-sm font-bold text-cyber-green flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Custom Regulation Rule
              </h3>
              <div>
                <label className="text-cyber-muted block mb-1">RULE TITLE</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Forbidden Credentials / Custom Embargo"
                  value={ruleTitle}
                  onChange={(e) => setRuleTitle(e.target.value)}
                  className="w-full bg-cyber-surface border border-cyber-border rounded p-2 text-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-cyber-muted block mb-1">CATEGORY</label>
                  <select
                    value={ruleCategory}
                    onChange={(e) => setRuleCategory(e.target.value)}
                    className="w-full bg-cyber-surface border border-cyber-border rounded p-2 text-zinc-200"
                  >
                    <option value="custom">Custom Policy</option>
                    <option value="flag_disclosure">Flag Disclosure</option>
                    <option value="screenshot_requirement">Screenshot Mandate</option>
                    <option value="confidentiality">Infrastructure Confidentiality</option>
                    <option value="tool_restriction">Tool Restrictions</option>
                    <option value="file_size_limit">Word & Size Limits</option>
                  </select>
                </div>
                <div>
                  <label className="text-cyber-muted block mb-1">SEVERITY</label>
                  <select
                    value={ruleSeverity}
                    onChange={(e) => setRuleSeverity(e.target.value)}
                    className="w-full bg-cyber-surface border border-cyber-border rounded p-2 text-zinc-200"
                  >
                    <option value="mandatory">Mandatory</option>
                    <option value="forbidden">Forbidden</option>
                    <option value="restricted">Restricted</option>
                    <option value="advisory">Advisory</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-cyber-muted block mb-1">CONDITION TYPE</label>
                  <select
                    value={paramType}
                    onChange={(e) => setParamType(e.target.value)}
                    className="w-full bg-cyber-surface border border-cyber-border rounded p-2 text-zinc-200"
                  >
                    <option value="forbidden_words">Forbidden Keywords</option>
                    <option value="required_words">Mandatory Keywords/Clauses</option>
                    <option value="min_words">Minimum Word Count</option>
                    <option value="protect_internal_ips">Protect Internal IPs (RFC1918)</option>
                    <option value="prohibited_tools">Prohibited Tool Names</option>
                  </select>
                </div>
                <div>
                  <label className="text-cyber-muted block mb-1">PARAMETER VALUES</label>
                  <input
                    type="text"
                    placeholder="e.g. password, secret (comma-separated)"
                    value={paramVal}
                    onChange={(e) => setParamVal(e.target.value)}
                    className="w-full bg-cyber-surface border border-cyber-border rounded p-2 text-zinc-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-cyber-muted block mb-1">DESCRIPTION</label>
                <textarea
                  rows={2}
                  placeholder="Explain why this rule is enforced..."
                  value={ruleDesc}
                  onChange={(e) => setRuleDesc(e.target.value)}
                  className="w-full bg-cyber-surface border border-cyber-border rounded p-2 text-zinc-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustom(false)}
                  className="px-3 py-1.5 rounded bg-cyber-border text-cyber-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-cyber-green text-black font-semibold hover:bg-cyber-green/90"
                >
                  Save & Enforce Rule
                </button>
              </div>
            </form>
          ) : loading ? (
            <div className="p-12 text-center text-xs text-cyber-muted font-mono">Running compliance checks...</div>
          ) : result ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-3 text-xs font-mono">
                <div className="bg-cyber-card p-3 rounded-lg border border-cyber-border">
                  <span className="text-cyber-muted block text-[10px]">PASSED RULES</span>
                  <span className="text-lg font-bold text-cyber-green">{result.passed_rules.length}</span>
                </div>
                <div className="bg-cyber-card p-3 rounded-lg border border-cyber-border">
                  <span className="text-cyber-muted block text-[10px]">POTENTIAL VIOLATIONS</span>
                  <span className="text-lg font-bold text-amber-400">{result.potential_violations.length}</span>
                </div>
                <div className="bg-cyber-card p-3 rounded-lg border border-cyber-border">
                  <span className="text-cyber-muted block text-[10px]">MISSING REQUIREMENTS</span>
                  <span className="text-lg font-bold text-cyber-danger">{result.missing_information.length}</span>
                </div>
                <div className="bg-cyber-card p-3 rounded-lg border border-cyber-border">
                  <span className="text-cyber-muted block text-[10px]">FAILED POLICIES</span>
                  <span className="text-lg font-bold text-cyber-danger">{result.failed_rules.length}</span>
                </div>
              </div>

              {/* Actionable Remedies */}
              {result.recommended_corrections.length > 0 && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <h4 className="text-xs font-bold text-amber-300 font-mono mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Recommended Compliance Corrections
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-xs font-mono text-zinc-300">
                    {result.recommended_corrections.map((corr, i) => (
                      <li key={i}>{corr}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Failed Rules */}
              {result.failed_rules.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-cyber-danger font-mono uppercase">Failed Requirements</h4>
                  {result.failed_rules.map((f, i) => (
                    <div key={i} className="p-3 bg-cyber-card border border-cyber-danger/40 rounded-lg text-xs font-mono space-y-1">
                      <div className="font-semibold text-zinc-200">{f.rule_title}</div>
                      <p className="text-cyber-danger text-[11px]">{f.issue}</p>
                      <p className="text-cyber-muted text-[10px]">Remedy: {f.remedy}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Potential Violations */}
              {result.potential_violations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-amber-400 font-mono uppercase">Potential Disclosures & Timing Constraints</h4>
                  {result.potential_violations.map((v, i) => (
                    <div key={i} className="p-3 bg-cyber-card border border-amber-400/40 rounded-lg text-xs font-mono space-y-1">
                      <div className="font-semibold text-zinc-200">{v.rule_title}</div>
                      <p className="text-amber-300 text-[11px]">{v.issue}</p>
                      <p className="text-cyber-muted text-[10px]">Remedy: {v.remedy}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Missing Info */}
              {result.missing_information.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-zinc-300 font-mono uppercase">Missing Information</h4>
                  {result.missing_information.map((m, i) => (
                    <div key={i} className="p-3 bg-cyber-card border border-cyber-border rounded-lg text-xs font-mono space-y-1">
                      <div className="font-semibold text-zinc-200">{m.rule_title}</div>
                      <p className="text-zinc-400 text-[11px]">{m.issue}</p>
                      <p className="text-cyber-muted text-[10px]">Remedy: {m.remedy}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Passed Rules */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-cyber-green font-mono uppercase">Compliant Policies ({result.passed_rules.length})</h4>
                <div className="grid grid-cols-2 gap-2">
                  {result.passed_rules.map((p, i) => (
                    <div key={i} className="p-2.5 bg-cyber-card/60 border border-cyber-border rounded text-xs font-mono flex items-center gap-2 text-zinc-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyber-green shrink-0" />
                      <span className="truncate">{p.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
