import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchSessions } from '../../services/api';
import { Zap, Clock, DollarSign, Download, BarChart3, Calendar } from 'lucide-react';
import './History.css';

function downloadInvoice(session) {
    const text = [
        '=======================================',
        '           CATLINK — INVOICE           ',
        '=======================================',
        '',
        `Session ID  : ${session.id.toUpperCase()}`,
        `Station     : ${session.stationName}`,
        `Date        : ${new Date(session.startTime).toLocaleDateString('en-US', { dateStyle: 'long' })}`,
        `Start Time  : ${new Date(session.startTime).toLocaleTimeString()}`,
        `End Time    : ${session.endTime ? new Date(session.endTime).toLocaleTimeString() : '-'}`,
        `Duration    : ${session.duration || 0} minutes`,
        '',
        '--------------------------------------',
        `Energy Used : ${session.kwhConsumed || 0} kWh`,
        `Unit Price  : $${session.pricePerKwh || 0}/kWh`,
        '--------------------------------------',
        `TOTAL COST  : $${(session.cost || 0).toFixed(2)}`,
        '======================================',
        '',
        'Powered by CatLink · Nokia Network as Code',
        'Thank you for charging with us!',
    ].join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `catlink-invoice-${session.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

export default function History() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        if (user?.id) {
            fetchSessions(user.id).then(setSessions);
        }
    }, [user?.id]);
    const totalKwh = sessions.reduce((a, s) => a + (s.kwhConsumed || 0), 0);
    const totalCost = sessions.reduce((a, s) => a + (s.cost || 0), 0);
    const avgDuration = sessions.length ? Math.round(sessions.reduce((a, s) => a + (s.duration || 0), 0) / sessions.length) : 0;

    const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <div className="page-content animate-fade-up">
            <h2 className="section-title" style={{ fontSize: '1.3rem', marginBottom: '1.25rem' }}>History & Billing</h2>

            {/* Summary Cards */}
            <div className="grid-3 animate-fade-up" style={{ marginBottom: '1.25rem', animationDelay: '0.05s' }}>
                <div className="card history-stat-card">
                    <div className="hsc-icon" style={{ background: 'var(--color-primary-dim)', color: 'var(--color-primary)' }}>
                        <Zap size={20} />
                    </div>
                    <div>
                        <div className="stat-value">{totalKwh.toFixed(1)}</div>
                        <div className="stat-label">Total kWh</div>
                    </div>
                </div>
                <div className="card history-stat-card">
                    <div className="hsc-icon" style={{ background: 'var(--color-green-dim)', color: 'var(--color-green)' }}>
                        <DollarSign size={20} />
                    </div>
                    <div>
                        <div className="stat-value">${totalCost.toFixed(2)}</div>
                        <div className="stat-label">Total Spent</div>
                    </div>
                </div>
                <div className="card history-stat-card">
                    <div className="hsc-icon" style={{ background: 'var(--color-accent-dim)', color: 'var(--color-accent)' }}>
                        <Clock size={20} />
                    </div>
                    <div>
                        <div className="stat-value">{avgDuration}m</div>
                        <div className="stat-label">Avg Duration</div>
                    </div>
                </div>
            </div>

            {/* Consumption Bar Chart */}
            <div className="card animate-fade-up" style={{ marginBottom: '1.25rem', animationDelay: '0.1s' }}>
                <h3 className="section-title">Consumption per Session</h3>
                <div className="kwh-bars">
                    {sessions.map(s => (
                        <div className="kwh-bar-item" key={s.id}>
                            <div className="kwh-bar-wrap">
                                <div
                                    className="kwh-bar-fill"
                                    style={{ height: `${((s.kwhConsumed || 0) / 70) * 100}%` }}
                                    title={`${s.kwhConsumed || 0} kWh`}
                                />
                            </div>
                            <div className="kwh-bar-label">{new Date(s.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                            <div className="kwh-bar-val">{s.kwhConsumed || 0}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sessions Table */}
            <div className="card animate-fade-up" style={{ animationDelay: '0.15s', padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
                    <h3 className="section-title" style={{ marginBottom: 0 }}>Charging Sessions</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Station</th>
                                <th>Date</th>
                                <th>Duration</th>
                                <th>Energy</th>
                                <th>Cost</th>
                                <th>Invoice</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.map(s => (
                                <tr key={s.id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{s.stationName}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{s.id.toUpperCase()}</div>
                                    </td>
                                    <td style={{ fontSize: '0.85rem' }}>{fmt(s.startTime)}</td>
                                    <td style={{ fontSize: '0.85rem' }}>{s.duration} min</td>
                                    <td>
                                        <span className="badge badge-blue">{s.kwhConsumed || 0} kWh</span>
                                    </td>
                                    <td>
                                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-primary)' }}>
                                            ${(s.cost || 0).toFixed(2)}
                                        </span>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>${s.pricePerKwh || 0}/kWh</div>
                                    </td>
                                    <td>
                                        <button className="btn btn-outline btn-sm" onClick={() => downloadInvoice(s)}>
                                            <Download size={13} /> PDF
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
