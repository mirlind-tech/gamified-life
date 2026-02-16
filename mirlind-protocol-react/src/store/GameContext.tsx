import { useReducer, useCallback, useEffect, useState, type ReactNode } from 'react';
import type { PlayerStats, ViewType, Toast, ActivityStats } from '../types';
import * as authApi from '../services/authApi';
import { logger } from '../utils/logger';
import { removeToken } from '../services/authApi';
import * as playerApi from '../services/playerApi';
import { transformUserToPlayer, transformBackendStatsToPlayer } from './gameHelpers';
import { GameContext, type GameAction } from './gameTypes';
import { 
  applyWillpowerChange, 
  calculateAllStatDecay,
  getXPMultiplier,
  getStatsForActivity,
  applyStatGains,
  getPassiveStatGainFromPillar,
  type WillpowerAction 
} from '../utils/willpower';

// ============================================================================
// Initial State
// ============================================================================

const initialActivityStats: ActivityStats = {
  focusSessions: 0,
  focusMinutes: 0,
  journalEntries: 0,
  habitsCompleted: 0,
  meditationMinutes: 0,
  dailyQuestStreak: 0,
  lastQuestDate: null,
  aiCoachChats: 0,
  questsCompleted: 0,
};

// Re-export for use in createInitialPlayerState

const today = new Date().toISOString();

const createInitialPlayerState = (): PlayerStats => ({
  name: 'Unnamed Warrior',
  title: 'Novice Seeker',
  level: 1,
  xp: 0,
  xpToNext: 1000,
  pillars: {
    craft: { id: 'craft', name: 'Craft', subtitle: 'Technical Mastery', icon: 'zap', color: '#06b6d4', description: 'The foundation of your value', level: 1, xp: 0, xpToNext: 100 },
    vessel: { id: 'vessel', name: 'Vessel', subtitle: 'Physical Excellence', icon: 'muscle', color: '#ec4899', description: 'Your body is the vehicle', level: 1, xp: 0, xpToNext: 100 },
    tongue: { id: 'tongue', name: 'Tongue', subtitle: 'Language & Influence', icon: 'speech', color: '#8b5cf6', description: 'Words are weapons', level: 1, xp: 0, xpToNext: 100 },
    principle: { id: 'principle', name: 'Principle', subtitle: 'Mental Fortitude', icon: 'brain', color: '#a855f7', description: 'Detach from emotion', level: 1, xp: 0, xpToNext: 150 },
    capital: { id: 'capital', name: 'Capital', subtitle: 'Financial Mastery', icon: 'money', color: '#10b981', description: 'Money is a tool', level: 1, xp: 0, xpToNext: 100 },
  },
  skills: {},
  professionalSkills: {},
  coreStats: {
    strength: 10,
    agility: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    constitution: 10,
    discipline: 10,
    creativity: 10,
  },
  willpower: 100,
  maxWillpower: 100,
  unlockedGates: [],
  gates: [],
  activityStats: initialActivityStats,
  xpHistory: [],
  levelUpHistory: [],
  totalXPEarned: 0,
  questsCompleted: 0,
  startDate: today,
  // Stat decay tracking - all stats start as "used today"
  statLastUsed: {
    strength: today,
    agility: today,
    intelligence: today,
    wisdom: today,
    charisma: today,
    constitution: today,
    discipline: today,
    creativity: today,
  },
  lastDecayCheck: today,
});

// ============================================================================
// Actions & Reducer
// ============================================================================

interface GameState {
  player: PlayerStats;
  currentView: ViewType;
  toasts: Toast[];
  isLoading: boolean;
  isAuthenticated: boolean;
  username: string | null;
}



