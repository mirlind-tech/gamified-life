import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { logger } from '../utils/logger';
import { EMOJIS } from '../utils/emojis';

interface CategoryScore {
  name: string;
  score: number; // 1-10
  weight: number; // percentage
  icon: string;
  color: string;
  description: string;
}

interface WeeklyScore {
  weekStart: string; // ISO date string
  categories: CategoryScore[];
  totalScore: number;
  notes: string;
}

const STORAGE_KEY = 'mirlind-weekly-scores';

const DEFAULT_CATEGORIES: CategoryScore[] = [
  { name: 'Job Ready', score: 5, weight: 30, icon: '💼', color: '#06b6d4', description: 'Applications, portfolio output, interview actions' },
  { name: 'Finance', score: 5, weight: 20, icon: '💰', color: '#10b981', description: 'Daily expense control and savings consistency' },
  { name: 'Coding Depth', score: 5, weight: 20, icon: '💻', color: '#8b5cf6', description: 'Deep work quality, commits, shipped improvements' },
  { name: 'Body', score: 5, weight: 15, icon: '💪', color: '#ec4899', description: 'Training consistency and recovery quality' },
  { name: 'German', score: 5, weight: 10, icon: '🇩🇪', color: '#f59e0b', description: 'No-zero-day language progress' },
  { name: 'Recovery', score: 5, weight: 5, icon: '🌙', color: '#64748b', description: 'Sleep discipline and energy management' },
];

// Get current week's start date (Sunday)
function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

function formatWeekLabel(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const endDate = new Date(date);
  endDate.setDate(date.getDate() + 6);
  return `${date.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
}

// Circular progress component
function CircularProgress({ 
  score, 
  max = 10, 
  color, 
  size = 80, 
  strokeWidth = 8,
  label,
  icon
}: { 
  score: number; 
  max?: number; 
  color: string; 
  size?: number;
  strokeWidth?: number;
  label: string;
  icon: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = score / max;
  const strokeDashoffset = circumference - (percentage * circumference);
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg className="transform -rotate-90" width={size} height={size}>
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
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 6px ${color}50)` }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl">{icon}</span>
          <span className="text-lg font-bold font-mono" style={{ color }}>
            {score}
          </span>
        </div>
      </div>
      <span className="text-xs font-medium text-text-secondary mt-2">{label}</span>
    </div>
  );
}

// Score slider component
function ScoreSlider({ 
  category, 
  onChange 
}: { 
  category: CategoryScore; 
  onChange: (score: number) => void;
}) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{category.icon}</span>
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-text-primary">{category.name}</span>
            <span className="text-xs text-text-muted">{category.weight}% weight</span>
          </div>
          <p className="text-xs text-text-muted">{category.description}</p>
        </div>
        <span className="text-2xl font-bold font-mono" style={{ color: category.color }}>
          {category.score}
        </span>
      </div>
      
      <div className="relative">
        <input
          type="range"
          min="1"
          max="10"
          step="0.5"
          value={category.score}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${category.color} 0%, ${category.color} ${(category.score / 10) * 100}%, rgba(255,255,255,0.1) ${(category.score / 10) * 100}%, rgba(255,255,255,0.1) 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-text-muted mt-1">
          <span>1</span>
          <span>5</span>
          <span>10</span>
        </div>
      </div>
    </div>
  );
}

