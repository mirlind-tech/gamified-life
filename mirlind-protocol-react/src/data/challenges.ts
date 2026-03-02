import { EMOJIS } from '../utils/emojis';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'physical' | 'mental' | 'discipline' | 'social' | 'craft';
  difficulty: 1 | 2 | 3 | 4 | 5;
  xpReward: number;
  icon: string;
  quote: string;
  author: 'Fang Yuan' | 'Baki Hanma';
  requirements?: {
    minLevel?: number;
    completedChallenges?: string[];
  };
}

export interface UserChallenge extends Challenge {
  completed: boolean;
  completedAt?: string;
  streak: number;
}

// Daily challenges pool - rotates daily
export const CHALLENGES_POOL: Challenge[] = [
  // Physical Challenges (Baki-inspired)
  {
    id: 'cold_shower',
    title: 'Cold Immersion',
    description: 'Take a 3-minute cold shower. Embrace the discomfort. Forge your will.',
    type: 'physical',
    difficulty: 2,
    xpReward: 50,
    icon: EMOJIS.COLD_SHOWER,
    quote: 'Pain is just weakness leaving the body.',
    author: 'Baki Hanma',
  },
  {
    id: 'push_limit',
    title: 'Push Beyond Limits',
    description: 'During your workout, do one more rep than you think you can. Then do another.',
    type: 'physical',
    difficulty: 3,
    xpReward: 75,
    icon: EMOJIS.GYM,
    quote: 'The only thing that matters is becoming stronger than you were yesterday.',
    author: 'Baki Hanma',
  },
  {
    id: 'fast_training',
    title: 'Fasted Training',
    description: 'Train on an empty stomach. Push through the hunger. Master your body.',
    type: 'physical',
    difficulty: 4,
    xpReward: 100,
    icon: EMOJIS.FIRE,
    quote: 'Discipline is doing what needs to be done, even when you do not feel like it.',
    author: 'Baki Hanma',
  },
  {
    id: 'endurance_test',
    title: 'Endurance Trial',
    description: '30 minutes of continuous cardio. No stopping. No excuses.',
    type: 'physical',
    difficulty: 3,
    xpReward: 60,
    icon: EMOJIS.RUN,
    quote: 'Your only limit is you.',
    author: 'Baki Hanma',
  },
  
  // Mental Challenges (Fang Yuan-inspired)
  {
    id: 'emotional_detach',
    title: 'Emotional Detachment',
    description: 'Today, observe your emotions without reacting to them. Be the strategist, not the pawn.',
    type: 'mental',
    difficulty: 4,
    xpReward: 100,
    icon: EMOJIS.BRAIN,
    quote: 'Emotions are tools. Use them, do not be used by them.',
    author: 'Fang Yuan',
  },
  {
    id: 'strategic_analysis',
    title: 'Strategic Analysis',
    description: 'Analyze one situation today purely on costs and benefits. Remove all emotional bias.',
    type: 'mental',
    difficulty: 3,
    xpReward: 75,
    icon: EMOJIS.CHART,
    quote: 'The path to power is paved with calculated risks.',
    author: 'Fang Yuan',
  },
  {
    id: 'opportunity_hunt',
    title: 'Opportunity Hunt',
    description: 'Find one opportunity others are missing. It could be anywhere - work, study, relationships.',
    type: 'mental',
    difficulty: 3,
    xpReward: 80,
    icon: EMOJIS.SEARCH,
    quote: 'In this world, only the useful are remembered. Only the strong are respected.',
    author: 'Fang Yuan',
  },
  {
    id: 'adaptability_test',
    title: 'Adapt and Overcome',
    description: 'When something goes wrong today, adapt immediately. No complaints. No delays.',
    type: 'mental',
    difficulty: 2,
    xpReward: 50,
    icon: EMOJIS.REFRESH,
    quote: 'Adapt or perish. There is no middle ground.',
    author: 'Fang Yuan',
  },
  
  // Discipline Challenges
  {
    id: 'wake_early',
    title: 'Dawn Warrior',
    description: 'Wake up at 5 AM. The world belongs to those who rise before it.',
    type: 'discipline',
    difficulty: 3,
    xpReward: 75,
    icon: EMOJIS.WAKE_UP,
    quote: 'The strong do what they can, the weak suffer what they must.',
    author: 'Fang Yuan',
  },
  {
    id: 'no_sugar',
    title: 'Sugar Fast',
    description: 'No sugar today. Not even a taste. Your body is a temple, not a trash can.',
    type: 'discipline',
    difficulty: 2,
    xpReward: 50,
    icon: EMOJIS.NO_SUGAR,
    quote: 'Discipline is doing what needs to be done, even when you do not feel like it.',
    author: 'Baki Hanma',
  },
  {
    id: 'deep_work',
    title: 'Deep Work Session',
    description: '2 hours of uninterrupted focus. No phone. No distractions. Pure creation.',
    type: 'discipline',
    difficulty: 3,
    xpReward: 80,
    icon: EMOJIS.FOCUS,
    quote: 'Train until your heroes become rivals.',
    author: 'Baki Hanma',
  },
  {
    id: 'expense_track',
    title: 'Financial Vigilance',
    description: 'Track every single expense today. Know where every coin flows.',
    type: 'discipline',
    difficulty: 1,
    xpReward: 30,
    icon: EMOJIS.EXPENSES,
    quote: 'In this world, only the useful are remembered.',
    author: 'Fang Yuan',
  },
  
  // Social Challenges
  {
    id: 'initiate_conversation',
    title: 'Social Initiative',
    description: 'Start a conversation with someone new. Network is net worth.',
    type: 'social',
    difficulty: 3,
    xpReward: 60,
    icon: EMOJIS.SPEECH,
    quote: 'Words are weapons. Sharpen them.',
    author: 'Fang Yuan',
  },
  {
    id: 'language_practice',
    title: 'Tongue Mastery',
    description: 'Practice your target language for 30 minutes. No breaks. Full immersion.',
    type: 'social',
    difficulty: 2,
    xpReward: 50,
    icon: EMOJIS.GERMAN,
    quote: 'The body achieves what the mind believes.',
    author: 'Baki Hanma',
  },
  
  // Craft Challenges
  {
    id: 'skill_practice',
    title: 'Craft Mastery',
    description: 'Practice your main skill for 1 hour. Deliberate. Focused. Ruthless.',
    type: 'craft',
    difficulty: 2,
    xpReward: 60,
    icon: EMOJIS.CODE,
    quote: 'Every setback is just another opportunity to grow stronger.',
    author: 'Fang Yuan',
  },
  {
    id: 'learn_new',
    title: 'Knowledge Hunt',
    description: 'Learn one new concept in your field. Just one. But learn it deeply.',
    type: 'craft',
    difficulty: 2,
    xpReward: 50,
    icon: EMOJIS.BOOK,
    quote: 'Regret is for the weak. I take what I want.',
    author: 'Fang Yuan',
  },
];

