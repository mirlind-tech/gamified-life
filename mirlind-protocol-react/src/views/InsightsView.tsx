import { useEffect, useMemo, useState } from 'react';
import { useGame } from '../store/useGame';
import { logger } from '../utils/logger';
import { getTrendAnalytics, type WeeklyTrendPoint } from '../services/analyticsApi';
import {
  getRetentionStatus,
  updateRetentionSettings,
  type RetentionStatusResponse,
} from '../services/retentionApi';

interface SeriesChartProps {
  label: string;
  color: string;
  points: Array<{ x: number; y: number }>;
}

function buildSeries(trends: WeeklyTrendPoint[], key: 'adherence' | 'output' | 'outcomes') {
  const count = trends.length;
  if (count === 0) return [];
  return trends.map((trend, index) => {
    const x = (index / Math.max(1, count - 1)) * 100;
    const y = 100 - trend[key];
    return { x, y };
  });
}

function toPolyline(points: Array<{ x: number; y: number }>): string {
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}

function SeriesChart({ label, color, points }: SeriesChartProps) {
  return (
    <div className="rounded-xl border border-border bg-bg-secondary/25 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-text-muted">{label}</p>
        <span className="text-xs" style={{ color }}>
          {points.length ? `${Math.round(100 - points[points.length - 1].y)}%` : '--'}
        </span>
      </div>
      <svg viewBox="0 0 100 100" className="w-full h-24">
        <polyline fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" points="0,50 100,50" />
        {points.length > 1 && (
          <polyline fill="none" stroke={color} strokeWidth="2.5" points={toPolyline(points)} />
        )}
      </svg>
    </div>
  );
}

export function InsightsView() {
  const { setView, showToast } = useGame();
  const [trends, setTrends] = useState<WeeklyTrendPoint[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [retention, setRetention] = useState<RetentionStatusResponse | null>(null);
  const [reminderStart, setReminderStart] = useState('18:00');
  const [reminderEnd, setReminderEnd] = useState('20:00');
  const [minActions, setMinActions] = useState(2);
  const [isSavingRetention, setIsSavingRetention] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [trendData, retentionData] = await Promise.all([
          getTrendAnalytics(8),
          getRetentionStatus(),
        ]);
        setTrends(trendData.trends);
        setInsights(trendData.weekChangeInsights);
        setRetention(retentionData);
        setReminderStart(retentionData.settings.reminder_start || '18:00');
        setReminderEnd(retentionData.settings.reminder_end || '20:00');
        setMinActions(retentionData.settings.minimum_viable_actions || 2);
      } catch (error) {
        logger.error('Failed to load insights:', error);
        showToast('Failed to load insights', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [showToast]);

  const handleSaveRetention = async () => {
    setIsSavingRetention(true);
    try {
      const updated = await updateRetentionSettings({
        reminderStart,
        reminderEnd,
        minimumViableActions: minActions,
      });
      setRetention((prev) =>
        prev
          ? {
              ...prev,
              settings: updated.settings,
            }
          : prev
      );
      showToast('Retention settings saved', 'success');
    } catch (error) {
      logger.error('Failed to save retention settings:', error);
      showToast('Could not save retention settings', 'error');
    } finally {
      setIsSavingRetention(false);
    }
  };

  const adherenceSeries = useMemo(() => buildSeries(trends, 'adherence'), [trends]);
  const outputSeries = useMemo(() => buildSeries(trends, 'output'), [trends]);
  const outcomeSeries = useMemo(() => buildSeries(trends, 'outcomes'), [trends]);

  return (
    <div className="max-w-6xl mx-auto pb-8 space-y-5">
      <div className="glass-card rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Progress Insights</h2>
          <p className="text-sm text-text-secondary">
            Trends for adherence, output, outcomes, and what changed this week.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('command')}
            className="px-3 py-2 rounded-lg border border-border bg-bg-secondary/40 text-text-secondary hover:text-text-primary"
          >
            Command Center
          </button>
          <button
            onClick={() => setView('assessment')}
            className="px-3 py-2 rounded-lg bg-accent-purple-dark text-white hover:bg-accent-purple-dark/80"
          >
            Baseline Assessment
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="glass-card rounded-2xl p-5 text-text-secondary text-sm">Loading analytics...</div>
      ) : (
        <>
          <div className="grid lg:grid-cols-3 gap-4">
            <SeriesChart label="Adherence Trend" color="#34d399" points={adherenceSeries} />
            <SeriesChart label="Output Trend" color="#22d3ee" points={outputSeries} />
            <SeriesChart label="Outcome Trend" color="#a78bfa" points={outcomeSeries} />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-2">What Changed This Week</h3>
              <div className="space-y-2">
                {insights.map((insight) => (
                  <p key={insight} className="text-sm text-text-secondary">
                    - {insight}
                  </p>
                ))}
                {!insights.length && <p className="text-sm text-text-secondary">No insights yet.</p>}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-2">Retention Loop</h3>
              {retention ? (
                <div className="space-y-2 text-sm">
                  <p className="text-text-secondary">
                    Missed days: <span className="text-text-primary font-semibold">{retention.status.missedDays}</span>
                  </p>
                  <p className="text-text-secondary">
                    Minimum viable day mode:{' '}
                    <span className="text-text-primary font-semibold">
                      {retention.status.minimumViableMode ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                  <p className="text-text-secondary">
                    Reminder window active:{' '}
                    <span className="text-text-primary font-semibold">
                      {retention.status.reminderWindowActive ? 'Yes' : 'No'}
                    </span>
                  </p>
                  {(retention.recoveryPlan?.length ?? 0) > 0 && (
                    <>
                      <p className="text-text-primary font-semibold mt-2">Recovery Plan</p>
                      {(retention.recoveryPlan ?? []).map((step) => (
                        <p key={step} className="text-text-secondary">
                          - {step}
                        </p>
                      ))}
                    </>
                  )}

                  <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                    <p className="text-text-primary font-semibold">Reminder Window</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        id="retention-reminder-start"
                        name="retention_reminder_start"
                        type="time"
                        value={reminderStart}
                        onChange={(e) => setReminderStart(e.target.value)}
                        className="rounded-lg px-2 py-1 bg-black/30 border border-border text-text-primary"
                      />
                      <input
                        id="retention-reminder-end"
                        name="retention_reminder_end"
                        type="time"
                        value={reminderEnd}
                        onChange={(e) => setReminderEnd(e.target.value)}
                        className="rounded-lg px-2 py-1 bg-black/30 border border-border text-text-primary"
                      />
                    </div>
                    <label className="text-xs text-text-muted block">
                      Minimum viable actions
                      <input
                        id="retention-minimum-viable-actions"
                        name="retention_minimum_viable_actions"
                        type="number"
                        min={1}
                        max={5}
                        value={minActions}
                        onChange={(e) => setMinActions(Number(e.target.value))}
                        className="mt-1 w-full rounded-lg px-2 py-1 bg-black/30 border border-border text-text-primary"
                      />
                    </label>
                    <button
                      onClick={handleSaveRetention}
                      disabled={isSavingRetention}
                      className="px-3 py-1.5 rounded-lg bg-accent-purple-dark text-white hover:bg-accent-purple-dark/80 disabled:opacity-60"
                    >
                      {isSavingRetention ? 'Saving...' : 'Save Retention Settings'}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-secondary">Retention status unavailable.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
