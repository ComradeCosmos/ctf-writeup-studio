const API_BASE = '/api/v1';

export interface Competition {
  id: string;
  name: string;
  website?: string;
  start_date?: string;
  end_date?: string;
  submission_deadline?: string;
  status: string;
  rules_summary?: string;
  official_rules_url?: string;
  created_at: string;
}

export interface Challenge {
  id: string;
  competition_id: string;
  name: string;
  category: string;
  difficulty: string;
  points: number;
  description?: string;
  author?: string;
  flag?: string;
  tools_used: string[];
  vulnerabilities: string[];
  solution_status: string;
  evidence_status: string;
  writeup_status: string;
  created_at: string;
}

export interface TerminalCommand {
  id: string;
  command: string;
  exit_code: number;
  duration_ms: number;
  timestamp: string;
  cwd?: string;
  shell: string;
  is_sensitive: boolean;
  is_evidence: boolean;
  user_note?: string;
  stdout_preview?: string;
}

export interface TimelineEvent {
  id: string;
  session_id: string;
  challenge_id: string;
  event_type: string;
  title: string;
  description?: string;
  timestamp: string;
  evidence_id?: string;
  suggested_step?: string;
}

export interface EvidenceItem {
  id: string;
  competition_id: string;
  challenge_id: string;
  session_id?: string;
  category: string;
  original_filename: string;
  stored_filename: string;
  file_type: string;
  file_size: number;
  sha256_hash: string;
  source: string;
  solution_step?: string;
  user_description?: string;
  verification_status: string;
  is_annotated: boolean;
  parent_evidence_id?: string;
  collection_timestamp: string;
}

export interface DashboardStats {
  total_competitions: number;
  total_challenges: number;
  completed_writeups: number;
  pending_writeups: number;
  total_evidence: number;
  compliance_warnings: number;
  upcoming_deadlines: Array<{
    competition_id: string;
    name: string;
    deadline: string;
    days_left: number;
  }>;
  recent_activity: Array<{
    id: string;
    challenge_id: string;
    event_type: string;
    title: string;
    timestamp: string;
    suggested_step?: string;
  }>;
}

export interface ComplianceAuditResult {
  id: string;
  overall_status: 'Compliant' | 'Needs Review' | 'Non-Compliant' | 'Rules Not Verified';
  passed_rules: Array<{ rule_id: string; title: string }>;
  failed_rules: Array<{ rule_id: string; rule_title: string; issue: string; remedy: string }>;
  potential_violations: Array<{ rule_id: string; rule_title: string; issue: string; remedy: string }>;
  missing_information: Array<{ rule_id: string; rule_title: string; issue: string; remedy: string }>;
  restricted_content: string[];
  recommended_corrections: string[];
}