function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'UPDATE_PLAYER':
      return { ...state, player: { ...state.player, ...action.payload } };
    case 'SET_PLAYER':
      return { ...state, player: action.payload };
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.payload] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_AUTH':
      return { ...state, isAuthenticated: action.payload.isAuthenticated, username: action.payload.username };
    case 'TRACK_ACTIVITY':
      return {
        ...state,
        player: {
          ...state.player,
          activityStats: {
            ...state.player.activityStats,
            [action.payload.type]: ((state.player.activityStats[action.payload.type] as number) || 0) + action.payload.value,
          },
        },
      };
    case 'ADD_XP':
      return {
        ...state,
        player: {
          ...state.player,
          totalXPEarned: state.player.totalXPEarned + action.payload.amount,
        },
      };
    case 'UPDATE_WILLPOWER':
      return {
        ...state,
        player: {
          ...state.player,
          willpower: Math.max(0, Math.min(state.player.maxWillpower, action.payload.value)),
        },
      };
    case 'APPLY_STAT_DECAY':
      const newCoreStats = { ...state.player.coreStats };
      action.payload.decayResults.forEach(({ stat, newValue }) => {
        newCoreStats[stat] = newValue;
      });
      return {
        ...state,
        player: {
          ...state.player,
          coreStats: newCoreStats,
          lastDecayCheck: new Date().toISOString(),
        },
      };
    case 'EXERCISE_STAT':
      return {
        ...state,
        player: {
          ...state.player,
          statLastUsed: {
            ...state.player.statLastUsed,
            [action.payload.stat]: action.payload.date || new Date().toISOString(),
          },
        },
      };
    case 'DAILY_RESET':
      // Natural willpower regeneration (30% of max)
      const recovery = Math.floor(state.player.maxWillpower * 0.3);
      return {
        ...state,
        player: {
          ...state.player,
          willpower: Math.min(state.player.maxWillpower, state.player.willpower + recovery),
        },
      };
    case 'GAIN_STATS':
      const gainedStats = { ...state.player.coreStats };
      action.payload.gains.forEach(({ stat, amount }) => {
        gainedStats[stat] = Math.min(60, gainedStats[stat] + amount);
      });
      return {
        ...state,
        player: {
          ...state.player,
          coreStats: gainedStats,
        },
      };
    case 'PILLAR_LEVEL_STAT_GAIN':
      const pillarGains = getPassiveStatGainFromPillar(action.payload.pillar, action.payload.newLevel);
      const newStatsAfterPillar = { ...state.player.coreStats };
      pillarGains.forEach(({ stat, amount }) => {
        newStatsAfterPillar[stat] = Math.min(60, newStatsAfterPillar[stat] + amount);
      });
      return {
        ...state,
        player: {
          ...state.player,
          coreStats: newStatsAfterPillar,
        },
      };
    default:
      return state;
  }
}