// Get daily challenges based on date
export function getDailyChallenges(): Challenge[] {
  const today = new Date().toDateString();
  const saved = localStorage.getItem('mirlind-daily-challenges');
  
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed.date === today) {
      return parsed.challenges;
    }
  }
  
  // Generate new daily challenges
  const shuffled = [...CHALLENGES_POOL].sort(() => 0.5 - Math.random());
  const dailyChallenges = shuffled.slice(0, 3);
  
  localStorage.setItem('mirlind-daily-challenges', JSON.stringify({
    date: today,
    challenges: dailyChallenges,
  }));
  
  return dailyChallenges;
}

// Get challenge by ID
export function getChallengeById(id: string): Challenge | undefined {
  return CHALLENGES_POOL.find(c => c.id === id);
}

// Get difficulty label
export function getDifficultyLabel(difficulty: number): string {
  switch (difficulty) {
    case 1: return 'Novice';
    case 2: return 'Apprentice';
    case 3: return 'Warrior';
    case 4: return 'Elite';
    case 5: return 'Legend';
    default: return 'Unknown';
  }
}

// Get difficulty color
export function getDifficultyColor(difficulty: number): string {
  switch (difficulty) {
    case 1: return '#10b981';
    case 2: return '#06b6d4';
    case 3: return '#f59e0b';
    case 4: return '#ef4444';
    case 5: return '#8b5cf6';
    default: return '#64748b';
  }
}

// Get challenge type icon
export function getChallengeTypeIcon(type: Challenge['type']): string {
  switch (type) {
    case 'physical': return EMOJIS.GYM;
    case 'mental': return EMOJIS.BRAIN;
    case 'discipline': return EMOJIS.CHAIN;
    case 'social': return EMOJIS.SPEECH;
    case 'craft': return EMOJIS.CODE;
    default: return EMOJIS.STAR;
  }
}

