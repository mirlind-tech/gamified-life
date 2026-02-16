import type { Quest } from '../types';
import { EMOJIS } from '../utils/emojis';

export const DEFAULT_QUESTS: Quest[] = [
  {
    id: 'wake_up',
    name: `05:00 Wake Up`,
    description: 'Hard wake, no snooze',
    time: '05:00',
    completed: false,
    xpReward: 50,
    targetSkill: 'timeManagement',
    icon: EMOJIS.WAKE_UP,
  },
  {
    id: 'cold_shower',
    name: `Cold Shower`,
    description: '3 minutes cold exposure',
    time: '05:30',
    completed: false,
    xpReward: 30,
    targetSkill: 'painTolerance',
    icon: EMOJIS.COLD_SHOWER,
  },
  {
    id: 'anki_german',
    name: `Anki German`,
    description: '50 cards minimum',
    time: '06:00',
    completed: false,
    xpReward: 40,
    targetSkill: 'germanA1',
    icon: EMOJIS.GERMAN,
  },
  {
    id: 'deep_work_1',
    name: `Deep Work Session 1`,
    description: '2 hours focused coding',
    time: '09:00',
    completed: false,
    xpReward: 100,
    targetSkill: 'javascript',
    icon: EMOJIS.CODING,
  },
  {
    id: 'gym',
    name: `Baki Protocol`,
    description: 'Gym session - no excuses',
    time: '17:00',
    completed: false,
    xpReward: 80,
    targetSkill: 'strength',
    icon: EMOJIS.GYM,
  },
  {
    id: 'track_expenses',
    name: `Track Expenses`,
    description: 'Log all spending',
    time: '20:00',
    completed: false,
    xpReward: 20,
    targetSkill: 'expenseTracking',
    icon: EMOJIS.EXPENSES,
  },
  {
    id: 'journal',
    name: `Daily Journal`,
    description: 'Reflect and plan',
    time: '21:00',
    completed: false,
    xpReward: 25,
    targetSkill: 'emotionalControl',
    icon: EMOJIS.JOURNAL_ICON,
  },
  {
    id: 'no_albanian',
    name: `No Albanian Bubble`,
    description: 'Only German/English',
    time: 'All day',
    completed: false,
    xpReward: 35,
    targetSkill: 'germanA1',
    icon: EMOJIS.NO_ALBANIAN,
  },
];

// Aliases for backward compatibility
export const getQuests = getDailyQuests;

export function getTimeUntilReset(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function getDailyQuests(): Quest[] {
  const saved = localStorage.getItem('mirlind-quests');
  if (saved) {
    const parsed = JSON.parse(saved);
    // Check if it's a new day
    const lastReset = localStorage.getItem('mirlind-quests-reset');
    const today = new Date().toDateString();
    
    if (lastReset === today) {
      return parsed;
    }
  }
  
  // Reset quests for new day
  const newQuests = DEFAULT_QUESTS.map(q => ({ ...q, completed: false }));
  localStorage.setItem('mirlind-quests', JSON.stringify(newQuests));
  localStorage.setItem('mirlind-quests-reset', new Date().toDateString());
  return newQuests;
}

export function completeQuest(questId: string): Quest | null {
  const quests = getDailyQuests();
  const quest = quests.find(q => q.id === questId);
  
  if (quest && !quest.completed) {
    quest.completed = true;
    localStorage.setItem('mirlind-quests', JSON.stringify(quests));
    return quest;
  }
  
  return null;
}

export function getCompletedQuestsCount(): number {
  return getDailyQuests().filter(q => q.completed).length;
}
