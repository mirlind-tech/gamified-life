import { apiRequest } from './authApi';

export interface WeeklyTrendPoint {
  weekStart: string;
  adherence: number;
  output: number;
  outcomes: number;
}

export interface DomainOutcome {
  domain: string;
  goals: number;
  activeObjectives: number;
  completedObjectives: number;
}

export interface TrendAnalyticsResponse {
  trends: WeeklyTrendPoint[];
  weekChangeInsights: string[];
  domainOutcomes: DomainOutcome[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toFiniteNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function normalizeTrendPoint(value: unknown): WeeklyTrendPoint | null {
  if (!isObject(value)) return null;
  const weekStart = typeof value.weekStart === 'string' ? value.weekStart : '';
  if (!weekStart) return null;

  return {
    weekStart,
    adherence: toFiniteNumber(value.adherence),
    output: toFiniteNumber(value.output),
    outcomes: toFiniteNumber(value.outcomes),
  };
}

function normalizeDomainOutcome(value: unknown): DomainOutcome | null {
  if (!isObject(value)) return null;
  const domain = typeof value.domain === 'string' ? value.domain : '';
  if (!domain) return null;

  return {
    domain,
    goals: toFiniteNumber(value.goals),
    activeObjectives: toFiniteNumber(value.activeObjectives),
    completedObjectives: toFiniteNumber(value.completedObjectives),
  };
}

function normalizeTrendAnalyticsResponse(payload: unknown): TrendAnalyticsResponse {
  const data = isObject(payload) ? payload : {};

  const trends = Array.isArray(data.trends)
    ? data.trends.map(normalizeTrendPoint).filter((point): point is WeeklyTrendPoint => point !== null)
    : [];

  const weekChangeInsights = Array.isArray(data.weekChangeInsights)
    ? data.weekChangeInsights.filter((insight): insight is string => typeof insight === 'string')
    : [];

  const domainOutcomes = Array.isArray(data.domainOutcomes)
    ? data.domainOutcomes.map(normalizeDomainOutcome).filter((outcome): outcome is DomainOutcome => outcome !== null)
    : [];

  return {
    trends,
    weekChangeInsights,
    domainOutcomes,
  };
}

export const getTrendAnalytics = async (weeks = 8): Promise<TrendAnalyticsResponse> => {
  const response = await apiRequest<unknown>(`/analytics/trends?weeks=${encodeURIComponent(String(weeks))}`);
  return normalizeTrendAnalyticsResponse(response);
};
