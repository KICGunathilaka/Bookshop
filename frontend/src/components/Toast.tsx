import React from 'react';

type ToastType = 'success' | 'error';
type ToastItem = { id: number; type: ToastType; message: string };

export default function Toast({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  if (!toasts || toasts.length === 0) return null;
  const latest = toasts[toasts.length - 1];
  return (
    <div className="popup-overlay" aria-live="polite" aria-atomic="true">
      <div className={`popup ${latest.type}`} role="status">
        <div className="icon" aria-hidden="true">{latest.type === 'success' ? '✔' : '⚠'}</div>
        {latest.type === 'error' && (
          <div className="message">{latest.message}</div>
        )}
        <button className="close" aria-label="Dismiss" onClick={() => onDismiss(latest.id)}>×</button>
      </div>
    </div>
  );
}