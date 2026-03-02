import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchSessions, fetchStations, stopChargingSession } from '../../services/api';
import {
    BatteryCharging, MapPin, Shield, Clock, Zap, TrendingUp,
    AlertTriangle, CheckCircle, ChevronRight, Activity, Square
} from 'lucide-react';
import './Dashboard.css';

// EV battery simulation constants
const BATTERY_CAPACITY_KWH = 82;
const BATTERY_START_PCT = 22;
const TARGET_BATTERY_PCT = 80;
const PRICE_PER_KWH = 0.40;
const CHARGE_EFFICIENCY = 0.9;

function RingProgress({ value, max, color, size = 120 }) {
    const r = (size - 16) / 2;
    const circ = 2 * Math.PI * r;
    const pct = Math.min(value / max, 1);
    return (
        <svg width={size} height={size} className="ring-svg">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={color} strokeWidth="8"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - pct)}
                strokeLinecap="round"
                style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 1s ease' }}
            />
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
                fill={color} fontSize={size * 0.18} fontWeight="700" fontFamily="Space Grotesk">
                {value}%
            </text>
        </svg>
    );
}

function FraudBadge({ risk }) {
    const cfg = {
        low: { cls: 'badge-green', icon: <CheckCircle size={13} />, label: 'Low Risk' },
        medium: { cls: 'badge-yellow', icon: <AlertTriangle size={13} />, label: 'Medium Risk' },
        high: { cls: 'badge-red', icon: <AlertTriangle size={13} />, label: 'High Risk · SIM Swap Alert' },
    };
    const c = cfg[risk];
    return <span className={`badge ${c.cls}`} style={{ fontSize: '0.78rem', padding: '5px 12px' }}>{c.icon} {c.label}</span>;
}

