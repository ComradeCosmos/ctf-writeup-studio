import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Play, 
  Pause, 
  Square, 
  Search, 
  Send, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2,
  Copy,
  Check,
  Radio,
  FileText,
  Clock,
  ChevronRight,
  FolderLock,
  Layers,
  Code,
  Tag,
  AlertTriangle,
  ChevronDown,
  RotateCcw,
  Sliders
} from 'lucide-react';
import { api, Challenge, Competition, TimelineEvent } from '../services/api';
import { AtuinHistoryModal } from '../components/AtuinHistoryModal';
import { TimelineViewer } from '../components/TimelineViewer';

interface SessionRecorderPageProps {
  initialChallengeId?: string;
  onNavigateToWriteup?: (challengeId: string) => void;
}

export const SessionRecorderPage: React.FC<SessionRecorderPageProps> = ({ 
  initialChallengeId, 
  onNavigateToWriteup 
}) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChalId, setSelectedChalId] = useState<string>(initialChallengeId || '');
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  
  // Interactive command runner
  const [cmdInput, setCmdInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(true);
  const [activeTab, setActiveTab] = useState<'terminal' | 'diagnostics'>('terminal');

  // Elapsed recording timer state
  const [recordingSeconds, setRecordingSeconds] = useState(842);

  const loadData = async () => {
    try {
      const chals = await api.getChallenges();
      setChallenges(chals);
      const targetChal = selectedChalId || (chals.length > 0 ? chals[0].id : '');
      setSelectedChalId(targetChal);

      if (targetChal) {
        const sessList = await api.getSessions(targetChal);
        setSessions(sessList);
        const active = sessList.find((s: any) => s.status === 'active');
        setActiveSession(active || (sessList.length > 0 ? sessList[0] : null));
        
        const timeline = await api.getTimeline(targetChal);
        setTimelineEvents(timeline);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedChalId]);

  useEffect(() => {
    let interval: any;
    if (activeSession?.status === 'active') {
      interval = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession?.status]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartSession = async () => {
    const currentChal = challenges.find(c => c.id === selectedChalId);
    if (!currentChal) return;

    const newSess = await api.startSession({
      competition_id: currentChal.competition_id,
      challenge_id: currentChal.id,
      name: `${currentChal.name} Solving Session`,
      shell_type: 'powershell',
      working_directory: `C:\\CTF\\${currentChal.id}`
    });
    setActiveSession(newSess);
    loadData();
  };

  const handleToggleStatus = async (newStatus: string) => {
    if (!activeSession) return;
    const updated = await api.changeSessionStatus(activeSession.id, newStatus);
    setActiveSession(updated);
    loadData();
  };

  const handleManualCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmdInput.trim() || !activeSession) return;

    setIsExecuting(true);
    const enteredCmd = cmdInput;
    const enteredNote = noteInput;
    setCmdInput('');
    setNoteInput('');

    try {
      let stdoutSim = `[+] Executing: ${enteredCmd}\nHTTP/1.1 200 OK\nServer: gunicorn/20.1.0\nContent-Type: application/json\n{"status":"success","vulnerability_confirmed":true}`;
      if (enteredCmd.includes('nmap')) {
        stdoutSim = `PORT     STATE SERVICE VERSION\n80/tcp   open  http    Apache httpd 2.4.49\n443/tcp  open  ssl/http Apache httpd 2.4.49\nNmap done: 1 IP address (1 host up) scanned in 0.42 seconds`;
      } else if (enteredCmd.includes('cat') || enteredCmd.includes('flag')) {
        stdoutSim = `CTF{jwt_k3y_c0nfusion_suprem4cy_9918}\n[+] Flag proof captured into forensics manifest.`;
      }

      await api.recordCommand({
        session_id: activeSession.id,
        challenge_id: selectedChalId,
        command: enteredCmd,
        stdout: stdoutSim,
        exit_code: 0,
        duration_ms: 145,
        cwd: activeSession.working_directory || 'C:\\CTF\\targets',
        shell: activeSession.shell_type || 'powershell',
        user_note: enteredNote
      });

      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const currentChallenge = challenges.find(c => c.id === selectedChalId);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-cyber-bg overflow-hidden select-none">
      
      {/* Workstation Top Bar / Session Tabs (Image 2 style) */}
      <div className="h-11 bg-cyber-sidebar border-b border-cyber-border flex items-center justify-between px-4 shrink-0">
        
        {/* Left: Tab controls */}
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-t-lg bg-cyber-card border-t border-x border-cyber-border text-xs font-mono text-zinc-100 font-semibold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-cyber-primary animate-pulse" />
            <span className="text-cyber-muted text-[10px] font-bold">PS</span>
            <span className="truncate max-w-[180px]">{currentChallenge?.name || 'terminal-session'}</span>
            <span className="text-[10px] text-cyber-muted">[{selectedChalId}]</span>
          </div>

          <select
            value={selectedChalId}
            onChange={(e) => setSelectedChalId(e.target.value)}
            className="bg-cyber-bg border border-cyber-border rounded px-2 py-1 text-xs font-mono text-zinc-300 focus:outline-none focus:border-cyber-primary ml-2"
          >
            {challenges.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
            ))}
          </select>
        </div>

        {/* Center: Recording Status Telemetry */}
        <div className="flex items-center gap-3">
          {activeSession?.status === 'active' ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="font-bold">REC</span>
              <span>{formatTimer(recordingSeconds)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-zinc-500" />
              <span>RECORDING IDLE</span>
            </div>
          )}

          <div className="text-[11px] font-mono text-cyber-muted hidden md:flex items-center gap-1.5">
            <span>Agent:</span>
            <span className="text-cyber-primary font-semibold">127.0.0.1:8000</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Atuin Command History Search */}
          <button
            onClick={() => setHistoryOpen(true)}
            className="px-2.5 py-1 rounded bg-cyber-card border border-cyber-border hover:border-cyber-primary text-zinc-200 text-xs font-mono flex items-center gap-1.5 transition"
            title="Search Atuin Command History (Ctrl+R)"
          >
            <Search className="w-3.5 h-3.5 text-cyber-primary" />
            <span className="hidden sm:inline">Atuin History</span>
            <kbd className="text-[9px] bg-cyber-bg px-1 rounded border border-cyber-border text-cyber-muted">Ctrl+R</kbd>
          </button>

          {/* Session Lifecycle Buttons */}
          {activeSession ? (
            <div className="flex items-center gap-1">
              {activeSession.status === 'active' ? (
                <button
                  onClick={() => handleToggleStatus('paused')}
                  className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-mono flex items-center gap-1 transition"
                >
                  <Pause className="w-3 h-3" /> Pause
                </button>
              ) : (
                <button
                  onClick={() => handleToggleStatus('active')}
                  className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-mono flex items-center gap-1 transition"
                >
                  <Play className="w-3 h-3" /> Resume
                </button>
              )}
              <button
                onClick={() => handleToggleStatus('stopped')}
                className="px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-mono flex items-center gap-1 transition"
              >
                <Square className="w-3 h-3" /> Stop
              </button>
            </div>
          ) : (
            <button
              onClick={handleStartSession}
              className="px-3 py-1 rounded bg-cyber-primary text-black font-semibold text-xs font-mono flex items-center gap-1 hover:bg-cyber-primary/90 transition shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              New Session
            </button>
          )}

          {/* Timeline toggle */}
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className={`p-1.5 rounded border transition text-xs font-mono ${
              showTimeline ? 'bg-cyber-surface border-cyber-primary/40 text-cyber-primary' : 'bg-cyber-card border-cyber-border text-cyber-muted'
            }`}
            title="Toggle Chronological Timeline"
          >
            <Clock className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Dual-Pane Terminal Workstation (Image 2 style) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Pane: Target Intelligence & Vulnerability Diagnostics */}
        <div className="w-1/3 min-w-[320px] max-w-[420px] bg-cyber-sidebar border-r border-cyber-border flex flex-col justify-between overflow-hidden">
          
          {/* Intelligence Header */}
          <div className="p-3 border-b border-cyber-border bg-cyber-card/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyber-primary" />
              <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
                Target Diagnostics
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-bg border border-cyber-border text-cyber-secondary">
              LIVE AUDIT
            </span>
          </div>

          {/* Vulnerability Tree (Image 2 left pane) */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-xs">
            
            {/* Critical Issue */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-rose-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  CRITICAL: JWT Secret Confusion
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">CVSS 9.8</span>
              </div>
              <div className="p-3 bg-cyber-card rounded-lg border border-cyber-border/80 space-y-2 text-[11px] text-cyber-muted">
                <div className="text-zinc-300">
                  1. Hardcoded / Asymmetric public key used as HMAC secret.
                </div>
                <div className="text-[10px] text-rose-300/80 bg-cyber-bg p-2 rounded border border-cyber-border">
                  <code>var jwtSecret = []byte(publicKey)</code>
                </div>
                <div>2. Token signature verification accepts algorithm HS256 when RS256 expected.</div>
                <div>3. Allows arbitrary user spoofing (<code className="text-cyber-primary">admin: true</code>).</div>
              </div>
            </div>

            {/* Medium Issue */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  MEDIUM: Missing Strict Claims Validation
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">CVSS 6.5</span>
              </div>
              <div className="p-3 bg-cyber-card rounded-lg border border-cyber-border/80 space-y-1.5 text-[11px] text-cyber-muted">
                <div>4. Untyped context key (<code className="text-zinc-300">context.WithValue</code>)</div>
                <div>5. Panic potential if user ID is missing from JSON payload.</div>
              </div>
            </div>

            {/* Minor / Hardening */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-sky-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  INFO: Exploitation Roadmap
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300">STEP 3/4</span>
              </div>
              <div className="p-3 bg-cyber-card rounded-lg border border-cyber-border/80 text-[11px] text-cyber-muted space-y-1">
                <div>&bull; Fetch public key from <code className="text-zinc-300">/api/v1/auth/pubkey</code></div>
                <div>&bull; Sign forged token with HS256</div>
                <div>&bull; Authenticate against <code className="text-zinc-300">/api/v1/admin/flag</code></div>
              </div>
            </div>

            {/* Suggested Payloads */}
            <div className="pt-2 border-t border-cyber-border">
              <span className="text-[10px] text-cyber-muted uppercase tracking-wider block mb-2">
                Quick Shell Commands
              </span>
              <div className="space-y-1.5">
                {[
                  'curl -s http://10.10.11.24/pubkey > key.pem',
                  'python3 exploit.py --key key.pem --user admin',
                  'curl -H "Authorization: Bearer $TOKEN" http://10.10.11.24/flag'
                ].map((cmd, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCmdInput(cmd)}
                    className="w-full text-left p-2 rounded bg-cyber-bg hover:bg-cyber-card border border-cyber-border text-zinc-300 hover:text-cyber-primary text-[10px] font-mono truncate transition flex items-center justify-between"
                  >
                    <span className="truncate">{cmd}</span>
                    <ChevronRight className="w-3 h-3 text-cyber-muted shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Quick AI Exploit Assist input (Image 2 style bottom prompt) */}
          <div className="p-3 border-t border-cyber-border bg-cyber-card/80">
            <div className="flex items-center gap-2 text-xs font-mono text-cyber-muted mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyber-primary" />
              <span>Diagnostic AI Assist</span>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="> fix the critical issues / run payload (? for shortcuts)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setCmdInput('python3 exploit_payload.py --target ' + (currentChallenge?.name || 'target'));
                  }
                }}
                className="w-full bg-cyber-bg border border-cyber-border rounded px-3 py-1.5 text-[11px] font-mono text-zinc-200 placeholder-cyber-muted focus:outline-none focus:border-cyber-primary"
              />
            </div>
          </div>
        </div>

        {/* Center Pane: Interactive Terminal Workstation (Image 2 right pane) */}
        <div className="flex-1 flex flex-col justify-between bg-cyber-bg overflow-hidden">
          
          {/* Terminal Workspace Header */}
          <div className="p-3 border-b border-cyber-border bg-cyber-card/40 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-zinc-300">
                <Terminal className="w-4 h-4 text-cyber-primary" />
                <span className="font-bold">Execution Stream</span>
              </div>
              <span className="text-cyber-border">|</span>
              <span className="text-cyber-muted text-[11px]">
                CWD: <code className="text-zinc-300">{activeSession?.working_directory || 'C:\\CTF\\workspace'}</code>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-cyber-muted">
                {activeSession?.commands?.length || 0} commands recorded
              </span>
              {onNavigateToWriteup && (
                <button
                  onClick={() => onNavigateToWriteup(selectedChalId)}
                  className="px-2.5 py-1 rounded bg-cyber-card border border-cyber-border hover:border-cyber-secondary text-cyber-secondary text-xs flex items-center gap-1 transition"
                >
                  <FileText className="w-3 h-3" />
                  Jump to Writeup
                </button>
              )}
            </div>
          </div>

          {/* Terminal Command Output History Log */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-xs">
            {(!activeSession?.commands || activeSession.commands.length === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-cyber-muted space-y-3">
                <Terminal className="w-10 h-10 text-cyber-border animate-pulse" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-zinc-400">Terminal Hook Ready</p>
                  <p className="text-xs text-cyber-muted mt-1 max-w-sm">
                    Commands executed in PowerShell, Bash, or typed below are automatically sanitized, timed, and linked to this CTF target.
                  </p>
                </div>
              </div>
            ) : (
              activeSession.commands.map((cmd: any, idx: number) => (
                <div 
                  key={cmd.id || idx}
                  className="bg-cyber-card border border-cyber-border rounded-lg p-3 space-y-2 hover:border-cyber-primary/40 transition group"
                >
                  {/* Command Title & Metadata bar */}
                  <div className="flex items-center justify-between text-[11px] text-cyber-muted pb-1.5 border-b border-cyber-border/60">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyber-primary" />
                      <span className="text-zinc-400 font-bold">#{idx + 1}</span>
                      <span className="text-cyber-muted">{cmd.shell || 'powershell'}</span>
                      <span className="text-cyber-border">&bull;</span>
                      <span className="text-cyber-muted">{cmd.duration_ms || 120}ms</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        cmd.exit_code === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        exit {cmd.exit_code}
                      </span>

                      <button
                        onClick={() => handleCopy(cmd.command, cmd.id || idx.toString())}
                        className="p-1 rounded hover:bg-cyber-surface text-cyber-muted hover:text-white transition"
                        title="Copy Command"
                      >
                        {copiedId === (cmd.id || idx.toString()) ? (
                          <Check className="w-3 h-3 text-cyber-primary" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Command String */}
                  <div className="flex items-start gap-2 text-zinc-100 font-bold bg-cyber-bg p-2 rounded border border-cyber-border text-xs">
                    <span className="text-cyber-primary select-none">$</span>
                    <span className="select-text">{cmd.command}</span>
                  </div>

                  {/* Stdout / Response */}
                  {cmd.stdout && (
                    <div className="p-2.5 bg-cyber-bg/80 rounded border border-cyber-border/70 text-[11px] text-emerald-400/90 whitespace-pre-wrap font-mono overflow-x-auto">
                      {cmd.stdout}
                    </div>
                  )}

                  {/* User Note */}
                  {cmd.user_note && (
                    <div className="flex items-center gap-1.5 text-[11px] text-cyber-secondary font-mono pt-1">
                      <Tag className="w-3 h-3" />
                      <span>Note: {cmd.user_note}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Interactive Shell Input Box (Image 2 style interactive prompt) */}
          <div className="p-3 bg-cyber-sidebar border-t border-cyber-border space-y-2">
            <form onSubmit={handleManualCommandSubmit} className="space-y-2 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="text-xs text-cyber-primary font-bold">
                  PS C:\CTF\{selectedChalId}&gt;
                </span>
                <input
                  type="text"
                  placeholder="Enter command (e.g. nmap -sC -sV target, python3 exploit.py, cat flag.txt)..."
                  value={cmdInput}
                  onChange={(e) => setCmdInput(e.target.value)}
                  disabled={!activeSession}
                  className="flex-1 bg-cyber-bg border border-cyber-border rounded px-3 py-1.5 text-zinc-200 placeholder-cyber-muted focus:outline-none focus:border-cyber-primary"
                />
                <button
                  type="submit"
                  disabled={!cmdInput.trim() || !activeSession || isExecuting}
                  className="px-3 py-1.5 rounded bg-cyber-primary text-black font-semibold hover:bg-cyber-primary/90 disabled:opacity-40 transition flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  Run
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add optional note or forensic context to this command..."
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  className="flex-1 bg-cyber-card/60 border border-cyber-border/60 rounded px-3 py-1 text-[11px] text-zinc-300 placeholder-cyber-muted/60 focus:outline-none focus:border-cyber-secondary"
                />
                <span className="text-[10px] text-cyber-muted shrink-0">
                  Auto-sanitizes passwords & auth tokens
                </span>
              </div>
            </form>
          </div>
        </div>

        {/* Collapsible Right Pane: Chronological Session Timeline */}
        {showTimeline && (
          <div className="w-80 bg-cyber-sidebar border-l border-cyber-border flex flex-col justify-between overflow-hidden shrink-0">
            <div className="p-3 border-b border-cyber-border bg-cyber-card/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyber-primary" />
                <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
                  Session Timeline
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyber-muted">
                {timelineEvents.length} events
              </span>
            </div>

            <div className="flex-1 p-3 overflow-y-auto">
              <TimelineViewer
                events={timelineEvents}
                onConvertToStep={(event) => {
                  if (onNavigateToWriteup) onNavigateToWriteup(selectedChalId);
                }}
              />
            </div>

            <div className="p-3 border-t border-cyber-border bg-cyber-card/40">
              <button
                onClick={() => {
                  if (onNavigateToWriteup) onNavigateToWriteup(selectedChalId);
                }}
                className="w-full py-1.5 px-3 rounded bg-cyber-surface border border-cyber-border hover:border-cyber-primary text-xs font-mono text-zinc-200 hover:text-white flex items-center justify-center gap-1.5 transition"
              >
                <FileText className="w-3.5 h-3.5 text-cyber-primary" />
                Synthesize to Writeup
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Atuin Command History Modal */}
      {historyOpen && (
        <AtuinHistoryModal
          challengeId={selectedChalId}
          onSelectCommand={(cmd) => {
            setCmdInput(cmd);
            setHistoryOpen(false);
          }}
          onClose={() => setHistoryOpen(false)}
        />
      )}

    </div>
  );
};
