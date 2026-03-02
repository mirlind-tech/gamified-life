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

export interface FinanceCap {
  id: number;
  user_id: number;
  month: string;
  cap_amount: number;
  reason: string;
  created_at: string;
  updated_at: string;
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

export const getFinanceCap = async (month?: string): Promise<{ cap: FinanceCap | null }> => {
  const query = month ? `?month=${encodeURIComponent(month)}` : '';
  return apiRequest<{ cap: FinanceCap | null }>(`/finance/caps${query}`);
};

export const saveFinanceCap = async (
  month: string,
  capAmount: number,
  reason = ''
): Promise<{ cap: FinanceCap | null }> => {
  return apiRequest<{ cap: FinanceCap | null }>('/finance/caps', {
    method: 'PUT',
    body: JSON.stringify({ month, capAmount, reason }),
  });
};
