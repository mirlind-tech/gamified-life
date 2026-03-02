import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface TabTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Animated transition wrapper for tab content
 * Provides consistent slide-in animation across all tabs
 */
export function TabTransition({ children, className = 'space-y-6' }: TabTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
