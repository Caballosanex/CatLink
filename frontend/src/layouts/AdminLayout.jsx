import { NavLink, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, LayoutDashboard, Cpu, AlertOctagon, Users, LogOut, Shield, Menu, X } from 'lucide-react';
import { useState } from 'react';
import AdminDashboard from '../pages/admin/AdminDashboard';
import StationManagement from '../pages/admin/StationManagement';
import OfflineMonitoring from '../pages/admin/OfflineMonitoring';
import UserManagement from '../pages/admin/UserManagement';
import './AdminLayout.css';

const NAV_ITEMS = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Smart Grid', sub: 'Overview' },
    { to: '/admin/stations', icon: Cpu, label: 'Stations', sub: 'Management' },
    { to: '/admin/monitoring', icon: AlertOctagon, label: 'Monitoring', sub: 'Offline Alerts' },
    { to: '/admin/users', icon: Users, label: 'Users', sub: 'Management' },
];

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <div className="admin-shell">
            {/* Sidebar */}
            <aside className={`admin-sidebar glass ${menuOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <div className="nav-logo-icon"><Zap size={18} strokeWidth={2.5} /></div>
                    <div>
                        <div className="sidebar-title">CatLink</div>
                        <div className="sidebar-sub">Admin Console</div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {NAV_ITEMS.map(({ to, icon: Icon, label, sub }) => (
                        <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}
                            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                            <div className="sidebar-icon"><Icon size={18} /></div>
                            <div className="sidebar-item-text">
                                <div className="sidebar-item-label">{label}</div>
                                <div className="sidebar-item-sub">{sub}</div>
                            </div>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.7rem' }}>{user?.avatar}</div>
                        <div className="sidebar-user-info">
                            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{user?.name}</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>Administrator</div>
                        </div>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}><LogOut size={16} /></button>
                </div>
            </aside>

            {/* Mobile overlay */}
            {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />}

            {/* Main Area */}
            <div className="admin-body">
                {/* Mobile top bar */}
                <header className="admin-topbar glass">
                    <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
                        {menuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Admin Console</span>
                    <div className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                        <Shield size={11} /> Admin
                    </div>
                </header>

                <main className="admin-main">
                    <Routes>
                        <Route index element={<Navigate to="/admin/dashboard" replace />} />
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="stations" element={<StationManagement />} />
                        <Route path="monitoring" element={<OfflineMonitoring />} />
                        <Route path="users" element={<UserManagement />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}
