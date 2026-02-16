import type { 
  CoreStats, 
  StatLastUsed, 
  WillpowerStatus,
  WillpowerState,
  PillarType 
} from '../types';
import { 
  WILLPOWER_COSTS, 
  WILLPOWER_RESTORE,
  STAT_DECAY_DAYS,
  STAT_DECAY_RATE 
} from '../types';

// ============================================================================
// Willpower System
// ============================================================================

export function getWillpowerStatus(current: number, max: number): WillpowerStatus {
  const percentage = (current / max) * 100;
  if (percentage <= 0) return 'exhausted';
  if (percentage <= 25) return 'low';
  if (percentage <= 50) return 'moderate';
  if (percentage <= 75) return 'high';
  return 'peak';
}

export function getWillpowerColor(status: WillpowerStatus): string {
  switch (status) {
    case 'exhausted': return '#ef4444'; // Red
    case 'low': return '#f97316'; // Orange
    case 'moderate': return '#eab308'; // Yellow
    case 'high': return '#22c55e'; // Green
    case 'peak': return '#10b981'; // Emerald
  }
}

export function getWillpowerMessage(status: WillpowerStatus): string {
  switch (status) {
    case 'exhausted': return 'CRITICAL: Willpower depleted! Rest immediately.';
    case 'low': return 'Warning: Willpower low. Avoid difficult decisions.';
    case 'moderate': return 'Willpower moderate. Stay focused.';
    case 'high': return 'Willpower high. Good condition.';
    case 'peak': return 'Willpower peak! Maximum discipline.';
  }
}

// Calculate XP multiplier based on willpower
export function getXPMultiplier(willpowerPercent: number): number {
  if (willpowerPercent <= 0) return 0.5; // Half XP when exhausted
  if (willpowerPercent <= 25) return 0.75; // Reduced XP
  if (willpowerPercent <= 50) return 0.9; // Slight reduction
  if (willpowerPercent <= 75) return 1.0; // Normal
  return 1.25; // Bonus XP when willpower is high
}

// Calculate max willpower based on level and constitution
export function calculateMaxWillpower(level: number, constitution: number): number {
  const base = 100;
  const levelBonus = (level - 1) * 5;
  const conBonus = (constitution - 10) * 3;
  return Math.min(base + levelBonus + conBonus, 200); // Cap at 200
}

// ============================================================================
// Willpower Actions
// ============================================================================

export type WillpowerAction = 
  | { type: 'deplete'; reason: keyof typeof WILLPOWER_COSTS }
  | { type: 'restore'; reason: keyof typeof WILLPOWER_RESTORE }
  | { type: 'set'; value: number }
  | { type: 'dailyReset' };

export function applyWillpowerChange(
  current: number,
  max: number,
  action: WillpowerAction
): { newValue: number; change: number; message?: string } {
  switch (action.type) {
    case 'deplete': {
      const cost = WILLPOWER_COSTS[action.reason];
      const newValue = Math.max(0, current - cost);
      return { 
        newValue, 
        change: -(current - newValue),
        message: `-${cost} Willpower: ${action.reason}`
      };
    }
    
    case 'restore': {
      const restore = WILLPOWER_RESTORE[action.reason];
      const newValue = Math.min(max, current + restore);
      return { 
        newValue, 
        change: newValue - current,
        message: `+${newValue - current} Willpower: ${action.reason}`
      };
    }
    
    case 'set':
      return { 
        newValue: Math.max(0, Math.min(max, action.value)), 
        change: action.value - current 
      };
    
    case 'dailyReset':
      // Natural regeneration during sleep
      const recovery = Math.floor(max * 0.3); // 30% recovery
      const newValue = Math.min(max, current + recovery);
      return { 
        newValue, 
        change: newValue - current,
        message: `+${newValue - current} Willpower: Rest and recovery`
      };
    
    default:
      return { newValue: current, change: 0 };
  }
}

// ============================================================================
// Stat Gain System - How stats INCREASE
// ============================================================================

