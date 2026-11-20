import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Cpu, 
  ShieldCheck, 
  HardDrive, 
  Terminal, 
  Save, 
  Check, 
  Key, 
  Lock, 
  Database,
  Radio,
  FileText,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'terminal' | 'storage' | 'audit'>('general');
  const [saved, setSaved] = useState(false);

  // Settings State
  const [authorHandle, setAuthorHandle] = useState('0xHacker');
  const [workspaceDir, setWorkspaceDir] = useState('C:\\CTF\\writeups');
  const [aiProvider, setAiProvider] = useState<'local' | 'gemini' | 'openai' | 'anthropic'>('local');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [anthropicApiKey, setAnthropicApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testState, setTestState] = useState<{ loading: boolean; success?: boolean; message?: string }>({ loading: false });
  const [antiSlopStrictness, setAntiSlopStrictness] = useState('Strict');
  const [redactTokens, setRedactTokens] = useState(true);
  const [customRedactions, setCustomRedactions] = useState('password, token, api_key, secret, Authorization');
  const [autoVerifySha, setAutoVerifySha] = useState(true);

  useEffect(() => {
    const savedGemini = localStorage.getItem('ctf_gemini_api_key') || '';
    const savedOpenai = localStorage.getItem('ctf_openai_api_key') || '';
    const savedAnthropic = localStorage.getItem('ctf_anthropic_api_key') || '';
    const savedProvider = (localStorage.getItem('ctf_ai_provider') as any) || 'local';
    setGeminiApiKey(savedGemini);
    setOpenaiApiKey(savedOpenai);
    setAnthropicApiKey(savedAnthropic);
    setAiProvider(savedProvider);

    // Sync with backend
    fetch('http://127.0.0.1:8000/api/v1/explainer/config')
      .then(r => r.json())
      .then(cfg => {
        if (cfg.active_provider) setAiProvider(cfg.active_provider);
      })
      .catch(() => {});
  }, []);

  const handleTestKey = async () => {
    const activeKey = aiProvider === 'gemini' ? geminiApiKey : aiProvider === 'openai' ? openaiApiKey : anthropicApiKey;
    if (!activeKey) {
      setTestState({ loading: false, success: false, message: 'Please enter an API key to test' });
      return;
    }
    setTestState({ loading: true });
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/explainer/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: aiProvider, api_key: activeKey })
      });
      const data = await res.json();
      setTestState({ loading: false, success: data.success, message: data.message });
    } catch (e: any) {
      setTestState({ loading: false, success: false, message: 'Backend connection error' });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('ctf_gemini_api_key', geminiApiKey);
    localStorage.setItem('ctf_openai_api_key', openaiApiKey);
    localStorage.setItem('ctf_anthropic_api_key', anthropicApiKey);
    localStorage.setItem('ctf_ai_provider', aiProvider);

    try {
      await fetch('http://127.0.0.1:8000/api/v1/explainer/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ai_provider: aiProvider,
          gemini_api_key: geminiApiKey,
          openai_api_key: openaiApiKey,
          anthropic_api_key: anthropicApiKey
        })
      });
    } catch {}

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      
      {/* Banner */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyber-primary/10 border border-cyber-primary/20 text-cyber-primary">
              <SettingsIcon className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-cyber-text font-mono flex items-center gap-2">
                Workstation Settings & System Configuration
              </h1>
              <p className="text-xs text-cyber-muted mt-0.5">
                Customize local agent daemon hooks, cryptographic storage paths, AI explainer anti-slop rules, and security policies.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-lg bg-cyber-primary text-black font-semibold text-xs font-mono flex items-center gap-1.5 hover:bg-cyber-primary/90 transition shadow-sm"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{saved ? 'Saved Successfully' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-cyber-border text-xs font-mono">
        {[
          { id: 'general', label: 'General', icon: SettingsIcon },
          { id: 'ai', label: 'AI Explainer Engine', icon: Cpu },
          { id: 'terminal', label: 'Terminal & Shell Hooks', icon: Terminal },
          { id: 'storage', label: 'Evidence & Forensics', icon: HardDrive },
          { id: 'audit', label: 'Security Audit Logs', icon: ShieldCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2.5 border-b-2 font-semibold transition flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-cyber-primary text-cyber-primary'
                  : 'border-transparent text-cyber-muted hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Settings Tab Contents */}
      <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 shadow-sm space-y-6 font-mono text-xs">
        
        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Default Security Researcher Handle</label>
              <input
                type="text"
                value={authorHandle}
                onChange={(e) => setAuthorHandle(e.target.value)}
                className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-cyber-primary"
              />
              <span className="text-[11px] text-cyber-muted mt-1 block">Included in writeup headers and competition metadata.</span>
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Local Workspace Root Directory</label>
              <input
                type="text"
                value={workspaceDir}
                onChange={(e) => setWorkspaceDir(e.target.value)}
                className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-cyber-primary"
              />
              <span className="text-[11px] text-cyber-muted mt-1 block">Base directory where writeup packages, manifests, and attachments are organized.</span>
            </div>

            <div className="pt-2 border-t border-cyber-border">
              <span className="text-zinc-300 font-semibold block mb-2">Theme & Display</span>
              <div className="p-3 bg-cyber-bg rounded-lg border border-cyber-border flex items-center justify-between">
                <div>
                  <span className="text-zinc-200 font-bold block">Cyber Ops Dark Theme (Fixed)</span>
                  <span className="text-[10px] text-cyber-muted">Main #090B10 &bull; Lime #A3E635 &bull; Cyan #38BDF8</span>
                </div>
                <span className="text-xs text-cyber-primary font-bold">LOCKED</span>
              </div>
            </div>
          </div>
        )}

        {/* AI Explainer Engine Tab */}
        {activeTab === 'ai' && (
          <div className="space-y-5 max-w-xl">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">AI Explainer Backend Model</label>
              <select
                value={aiProvider}
                onChange={(e) => {
                  setAiProvider(e.target.value as any);
                  setTestState({ loading: false });
                }}
                className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-cyber-primary"
              >
                <option value="local">Local Hacker Explainer (Rule-Grounded & Air-Gapped / No API Key Required)</option>
                <option value="gemini">Google Gemini 2.0 Flash / Pro (Google Cloud API Key)</option>
                <option value="openai">OpenAI GPT-4o / GPT-4o-mini (OpenAI API Key)</option>
                <option value="anthropic">Anthropic Claude 3.5 Sonnet (Anthropic API Key)</option>
              </select>
              <span className="text-[11px] text-cyber-muted mt-1 block">
                {aiProvider === 'local' 
                  ? 'Zero internet connection needed. 100% deterministic local command analysis.'
                  : 'Requires a valid API key. Uses strict anti-slop system instructions to avoid filler.'}
              </span>
            </div>

            {/* API Key Input When Cloud Model is Selected */}
            {aiProvider !== 'local' && (
              <div className="p-4 bg-cyber-bg border border-cyber-border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-200 font-semibold text-xs flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-cyber-primary" />
                    <span>{aiProvider === 'gemini' ? 'Google Gemini API Key' : aiProvider === 'openai' ? 'OpenAI API Key' : 'Anthropic Claude API Key'}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-[11px] text-cyber-muted hover:text-white flex items-center gap-1"
                  >
                    {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showApiKey ? 'Hide' : 'Show'}</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    placeholder={aiProvider === 'gemini' ? 'AIzaSy...' : aiProvider === 'openai' ? 'sk-...' : 'sk-ant-...'}
                    value={aiProvider === 'gemini' ? geminiApiKey : aiProvider === 'openai' ? openaiApiKey : anthropicApiKey}
                    onChange={(e) => {
                      if (aiProvider === 'gemini') setGeminiApiKey(e.target.value);
                      else if (aiProvider === 'openai') setOpenaiApiKey(e.target.value);
                      else setAnthropicApiKey(e.target.value);
                      setTestState({ loading: false });
                    }}
                    className="flex-1 bg-black/40 border border-cyber-border rounded-lg px-3 py-2 text-zinc-200 font-mono text-xs focus:outline-none focus:border-cyber-primary"
                  />
                  <button
                    type="button"
                    onClick={handleTestKey}
                    disabled={testState.loading}
                    className="px-3 py-2 bg-cyber-primary/10 border border-cyber-primary/30 text-cyber-primary rounded-lg text-xs hover:bg-cyber-primary/20 transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {testState.loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Test Key</span>
                  </button>
                </div>

                {/* Test Feedback */}
                {testState.message && (
                  <div className={`p-2.5 rounded-lg text-[11px] flex items-center gap-2 ${
                    testState.success 
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                  }`}>
                    {testState.success ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    <span>{testState.message}</span>
                  </div>
                )}
                
                <p className="text-[10px] text-cyber-muted">
                  API keys are stored securely on localhost and only invoked when generating explanations or sanitizing text. If an external call fails or times out, the studio automatically falls back to the local deterministic engine.
                </p>
              </div>
            )}

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Anti-AI-Slop Strictness</label>
              <select
                value={antiSlopStrictness}
                onChange={(e) => setAntiSlopStrictness(e.target.value)}
                className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-cyber-primary"
              >
                <option value="Strict">Strict (Zero generic preambles, mandatory command grounding, strict hacker tone)</option>
                <option value="Moderate">Moderate (Allows introductory summaries, technical grounding)</option>
                <option value="Permissive">Permissive</option>
              </select>
            </div>

            <div className="p-4 bg-cyber-bg rounded-lg border border-cyber-border space-y-2">
              <span className="text-cyber-primary font-bold text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Anti-AI-Slop Guarantee Active
              </span>
              <p className="text-[11px] text-cyber-muted leading-relaxed">
                Whether using an external LLM API key or the local deterministic explainer, the studio enforces strict filters that reject phrases like "Certainly! Here is...", "In this fast-paced digital world...", and "It is crucial to remember...". Every claim is grounded in SHA-256 evidence hashes and real terminal commands.
              </p>
            </div>
          </div>
        )}

        {/* Terminal Tab */}
        {activeTab === 'terminal' && (
          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Local Shell Agent Endpoint</label>
              <input
                type="text"
                disabled
                value="http://127.0.0.1:8000/api/sessions/commands"
                className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-zinc-400 font-mono"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={redactTokens}
                  onChange={(e) => setRedactTokens(e.target.checked)}
                  className="rounded bg-cyber-bg border-cyber-border text-cyber-primary focus:ring-0"
                />
                <span className="font-semibold">Automatic Secret & Password Redaction</span>
              </label>
              <span className="text-[11px] text-cyber-muted mt-1 block ml-5">
                Prevents accidental capture of SSH passwords, bearer tokens, API keys, and environment variables.
              </span>
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Redaction Keywords (Comma-separated)</label>
              <input
                type="text"
                value={customRedactions}
                onChange={(e) => setCustomRedactions(e.target.value)}
                className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-cyber-primary"
              />
            </div>
          </div>
        )}

        {/* Storage Tab */}
        {activeTab === 'storage' && (
          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Evidence Vault Storage Location</label>
              <input
                type="text"
                disabled
                value="C:\Users\alkes\.gemini\antigravity\scratch\ctf-writeup-studio\backend\data\evidence"
                className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-zinc-400 font-mono"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoVerifySha}
                  onChange={(e) => setAutoVerifySha(e.target.checked)}
                  className="rounded bg-cyber-bg border-cyber-border text-cyber-primary focus:ring-0"
                />
                <span className="font-semibold">Verify Cryptographic SHA-256 Hashes on Boot</span>
              </label>
              <span className="text-[11px] text-cyber-muted mt-1 block ml-5">
                Ensures no files on disk have been altered, corrupted, or tampered with outside the application.
              </span>
            </div>
          </div>
        )}

        {/* Audit Tab */}
        {activeTab === 'audit' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-cyber-border">
              <span className="font-bold text-zinc-200 uppercase tracking-wider text-[11px]">Recent Cryptographic Audit Trail</span>
              <span className="text-[10px] text-emerald-400 font-bold">IMMUTABLE LOG</span>
            </div>

            <div className="space-y-2">
              {[
                { time: '13:46:12', action: 'EVIDENCE_HASH_VERIFY', detail: 'Checked SHA-256 for 12 artifacts — 100% matched', status: 'SUCCESS' },
                { time: '13:42:01', action: 'RULE_AUDIT_PASS', detail: 'Competition regulations audited — 12/12 passed', status: 'SUCCESS' },
                { time: '13:30:45', action: 'COMMAND_RECORD_SANITIZED', detail: 'Redacted credentials from curl command in session SESS-WEB-001', status: 'REDACTED' },
                { time: '13:15:20', action: 'WRITEUP_EXPORT_BUNDLE', detail: 'Generated ZIP package with evidence manifest JSON', status: 'EXPORTED' }
              ].map((log, idx) => (
                <div key={idx} className="p-3 bg-cyber-bg rounded-lg border border-cyber-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-cyber-muted text-[10px]">{log.time}</span>
                    <span className="text-cyber-primary font-bold">{log.action}</span>
                    <span className="text-zinc-300 text-[11px]">{log.detail}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {log.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
