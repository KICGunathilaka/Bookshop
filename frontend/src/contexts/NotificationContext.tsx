import React, { createContext, useContext, useRef, useState } from 'react';
import Toast from '../components/Toast';

type ToastType = 'success' | 'error';
type ToastItem = { id: number; type: ToastType; message: string };

type NotificationContextValue = {
  notifySuccess: (message: string) => void;
  notifyError: (message: string) => void;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idCounter = useRef(1);

  function pushToast(type: ToastType, message: string) {
    const id = idCounter.current++;
    const item: ToastItem = { id, type, message };
    setToasts(prev => [...prev, item]);
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }

  const notifySuccess = (message: string) => pushToast('success', message);
  const notifyError = (message: string) => pushToast('error', message);

  return (
    <NotificationContext.Provider value={{ notifySuccess, notifyError }}>
      {children}
      <Toast toasts={toasts} onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </NotificationContext.Provider>
  );
};

export function useNotify(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotify must be used within NotificationProvider');
  return ctx;
}