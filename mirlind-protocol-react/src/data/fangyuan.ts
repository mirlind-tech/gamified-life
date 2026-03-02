// Fang Yuan Mindset System
// Core teachings from Reverend Insanity

export interface FangYuanTeaching {
  id: string;
  principle: string;
  explanation: string;
  application: string;
  quote: string;
  unlocked: boolean;
}

export const FANG_YUAN_TEACHINGS: FangYuanTeaching[] = [
  {
    id: 'strength_virtue',
    principle: 'Strength is the Only Virtue',
    explanation: 'In this world, strength determines everything. The weak are forgotten, the strong are remembered. Morality is a luxury of the powerful.',
    application: 'Focus entirely on self-improvement. Cut out anything that does not make you stronger.',
    quote: 'Strength is the only virtue that matters. The weak have no right to speak.',
    unlocked: true,
  },
  {
    id: 'detach_emotion',
    principle: 'Detach from Emotion',
    explanation: 'Emotions cloud judgment. Desire, anger, fear, joy - all are weaknesses that can be exploited. Be rational in all decisions.',
    application: 'When making important decisions, ask: "What would I do if I felt nothing?" Then do that.',
    quote: 'Detach from emotion, attach to results.',
    unlocked: true,
  },
  {
    id: 'sacrifice_present',
    principle: 'Sacrifice Present for Future',
    explanation: 'The temporary pain of discipline is nothing compared to the eternal regret of failure. Comfort now means suffering later.',
    application: 'Choose the harder option. Wake up earlier. Train harder. Study longer. The future you will thank you.',
    quote: 'Sacrifice the present for the future. The strong have no time for comfort.',
    unlocked: true,
  },
  {
    id: 'ruthless_self',
    principle: 'Be Ruthless with Yourself',
    explanation: 'You are your own greatest enemy. Excuses, laziness, procrastination - eliminate them without mercy.',
    application: 'When you want to quit, go 10% further. When you feel tired, that is when growth begins.',
    quote: 'I am ruthless with myself because I love my future more than my present comfort.',
    unlocked: false,
  },
  {
    id: 'useful_remembered',
    principle: 'Only the Useful Matter',
    explanation: 'Relationships, activities, possessions - if they do not serve your goals, they are dead weight. Cut them.',
    application: 'Audit your life monthly. What percentage of your time serves your goals? Increase it.',
    quote: 'In this world, only the useful are remembered. The useless are discarded.',
    unlocked: false,
  },
  {
    id: 'regret_weakness',
    principle: 'Regret is for the Weak',
    explanation: 'Do not dwell on past failures. Learn, adapt, move forward. The weak cry over spilled milk. The strong buy more cows.',
    application: 'Every mistake is data. Analyze it in 5 minutes. Then never think of it again except as a lesson.',
    quote: 'Regret is for the weak. I take what I want.',
    unlocked: false,
  },
  {
    id: 'strategic_thinking',
    principle: 'Think 10 Moves Ahead',
    explanation: 'Every action has consequences. The wise man plans not for today, but for the decade.',
    application: 'Before any major decision, write down: 1st order consequences, 2nd order, 3rd order.',
    quote: 'The foolish see only the present. The wise see the future unfolding.',
    unlocked: false,
  },
  {
    id: 'endure_pain',
    principle: 'Pain is the Price',
    explanation: 'All growth requires pain. Muscle fibers tear to grow stronger. The mind must be broken to be rebuilt.',
    application: 'When experiencing discomfort, smile. It means you are growing. Seek it out deliberately.',
    quote: 'Pain is the price of strength. Pay it willingly.',
    unlocked: false,
  },
  {
    id: 'exploitation_world',
    principle: 'The World is for Exploitation',
    explanation: 'Resources, knowledge, opportunities - they exist to be seized. The bold take what they need.',
    application: 'Identify what you need. Then take it. Ask forgiveness, not permission.',
    quote: 'This world belongs to those who take it.',
    unlocked: false,
  },
  {
    id: 'adapt_overcome',
    principle: 'Adapt and Overcome',
    explanation: 'Plans fail. Circumstances change. The strong adapt instantly. The rigid break.',
    application: 'When blocked, immediately find 3 alternative paths. Never waste time on what cannot be changed.',
    quote: 'Water takes the shape of its container. Be like water - adaptable, unstoppable.',
    unlocked: false,
  },
  {
    id: 'no_permanent_enemies',
    principle: 'No Permanent Enemies',
    explanation: 'Today\'s enemy may be tomorrow\'s ally. Do not burn bridges unnecessarily. Keep options open.',
    application: 'Even with adversaries, maintain minimum civility. The chessboard changes.',
    quote: 'In the cultivation world, there are no permanent enemies, only permanent interests.',
    unlocked: false,
  },
  {
    id: 'hidden_cards',
    principle: 'Always Keep Hidden Cards',
    explanation: 'Never reveal your full strength. Let others underestimate you. Surprise is a weapon.',
    application: 'Master skills you do not advertise. Let others think they know your limits.',
    quote: 'The wise keep their strongest techniques hidden until the critical moment.',
    unlocked: false,
  },
];

