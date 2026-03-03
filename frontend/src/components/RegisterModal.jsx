import { useState } from 'react';
import { X, User, Mail, Lock, Phone, Car, CreditCard, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { registerUser } from '../services/api';
import './RegisterModal.css';

const INITIAL = { name: '', email: '', password: '', phone: '', vehicle: '', vehicle_plate: '' };

export default function RegisterModal({ open, onClose }) {
    const [form, setForm] = useState({ ...INITIAL });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showPwd, setShowPwd] = useState(false);

    if (!open) return null;

    const set = (field) => (e) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
        setErrors(prev => ({ ...prev, [field]: '' }));
        setApiError('');
    };

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Name is required';
        if (!form.email.trim()) errs.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format';
        if (!form.password.trim()) errs.password = 'Password is required';
        else if (form.password.length < 6) errs.password = 'Min 6 characters';
        if (!form.phone.trim()) errs.phone = 'Phone is required';
        if (!form.vehicle.trim()) errs.vehicle = 'Vehicle is required';
        if (!form.vehicle_plate.trim()) errs.vehicle_plate = 'Plate is required';
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length) return;

        setLoading(true);
        setApiError('');
        try {
            await registerUser(form);
            setSuccess(true);
        } catch (err) {
            setApiError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setForm({ ...INITIAL });
        setErrors({});
        setApiError('');
        setSuccess(false);
        setShowPwd(false);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-container glass animate-fade-up" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={handleClose}><X size={18} /></button>

                {success ? (
                    <div className="register-success">
                        <div className="success-icon"><CheckCircle size={48} /></div>
                        <h3>Account Created!</h3>
                        <p>You can now sign in with your credentials.</p>
                        <button className="btn btn-primary" onClick={handleClose} style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}>
                            Back to Login
                        </button>
                    </div>
                ) : (
                    <>
                        <h2 className="modal-title">Create Account</h2>
                        <p className="modal-subtitle">Join CatLink EV Charging</p>

                        <form onSubmit={handleSubmit} className="register-form" noValidate>
                            {/* Name */}
                            <div className="form-group">
                                <label className="label">Full Name</label>
                                <div className="input-icon-wrap">
                                    <User size={16} className="input-icon" />
                                    <input
                                        className={`input-field input-with-icon${errors.name ? ' input-error' : ''}`}
                                        placeholder="John Doe"
                                        value={form.name}
                                        onChange={set('name')}
                                    />
                                </div>
                                {errors.name && <span className="field-error"><AlertCircle size={13} />{errors.name}</span>}
                            </div>

                            {/* Email */}
                            <div className="form-group">
                                <label className="label">Email</label>
                                <div className="input-icon-wrap">
                                    <Mail size={16} className="input-icon" />
                                    <input
                                        type="email"
                                        className={`input-field input-with-icon${errors.email ? ' input-error' : ''}`}
                                        placeholder="you@example.com"
                                        value={form.email}
                                        onChange={set('email')}
                                    />
                                </div>
                                {errors.email && <span className="field-error"><AlertCircle size={13} />{errors.email}</span>}
                            </div>

                            {/* Password */}
                            <div className="form-group">
                                <label className="label">Password</label>
                                <div className="input-icon-wrap">
                                    <Lock size={16} className="input-icon" />
                                    <input
                                        type={showPwd ? 'text' : 'password'}
                                        className={`input-field input-with-icon input-with-toggle${errors.password ? ' input-error' : ''}`}
                                        placeholder={showPwd ? 'password' : '••••••••'}
                                        value={form.password}
                                        onChange={set('password')}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPwd(p => !p)}
                                        tabIndex={-1}
                                    >
                                        {showPwd ? <Eye size={16} /> : <EyeOff size={16} />}
                                    </button>
                                </div>
                                {errors.password && <span className="field-error"><AlertCircle size={13} />{errors.password}</span>}
                            </div>

                            {/* Phone */}
                            <div className="form-group">
                                <label className="label">Phone</label>
                                <div className="input-icon-wrap">
                                    <Phone size={16} className="input-icon" />
                                    <input
                                        type="tel"
                                        className={`input-field input-with-icon${errors.phone ? ' input-error' : ''}`}
                                        placeholder="+34 612 345 678"
                                        value={form.phone}
                                        onChange={set('phone')}
                                    />
                                </div>
                                {errors.phone && <span className="field-error"><AlertCircle size={13} />{errors.phone}</span>}
                            </div>

                            {/* Two-col row: Vehicle + Plate */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="label">Vehicle</label>
                                    <div className="input-icon-wrap">
                                        <Car size={16} className="input-icon" />
                                        <input
                                            className={`input-field input-with-icon${errors.vehicle ? ' input-error' : ''}`}
                                            placeholder="Tesla Model 3"
                                            value={form.vehicle}
                                            onChange={set('vehicle')}
                                        />
                                    </div>
                                    {errors.vehicle && <span className="field-error"><AlertCircle size={13} />{errors.vehicle}</span>}
                                </div>
                                <div className="form-group">
                                    <label className="label">Plate</label>
                                    <div className="input-icon-wrap">
                                        <CreditCard size={16} className="input-icon" />
                                        <input
                                            className={`input-field input-with-icon${errors.vehicle_plate ? ' input-error' : ''}`}
                                            placeholder="1234 ABC"
                                            value={form.vehicle_plate}
                                            onChange={set('vehicle_plate')}
                                        />
                                    </div>
                                    {errors.vehicle_plate && <span className="field-error"><AlertCircle size={13} />{errors.vehicle_plate}</span>}
                                </div>
                            </div>

                            {apiError && (
                                <div className="error-msg">
                                    <AlertCircle size={15} />
                                    {apiError}
                                </div>
                            )}

                            <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
                                {loading
                                    ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                                    : 'Create Account'
                                }
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
