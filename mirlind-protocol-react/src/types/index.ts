// Types for Mirlind Protocol

export interface Skill {
  id: string;
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
  pillar: PillarType;
  parent?: string;
}

export interface Pillar {
  id: PillarType;
  name: string;
  subtitle: string;
  icon: string;
  color: string;
  description: string;
  level: number;
  xp: number;
  xpToNext: number;
}

export type PillarType = 'craft' | 'vessel' | 'tongue' | 'principle' | 'capital';

export interface ProfessionalSkill {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlock: string;
  effects: string[];
  level: number;
  xp: number;
  xpToNext: number | null;
  unlocked: boolean;
  maxed: boolean;
}

export interface Habit {
  id: string;
  name: string;
  description: string;
  category: PillarType | 'general';
  icon: string;
  xpReward: number;
  targetSkill: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  lastCheckIn: string | null;
  isCustom: boolean;
  completedDays: string[];
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  time: string;
  completed: boolean;
  xpReward: number;
  targetSkill?: string;
  icon: string;
}

export interface Gate {
  id: string;
  name: string;
  description: string;
  requirements: GateRequirement[];
  reward: string;
  xpBonus: number;
  locked: boolean;
  justUnlocked?: boolean;
}

export interface GateRequirement {
  skill?: string;
  level?: number;
  custom?: string;
  value?: number | boolean;
  name: string;
}

export interface ActivityStats {
  focusSessions: number;
  focusMinutes: number;
  journalEntries: number;
  habitsCompleted: number;
  meditationMinutes: number;
  dailyQuestStreak: number;
  lastQuestDate: string | null;
  aiCoachChats: number;
  questsCompleted: number;
}

// RPG Core Stats
export interface CoreStats {
  strength: number;      // Physical power - from vessel pillar + gym habits
  agility: number;       // Speed/reflexes - from vessel + focus sessions
  intelligence: number;  // Mental capacity - from craft pillar + learning
  wisdom: number;        // Decision making - from principle + journal
  charisma: number;      // Social skills - from tongue + communication
  constitution: number;  // Endurance/health - from vessel + habits
  discipline: number;    // Willpower - from all consistent habits
  creativity: number;    // Innovation - from craft + problem solving
}

export interface PlayerStats {
  name: string;
  title: string;
  level: number;
  xp: number;
  xpToNext: number;
  pillars: Record<PillarType, Pillar>;
  skills: Record<string, Skill>;
  professionalSkills: Record<string, ProfessionalSkill>;
  coreStats: CoreStats;
  willpower: number;
  maxWillpower: number;
  unlockedGates: string[];
  gates: Gate[];
  activityStats: ActivityStats;
  xpHistory: XPEntry[];
  levelUpHistory: LevelUpEntry[];
  totalXPEarned: number;
  questsCompleted: number;
  startDate: string;
}

export interface XPEntry {
  amount: number;
  skill: string;
  date: string;
}

export interface LevelUpEntry {
  skill: string;
  type: 'skill' | 'pillar';
  level: number;
  date: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  gratitude: string;
  intentions: string;
  lessons: string;
  score: number;
}

export type ViewType = 
  | 'tree' 
  | 'cards' 
  | 'quests' 
  | 'gates' 
  | 'analytics' 
  | 'achievements' 
  | 'focus' 
  | 'journal' 
  | 'education' 
  | 'meditate' 
  | 'habits' 
  | 'coach'
  | 'notifications'
  | 'challenges'
  | 'protocol'
  | 'auth';

export interface Toast {
  id: string;
  message: string;
  duration: number;
  type: 'success' | 'error' | 'warning' | 'default';
}
