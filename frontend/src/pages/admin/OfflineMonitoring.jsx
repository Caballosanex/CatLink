import { useState, useEffect } from 'react';
import { fetchStations } from '../../services/api';
import { WifiOff, AlertTriangle, Clock, RefreshCw, X, Send } from 'lucide-react';

function timeSince(iso) {
    const s = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
    const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m`;
}

function IncidentModal({ station, onClose }) {
    const [type, setType] = useState('hardware');
    const [notes, setNotes] = useState('');
    const [sent, setSent] = useState(false);

    const submit = () => {
        setSent(true);
        setTimeout(onClose, 1500);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card glass report_fix" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Report Incident — {station.name}</h3>
                    <button onClick={onClose}><X size={18} /></button>
                </div>
                {sent ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-green)' }}>
                        ✓ Incident reported successfully
                    </div>
                ) : (
                    <>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="label">Incident Type</label>
                            <select className="input-field" value={type} onChange={e => setType(e.target.value)}>
                                <option value="hardware">Hardware Failure</option>
                                <option value="network">Network / Connectivity</option>
                                <option value="power">Power Supply Issue</option>
                                <option value="vandalism">Vandalism / Physical Damage</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                            <label className="label">Notes</label>
                            <textarea className="input-field" rows={3} placeholder="Describe the incident…"
                                value={notes} onChange={e => setNotes(e.target.value)} />
                        </div>
                        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={submit}>
                            <Send size={15} /> Submit Report
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default function OfflineMonitoring() {
    const [ticks, setTicks] = useState(0);
    const [reportStation, setReportStation] = useState(null);
    const [stations, setStations] = useState([]);

    useEffect(() => {
        fetchStations().then(setStations);
    }, []);

    useEffect(() => {
        const id = setInterval(() => setTicks(t => t + 1), 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="page-content animate-fade-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700 }}>Offline Charger Monitoring</h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>Real-time disconnection alerts</p>
                </div>
                <span className="badge badge-red" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
                    <WifiOff size={13} /> {stations.filter(s => s.status === 'offline').length} Disconnected
                </span>
            </div>

            {stations.filter(s => s.status === 'offline').length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    <WifiOff size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                    <p>All stations are online</p>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {stations.filter(s => s.status === 'offline').map(s => {
                    const downTime = timeSince(s.lastHeartbeat);
                    const isLong = (Date.now() - new Date(s.lastHeartbeat)) > 3600000;

                    return (
                        <div key={s.id} className={`card offline-alert-card ${isLong ? 'critical' : 'warning'} animate-fade-up`}>
                            <div className="offline-header">
                                <div className="offline-icon-wrap">
                                    <WifiOff size={22} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        <h3 style={{ fontWeight: 700 }}>{s.name}</h3>
                                        <span className={`badge ${isLong ? 'badge-red' : 'badge-yellow'}`}>
                                            <AlertTriangle size={12} /> {isLong ? 'Critical' : 'Warning'}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 3 }}>
                                        {s.address} · {s.power}kW · {s.connectors} connectors
                                    </div>
                                </div>
                                <button className="btn btn-danger btn-sm" onClick={() => setReportStation(s)}>
                                    Report
                                </button>
                            </div>

                            <div className="offline-stats">
                                <div className="offline-stat">
                                    <Clock size={14} />
                                    <div>
                                        <div className="offline-stat-val" style={{ color: isLong ? 'var(--color-red)' : 'var(--color-yellow)' }}>
                                            {downTime}
                                        </div>
                                        <div className="offline-stat-lbl">Offline Duration</div>
                                    </div>
                                </div>
                                <div className="offline-stat">
                                    <RefreshCw size={14} />
                                    <div>
                                        <div className="offline-stat-val">{new Date(s.lastHeartbeat).toLocaleTimeString()}</div>
                                        <div className="offline-stat-lbl">Last Heartbeat</div>
                                    </div>
                                </div>
                                <div className="offline-stat">
                                    <WifiOff size={14} />
                                    <div>
                                        <div className="offline-stat-val">{s.id.toUpperCase()}</div>
                                        <div className="offline-stat-lbl">Station ID</div>
                                    </div>
                                </div>
                            </div>

                            <div className="offline-ping-bar">
                                <div className="ping-bar-track">
                                    <div className="ping-bar-fill" style={{ width: isLong ? '100%' : '60%' }} />
                                </div>
                                <span style={{ fontSize: '0.7rem', color: isLong ? 'var(--color-red)' : 'var(--color-yellow)', marginLeft: 8 }}>
                                    {isLong ? 'Critical — immediate action required' : 'Elevated — monitoring closely'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {reportStation && <IncidentModal station={reportStation} onClose={() => setReportStation(null)} />}

            <style>{`
        .offline-alert-card.critical { border-color: rgba(255,61,113,0.4); background: linear-gradient(135deg, var(--color-surface), rgba(255,61,113,0.05)); }
        .offline-alert-card.warning  { border-color: rgba(255,179,0,0.4);  background: linear-gradient(135deg, var(--color-surface), rgba(255,179,0,0.05)); }
        .offline-header { display:flex; align-items:flex-start; gap:1rem; margin-bottom:1rem; flex-wrap:wrap; }
        .offline-icon-wrap { width:44px;height:44px;border-radius:var(--radius-md);background:var(--color-red-dim);color:var(--color-red);display:flex;align-items:center;justify-content:center;flex-shrink:0; }
        .offline-alert-card.warning .offline-icon-wrap { background:var(--color-yellow-dim);color:var(--color-yellow); }
        .offline-stats { display:flex;gap:1.5rem;flex-wrap:wrap;margin-bottom:0.75rem; }
        .offline-stat { display:flex;align-items:center;gap:8px;color:var(--color-text-muted); }
        .offline-stat-val { font-family:var(--font-display);font-weight:700;font-size:0.95rem;color:var(--color-text); }
        .offline-stat-lbl { font-size:0.7rem;color:var(--color-text-muted); }
        .offline-ping-bar { display:flex;align-items:center; }
        .ping-bar-track { flex:1;height:4px;background:var(--color-surface-3);border-radius:100px;overflow:hidden; }
        .ping-bar-fill { height:100%;background:var(--color-red);border-radius:100px;animation:pulse-ring 2s ease-in-out infinite; }
        .offline-alert-card.warning .ping-bar-fill { background:var(--color-yellow); }
        .modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;z-index:500;padding:1rem; }
        .modal-card { width:100%;max-width:440px;border-radius:var(--radius-xl);padding:1.5rem; }
        .modal-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem; }
        .modal-header h3 { font-family:var(--font-display);font-weight:600;font-size:1rem; }
        .modal-header button { color:var(--color-text-muted);transition:color 0.2s; }
        .modal-header button:hover { color:var(--color-red); }
      `}</style>
        </div>
    );
}
