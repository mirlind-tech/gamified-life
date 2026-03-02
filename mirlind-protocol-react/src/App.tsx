import { useCallback, useEffect } from 'react';
import { GameProvider } from './store/GameContext';
import { useGame } from './store/useGame';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { ToastContainer } from './components/ToastContainer';
import { Confetti } from './components/Confetti';
import { CyberpunkBackground } from './components/CyberpunkBackground';
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { usePWA } from './hooks/usePWA';
import { EMOJIS } from './utils/emojis';
import { motion, AnimatePresence } from 'framer-motion';
import { syncOfflineQueue } from './services/authApi';
import { trackEvent } from './utils/telemetry';

// Loading Screen
function LoadingScreen() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-bg-primary">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="text-6xl mb-4">{EMOJIS.CROWN}</div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Protocol</h1>
        <div className="flex items-center gap-2 text-text-secondary">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-5 h-5 border-2 border-accent-purple border-t-transparent rounded-full"
          />
          <span>Loading...</span>
        </div>
      </motion.div>
    </div>
  );
}

// Inner component that has access to GameContext
function AppContent() {
  const { state, setView } = useGame();
  const { isInstallable, isOnline, install } = usePWA();
  
  // Memoize callbacks to prevent infinite loops
  const handleSwitchView = useCallback((view: string) => setView(view as Parameters<typeof setView>[0]), [setView]);
  
  const { shortcuts, showHelp, setShowHelp, formatKey } = useKeyboardShortcuts(
    handleSwitchView,
    undefined // No need for external close handler
  );

  useEffect(() => {
    const handleOnline = () => {
      syncOfflineQueue().catch(() => undefined);
    };

    window.addEventListener('online', handleOnline);
    if (navigator.onLine) {
      syncOfflineQueue().catch(() => undefined);
    }

    return () => window.removeEventListener('online', handleOnline);
  }, []);

  useEffect(() => {
    void trackEvent('app_loaded', {
      path: window.location.pathname,
    });
  }, []);

  useEffect(() => {
    void trackEvent('view_changed', {
      view: state.currentView,
    });
  }, [state.currentView]);

  // Show loading screen while initializing
  if (state.isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="h-screen flex flex-col bg-bg-primary">
      {/* Offline indicator */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-accent-yellow/20 border-b border-accent-yellow/30 px-4 py-2 text-center text-sm text-accent-yellow"
          >
            {EMOJIS.WARNING} Offline mode - Data will sync when connected
          </motion.div>
        )}
      </AnimatePresence>

      {/* PWA Install button */}
      <AnimatePresence>
        {isInstallable && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-accent-purple/20 border-b border-accent-purple/30 px-4 py-2 flex items-center justify-between"
          >
            <span className="text-sm text-text-primary">
              {EMOJIS.DOWNLOAD} Install Mirlind Protocol for offline access
            </span>
            <button
              onClick={install}
              className="px-3 py-1 bg-accent-purple-dark hover:bg-accent-purple-dark/80 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Install
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>
      
      <CyberpunkBackground />
      <ToastContainer />
      <Confetti />
      
      <KeyboardShortcutsHelp
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        shortcuts={shortcuts}
        formatKey={formatKey}
      />
    </div>
  );
}

function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

export default App;
