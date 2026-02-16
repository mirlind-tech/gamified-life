import { motion, AnimatePresence } from 'framer-motion';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { EMOJIS } from '../utils/emojis';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: ReturnType<typeof useKeyboardShortcuts>['shortcuts'];
  formatKey: ReturnType<typeof useKeyboardShortcuts>['formatKey'];
}

export function KeyboardShortcutsHelp({ isOpen, onClose, shortcuts, formatKey }: KeyboardShortcutsHelpProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
          >
            <div 
              className="bg-bg-secondary border border-border rounded-2xl p-8 max-w-lg w-full max-h-[80vh] overflow-y-auto pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-text-primary mb-2">
                  {EMOJIS.KEYBOARD} Keyboard Shortcuts
                </h2>
                <p className="text-text-secondary">Quick navigation with your keyboard</p>
              </div>

              <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 items-center">
                {shortcuts.map((shortcut) => (
                  <div key={shortcut.key} className="contents">
                    <kbd className="px-3 py-1.5 bg-accent-purple/20 border border-accent-purple/30 rounded-lg font-mono font-bold text-accent-purple text-center min-w-15">
                      {formatKey(shortcut)}
                    </kbd>
                    <span className="text-text-secondary">{shortcut.description}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-border text-center">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-accent-purple hover:bg-accent-purple/80 text-white font-semibold rounded-lg transition-colors"
                >
                  Got it! {EMOJIS.CHECK}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
