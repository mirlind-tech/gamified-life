import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface ScaleOnHoverProps {
  children: ReactNode;
  scale?: number;
  className?: string;
  onClick?: () => void;
}

export function ScaleOnHover({ 
  children, 
  scale = 1.05,
  className = '',
  onClick
}: ScaleOnHoverProps) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

export function CardHover({ 
  children, 
  className = '',
  onClick
}: { 
  children: ReactNode; 
  className?: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      whileHover={{ 
        y: -4,
        boxShadow: '0 20px 40px rgba(139, 92, 246, 0.15)'
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
