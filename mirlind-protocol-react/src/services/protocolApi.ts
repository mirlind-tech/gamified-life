import { apiRequest } from './authApi';

export interface DailyProtocol {
  id?: number;
  date: string;
  wake05: boolean;
  german_study: boolean;
  gym_workout: boolean;
  coding_hours: number;
  sleep22: boolean;
  notes: string;
}

// Get protocol for a specific date
export const getProtocol = async (date: string): Promise<{ protocol: DailyProtocol }> => {
  return apiRequest(`/protocol/${date}`);
};

// Save protocol
export const saveProtocol = async (data: DailyProtocol): Promise<{ message: string }> => {
  return apiRequest('/protocol', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Get current streak
export const getProtocolStreak = async (): Promise<{ streak: number }> => {
  return apiRequest('/protocol/streak');
};
