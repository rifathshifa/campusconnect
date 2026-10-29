import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ 
      toast: { 
        success: (msg, dur) => addToast(msg, 'success', dur),
        error: (msg, dur) => addToast(msg, 'error', dur),
        info: (msg, dur) => addToast(msg, 'info', dur),
        warning: (msg, dur) => addToast(msg, 'warning', dur),
        custom: addToast
      } 
    }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="cc-toast-container">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
};

const ToastItem = ({ toast, onClose }) => {
  const { message, type } = toast;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={18} className="text-success" />;
      case 'error':
        return <AlertCircle size={18} className="text-danger" />;
      case 'warning':
        return <AlertTriangle size={18} className="text-warning" />;
      default:
        return <Info size={18} className="text-info" />;
    }
  };

  return (
    <div className={`cc-toast cc-toast-${type} d-flex align-items-center gap-3 p-3 mb-2 rounded shadow`}>
      <div className="cc-toast-icon-wrap d-flex align-items-center justify-content-center">
        {getIcon()}
      </div>
      <div className="cc-toast-message flex-grow-1 small fw-medium">
        {message}
      </div>
      <button onClick={onClose} className="btn btn-sm p-0 border-0 text-light opacity-75 hover-opacity-100 cc-toast-close" style={{ background: 'transparent' }}>
        <X size={14} />
      </button>
    </div>
  );
};
