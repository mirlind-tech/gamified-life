// JavaScript Learning Roadmap
// Structured curriculum from basics to advanced

export interface Topic {
  name: string;
  description: string;
  concepts: string[];
  code?: string;
}

export interface Module {
  id: string;
  name: string;
  icon: string;
  description: string;
  estimatedHours: number;
  topics: Topic[];
  prerequisites?: string[];
}

export interface Phase {
  id: string;
  name: string;
  icon: string;
  description: string;
  modules: Module[];
}

// Import roadmap data from JSON
import roadmapData from './json/roadmap.json';

export const JAVASCRIPT_ROADMAP: Phase[] = roadmapData.JAVASCRIPT_ROADMAP;

// Get user progress from localStorage
export function getRoadmapProgress(): { completed: string[]; started: string[] } {
  const saved = localStorage.getItem('mirlind-roadmap');
  if (saved) {
    return JSON.parse(saved);
  }
  return { completed: [], started: [] };
}

// Save progress to localStorage
export function saveRoadmapProgress(progress: { completed: string[]; started: string[] }): void {
  localStorage.setItem('mirlind-roadmap', JSON.stringify(progress));
}

// Mark module as completed
export function completeModule(moduleId: string): void {
  const progress = getRoadmapProgress();
  if (!progress.completed.includes(moduleId)) {
    progress.completed.push(moduleId);
    saveRoadmapProgress(progress);
  }
}

// Mark module as started
export function startModule(moduleId: string): void {
  const progress = getRoadmapProgress();
  if (!progress.started.includes(moduleId)) {
    progress.started.push(moduleId);
    saveRoadmapProgress(progress);
  }
}

// Get module by ID
export function getModuleById(moduleId: string): Module | undefined {
  for (const phase of JAVASCRIPT_ROADMAP) {
    const module = phase.modules.find(m => m.id === moduleId);
    if (module) return module;
  }
  return undefined;
}

// Check if prerequisites are met
export function checkPrerequisites(moduleId: string): boolean {
  const module = getModuleById(moduleId);
  if (!module?.prerequisites) return true;
  
  const progress = getRoadmapProgress();
  return module.prerequisites.every(prereq => progress.completed.includes(prereq));
}
