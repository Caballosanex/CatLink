import { useEffect, useState } from 'react';
import { fetchStations, startChargingSession, refreshOccupancy } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
    User, MapPin, Activity, CheckCircle, ChevronRight, Zap,
    Clock, DollarSign, Navigation, Shield, AlertTriangle
} from 'lucide-react';
import './Reservation.css';

const STEPS = ['Identity', 'Location', 'Demand', 'Confirm'];

/** Haversine distance in km between two lat/lon points */
function distanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function Reservation() {
    const { user } = useAuth();
    const [step, setStep] = useState(0);
    const [locating, setLocating] = useState(false);
    const [locDone, setLocDone] = useState(false);
    const [stations, setStations] = useState([]);
    const [selectedStation, setSelectedStation] = useState(null);
    const [demand, setDemand] = useState(60);
    const [charging, setCharging] = useState(false);
    const [done, setDone] = useState(false);
    const [sessionResult, setSessionResult] = useState(null);
    const [userCoords, setUserCoords] = useState({ lat: 41.387, lon: 2.17 });
    const [locError, setLocError] = useState(null);

    useEffect(() => {
        refreshOccupancy().then(() => fetchStations()).then((data) => {
            setStations(data);
            const available = data.filter((s) => s.status !== 'offline');
            setSelectedStation(available[0] || data[0] || null);
        });
    }, []);

    const batteryStart = 22;
    const kwhNeeded = ((demand - batteryStart) / 100 * 82);
    const minutes = selectedStation ? Math.round((kwhNeeded / selectedStation.power) * 60) : 0;
    const demandMultiplier = selectedStation?.status === 'high_demand' ? 1.4 : 1.0;
    const basePriceKwh = 0.40;
    const priceKwh = (basePriceKwh * demandMultiplier).toFixed(3);
    const totalCost = (kwhNeeded * priceKwh).toFixed(2);

    const handleLocate = () => {
        setLocating(true);
        setLocError(null);
        if (!navigator.geolocation) {
            setLocError('Geolocation not supported by your browser');
            setLocating(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
                setUserCoords(coords);
                // Auto-select nearest available station
                const available = stations.filter(s => s.status !== 'offline');
                if (available.length) {
                    const nearest = available.reduce((best, s) => {
                        const d = distanceKm(coords.lat, coords.lon, s.lat, s.lng);
                        return d < best.d ? { s, d } : best;
                    }, { s: available[0], d: Infinity });
                    setSelectedStation(nearest.s);
                }
                setLocating(false);
                setLocDone(true);
            },
            (err) => {
                // Fallback to Barcelona default for demo
                console.warn('Geolocation error, using Barcelona default:', err.message);
                setLocError(`GPS unavailable: ${err.message}. Using default location.`);
                const coords = { lat: 41.387, lon: 2.17 };
                setUserCoords(coords);
                // Auto-select nearest available station with fallback coords
                const available = stations.filter(s => s.status !== 'offline');
                if (available.length) {
                    const nearest = available.reduce((best, s) => {
                        const d = distanceKm(coords.lat, coords.lon, s.lat, s.lng);
                        return d < best.d ? { s, d } : best;
                    }, { s: available[0], d: Infinity });
                    setSelectedStation(nearest.s);
                }
                setLocating(false);
                setLocDone(true);
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
        );
    };

    const handleStart = async () => {
        if (!selectedStation) return;
        setCharging(true);
        const result = await startChargingSession(
            selectedStation.id,
            user?.phone,
            userCoords.lat,
            userCoords.lon,
            user?.id,
            demand
        );
        setSessionResult(result);
        setCharging(false);
        setDone(true);
    };

    const isApproved = sessionResult?.status === 'approved';

    if (done) return (
        <div className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem' }}>
            <div className="success-ring" style={!isApproved ? { borderColor: 'var(--color-red, #ef4444)' } : undefined}>
                {isApproved
                    ? <CheckCircle size={48} color="var(--color-green)" />
                    : <AlertTriangle size={48} color="var(--color-red, #ef4444)" />}
            </div>
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: 8 }}>
                    {isApproved ? 'Charging Started!' : 'Session Rejected'}
                </h2>
                <p style={{ color: 'var(--color-text-muted)' }}>
                    {isApproved ? (
                        <>Session active at <strong>{selectedStation?.name}</strong>.<br />
                        Estimated time: <strong>{minutes} minutes</strong></>
                    ) : (
                        <>
                            {sessionResult?.decision === 'REJECT_FRAUD' && <strong style={{ color: 'var(--color-red, #ef4444)' }}>Fraud risk detected.</strong>}
                            {sessionResult?.decision === 'REJECT_LOCATION' && <strong style={{ color: 'var(--color-red, #ef4444)' }}>Location verification failed.</strong>}
                            {sessionResult?.decision === 'REJECT_IDENTITY' && <strong style={{ color: 'var(--color-red, #ef4444)' }}>Identity verification failed.</strong>}
                            {!['REJECT_FRAUD', 'REJECT_LOCATION', 'REJECT_IDENTITY'].includes(sessionResult?.decision) && (
                                <strong style={{ color: 'var(--color-red, #ef4444)' }}>Verification failed.</strong>
                            )}
                            <br />
                            <span style={{ fontSize: '0.9rem' }}>Please contact support or try again later.</span>
                        </>
                    )}
                </p>
            </div>
            <button className="btn btn-primary" onClick={() => { setDone(false); setSessionResult(null); setStep(0); setLocDone(false); }}>
                {isApproved ? 'Start Another Session' : 'Try Again'}
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
                        <>
                            <button className="btn btn-primary locate-btn" onClick={handleLocate} disabled={locating}>
                                {locating
                                    ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Locating…</>
                                    : <><MapPin size={16} /> Detect My Location</>}
                            </button>
                            {locError && !locDone && (
                                <div style={{ color: 'var(--color-yellow)', fontSize: '0.8rem', marginTop: 8 }}>
                                    <AlertTriangle size={13} style={{ verticalAlign: 'middle' }} /> {locError}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="loc-result">
                            <CheckCircle size={20} color="var(--color-green)" />
                            <div>
                                <div style={{ fontWeight: 600 }}>Location Verified ✓</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{userCoords.lat.toFixed(4)}° N, {userCoords.lon.toFixed(4)}° E — Barcelona, ES</div>
                                {locError && <div style={{ fontSize: '0.75rem', color: 'var(--color-yellow)', marginTop: 2 }}>{locError}</div>}
                                <div style={{ fontSize: '0.78rem', color: 'var(--color-green)', marginTop: 4 }}>
                                    {stations.filter(s => s.status !== 'offline' && distanceKm(userCoords.lat, userCoords.lon, s.lat, s.lng) <= 2).length} stations within 2km
                                </div>
                            </div>
                        </div>
                    )}
                    {locDone && (
                        <div style={{ marginTop: '1.25rem' }}>
                            <label className="label">Select Station</label>
                            <div className="station-select-list">
                                {stations
                                    .filter(s => s.status !== 'offline')
                                    .map(s => ({ ...s, _dist: distanceKm(userCoords.lat, userCoords.lon, s.lat, s.lng) }))
                                    .sort((a, b) => a._dist - b._dist)
                                    .map(s => (
                                    <div key={s.id}
                                        className={`station-option ${selectedStation?.id === s.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedStation(s)}>
                                        <div className={`sopt-dot ${s.status}`} />
                                        <div className="sopt-info">
                                            <div className="sopt-name">{s.name}</div>
                                            <div className="sopt-sub">{s.power}kW · {s.connectors} ports · {s._dist < 1 ? `${(s._dist * 1000).toFixed(0)}m` : `${s._dist.toFixed(1)}km`}</div>
                                        </div>
                                        {selectedStation?.id === s.id && <CheckCircle size={16} color="var(--color-primary)" />}
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
                         <div className="confirm-row"><span>Station</span><strong>{selectedStation?.name}</strong></div>
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
