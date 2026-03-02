// Emoji constants for Mirlind Protocol
// Centralized emoji definitions for consistent usage

export const EMOJIS = {
  // Core pillars
  CRAFT: '⚔️',
  VESSEL: '💪',
  TONGUE: '🗣️',
  PRINCIPLE: '📜',
  CAPITAL: '💰',
  
  // Navigation
  SCROLL: '📜',
  BRAIN: '🧠',
  CODE: '💻',
  FLAG: '🇩🇪',
  COACH: '🤖',
  USER: '👤',
  LOCK: '🔒',
  
  // Body
  WEIGHT: '⚖️',
  CAMERA: '📷',
  MEASURE: '📏',
  HEART: '❤️',
  FIRE: '🔥',
  
  // Mind
  MEDITATION: '🧘',
  JOURNAL: '📓',
  ZEN: '☯️',
  MOON: '🌙',
  SUN: '☀️',
  
  // Career
  JOB: '💼',
  CURRICULUM: '📚',
  SKILL: '🎯',
  TROPHY: '🏆',
  ROCKET: '🚀',
  
  // Finance
  MONEY: '💵',
  CHART: '📈',
  PIGGY: '🐷',
  COIN: '🪙',
  
  // Status
  CHECK: '✅',
  CROSS: '❌',
  WARNING: '⚠️',
  STAR: '⭐',
  GEM: '💎',
  CROWN: '👑',
  
  // Actions
  EDIT: '✏️',
  DELETE: '🗑️',
  ADD: '➕',
  SAVE: '💾',
  REFRESH: '🔄',
  
  // Time
  CLOCK: '⏰',
  CALENDAR: '📅',
  TIMER: '⏱️',
  HOURGLASS: '⏳',
  
  // German
  CARDS: '🃏',
  
  // Misc
  LIGHTBULB: '💡',
  MAGNIFIER: '🔍',
  GEAR: '⚙️',
  SHIELD: '🛡️',
  KEY: '🔑',
  PACKAGE: '📦',
  LINK: '🔗',
  HOME: '🏠',
  SETTINGS: '⚙️',
  LOGOUT: '🚪',
  
  // Tech Stack
  JAVASCRIPT: '⚡',
  TYPESCRIPT: '📘',
  REACT: '⚛️',
  NODE: '🟢',
  POSTGRES: '🐘',
  GIT: '🌿',
  DOCKER: '🐳',
  RUST: '🦀',
  PYTHON: '🐍',
  SYSTEM: '🏗️',
} as const;

// Helper function to get pillar emoji
export function getPillarEmoji(pillar: string): string {
  const map: Record<string, string> = {
    craft: EMOJIS.CRAFT,
    vessel: EMOJIS.VESSEL,
    tongue: EMOJIS.TONGUE,
    principle: EMOJIS.PRINCIPLE,
    capital: EMOJIS.CAPITAL,
  };
  return map[pillar] || EMOJIS.STAR;
}

// Helper function to get skill emoji by key
export function getSkillEmoji(key: string): string {
  const map: Record<string, string> = {
    javascript: EMOJIS.JAVASCRIPT,
    typescript: EMOJIS.TYPESCRIPT,
    react: EMOJIS.REACT,
    nodejs: EMOJIS.NODE,
    postgresql: EMOJIS.POSTGRES,
    git: EMOJIS.GIT,
    docker: EMOJIS.DOCKER,
    rust: EMOJIS.RUST,
    python: EMOJIS.PYTHON,
    system_design: EMOJIS.SYSTEM,
  };
  return map[key] || EMOJIS.CODE;
}
