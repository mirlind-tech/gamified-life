import { apiRequest } from './authApi';

export interface FinanceEntry {
  id?: number;
  date: string;
  amount: number;
  category: 'food' | 'transport' | 'gym' | 'other';
  description: string;
}

export interface FinanceSummary {
  category: string;
  total: number;
  count: number;
}

// Get finance entries (optionally filtered by date range)
export const getFinanceEntries = async (startDate?: string, endDate?: string): Promise<{ entries: FinanceEntry[] }> => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const query = params.toString();
  return apiRequest(`/finance${query ? `?${query}` : ''}`);
};

// Add finance entry
export const addFinanceEntry = async (data: FinanceEntry): Promise<{ id: number; message: string }> => {
  return apiRequest('/finance', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Delete finance entry
export const deleteFinanceEntry = async (id: number): Promise<{ message: string }> => {
  return apiRequest(`/finance/${id}`, {
    method: 'DELETE',
  });
};

// Get finance summary by category
export const getFinanceSummary = async (startDate?: string, endDate?: string): Promise<{ summary: FinanceSummary[]; total: number }> => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const query = params.toString();
  return apiRequest(`/finance/summary${query ? `?${query}` : ''}`);
};
