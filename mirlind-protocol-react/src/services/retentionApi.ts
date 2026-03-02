import { apiRequest } from './authApi';

export interface RetentionSettings {
  id: number;
  user_id: number;
  reminder_start: string;
  reminder_end: string;
  minimum_viable_actions: number;
  missed_day_recovery_enabled: number;
  created_at: string;
  updated_at: string;
}

export interface RetentionStatusResponse {
  status: {
    today: string;
    latestActivityDate: string | null;
    missedDays: number;
    hasMissedDay: boolean;
    isColdStart: boolean;
    minimumViableMode: boolean;
    reminderWindowActive: boolean;
  };
  settings: RetentionSettings;
  recoveryPlan: string[];
  minimumViableDayTemplate: Array<{ label: string; action: string }>;
}

export interface RetentionSettingsPayload {
  reminderStart?: string;
  reminderEnd?: string;
  minimumViableActions?: number;
  missedDayRecoveryEnabled?: boolean;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function toNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function toBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

const DEFAULT_RETENTION_SETTINGS: RetentionSettings = {
  id: 0,
  user_id: 0,
  reminder_start: '18:00',
  reminder_end: '20:00',
  minimum_viable_actions: 2,
  missed_day_recovery_enabled: 1,
  created_at: '',
  updated_at: '',
};

function normalizeSettings(value: unknown): RetentionSettings {
  if (!isObject(value)) return { ...DEFAULT_RETENTION_SETTINGS };

  return {
    id: toNumber(value.id),
    user_id: toNumber(value.user_id),
    reminder_start: toString(value.reminder_start, DEFAULT_RETENTION_SETTINGS.reminder_start),
    reminder_end: toString(value.reminder_end, DEFAULT_RETENTION_SETTINGS.reminder_end),
    minimum_viable_actions: toNumber(value.minimum_viable_actions, DEFAULT_RETENTION_SETTINGS.minimum_viable_actions),
    missed_day_recovery_enabled: toNumber(value.missed_day_recovery_enabled, DEFAULT_RETENTION_SETTINGS.missed_day_recovery_enabled),
    created_at: toString(value.created_at),
    updated_at: toString(value.updated_at),
  };
}

function normalizeRetentionStatus(value: unknown): RetentionStatusResponse {
  const data = isObject(value) ? value : {};
  const rawStatus = isObject(data.status) ? data.status : {};

  const recoveryPlan = Array.isArray(data.recoveryPlan)
    ? data.recoveryPlan.filter((item): item is string => typeof item === 'string')
    : [];

  const minimumViableDayTemplate = Array.isArray(data.minimumViableDayTemplate)
    ? data.minimumViableDayTemplate
        .filter((item): item is { label: string; action: string } =>
          isObject(item) && typeof item.label === 'string' && typeof item.action === 'string'
        )
    : [];

  return {
    status: {
      today: toString(rawStatus.today),
      latestActivityDate:
        rawStatus.latestActivityDate === null || typeof rawStatus.latestActivityDate === 'string'
          ? (rawStatus.latestActivityDate as string | null)
          : null,
      missedDays: toNumber(rawStatus.missedDays),
      hasMissedDay: toBoolean(rawStatus.hasMissedDay),
      isColdStart: toBoolean(rawStatus.isColdStart),
      minimumViableMode: toBoolean(rawStatus.minimumViableMode),
      reminderWindowActive: toBoolean(rawStatus.reminderWindowActive),
    },
    settings: normalizeSettings(data.settings),
    recoveryPlan,
    minimumViableDayTemplate,
  };
}

export const getRetentionSettings = async (): Promise<{ settings: RetentionSettings }> => {
  const response = await apiRequest<unknown>('/retention/settings');
  const data = isObject(response) ? response : {};
  return { settings: normalizeSettings(data.settings) };
};

export const updateRetentionSettings = async (
  payload: RetentionSettingsPayload
): Promise<{ settings: RetentionSettings }> => {
  const response = await apiRequest<unknown>('/retention/settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  const data = isObject(response) ? response : {};
  return { settings: normalizeSettings(data.settings) };
};

export const getRetentionStatus = async (): Promise<RetentionStatusResponse> => {
  const response = await apiRequest<unknown>('/retention/status');
  return normalizeRetentionStatus(response);
};
