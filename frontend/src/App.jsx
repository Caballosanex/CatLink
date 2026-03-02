import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import ChargerMap from './components/Map/ChargerMap'
import AgentPanel from './components/Agent/AgentPanel'
import { useStore } from './store/store'

function App() {
  const { connectWebSocket } = useStore()

  useEffect(() => {
    connectWebSocket()
  }, [connectWebSocket])

  return (
    <BrowserRouter>
      <div className="app">
        <header className="app-header">
          <h1>⚡ CatLink</h1>
          <span className="subtitle">Carga Inteligente de VE</span>
        </header>
        
        <main className="app-main">
          <Routes>
            <Route path="/" element={
              <div className="main-layout">
                <div className="map-container">
                  <ChargerMap />
                </div>
                <div className="agent-container">
                  <AgentPanel />
                </div>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
