import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface PulseProps {
  children: ReactNode;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

export function Pulse({ 
  children, 
  className = '',
  intensity = 'medium'
}: PulseProps) {
  const intensityMap = {
    low: { scale: [1, 1.02, 1], opacity: [0.8, 1, 0.8] },
    medium: { scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] },
    high: { scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] },
  };

  return (
    <motion.div
      animate={intensityMap[intensity]}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function GlowPulse({ 
  children, 
  className = '',
  color = 'rgba(139, 92, 246, 0.5)'
}: { 
  children: ReactNode; 
  className?: string;
  color?: string;
}) {
  return (
    <motion.div
      animate={{
        boxShadow: [
          `0 0 20px ${color}`,
          `0 0 40px ${color}`,
          `0 0 20px ${color}`,
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function BreathingCircle({ 
  className = '',
  size = 200
}: { 
  className?: string;
  size?: number;
}) {
  return (
    <motion.div
      className={`rounded-full bg-linear-to-br from-accent-purple to-accent-cyan ${className}`}
      style={{ width: size, height: size }}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}
