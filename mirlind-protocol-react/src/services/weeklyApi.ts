import { apiRequest } from './authApi';
import type { OutcomeDailyAction, OutcomeWeeklyObjective } from './outcomesApi';

export interface WeeklyReview {
  id: number;
  user_id: number;
  week_start: string;
  week_end: string;
  wins: string;
  failures: string;
  lessons: string;
  adjustments: string;
  confidence: number;
  auto_adjust_applied: number;
  created_at: string;
  updated_at: string;
}

export interface WeeklyPlanResponse {
  weekStart: string;
  weekEnd: string;
  hasPlan: boolean;
  objectives: OutcomeWeeklyObjective[];
  actions: OutcomeDailyAction[];
  review: WeeklyReview | null;
  previousReview: WeeklyReview | null;
  hints: string[];
}

export interface PlanObjectiveInput {
  goalId?: number;
  domain?: 'body' | 'mind' | 'career' | 'finance' | 'german' | 'custom';
  goalTitle?: string;
  title: string;
  description?: string;
  targetCount?: number;
  dailyActionTitle?: string;
  estimatedMinutes?: number;
  days?: number[];
}

export interface SaveWeeklyPlanPayload {
  weekStart?: string;
  objectives: PlanObjectiveInput[];
}

export interface SaveWeeklyPlanResponse {
  weekStart: string;
  weekEnd: string;
  objectives: OutcomeWeeklyObjective[];
  actions: OutcomeDailyAction[];
}

export interface WeeklyReviewPayload {
  weekStart?: string;
  wins?: string;
  failures?: string;
  lessons?: string;
  adjustments?: string;
  confidence?: number;
}

export interface SaveWeeklyReviewResponse {
  review: WeeklyReview | null;
  nextWeek: {
    weekStart: string;
    weekEnd: string;
    objectives: OutcomeWeeklyObjective[];
  };
}

export interface WeeklyHistoryResponse {
  reviews: WeeklyReview[];
  goals: Array<{
    id: number;
    user_id: number;
    domain: string;
    title: string;
    status: string;
    priority: number;
    created_at: string;
    updated_at: string;
  }>;
}

export const getWeeklyPlan = async (weekStart?: string): Promise<WeeklyPlanResponse> => {
  const query = weekStart ? `?weekStart=${encodeURIComponent(weekStart)}` : '';
  return apiRequest<WeeklyPlanResponse>(`/weekly/plan${query}`);
};

export const saveWeeklyPlan = async (payload: SaveWeeklyPlanPayload): Promise<SaveWeeklyPlanResponse> => {
  return apiRequest<SaveWeeklyPlanResponse>('/weekly/plan', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const getWeeklyReview = async (
  weekStart?: string
): Promise<{ review: WeeklyReview | null; weekStart: string; weekEnd: string }> => {
  const query = weekStart ? `?weekStart=${encodeURIComponent(weekStart)}` : '';
  return apiRequest<{ review: WeeklyReview | null; weekStart: string; weekEnd: string }>(
    `/weekly/review${query}`
  );
};

export const saveWeeklyReview = async (
  payload: WeeklyReviewPayload
): Promise<SaveWeeklyReviewResponse> => {
  return apiRequest<SaveWeeklyReviewResponse>('/weekly/review', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const getWeeklyHistory = async (): Promise<WeeklyHistoryResponse> => {
  return apiRequest<WeeklyHistoryResponse>('/weekly/history');
};
