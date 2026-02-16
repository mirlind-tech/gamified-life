// Emoji constants - all emojis defined in one place
// This avoids encoding issues in source files

export const EMOJIS = {
  // Navigation
  TREE: '🌳',
  CARDS: '🎴',
  QUESTS: '⚔️',
  GATES: '🚪',
  STATS: '📊',
  ACHIEVEMENTS: '🏆',
  FOCUS: '🎯',
  JOURNAL: '📝',
  EDUCATION: '🎓',
  MEDITATE: '🧘',
  HABITS: '🔥',
  COACH: '🤖',
  REST: '😴',
  NOTIFICATIONS: '🔔',
  
  // Pillars
  CRAFT: '⚡',
  VESSEL: '💪',
  TONGUE: '🇩🇪',
  PRINCIPLE: '🧠',
  CAPITAL: '💰',
  GENERAL: '⭐',
  
  // Actions
  CHECK: '✅',
  CHECK_CIRCLE: '☑️',
  CLOSE: '✕',
  PLUS: '➕',
  MINUS: '➖',
  EDIT: '✏️',
  DELETE: '🗑️',
  SAVE: '💾',
  REFRESH: '🔄',
  SEARCH: '🔍',
  SETTINGS: '⚙️',
  INFO: 'ℹ️',
  WARNING: '⚠️',
  ERROR: '❌',
  SUCCESS: '✅',
  STAR: '⭐',
  FIRE: '🔥',
  ZAP: '⚡',
  DOWNLOAD: '⬇️',
  
  // Professional Skills
  FOCUS_SKILL: '🎯',
  DISCIPLINE: '⛓️',
  CLARITY: '💎',
  STAMINA: '🔥',
  INTENSITY: '⚡',
  FLOW: '🌊',
  VISION: '🔮',
  MASTERY: '👑',
  LEGACY: '🌟',
  
  // Habits
  WAKE_UP: '🌅',
  COLD_SHOWER: '🥶',
  GERMAN: '🇩🇪',
  CODING: '💻',
  GYM: '🏋️',
  MEDITATION: '🧘',
  EXPENSES: '💵',
  JOURNAL_ICON: '📓',
  NO_ALBANIAN: '🚫',
  NO_PHONE: '📵',
  GIT: '📦',
  
  // Gates
  LOCK: '🔒',
  UNLOCK: '🔓',
  TROPHY: '🏆',
  CROWN: '👑',
  TARGET: '🎯',
  
  // Timer
  PLAY: '▶️',
  PAUSE: '⏸️',
  STOP: '⏹️',
  RESET: '⏮️',
  TIMER: '⏰',
  ALARM: '⏰',
  
  // Audio
  SPEAKER: '🔊',
  SPEAKER_OFF: '🔇',
  MUSIC: '🎵',
  HEADPHONES: '🎧',
  
  // Misc
  LIGHTBULB: '💡',
  BELL: '🔔',
  CALENDAR: '📅',
  CLOCK: '🕐',
  BOOK: '📖',
  CHART: '📈',
  TREND_UP: '📈',
  TREND_DOWN: '📉',
  GEM: '💎',
  MONEY: '💰',
  COIN: '🪙',
  CHAIN: '🔗',
  SHIELD: '🛡️',
  SWORD: '⚔️',
  PARTY: '🎉',
  CONFETTI: '🎊',
  HUNDRED: '💯',
  KEYBOARD: '⌨️',
  LEAF: '🌿',
  
  // Weather/Nature
  SUN: '☀️',
  MOON: '🌙',
  STAR_NIGHT: '⭐',
  CLOUD: '☁️',
  RAIN: '🌧️',
  SNOW: '❄️',
  FIRE_NATURAL: '🔥',
  WATER: '💧',
  DROPLET: '💧',
  
  // Faces/Mood
  SMILE: '😊',
  NEUTRAL: '😐',
  FROWN: '😔',
  SKULL: '💀',
  USER: '👤',
  SEND: '📤',
  COFFEE: '☕',
  
  // Animals
  LION: '🦁',
  EAGLE: '🦅',
  WOLF: '🐺',
  BEAR: '🐻',
  DRAGON: '🐉',
  PHOENIX: '🐦‍🔥',
  
  // Challenges
  CHALLENGE: '⚡',
  RUN: '🏃',
  NO_SUGAR: '🚫🍬',
  CODE: '💻',
  SPEECH: '🗣️',
  BRAIN: '🧠',
  DUMBBELL: '🏋️',
  MEDAL: '🏅',
  TROPHY_GOLD: '🏆',
  
  // Protocol
  SCROLL: '📜',
  FLAG: '🇩🇪',
} as const;

// Helper function to get emoji by key
export function getEmoji(key: keyof typeof EMOJIS): string {
  return EMOJIS[key];
}
