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

// Track when each stat was last exercised to calculate decay
export interface StatLastUsed {
  strength: string;      // ISO date
  agility: string;
  intelligence: string;
  wisdom: string;
  charisma: string;
  constitution: string;
  discipline: string;
  creativity: string;
}

// Decay configuration per stat (days until decay starts)
export const STAT_DECAY_DAYS = {
  strength: 3,        // Physical stats decay fast
  agility: 3,
  constitution: 5,
  intelligence: 7,    // Mental stats decay slower
  wisdom: 7,
  charisma: 5,
  discipline: 2,      // Discipline decays fastest (use it or lose it)
  creativity: 10,     // Creativity decays slowest
} as const;

// Decay rate (% of stat lost per day after grace period)
export const STAT_DECAY_RATE = 0.05; // 5% per day

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
  // Stat decay tracking
  statLastUsed: StatLastUsed;
  lastDecayCheck: string; // ISO date of last decay calculation
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

// ============================================================================
// Willpower System
// ============================================================================

// Activities that deplete willpower
export const WILLPOWER_COSTS = {
  skipHabit: 5,           // Skipping a daily habit
  missWakeUp: 10,         // Not waking at 05:00
  missGym: 15,            // Skipping gym day
  stayUpLate: 10,         // Missing 22:00 sleep
  procrastinate: 8,       // Not starting deep work on time
  junkFood: 5,            // Eating off-protocol
  skipColdShower: 5,      // Skipping cold shower
  socialMediaBinge: 10,   // Wasting time on social media
  breakStreak: 15,        // Breaking a multi-day streak
} as const;

// Activities that replenish willpower
export const WILLPOWER_RESTORE = {
  completeHabit: 3,       // Completing any habit
  coldShower: 10,         // Cold shower completion
  meditation: 8,          // Meditation session
  deepWork: 5,            // 2-hour deep work block
  gymWorkout: 10,         // Gym session
  perfectDay: 20,         // 100% protocol completion
  levelUp: 25,            // Leveling up any skill
  goodSleep: 5,           // 7+ hours quality sleep
  journal: 3,             // Daily journal entry
} as const;

// Willpower status effects
export type WillpowerStatus = 'exhausted' | 'low' | 'moderate' | 'high' | 'peak';

export interface WillpowerState {
  current: number;
  max: number;
  status: WillpowerStatus;
  dailyDepleted: number;    // Track daily depletion
  dailyRestored: number;    // Track daily restoration
  lastCheck: string;        // ISO date
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
