import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { EMOJIS } from '../utils/emojis';
import { fireLevelUpConfetti } from '../utils/confetti';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  newLevel: number;
  pillar?: string;
}

export function LevelUpModal({ isOpen, onClose, newLevel, pillar }: LevelUpModalProps) {
  useEffect(() => {
    if (isOpen) {
      fireLevelUpConfetti();
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  const pillarNames: Record<string, string> = {
    craft: 'Craft',
    vessel: 'Vessel',
    tongue: 'Tongue',
    principle: 'Principle',
    capital: 'Capital',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-accent-yellow/20 blur-3xl rounded-full" />
            
            <div className="relative glass-card rounded-3xl p-8 text-center border-2 border-accent-yellow/50 max-w-md">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-6xl mb-4"
              >
                {EMOJIS.TROPHY}
              </motion.div>
              
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-accent-yellow mb-2"
              >
                LEVEL UP!
              </motion.h2>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-5xl font-bold text-text-primary mb-2">
                  {newLevel}
                </p>
                {pillar && (
                  <p className="text-accent-cyan text-lg">
                    {pillarNames[pillar] || pillar} Pillar
                  </p>
                )}
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-text-muted mt-4 text-sm"
              >
                "Strength never comes from comfort. It comes from struggle."
              </motion.p>
              
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                onClick={onClose}
                className="mt-6 px-8 py-3 bg-accent-yellow text-black font-bold rounded-xl hover:bg-accent-yellow/80 transition-colors"
              >
                CONTINUE
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