export const api = {
  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    return res.json();
  },

  // Competitions
  getCompetitions: async (): Promise<Competition[]> => {
    const res = await fetch(`${API_BASE}/competitions/`);
    return res.json();
  },
  createCompetition: async (data: Partial<Competition>): Promise<Competition> => {
    const res = await fetch(`${API_BASE}/competitions/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteCompetition: async (id: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/competitions/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Challenges
  getChallenges: async (compId?: string): Promise<Challenge[]> => {
    const url = compId ? `${API_BASE}/challenges/?competition_id=${compId}` : `${API_BASE}/challenges/`;
    const res = await fetch(url);
    return res.json();
  },
  getChallenge: async (id: string): Promise<Challenge> => {
    const res = await fetch(`${API_BASE}/challenges/${id}`);
    return res.json();
  },
  createChallenge: async (data: any): Promise<Challenge> => {
    const res = await fetch(`${API_BASE}/challenges/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteChallenge: async (id: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/challenges/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Sessions & Atuin History
  getSessions: async (challengeId?: string) => {
    const url = challengeId ? `${API_BASE}/sessions/?challenge_id=${challengeId}` : `${API_BASE}/sessions/`;
    const res = await fetch(url);
    return res.json();
  },
  getEnvironments: async (refresh: boolean = false) => {
    const res = await fetch(`${API_BASE}/sessions/environments?refresh=${refresh}`);
    return res.json();
  },
  runLocalCommand: async (data: {
    session_id: string;
    challenge_id: string;
    command: string;
    shell_type?: string;
    cwd?: string;
    timeout_seconds?: number;
    auto_save_evidence?: boolean;
    user_note?: string;
  }) => {
    const res = await fetch(`${API_BASE}/sessions/run-local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  saveCommandAsEvidence: async (cmdId: string) => {
    const res = await fetch(`${API_BASE}/sessions/commands/${cmdId}/save-as-evidence`, {
      method: 'POST'
    });
    return res.json();
  },
  startSession: async (data: any) => {
    const res = await fetch(`${API_BASE}/sessions/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  changeSessionStatus: async (sessionId: string, status: string) => {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  },
  recordCommand: async (data: any) => {
    const res = await fetch(`${API_BASE}/sessions/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  searchAtuinHistory: async (params: { q?: string; challenge_id?: string; cwd?: string; only_successful?: boolean }) => {
    const qParams = new URLSearchParams();
    if (params.q) qParams.append('q', params.q);
    if (params.challenge_id) qParams.append('challenge_id', params.challenge_id);
    if (params.cwd) qParams.append('cwd', params.cwd);
    if (params.only_successful !== undefined) qParams.append('only_successful', String(params.only_successful));
    const res = await fetch(`${API_BASE}/sessions/atuin-history?${qParams.toString()}`);
    return res.json();
  },
  getCommandFrequency: async (challengeId?: string) => {
    const url = challengeId ? `${API_BASE}/sessions/command-stats?challenge_id=${challengeId}` : `${API_BASE}/sessions/command-stats`;
    const res = await fetch(url);
    return res.json();
  },
  getTimeline: async (challengeId: string): Promise<TimelineEvent[]> => {
    const res = await fetch(`${API_BASE}/sessions/timeline/${challengeId}`);
    return res.json();
  },
  toggleCommandEvidence: async (cmdId: string) => {
    const res = await fetch(`${API_BASE}/sessions/commands/${cmdId}/evidence-toggle`, { method: 'PATCH' });
    return res.json();
  },
  updateCommandNote: async (cmdId: string, note: string) => {
    const res = await fetch(`${API_BASE}/sessions/commands/${cmdId}/note`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_note: note })
    });
    return res.json();
  },

  // Evidence Vault
  getEvidence: async (challengeId?: string, category?: string): Promise<EvidenceItem[]> => {
    const params = new URLSearchParams();
    if (challengeId) params.append('challenge_id', challengeId);
    if (category) params.append('category', category);
    const res = await fetch(`${API_BASE}/evidence/?${params.toString()}`);
    return res.json();
  },
  uploadEvidence: async (formData: FormData) => {
    const res = await fetch(`${API_BASE}/evidence/upload`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },
  verifyIntegrity: async (challengeId?: string) => {
    const url = challengeId ? `${API_BASE}/evidence/verify-integrity?challenge_id=${challengeId}` : `${API_BASE}/evidence/verify-integrity`;
    const res = await fetch(url);
    return res.json();
  },
  getManifest: async (challengeId: string) => {
    const res = await fetch(`${API_BASE}/evidence/manifest/${challengeId}`);
    return res.json();
  },
  deleteEvidence: async (id: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/evidence/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },
  purgeAllData: async (): Promise<any> => {
    const res = await fetch(`${API_BASE}/dashboard/purge-all`, {
      method: 'DELETE'
    });
    return res.json();
  },
  updateEvidenceStep: async (id: string, step: string) => {
    const res = await fetch(`${API_BASE}/evidence/${id}/step`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ solution_step: step })
    });
    return res.json();
  },

  // AI Technical Explainer
  explainCommand: async (command: string, stdout?: string, mode: string = 'Technical') => {
    const res = await fetch(`${API_BASE}/explainer/explain-command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, stdout, mode })
    });
    return res.json();
  },
  generateWriteup: async (data: { challenge_id: string; style_mode?: string; template_name?: string; author?: string; redact_flag_token?: boolean }) => {
    const res = await fetch(`${API_BASE}/explainer/generate-writeup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Compliance Engine
  auditCompliance: async (data: { competition_id: string; challenge_id: string; writeup_content: string; author?: string }): Promise<ComplianceAuditResult> => {
    const res = await fetch(`${API_BASE}/compliance/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  getRules: async (competitionId: string) => {
    const res = await fetch(`${API_BASE}/compliance/rules/${competitionId}`);
    return res.json();
  },
  addRule: async (data: {
    competition_id: string;
    category?: string;
    title: string;
    description: string;
    severity?: string;
    rule_parameter?: any;
    source_reference?: string;
  }) => {
    const res = await fetch(`${API_BASE}/compliance/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteRule: async (ruleId: string) => {
    const res = await fetch(`${API_BASE}/compliance/rules/${ruleId}`, {
      method: 'DELETE'
    });
    return res.json();
  },
  toggleRuleActive: async (ruleId: string) => {
    const res = await fetch(`${API_BASE}/compliance/rules/${ruleId}/toggle`, {
      method: 'PATCH'
    });
    return res.json();
  },
  importGuidelinesText: async (competitionId: string, text: string) => {
    const res = await fetch(`${API_BASE}/compliance/rules/import-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ competition_id: competitionId, raw_guidelines_text: text })
    });
    return res.json();
  },

  // QA Checker
  inspectQA: async (challengeId: string, contentMarkdown: string, author?: string) => {
    const res = await fetch(`${API_BASE}/qa/inspect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_id: challengeId, content_markdown: contentMarkdown, author })
    });
    return res.json();
  },

  // Export Center
  createExportPackage: async (data: { challenge_id: string; export_formats?: string[]; redact_flag?: boolean }) => {
    const res = await fetch(`${API_BASE}/exports/package`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Templates
  getTemplates: async () => {
    const res = await fetch(`${API_BASE}/templates/`);
    return res.json();
  },

  // Anti-AI-Slop & External Intelligence
  auditSlop: async (text: string) => {
    const res = await fetch(`${API_BASE}/explainer/audit-slop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    return res.json();
  },
  sanitizeSlop: async (text: string, defaultHash?: string) => {
    const res = await fetch(`${API_BASE}/explainer/sanitize-slop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, default_hash: defaultHash })
    });
    return res.json();
  },
  getExternalSuggestions: async (query: string) => {
    const res = await fetch(`${API_BASE}/explainer/external-suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    return res.json();
  },
  getRealShellHistory: async (limit: number = 50) => {
    const res = await fetch(`${API_BASE}/sessions/real-shell-history?limit=${limit}`);
    return res.json();
  }
};
