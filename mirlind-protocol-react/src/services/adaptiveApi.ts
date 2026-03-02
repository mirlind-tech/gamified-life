import { apiRequest } from './authApi';

export interface AdaptiveProfile {
  id: number;
  user_id: number;
  body_level: number;
  mind_level: number;
  career_level: number;
  finance_level: number;
  german_level: number;
  daily_minutes: number;
  stress_level: number;
  difficulty_factor: number;
  baseline_completed: number;
  created_at: string;
  updated_at: string;
}

export interface AdaptiveProfilePayload {
  bodyLevel?: number;
  mindLevel?: number;
  careerLevel?: number;
  financeLevel?: number;
  germanLevel?: number;
  dailyMinutes?: number;
  stressLevel?: number;
  baselineCompleted?: boolean;
}

export interface AdaptiveRecommendation {
  difficultyFactor: number;
  recommendedDailyMinutes: {
    body: number;
    mind: number;
    career: number;
    finance: number;
    german: number;
  };
  guidance: string;
  profile: AdaptiveProfile;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function toString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

const DEFAULT_ADAPTIVE_PROFILE: AdaptiveProfile = {
  id: 0,
  user_id: 0,
  body_level: 3,
  mind_level: 3,
  career_level: 3,
  finance_level: 3,
  german_level: 3,
  daily_minutes: 90,
  stress_level: 3,
  difficulty_factor: 1,
  baseline_completed: 0,
  created_at: '',
  updated_at: '',
};

function normalizeAdaptiveProfile(value: unknown): AdaptiveProfile {
  if (!isObject(value)) return { ...DEFAULT_ADAPTIVE_PROFILE };

  return {
    id: toNumber(value.id),
    user_id: toNumber(value.user_id),
    body_level: toNumber(value.body_level, DEFAULT_ADAPTIVE_PROFILE.body_level),
    mind_level: toNumber(value.mind_level, DEFAULT_ADAPTIVE_PROFILE.mind_level),
    career_level: toNumber(value.career_level, DEFAULT_ADAPTIVE_PROFILE.career_level),
    finance_level: toNumber(value.finance_level, DEFAULT_ADAPTIVE_PROFILE.finance_level),
    german_level: toNumber(value.german_level, DEFAULT_ADAPTIVE_PROFILE.german_level),
    daily_minutes: toNumber(value.daily_minutes, DEFAULT_ADAPTIVE_PROFILE.daily_minutes),
    stress_level: toNumber(value.stress_level, DEFAULT_ADAPTIVE_PROFILE.stress_level),
    difficulty_factor: toNumber(value.difficulty_factor, DEFAULT_ADAPTIVE_PROFILE.difficulty_factor),
    baseline_completed: toNumber(value.baseline_completed, DEFAULT_ADAPTIVE_PROFILE.baseline_completed),
    created_at: toString(value.created_at),
    updated_at: toString(value.updated_at),
  };
}

function normalizeRecommendedDailyMinutes(value: unknown): AdaptiveRecommendation['recommendedDailyMinutes'] {
  const data = isObject(value) ? value : {};
  return {
    body: toNumber(data.body, 30),
    mind: toNumber(data.mind, 25),
    career: toNumber(data.career, 45),
    finance: toNumber(data.finance, 15),
    german: toNumber(data.german, 30),
  };
}

function normalizeAdaptiveRecommendation(value: unknown): AdaptiveRecommendation {
  const data = isObject(value) ? value : {};
  const profile = normalizeAdaptiveProfile(data.profile);
  const difficultyFactor = toNumber(data.difficultyFactor, profile.difficulty_factor || 1);

  return {
    difficultyFactor,
    recommendedDailyMinutes: normalizeRecommendedDailyMinutes(data.recommendedDailyMinutes),
    guidance: toString(
      data.guidance,
      'Stay at current load and focus on consistency quality.'
    ),
    profile,
  };
}

export const getAdaptiveProfile = async (): Promise<{ profile: AdaptiveProfile }> => {
  const response = await apiRequest<unknown>('/adaptive/profile');
  const data = isObject(response) ? response : {};
  return { profile: normalizeAdaptiveProfile(data.profile) };
};

export const saveAdaptiveProfile = async (
  payload: AdaptiveProfilePayload
): Promise<{ profile: AdaptiveProfile }> => {
  const response = await apiRequest<unknown>('/adaptive/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  const data = isObject(response) ? response : {};
  return { profile: normalizeAdaptiveProfile(data.profile) };
};

export const getAdaptiveRecommendation = async (): Promise<AdaptiveRecommendation> => {
  const response = await apiRequest<unknown>('/adaptive/recommendation');
  return normalizeAdaptiveRecommendation(response);
};
