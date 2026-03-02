import type { ViewType } from '../types';

const VIEW_TO_PATH: Record<ViewType, string> = {
  command: '/protocol',
  body: '/body',
  mind: '/mind',
  career: '/career',
  finance: '/finance',
  german: '/german',
  tree: '/skills',
  cards: '/cards',
  analytics: '/profile',
  achievements: '/achievements',
  focus: '/focus',
  journal: '/journal',
  education: '/learn',
  meditate: '/meditate',
  habits: '/habits',
  coach: '/coach',
  challenges: '/challenges',
  protocol: '/protocol-legacy',
  auth: '/account',
  'skills-roadmap': '/tech-stack',
  'character-profile': '/character-profile',
  fangyuan: '/mindset',
  'tech-stack': '/tech-stack',
  'photo-progress': '/photos',
  charts: '/charts',
  'weekly-plan': '/weekly-plan',
  'weekly-review': '/weekly-review',
  assessment: '/assessment',
  insights: '/insights',
};

function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export function viewToPath(view: ViewType): string {
  return VIEW_TO_PATH[view] || '/protocol';
}

export function pathToView(pathname: string): ViewType {
  const path = normalizePath(pathname);

  switch (path) {
    case '/':
    case '/protocol':
    case '/command':
      return 'command';
    case '/body':
      return 'body';
    case '/mind':
      return 'mind';
    case '/career':
      return 'career';
    case '/finance':
      return 'finance';
    case '/german':
      return 'german';
    case '/skills':
    case '/tree':
      return 'tree';
    case '/cards':
      return 'cards';
    case '/profile':
    case '/analytics':
      return 'analytics';
    case '/achievements':
      return 'achievements';
    case '/focus':
      return 'focus';
    case '/journal':
      return 'journal';
    case '/learn':
    case '/education':
      return 'education';
    case '/meditate':
    case '/meditation':
      return 'meditate';
    case '/habits':
      return 'habits';
    case '/coach':
      return 'coach';
    case '/challenges':
      return 'challenges';
    case '/protocol-legacy':
      return 'protocol';
    case '/account':
    case '/auth':
      return 'auth';
    case '/tech-stack':
    case '/skills-roadmap':
      return 'skills-roadmap';
    case '/character-profile':
      return 'character-profile';
    case '/mindset':
    case '/fangyuan':
      return 'fangyuan';
    case '/photos':
    case '/photo-progress':
      return 'photo-progress';
    case '/charts':
      return 'charts';
    case '/weekly-plan':
      return 'weekly-plan';
    case '/weekly-review':
      return 'weekly-review';
    case '/assessment':
      return 'assessment';
    case '/insights':
      return 'insights';
    default:
      return 'command';
  }
}
