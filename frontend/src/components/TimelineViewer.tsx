import React, { useState } from 'react';
import { 
  Terminal, 
  Image as ImageIcon, 
  Flag, 
  Lightbulb, 
  Globe, 
  FileCode, 
  CheckSquare, 
  Square,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { TimelineEvent } from '../services/api';

interface TimelineViewerProps {
  events: TimelineEvent[];
  onConvertToWriteup?: (selectedEvents: TimelineEvent[]) => void;
}

export const TimelineViewer: React.FC<TimelineViewerProps> = ({ events, onConvertToWriteup }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(events.map(e => e.id)));
  const [filterType, setFilterType] = useState<string>('all');

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === events.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(events.map(e => e.id)));
  };

  const getEventIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'command': return <Terminal className="w-3.5 h-3.5 text-blue-400" />;
      case 'screenshot': return <ImageIcon className="w-3.5 h-3.5 text-purple-400" />;
      case 'flag_retrieval': return <Flag className="w-3.5 h-3.5 text-emerald-400" />;
      case 'discovery': return <Lightbulb className="w-3.5 h-3.5 text-amber-400" />;
      case 'http_request': return <Globe className="w-3.5 h-3.5 text-cyan-400" />;
      default: return <FileCode className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const filteredEvents = events.filter(e => {
    if (filterType === 'all') return true;
    return e.event_type.toLowerCase() === filterType.toLowerCase();
  });

  const handleConvert = () => {
    if (onConvertToWriteup) {
      const selected = events.filter(e => selectedIds.has(e.id));
      onConvertToWriteup(selected);
    }
  };

  return (
    <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between pb-4 border-b border-cyber-border">
        <div>
          <h3 className="text-sm font-bold text-cyber-text flex items-center gap-2">
            Chronological CTF Session Timeline
            <span className="text-[10px] bg-cyber-green/10 text-cyber-green border border-cyber-green/30 px-2 py-0.5 rounded-full font-mono">
              {events.length} Events
            </span>
          </h3>
          <p className="text-xs text-cyber-muted">Convert selected timeline events into structured writeup steps</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={selectAll}
            className="text-xs px-2.5 py-1 rounded bg-cyber-surface border border-cyber-border text-cyber-muted hover:text-white transition font-mono flex items-center gap-1.5"
          >
            {selectedIds.size === events.length ? <CheckSquare className="w-3 h-3 text-cyber-green" /> : <Square className="w-3 h-3" />}
            {selectedIds.size === events.length ? 'Deselect All' : 'Select All'}
          </button>
          <button
            onClick={handleConvert}
            disabled={selectedIds.size === 0}
            className="text-xs px-3 py-1.5 rounded bg-cyber-green text-black font-semibold hover:bg-cyber-green/90 transition flex items-center gap-1.5 shadow disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Build Writeup from Timeline ({selectedIds.size})
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 py-3 border-b border-cyber-border/50 text-[11px] font-mono">
        <span className="text-cyber-muted">Filter:</span>
        {['all', 'command', 'screenshot', 'discovery', 'flag_retrieval'].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-2 py-0.5 rounded transition capitalize ${filterType === t ? 'bg-cyber-border text-white' : 'text-cyber-muted hover:text-white'}`}
          >
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Timeline items list */}
      <div className="mt-4 relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-cyber-border">
        {filteredEvents.length === 0 ? (
          <div className="p-6 text-center text-xs text-cyber-muted font-mono">
            No events match current filter.
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const isSelected = selectedIds.has(evt.id);
            return (
              <div 
                key={evt.id}
                onClick={() => toggleSelect(evt.id)}
                className={`relative flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  isSelected 
                    ? 'bg-cyber-surface border-cyber-green/40 shadow-sm' 
                    : 'bg-cyber-surface/40 border-cyber-border hover:bg-cyber-surface'
                }`}
              >
                {/* Node indicator */}
                <div className="absolute -left-[27px] top-3.5 w-4 h-4 rounded-full bg-cyber-surface border-2 border-cyber-border flex items-center justify-center">
                  <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-cyber-green' : 'bg-zinc-600'}`} />
                </div>

                {/* Checkbox */}
                <div className="mt-0.5">
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-cyber-green" />
                  ) : (
                    <Square className="w-4 h-4 text-cyber-muted" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getEventIcon(evt.event_type)}
                      <span className="text-xs font-semibold text-cyber-text font-mono truncate">
                        {evt.title}
                      </span>
                    </div>
                    {evt.suggested_step && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyber-card border border-cyber-border text-zinc-300 font-mono">
                        {evt.suggested_step}
                      </span>
                    )}
                  </div>
                  {evt.description && (
                    <p className="text-xs text-cyber-muted mt-1 font-mono">
                      {evt.description}
                    </p>
                  )}
                </div>

                <div className="text-[10px] text-cyber-muted font-mono whitespace-nowrap self-center">
                  {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
