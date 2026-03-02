import { apiRequest } from './authApi';

export interface PlayerStats {
  level: number;
  xp: number;
  xpToNext: number;
  pillars: Record<string, { level: number; xp: number; xpToNext: number; name: string; color: string }>;
  skills: Record<string, { level: number; xp: number; xpToNext: number; parent: string }>;
  activityStats: {
    focusSessions: number;
    focusMinutes: number;
    habitsCompleted: number;
    journalEntries: number;
    questsCompleted: number;
    meditationMinutes: number;
  };
}

export interface AddXPResponse {
  message: string;
  levelUp: boolean;
  levelsGained: number;
  newLevel: number;
  xp: number;
  xpToNext: number;
  progress: number;
}

export const getPlayerStats = async (): Promise<{ stats: PlayerStats }> => {
  return apiRequest<{ stats: PlayerStats }>('/player/stats');
};

export const updatePlayerStats = async (stats: Partial<PlayerStats>): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>('/player/stats', {
    method: 'PUT',
    body: JSON.stringify(stats),
  });
};

export const addXP = async (amount: number, pillar?: string, skillId?: string): Promise<AddXPResponse> => {
  return apiRequest<AddXPResponse>('/player/add-xp', {
    method: 'POST',
    body: JSON.stringify({ amount, pillar, skillId }),
  });
};

export const trackActivity = async (type: string, count: number = 1): Promise<{ message: string; type: string; total: number }> => {
  return apiRequest<{ message: string; type: string; total: number }>('/player/activity', {
    method: 'POST',
    body: JSON.stringify({ type, count }),
  });
};
