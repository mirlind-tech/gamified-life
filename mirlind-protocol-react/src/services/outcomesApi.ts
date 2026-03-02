import { apiRequest } from './authApi';

export type OutcomeDomain = 'body' | 'mind' | 'career' | 'finance' | 'german' | 'custom';
export type OutcomeGoalStatus = 'active' | 'completed' | 'paused' | 'archived';
export type OutcomeObjectiveStatus = 'active' | 'completed' | 'paused' | 'cancelled';
export type OutcomeActionStatus = 'pending' | 'completed' | 'skipped';

export interface OutcomeGoal {
  id: number;
  user_id: number;
  domain: OutcomeDomain;
  title: string;
  vision: string;
  target_metric_name?: string;
  target_metric_value?: number;
  deadline?: string;
  status: OutcomeGoalStatus;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface OutcomeWeeklyObjective {
  id: number;
  user_id: number;
  goal_id: number;
  week_start: string;
  title: string;
  description: string;
  target_count: number;
  completed_count: number;
  status: OutcomeObjectiveStatus;
  created_at: string;
  updated_at: string;
}

export interface OutcomeDailyAction {
  id: number;
  user_id: number;
  objective_id: number;
  action_date: string;
  title: string;
  estimated_minutes: number;
  status: OutcomeActionStatus;
  checkin_note: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface OutcomeCheckin {
  id: number;
  user_id: number;
  checkin_date: string;
  energy: number;
  focus: number;
  mood: number;
  wins: string;
  blockers: string;
  adjustment: string;
  created_at: string;
  updated_at: string;
}

export interface OutcomeScore {
  score: number;
  completionRate: number;
  objectiveRate: number;
  checkinRate: number;
}

export interface OutcomeSummary {
  weekStart: string;
  weekEnd: string;
  score: OutcomeScore;
  totals: {
    goals: number;
    objectives: number;
    actions: number;
    completedActions: number;
    completedObjectives: number;
    checkins: number;
  };
  goals: OutcomeGoal[];
  objectives: OutcomeWeeklyObjective[];
  actions: OutcomeDailyAction[];
  checkins: OutcomeCheckin[];
}

export interface CreateGoalPayload {
  domain: OutcomeDomain;
  title: string;
  vision?: string;
  targetMetricName?: string;
  targetMetricValue?: number;
  deadline?: string;
  priority?: number;
}

export interface UpdateGoalPayload {
  domain?: OutcomeDomain;
  title?: string;
  vision?: string;
  targetMetricName?: string | null;
  targetMetricValue?: number | null;
  deadline?: string | null;
  status?: OutcomeGoalStatus;
  priority?: number;
}

export interface CreateObjectivePayload {
  goalId: number;
  weekStart?: string;
  title: string;
  description?: string;
  targetCount?: number;
}

export interface UpdateObjectivePayload {
  title?: string;
  description?: string;
  weekStart?: string;
  targetCount?: number;
  completedCount?: number;
  status?: OutcomeObjectiveStatus;
}

export interface CreateActionPayload {
  objectiveId: number;
  actionDate: string;
  title: string;
  estimatedMinutes?: number;
}

export interface UpdateActionPayload {
  actionDate?: string;
  title?: string;
  estimatedMinutes?: number;
  status?: OutcomeActionStatus;
  checkinNote?: string;
}

export interface UpsertCheckinPayload {
  energy?: number;
  focus?: number;
  mood?: number;
  wins?: string;
  blockers?: string;
  adjustment?: string;
}

export const getOutcomeSummary = async (weekStart?: string): Promise<OutcomeSummary> => {
  const query = weekStart ? `?weekStart=${encodeURIComponent(weekStart)}` : '';
  return apiRequest<OutcomeSummary>(`/outcomes/summary${query}`);
};

export const getOutcomeGoals = async (status?: OutcomeGoalStatus): Promise<{ goals: OutcomeGoal[] }> => {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiRequest<{ goals: OutcomeGoal[] }>(`/outcomes/goals${query}`);
};

export const createOutcomeGoal = async (payload: CreateGoalPayload): Promise<{ goal: OutcomeGoal }> => {
  return apiRequest<{ goal: OutcomeGoal }>('/outcomes/goals', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const updateOutcomeGoal = async (
  goalId: number,
  payload: UpdateGoalPayload
): Promise<{ goal: OutcomeGoal }> => {
  return apiRequest<{ goal: OutcomeGoal }>(`/outcomes/goals/${goalId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
};

export const deleteOutcomeGoal = async (goalId: number): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>(`/outcomes/goals/${goalId}`, {
    method: 'DELETE',
  });
};

export const getOutcomeObjectives = async (params?: {
  weekStart?: string;
  goalId?: number;
}): Promise<{ objectives: OutcomeWeeklyObjective[] }> => {
  const search = new URLSearchParams();
  if (params?.weekStart) search.set('weekStart', params.weekStart);
  if (params?.goalId) search.set('goalId', String(params.goalId));
  const query = search.toString() ? `?${search.toString()}` : '';

  return apiRequest<{ objectives: OutcomeWeeklyObjective[] }>(`/outcomes/objectives${query}`);
};

export const createOutcomeObjective = async (
  payload: CreateObjectivePayload
): Promise<{ objective: OutcomeWeeklyObjective }> => {
  return apiRequest<{ objective: OutcomeWeeklyObjective }>('/outcomes/objectives', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const updateOutcomeObjective = async (
  objectiveId: number,
  payload: UpdateObjectivePayload
): Promise<{ objective: OutcomeWeeklyObjective }> => {
  return apiRequest<{ objective: OutcomeWeeklyObjective }>(`/outcomes/objectives/${objectiveId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
};

export const deleteOutcomeObjective = async (objectiveId: number): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>(`/outcomes/objectives/${objectiveId}`, {
    method: 'DELETE',
  });
};

export const getOutcomeActions = async (params?: {
  date?: string;
  weekStart?: string;
}): Promise<{ actions: OutcomeDailyAction[] }> => {
  const search = new URLSearchParams();
  if (params?.date) search.set('date', params.date);
  if (params?.weekStart) search.set('weekStart', params.weekStart);
  const query = search.toString() ? `?${search.toString()}` : '';

  return apiRequest<{ actions: OutcomeDailyAction[] }>(`/outcomes/actions${query}`);
};

export const createOutcomeAction = async (
  payload: CreateActionPayload
): Promise<{ action: OutcomeDailyAction }> => {
  return apiRequest<{ action: OutcomeDailyAction }>('/outcomes/actions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const updateOutcomeAction = async (
  actionId: number,
  payload: UpdateActionPayload
): Promise<{ action: OutcomeDailyAction }> => {
  return apiRequest<{ action: OutcomeDailyAction }>(`/outcomes/actions/${actionId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
};

export const deleteOutcomeAction = async (actionId: number): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>(`/outcomes/actions/${actionId}`, {
    method: 'DELETE',
  });
};

export const getOutcomeCheckins = async (params?: {
  date?: string;
  weekStart?: string;
}): Promise<{ checkins: OutcomeCheckin[] }> => {
  const search = new URLSearchParams();
  if (params?.date) search.set('date', params.date);
  if (params?.weekStart) search.set('weekStart', params.weekStart);
  const query = search.toString() ? `?${search.toString()}` : '';

  return apiRequest<{ checkins: OutcomeCheckin[] }>(`/outcomes/checkins${query}`);
};

export const upsertOutcomeCheckin = async (
  date: string,
  payload: UpsertCheckinPayload
): Promise<{ checkin: OutcomeCheckin }> => {
  return apiRequest<{ checkin: OutcomeCheckin }>(`/outcomes/checkins/${encodeURIComponent(date)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

