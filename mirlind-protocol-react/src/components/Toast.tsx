import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'xp';
  duration?: number;
  xpAmount?: number;
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration || 3000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      case 'xp': return '✨';
    }
  };

  const getColors = () => {
    switch (toast.type) {
      case 'success': return 'bg-accent-green/20 border-accent-green/50 text-accent-green';
      case 'error': return 'bg-red-500/20 border-red-500/50 text-red-400';
      case 'info': return 'bg-accent-cyan/20 border-accent-cyan/50 text-accent-cyan';
      case 'xp': return 'bg-accent-yellow/20 border-accent-yellow/50 text-accent-yellow';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-lg ${getColors()}`}
    >
      <span className="text-xl">{getIcon()}</span>
      <div className="flex-1">
        <p className="font-medium">{toast.message}</p>
        {toast.xpAmount && (
          <p className="text-sm opacity-80">+{toast.xpAmount} XP</p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="opacity-50 hover:opacity-100 transition-opacity"
      >
        ×
      </button>
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}
