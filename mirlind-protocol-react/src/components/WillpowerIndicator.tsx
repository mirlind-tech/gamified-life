import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getWillpowerStatus, getWillpowerColor, getWillpowerMessage } from '../utils/willpower';

interface WillpowerIndicatorProps {
  current: number;
  max: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function WillpowerIndicator({ 
  current, 
  max, 
  showLabel = true,
  size = 'md' 
}: WillpowerIndicatorProps) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  const status = getWillpowerStatus(current, max);
  const color = getWillpowerColor(status);
  const message = getWillpowerMessage(status);

  const sizeClasses = {
    sm: { bar: 'h-1.5', text: 'text-xs' },
    md: { bar: 'h-2', text: 'text-sm' },
    lg: { bar: 'h-3', text: 'base' },
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'exhausted': return '💀';
      case 'low': return '😰';
      case 'moderate': return '😐';
      case 'high': return '💪';
      case 'peak': return '🔥';
    }
  };

  const getPulseAnimation = () => {
    if (status === 'exhausted' || status === 'low') {
      return {
        scale: [1, 1.02, 1],
        transition: { duration: 1, repeat: Infinity }
      };
    }
    return {};
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className={`flex items-center justify-between mb-1 ${sizeClasses[size].text}`}>
          <div className="flex items-center gap-1.5">
            <span>{getStatusIcon()}</span>
            <span className="font-medium text-text-primary">Willpower</span>
            <span 
              className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
              style={{ 
                backgroundColor: `${color}20`,
                color: color 
              }}
            >
              {status.toUpperCase()}
            </span>
          </div>
          <span className="text-text-muted font-mono">
            {Math.round(current)}/{max}
          </span>
        </div>
      )}
      
      {/* Progress Bar */}
      <motion.div 
        className={`w-full ${sizeClasses[size].bar} bg-black/30 rounded-full overflow-hidden`}
        animate={getPulseAnimation()}
      >
        <motion.div
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}40`
          }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
      </motion.div>
      
      {/* Status Message - only show when critical */}
      {(status === 'exhausted' || status === 'low') && showLabel && (
        <motion.p 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs mt-1.5 text-red-400 font-medium"
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}

// Stat decay indicator component
interface StatDecayIndicatorProps {
  stat: string;
  value: number;
  daysSinceUsed: number;
  gracePeriod: number;
  isAtrophying: boolean;
}

export function StatDecayIndicator({ 
  stat, 
  value, 
  daysSinceUsed, 
  gracePeriod,
  isAtrophying 
}: StatDecayIndicatorProps) {
  const getStatusColor = () => {
    if (isAtrophying) return '#ef4444'; // Red
    if (daysSinceUsed >= gracePeriod) return '#f97316'; // Orange
    if (daysSinceUsed >= gracePeriod * 0.7) return '#eab308'; // Yellow
    return '#22c55e'; // Green
  };

  const getStatusText = () => {
    if (isAtrophying) return 'ATROPHYING';
    if (daysSinceUsed >= gracePeriod) return 'CRITICAL';
    if (daysSinceUsed >= gracePeriod * 0.7) return 'STALE';
    return 'FRESH';
  };

  return (
    <div 
      className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10"
      style={{ borderColor: isAtrophying ? '#ef444440' : undefined }}
    >
      <div className="flex items-center gap-2">
        <span className="capitalize font-medium text-text-primary">{stat}</span>
        <span 
          className="text-xs px-1.5 py-0.5 rounded font-semibold"
          style={{ 
            backgroundColor: `${getStatusColor()}20`,
            color: getStatusColor() 
          }}
        >
          {getStatusText()}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-text-muted text-sm">
          {daysSinceUsed}d / {gracePeriod}d
        </span>
        <span className="font-mono font-bold text-text-primary">{value}</span>
      </div>
    </div>
  );
}
