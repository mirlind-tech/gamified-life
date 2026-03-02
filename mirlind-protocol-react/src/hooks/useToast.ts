import { useState, useCallback } from 'react';
import type { Toast } from '../components/Toast';

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    return addToast({ message, type: 'success', duration });
  }, [addToast]);

  const error = useCallback((message: string, duration?: number) => {
    return addToast({ message, type: 'error', duration: duration || 5000 });
  }, [addToast]);

  const info = useCallback((message: string, duration?: number) => {
    return addToast({ message, type: 'info', duration });
  }, [addToast]);

  const xp = useCallback((amount: number, message?: string) => {
    return addToast({
      message: message || 'XP Gained!',
      type: 'xp',
      xpAmount: amount,
      duration: 4000,
    });
  }, [addToast]);

  return {
    toasts,
    removeToast,
    success,
    error,
    info,
    xp,
  };
}
