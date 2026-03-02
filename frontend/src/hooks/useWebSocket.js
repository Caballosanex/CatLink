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
    if (!mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING) return;

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${proto}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (mountedRef.current) setConnected(true);
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
          reconnectTimer.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        // Let onclose handle reconnection
      };
    } catch {
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
      const ws = wsRef.current;
      if (ws) {
        // Null all handlers so orphaned sockets can't trigger state updates
        ws.onopen = null;
        ws.onclose = null;
        ws.onerror = null;
        ws.onmessage = null;
        // Only close if fully OPEN — never close a CONNECTING socket
        // (closing CONNECTING is what causes the browser console error).
        // Orphaned CONNECTING sockets with nulled handlers will fail
        // silently and get garbage collected.
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
        wsRef.current = null;
      }
    };
  }, [connect]);

  const clearLogs = useCallback(() => setLogs([]), []);

  return { logs, connected, clearLogs };
}
