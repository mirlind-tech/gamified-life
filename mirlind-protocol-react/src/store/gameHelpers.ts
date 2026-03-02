import type { PlayerStats, ActivityStats, PillarType, Pillar, Skill, ProfessionalSkill, StatLastUsed } from '../types';
import type { PlayerStats as BackendPlayerStats } from '../services/playerApi';

export interface ApiUser {
  username?: string;
  name?: string;
  title?: string;
  level?: number;
  xp?: number;
  xpToNext?: number;
  pillars?: Array<{ type: string; [key: string]: unknown }>;
  skills?: Array<Record<string, unknown>>;
  professionalSkills?: Array<Record<string, unknown>>;
  coreStats?: PlayerStats['coreStats'];
  willpower?: number;
  maxWillpower?: number;
  gates?: unknown[];
  activityStats?: ActivityStats;
  xpHistory?: unknown[];
  levelUpHistory?: unknown[];
  totalXPEarned?: number;
  questsCompleted?: number;
  startDate?: string;
  statLastUsed?: StatLastUsed;
  lastDecayCheck?: string;
}

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

export function transformUserToPlayer(user: ApiUser): PlayerStats {
  const pillars: Record<PillarType, Pillar> = {
    craft: { id: 'craft', name: 'Craft', subtitle: 'Technical Mastery', icon: 'zap', color: '#06b6d4', description: 'The foundation of your value', level: 1, xp: 0, xpToNext: 100 },
    vessel: { id: 'vessel', name: 'Vessel', subtitle: 'Physical Excellence', icon: 'muscle', color: '#ec4899', description: 'Your body is the vehicle', level: 1, xp: 0, xpToNext: 100 },
    tongue: { id: 'tongue', name: 'Tongue', subtitle: 'Language & Influence', icon: 'speech', color: '#8b5cf6', description: 'Words are weapons', level: 1, xp: 0, xpToNext: 100 },
    principle: { id: 'principle', name: 'Principle', subtitle: 'Mental Fortitude', icon: 'brain', color: '#a855f7', description: 'Detach from emotion', level: 1, xp: 0, xpToNext: 150 },
    capital: { id: 'capital', name: 'Capital', subtitle: 'Financial Mastery', icon: 'money', color: '#10b981', description: 'Money is a tool', level: 1, xp: 0, xpToNext: 100 },
  };

  user.pillars?.forEach((p) => {
    if (pillars[p.type as PillarType]) {
      pillars[p.type as PillarType] = { ...pillars[p.type as PillarType], ...p } as Pillar;
    }
  });

  const skills: Record<string, Skill> = {};
  user.skills?.forEach((s) => {
    const skill = s as unknown as Skill;
    if (skill.id) skills[skill.id] = skill;
  });

  const professionalSkills: Record<string, ProfessionalSkill> = {};
  user.professionalSkills?.forEach((s) => {
    const skill = s as unknown as ProfessionalSkill;
    if (skill.id) professionalSkills[skill.id] = skill;
  });

  const today = new Date().toISOString();
  
  return {
    name: user.name || 'Unnamed Warrior',
    title: user.title || 'Novice Seeker',
    level: user.level || 1,
    xp: user.xp || 0,
    xpToNext: user.xpToNext || 100,
    pillars,
    skills,
    professionalSkills,
    coreStats: user.coreStats || {
      strength: 10,
      agility: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
      constitution: 10,
      discipline: 10,
      creativity: 10,
    },
    willpower: user.willpower ?? 100,
    maxWillpower: user.maxWillpower ?? 100,
    unlockedGates: [],
    gates: [],
    activityStats: user.activityStats || initialActivityStats,
    xpHistory: [],
    levelUpHistory: [],
    totalXPEarned: user.totalXPEarned ?? 0,
    questsCompleted: user.questsCompleted ?? 0,
    startDate: user.startDate || today,
    statLastUsed: user.statLastUsed || {
      strength: today,
      agility: today,
      intelligence: today,
      wisdom: today,
      charisma: today,
      constitution: today,
      discipline: today,
      creativity: today,
    } as StatLastUsed,
    lastDecayCheck: user.lastDecayCheck || today,
  };
}

// Helper: Transform backend stats to PlayerStats
export function transformBackendStatsToPlayer(stats: BackendPlayerStats): PlayerStats {
  const pillarDefaults: Record<PillarType, Pillar> = {
    craft: { id: 'craft', name: 'Craft', subtitle: 'Technical Mastery', icon: 'zap', color: '#06b6d4', description: 'The foundation of your value', level: 1, xp: 0, xpToNext: 100 },
    vessel: { id: 'vessel', name: 'Vessel', subtitle: 'Physical Excellence', icon: 'muscle', color: '#ec4899', description: 'Your body is the vehicle', level: 1, xp: 0, xpToNext: 100 },
    tongue: { id: 'tongue', name: 'Tongue', subtitle: 'Language & Influence', icon: 'speech', color: '#8b5cf6', description: 'Words are weapons', level: 1, xp: 0, xpToNext: 100 },
    principle: { id: 'principle', name: 'Principle', subtitle: 'Mental Fortitude', icon: 'brain', color: '#a855f7', description: 'Detach from emotion', level: 1, xp: 0, xpToNext: 150 },
    capital: { id: 'capital', name: 'Capital', subtitle: 'Financial Mastery', icon: 'money', color: '#10b981', description: 'Money is a tool', level: 1, xp: 0, xpToNext: 100 },
  };

  // Merge backend pillars with defaults
  const pillars = { ...pillarDefaults };
  Object.entries(stats.pillars || {}).forEach(([key, data]) => {
    if (pillars[key as PillarType]) {
      pillars[key as PillarType] = { ...pillars[key as PillarType], ...data };
    }
  });

  const today = new Date().toISOString();
  
  return {
    name: 'Unnamed Warrior',
    title: 'Novice Seeker',
    level: stats.level || 1,
    xp: stats.xp || 0,
    xpToNext: stats.xpToNext || 100,
    pillars,
    skills: {}, // Backend skills don't match frontend format yet
    professionalSkills: {},
    coreStats: {
      strength: 10 + (pillars.vessel?.level || 0) * 2,
      agility: 10 + (pillars.vessel?.level || 0),
      intelligence: 10 + (pillars.craft?.level || 0) * 2,
      wisdom: 10 + (pillars.principle?.level || 0) * 2,
      charisma: 10 + (pillars.tongue?.level || 0) * 2,
      constitution: 10,
      discipline: 10,
      creativity: 10,
    },
    willpower: 100,
    maxWillpower: 100,
    unlockedGates: [],
    gates: [],
    activityStats: {
      ...initialActivityStats,
      ...stats.activityStats,
    },
    xpHistory: [],
    levelUpHistory: [],
    totalXPEarned: stats.xp || 0,
    questsCompleted: stats.activityStats?.questsCompleted || 0,
    startDate: today,
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
  };
}
