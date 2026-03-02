import { NavLink, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, LayoutDashboard, Map, BatteryCharging, Receipt, LogOut, User } from 'lucide-react';
import CustomerDashboard from '../pages/customer/Dashboard';
import StationMap from '../pages/customer/StationMap';
import Reservation from '../pages/customer/Reservation';
import History from '../pages/customer/History';
import './CustomerLayout.css';

const NAV_ITEMS = [
    { to: '/customer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/customer/map', icon: Map, label: 'Stations' },
    { to: '/customer/reserve', icon: BatteryCharging, label: 'Charge' },
    { to: '/customer/history', icon: Receipt, label: 'History' },
];

export default function CustomerLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <div className="customer-shell">
            {/* Top Navbar */}
            <header className="customer-navbar glass">
                <div className="nav-brand">
                    <div className="nav-logo-icon"><Zap size={18} strokeWidth={2.5} /></div>
                    <span className="nav-logo-text">CatLink</span>
                    <span className="nav-badge badge badge-blue">5G</span>
                </div>
                <div className="nav-right">
                    <div className="nav-user">
                        <div className="avatar">{user?.avatar}</div>
                        <div className="nav-user-info">
                            <span className="nav-user-name">{user?.name}</span>
                            <span className="nav-user-vehicle">{user?.vehicle}</span>
                        </div>
                    </div>
                    <button className="logout-btn" onClick={handleLogout} title="Logout">
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="customer-main">
                <Routes>
                    <Route index element={<Navigate to="/customer/dashboard" replace />} />
                    <Route path="dashboard" element={<CustomerDashboard />} />
                    <Route path="map" element={<StationMap />} />
                    <Route path="reserve" element={<Reservation />} />
                    <Route path="history" element={<History />} />
                </Routes>
            </main>

            {/* Bottom Tab Bar */}
            <nav className="bottom-nav glass">
                {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
                    <NavLink key={to} to={to} className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                        <Icon size={22} />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
