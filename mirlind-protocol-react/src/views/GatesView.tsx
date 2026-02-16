import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EMOJIS } from '../utils/emojis';
import { useGame } from '../store/useGame';
import { TiltCard } from '../components/animations';
import { fireGateUnlockConfetti } from '../utils/confetti';

interface Gate {
  id: string;
  name: string;
  description: string;
  requirement: {
    type: 'quests' | 'streak' | 'skill' | 'focus' | 'habits' | 'journal';
    target: number;
    label: string;
  };
  unlocked: boolean;
  icon: string;
  color: string;
  quote: string;
  author: 'Fang Yuan' | 'Baki Hanma';
}

const GATES: Gate[] = [
  {
    id: 'gate_awakening',
    name: 'Gate of Awakening',
    description: 'The journey of a thousand miles begins with a single step. You have taken yours.',
    requirement: { type: 'quests', target: 1, label: 'Complete your first quest' },
    unlocked: true,
    icon: '🌅',
    color: '#f59e0b',
    quote: 'The strong do what they can, the weak suffer what they must.',
    author: 'Fang Yuan',
  },
  {
    id: 'gate_discipline',
    name: 'Gate of Discipline',
    description: 'Seven days of unbroken commitment. The foundation of all mastery.',
    requirement: { type: 'streak', target: 7, label: '7 day streak on any habit' },
    unlocked: false,
    icon: '⛓️',
    color: '#8b5cf6',
    quote: 'Discipline is doing what needs to be done, even when you do not feel like it.',
    author: 'Baki Hanma',
  },
  {
    id: 'gate_craft',
    name: 'Gate of Craft',
    description: 'Your skills sharpen. Your value increases. The world begins to notice.',
    requirement: { type: 'skill', target: 10, label: 'Reach level 10 in any skill' },
    unlocked: false,
    icon: '⚡',
    color: '#06b6d4',
    quote: 'In this world, only the useful are remembered. Only the strong are respected.',
    author: 'Fang Yuan',
  },
  {
    id: 'gate_vessel',
    name: 'Gate of Vessel',
    description: 'Your body obeys your will. Pain is merely a signal, not a barrier.',
    requirement: { type: 'habits', target: 50, label: 'Complete 50 habit check-ins' },
    unlocked: false,
    icon: '💪',
    color: '#ec4899',
    quote: 'Pain is just weakness leaving the body.',
    author: 'Baki Hanma',
  },
  {
    id: 'gate_principle',
    name: 'Gate of Principle',
    description: 'Your mind is unshakeable. Emotions serve you, not the other way around.',
    requirement: { type: 'journal', target: 30, label: '30 journal entries' },
    unlocked: false,
    icon: '🧠',
    color: '#a855f7',
    quote: 'Emotions are tools. Use them, do not be used by them.',
    author: 'Fang Yuan',
  },
  {
    id: 'gate_flow',
    name: 'Gate of Flow',
    description: 'Deep focus becomes your natural state. Distractions lose their power.',
    requirement: { type: 'focus', target: 20, label: '20 focus sessions' },
    unlocked: false,
    icon: '🌊',
    color: '#10b981',
    quote: 'The only thing that matters is becoming stronger than you were yesterday.',
    author: 'Baki Hanma',
  },
  {
    id: 'gate_mastery',
    name: 'Gate of Mastery',
    description: 'You have walked the path. Now you are the path itself.',
    requirement: { type: 'quests', target: 100, label: 'Complete 100 quests' },
    unlocked: false,
    icon: '👑',
    color: '#fbbf24',
    quote: 'Regret is for the weak. I take what I want.',
    author: 'Fang Yuan',
  },
];

