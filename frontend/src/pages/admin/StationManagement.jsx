import { useEffect, useState } from 'react';
import { fetchStations } from '../../services/api';
import { Search, Wifi, WifiOff, Zap, MapPin, ChevronDown, ChevronUp, Activity } from 'lucide-react';

function timeSince(iso) {
    const s = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
}

const STATUS = {
    available: { badge: 'badge-green', label: '🟢 Online', icon: <Wifi size={13} /> },
    high_demand: { badge: 'badge-yellow', label: '🟡 High Demand', icon: <Activity size={13} /> },
    offline: { badge: 'badge-red', label: '🔴 Offline', icon: <WifiOff size={13} /> },
};

export default function StationManagement() {
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState(null);
    const [stations, setStations] = useState([]);

    useEffect(() => {
        fetchStations().then(setStations);
    }, []);

    const filtered = stations.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.zone || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="page-content animate-fade-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700 }}>Station Management</h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>{stations.length} registered stations</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-green">{stations.filter(s => s.status === 'available').length} Available</span>
                    <span className="badge badge-yellow">{stations.filter(s => s.status === 'high_demand').length} High Demand</span>
                    <span className="badge badge-red">{stations.filter(s => s.status === 'offline').length} Offline</span>
                </div>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} />
                <input className="input-field" style={{ paddingLeft: '2.5rem' }}
                    placeholder="Search stations by name or zone…"
                    value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Table on large, cards on small */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Station</th>
                                <th>Status</th>
                                <th>Power</th>
                                <th>Connectors</th>
                                <th>Last Heartbeat</th>
                                <th>Location</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(s => {
                                const st = STATUS[s.status];
                                const isExp = expanded === s.id;
                                return (
                                    <>
                                        <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => setExpanded(isExp ? null : s.id)}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{s.name}</div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{s.id.toUpperCase()}</div>
                                            </td>
                                            <td><span className={`badge ${st.badge}`}>{st.icon} {st.label}</span></td>
                                            <td><span className="badge badge-blue">{s.power} kW</span></td>
                                            <td style={{ fontWeight: 600 }}>{s.connectors}</td>
                                            <td style={{ fontSize: '0.82rem', color: s.status === 'offline' ? 'var(--color-red)' : 'var(--color-text-muted)' }}>
                                                {timeSince(s.lastHeartbeat)}
                                            </td>
                                            <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <MapPin size={12} /> {s.zone}
                                                </div>
                                            </td>
                                            <td>{isExp ? <ChevronUp size={16} color="var(--color-primary)" /> : <ChevronDown size={16} />}</td>
                                        </tr>
                                        {isExp && (
                                            <tr key={s.id + '-exp'}>
                                                <td colSpan={7} style={{ background: 'var(--color-surface-2)', padding: '0.75rem 1rem' }}>
                                                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.82rem' }}>
                                                        <div><span style={{ color: 'var(--color-text-muted)' }}>Full Address: </span><strong>{s.address}</strong></div>
                                                        <div><span style={{ color: 'var(--color-text-muted)' }}>Coordinates: </span><strong>{s.lat.toFixed(4)}°N, {Math.abs(s.lng).toFixed(4)}°E</strong></div>
                                                        <div><span style={{ color: 'var(--color-text-muted)' }}>AI Occupancy: </span><strong style={{ color: 'var(--color-primary)' }}>{s.aiOccupancy}%</strong></div>
                                                        <div><span style={{ color: 'var(--color-text-muted)' }}>Last Ping: </span><strong>{new Date(s.lastHeartbeat).toLocaleTimeString()}</strong></div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>No stations found</div>
                )}
            </div>
        </div>
    );
}
