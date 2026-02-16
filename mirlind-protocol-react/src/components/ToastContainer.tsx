import { useGame } from '../store/useGame';

const toastStyles = {
  success: 'bg-accent-green/90 border-accent-green',
  error: 'bg-accent-red/90 border-accent-red',
  warning: 'bg-accent-yellow/90 border-accent-yellow text-black',
  info: 'bg-accent-cyan/90 border-accent-cyan',
  default: 'bg-bg-card border-border',
};

export function ToastContainer() {
  const { state } = useGame();
  const { toasts } = state;

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`
            px-6 py-3 rounded-xl border backdrop-blur-sm shadow-lg
            animate-slide-up min-w-75 max-w-md
            ${toastStyles[toast.type] || toastStyles.default}
          `}
        >
          <p className={`font-medium ${toast.type === 'warning' ? 'text-black' : 'text-white'}`}>
            {toast.message}
          </p>
        </div>
      ))}
    </div>
  );
}
