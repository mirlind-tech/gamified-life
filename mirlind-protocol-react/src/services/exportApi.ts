import { apiRequest } from './authApi';

export interface ExportPayload {
  exportedAt: string;
  version: string;
  user: {
    id: number;
    email: string;
    username: string;
    created_at: string;
    updated_at: string;
  };
  data: Record<string, unknown>;
}

export const exportUserData = async (): Promise<ExportPayload> => {
  return apiRequest<ExportPayload>('/export/data');
};
