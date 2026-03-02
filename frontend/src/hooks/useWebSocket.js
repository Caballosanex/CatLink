import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Auto-reconnecting WebSocket hook for CatLink agent logs.
 * Connects to /ws (proxied by Vite to ws://backend:8000/ws).
 */
export default function useWebSocket() {
  const [logs, setLogs] = useState([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${proto}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (mountedRef.current) setConnected(true);
        // Clear any pending reconnect
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
          reconnectTimer.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'agent_log' && msg.data) {
            setLogs((prev) => [...prev, { ...msg.data, _id: Date.now() + Math.random() }]);
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (mountedRef.current) {
          setConnected(false);
          // Auto-reconnect after 3s
          reconnectTimer.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      // Schedule reconnect on connection failure
      if (mountedRef.current) {
        reconnectTimer.current = setTimeout(connect, 3000);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  const clearLogs = useCallback(() => setLogs([]), []);

  return { logs, connected, clearLogs };
}