// Stat gain from activities (per activity completion)
export const STAT_GAINS = {
  // Physical - fast gains
  strength: {
    heavyLifting: 0.5,      // Heavy compound lifts
    bodyweightTraining: 0.3, // Push-ups, pull-ups
    manualLabor: 0.2,       // Construction work
  },
  agility: {
    cardio: 0.4,            // Running, HIIT
    sports: 0.3,            // Basketball, martial arts
    stretching: 0.2,        // Dynamic stretching
  },
  constitution: {
    cardio: 0.3,
    enduranceWork: 0.4,     // Long runs, cycling
    coldExposure: 0.2,      // Cold showers
    healthyEating: 0.1,     // Following diet
  },
  
  // Mental - slower gains
  intelligence: {
    coding: 0.3,            // Programming
    studying: 0.3,          // Reading technical books
    problemSolving: 0.2,    // Solving complex problems
    learning: 0.2,          // Learning new concepts
  },
  wisdom: {
    meditation: 0.3,
    journaling: 0.2,
    reflection: 0.2,        // Reviewing decisions
    readingPhilosophy: 0.3, // Philosophy books
  },
  creativity: {
    coding: 0.2,
    writing: 0.3,           // Creative writing
    problemSolving: 0.2,
    sideProjects: 0.3,      // Building things
  },
  
  // Social
  charisma: {
    languageLearning: 0.3,  // German practice
    socializing: 0.2,       // Talking to people
    publicSpeaking: 0.4,    // Presentations, explaining
    teaching: 0.3,          // Teaching others
  },
  
  // Mental fortitude
  discipline: {
    completeHabit: 0.1,     // Any habit completion
    coldShower: 0.2,
    wakeUpEarly: 0.2,       // 05:00 wake
    deepWork: 0.15,         // 2hr focus session
    resistTemptation: 0.3,  // Saying no to distractions
  },
} as const;

// Calculate stat gain from an activity
type ActivityType = keyof typeof STAT_GAINS[keyof typeof STAT_GAINS];

export function calculateStatGain(
  stat: keyof CoreStats,
  activity: ActivityType,
  intensity: 'low' | 'medium' | 'high' = 'medium',
  durationMinutes: number = 60
): number {
  const gains = STAT_GAINS[stat];
  if (!gains) return 0;
  
  const baseGain = gains[activity as keyof typeof gains] || 0;
  if (baseGain === 0) return 0;
  
  // Intensity multiplier
  const intensityMultiplier = {
    low: 0.5,
    medium: 1.0,
    high: 1.5,
  };
  
  // Duration bonus (diminishing returns after 60 min)
  const durationBonus = Math.min(durationMinutes / 60, 2);
  
  return baseGain * intensityMultiplier[intensity] * durationBonus;
}

// Map activities to their primary stats and gain amounts
export interface StatGainActivity {
  activity: string;
  stats: Array<{ stat: keyof CoreStats; amount: number }>;
  description: string;
}

export const ACTIVITY_STAT_GAINS: Record<string, StatGainActivity> = {
  gym: {
    activity: 'Gym Workout',
    stats: [
      { stat: 'strength', amount: 0.4 },
      { stat: 'constitution', amount: 0.2 },
      { stat: 'discipline', amount: 0.15 },
    ],
    description: 'Weight training and resistance exercises',
  },
  cardio: {
    activity: 'Cardio Session',
    stats: [
      { stat: 'agility', amount: 0.4 },
      { stat: 'constitution', amount: 0.3 },
      { stat: 'discipline', amount: 0.1 },
    ],
    description: 'Running, cycling, or high-intensity cardio',
  },
  coding: {
    activity: 'Coding Session',
    stats: [
      { stat: 'intelligence', amount: 0.3 },
      { stat: 'creativity', amount: 0.2 },
      { stat: 'discipline', amount: 0.15 },
    ],
    description: 'Deep work programming session',
  },
  german: {
    activity: 'German Study',
    stats: [
      { stat: 'charisma', amount: 0.3 },
      { stat: 'intelligence', amount: 0.2 },
      { stat: 'discipline', amount: 0.15 },
    ],
    description: 'Language learning and practice',
  },
  meditation: {
    activity: 'Meditation',
    stats: [
      { stat: 'wisdom', amount: 0.3 },
      { stat: 'discipline', amount: 0.2 },
      { stat: 'constitution', amount: 0.1 },
    ],
    description: 'Mindfulness and mental training',
  },
  journal: {
    activity: 'Journaling',
    stats: [
      { stat: 'wisdom', amount: 0.2 },
      { stat: 'intelligence', amount: 0.15 },
      { stat: 'creativity', amount: 0.15 },
    ],
    description: 'Daily reflection and planning',
  },
  coldShower: {
    activity: 'Cold Shower',
    stats: [
      { stat: 'discipline', amount: 0.2 },
      { stat: 'constitution', amount: 0.2 },
    ],
    description: 'Cold exposure for mental and physical resilience',
  },
  reading: {
    activity: 'Reading',
    stats: [
      { stat: 'intelligence', amount: 0.25 },
      { stat: 'wisdom', amount: 0.2 },
    ],
    description: 'Reading books or educational content',
  },
  social: {
    activity: 'Socializing',
    stats: [
      { stat: 'charisma', amount: 0.3 },
    ],
    description: 'Meaningful social interaction',
  },
  deepWork: {
    activity: 'Deep Work',
    stats: [
      { stat: 'intelligence', amount: 0.25 },
      { stat: 'discipline', amount: 0.2 },
      { stat: 'creativity', amount: 0.15 },
    ],
    description: '2+ hours of focused, distraction-free work',
  },
  wakeUpEarly: {
    activity: 'Early Wake',
    stats: [
      { stat: 'discipline', amount: 0.2 },
    ],
    description: 'Waking at 05:00 consistently',
  },
  perfectDay: {
    activity: 'Perfect Day',
    stats: [
      { stat: 'discipline', amount: 0.5 },
      { stat: 'constitution', amount: 0.2 },
    ],
    description: 'Completing all daily protocols',
  },
};