// Get challenge type label
export function getChallengeTypeLabel(type: Challenge['type']): string {
  switch (type) {
    case 'physical': return 'Vessel Challenge';
    case 'mental': return 'Principle Challenge';
    case 'discipline': return 'Willpower Challenge';
    case 'social': return 'Tongue Challenge';
    case 'craft': return 'Craft Challenge';
    default: return 'General Challenge';
  }
}

// Initialize challenges in localStorage
export function initializeChallenges(): void {
  const saved = localStorage.getItem('mirlind-challenges-progress');
  if (!saved) {
    localStorage.setItem('mirlind-challenges-progress', JSON.stringify({
      completed: [],
      streak: 0,
      lastCompletedDate: null,
    }));
  }
}

// Mark challenge as complete
export function completeChallenge(challengeId: string): { xp: number; newStreak: number; isFangYuan: boolean } {
  const progress = JSON.parse(localStorage.getItem('mirlind-challenges-progress') || '{}');
  const today = new Date().toDateString();
  
  if (!progress.completed.includes(challengeId)) {
    progress.completed.push(challengeId);
    progress.completedToday = progress.completedToday || [];
    progress.completedToday.push(challengeId);
  }
  
  // Update streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (progress.lastCompletedDate === yesterday.toDateString()) {
    progress.streak = (progress.streak || 0) + 1;
  } else if (progress.lastCompletedDate !== today) {
    progress.streak = 1;
  }
  
  progress.lastCompletedDate = today;
  localStorage.setItem('mirlind-challenges-progress', JSON.stringify(progress));
  
  const challenge = getChallengeById(challengeId);
  return {
    xp: challenge?.xpReward || 50,
    newStreak: progress.streak,
    isFangYuan: challenge?.author === 'Fang Yuan',
  };
}

// Get user challenge progress
export function getChallengeProgress(): { completed: string[]; streak: number; completedToday: string[] } {
  const progress = JSON.parse(localStorage.getItem('mirlind-challenges-progress') || '{}');
  const today = new Date().toDateString();
  
  // Reset completedToday if it's a new day
  if (progress.lastCompletedDate !== today) {
    progress.completedToday = [];
  }
  
  return {
    completed: progress.completed || [],
    streak: progress.streak || 0,
    completedToday: progress.completedToday || [],
  };
}

// Get total challenges completed count
export function getTotalChallengesCompleted(): number {
  const progress = getChallengeProgress();
  return progress.completed.length;
}

// Special Challenges - Long term competitive challenges
export interface SpecialChallenge {
  id: string;
  title: string;
  description: string;
  duration: number; // days
  type: 'physical' | 'mental' | 'discipline' | 'social' | 'craft';
  difficulty: 3 | 4 | 5;
  xpReward: number;
  icon: string;
  requirements: string[];
  dailyTasks: string[];
  quote: string;
  author: 'Fang Yuan' | 'Baki Hanma';
}

