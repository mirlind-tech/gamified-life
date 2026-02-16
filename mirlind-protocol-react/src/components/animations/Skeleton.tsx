import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export function Skeleton({ className = '', width, height }: SkeletonProps) {
  return (
    <motion.div
      className={`bg-white/5 rounded-lg overflow-hidden ${className}`}
      style={{ width, height }}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="w-full h-full bg-linear-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
    </motion.div>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton width="60px" height="60px" className="rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height="20px" />
          <Skeleton width="40%" height="14px" />
        </div>
      </div>
      <Skeleton width="100%" height="40px" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6 space-y-3">
      <Skeleton width="40px" height="40px" className="rounded-lg" />
      <Skeleton width="60%" height="32px" />
      <Skeleton width="80%" height="16px" />
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 glass-card rounded-xl">
      <Skeleton width="48px" height="48px" className="rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton width="70%" height="18px" />
        <Skeleton width="50%" height="14px" />
      </div>
      <Skeleton width="80px" height="36px" className="rounded-lg" />
    </div>
  );
}

export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  // Use deterministic widths based on index instead of Math.random
  const widths = Array.from({ length: lines }, (_, i) => {
    // Create a pseudo-random pattern: 60%, 75%, 90%, 65%, 80%, 95%, ...
    const patterns = ['60%', '75%', '90%', '65%', '80%', '95%', '70%', '85%'];
    return patterns[i % patterns.length];
  });
  
  return (
    <div className="space-y-2">
      {widths.map((width, i) => (
        <Skeleton 
          key={i} 
          width={width}
          height="16px" 
        />
      ))}
    </div>
  );
}
