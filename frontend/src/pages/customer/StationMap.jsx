import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { fetchStations } from '../../services/api';
import { Zap, Users, Wifi, WifiOff, Filter, Brain } from 'lucide-react';
import './StationMap.css';

// Fix Leaflet default icon issue in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const STATUS_COLORS = {
    available: '#00e676',
    high_demand: '#ffb300',
    offline: '#ff3d71',
};
const STATUS_LABELS = {
    available: '🟢 Available',
    high_demand: '🟡 High Demand',
    offline: '🔴 Offline',
};

function makeIcon(status) {
    const color = STATUS_COLORS[status];
    return L.divIcon({
        className: '',
        html: `
      <div style="
        width:32px;height:32px;border-radius:50%;
        background:${color};
        border:3px solid rgba(255,255,255,0.9);
        box-shadow:0 0 14px ${color}99;
        display:flex;align-items:center;justify-content:center;
        font-size:13px;font-weight:700;color:#000;
      ">⚡</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
}

function timeSince(iso) {
    const s = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
}

export default function StationMap() {
    const [minPower, setMinPower] = useState(0);
    const [statusFilter, setStatusFilter] = useState('all');
    const [selected, setSelected] = useState(null);
    const [stations, setStations] = useState([]);

    useEffect(() => {
        fetchStations().then(setStations);
    }, []);

    const filtered = stations.filter(s => {
        if (s.power < minPower) return false;
        if (statusFilter !== 'all' && s.status !== statusFilter) return false;
        return true;
    });

    const center = [41.39, 2.17];

    return (
        <div className="map-shell">
            {/* Filters */}
            <div className="map-filters glass">
                <div className="filter-row">
                    <Filter size={15} />
                    <span className="filter-label">Filter Stations</span>
                </div>
                <div className="filter-controls">
                    <div className="filter-group">
                        <label className="label">Min Power</label>
                        <div className="power-slider-wrap">
                            <input type="range" min="0" max="350" step="50"
                                value={minPower} onChange={e => setMinPower(+e.target.value)}
                                className="power-slider" />
                            <span className="power-val">{minPower > 0 ? `≥${minPower} kW` : 'All'}</span>
                        </div>
                    </div>
                    <div className="filter-group">
                        <label className="label">Status</label>
                        <div className="status-filters">
                            {['all', 'available', 'high_demand', 'offline'].map(s => (
                                <button key={s}
                                    className={`status-chip ${statusFilter === s ? 'active' : ''} chip-${s}`}
                                    onClick={() => setStatusFilter(s)}>
                                    {s === 'all' ? 'All' : STATUS_LABELS[s]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="filter-count">
                    Showing <strong>{filtered.length}</strong> of {stations.length} stations
                </div>
            </div>

            {/* Map */}
            <div className="map-container">
                <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    {filtered.map(station => (
                        <Marker key={station.id} position={[station.lat, station.lng]}
                            icon={makeIcon(station.status)}
                            eventHandlers={{ click: () => setSelected(station) }}>
                            <Popup>
                                <div className="map-popup">
                                    <div className="popup-name">{station.name}</div>
                                    <div className="popup-status">{STATUS_LABELS[station.status]}</div>
                                    <div className="popup-row"><Zap size={12} /> {station.power} kW · {station.connectors} ports</div>
                                    <div className="popup-row"><Wifi size={12} /> Heartbeat: {timeSince(station.lastHeartbeat)}</div>
                                    {station.status !== 'offline' && (
                                        <div className="popup-row ai-row">
                                            <Brain size={12} />
                                            <span>AI predicts <strong>{station.aiOccupancy}%</strong> occupancy</span>
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* Station List Panel */}
            <div className="station-list-panel">
                {filtered.map(s => (
                    <div key={s.id}
                        className={`station-list-item ${selected?.id === s.id ? 'selected' : ''}`}
                        onClick={() => setSelected(s)}>
                        <div className="sli-dot" style={{ background: STATUS_COLORS[s.status] }} />
                        <div className="sli-info">
                            <div className="sli-name">{s.name}</div>
                            <div className="sli-sub">{s.power}kW · {s.connectors} connectors</div>
                        </div>
                        {s.status !== 'offline' && (
                            <div className="sli-ai">
                                <Brain size={11} />
                                {s.aiOccupancy}%
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