export function WeeklyScorecard() {
  const [scores, setScores] = useState<WeeklyScore[]>([]);
  const [currentWeek, setCurrentWeek] = useState<Date>(getWeekStart());
  const [isEditing, setIsEditing] = useState(false);
  const [currentCategories, setCurrentCategories] = useState<CategoryScore[]>(DEFAULT_CATEGORIES);
  const [notes, setNotes] = useState('');
  
  // Load scores from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Defer setState to avoid synchronous setState in effect warning
        setTimeout(() => {
          setScores(parsed);
          
          // Check if current week exists
          const weekStartStr = currentWeek.toISOString().split('T')[0];
          const existingScore = parsed.find((s: WeeklyScore) => s.weekStart === weekStartStr);
          
          if (existingScore) {
            setCurrentCategories(existingScore.categories);
            setNotes(existingScore.notes);
          }
        }, 0);
      } catch {
        logger.error('Failed to parse saved scores');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Calculate total score
  const totalScore = currentCategories.reduce((sum, cat) => {
    return sum + (cat.score * (cat.weight / 100) * 10); // Max 100 points
  }, 0);
  
  // Save current score
  const saveScore = () => {
    const weekStartStr = currentWeek.toISOString().split('T')[0];
    const newScore: WeeklyScore = {
      weekStart: weekStartStr,
      categories: [...currentCategories],
      totalScore,
      notes
    };
    
    const updatedScores = [...scores.filter(s => s.weekStart !== weekStartStr), newScore];
    updatedScores.sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime());
    
    setScores(updatedScores);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedScores));
    setIsEditing(false);
  };
  
  // Update category score
  const updateCategoryScore = (index: number, score: number) => {
    setCurrentCategories(prev => prev.map((cat, i) => 
      i === index ? { ...cat, score } : cat
    ));
  };
  
  // Navigate weeks
  const navigateWeek = (direction: number) => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction * 7));
    setCurrentWeek(newWeek);
    
    // Load existing score for that week if it exists
    const weekStartStr = newWeek.toISOString().split('T')[0];
    const existingScore = scores.find(s => s.weekStart === weekStartStr);
    
    if (existingScore) {
      setCurrentCategories(existingScore.categories);
      setNotes(existingScore.notes);
    } else {
      setCurrentCategories(DEFAULT_CATEGORIES.map(c => ({ ...c, score: 5 })));
      setNotes('');
    }
  };
  
  // Get score status color
  const getScoreStatus = (score: number) => {
    if (score >= 80) return { color: '#10b981', label: 'EXCELLENT', emoji: '🔥' };
    if (score >= 60) return { color: '#06b6d4', label: 'GOOD', emoji: '✅' };
    if (score >= 40) return { color: '#f59e0b', label: 'AVERAGE', emoji: '⚠️' };
    return { color: '#ef4444', label: 'NEEDS WORK', emoji: '💀' };
  };
  
  const status = getScoreStatus(totalScore);
  const isCurrentWeek = currentWeek.getTime() === getWeekStart().getTime();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-3xl p-6 mb-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{EMOJIS.CHART}</span>
          <div>
            <h3 className="text-xl font-bold text-text-primary">Weekly Scorecard</h3>
            <p className="text-xs text-text-muted">Rate yourself every Sunday. Target: 80+ points</p>
          </div>
        </div>
        
        {/* Week navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            ←
          </button>
          <span className="text-sm font-medium text-text-secondary min-w-35 text-center">
            {formatWeekLabel(currentWeek)}
          </span>
          <button
            onClick={() => navigateWeek(1)}
            disabled={isCurrentWeek}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-30"
          >
            →
          </button>
        </div>
      </div>
      
      {/* Total Score Display */}
      <div className="flex flex-col md:flex-row items-center gap-8 mb-8 p-6 rounded-2xl bg-linear-to-br from-white/5 to-transparent border border-white/10">
        {/* Main score circle */}
        <div className="relative">
          <svg width="160" height="160" className="transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="12"
            />
            <motion.circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke={status.color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${(totalScore / 100) * 440} 440`}
              initial={{ strokeDashoffset: 440 }}
              animate={{ strokeDashoffset: 440 - ((totalScore / 100) * 440) }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              style={{ filter: `drop-shadow(0 0 20px ${status.color}50)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold font-mono" style={{ color: status.color }}>
              {totalScore.toFixed(1)}
            </span>
            <span className="text-xs text-text-muted mt-1">/ 100</span>
          </div>
        </div>
        
        {/* Score status */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
            <span className="text-3xl">{status.emoji}</span>
            <span className="text-2xl font-bold" style={{ color: status.color }}>
              {status.label}
            </span>
          </div>
          <p className="text-text-secondary mb-4">
            {totalScore >= 80 
              ? 'Outstanding week! You\'re on track for transformation.' 
              : totalScore >= 60 
                ? 'Good progress. Push harder next week.' 
                : 'Time to refocus. Remember your goals.'}
          </p>
          
          {/* Target indicator */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: status.color }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, totalScore)}%` }}
                transition={{ duration: 1 }}
              />
            </div>
            <span className="text-xs text-text-muted whitespace-nowrap">Target: 80+</span>
          </div>
        </div>
        
        {/* Edit/Save button */}
        <button
          onClick={() => isEditing ? saveScore() : setIsEditing(true)}
          className="px-6 py-3 rounded-xl font-semibold transition-all"
          style={{ 
            backgroundColor: isEditing ? status.color : 'rgba(255,255,255,0.1)',
            color: isEditing ? '#000' : '#fff'
          }}
        >
          {isEditing ? 'Save Score' : 'Rate This Week'}
        </button>
      </div>
      
      {/* Category Scores */}
      {isEditing ? (
        <div className="space-y-3 mb-6">
          {currentCategories.map((cat, index) => (
            <ScoreSlider
              key={cat.name}
              category={cat}
              onChange={(score) => updateCategoryScore(index, score)}
            />
          ))}
          
          {/* Notes field */}
          <div className="mt-4">
            <label htmlFor="week-notes" className="text-sm text-text-secondary mb-2 block">Week Notes</label>
            <textarea
              id="week-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What went well? What needs improvement?"
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-text-primary placeholder:text-text-muted resize-none h-24 focus:outline-none focus:border-accent-purple"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {currentCategories.map((cat) => (
            <CircularProgress
              key={cat.name}
              score={cat.score}
              max={10}
              color={cat.color}
              size={80}
              label={cat.name}
              icon={cat.icon}
            />
          ))}
        </div>
      )}
      
      {/* Previous scores summary */}
      {scores.length > 0 && !isEditing && (
        <div className="mt-8 pt-6 border-t border-white/10">
          <h4 className="text-sm font-semibold text-text-secondary mb-4">Previous Weeks</h4>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {scores.slice(0, 8).map((score) => {
              const scoreStatus = getScoreStatus(score.totalScore);
              return (
                <div
                  key={score.weekStart}
                  className="shrink-0 p-3 rounded-xl bg-white/5 border border-white/5 min-w-25 text-center cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => {
                    const weekDate = new Date(score.weekStart);
                    setCurrentWeek(weekDate);
                    setCurrentCategories(score.categories);
                    setNotes(score.notes);
                  }}
                >
                  <div className="text-xs text-text-muted mb-1">
                    {new Date(score.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-lg font-bold font-mono" style={{ color: scoreStatus.color }}>
                    {score.totalScore.toFixed(0)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}



