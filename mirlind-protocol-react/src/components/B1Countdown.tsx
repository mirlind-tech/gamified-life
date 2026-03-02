import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface B1CountdownProps {
  wordsLearned: number;
  ankiStreak: number;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
}

const B1_DEADLINE = new Date('2026-12-31');
const WORDS_GOAL = 3000;
const DAILY_TARGET_WORDS = 12; // ~3000 words / 250 days
const DAILY_TARGET_ANKI = 50;

function getMotivationMessage(daysLeft: number, progressPercent: number): { message: string; emoji: string; urgency: 'low' | 'medium' | 'high' | 'critical' } {
  if (daysLeft < 30) {
    if (progressPercent >= 90) return { message: 'Final push! You\'re ready for B1!', emoji: '🔥', urgency: 'low' };
    if (progressPercent >= 70) return { message: 'Crunch time! Focus on weak areas', emoji: '⚡', urgency: 'high' };
    return { message: 'EMERGENCY MODE: Maximum study hours required', emoji: '🚨', urgency: 'critical' };
  }
  
  if (daysLeft < 100) {
    if (progressPercent >= 70) return { message: 'On track! Keep the momentum', emoji: '✅', urgency: 'low' };
    if (progressPercent >= 50) return { message: 'Pick up the pace. No time to waste', emoji: '⚠️', urgency: 'medium' };
    return { message: 'URGENT: Double your daily study time', emoji: '💀', urgency: 'high' };
  }
  
  if (daysLeft < 200) {
    if (progressPercent >= 50) return { message: 'Steady progress. Stay consistent', emoji: '📈', urgency: 'low' };
    if (progressPercent >= 30) return { message: 'You need more daily exposure', emoji: '⚡', urgency: 'medium' };
    return { message: 'Warning: Study more or miss your goal', emoji: '⚠️', urgency: 'high' };
  }
  
  // More than 200 days
  if (progressPercent >= 30) return { message: 'Good start! Maintain this pace', emoji: '🌟', urgency: 'low' };
  return { message: 'Build the habit now. Future you depends on it', emoji: '🎯', urgency: 'medium' };
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  
  return {
    days: Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24))),
    hours: Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))),
    minutes: Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))),
  };
}

