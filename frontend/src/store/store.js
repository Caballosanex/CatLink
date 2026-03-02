import { create } from 'zustand'
import { api } from '../services/api'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws'

export const useStore = create((set, get) => ({
  // Chargers
  chargers: [],
  selectedCharger: null,
  loading: false,
  error: null,

  // Agent logs
  agentLogs: [],

  // WebSocket
  ws: null,
  wsConnected: false,

  // Session
  currentSession: null,
  sessionLoading: false,

  // Demo state
  demoPhone: '+34612345678',
  demoLocation: 'at_charger', // 'at_charger' | 'far_away'

  // Actions
  fetchChargers: async () => {
    set({ loading: true, error: null })
    try {
      const chargers = await api.getChargers()
      set({ chargers, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  selectCharger: (charger) => {
    set({ selectedCharger: charger })
  },

  startSession: async (chargerId) => {
    const { demoPhone, demoLocation, chargers } = get()
    const charger = chargers.find(c => c.id === chargerId)
    
    if (!charger) return

    // Calcular ubicación según demo
    let userLat, userLon
    if (demoLocation === 'at_charger') {
      // Pequeña variación para simular estar cerca
      userLat = charger.lat + (Math.random() - 0.5) * 0.0001
      userLon = charger.lon + (Math.random() - 0.5) * 0.0001
    } else {
      // Lejos del cargador
      userLat = charger.lat + 0.01
      userLon = charger.lon + 0.01
    }

    set({ sessionLoading: true, agentLogs: [] })
    
    try {
      const session = await api.startSession({
        charger_id: chargerId,
        user_phone: demoPhone,
        user_lat: userLat,
        user_lon: userLon
      })
      set({ currentSession: session, sessionLoading: false })
    } catch (error) {
      set({ error: error.message, sessionLoading: false })
    }
  },

  setDemoPhone: (phone) => {
    set({ demoPhone: phone })
  },

  setDemoLocation: (location) => {
    set({ demoLocation: location })
  },

  addAgentLog: (log) => {
    set(state => ({
      agentLogs: [...state.agentLogs, log]
    }))
  },

  clearAgentLogs: () => {
    set({ agentLogs: [] })
  },

  connectWebSocket: () => {
    const ws = new WebSocket(WS_URL)
    
    ws.onopen = () => {
      console.log('WebSocket connected')
      set({ ws, wsConnected: true })
    }
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        if (message.type === 'agent_log') {
          get().addAgentLog(message.data)
        }
      } catch (e) {
        console.error('Error parsing WS message:', e)
      }
    }
    
    ws.onclose = () => {
      console.log('WebSocket disconnected')
      set({ wsConnected: false })
      // Reconectar después de 3 segundos
      setTimeout(() => get().connectWebSocket(), 3000)
    }
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }
}))
