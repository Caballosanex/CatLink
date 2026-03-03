import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchSessions } from '../../services/api';
import { Zap, Clock, DollarSign, Download, BarChart3, Calendar } from 'lucide-react';
import { jsPDF } from 'jspdf';
import './History.css';

function downloadInvoice(session) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 25;

    // ── Header bar ──
    doc.setFillColor(20, 184, 166); // teal-500
    doc.rect(0, 0, W, 38, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text('CATLINK', margin, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Intelligent EV Charging · Nokia Network as Code', margin, 28);

    // ── Invoice title ──
    y = 50;
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('CHARGING INVOICE', margin, y);

    // ── Invoice meta (right aligned) ──
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const dateStr = new Date(session.startTime).toLocaleDateString('en-US', { dateStyle: 'long' });
    doc.text(`Date: ${dateStr}`, W - margin, y - 6, { align: 'right' });
    doc.text(`Invoice #: ${session.id.toUpperCase()}`, W - margin, y, { align: 'right' });

    // ── Divider ──
    y += 8;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(margin, y, W - margin, y);

    // ── Session details ──
    y += 12;
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);

    const details = [
        ['Station', session.stationName || '-'],
        ['Start Time', session.startTime ? new Date(session.startTime).toLocaleString() : '-'],
        ['End Time', session.endTime ? new Date(session.endTime).toLocaleString() : '-'],
        ['Duration', `${session.duration || 0} minutes`],
    ];

    for (const [label, value] of details) {
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(value, margin + 40, y);
        y += 7;
    }

    // ── Billing table ──
    y += 6;
    // Table header
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y - 5, W - margin * 2, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('Description', margin + 3, y);
    doc.text('Quantity', W / 2, y, { align: 'center' });
    doc.text('Amount', W - margin - 3, y, { align: 'right' });

    // Table row
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);
    doc.text('EV Charging Energy', margin + 3, y);
    doc.text(`${(session.kwhConsumed || 0).toFixed(1)} kWh`, W / 2, y, { align: 'center' });
    doc.text(`€${(session.cost || 0).toFixed(2)}`, W - margin - 3, y, { align: 'right' });

    // Unit price row
    y += 7;
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`@ €${session.pricePerKwh || 0}/kWh`, margin + 3, y);

    // ── Total ──
    y += 10;
    doc.setDrawColor(20, 184, 166);
    doc.setLineWidth(0.8);
    doc.line(W / 2 + 10, y, W - margin, y);
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(20, 184, 166);
    doc.text('TOTAL', W / 2 + 10, y);
    doc.text(`€${(session.cost || 0).toFixed(2)}`, W - margin - 3, y, { align: 'right' });

    // ── Footer ──
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 5, W - margin, footerY - 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Powered by CatLink · Nokia Network as Code · Open Gateway Hackathon 2026', W / 2, footerY, { align: 'center' });
    doc.text('Thank you for charging with us!', W / 2, footerY + 5, { align: 'center' });

    doc.save(`catlink-invoice-${session.id}.pdf`);
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
                        <div className="stat-value">€{totalCost.toFixed(2)}</div>
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
                                            €{(s.cost || 0).toFixed(2)}
                                        </span>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>€{s.pricePerKwh || 0}/kWh</div>
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
