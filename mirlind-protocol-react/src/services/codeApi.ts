import { apiRequest } from './authApi';

export interface CodeProgress {
  id?: number;
  date: string;
  hours: number;
  github_commits: number;
  project: string;
  skills: string[];
  notes: string;
}

// Get code progress for a specific date
export const getCodeProgress = async (date: string): Promise<{ progress: CodeProgress }> => {
  return apiRequest(`/code/${date}`);
};

// Save code progress
export const saveCodeProgress = async (data: CodeProgress): Promise<{ message: string }> => {
  return apiRequest('/code', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Get latest code progress
export const getLatestCodeProgress = async (): Promise<{ progress: CodeProgress | null }> => {
  return apiRequest('/code/latest');
};
