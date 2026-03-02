// Types for Mirlind Protocol V2 (Next.js)
// Ported from V1 with API integration

// ============================================================================
// Auth Types (re-export from auth.ts)
// ============================================================================

export type { User, AuthResponse, LoginRequest, RegisterRequest, ApiError } from './auth';

// ============================================================================
// Player & Stats Types
// ============================================================================

export interface PlayerStats {
  id?: string;
  user_id?: string;
  level: number;
  xp: number;
  xp_to_next: number;
  total_xp_earned: number;
  title?: string;
  streak_days?: number;
  streak_started_at?: string | null;
  last_active?: string;
  created_at?: string;
  updated_at?: string;
  pillars?: Record<string, unknown>;
  skills?: Record<string, unknown>;
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

// ============================================================================
// Pillar Types (5 Core Pillars)
// ============================================================================

export type PillarType = 'craft' | 'vessel' | 'tongue' | 'principle' | 'capital';

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

// ============================================================================
// Skill Types
// ============================================================================

export interface Skill {
  id: string;
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
  pillar: PillarType;
  parent?: string;
}

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

// ============================================================================
// Body/Vessel Types
// ============================================================================

export interface BodyMeasurements {
  id?: string;
  user_id?: string;
  date?: string;
  weight?: number;
  height?: number;
  body_fat?: number;
  biceps?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  arms?: number;
  thighs?: number;
  calves?: number;
  shoulders?: number;
  notes?: string;
  created_at?: string;
}

export interface WeightEntry {
  id: string;
  user_id?: string;
  weight: number;
  date: string;
  notes?: string;
  created_at?: string;
  body_fat_percentage?: number;
}

export interface PhotoEntry {
  id: string;
  user_id?: string;
  photo_type: 'front' | 'side' | 'back';
  file_path?: string;
  photo_url?: string;
  week_number?: number;
  created_at?: string;
}

// ============================================================================
// Protocol Types
// ============================================================================

export interface ProtocolEntry {
  id?: string | null;
  user_id?: string;
  date: string;
  score?: number;
  wake05?: boolean;
  german_study?: boolean;
  gym_workout?: boolean;
  sleep22?: boolean;
  coding_hours?: number;
  wake_time?: string;
  sleep_time?: string;
  cold_shower?: boolean;
  workout?: boolean;
  protein_intake?: boolean;
  no_sugar?: boolean;
  read_pages?: number;
  meditation_minutes?: number;
  completed?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProtocolStreak {
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
}

// ============================================================================
// Workout Types
// ============================================================================

export interface Workout {
  id: string;
  user_id?: string;
  date: string;
  type?: string;
  name?: string;
  duration_minutes: number;
  exercises: Exercise[];
  notes?: string;
  created_at?: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight?: number;
}

// ============================================================================
// Code/Career Types
// ============================================================================

export interface CodeEntry {
  id?: string | null;
  user_id?: string;
  date: string;
  hours: number;
  language?: string;
  project?: string;
  commits?: number;
  github_commits?: number;
  notes?: string;
  created_at?: string;
}

export interface JobApplication {
  id: string;
  user_id?: string;
  company: string;
  position: string;
  status: 'saved' | 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'accepted' | 'withdrawn' | 'ghosted';
  applied_date: string;
  location?: string;
  salary_range?: string;
  url?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface JobStats {
  total_applied: number;
  by_status: Record<string, number>;
  response_rate?: number;
  interview_rate?: number;
  total_interviews?: number;
  target_applications?: number;
  target_interviews?: number;
  days_remaining?: number;
  weekly_applications_needed?: number;
  applications_remaining?: number;
  interviews_remaining?: number;
}

// ============================================================================
// Curriculum Types
// ============================================================================

export interface TechSkill {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  estimated_hours: number;
  icon: string;
  color: string;
  progress: number;
  hours_spent: number;
  status: 'not_started' | 'in_progress' | 'completed';
}

export interface TechModule {
  id: string;
  key: string;
  title: string;
  description: string;
  estimated_hours: number;
  phase: number;
  topics: string[];
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  hours_spent: number;
  completed_at: string | null;
}

export interface CurriculumStats {
  total_skills: number;
  total_modules: number;
  completed_modules: number;
  skills_completed: number;
  hours_total: number;
  overall_progress: number;
  estimated_total_hours: number;
}

// ============================================================================
// German Learning Types
// ============================================================================

export interface GermanEntry {
  id?: string | null;
  user_id?: string;
  date: string;
  minutes?: number;
  activity?: string;
  anki_cards?: number;
  anki_time?: number;
  anki_streak?: number;
  radio_hours?: number;
  tandem_minutes?: number;
  total_words?: number;
  language_transfer?: boolean;
  language_transfer_lesson?: number;
  notes?: string;
  created_at?: string;
}

// ============================================================================
// Finance Types
// ============================================================================

export interface FinanceProfile {
  id?: string;
  user_id?: string;
  monthly_income: number;
  monthly_fixed_costs?: number;
  food_budget?: number;
  discretionary_budget?: number;
  savings_goal: number;
  savings_goal_target_date?: string;
  current_savings: number;
  monthly_savings_target?: number;
  fixed_costs_breakdown?: Record<string, number>;
  caps_balance?: number;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// AI Coach Types
// ============================================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface MemoryEntry {
  id: string;
  user_id: string;
  content: string;
  category: string;
  importance: number;
  created_at: string;
}

// ============================================================================
// Habit Types
// ============================================================================

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

// ============================================================================
// Journal Types
// ============================================================================

export interface JournalEntry {
  id: string;
  user_id: string;
  date: string;
  content: string;
  gratitude: string;
  intentions: string;
  lessons: string;
  score: number;
  created_at: string;
}

// ============================================================================
// Weekly Planning Types
// ============================================================================

export interface WeeklyPlan {
  id?: string;
  user_id?: string;
  week_start: string;
  goals: string[];
  objectives?: string[];
  actions?: Record<string, string[]>;
  focus_areas?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface WeeklyReview {
  id?: string;
  user_id?: string;
  week_start: string;
  wins: string[];
  challenges?: string[];
  failures?: string[];
  learnings?: string[];
  lessons?: string[];
  score: number;
  created_at?: string;
}

// ============================================================================
// Fang Yuan Types
// ============================================================================

export interface FangYuanPrinciple {
  number: number;
  title: string;
  description: string;
  application: string;
  xpRequired?: number;
  unlocked?: boolean;
  quizScore?: number;
  quizPassed?: boolean;
}

export interface FangYuanDaily {
  principle: FangYuanPrinciple;
  quote: string;
}

// ============================================================================
// Challenge Types
// ============================================================================

export interface Challenge {
  id: string;
  key: string;
  title: string;
  description: string;
  difficulty: string;
  xp_reward?: number;
  xpReward?: number;
  duration_days?: number;
  durationDays?: number;
  joined?: boolean;
  status?: string;
  progress: number;
  streak?: number;
  daysCompleted?: number;
  startedAt?: string | null;
  completedAt?: string | null;
}

// ============================================================================
// UI Types
// ============================================================================

export type ViewType = 
  | 'dashboard'
  | 'body'
  | 'mind'
  | 'career'
  | 'finance'
  | 'german'
  | 'coach'
  | 'challenges'
  | 'protocol'
  | 'profile'
  | 'skills'
  | 'curriculum'
  | 'jobs'
  | 'weekly'
  | 'journal'
  | 'meditation'
  | 'settings';

export interface Toast {
  id: string;
  message: string;
  duration: number;
  type: 'success' | 'error' | 'warning' | 'info' | 'default';
}

export interface NavItem {
  id: ViewType;
  icon: string;
  label: string;
  href: string;
  shortcut?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

// ============================================================================
// Core Stats (RPG Style)
// ============================================================================

export interface CoreStats {
  strength: number;
  agility: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  constitution: number;
  discipline: number;
  creativity: number;
}

export interface StatLastUsed {
  strength: string;
  agility: string;
  intelligence: string;
  wisdom: string;
  charisma: string;
  constitution: string;
  discipline: string;
  creativity: string;
}

// ============================================================================
// Willpower System
// ============================================================================

export type WillpowerStatus = 'exhausted' | 'low' | 'moderate' | 'high' | 'peak';

export interface WillpowerState {
  current: number;
  max: number;
  status: WillpowerStatus;
  dailyDepleted: number;
  dailyRestored: number;
  lastCheck: string;
}

export const WILLPOWER_COSTS = {
  skipHabit: 5,
  missWakeUp: 10,
  missGym: 15,
  stayUpLate: 10,
  procrastinate: 8,
  junkFood: 5,
  skipColdShower: 5,
  socialMediaBinge: 10,
  breakStreak: 15,
} as const;

export const WILLPOWER_RESTORE = {
  completeHabit: 3,
  coldShower: 10,
  meditation: 8,
  deepWork: 5,
  gymWorkout: 10,
  perfectDay: 20,
  levelUp: 25,
  goodSleep: 5,
  journal: 3,
} as const;

// ============================================================================
// Decay Configuration
// ============================================================================

export const STAT_DECAY_DAYS = {
  strength: 3,
  agility: 3,
  constitution: 5,
  intelligence: 7,
  wisdom: 7,
  charisma: 5,
  discipline: 2,
  creativity: 10,
} as const;

export const STAT_DECAY_RATE = 0.05;