// Apply stat gains from an activity
export function applyStatGains(
  currentStats: CoreStats,
  activityKey: string
): { newStats: CoreStats; gains: Array<{ stat: keyof CoreStats; amount: number }> } {
  const activity = ACTIVITY_STAT_GAINS[activityKey];
  if (!activity) {
    return { newStats: currentStats, gains: [] };
  }
  
  const newStats = { ...currentStats };
  const gains: Array<{ stat: keyof CoreStats; amount: number }> = [];
  
  activity.stats.forEach(({ stat, amount }) => {
    // Soft cap at 50 (very difficult to exceed)
    const currentValue = newStats[stat];
    const effectiveGain = currentValue >= 50 
      ? amount * 0.1  // 90% reduction above 50
      : currentValue >= 40 
        ? amount * 0.3  // 70% reduction 40-50
        : currentValue >= 30
          ? amount * 0.6  // 40% reduction 30-40
          : amount;       // Full gain below 30
    
    newStats[stat] = Math.min(60, currentValue + effectiveGain);
    gains.push({ stat, amount: effectiveGain });
  });
  
  return { newStats, gains };
}

// Passive stat gains from pillar leveling
export function getPassiveStatGainFromPillar(
  pillar: PillarType,
  newLevel: number
): Array<{ stat: keyof CoreStats; amount: number }> {
  const gains: Record<PillarType, Array<{ stat: keyof CoreStats; amount: number }>> = {
    craft: [
      { stat: 'intelligence', amount: newLevel * 0.5 },
      { stat: 'creativity', amount: newLevel * 0.3 },
    ],
    vessel: [
      { stat: 'strength', amount: newLevel * 0.4 },
      { stat: 'constitution', amount: newLevel * 0.4 },
      { stat: 'agility', amount: newLevel * 0.3 },
    ],
    tongue: [
      { stat: 'charisma', amount: newLevel * 0.5 },
      { stat: 'intelligence', amount: newLevel * 0.2 },
    ],
    principle: [
      { stat: 'wisdom', amount: newLevel * 0.5 },
      { stat: 'discipline', amount: newLevel * 0.4 },
    ],
    capital: [
      { stat: 'wisdom', amount: newLevel * 0.3 },
      { stat: 'discipline', amount: newLevel * 0.3 },
    ],
  };
  
  return gains[pillar] || [];
}

// Get all ways to increase a specific stat
export function getStatTrainingOptions(stat: keyof CoreStats): Array<{ activity: string; gain: number; description: string }> {
  const options: Array<{ activity: string; gain: number; description: string }> = [];
  
  Object.entries(ACTIVITY_STAT_GAINS).forEach(([key, data]) => {
    const statGain = data.stats.find(s => s.stat === stat);
    if (statGain) {
      options.push({
        activity: data.activity,
        gain: statGain.amount,
        description: data.description,
      });
    }
  });
  
  // Sort by gain amount
  return options.sort((a, b) => b.gain - a.gain);
}