export const SPECIAL_CHALLENGES: SpecialChallenge[] = [
  {
    id: 'seven_day_cold',
    title: 'The Ice Demon',
    description: '7 days of cold showers. Each day colder, each day longer. Forge unbreakable will.',
    duration: 7,
    type: 'physical',
    difficulty: 4,
    xpReward: 500,
    icon: EMOJIS.COLD_SHOWER,
    requirements: ['Complete day 1: 2 minutes', 'Complete day 3: 3 minutes', 'Complete day 7: 5 minutes'],
    dailyTasks: ['Take cold shower', 'Log duration', 'Note mental state'],
    quote: 'Pain is the price of strength. Pay it willingly.',
    author: 'Baki Hanma',
  },
  {
    id: 'thirty_day_code',
    title: 'Code Marathon',
    description: '30 days of coding. Minimum 1 hour daily. No excuses. No zero days. Build your future.',
    duration: 30,
    type: 'craft',
    difficulty: 3,
    xpReward: 1000,
    icon: EMOJIS.CODE,
    requirements: ['Code 1 hour daily', 'Push to GitHub', 'Complete 1 project'],
    dailyTasks: ['Code minimum 1 hour', 'Push commits', 'Log progress'],
    quote: 'The only thing that matters is becoming stronger than you were yesterday.',
    author: 'Fang Yuan',
  },
  {
    id: 'seven_day_detox',
    title: 'Digital Detox War',
    description: '7 days without social media, news, or entertainment. Only work, learning, and growth.',
    duration: 7,
    type: 'discipline',
    difficulty: 5,
    xpReward: 750,
    icon: EMOJIS.NO_PHONE,
    requirements: ['No social media', 'No entertainment', 'No news'],
    dailyTasks: ['Log screen time', 'Journal urges', 'Replace with productive activities'],
    quote: 'Detach from emotion, attach to results.',
    author: 'Fang Yuan',
  },
  {
    id: 'fourteen_day_german',
    title: 'German Conquest',
    description: '14 days of intensive German. 2 hours daily. A1 to A2 acceleration. No English entertainment.',
    duration: 14,
    type: 'social',
    difficulty: 4,
    xpReward: 700,
    icon: EMOJIS.GERMAN,
    requirements: ['2 hours daily study', 'Only German media', 'Complete Anki daily'],
    dailyTasks: ['Anki 50 cards', 'Language Transfer lesson', 'German radio 2 hours'],
    quote: 'Words are weapons. Master them.',
    author: 'Fang Yuan',
  },
  {
    id: 'thirty_day_workout',
    title: 'Baki Body Forge',
    description: '30 days of gym. No misses. Transform your vessel. Become physically unrecognizable.',
    duration: 30,
    type: 'physical',
    difficulty: 4,
    xpReward: 1200,
    icon: EMOJIS.GYM,
    requirements: ['4 workouts per week minimum', 'Progressive overload', 'Track all lifts'],
    dailyTasks: ['Complete workout', 'Log weights', 'Protein 150g+'],
    quote: 'The body achieves what the mind believes.',
    author: 'Baki Hanma',
  },
  {
    id: 'seven_day_fangyuan',
    title: 'Fang Yuan Mindset',
    description: '7 days of pure Fang Yuan principles. Emotional detachment. Ruthless efficiency. Strategic thinking.',
    duration: 7,
    type: 'mental',
    difficulty: 5,
    xpReward: 800,
    icon: EMOJIS.BRAIN,
    requirements: ['Daily mindset exercises', 'Strategic analysis', 'No emotional decisions'],
    dailyTasks: ['Read Fang Yuan principles', 'Analyze one decision strategically', 'Journal'],
    quote: 'Strength is the only virtue that matters.',
    author: 'Fang Yuan',
  },
];

// Get active special challenges
export function getActiveSpecialChallenges(): { challenge: SpecialChallenge; progress: number; day: number; completed: boolean }[] {
  const saved = localStorage.getItem('mirlind-special-challenges');
  const active = saved ? JSON.parse(saved) : [];
  
  return active.map((a: { id: string; startDate: string; dailyProgress: boolean[] }) => {
    const challenge = SPECIAL_CHALLENGES.find(c => c.id === a.id)!;
    const completedDays = a.dailyProgress.filter(Boolean).length;
    const today = new Date().toDateString();
    const startDay = new Date(a.startDate).toDateString();
    const dayNum = Math.floor((new Date(today).getTime() - new Date(startDay).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    return {
      challenge,
      progress: (completedDays / challenge.duration) * 100,
      day: Math.min(dayNum, challenge.duration),
      completed: completedDays >= challenge.duration,
    };
  });
}

// Start a special challenge
export function startSpecialChallenge(challengeId: string): boolean {
  const saved = localStorage.getItem('mirlind-special-challenges');
  const active = saved ? JSON.parse(saved) : [];
  
  // Check if already active
  if (active.some((a: { id: string }) => a.id === challengeId)) {
    return false;
  }
  
  const challenge = SPECIAL_CHALLENGES.find(c => c.id === challengeId)!;
  active.push({
    id: challengeId,
    startDate: new Date().toISOString(),
    dailyProgress: new Array(challenge.duration).fill(false),
  });
  
  localStorage.setItem('mirlind-special-challenges', JSON.stringify(active));
  return true;
}

// Mark special challenge day complete
export function completeSpecialChallengeDay(challengeId: string, dayIndex: number): { completed: boolean; totalReward: number } {
  const saved = localStorage.getItem('mirlind-special-challenges');
  const active = saved ? JSON.parse(saved) : [];
  
  const challenge = active.find((a: { id: string }) => a.id === challengeId);
  if (!challenge) return { completed: false, totalReward: 0 };
  
  challenge.dailyProgress[dayIndex] = true;
  localStorage.setItem('mirlind-special-challenges', JSON.stringify(active));
  
  const challengeData = SPECIAL_CHALLENGES.find(c => c.id === challengeId)!;
  const allCompleted = challenge.dailyProgress.every(Boolean);
  
  return {
    completed: allCompleted,
    totalReward: allCompleted ? challengeData.xpReward : 0,
  };
}