export function GatesView() {
  const { state, showToast } = useGame();
  const { player } = state;
  const [gates, setGates] = useState<Gate[]>(GATES);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string | null>(null);

  // Calculate progress for each gate
  const getProgress = (gate: Gate): number => {
    const stats = player?.activityStats;
    switch (gate.requirement.type) {
      case 'quests':
        return stats?.questsCompleted || 0;
      case 'streak':
        // Get max streak from activity stats
        return player?.activityStats?.habitsCompleted || 0;
      case 'skill':
        // Get max skill level
        return Math.max(...Object.values(player?.skills || {}).map(s => s?.level || 0), 0);
      case 'focus':
        return stats?.focusSessions || 0;
      case 'habits':
        return stats?.habitsCompleted || 0;
      case 'journal':
        return stats?.journalEntries || 0;
      default:
        return 0;
    }
  };

  // Check for newly unlocked gates
  useEffect(() => {
    const updatedGates = gates.map(gate => {
      const progress = getProgress(gate);
      const wasUnlocked = gate.unlocked;
      const nowUnlocked = progress >= gate.requirement.target;
      
      if (!wasUnlocked && nowUnlocked && gate.id !== 'gate_awakening') {
        setNewlyUnlocked(gate.id);
        fireGateUnlockConfetti();
        showToast(
          `🎉 GATE UNLOCKED: ${gate.name}!`,
          'success',
          5000
        );
        setTimeout(() => setNewlyUnlocked(null), 5000);
      }
      
      return { ...gate, unlocked: nowUnlocked };
    });
    
    setGates(updatedGates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.activityStats, player?.skills]);

  const unlockedCount = gates.filter(g => g.unlocked).length;
  const totalGates = gates.length;
  const progressPercent = (unlockedCount / totalGates) * 100;

  return (
    <div className="max-w-5xl mx-auto animate-slide-up">
      {/* Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-2"
        >
          <span className="text-3xl">{EMOJIS.GATES}</span>
          <h2 className="text-2xl font-bold text-text-primary">Gates of Ascension</h2>
        </motion.div>
        <p className="text-text-secondary">
          Pass through each gate to prove your worth. The path to mastery is forged in discipline.
        </p>
      </div>

      {/* Progress Overview */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-2xl p-6 mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Your Progress</h3>
            <p className="text-text-muted text-sm">
              {unlockedCount} of {totalGates} gates unlocked
            </p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-gradient">{Math.round(progressPercent)}%</span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-3 bg-black/40 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-linear-to-r from-accent-purple via-accent-cyan to-accent-green rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            <div className="w-full h-full bg-linear-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </motion.div>
        </div>
      </motion.div>

      {/* Gates Grid */}
      <div className="grid gap-4">
        <AnimatePresence>
          {gates.map((gate, index) => {
            const progress = getProgress(gate);
            const percent = Math.min(100, (progress / gate.requirement.target) * 100);
            const isNewlyUnlocked = newlyUnlocked === gate.id;

            return (
              <motion.div
                key={gate.id}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <TiltCard tiltAmount={5} glowColor={`${gate.color}30`}>
                  <motion.div
                    className={`
                      relative p-6 rounded-2xl border-2 transition-all duration-500
                      ${gate.unlocked 
                        ? 'glass-card' 
                        : 'bg-bg-card/30 border-white/5 opacity-80'
                      }
                      ${isNewlyUnlocked ? 'animate-pulse-glow' : ''}
                    `}
                    style={{
                      borderColor: gate.unlocked ? `${gate.color}40` : undefined,
                      boxShadow: gate.unlocked ? `0 0 40px ${gate.color}15` : undefined,
                    }}
                  >
                    {/* Gate Number Badge */}
                    <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ 
                        background: gate.unlocked ? gate.color : '#334155',
                        color: gate.unlocked ? '#000' : '#94a3b8',
                      }}
                    >
                      {index + 1}
                    </div>

                    <div className="flex items-start gap-5">
                      {/* Icon */}
                      <motion.div
                        className={`
                          w-16 h-16 rounded-2xl flex items-center justify-center text-4xl
                          ${gate.unlocked ? '' : 'grayscale opacity-60'}
                        `}
                        style={{ 
                          background: `linear-gradient(135deg, ${gate.color}30, ${gate.color}10)`,
                          boxShadow: gate.unlocked ? `0 0 30px ${gate.color}30` : 'none',
                        }}
                        animate={isNewlyUnlocked ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        {gate.icon}
                      </motion.div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-xl font-bold text-text-primary">{gate.name}</h3>
                          {gate.unlocked && (
                            <span className="px-2 py-0.5 bg-accent-green/20 text-accent-green text-xs font-semibold rounded-full border border-accent-green/30">
                              UNLOCKED
                            </span>
                          )}
                        </div>
                        
                        <p className={`text-sm mb-3 ${gate.unlocked ? 'text-text-secondary' : 'text-text-muted'}`}>
                          {gate.description}
                        </p>

                        {/* Quote */}
                        <div className="flex items-start gap-2 text-xs italic text-text-muted mb-3 pl-3 border-l-2 border-white/10">
                          <span>{gate.author === 'Fang Yuan' ? '🧠' : '💪'}</span>
                          <span>&quot;{gate.quote}&quot;</span>
                          <span style={{ color: gate.color }}>— {gate.author}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: gate.color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
                            />
                          </div>
                          <span className="text-xs font-mono text-text-muted whitespace-nowrap">
                            {progress}/{gate.requirement.target} {gate.requirement.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Unlock celebration overlay */}
                    <AnimatePresence>
                      {isNewlyUnlocked && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 rounded-2xl flex items-center justify-center pointer-events-none"
                          style={{ background: `${gate.color}20` }}
                        >
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="text-6xl"
                          >
                            {EMOJIS.TROPHY}
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </TiltCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Motivational Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-10 p-6 glass-card rounded-2xl text-center"
      >
        <p className="text-text-secondary italic">
          &quot;Every gate passed is a version of yourself that you have left behind. 
          Keep walking. The strongest version awaits.&quot;
        </p>
      </motion.div>
    </div>
  );
}
