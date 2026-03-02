import { useStore } from '../../store/store'
import AgentLogEntry from './AgentLogEntry'

export default function AgentPanel() {
  const { agentLogs, wsConnected, currentSession, clearAgentLogs } = useStore()

  return (
    <div className="agent-panel">
      <h2>
        🤖 Agente CatLink
        <span style={{ 
          marginLeft: 'auto', 
          fontSize: '0.7rem', 
          color: wsConnected ? '#22c55e' : '#ef4444' 
        }}>
          {wsConnected ? '● Conectado' : '○ Desconectado'}
        </span>
      </h2>
      
      <div className="agent-logs">
        {agentLogs.length === 0 ? (
          <div style={{ 
            padding: '2rem', 
            textAlign: 'center', 
            color: '#64748b',
            fontSize: '0.9rem'
          }}>
            <p>👆 Selecciona un cargador e inicia una carga</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
              Los logs del agente aparecerán aquí en tiempo real
            </p>
          </div>
        ) : (
          agentLogs.map((log, i) => (
            <AgentLogEntry key={i} log={log} />
          ))
        )}
        
        {currentSession && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: currentSession.decision === 'APPROVE' ? '#f0fdf4' : '#fef2f2',
            borderRadius: '8px',
            border: `2px solid ${currentSession.decision === 'APPROVE' ? '#22c55e' : '#ef4444'}`
          }}>
            <h4 style={{ marginBottom: '0.5rem' }}>
              {currentSession.decision === 'APPROVE' ? '✅ Carga Autorizada' : '❌ Carga Rechazada'}
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              {currentSession.reason}
            </p>
            {currentSession.user_message && (
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                {currentSession.user_message}
              </p>
            )}
          </div>
        )}
      </div>
      
      {agentLogs.length > 0 && (
        <div style={{ padding: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
          <button 
            onClick={clearAgentLogs}
            style={{
              width: '100%',
              padding: '0.5rem',
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              color: '#64748b'
            }}
          >
            Limpiar logs
          </button>
        </div>
      )}
    </div>
  )
}
