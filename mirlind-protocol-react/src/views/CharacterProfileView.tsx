import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { EMOJIS } from '../utils/emojis';
import { useGame } from '../store/useGame';
import { useAuth } from '../contexts/useAuth';
import { TiltCard } from '../components/animations';
import { WeeklyScorecard } from '../components/WeeklyScorecard';
import { SavingsProgress } from '../components/SavingsProgress';
import { JobHuntTracker } from '../components/JobHuntTracker';
import { calculateCoreStats } from '../utils/coreStats';

interface StatBarProps {
  name: string;
  value: number;
  max: number;
  color: string;
  icon: string;
  description: string;
}

function StatBar({ name, value, max, color, icon, description }: StatBarProps) {
  const percentage = Math.min(100, (value / max) * 100);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="group relative"
    >
      <div className="flex items-center gap-3 mb-1">
        <span className="text-xl">{icon}</span>
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-text-primary">{name}</span>
            <span className="text-sm font-mono font-bold" style={{ color }}>
              {value}
            </span>
          </div>
        </div>
      </div>
      
      <div className="h-3 bg-black/40 rounded-full overflow-hidden relative">
        {/* Background glow */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{ backgroundColor: color }}
        />
        
        {/* Progress bar */}
        <motion.div
          className="h-full rounded-full relative"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </motion.div>
      </div>
      
      <p className="text-xs text-text-muted mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {description}
      </p>
    </motion.div>
  );
}

interface BadgeProps {
  icon: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
}

function Badge({ icon, name, description: _unusedDescription, rarity, unlocked }: BadgeProps) {
  const rarityColors = {
    common: '#64748b',
    rare: '#06b6d4',
    epic: '#a855f7',
    legendary: '#fbbf24',
  };
  
  const color = rarityColors[rarity];
  
  return (
    <TiltCard tiltAmount={8} glowColor={`${color}20`}>
      <motion.div
        whileHover={{ scale: 1.05 }}
        className={`
          relative p-4 rounded-xl border-2 transition-all
          ${unlocked 
            ? 'glass-card cursor-pointer' 
            : 'bg-black/20 border-white/5 opacity-40 grayscale'
          }
        `}
        style={{ borderColor: unlocked ? `${color}40` : undefined }}
      >
        <div 
          className="text-3xl mb-2"
          style={{ filter: unlocked ? `drop-shadow(0 0 10px ${color})` : undefined }}
        >
          {icon}
        </div>
        <div className="text-xs font-semibold text-text-primary">{name}</div>
        <div className="text-[10px] text-text-muted uppercase tracking-wider" style={{ color: unlocked ? color : undefined }}>
          {rarity}
        </div>
        
        {!unlocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">🔒</span>
          </div>
        )}
      </motion.div>
    </TiltCard>
  );
}

// Get title based on stats
function getCharacterTitle(stats: Record<string, number>) {
  const avgStat = Object.values(stats).reduce((a: number, b: number) => a + b, 0) / Object.values(stats).length;
  
  if (avgStat >= 50) return { title: 'Living Legend', color: '#fbbf24' };
  if (avgStat >= 40) return { title: 'Master of All', color: '#a855f7' };
  if (avgStat >= 30) return { title: 'Elite Warrior', color: '#06b6d4' };
  if (avgStat >= 20) return { title: 'Rising Star', color: '#10b981' };
  return { title: 'Novice Seeker', color: '#64748b' };
}