// ============================================================================
// Stat Decay System
// ============================================================================

export interface DecayResult {
  stat: keyof CoreStats;
  daysSinceUsed: number;
  gracePeriod: number;
  daysIntoDecay: number;
  decayAmount: number;
  newValue: number;
  isAtrophying: boolean;
}

export function calculateStatDecay(
  stat: keyof CoreStats,
  currentValue: number,
  lastUsed: string,
  today: string = new Date().toISOString()
): DecayResult {
  const gracePeriod = STAT_DECAY_DAYS[stat];
  const lastUsedDate = new Date(lastUsed);
  const todayDate = new Date(today);
  
  const daysSinceUsed = Math.floor(
    (todayDate.getTime() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Within grace period - no decay
  if (daysSinceUsed <= gracePeriod) {
    return {
      stat,
      daysSinceUsed,
      gracePeriod,
      daysIntoDecay: 0,
      decayAmount: 0,
      newValue: currentValue,
      isAtrophying: false,
    };
  }
  
  // Calculate decay
  const daysIntoDecay = daysSinceUsed - gracePeriod;
  const decayPercent = daysIntoDecay * STAT_DECAY_RATE;
  const decayAmount = Math.floor(currentValue * decayPercent);
  const newValue = Math.max(5, currentValue - decayAmount); // Minimum 5
  
  return {
    stat,
    daysSinceUsed,
    gracePeriod,
    daysIntoDecay,
    decayAmount,
    newValue,
    isAtrophying: true,
  };
}

export function calculateAllStatDecay(
  coreStats: CoreStats,
  statLastUsed: StatLastUsed,
  today: string = new Date().toISOString()
): { results: DecayResult[]; totalDecay: number; anyAtrophying: boolean } {
  const results: DecayResult[] = [];
  let totalDecay = 0;
  let anyAtrophying = false;
  
  (Object.keys(coreStats) as Array<keyof CoreStats>).forEach((stat) => {
    const result = calculateStatDecay(
      stat,
      coreStats[stat],
      statLastUsed[stat],
      today
    );
    results.push(result);
    totalDecay += result.decayAmount;
    if (result.isAtrophying) anyAtrophying = true;
  });
  
  return { results, totalDecay, anyAtrophying };
}

// Get stat decay status for display
export function getStatDecayStatus(
  daysSinceUsed: number,
  gracePeriod: number
): 'healthy' | 'warning' | 'critical' | 'atrophying' {
  if (daysSinceUsed <= gracePeriod * 0.5) return 'healthy';
  if (daysSinceUsed <= gracePeriod) return 'warning';
  if (daysSinceUsed <= gracePeriod + 3) return 'critical';
  return 'atrophying';
}

export function getDecayStatusColor(status: ReturnType<typeof getStatDecayStatus>): string {
  switch (status) {
    case 'healthy': return '#22c55e'; // Green
    case 'warning': return '#eab308'; // Yellow
    case 'critical': return '#f97316'; // Orange
    case 'atrophying': return '#ef4444'; // Red
  }
}

// ============================================================================
// Activity Tracking for Stats (for lastUsed only)
// ============================================================================

// Map activities to stats they exercise (for lastUsed tracking)
export const ACTIVITY_TO_STATS: Record<string, Array<keyof CoreStats>> = {
  gym: ['strength', 'constitution', 'discipline'],
  coding: ['intelligence', 'creativity', 'discipline'],
  german: ['charisma', 'intelligence', 'discipline'],
  meditation: ['wisdom', 'discipline', 'constitution'],
  journal: ['wisdom', 'intelligence', 'creativity'],
  coldShower: ['discipline', 'constitution'],
  deepWork: ['intelligence', 'discipline', 'creativity'],
  cardio: ['agility', 'constitution', 'discipline'],
  reading: ['intelligence', 'wisdom'],
  social: ['charisma'],
};

export function getStatsForActivity(activity: string): Array<keyof CoreStats> {
  return ACTIVITY_TO_STATS[activity] || ['discipline'];
}
