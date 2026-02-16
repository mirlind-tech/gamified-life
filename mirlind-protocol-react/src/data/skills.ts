import skillsData from './json/skills.json';

export interface MasterySkill {
  id: string;
  name: string;
  category: 'physical' | 'creative' | 'social' | 'mental' | 'survival';
  description: string;
  icon: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedHours: number;
  stages: MasterySkillStage[];
  whyLearn: string;
  started?: string;
  currentStage: number;
  completed: boolean;
}

export interface MasterySkillStage {
  name: string;
  description: string;
  hoursNeeded: number;
  microGoals: string[];
  resources: { title: string; url?: string; type: 'video' | 'article' | 'book' | 'practice' }[];
}

// Export static skill data from JSON
export const PHYSICAL_SKILLS: MasterySkill[] = skillsData.PHYSICAL_SKILLS as MasterySkill[];
export const CREATIVE_SKILLS: MasterySkill[] = skillsData.CREATIVE_SKILLS as MasterySkill[];
export const SOCIAL_SKILLS: MasterySkill[] = skillsData.SOCIAL_SKILLS as MasterySkill[];
export const MENTAL_SKILLS: MasterySkill[] = skillsData.MENTAL_SKILLS as MasterySkill[];
export const SURVIVAL_SKILLS: MasterySkill[] = skillsData.SURVIVAL_SKILLS as MasterySkill[];

// All skills combined
export const ALL_SKILLS: MasterySkill[] = [
  ...PHYSICAL_SKILLS,
  ...CREATIVE_SKILLS,
  ...SOCIAL_SKILLS,
  ...MENTAL_SKILLS,
  ...SURVIVAL_SKILLS,
];

// Get skills from localStorage
export function getUserSkills(): MasterySkill[] {
  const saved = localStorage.getItem('mirlind-skills');
  if (saved) {
    return JSON.parse(saved);
  }
  // Initialize with default skills (not started)
  return ALL_SKILLS.map(s => ({ ...s, currentStage: 0, completed: false }));
}

// Save skills to localStorage
export function saveUserSkills(skills: MasterySkill[]): void {
  localStorage.setItem('mirlind-skills', JSON.stringify(skills));
}

// Start a skill
export function startSkill(skillId: string): void {
  const skills = getUserSkills();
  const skill = skills.find(s => s.id === skillId);
  if (skill && !skill.started) {
    skill.started = new Date().toISOString();
    saveUserSkills(skills);
  }
}

// Progress to next stage
export function completeStage(skillId: string, stageIndex: number): void {
  const skills = getUserSkills();
  const skill = skills.find(s => s.id === skillId);
  if (skill) {
    skill.currentStage = Math.max(skill.currentStage, stageIndex + 1);
    if (skill.currentStage >= skill.stages.length) {
      skill.completed = true;
    }
    saveUserSkills(skills);
  }
}

// Get category color
export function getCategoryColor(category: MasterySkill['category']): string {
  switch (category) {
    case 'physical': return '#ec4899'; // pink
    case 'creative': return '#8b5cf6'; // purple
    case 'social': return '#f59e0b'; // amber
    case 'mental': return '#06b6d4'; // cyan
    case 'survival': return '#10b981'; // green
    default: return '#64748b';
  }
}

// Get category icon
export function getCategoryIcon(category: MasterySkill['category']): string {
  switch (category) {
    case 'physical': return '💪';
    case 'creative': return '🎨';
    case 'social': return '🗣️';
    case 'mental': return '🧠';
    case 'survival': return '⛺';
    default: return '⭐';
  }
}

// Get difficulty stars
export function getDifficultyStars(difficulty: number): string {
  return '⭐'.repeat(difficulty);
}