// Get unlocked teachings
export function getUnlockedTeachings(): FangYuanTeaching[] {
  const saved = localStorage.getItem('mirlind-fangyuan');
  const unlockedIds = saved ? JSON.parse(saved) : ['strength_virtue', 'detach_emotion', 'sacrifice_present'];
  
  return FANG_YUAN_TEACHINGS.map(t => ({
    ...t,
    unlocked: unlockedIds.includes(t.id),
  }));
}

// Unlock a teaching
export function unlockTeaching(teachingId: string): boolean {
  const saved = localStorage.getItem('mirlind-fangyuan');
  const unlockedIds = saved ? JSON.parse(saved) : ['strength_virtue', 'detach_emotion', 'sacrifice_present'];
  
  if (!unlockedIds.includes(teachingId)) {
    unlockedIds.push(teachingId);
    localStorage.setItem('mirlind-fangyuan', JSON.stringify(unlockedIds));
    return true;
  }
  return false;
}

// Get random daily teaching
export function getDailyTeaching(): FangYuanTeaching {
  const teachings = getUnlockedTeachings().filter(t => t.unlocked);
  const today = new Date().toDateString();
  const saved = localStorage.getItem('mirlind-daily-teaching');
  
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed.date === today) {
      return teachings.find(t => t.id === parsed.teachingId) || teachings[0];
    }
  }
  
  // Pick new random teaching
  const random = teachings[Math.floor(Math.random() * teachings.length)];
  localStorage.setItem('mirlind-daily-teaching', JSON.stringify({
    date: today,
    teachingId: random.id,
  }));
  
  return random;
}

// Unlock next teaching based on XP or achievements
export function checkAndUnlockTeachings(totalXPEarned: number): string[] {
  const thresholds = [
    { id: 'ruthless_self', xp: 500 },
    { id: 'useful_remembered', xp: 1000 },
    { id: 'regret_weakness', xp: 1500 },
    { id: 'strategic_thinking', xp: 2000 },
    { id: 'endure_pain', xp: 2500 },
    { id: 'exploitation_world', xp: 3000 },
    { id: 'adapt_overcome', xp: 3500 },
    { id: 'no_permanent_enemies', xp: 4000 },
    { id: 'hidden_cards', xp: 5000 },
  ];
  
  const newlyUnlocked: string[] = [];
  
  for (const threshold of thresholds) {
    if (totalXPEarned >= threshold.xp) {
      if (unlockTeaching(threshold.id)) {
        newlyUnlocked.push(threshold.id);
      }
    }
  }
  
  return newlyUnlocked;
}

// Fang Yuan quiz questions
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export const FANG_YUAN_QUIZ: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'What is the only virtue that matters?',
    options: ['Kindness', 'Strength', 'Intelligence', 'Wealth'],
    correct: 1,
    explanation: 'Strength is the only virtue that matters. The weak have no right to speak.',
  },
  {
    id: 'q2',
    question: 'What should you attach to?',
    options: ['Emotions', 'Results', 'People', 'Memories'],
    correct: 1,
    explanation: 'Detach from emotion, attach to results.',
  },
  {
    id: 'q3',
    question: 'What is the price of strength?',
    options: ['Money', 'Pain', 'Time', 'Friendship'],
    correct: 1,
    explanation: 'Pain is the price of strength. Pay it willingly.',
  },
  {
    id: 'q4',
    question: 'Who should you be ruthless with?',
    options: ['Enemies', 'Yourself', 'Competitors', 'Strangers'],
    correct: 1,
    explanation: 'Be ruthless with yourself because you love your future more than your present comfort.',
  },
  {
    id: 'q5',
    question: 'What should you sacrifice for the future?',
    options: ['Nothing', 'The present', 'Everything', 'Relationships'],
    correct: 1,
    explanation: 'Sacrifice the present for the future. The strong have no time for comfort.',
  },
];

// Get random quiz question
export function getRandomQuizQuestion(): QuizQuestion {
  return FANG_YUAN_QUIZ[Math.floor(Math.random() * FANG_YUAN_QUIZ.length)];
}