// Circular progress with gradient
function CircularProgress({ 
  value, 
  max, 
  size = 120, 
  strokeWidth = 10,
  color,
  label,
  sublabel
}: { 
  value: number; 
  max: number; 
  size?: number;
  strokeWidth?: number;
  color: string;
  label: string;
  sublabel?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(100, (value / max) * 100);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 10px ${color}60)` }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold font-mono" style={{ color }}>
            {Math.round(percentage)}%
          </span>
          {sublabel && (
            <span className="text-xs text-text-muted">{sublabel}</span>
          )}
        </div>
      </div>
      <span className="text-sm font-medium text-text-secondary mt-2">{label}</span>
    </div>
  );
}

// Flip card for countdown number
function FlipNumber({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative bg-linear-to-b from-white/10 to-white/5 border border-white/10 rounded-xl p-3 min-w-17.5 text-center">
        <span className="text-3xl md:text-4xl font-bold font-mono text-text-primary">
          {value.toString().padStart(2, '0')}
        </span>
        {/* Top shine */}
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent" />
      </div>
      <span className="text-xs text-text-muted mt-2 uppercase tracking-wider">{label}</span>
    </div>
  );
}

export function B1Countdown({ wordsLearned, ankiStreak }: B1CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(B1_DEADLINE));
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Defer setState to avoid synchronous setState in effect warning
    const timeoutId = setTimeout(() => setMounted(true), 0);
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(B1_DEADLINE));
    }, 60000); // Update every minute
    
    return () => {
      clearTimeout(timeoutId);
      clearInterval(timer);
    };
  }, []);
  
  if (!mounted) return null;
  
  const wordsProgress = Math.min(100, (wordsLearned / WORDS_GOAL) * 100);
  const motivation = getMotivationMessage(timeLeft.days, wordsProgress);
  
  // Calculate daily targets needed to catch up
  const wordsRemaining = Math.max(0, WORDS_GOAL - wordsLearned);
  const dailyWordsNeeded = timeLeft.days > 0 ? Math.ceil(wordsRemaining / timeLeft.days) : 0;
  
  // Urgency colors
  const urgencyColors = {
    low: '#10b981',
    medium: '#f59e0b', 
    high: '#f97316',
    critical: '#ef4444'
  };
  
  const urgencyColor = urgencyColors[motivation.urgency];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-3xl p-6 mb-6 overflow-hidden relative"
    >
      {/* Background glow based on urgency */}
      <div 
        className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"
        style={{ backgroundColor: urgencyColor }}
      />
      
      {/* Header */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🇩🇪</span>
            <div>
              <h3 className="text-lg font-bold text-text-primary">B1 Certificate Countdown</h3>
              <p className="text-xs text-text-muted">Deadline: December 31, 2026</p>
            </div>
          </div>
          <div 
            className="px-3 py-1 rounded-full text-xs font-semibold border"
            style={{ 
              borderColor: urgencyColor,
              color: urgencyColor,
              backgroundColor: `${urgencyColor}15`
            }}
          >
            {motivation.urgency === 'low' && 'ON TRACK'}
            {motivation.urgency === 'medium' && 'FOCUS NEEDED'}
            {motivation.urgency === 'high' && 'URGENT'}
            {motivation.urgency === 'critical' && 'CRITICAL'}
          </div>
        </div>
        
        {/* Countdown Timer */}
        <div className="flex justify-center gap-4 mb-8">
          <FlipNumber value={timeLeft.days} label="Days" />
          <span className="text-3xl font-bold text-text-muted self-start mt-3">:</span>
          <FlipNumber value={timeLeft.hours} label="Hours" />
          <span className="text-3xl font-bold text-text-muted self-start mt-3">:</span>
          <FlipNumber value={timeLeft.minutes} label="Minutes" />
        </div>
        
        {/* Motivation Message */}
        <motion.div 
          className="text-center mb-6 p-4 rounded-xl border"
          style={{ 
            borderColor: `${urgencyColor}30`,
            backgroundColor: `${urgencyColor}08`
          }}
          key={motivation.message}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <span className="text-2xl mr-2">{motivation.emoji}</span>
          <span className="text-text-primary font-medium">{motivation.message}</span>
        </motion.div>
        
        {/* Progress Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Words Progress */}
          <CircularProgress 
            value={wordsLearned} 
            max={WORDS_GOAL} 
            size={100}
            strokeWidth={8}
            color="#10b981"
            label="Words"
            sublabel={`${wordsLearned}/${WORDS_GOAL}`}
          />
          
          {/* Streak */}
          <CircularProgress 
            value={ankiStreak} 
            max={365} 
            size={100}
            strokeWidth={8}
            color="#06b6d4"
            label="Streak"
            sublabel={`${ankiStreak} days`}
          />
          
          {/* Daily Target */}
          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/5">
            <span className="text-2xl mb-1">📚</span>
            <span className="text-2xl font-bold font-mono" style={{ color: dailyWordsNeeded > DAILY_TARGET_WORDS ? '#ef4444' : '#10b981' }}>
              {dailyWordsNeeded}
            </span>
            <span className="text-xs text-text-muted text-center">words/day<br/>needed</span>
          </div>
          
          {/* Anki Target */}
          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/5">
            <span className="text-2xl mb-1">🎯</span>
            <span className="text-2xl font-bold font-mono text-accent-cyan">
              {DAILY_TARGET_ANKI}
            </span>
            <span className="text-xs text-text-muted text-center">Anki cards<br/>daily</span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-text-secondary">Overall B1 Progress</span>
            <span className="font-bold" style={{ color: urgencyColor }}>{Math.round(wordsProgress)}%</span>
          </div>
          <div className="h-3 bg-black/40 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full relative"
              style={{ 
                backgroundColor: urgencyColor,
                boxShadow: `0 0 20px ${urgencyColor}50`
              }}
              initial={{ width: 0 }}
              animate={{ width: `${wordsProgress}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            >
              {/* Animated shine */}
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
            </motion.div>
          </div>
          <p className="text-xs text-text-muted mt-2">
            At your current pace, you need <strong className="text-text-primary">{dailyWordsNeeded} words/day</strong> to reach {WORDS_GOAL} by the deadline.
            {dailyWordsNeeded > DAILY_TARGET_WORDS && (
              <span className="text-accent-red ml-1">Increase your daily intake!</span>
            )}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
