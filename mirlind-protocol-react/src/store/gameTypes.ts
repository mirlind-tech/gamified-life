import { createContext } from 'react';
import type { PlayerStats, ViewType, Toast, ActivityStats, PillarType } from '../types';
import type { WillpowerAction } from '../utils/willpower';

// ============================================================================
// Context Creation
// ============================================================================
export interface GameContextType {
  state: {
    player: PlayerStats;
    currentView: ViewType;
    toasts: Toast[];
    isLoading: boolean;
    isAuthenticated: boolean;
    username: string | null;
  };
  dispatch: React.Dispatch<GameAction>;
  // View
  setView: (view: ViewType) => void;
  // Toast
  showToast: (message: string, type?: Toast['type'], duration?: number) => void;
  // Activity tracking
  trackActivity: (type: keyof ActivityStats, value: number) => Promise<void>;
  // Auth
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => void;
  // XP
  addXP: (amount: number, skill: string) => Promise<void>;
  // Willpower & Decay
  modifyWillpower: (action: WillpowerAction) => number;
  checkAndApplyDecay: () => { results: Array<{ stat: keyof PlayerStats['coreStats']; daysSinceUsed: number; gracePeriod: number; daysIntoDecay: number; decayAmount: number; newValue: number; isAtrophying: boolean }>; anyAtrophying: boolean };
  exerciseStats: (activity: string, date?: string) => void;
  dailyReset: () => void;
  // Stat Gains
  gainStats: (activityKey: string) => { newStats: PlayerStats['coreStats']; gains: Array<{ stat: keyof PlayerStats['coreStats']; amount: number }> };
  gainStatsFromPillarLevel: (pillar: PillarType, newLevel: number) => Array<{ stat: keyof PlayerStats['coreStats']; amount: number }>;
}

export type GameAction =
  | { type: 'UPDATE_PLAYER'; payload: Partial<PlayerStats> }
  | { type: 'SET_PLAYER'; payload: PlayerStats }
  | { type: 'SET_VIEW'; payload: ViewType }
  | { type: 'ADD_TOAST'; payload: Toast }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_AUTH'; payload: { isAuthenticated: boolean; username: string | null } }
  | { type: 'TRACK_ACTIVITY'; payload: { type: keyof ActivityStats; value: number } }
  | { type: 'ADD_XP'; payload: { amount: number; skill: string } }
  // Willpower & Decay
  | { type: 'UPDATE_WILLPOWER'; payload: { value: number; reason: string } }
  | { type: 'APPLY_STAT_DECAY'; payload: { decayResults: Array<{ stat: keyof PlayerStats['coreStats']; newValue: number }> } }
  | { type: 'EXERCISE_STAT'; payload: { stat: keyof PlayerStats['coreStats']; date?: string } }
  | { type: 'DAILY_RESET' }
  // Stat Gains
  | { type: 'GAIN_STATS'; payload: { gains: Array<{ stat: keyof PlayerStats['coreStats']; amount: number }>; activity: string } }
  | { type: 'PILLAR_LEVEL_STAT_GAIN'; payload: { pillar: PillarType; newLevel: number } };

export const GameContext = createContext<GameContextType | undefined>(undefined);
