import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Shield, User, Lock, Mail, AlertCircle, ChevronRight, Eye, EyeOff } from 'lucide-react';
import './LoginPage.css';

export default function LoginPage() {
    const [role, setRole] = useState('customer');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const fillDemo = (r) => {
        setRole(r);
        setEmail(r === 'admin' ? 'admin@catlink.io' : 'maria@example.com');
        setPassword(r === 'admin' ? 'admin123' : 'password123');
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        await new Promise((r) => setTimeout(r, 800));
        const result = await login(email, password);
        setLoading(false);
        if (!result.success) { setError(result.message); return; }
        const user = JSON.parse(localStorage.getItem('catlink_current_user'));
        navigate(user.role === 'admin' ? '/admin' : '/customer');
    };

    return (
        <div className="login-bg">
            {/* Animated grid background */}
            <div className="login-grid" />
            {/* Glow orbs */}
            <div className="orb orb-1" />
            <div className="orb orb-2" />

            <div className="login-wrapper animate-fade-up">
                {/* Logo */}
                <div className="login-logo">
                    <div className="logo-icon">
                        <Zap size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="logo-title">CatLink</h1>
                        <p className="logo-subtitle">EV Charging Management</p>
                    </div>
                </div>

                {/* Card */}
                <div className="login-card glass">
                    <h2 className="login-heading">Welcome back</h2>
                    <p className="login-subheading">Sign in to your account</p>

                    {/* Role Toggle */}
                    <div className="role-toggle">
                        <button
                            className={`role-btn ${role === 'customer' ? 'active' : ''}`}
                            onClick={() => { setRole('customer'); setError(''); setEmail(''); setPassword(''); }}
                        >
                            <User size={16} />
                            Customer
                        </button>
                        <button
                            className={`role-btn ${role === 'admin' ? 'active' : ''}`}
                            onClick={() => { setRole('admin'); setError(''); setEmail(''); setPassword(''); }}
                        >
                            <Shield size={16} />
                            Admin
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label className="label">Email</label>
                            <div className="input-icon-wrap">
                                <Mail size={16} className="input-icon" />
                                <input
                                    type="email"
                                    className="input-field input-with-icon"
                                    placeholder={role === 'admin' ? 'admin@catlink.io' : 'maria@example.com'}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="label">Password</label>
                            <div className="input-icon-wrap">
                                <Lock size={16} className="input-icon" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="input-field input-with-icon input-with-toggle"
                                    placeholder={showPassword ? 'password' : '••••••••'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(prev => !prev)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="error-msg">
                                <AlertCircle size={15} />
                                {error}
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
                            {loading
                                ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                                : <>Sign In <ChevronRight size={16} /></>
                            }
                        </button>
                    </form>

                    {/* Demo credentials */}
                    <div className="demo-section">
                        <p className="demo-label">Quick demo access</p>
                        <div className="demo-btns">
                            <button className="demo-chip" onClick={() => fillDemo('customer')}>
                                <User size={12} /> Customer Demo
                            </button>
                            <button className="demo-chip" onClick={() => fillDemo('admin')}>
                                <Shield size={12} /> Admin Demo
                            </button>
                        </div>
                    </div>
                </div>

                <p className="login-footer">
                    Secured with 5G · Nokia Network as Code · AI Fraud Shield
                </p>
            </div>
        </div>
    );
}
