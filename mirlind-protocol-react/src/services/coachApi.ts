import { apiRequest } from './authApi';

export interface CoachChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface CoachChatResponse {
  reply: string;
}

export type CoachActionDomain = 'body' | 'mind' | 'career' | 'finance' | 'german' | 'custom';
export type CoachActionType = 'outcome_action' | 'finance_cap';

export interface CoachActionItem {
  actionType: CoachActionType;
  domain: CoachActionDomain;
  objectiveTitle: string;
  title: string;
  minutes: number;
  targetCount: number;
  suggestedCap?: number;
  reason?: string;
}

export interface CoachActionRun {
  id: number;
  user_id: number;
  domain: string;
  intent: string;
  generated_actions: string;
  applied: number;
  applied_summary: string;
  created_at: string;
}

export const sendCoachMessage = async (
  message: string,
  history: CoachChatHistoryItem[] = []
): Promise<CoachChatResponse> => {
  return apiRequest('/coach/chat', {
    method: 'POST',
    body: JSON.stringify({ message, history }),
  });
};

export const generateCoachActions = async (
  intent: string,
  domain?: CoachActionDomain
): Promise<{ runId: number; actions: CoachActionItem[] }> => {
  return apiRequest<{ runId: number; actions: CoachActionItem[] }>('/coach/actions/generate', {
    method: 'POST',
    body: JSON.stringify({ intent, domain }),
  });
};

export const applyCoachActions = async (payload: {
  runId?: number;
  weekStart?: string;
  actions?: CoachActionItem[];
}): Promise<{
  runId: number;
  weekStart: string;
  applied: {
    objectives: unknown[];
    actions: unknown[];
    financeCaps: Array<{ month: string; capAmount: number; reason: string }>;
  };
}> => {
  return apiRequest('/coach/actions/apply', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const getCoachActionHistory = async (): Promise<{ runs: CoachActionRun[] }> => {
  return apiRequest<{ runs: CoachActionRun[] }>('/coach/actions/history');
};