export default function CustomerDashboard() {
    const { user } = useAuth();
    const [elapsed, setElapsed] = useState(0);
    const [session, setSession] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [chargerPower, setChargerPower] = useState(100); // kW, default
    const [stopping, setStopping] = useState(false);

    const loadSessions = async () => {
        if (!user?.id) return;
        const data = await fetchSessions(user.id);
        setSessions(data);
        const active = data.find(s => s.status === 'approved') || data[0] || null;
        setSession(active);
        if (active?.stationId) {
            const stations = await fetchStations();
            const matched = stations.find(st => st.id === active.stationId);
            if (matched) setChargerPower(matched.power);
        }
    };

    useEffect(() => { loadSessions(); }, [user?.id]);

    const isLive = session?.status === 'approved';

    // Compute live session fields from elapsed time
    const kwhSoFar = isLive ? Math.min(
        ((elapsed / 60) * chargerPower * CHARGE_EFFICIENCY),
        ((TARGET_BATTERY_PCT - BATTERY_START_PCT) / 100) * BATTERY_CAPACITY_KWH
    ) : (session?.kwhConsumed || 0);

    const costSoFar = isLive
        ? (kwhSoFar * PRICE_PER_KWH)
        : (session?.cost || 0);

    const batteryNow = isLive
        ? Math.min(BATTERY_START_PCT + Math.round((kwhSoFar / BATTERY_CAPACITY_KWH) * 100), TARGET_BATTERY_PCT)
        : 0;

    const totalKwhNeeded = ((TARGET_BATTERY_PCT - BATTERY_START_PCT) / 100) * BATTERY_CAPACITY_KWH;
    const totalMinutesNeeded = chargerPower > 0 ? (totalKwhNeeded / (chargerPower * CHARGE_EFFICIENCY)) * 60 : 0;
    const estimatedMinutesLeft = isLive ? Math.max(0, Math.round(totalMinutesNeeded - elapsed)) : 0;

    const recentSessions = sessions.slice(0, 3);

    useEffect(() => {
        if (!session?.startTime) return;
        const start = new Date(session.startTime);
        const tick = () => setElapsed(Math.floor((Date.now() - start) / 60000));
        tick();
        const id = setInterval(tick, 10000);
        return () => clearInterval(id);
    }, [session?.startTime]);

    const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const handleStop = async () => {
        if (!session?.id || stopping) return;
        setStopping(true);
        try {
            await stopChargingSession(session.id);
            await loadSessions();
        } finally {
            setStopping(false);
        }
    };

    return (
        <div className="page-content animate-fade-up">
            <div className="dash-header">
                <div>
                    <h2 className="section-title" style={{ fontSize: '1.4rem', marginBottom: 4 }}>
                        Good evening, {user?.name?.split(' ')[0]} 👋
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <FraudBadge risk={user?.riskLevel || 'low'} />
            </div>

            {/* Active Session Card */}
            <div className="active-session-card card card-hover animate-fade-up" style={{ animationDelay: '0.05s' }}>
                <div className="session-header">
                    <div>
                        <div className="session-badge"><span className="pulse-dot" />Live Session</div>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginTop: 6 }}>{session?.stationName || 'No active session'}</h3>
                        <p className="session-sub"><MapPin size={13} /> {session?.stationId ? `Station ${session.stationId.toUpperCase()}` : 'Start a charge to see details'}</p>
                    </div>
                    <div className="session-ring">
                        <RingProgress value={isLive ? batteryNow : 0} max={100} color="var(--color-primary)" size={110} />
                        <span className="ring-label">Battery</span>
                    </div>
                </div>

                <div className="session-stats">
                    <div className="sstat">
                        <Clock size={16} className="sstat-icon" />
                        <div>
                            <div className="sstat-val">{session ? `${elapsed}m` : '--'}</div>
                            <div className="sstat-lbl">Elapsed</div>
                        </div>
                    </div>
                    <div className="sstat">
                        <Zap size={16} className="sstat-icon" />
                        <div>
                            <div className="sstat-val">{isLive ? kwhSoFar.toFixed(1) : '--'} kWh</div>
                            <div className="sstat-lbl">Charged</div>
                        </div>
                    </div>
                    <div className="sstat">
                        <TrendingUp size={16} className="sstat-icon" />
                        <div>
                            <div className="sstat-val">{isLive ? `$${costSoFar.toFixed(2)}` : '--'}</div>
                            <div className="sstat-lbl">Cost so far</div>
                        </div>
                    </div>
                    <div className="sstat">
                        <BatteryCharging size={16} className="sstat-icon" />
                        <div>
                            <div className="sstat-val">{isLive ? `${estimatedMinutesLeft}m` : '--'}</div>
                            <div className="sstat-lbl">ETA</div>
                        </div>
                    </div>
                </div>

                {/* Battery bar */}
                <div className="battery-bar-wrap">
                    <div className="battery-bar-track">
                        <div className="battery-bar-fill" style={{ width: `${isLive ? batteryNow : 0}%` }}>
                            {TARGET_BATTERY_PCT > 0 && (
                                <div className="battery-bar-target" style={{ left: `${TARGET_BATTERY_PCT}%` }}>
                                    <div className="target-line" />
                                    <span className="target-label">{TARGET_BATTERY_PCT}% target</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="battery-labels">
                        <span>{BATTERY_START_PCT}% start</span>
                        <span style={{ color: 'var(--color-primary)' }}>{isLive ? batteryNow : 0}% now</span>
                    </div>
                </div>

                {isLive && (
                    <button className="stop-charge-btn" onClick={handleStop} disabled={stopping}>
                        <Square size={16} />
                        {stopping ? 'Stopping...' : 'Stop Charging'}
                    </button>
                )}
            </div>

            {/* Quick Stats */}
            <div className="grid-3 animate-fade-up grid_fix" style={{ animationDelay: '0.1s' }}>
                <div className="card">
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Activity size={14} />&nbsp;TOTAL SESSIONS
                    </div>
                    <div className="stat-value">{sessions.length}</div>
                    <div className="stat-label">This month</div>
                </div>
                <div className="card">
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Zap size={14} />&nbsp;TOTAL kWh
                    </div>
                    <div className="stat-value">
                        {sessions.reduce((a, s) => a + (s.kwhConsumed || 0), 0).toFixed(1)}
                    </div>
                    <div className="stat-label">Energy consumed</div>
                </div>
                <div className="card">
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <TrendingUp size={14} />&nbsp;TOTAL SPENT
                    </div>
                    <div className="stat-value">
                        ${sessions.reduce((a, s) => a + (s.cost || 0), 0).toFixed(2)}
                    </div>
                    <div className="stat-label">All time</div>
                </div>
            </div>

            {/* Recent History */}
            <div className="card animate-fade-up" style={{ animationDelay: '0.15s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 className="section-title" style={{ marginBottom: 0 }}>Recent Sessions</h3>
                    <span className="badge badge-blue">{recentSessions.length} shown</span>
                </div>
                {recentSessions.map((s) => (
                    <div className="history-row" key={s.id}>
                        <div className="history-icon"><Zap size={16} /></div>
                        <div className="history-info">
                            <div className="history-station">{s.stationName}</div>
                        <div className="history-date">{fmt(s.startTime)} · {s.duration}min · {s.kwhConsumed || 0}kWh</div>
                        </div>
                        <div className="history-cost">${(s.cost || 0).toFixed(2)}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
