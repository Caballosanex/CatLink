import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const api = {
  // Chargers
  getChargers: async () => {
    const response = await client.get('/api/chargers')
    return response.data
  },

  getCharger: async (id) => {
    const response = await client.get(`/api/chargers/${id}`)
    return response.data
  },

  getChargerStatus: async (id) => {
    const response = await client.get(`/api/chargers/${id}/status`)
    return response.data
  },

  // Sessions
  startSession: async (data) => {
    const response = await client.post('/api/sessions/start', data)
    return response.data
  },

  stopSession: async (sessionId) => {
    const response = await client.post(`/api/sessions/${sessionId}/stop`)
    return response.data
  },

  getSessions: async () => {
    const response = await client.get('/api/sessions')
    return response.data
  }
}
