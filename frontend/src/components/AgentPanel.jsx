import { useState, useRef, useEffect } from 'react';
import { Brain, ChevronDown, ChevronUp, Wifi, WifiOff, Trash2, Shield, MapPin, Phone, Zap, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import useWebSocket from '../hooks/useWebSocket';
import './AgentPanel.css';

const TOOL_META = {
  check_sim_swap: { icon: Phone, label: 'SIM Swap Check', color: 'var(--color-yellow)' },
  verify_location: { icon: MapPin, label: 'Location Verify', color: 'var(--color-accent)' },
  verify_number: { icon: Shield, label: 'Number Verify', color: 'var(--color-primary)' },
  activate_qod: { icon: Zap, label: 'QoD Activation', color: 'var(--color-green)' },
};

const DECISION_META = {
  APPROVE: { icon: CheckCircle, label: 'Approved', cls: 'decision-approve' },
  REJECT_FRAUD: { icon: XCircle, label: 'Rejected: Fraud', cls: 'decision-reject' },
  REJECT_LOCATION: { icon: XCircle, label: 'Rejected: Location', cls: 'decision-reject' },
  REJECT_IDENTITY: { icon: AlertTriangle, label: 'Rejected: Identity', cls: 'decision-reject' },
};

function AgentLogEntry({ entry }) {
  const ts = entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';

  // Start event
  if (entry.event === 'start') {
    return (
      <div className="agent-entry agent-entry-start">
        <div className="entry-dot start" />
        <div className="entry-body">
          <div className="entry-header">
            <Brain size={14} />
            <span className="entry-title">Agent Started</span>
            <span className="entry-time">{ts}</span>
          </div>
          <div className="entry-msg">{entry.message}</div>
        </div>
      </div>
    );
  }

  // Decision event
  if (entry.event === 'decision') {
    const meta = DECISION_META[entry.decision] || DECISION_META.REJECT_IDENTITY;
    const Icon = meta.icon;
    return (
      <div className={`agent-entry agent-entry-decision ${meta.cls}`}>
        <div className={`entry-dot ${entry.decision === 'APPROVE' ? 'approve' : 'reject'}`} />
        <div className="entry-body">
          <div className="entry-header">
            <Icon size={14} />
            <span className="entry-title">{meta.label}</span>
            <span className="entry-time">{ts}</span>
          </div>
          {entry.reason && <div className="entry-msg">{entry.reason}</div>}
        </div>
      </div>
    );
  }

  // Tool call event
  if (entry.tool) {
    const meta = TOOL_META[entry.tool] || { icon: Shield, label: entry.tool, color: 'var(--color-text-muted)' };
    const Icon = meta.icon;
    const outputStr = entry.output ? JSON.stringify(entry.output, null, 2) : null;

    return (
      <div className="agent-entry agent-entry-tool">
        <div className="entry-dot tool" style={{ borderColor: meta.color }} />
        <div className="entry-body">
          <div className="entry-header">
            <Icon size={14} style={{ color: meta.color }} />
            <span className="entry-title" style={{ color: meta.color }}>{meta.label}</span>
            <span className="entry-time">{ts}</span>
          </div>
          {entry.input && (
            <div className="entry-input">
              {Object.entries(entry.input).map(([k, v]) => (
                <span key={k} className="entry-param">{k}: <strong>{String(v)}</strong></span>
              ))}
            </div>
          )}
          {outputStr && (
            <details className="entry-output-details">
              <summary>Response</summary>
              <pre className="entry-output">{outputStr}</pre>
            </details>
          )}
        </div>
      </div>
    );
  }

  return null;
}

export default function AgentPanel() {
  const { logs, connected, clearLogs } = useWebSocket();
  const [open, setOpen] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (scrollRef.current && open && !minimized) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, open, minimized]);

  // Auto-expand when new logs arrive
  useEffect(() => {
    if (logs.length > 0 && minimized) {
      setMinimized(false);
    }
  }, [logs.length]);

  if (!open) {
    return (
      <button className="agent-fab" onClick={() => { setOpen(true); setMinimized(false); }} title="Open AI Agent Panel">
        <Brain size={20} />
        {logs.length > 0 && <span className="fab-badge">{logs.length}</span>}
      </button>
    );
  }

  return (
    <div className={`agent-panel glass ${minimized ? 'minimized' : ''}`}>
      {/* Header */}
      <div className="agent-panel-header" onClick={() => setMinimized(!minimized)}>
        <div className="agent-panel-title">
          <Brain size={16} />
          <span>AI Agent</span>
          <span className={`ws-status ${connected ? 'online' : 'offline'}`}>
            {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>
        <div className="agent-panel-actions">
          {logs.length > 0 && (
            <button className="panel-action-btn" onClick={(e) => { e.stopPropagation(); clearLogs(); }} title="Clear logs">
              <Trash2 size={13} />
            </button>
          )}
          <button className="panel-action-btn" onClick={(e) => { e.stopPropagation(); setOpen(false); }} title="Close panel">
            <XCircle size={13} />
          </button>
          {minimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {/* Body */}
      {!minimized && (
        <div className="agent-panel-body" ref={scrollRef}>
          {logs.length === 0 ? (
            <div className="agent-empty">
              <Brain size={28} className="agent-empty-icon" />
              <div>Waiting for agent activity...</div>
              <div className="agent-empty-sub">Start a charging session to see AI reasoning</div>
            </div>
          ) : (
            <div className="agent-log-list">
              {logs.map((entry) => (
                <AgentLogEntry key={entry._id} entry={entry} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
