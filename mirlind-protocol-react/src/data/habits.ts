import type { Habit } from '../types';
import { EMOJIS } from '../utils/emojis';

export const DEFAULT_HABITS: Habit[] = [
  {
    id: 'morning_routine',
    name: '05:00 Wake Up',
    description: 'Hard wake, no snooze',
    category: 'general',
    icon: EMOJIS.WAKE_UP,
    xpReward: 50,
    targetSkill: 'timeManagement',
    frequency: 'daily',
    streak: 0,
    lastCheckIn: null,
    isCustom: false,
    completedDays: [],
  },
  {
    id: 'cold_shower',
    name: 'Cold Shower',
    description: '3 minutes cold exposure',
    category: 'vessel',
    icon: EMOJIS.COLD_SHOWER,
    xpReward: 30,
    targetSkill: 'painTolerance',
    frequency: 'daily',
    streak: 0,
    lastCheckIn: null,
    isCustom: false,
    completedDays: [],
  },
  {
    id: 'german_anki',
    name: 'Anki German',
    description: '50 cards minimum',
    category: 'tongue',
    icon: EMOJIS.GERMAN,
    xpReward: 40,
    targetSkill: 'germanA1',
    frequency: 'daily',
    streak: 0,
    lastCheckIn: null,
    isCustom: false,
    completedDays: [],
  },
  {
    id: 'coding_session',
    name: 'Deep Work Coding',
    description: '2 hours focused coding',
    category: 'craft',
    icon: EMOJIS.CODING,
    xpReward: 100,
    targetSkill: 'javascript',
    frequency: 'daily',
    streak: 0,
    lastCheckIn: null,
    isCustom: false,
    completedDays: [],
  },
  {
    id: 'gym_workout',
    name: 'Baki Protocol',
    description: 'Gym session - no excuses',
    category: 'vessel',
    icon: EMOJIS.GYM,
    xpReward: 80,
    targetSkill: 'strength',
    frequency: 'daily',
    streak: 0,
    lastCheckIn: null,
    isCustom: false,
    completedDays: [],
  },
  {
    id: 'meditation',
    name: 'Meditation',
    description: '10 minutes mindfulness',
    category: 'principle',
    icon: EMOJIS.MEDITATION,
    xpReward: 25,
    targetSkill: 'emotionalControl',
    frequency: 'daily',
    streak: 0,
    lastCheckIn: null,
    isCustom: false,
    completedDays: [],
  },
  {
    id: 'expense_tracking',
    name: 'Track Expenses',
    description: 'Log all spending',
    category: 'capital',
    icon: EMOJIS.EXPENSES,
    xpReward: 20,
    targetSkill: 'expenseTracking',
    frequency: 'daily',
    streak: 0,
    lastCheckIn: null,
    isCustom: false,
    completedDays: [],
  },
  {
    id: 'daily_journal',
    name: 'Daily Journal',
    description: 'Reflect and plan',
    category: 'principle',
    icon: EMOJIS.JOURNAL_ICON,
    xpReward: 25,
    targetSkill: 'emotionalControl',
    frequency: 'daily',
    streak: 0,
    lastCheckIn: null,
    isCustom: false,
    completedDays: [],
  },
];

export function getHabits(): Habit[] {
  const saved = localStorage.getItem('mirlind-habits');
  if (saved) {
    return JSON.parse(saved);
  }
  localStorage.setItem('mirlind-habits', JSON.stringify(DEFAULT_HABITS));
  return DEFAULT_HABITS;
}

export function saveHabits(habits: Habit[]) {
  localStorage.setItem('mirlind-habits', JSON.stringify(habits));
}

export function checkInHabit(habitId: string): Habit | null {
  const habits = getHabits();
  const habit = habits.find(h => h.id === habitId);
  
  if (!habit) return null;
  
  const today = new Date().toISOString().split('T')[0];
  
  // Already checked in today
  if (habit.completedDays.includes(today)) {
    return null;
  }
  
  // Update streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  if (habit.lastCheckIn === yesterdayStr) {
    habit.streak += 1;
  } else if (habit.lastCheckIn !== today) {
    habit.streak = 1; // Reset streak
  }
  
  habit.lastCheckIn = today;
  habit.completedDays.push(today);
  
  saveHabits(habits);
  return habit;
}

export function isHabitCheckedInToday(habitId: string): boolean {
  const habit = getHabits().find(h => h.id === habitId);
  if (!habit) return false;
  
  const today = new Date().toISOString().split('T')[0];
  return habit.completedDays.includes(today);
}

export function addCustomHabit(habit: Omit<Habit, 'id' | 'streak' | 'lastCheckIn' | 'isCustom' | 'completedDays'>): Habit {
  const habits = getHabits();
  const newHabit: Habit = {
    ...habit,
    id: `custom_${Date.now()}`,
    streak: 0,
    lastCheckIn: null,
    isCustom: true,
    completedDays: [],
  };
  
  habits.push(newHabit);
  saveHabits(habits);
  return newHabit;
}

export function removeHabit(habitId: string) {
  const habits = getHabits().filter(h => h.id !== habitId);
  saveHabits(habits);
}

export function getHabitCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    craft: '#06b6d4',
    vessel: '#ec4899',
    tongue: '#8b5cf6',
    principle: '#a855f7',
    capital: '#10b981',
    general: '#f59e0b',
  };
  return colors[category] || '#64748b';
}
