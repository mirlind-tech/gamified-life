import type { 
  CoreStats, 
  StatLastUsed, 
  WillpowerStatus,
  WillpowerState 
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
// Activity Tracking for Stats
// ============================================================================

// Map activities to stats they exercise
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
  social: ['charisma', 'confidence'],
};

export function getStatsForActivity(activity: string): Array<keyof CoreStats> {
  return ACTIVITY_TO_STATS[activity] || ['discipline'];
}
