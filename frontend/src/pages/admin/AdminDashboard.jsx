import { useEffect, useState } from 'react';
import { fetchStations } from '../../services/api';
import { Zap, WifiOff, Activity, TrendingUp, ToggleLeft, ToggleRight, Cpu, Globe } from 'lucide-react';
import './AdminDashboard.css';

const BCN_CONSUMPTION = [
    { city: 'Barcelona Centro', mwh: 312, stations: 3, population: 1620000 },
    { city: 'Barcelona Norte', mwh: 198, stations: 2, population: 540000 },
    { city: 'Barcelona Sur', mwh: 146, stations: 1, population: 320000 },
];

export default function AdminDashboard() {
    const [balancing, setBalancing] = useState(
        localStorage.getItem('catlink_load_balancing') !== 'false'
    );
    const [stations, setStations] = useState([]);

    useEffect(() => {
        fetchStations().then(setStations);
    }, []);
    const toggleBalancing = () => {
        const next = !balancing;
        setBalancing(next);
        localStorage.setItem('catlink_load_balancing', String(next));
    };

    const total = stations.length;
    const online = stations.filter(s => s.status !== 'offline').length;
    const offline = stations.filter(s => s.status === 'offline').length;
    const demand = stations.filter(s => s.status === 'high_demand').length;
    const totalMwh = BCN_CONSUMPTION.reduce((a, c) => a + c.mwh, 0);
    const maxMwh = Math.max(...BCN_CONSUMPTION.map(c => c.mwh));

    return (
        <div className="page-content animate-fade-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700 }}>Smart Grid Overview</h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>Real-time network intelligence</p>
                </div>
                <div className={`live-chip ${balancing ? 'green' : 'red'}`}>
                    <span className="pulse-dot" style={{ background: balancing ? 'var(--color-green)' : 'var(--color-red)' }} />
                    {balancing ? 'Load Balancing ON' : 'Load Balancing OFF'}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid-4 animate-fade-up" style={{ animationDelay: '0.05s', marginBottom: '1.25rem' }}>
                <div className="card kpi-card">
                    <div className="kpi-icon" style={{ background: 'var(--color-primary-dim)', color: 'var(--color-primary)' }}><Cpu size={20} /></div>
                    <div className="stat-value">{total}</div>
                    <div className="stat-label">Total Stations</div>
                </div>
                <div className="card kpi-card">
                    <div className="kpi-icon" style={{ background: 'var(--color-green-dim)', color: 'var(--color-green)' }}><Zap size={20} /></div>
                    <div className="stat-value">{online}</div>
                    <div className="stat-label">Active Chargers</div>
                </div>
                <div className="card kpi-card">
                    <div className="kpi-icon" style={{ background: 'var(--color-red-dim)', color: 'var(--color-red)' }}><WifiOff size={20} /></div>
                    <div className="stat-value">{offline}</div>
                    <div className="stat-label">Offline Chargers</div>
                </div>
                <div className="card kpi-card">
                    <div className="kpi-icon" style={{ background: 'var(--color-yellow-dim)', color: 'var(--color-yellow)' }}><Activity size={20} /></div>
                    <div className="stat-value">{demand}</div>
                    <div className="stat-label">High Demand</div>
                </div>
            </div>

            <div className="admin-grid-2">
                {/* City Consumption Chart */}
                <div className="card animate-fade-up" style={{ animationDelay: '0.1s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
                        <Globe size={16} color="var(--color-primary)" />
                        <h3 className="section-title" style={{ marginBottom: 0 }}>Consumption by City</h3>
                    </div>
                    {BCN_CONSUMPTION.map(c => (
                        <div className="city-row" key={c.city}>
                            <div className="city-name">{c.city}</div>
                            <div className="city-bar-wrap">
                                <div className="city-bar-fill" style={{ width: `${(c.mwh / maxMwh) * 100}%` }} />
                            </div>
                            <div className="city-mwh">{c.mwh} MWh</div>
                        </div>
                    ))}
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Network total</span>
                        <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{totalMwh} MWh</span>
                    </div>
                </div>

                {/* Controls Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Load Balancing Toggle */}
                    <div className="card animate-fade-up" style={{ animationDelay: '0.12s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 600, marginBottom: 4 }}>Automatic Load Balancing</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                    AI redistributes demand across available stations
                                </div>
                            </div>
                            <button onClick={toggleBalancing} className={`toggle-btn ${balancing ? 'on' : 'off'}`}>
                                {balancing ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                            </button>
                        </div>
                        <div className={`toggle-status ${balancing ? 'on' : 'off'}`}>
                            {balancing ? '✓ System actively redistributing load based on population density' : '✗ Manual mode — operators must reassign load manually'}
                        </div>
                    </div>

                    {/* Peak Prediction */}
                    <div className="card animate-fade-up" style={{ animationDelay: '0.14s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
                            <TrendingUp size={16} color="var(--color-accent)" />
                            <h3 className="section-title" style={{ marginBottom: 0 }}>Peak Demand Prediction</h3>
                        </div>
                        <div className="peak-bars">
                            {[
                                { hour: '08:00', pct: 45 }, { hour: '10:00', pct: 62 }, { hour: '12:00', pct: 78 },
                                { hour: '14:00', pct: 55 }, { hour: '16:00', pct: 88 }, { hour: '18:00', pct: 95 },
                                { hour: '20:00', pct: 70 }, { hour: '22:00', pct: 30 },
                            ].map(({ hour, pct }) => (
                                <div key={hour} className="peak-bar-item">
                                    <div className="peak-bar-wrap">
                                        <div className="peak-bar-fill" style={{
                                            height: `${pct}%`,
                                            background: pct >= 80 ? 'var(--color-red)' : pct >= 60 ? 'var(--color-yellow)' : 'var(--color-primary)'
                                        }} />
                                    </div>
                                    <div className="peak-hour">{hour}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-red)', marginTop: 8 }}>
                            ⚡ Peak demand expected at 18:00 — 95% capacity
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
