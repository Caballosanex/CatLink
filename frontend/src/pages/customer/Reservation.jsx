import { useState } from 'react';
import { MOCK_STATIONS } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import {
    User, MapPin, Activity, CheckCircle, ChevronRight, Zap,
    Clock, DollarSign, Navigation, Shield, AlertTriangle
} from 'lucide-react';
import './Reservation.css';

const STEPS = ['Identity', 'Location', 'Demand', 'Confirm'];

const availableStations = MOCK_STATIONS.filter(s => s.status !== 'offline');

export default function Reservation() {
    const { user } = useAuth();
    const [step, setStep] = useState(0);
    const [locating, setLocating] = useState(false);
    const [locDone, setLocDone] = useState(false);
    const [selectedStation, setSelectedStation] = useState(availableStations[0]);
    const [demand, setDemand] = useState(60);
    const [charging, setCharging] = useState(false);
    const [done, setDone] = useState(false);

    const batteryStart = 22;
    const kwhNeeded = ((demand - batteryStart) / 100 * 82);
    const minutes = Math.round((kwhNeeded / selectedStation.power) * 60);
    const demandMultiplier = selectedStation.status === 'high_demand' ? 1.4 : 1.0;
    const basePriceKwh = 0.40;
    const priceKwh = (basePriceKwh * demandMultiplier).toFixed(3);
    const totalCost = (kwhNeeded * priceKwh).toFixed(2);

    const handleLocate = () => {
        setLocating(true);
        setTimeout(() => { setLocating(false); setLocDone(true); }, 2000);
    };

    const handleStart = () => {
        setCharging(true);
        setTimeout(() => { setCharging(false); setDone(true); }, 2000);
    };

    if (done) return (
        <div className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem' }}>
            <div className="success-ring">
                <CheckCircle size={48} color="var(--color-green)" />
            </div>
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: 8 }}>Charging Started!</h2>
                <p style={{ color: 'var(--color-text-muted)' }}>
                    Session active at <strong>{selectedStation.name}</strong>.<br />
                    Estimated time: <strong>{minutes} minutes</strong>
                </p>
            </div>
            <button className="btn btn-primary" onClick={() => { setDone(false); setStep(0); setLocDone(false); }}>
                Start Another Session
            </button>
        </div>
    );

    return (
        <div className="page-content animate-fade-up">
            <h2 className="section-title" style={{ fontSize: '1.3rem', marginBottom: '1.5rem' }}>Reserve & Start Charging</h2>

            {/* Step Indicator */}
            <div className="step-indicator">
                {STEPS.map((s, i) => (
                    <div key={s} className={`step-item ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
                        <div className="step-circle">
                            {i < step ? <CheckCircle size={16} /> : <span>{i + 1}</span>}
                        </div>
                        <span className="step-label">{s}</span>
                        {i < STEPS.length - 1 && <div className={`step-line ${i < step ? 'done' : ''}`} />}
                    </div>
                ))}
            </div>

            {/* Step 0: Identity */}
            {step === 0 && (
                <div className="step-card card animate-fade-up">
                    <div className="step-card-header"><User size={20} color="var(--color-primary)" /><h3>Identity Confirmation</h3></div>
                    <div className="identity-grid">
                        <div className="id-field"><span className="label">Full Name</span><span className="id-val">{user?.name}</span></div>
                        <div className="id-field"><span className="label">Vehicle</span><span className="id-val">{user?.vehicle}</span></div>
                        <div className="id-field"><span className="label">Plate</span><span className="id-val">{user?.vehiclePlate}</span></div>
                        <div className="id-field">
                            <span className="label">Verification</span>
                            <span className={`badge ${user?.verificationStatus === 'verified' ? 'badge-green' : 'badge-yellow'}`}>
                                {user?.verificationStatus === 'verified' ? <><CheckCircle size={12} /> Verified</> : <><AlertTriangle size={12} /> Pending</>}
                            </span>
                        </div>
                    </div>
                    <div className={`fraud-alert ${user?.riskLevel === 'high' ? 'danger' : user?.riskLevel === 'medium' ? 'warn' : 'ok'}`}>
                        <Shield size={16} />
                        <span>
                            {user?.riskLevel === 'high'
                                ? '⚠️ SIM Swap Alert detected. Proceed with caution.'
                                : user?.riskLevel === 'medium'
                                    ? 'Moderate risk profile. Additional verification may apply.'
                                    : '✓ No fraud risk signals detected. Identity clear.'}
                        </span>
                    </div>
                    <button className="btn btn-primary step-next" onClick={() => setStep(1)}>
                        Confirm Identity <ChevronRight size={16} />
                    </button>
                </div>
            )}

            {/* Step 1: Location */}
            {step === 1 && (
                <div className="step-card card animate-fade-up">
                    <div className="step-card-header"><Navigation size={20} color="var(--color-primary)" /><h3>Location Verification</h3></div>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                        We'll use your GPS to verify you're near a registered station.
                    </p>
                    {!locDone ? (
                        <button className="btn btn-primary locate-btn" onClick={handleLocate} disabled={locating}>
                            {locating
                                ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Locating…</>
                                : <><MapPin size={16} /> Detect My Location</>}
                        </button>
                    ) : (
                        <div className="loc-result">
                            <CheckCircle size={20} color="var(--color-green)" />
                            <div>
                                <div style={{ fontWeight: 600 }}>Location Verified ✓</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>40.7128° N, 74.0060° W — New York, NY</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--color-green)', marginTop: 4 }}>3 stations within 2km</div>
                            </div>
                        </div>
                    )}
                    {locDone && (
                        <div style={{ marginTop: '1.25rem' }}>
                            <label className="label">Select Station</label>
                            <div className="station-select-list">
                                {availableStations.slice(0, 4).map(s => (
                                    <div key={s.id}
                                        className={`station-option ${selectedStation.id === s.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedStation(s)}>
                                        <div className={`sopt-dot ${s.status}`} />
                                        <div className="sopt-info">
                                            <div className="sopt-name">{s.name}</div>
                                            <div className="sopt-sub">{s.power}kW · {s.connectors} ports</div>
                                        </div>
                                        {selectedStation.id === s.id && <CheckCircle size={16} color="var(--color-primary)" />}
                                    </div>
                                ))}
                            </div>
                            <button className="btn btn-primary step-next" onClick={() => setStep(2)}>
                                Continue <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Demand */}
            {step === 2 && (
                <div className="step-card card animate-fade-up">
                    <div className="step-card-header"><Activity size={20} color="var(--color-primary)" /><h3>Demand Calculation</h3></div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="label">Target Battery Level: <strong style={{ color: 'var(--color-primary)' }}>{demand}%</strong></label>
                        <input type="range" min="30" max="100" step="5"
                            value={demand} onChange={e => setDemand(+e.target.value)}
                            className="power-slider" style={{ width: '100%', marginTop: 8 }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                            <span>30%</span><span>100%</span>
                        </div>
                    </div>

                    <div className="demand-stats grid-2">
                        <div className="card" style={{ padding: '0.85rem' }}>
                            <div className="label">Energy Needed</div>
                            <div className="stat-value" style={{ fontSize: '1.5rem' }}>{kwhNeeded.toFixed(1)} <span style={{ fontSize: '0.9rem', fontWeight: 400 }}>kWh</span></div>
                        </div>
                        <div className="card" style={{ padding: '0.85rem' }}>
                            <div className="label">Est. Duration</div>
                            <div className="stat-value" style={{ fontSize: '1.5rem' }}>{minutes} <span style={{ fontSize: '0.9rem', fontWeight: 400 }}>min</span></div>
                        </div>
                        <div className="card" style={{ padding: '0.85rem' }}>
                            <div className="label">Price / kWh</div>
                            <div className="stat-value" style={{ fontSize: '1.5rem', color: selectedStation.status === 'high_demand' ? 'var(--color-yellow)' : 'var(--color-green)' }}>
                                ${priceKwh}
                            </div>
                            {selectedStation.status === 'high_demand' && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-yellow)', marginTop: 3 }}>+40% demand surcharge</div>
                            )}
                        </div>
                        <div className="card" style={{ padding: '0.85rem' }}>
                            <div className="label">Total Estimated</div>
                            <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}>${totalCost}</div>
                        </div>
                    </div>
                    <button className="btn btn-primary step-next" onClick={() => setStep(3)} style={{ marginTop: '1rem' }}>
                        Review & Confirm <ChevronRight size={16} />
                    </button>
                </div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
                <div className="step-card card animate-fade-up">
                    <div className="step-card-header"><Zap size={20} color="var(--color-primary)" /><h3>Confirm & Start</h3></div>
                    <div className="confirm-rows">
                        <div className="confirm-row"><span>Station</span><strong>{selectedStation.name}</strong></div>
                        <div className="confirm-row"><span>Driver</span><strong>{user?.name}</strong></div>
                        <div className="confirm-row"><span>Vehicle</span><strong>{user?.vehicle}</strong></div>
                        <div className="confirm-row"><span>Target Battery</span><strong>{demand}%</strong></div>
                        <div className="confirm-row"><span>Energy</span><strong>{kwhNeeded.toFixed(1)} kWh</strong></div>
                        <div className="confirm-row"><span>Est. Time</span><strong>{minutes} minutes</strong></div>
                        <div className="confirm-row"><span>Price/kWh</span><strong>${priceKwh}</strong></div>
                        <div className="confirm-row total-row"><span>Total Cost</span><strong style={{ color: 'var(--color-primary)', fontSize: '1.1rem' }}>${totalCost}</strong></div>
                    </div>
                    <button className="btn btn-primary step-next start-btn" onClick={handleStart} disabled={charging}>
                        {charging
                            ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Starting…</>
                            : <><Zap size={18} /> Start Charging Now</>}
                    </button>
                    <button className="btn btn-outline step-next" style={{ marginTop: 8, justifyContent: 'center' }} onClick={() => setStep(0)}>
                        Start Over
                    </button>
                </div>
            )}
        </div>
    );
}
