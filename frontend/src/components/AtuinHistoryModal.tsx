import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Terminal, 
  CheckCircle, 
  XCircle, 
  Copy, 
  Star, 
  Clock, 
  Folder, 
  MessageSquare,
  BarChart2,
  X
} from 'lucide-react';
import { api, TerminalCommand } from '../services/api';

interface AtuinHistoryModalProps {
  challengeId?: string;
  onClose: () => void;
  onInsertCommand?: (cmd: string) => void;
}

export const AtuinHistoryModal: React.FC<AtuinHistoryModalProps> = ({ 
  challengeId, 
  onClose, 
  onInsertCommand 
}) => {
  const [query, setQuery] = useState('');
  const [commands, setCommands] = useState<TerminalCommand[]>([]);
  const [filterSuccess, setFilterSuccess] = useState<boolean | undefined>(undefined);
  const [stats, setStats] = useState<any[]>([]);
  const [selectedCmd, setSelectedCmd] = useState<TerminalCommand | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.searchAtuinHistory({
        q: query,
        challenge_id: challengeId,
        only_successful: filterSuccess
      });
      setCommands(data);
      if (data.length > 0 && !selectedCmd) {
        setSelectedCmd(data[0]);
        setNoteInput(data[0].user_note || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.getCommandFrequency(challengeId);
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchStats();
  }, [query, filterSuccess, challengeId]);

  const handleToggleEvidence = async (cmdId: string) => {
    try {
      const res = await api.toggleCommandEvidence(cmdId);
      setCommands(commands.map(c => c.id === cmdId ? { ...c, is_evidence: res.is_evidence } : c));
      if (selectedCmd?.id === cmdId) {
        setSelectedCmd({ ...selectedCmd, is_evidence: res.is_evidence });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedCmd) return;
    try {
      await api.updateCommandNote(selectedCmd.id, noteInput);
      setCommands(commands.map(c => c.id === selectedCmd.id ? { ...c, user_note: noteInput } : c));
      setSelectedCmd({ ...selectedCmd, user_note: noteInput });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = (cmd: TerminalCommand) => {
    navigator.clipboard.writeText(cmd.command);
    setCopiedId(cmd.id);
    setTimeout(() => setCopiedId(null), 1500);
    if (onInsertCommand) {
      onInsertCommand(cmd.command);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-6">
      <div className="bg-cyber-surface border border-cyber-border rounded-xl w-full max-w-5xl h-[82vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-cyber-border flex items-center justify-between bg-cyber-card">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-cyber-green/10 border border-cyber-green/30 flex items-center justify-center text-cyber-green">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-cyber-text flex items-center gap-2">
                Atuin-Inspired Terminal History
                <span className="text-[10px] bg-cyber-border px-1.5 py-0.5 rounded text-cyber-muted font-mono">
                  FULL-TEXT SEARCH
                </span>
              </h2>
              <p className="text-xs text-cyber-muted">Inspect, search, and verify executed commands across sessions</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-cyber-muted hover:text-white hover:bg-cyber-border transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-3 border-b border-cyber-border bg-cyber-bg/50 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-cyber-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search history by command, output, or note (e.g. nmap, sqlmap, 10.10)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-cyber-card border border-cyber-border rounded-lg pl-9 pr-4 py-1.5 text-xs text-cyber-text focus:outline-none focus:border-cyber-green font-mono"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-cyber-card border border-cyber-border rounded-lg p-1 text-xs">
            <button
              onClick={() => setFilterSuccess(undefined)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono transition ${filterSuccess === undefined ? 'bg-cyber-border text-white' : 'text-cyber-muted'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterSuccess(true)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono transition flex items-center gap-1 ${filterSuccess === true ? 'bg-cyber-green/20 text-cyber-green' : 'text-cyber-muted'}`}
            >
              <CheckCircle className="w-3 h-3" /> Exit 0
            </button>
            <button
              onClick={() => setFilterSuccess(false)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono transition flex items-center gap-1 ${filterSuccess === false ? 'bg-cyber-danger/20 text-cyber-danger' : 'text-cyber-muted'}`}
            >
              <XCircle className="w-3 h-3" /> Failed
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Command list */}
          <div className="w-7/12 border-r border-cyber-border overflow-y-auto p-2 space-y-1.5">
            {loading ? (
              <div className="p-8 text-center text-xs text-cyber-muted font-mono">Loading commands...</div>
            ) : commands.length === 0 ? (
              <div className="p-8 text-center text-xs text-cyber-muted font-mono">
                No matching terminal commands recorded.
              </div>
            ) : (
              commands.map((cmd) => (
                <div
                  key={cmd.id}
                  onClick={() => {
                    setSelectedCmd(cmd);
                    setNoteInput(cmd.user_note || '');
                  }}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${
                    selectedCmd?.id === cmd.id
                      ? 'bg-cyber-card border-cyber-green/60 shadow'
                      : 'bg-cyber-card/40 border-cyber-border hover:bg-cyber-card'
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${cmd.exit_code === 0 ? 'bg-cyber-green' : 'bg-cyber-danger'}`} />
                    <div className="truncate font-mono text-[12px] text-zinc-200">
                      {cmd.command}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-[10px] text-cyber-muted font-mono">
                    {cmd.is_evidence && (
                      <span className="text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-yellow-400" /> Evidence
                      </span>
                    )}
                    <span>{cmd.duration_ms}ms</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(cmd);
                      }}
                      className="p-1 rounded hover:bg-cyber-border text-cyber-muted hover:text-white"
                      title="Copy to Writeup"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Details & Output Pane */}
          <div className="w-5/12 flex flex-col bg-cyber-bg/30 overflow-y-auto p-4 space-y-4">
            {selectedCmd ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-cyber-green">
                    Command Details ({selectedCmd.id})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleEvidence(selectedCmd.id)}
                      className={`text-xs px-2.5 py-1 rounded border flex items-center gap-1.5 transition font-mono ${
                        selectedCmd.is_evidence
                          ? 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40'
                          : 'bg-cyber-card text-cyber-muted border-cyber-border hover:text-white'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${selectedCmd.is_evidence ? 'fill-yellow-400' : ''}`} />
                      {selectedCmd.is_evidence ? 'Evidence Marked' : 'Mark as Evidence'}
                    </button>
                    <button
                      onClick={() => handleCopy(selectedCmd)}
                      className="text-xs px-2.5 py-1 rounded bg-cyber-green text-black font-semibold hover:bg-cyber-green/90 transition flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedId === selectedCmd.id ? 'Copied!' : 'Copy to Writeup'}
                    </button>
                  </div>
                </div>

                {/* Command text block */}
                <div>
                  <label className="text-[11px] text-cyber-muted block mb-1 font-mono">COMMAND EXECUTED</label>
                  <pre className="p-3 bg-cyber-card border border-cyber-border rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto">
                    $ {selectedCmd.command}
                  </pre>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-cyber-card p-3 rounded-lg border border-cyber-border">
                  <div>
                    <span className="text-cyber-muted block text-[10px]">EXIT CODE</span>
                    <span className={selectedCmd.exit_code === 0 ? 'text-cyber-green' : 'text-cyber-danger'}>
                      {selectedCmd.exit_code} ({selectedCmd.exit_code === 0 ? 'Success' : 'Error'})
                    </span>
                  </div>
                  <div>
                    <span className="text-cyber-muted block text-[10px]">DURATION</span>
                    <span>{selectedCmd.duration_ms} ms</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-cyber-muted block text-[10px]">WORKING DIRECTORY</span>
                    <span className="truncate block text-zinc-300">{selectedCmd.cwd || 'N/A'}</span>
                  </div>
                </div>

                {/* Standard Output Preview */}
                <div>
                  <label className="text-[11px] text-cyber-muted block mb-1 font-mono">CAPTURED OUTPUT</label>
                  <pre className="p-3 bg-cyber-card border border-cyber-border rounded-lg text-[11px] font-mono text-zinc-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {selectedCmd.stdout_preview || 'No standard output recorded.'}
                  </pre>
                </div>

                {/* Notes and Explanation */}
                <div>
                  <label className="text-[11px] text-cyber-muted block mb-1 font-mono">EXPLANATION / USER NOTE</label>
                  <textarea
                    rows={2}
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="Add technical discovery or methodology note..."
                    className="w-full bg-cyber-card border border-cyber-border rounded-lg p-2 text-xs text-cyber-text focus:outline-none focus:border-cyber-green font-mono"
                  />
                  <button
                    onClick={handleSaveNote}
                    className="mt-1.5 px-3 py-1 bg-cyber-border text-xs rounded hover:bg-cyber-card transition text-cyber-text font-mono"
                  >
                    Save Note
                  </button>
                </div>
              </>
            ) : (
              <div className="p-6 text-center text-xs text-cyber-muted font-mono">
                Select a command on the left to inspect output, timing, and annotate evidence.
              </div>
            )}
          </div>
        </div>

        {/* Bottom Frequency Stats Banner */}
        <div className="p-2.5 border-t border-cyber-border bg-cyber-card flex items-center justify-between text-xs text-cyber-muted font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <BarChart2 className="w-3.5 h-3.5 text-cyber-green" /> Top Commands:
            </span>
            <div className="flex items-center gap-2 overflow-x-auto">
              {stats.slice(0, 4).map((s, idx) => (
                <span key={idx} className="bg-cyber-bg px-2 py-0.5 rounded border border-cyber-border text-[11px]">
                  <code>{s.base_cmd}</code> ({s.frequency}x)
                </span>
              ))}
            </div>
          </div>
          <div>Total Commands: {commands.length}</div>
        </div>

      </div>
    </div>
  );
};
