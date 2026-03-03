import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import './Toast.css';

/**
 * Global toast system.
 * Usage from anywhere: window.dispatchEvent(new CustomEvent('catlink:toast', { detail: { message, type } }))
 * Types: 'error' | 'success' | 'info'
 */
export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'error') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const { message, type } = e.detail || {};
      if (message) addToast(message, type || 'error');
    };
    window.addEventListener('catlink:toast', handler);
    return () => window.removeEventListener('catlink:toast', handler);
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon">
            {t.type === 'error' && <AlertTriangle size={16} />}
            {t.type === 'success' && <CheckCircle size={16} />}
            {t.type === 'info' && <Info size={16} />}
          </span>
          <span className="toast-message">{t.message}</span>
          <button className="toast-close" onClick={() => removeToast(t.id)}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

/** Helper to fire a toast from non-React code (like api.js) */
export function showToast(message, type = 'error') {
  window.dispatchEvent(new CustomEvent('catlink:toast', { detail: { message, type } }));
}
