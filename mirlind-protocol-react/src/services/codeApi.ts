import { apiRequest } from './authApi';

export interface CodeProgress {
  id?: number | string;
  date: string;
  hours: number;
  commits: number;
  project: string;
  notes: string;
}

interface RawCodeProgress {
  id?: number | string | null;
  date?: string;
  hours?: number;
  commits?: number;
  github_commits?: number;
  project?: string;
  notes?: string;
}

interface CodeStreakResponse {
  streak?: number;
  streak_days?: number;
}

interface CodeTotalsResponse {
  totalHours?: number;
  totalCommits?: number;
  totalDays?: number;
  total_hours?: number;
  total_commits?: number;
  total_days?: number;
}

function normalizeProgress(progress?: RawCodeProgress | null): CodeProgress {
  return {
    id: progress?.id ?? undefined,
    date: progress?.date ?? new Date().toISOString().slice(0, 10),
    hours: progress?.hours ?? 0,
    commits: progress?.commits ?? progress?.github_commits ?? 0,
    project: progress?.project ?? '',
    notes: progress?.notes ?? '',
  };
}

// Get code progress for a specific date
export const getCodeProgress = async (date: string): Promise<{ progress: CodeProgress }> => {
  const response = await apiRequest<{ progress?: RawCodeProgress }>(`/code/${date}`);
  return { progress: normalizeProgress(response.progress) };
};

// Save code progress
export const saveCodeProgress = async (data: CodeProgress): Promise<{ message: string }> => {
  return apiRequest('/code', {
    method: 'POST',
    body: JSON.stringify({
      date: data.date,
      hours: data.hours,
      github_commits: data.commits,
      project: data.project,
      notes: data.notes,
    }),
  });
};

// Get latest code progress
export const getLatestCodeProgress = async (): Promise<{ progress: CodeProgress | null }> => {
  const response = await apiRequest<{ progress?: RawCodeProgress | null }>('/code/latest');
  if (!response.progress) {
    return { progress: null };
  }
  return { progress: normalizeProgress(response.progress) };
};

export const getCodeStreak = async (): Promise<{ streak: number }> => {
  const response = await apiRequest<CodeStreakResponse>('/code/stats/streak');
  return { streak: response.streak ?? response.streak_days ?? 0 };
};

export const getCodeTotals = async (): Promise<{ totalHours: number; totalCommits: number; totalDays: number }> => {
  const response = await apiRequest<CodeTotalsResponse>('/code/stats/total');
  return {
    totalHours: response.totalHours ?? response.total_hours ?? 0,
    totalCommits: response.totalCommits ?? response.total_commits ?? 0,
    totalDays: response.totalDays ?? response.total_days ?? 0,
  };
};
