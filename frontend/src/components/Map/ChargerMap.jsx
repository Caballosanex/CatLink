import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useStore } from '../../store/store'

// Fix para iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Iconos personalizados por estado
const createIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const icons = {
  available: createIcon('green'),
  in_use: createIcon('yellow'),
  offline: createIcon('red'),
  maintenance: createIcon('grey')
}

export default function ChargerMap() {
  const { chargers, fetchChargers, startSession, sessionLoading, demoPhone, demoLocation, setDemoPhone, setDemoLocation } = useStore()

  useEffect(() => {
    fetchChargers()
  }, [fetchChargers])

  // Centro de Barcelona
  const center = [41.3874, 2.1686]

  return (
    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {chargers.map(charger => (
        <Marker
          key={charger.id}
          position={[charger.lat, charger.lon]}
          icon={icons[charger.status] || icons.available}
        >
          <Popup>
            <div className="charger-popup">
              <h3>⚡ {charger.name}</h3>
              <p>{charger.address}</p>
              <p><strong>{charger.power_kw} kW</strong> · {charger.connectors.join(', ')}</p>
              <p>
                <span className={`status ${charger.status}`}>
                  {charger.status === 'available' && '🟢 Disponible'}
                  {charger.status === 'in_use' && '🟡 En uso'}
                  {charger.status === 'offline' && '🔴 Offline'}
                  {charger.status === 'maintenance' && '⚪ Mantenimiento'}
                </span>
              </p>
              
              {/* Demo Controls */}
              <div style={{ marginTop: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Demo - Teléfono:</label>
                <select 
                  value={demoPhone} 
                  onChange={(e) => setDemoPhone(e.target.value)}
                  style={{ width: '100%', padding: '0.25rem', marginBottom: '0.5rem', fontSize: '0.8rem' }}
                >
                  <option value="+34612345678">Maria (+34612345678)</option>
                  <option value="+34666666666">Fraude (+34666666666)</option>
                  <option value="+34655443322">Carlos (+34655443322)</option>
                </select>
                
                <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Demo - Ubicación:</label>
                <select 
                  value={demoLocation} 
                  onChange={(e) => setDemoLocation(e.target.value)}
                  style={{ width: '100%', padding: '0.25rem', marginBottom: '0.5rem', fontSize: '0.8rem' }}
                >
                  <option value="at_charger">En el cargador</option>
                  <option value="far_away">Lejos (1km)</option>
                </select>
              </div>
              
              <button 
                className="charge-button"
                onClick={() => startSession(charger.id)}
                disabled={charger.status !== 'available' || sessionLoading}
              >
                {sessionLoading ? 'Evaluando...' : '⚡ Iniciar Carga'}
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
