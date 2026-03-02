import { useEffect, useState } from 'react';
import { Search, Shield, ShieldOff, Lock, AlertTriangle, CheckCircle } from 'lucide-react';
import { fetchUsers, updateUser } from '../../services/api';


const RISK_CFG = {
    low: { badge: 'badge-green', icon: <CheckCircle size={12} />, label: 'Low' },
    medium: { badge: 'badge-yellow', icon: <AlertTriangle size={12} />, label: 'Medium' },
    high: { badge: 'badge-red', icon: <AlertTriangle size={12} />, label: 'High' },
};
const VER_CFG = {
    verified: { badge: 'badge-blue', label: 'Verified' },
    pending: { badge: 'badge-yellow', label: 'Pending' },
};

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [riskFilter, setRiskFilter] = useState('all');
    const [confirm, setConfirm] = useState(null); // { userId, action }

    const filtered = users.filter(u => {
        const q = search.toLowerCase();
        if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
        if (riskFilter !== 'all' && u.riskLevel !== riskFilter) return false;
        return true;
    });

    useEffect(() => {
        fetchUsers().then(setUsers);
    }, []);

    const applyAction = async () => {
        if (!confirm) return;
        const target = users.find((u) => u.id === confirm.userId);
        if (!target) return;

        const updates =
            confirm.action === 'block'
                ? { isBlocked: !target.isBlocked }
                : { isSuspended: !target.isSuspended };

        const updatedUser = await updateUser(confirm.userId, updates);
        setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
        setConfirm(null);
    };

    return (
        <div className="page-content animate-fade-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700 }}>User Management</h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>{users.length} registered users</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-red">{users.filter(u => u.riskLevel === 'high').length} High Risk</span>
                    <span className="badge badge-red">{users.filter(u => u.isBlocked).length} Blocked</span>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} />
                    <input className="input-field" style={{ paddingLeft: '2.5rem' }}
                        placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {['all', 'low', 'medium', 'high'].map(r => (
                        <button key={r}
                            className={`btn btn-sm ${riskFilter === r ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setRiskFilter(r)}>
                            {r === 'all' ? 'All Risk' : r.charAt(0).toUpperCase() + r.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* User Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filtered.map(u => {
                    const rk = RISK_CFG[u.riskLevel];
                    const vr = VER_CFG[u.verificationStatus];
                    return (
                        <div key={u.id} className={`card user-card ${u.isBlocked ? 'blocked' : ''}`}>
                            <div className="user-card-main">
                                <div className="user-avatar">{u.avatar}</div>
                                <div className="user-info">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: 700 }}>{u.name}</span>
                                        {u.isBlocked && <span className="badge badge-red"><Lock size={11} /> Blocked</span>}
                                        {u.isSuspended && !u.isBlocked && <span className="badge badge-yellow">Suspended</span>}
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{u.email}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: 2 }}>{u.vehicle}</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                    <span className={`badge ${rk.badge}`}>{rk.icon} {rk.label} Risk</span>
                                    <span className={`badge ${vr.badge}`}><Shield size={11} /> {vr.label}</span>
                                </div>
                            </div>
                            <div className="user-actions">
                                <button
                                    className={`btn btn-sm ${u.isBlocked ? 'btn-outline' : 'btn-danger'}`}
                                    onClick={() => setConfirm({ userId: u.id, action: 'block' })}>
                                    <Lock size={13} /> {u.isBlocked ? 'Unblock' : 'Block'}
                                </button>
                                <button
                                    className={`btn btn-sm ${u.isSuspended ? 'btn-outline' : 'btn-outline'}`}
                                    style={u.isSuspended ? { borderColor: 'var(--color-yellow)', color: 'var(--color-yellow)' } : {}}
                                    onClick={() => setConfirm({ userId: u.id, action: 'suspend' })}>
                                    <ShieldOff size={13} /> {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                                </button>
                            </div>
                        </div>
                    );
                })}
                {filtered.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>No users found</div>
                )}
            </div>

            {/* Confirm Modal */}
            {confirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: '1rem' }}
                    onClick={() => setConfirm(null)}>
                    <div className="glass" style={{ maxWidth: 380, width: '100%', borderRadius: 'var(--radius-xl)', padding: '1.5rem' }}
                        onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 12 }}>Confirm Action</h3>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                            Are you sure you want to <strong>{users.find(u => u.id === confirm?.userId)?.[confirm.action === 'block' ? 'isBlocked' : 'isSuspended'] ? 'un' + confirm.action : confirm.action}</strong> this user?
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={applyAction}>Confirm</button>
                            <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setConfirm(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .user-card { transition: border-color 0.2s; }
        .user-card.blocked { border-color: rgba(255,61,113,0.35); background: linear-gradient(135deg,var(--color-surface),rgba(255,61,113,0.04)); }
        .user-card-main { display:flex;align-items:center;gap:1rem;margin-bottom:0.75rem;flex-wrap:wrap; }
        .user-avatar { width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--color-primary),var(--color-accent));display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0; }
        .user-info { flex:1;min-width:200px; }
        .user-actions { display:flex;gap:0.5rem;flex-wrap:wrap;border-top:1px solid var(--color-border);padding-top:0.75rem; }
      `}</style>
        </div>
    );
}
