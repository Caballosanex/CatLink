export default function AgentLogEntry({ log }) {
  const getIcon = () => {
    if (log.event === 'start') return '🚀'
    if (log.event === 'decision') {
      return log.decision === 'APPROVE' ? '✅' : '❌'
    }
    
    switch (log.tool) {
      case 'verify_location': return '📍'
      case 'verify_number': return '🔐'
      case 'check_sim_swap': return '🛡️'
      case 'activate_qod': return '⚡'
      default: return '🔧'
    }
  }
  
  const getMessage = () => {
    if (log.event === 'start') return log.message
    if (log.event === 'decision') {
      return `DECISIÓN: ${log.decision} - ${log.reason}`
    }
    
    const result = log.output
    switch (log.tool) {
      case 'verify_location':
        if (result.verified) {
          return `Ubicación verificada (${result.distance_m}m del cargador)`
        } else {
          return `Usuario NO está en el cargador (${result.distance_m}m de distancia)`
        }
      case 'verify_number':
        return result.verified ? 'Identidad verificada' : 'Identidad NO verificada'
      case 'check_sim_swap':
        if (result.swapped_recently) {
          return `⚠️ SIM SWAP detectado - Riesgo: ${result.risk_level}`
        }
        return 'Sin cambios de SIM recientes'
      case 'activate_qod':
        return `QoD activado (${result.session_id})`
      default:
        return JSON.stringify(result)
    }
  }
  
  const getStatusClass = () => {
    if (log.event === 'start') return 'pending'
    if (log.event === 'decision') {
      return log.decision === 'APPROVE' ? 'success' : 'error'
    }
    if (log.output?.verified === false || log.output?.swapped_recently === true) {
      return 'error'
    }
    return 'success'
  }
  
  const formatTime = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleTimeString('es-ES')
    } catch {
      return ''
    }
  }
  
  return (
    <div className={`log-entry ${getStatusClass()}`}>
      <span className="log-time">{formatTime(log.timestamp)}</span>
      <span className="log-icon">{getIcon()}</span>
      <span className="log-message">{getMessage()}</span>
    </div>
  )
}
