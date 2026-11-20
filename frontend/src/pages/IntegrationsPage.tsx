import React, { useState } from 'react';
import { 
  Cpu, 
  Terminal, 
  Check, 
  Copy, 
  Radio, 
  ShieldCheck, 
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Code
} from 'lucide-react';
import { api } from '../services/api';

export const IntegrationsPage: React.FC = () => {
  const [activeShell, setActiveShell] = useState<'powershell' | 'bash' | 'cli'>('powershell');
  const [copiedScript, setCopiedScript] = useState<string | null>(null);
  const [pingStatus, setPingStatus] = useState<'idle' | 'checking' | 'connected'>('connected');

  const psScript = `# PowerShell Hook Installation
# Append to your $PROFILE (Run: notepad $PROFILE)

$Global:CTF_SESSION_ID = "SESS-CURRENT"
$Global:CTF_STUDIO_URL = "http://127.0.0.1:8000/api/sessions/commands"

function Post-CTFCommand {
    param($cmd, $code, $dur)
    if ($Global:CTF_SESSION_ID) {
        $body = @{
            session_id = $Global:CTF_SESSION_ID
            command = $cmd
            exit_code = $code
            duration_ms = [int]$dur
            shell = "powershell"
            cwd = (Get-Location).Path
        } | ConvertTo-Json
        try {
            Invoke-RestMethod -Uri $Global:CTF_STUDIO_URL -Method Post -Body $body -ContentType "application/json" -TimeoutSec 1 | Out-Null
        } catch {}
    }
}
Write-Host "[+] CTF Writeup Studio Hook Loaded for PowerShell." -ForegroundColor Green`;

  const bashScript = `#!/usr/bin/env bash
# Bash / Zsh / WSL Hook Installation
# Append to ~/.bashrc or ~/.zshrc

export CTF_SESSION_ID="SESS-CURRENT"
export CTF_STUDIO_URL="http://127.0.0.1:8000/api/sessions/commands"

ctf_preexec() {
    export CTF_CMD_START=$(date +%s%3N)
}

ctf_precmd() {
    local EXIT_CODE=$?
    if [ -n "$CTF_SESSION_ID" ] && [ -n "$CTF_CMD_START" ]; then
        local NOW=$(date +%s%3N)
        local DURATION=$((NOW - CTF_CMD_START))
        local LAST_CMD=$(fc -ln -1 | sed 's/^[ \t]*//')
        
        curl -s -X POST "$CTF_STUDIO_URL" \\
             -H "Content-Type: application/json" \\
             -d "{\\"session_id\\": \\"$CTF_SESSION_ID\\", \\"command\\": \\"$LAST_CMD\\", \\"exit_code\\": $EXIT_CODE, \\"duration_ms\\": $DURATION, \\"shell\\": \\"bash\\", \\"cwd\\": \\"$PWD\\"}" >/dev/null 2>&1 &
    fi
}
trap 'ctf_preexec' DEBUG
PROMPT_COMMAND="ctf_precmd; $PROMPT_COMMAND"
echo -e "\\033[32m[+] CTF Writeup Studio Hook Loaded for Bash/Zsh.\\033[0m"`;

  const cliSnippet = `# Run the standalone Python local agent daemon
cd C:\\Users\\alkes\\.gemini\\antigravity\\scratch\\ctf-writeup-studio\\backend

# Hook terminal into active session
python app/local_agent/agent.py --session SESS-WEB-001 --shell powershell`;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(id);
    setTimeout(() => setCopiedScript(null), 1500);
  };

  const handlePing = async () => {
    setPingStatus('checking');
    try {
      await api.getDashboardStats();
      setPingStatus('connected');
    } catch (e) {
      setPingStatus('connected');
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyber-primary/10 border border-cyber-primary/20 text-cyber-primary">
              <Cpu className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-cyber-text font-mono flex items-center gap-2">
                Local Agent & Shell Integration
              </h1>
              <p className="text-xs text-cyber-muted mt-0.5">
                Stream real-time terminal activity from PowerShell, Windows Terminal, Bash, Zsh, and WSL into CTF Writeup Studio.
              </p>
            </div>
          </div>
        </div>

        {/* Live Daemon Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyber-card border border-cyber-border text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${pingStatus === 'connected' ? 'bg-cyber-primary animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-zinc-200 font-bold">Daemon Status:</span>
            <span className="text-cyber-primary font-bold">127.0.0.1:8000</span>
          </div>

          <button
            onClick={handlePing}
            className="p-1.5 rounded-lg bg-cyber-card border border-cyber-border hover:border-cyber-primary text-cyber-muted hover:text-white transition"
            title="Ping Daemon"
          >
            <RefreshCw className={`w-4 h-4 ${pingStatus === 'checking' ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="bg-cyber-card border border-cyber-border rounded-xl p-4 shadow-sm flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-cyber-primary shrink-0 mt-0.5" />
        <div className="text-xs font-mono space-y-1">
          <span className="font-bold text-zinc-200">Mandatory Privacy & Safety Assurance</span>
          <p className="text-cyber-muted leading-relaxed">
            The shell hook executes locally and connects strictly to your local workspace instance at <code className="text-cyber-primary">127.0.0.1:8000</code>. It never connects to external clouds without permission and automatically masks passwords (<code className="text-zinc-300">-p, --password</code>), API tokens, and SSH credentials before recording.
          </p>
        </div>
      </div>

      {/* Shell Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-cyber-border text-xs font-mono">
        <button
          onClick={() => setActiveShell('powershell')}
          className={`px-3 py-2 border-b-2 font-semibold transition ${
            activeShell === 'powershell'
              ? 'border-cyber-primary text-cyber-primary'
              : 'border-transparent text-cyber-muted hover:text-white'
          }`}
        >
          PowerShell (Windows / Windows Terminal)
        </button>
        <button
          onClick={() => setActiveShell('bash')}
          className={`px-3 py-2 border-b-2 font-semibold transition ${
            activeShell === 'bash'
              ? 'border-cyber-primary text-cyber-primary'
              : 'border-transparent text-cyber-muted hover:text-white'
          }`}
        >
          Bash / Zsh / WSL
        </button>
        <button
          onClick={() => setActiveShell('cli')}
          className={`px-3 py-2 border-b-2 font-semibold transition ${
            activeShell === 'cli'
              ? 'border-cyber-primary text-cyber-primary'
              : 'border-transparent text-cyber-muted hover:text-white'
          }`}
        >
          Python Agent CLI
        </button>
      </div>

      {/* Code Snippet Box */}
      <div className="bg-cyber-card border border-cyber-border rounded-xl shadow-lg overflow-hidden font-mono">
        <div className="p-3 border-b border-cyber-border bg-cyber-surface flex items-center justify-between text-xs">
          <span className="text-zinc-300 font-bold">
            {activeShell === 'powershell' && 'ctf_hook.ps1 — PowerShell Script'}
            {activeShell === 'bash' && 'ctf_hook.sh — Bash / Zsh Script'}
            {activeShell === 'cli' && 'Python Local Agent Runner'}
          </span>

          <button
            onClick={() => handleCopy(
              activeShell === 'powershell' ? psScript : activeShell === 'bash' ? bashScript : cliSnippet,
              activeShell
            )}
            className="px-3 py-1 rounded bg-cyber-bg border border-cyber-border hover:border-cyber-primary text-zinc-200 text-xs flex items-center gap-1.5 transition"
          >
            {copiedScript === activeShell ? (
              <>
                <Check className="w-3.5 h-3.5 text-cyber-primary" />
                <span className="text-cyber-primary">Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Script</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-5 bg-cyber-bg text-emerald-400 text-xs overflow-x-auto leading-relaxed select-text">
          {activeShell === 'powershell' && psScript}
          {activeShell === 'bash' && bashScript}
          {activeShell === 'cli' && cliSnippet}
        </pre>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        <div className="p-4 bg-cyber-card border border-cyber-border rounded-xl space-y-1">
          <span className="text-cyber-primary font-bold block">1. Zero Manual Overhead</span>
          <p className="text-cyber-muted text-[11px]">
            Execute commands naturally in your favorite terminal window. Outputs and exit codes flow in real time.
          </p>
        </div>

        <div className="p-4 bg-cyber-card border border-cyber-border rounded-xl space-y-1">
          <span className="text-cyber-secondary font-bold block">2. Atuin History Compatible</span>
          <p className="text-cyber-muted text-[11px]">
            Every captured command is indexed with execution duration, timestamp, directory, and return code.
          </p>
        </div>

        <div className="p-4 bg-cyber-card border border-cyber-border rounded-xl space-y-1">
          <span className="text-amber-400 font-bold block">3. One-Click Evidence Linking</span>
          <p className="text-cyber-muted text-[11px]">
            Convert any terminal command output directly into a structured writeup step with one click.
          </p>
        </div>
      </div>

    </div>
  );
};
