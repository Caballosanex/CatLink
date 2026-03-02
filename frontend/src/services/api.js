
const API_BASE = '/api';

function toJson(response) {
  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }
  return response.json();
}

export function mapCharger(c) {
  return {
    id: c.id,
    name: c.name,
    address: c.address,
    lat: c.lat,
    lng: c.lon,
    power: c.power_kw,
    connectors: Array.isArray(c.connectors) ? c.connectors.length : c.connectors,
    status: c.status === 'in_use' ? 'high_demand' : c.status,
    zone: c.zone,
    city: 'Barcelona',
    lastHeartbeat: c.last_heartbeat || c.lastHeartbeat,
    aiOccupancy: c.ai_occupancy ?? c.aiOccupancy ?? 0,
  };
}

export function mapSession(s) {
  return {
    id: s.id,
    stationId: s.charger_id,
    stationName: s.station_name || s.stationName,
    userId: s.user_id || s.userId,
    startTime: s.created_at,
    endTime: s.ended_at || s.endTime,
    duration: s.duration_min ?? s.duration,
    kwhConsumed: s.kwh_consumed ?? s.kwhConsumed,
    cost: s.cost,
    pricePerKwh: s.price_per_kwh ?? s.pricePerKwh,
    status: s.status,
    decision: s.decision,
    batteryStart: s.battery_start ?? s.batteryStart ?? null,
    batteryTarget: s.battery_target ?? s.batteryTarget ?? null,
  };
}

export function mapUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    avatar: u.avatar,
    vehicle: u.vehicle,
    vehiclePlate: u.vehicle_plate ?? u.vehiclePlate,
    verificationStatus: u.verification_status ?? u.verificationStatus,
    riskLevel: u.risk_level ?? u.riskLevel,
    isBlocked: u.is_blocked ?? u.isBlocked,
    isSuspended: u.is_suspended ?? u.isSuspended,
    joinDate: u.join_date ?? u.joinDate,
  };
}

export async function refreshOccupancy() {
  try {
    await fetch(`${API_BASE}/chargers/refresh-occupancy`, { method: 'POST' }).then(toJson);
  } catch (err) {
    // Silently fail — occupancy will stay at last known value
  }
}

export async function fetchStations() {
  try {
    const data = await fetch(`${API_BASE}/chargers`).then(toJson);
    return data.map(mapCharger);
  } catch (err) {
    return [];
  }
}

export async function fetchSessions(userId) {
  try {
    const url = userId
      ? `${API_BASE}/users/${userId}/sessions`
      : `${API_BASE}/sessions`;
    const data = await fetch(url).then(toJson);
    return data.map(mapSession);
  } catch (err) {
    return [];
  }
}

export async function loginUser(email, password) {
  try {
    const data = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(toJson);
    return mapUser(data);
  } catch (err) {
    return null;
  }
}

export async function startChargingSession(
  chargerId,
  userPhone,
  userLat,
  userLon,
  userId,
  batteryTarget
) {
  try {
    const data = await fetch(`${API_BASE}/sessions/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        charger_id: chargerId,
        user_phone: userPhone,
        user_lat: userLat,
        user_lon: userLon,
        user_id: userId,
        battery_target: batteryTarget || null,
      }),
    }).then(toJson);
    return mapSession(data);
  } catch (err) {
    const fallback = {
      id: `ses_${Math.random().toString(16).slice(2, 8)}`,
      userId,
      stationId: chargerId,
      stationName: 'Charging Session',
      startTime: new Date().toISOString(),
      status: 'approved',
      duration: 0,
      kwhConsumed: 0,
      cost: 0,
      pricePerKwh: 0.4,
    };
    return fallback;
  }
}

export async function stopChargingSession(sessionId) {
  try {
    const data = await fetch(`${API_BASE}/sessions/${sessionId}/stop`, {
      method: 'POST',
    }).then(toJson);
    return mapSession(data);
  } catch (err) {
    return null;
  }
}

export async function fetchUsers() {
  try {
    const data = await fetch(`${API_BASE}/users`).then(toJson);
    return data.map(mapUser);
  } catch (err) {
    return [];
  }
}

export async function updateUser(userId, updates) {
  try {
    const data = await fetch(`${API_BASE}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        is_blocked: updates.isBlocked,
        is_suspended: updates.isSuspended,
        risk_level: updates.riskLevel,
      }),
    }).then(toJson);
    return mapUser(data);
  } catch (err) {
    return null;
  }
}