export function CharacterProfileView() {
  const { state } = useGame();
  const { player } = state;
  const { user } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [characterName, setCharacterName] = useState('Unnamed Warrior');
  
  // Update character name when user data loads - only once when data becomes available
  const hasInitializedName = useRef(false);
  useEffect(() => {
    if (hasInitializedName.current) return;
    
    // Use player.name only if it's set and not the default
    if (player?.name && player.name !== 'Unnamed Warrior') {
      queueMicrotask(() => setCharacterName(player.name));
      hasInitializedName.current = true;
    } else if (user?.username) {
      queueMicrotask(() => setCharacterName(user.username));
      hasInitializedName.current = true;
    }
  }, [player?.name, user?.username]);
  
  const coreStats = calculateCoreStats(player);
  const { title, color } = getCharacterTitle(coreStats);
  const totalPower = Object.values(coreStats).reduce((a: number, b: number) => a + b, 0);
  const maxStat = Math.max(...Object.values(coreStats));
  const dominantStat = Object.entries(coreStats).find(([, v]) => v === maxStat)?.[0] || 'strength';
  
  // Calculate level from total XP
  const level = Math.floor((player?.totalXPEarned || 0) / 1000) + 1;
  const xp = (player?.totalXPEarned || 0) % 1000;
  const xpToNext = 1000;
  
  const statConfig = [
    { key: 'strength', name: 'Strength', icon: '💪', color: '#ef4444', description: 'Physical power and muscle capacity' },
    { key: 'agility', name: 'Agility', icon: '⚡', color: '#f59e0b', description: 'Speed, reflexes, and coordination' },
    { key: 'intelligence', name: 'Intelligence', icon: '🧠', color: '#06b6d4', description: 'Mental capacity and learning speed' },
    { key: 'wisdom', name: 'Wisdom', icon: '🔮', color: '#8b5cf6', description: 'Decision making and emotional control' },
    { key: 'charisma', name: 'Charisma', icon: '🗣️', color: '#ec4899', description: 'Social influence and communication' },
    { key: 'constitution', name: 'Constitution', icon: '❤️', color: '#10b981', description: 'Endurance, health, and vitality' },
    { key: 'discipline', name: 'Discipline', icon: '⛓️', color: '#64748b', description: 'Willpower and consistency' },
    { key: 'creativity', name: 'Creativity', icon: '✨', color: '#fbbf24', description: 'Innovation and problem solving' },
  ];
  
  const badges = [
    { icon: '🌅', name: 'Early Bird', description: 'Wake up at 5 AM', rarity: 'common' as const, unlocked: true },
    { icon: '❄️', name: 'Ice Bath', description: 'Cold shower streak', rarity: 'rare' as const, unlocked: (player?.activityStats?.habitsCompleted || 0) > 10 },
    { icon: '🔥', name: 'Deep Focus', description: '10+ focus sessions', rarity: 'rare' as const, unlocked: (player?.activityStats?.focusSessions || 0) >= 10 },
    { icon: '📓', name: 'Self Aware', description: '30 journal entries', rarity: 'epic' as const, unlocked: (player?.activityStats?.journalEntries || 0) >= 30 },
    { icon: '👑', name: 'Legend', description: 'Reach 100 total power', rarity: 'legendary' as const, unlocked: totalPower >= 100 },
    { icon: '💎', name: 'Disciplined', description: '7 day streak', rarity: 'epic' as const, unlocked: false },
  ];

  return (
    <div className="max-w-6xl mx-auto animate-slide-up pb-8">
      {/* Weekly Scorecard */}
      <WeeklyScorecard />
      
      {/* Savings Progress */}
      <SavingsProgress />
      
      {/* Job Hunt Tracker */}
      <JobHuntTracker />
      
      {/* Achievements - At the Top */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          {EMOJIS.TROPHY} Achievements
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {badges.map((badge, index) => (
            <motion.div
              key={badge.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.05 }}
            >
              <Badge {...badge} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Character Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1"
        >
          <TiltCard tiltAmount={5} glowColor={`${color}30`}>
            <div className="glass-card rounded-3xl p-8 text-center relative overflow-hidden">
              {/* Background glow */}
              <div 
                className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-20"
                style={{ backgroundColor: color }}
              />
              
              {/* Level Badge */}
              <div className="absolute top-4 right-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2"
                  style={{ 
                    backgroundColor: `${color}20`,
                    borderColor: color,
                    color: color,
                  }}
                >
                  {level}
                </div>
              </div>
              
              {/* Avatar */}
              <div className="relative mb-4">
                <motion.div
                  className="w-32 h-32 mx-auto rounded-full flex items-center justify-center text-6xl"
                  style={{ 
                    background: `linear-gradient(135deg, ${color}40, ${color}10)`,
                    boxShadow: `0 0 60px ${color}30`,
                  }}
                  animate={{ 
                    boxShadow: [
                      `0 0 30px ${color}20`,
                      `0 0 60px ${color}40`,
                      `0 0 30px ${color}20`,
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  {dominantStat === 'strength' ? '💪' :
                   dominantStat === 'intelligence' ? '🧠' :
                   dominantStat === 'wisdom' ? '🔮' :
                   dominantStat === 'agility' ? '⚡' : '🎭'}
                </motion.div>
                
                {/* Power level ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="68"
                    fill="none"
                    stroke="#1a1a2e"
                    strokeWidth="4"
                  />
                  <motion.circle
                    cx="50%"
                    cy="50%"
                    r="68"
                    fill="none"
                    stroke={color}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${(xp / xpToNext) * 427} 427`}
                    initial={{ strokeDashoffset: 427 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                </svg>
              </div>
              
              {/* Name */}
              {editMode ? (
                <input
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  onBlur={() => setEditMode(false)}
                  autoFocus
                  className="text-xl font-bold text-center bg-transparent border-b-2 border-accent-purple outline-none text-text-primary w-full mb-1"
                />
              ) : (
                <button
                  type="button"
                  className="text-2xl font-bold text-text-primary mb-1 cursor-pointer hover:text-accent-purple transition-colors bg-transparent border-none p-0"
                  onClick={() => setEditMode(true)}
                  title="Click to edit"
                  aria-label="Edit character name"
                >
                  {characterName}
                </button>
              )}
              
              {/* Title */}
              <div 
                className="text-sm font-semibold uppercase tracking-widest mb-4"
                style={{ color }}
              >
                {title}
              </div>
              
              {/* XP Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-text-muted mb-1">
                  <span>XP</span>
                  <span>{xp} / {xpToNext}</span>
                </div>
                <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(xp / xpToNext) * 100}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </div>
              
              {/* Total Power */}
              <div className="glass-card rounded-xl p-3">
                <div className="text-xs text-text-muted uppercase tracking-wider">Total Power</div>
                <div className="text-3xl font-bold font-mono text-gradient">{totalPower}</div>
              </div>
            </div>
          </TiltCard>
        </motion.div>
        
        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <div className="glass-card rounded-3xl p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                {EMOJIS.CHART} Core Attributes
              </h3>
              <span className="text-xs text-text-muted">Based on your activities</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {statConfig.map((stat) => (
                <StatBar
                  key={stat.key}
                  name={stat.name}
                  value={coreStats[stat.key as keyof typeof coreStats]}
                  max={100}
                  color={stat.color}
                  icon={stat.icon}
                  description={stat.description}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Battle Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-3xl p-6"
      >
        <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
          {EMOJIS.SWORD} Battle Record
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Quests Completed', value: player?.activityStats?.questsCompleted || 0, icon: '⚔️' },
            { label: 'Focus Sessions', value: player?.activityStats?.focusSessions || 0, icon: '🎯' },
            { label: 'Habits Mastered', value: player?.activityStats?.habitsCompleted || 0, icon: '🔥' },
            { label: 'Journal Entries', value: player?.activityStats?.journalEntries || 0, icon: '📓' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="text-center p-4 rounded-2xl bg-white/3"
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold font-mono text-text-primary">{stat.value}</div>
              <div className="text-xs text-text-muted uppercase tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      
      {/* Quote */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <p className="text-text-secondary italic text-lg">
          &quot;The difference between the master and the novice is that the master has failed more times than the novice has tried.&quot;
        </p>
        <p className="text-text-muted text-sm mt-2">— Fang Yuan</p>
      </motion.div>
    </div>
  );
}
