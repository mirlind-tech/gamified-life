import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SlideInPanel({ 
  children, 
  isOpen,
  direction = 'right',
  className = ''
}: { 
  children: ReactNode; 
  isOpen: boolean;
  direction?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
}) {
  const directions = {
    left: { x: '-100%', y: 0 },
    right: { x: '100%', y: 0 },
    top: { x: 0, y: '-100%' },
    bottom: { x: 0, y: '100%' },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ ...directions[direction], opacity: 0 }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          exit={{ ...directions[direction], opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ModalOverlay({ 
  children, 
  isOpen,
  onClose,
  className = ''
}: { 
  children: ReactNode; 
  isOpen: boolean;
  onClose?: () => void;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`fixed z-50 ${className}`}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
