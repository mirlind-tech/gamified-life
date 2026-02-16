import { apiRequest } from './authApi';

export interface GermanProgress {
  id?: number;
  date: string;
  anki_cards: number;
  anki_time: number;
  anki_streak: number;
  total_words: number;
  language_transfer: boolean;
  language_transfer_lesson: number;
  radio_hours: number;
  tandem_minutes: number;
  notes?: string;
}

// Get German progress for a specific date
export const getGermanProgress = async (date: string): Promise<{ progress: GermanProgress }> => {
  return apiRequest(`/german/${date}`);
};

// Save German progress
export const saveGermanProgress = async (data: GermanProgress): Promise<{ message: string }> => {
  return apiRequest('/german', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Get latest German progress
export const getLatestGermanProgress = async (): Promise<{ progress: GermanProgress | null }> => {
  return apiRequest('/german/latest');
};