// ============================================================================
// Provider
// ============================================================================

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, {
    player: createInitialPlayerState(),
    currentView: 'tree',
    toasts: [],
    isLoading: true,
    isAuthenticated: false,
    username: null,
  });

  const [useLocalStorage, setUseLocalStorage] = useState(true);

  // Toast helper
  const showToast = useCallback((message: string, type: Toast['type'] = 'default', duration = 3000) => {
    const id = Math.random().toString(36).substring(7);
    dispatch({ type: 'ADD_TOAST', payload: { id, message, type, duration } });
    setTimeout(() => {
      dispatch({ type: 'REMOVE_TOAST', payload: id });
    }, duration);
  }, []);

  // View helper
  const setView = useCallback((view: ViewType) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  }, []);

  // Track activity - syncs with API if authenticated, otherwise local only
  const trackActivity = useCallback(async (type: keyof ActivityStats, value: number) => {
    dispatch({ type: 'TRACK_ACTIVITY', payload: { type, value } });
    
    if (state.isAuthenticated && !useLocalStorage) {
      try {
        await playerApi.trackActivity(type as string, value);
      } catch (error) {
        logger.error('Failed to track activity:', error);
      }
    }
  }, [state.isAuthenticated, useLocalStorage]);

  // Add XP - calls backend and handles level up
  const addXP = useCallback(async (amount: number, pillarType: string) => {
    // Apply willpower multiplier
    const willpowerPercent = (state.player.willpower / state.player.maxWillpower) * 100;
    const multiplier = getXPMultiplier(willpowerPercent);
    const adjustedAmount = Math.floor(amount * multiplier);
    
    dispatch({ type: 'ADD_XP', payload: { amount: adjustedAmount, skill: pillarType } });
    
    if (state.isAuthenticated && !useLocalStorage) {
      try {
        const result = await playerApi.addXP(adjustedAmount, pillarType);
        
        // Show level up notification
        if (result.levelUp) {
          showToast(
            `🎉 LEVEL UP! You are now Level ${result.newLevel}!`,
            'success',
            5000
          );
        }
        
        // Refresh player stats from backend
        const statsResult = await playerApi.getPlayerStats();
        const playerData = transformBackendStatsToPlayer(statsResult.stats);
        dispatch({ type: 'SET_PLAYER', payload: playerData });
      } catch (error) {
        logger.error('Failed to add XP:', error);
      }
    }
  }, [state.isAuthenticated, useLocalStorage, showToast, state.player.willpower, state.player.maxWillpower]);

  // ============================================================================
  // Willpower System
  // ============================================================================

  const modifyWillpower = useCallback((action: WillpowerAction) => {
    const { newValue, change, message } = applyWillpowerChange(
      state.player.willpower,
      state.player.maxWillpower,
      action
    );
    
    if (change !== 0) {
      dispatch({ type: 'UPDATE_WILLPOWER', payload: { value: newValue, reason: action.type } });
      
      if (message) {
        const type = change > 0 ? 'success' : 'warning';
        showToast(message, type, 2000);
      }
    }
    
    return newValue;
  }, [state.player.willpower, state.player.maxWillpower, showToast]);

  // ============================================================================
  // Stat Decay System
  // ============================================================================

  const checkAndApplyDecay = useCallback(() => {
    const { results, anyAtrophying } = calculateAllStatDecay(
      state.player.coreStats,
      state.player.statLastUsed,
      state.player.lastDecayCheck
    );
    
    // Filter only stats that actually decayed
    const decayResults = results
      .filter(r => r.decayAmount > 0)
      .map(r => ({ stat: r.stat, newValue: r.newValue }));
    
    if (decayResults.length > 0) {
      dispatch({ type: 'APPLY_STAT_DECAY', payload: { decayResults } });
      
      // Show warning toast
      const decayedStats = decayResults.map(r => r.stat).join(', ');
      showToast(
        `⚠️ Stats decaying: ${decayedStats}. Use them or lose them!`,
        'warning',
        5000
      );
    }
    
    return { results, anyAtrophying };
  }, [state.player.coreStats, state.player.statLastUsed, state.player.lastDecayCheck, showToast]);

  const exerciseStats = useCallback((activity: string, date?: string) => {
    const statsToExercise = getStatsForActivity(activity);
    const exerciseDate = date || new Date().toISOString();
    
    statsToExercise.forEach(stat => {
      dispatch({ type: 'EXERCISE_STAT', payload: { stat, date: exerciseDate } });
    });
  }, []);

  // Gain stats from completing an activity
  const gainStats = useCallback((activityKey: string) => {
    const { newStats, gains } = applyStatGains(state.player.coreStats, activityKey);
    
    if (gains.length > 0) {
      dispatch({ 
        type: 'GAIN_STATS', 
        payload: { gains, activity: activityKey } 
      });
      
      // Show toast for stat gains
      const gainText = gains
        .map(g => `${g.stat} +${g.amount.toFixed(2)}`)
        .join(', ');
      showToast(`💪 Stat gains: ${gainText}`, 'success', 3000);
      
      // Also exercise the stats (update last used)
      exerciseStats(activityKey);
    }
    
    return { newStats, gains };
  }, [state.player.coreStats, showToast, exerciseStats]);

  // Gain stats from pillar leveling
  const gainStatsFromPillarLevel = useCallback((pillar: PillarType, newLevel: number) => {
    const gains = getPassiveStatGainFromPillar(pillar, newLevel);
    
    if (gains.length > 0) {
      dispatch({ 
        type: 'PILLAR_LEVEL_STAT_GAIN', 
        payload: { pillar, newLevel } 
      });
      
      // Show toast for passive gains
      const gainText = gains
        .map(g => `${g.stat} +${g.amount.toFixed(1)}`)
        .join(', ');
      showToast(`📈 ${pillar} Level ${newLevel}! Gains: ${gainText}`, 'success', 4000);
    }
    
    return gains;
  }, [showToast]);

  // Daily reset - called once per day
  const dailyReset = useCallback(() => {
    dispatch({ type: 'DAILY_RESET' });
    checkAndApplyDecay();
  }, [checkAndApplyDecay]);

  // Auth: Login
  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      authApi.setToken(response.token);
      dispatch({ type: 'SET_AUTH', payload: { isAuthenticated: true, username: response.user.username } });
      // User data will be loaded from localStorage via transformUserToPlayer
      const playerData = transformUserToPlayer(response.user);
      dispatch({ type: 'SET_PLAYER', payload: playerData });
      setUseLocalStorage(false);
      showToast(`Welcome back, ${response.user.username}!`, 'success');
    } catch (err) {
      showToast((err as Error).message || 'Login failed', 'error');
      throw err;
    }
  }, [showToast]);

  // Auth: Register
  const register = useCallback(async (email: string, password: string, username: string) => {
    try {
      const response = await authApi.register({ email, username, password });
      authApi.setToken(response.token);
      dispatch({ type: 'SET_AUTH', payload: { isAuthenticated: true, username } });
      const playerData = transformUserToPlayer(response.user);
      dispatch({ type: 'SET_PLAYER', payload: playerData });
      setUseLocalStorage(false);
      showToast(`Welcome, ${username}! Your journey begins now.`, 'success');
    } catch (err: unknown) {
      showToast((err as Error).message || 'Registration failed', 'error');
      throw err;
    }
  }, [showToast]);

  // Auth: Logout
  const logout = useCallback(() => {
    removeToken();
    dispatch({ type: 'SET_AUTH', payload: { isAuthenticated: false, username: null } });
    dispatch({ type: 'SET_PLAYER', payload: createInitialPlayerState() });
    setUseLocalStorage(true);
    showToast('Logged out successfully', 'default');
  }, [showToast]);

  // Load data on mount
  useEffect(() => {
    const loadFromLocalStorage = () => {
      const saved = localStorage.getItem('mirlind-protocol-save');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          dispatch({ type: 'SET_PLAYER', payload: { ...createInitialPlayerState(), ...parsed } });
        } catch (e) {
          logger.error('Failed to parse saved data:', e);
        }
      }
    };

    const loadData = async () => {
      try {
        // Check if we have a token
        if (authApi.getToken()) {
          try {
            const { user } = await authApi.getCurrentUser();
            dispatch({ type: 'SET_AUTH', payload: { isAuthenticated: true, username: user.username } });
            
            // Load player stats from backend
            try {
              const statsResult = await playerApi.getPlayerStats();
              const playerData = transformBackendStatsToPlayer(statsResult.stats);
              dispatch({ type: 'SET_PLAYER', payload: playerData });
            } catch (statsError) {
              logger.error('Failed to load player stats:', statsError);
              // Fall back to user data
              dispatch({ type: 'SET_PLAYER', payload: transformUserToPlayer(user) });
            }
            
            setUseLocalStorage(false);
          } catch {
            // Token invalid, fall back to localStorage
            removeToken();
            loadFromLocalStorage();
          }
        } else {
          loadFromLocalStorage();
        }
      } catch (e) {
        logger.error('Failed to load data:', e);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadData();
  }, []);

  // Auto-save to localStorage when in offline mode
  useEffect(() => {
    if (!state.isLoading && useLocalStorage) {
      localStorage.setItem('mirlind-protocol-save', JSON.stringify(state.player));
    }
  }, [state.player, state.isLoading, useLocalStorage]);

  // Daily willpower reset and stat decay check
  useEffect(() => {
    if (state.isLoading) return;

    const checkDailyReset = () => {
      const today = new Date().toDateString();
      const lastCheck = new Date(state.player.lastDecayCheck).toDateString();
      
      if (today !== lastCheck) {
        // New day - apply daily reset
        dailyReset();
        showToast('🌅 New day! Willpower restored. Stats checked for decay.', 'info', 3000);
      }
    };

    // Check immediately on load
    checkDailyReset();

    // Set up interval to check every hour
    const interval = setInterval(checkDailyReset, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [state.isLoading, state.player.lastDecayCheck, dailyReset, showToast]);

  return (
    <GameContext.Provider value={{ 
      state, 
      dispatch, 
      setView, 
      showToast, 
      trackActivity, 
      login, 
      register, 
      logout,
      addXP,
      // Willpower & Decay
      modifyWillpower,
      checkAndApplyDecay,
      exerciseStats,
      dailyReset,
      // Stat Gains
      gainStats,
      gainStatsFromPillarLevel,
    }}>
      {children}
    </GameContext.Provider>
  );
}

// ============================================================================
// Helper: Transform API User to PlayerStats
// Note: transformUserToPlayer and transformBackendStatsToPlayer are imported from gameHelpers.ts
// useGame hook is imported from './useGame' directly
// ============================================================================
