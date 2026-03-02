import { useEffect, useMemo, useState } from 'react';
import { useGame } from '../store/useGame';
import { getCodeStreak, getCodeTotals, getLatestCodeProgress } from '../services/codeApi';
import { getOutcomeSummary } from '../services/outcomesApi';
import { logger } from '../utils/logger';

function getWeekStartISO(date = new Date()): string {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay();
  const diff = (day + 6) % 7;
  utc.setUTCDate(utc.getUTCDate() - diff);
  return utc.toISOString().slice(0, 10);
}

export function CareerHQView() {
  const { setView, showToast } = useGame();
  const [latestProject, setLatestProject] = useState('');
  const [streak, setStreak] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [weeklyActions, setWeeklyActions] = useState({ done: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const weekStart = useMemo(() => getWeekStartISO(), []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [latest, streakData, totals, summary] = await Promise.all([
          getLatestCodeProgress(),
          getCodeStreak(),
          getCodeTotals(),
          getOutcomeSummary(weekStart),
        ]);
        setLatestProject(latest.progress?.project || 'No active project');
        setStreak(streakData.streak || 0);
        setTotalHours(totals.totalHours || 0);

        const goalIds = new Set(summary.goals.filter((goal) => goal.domain === 'career').map((goal) => goal.id));
        const objectiveIds = new Set(
          summary.objectives.filter((objective) => goalIds.has(objective.goal_id)).map((objective) => objective.id)
        );
        const actions = summary.actions.filter((action) => objectiveIds.has(action.objective_id));
        setWeeklyActions({
          done: actions.filter((action) => action.status === 'completed').length,
          total: actions.length,
        });
      } catch (error) {
        logger.error('Failed loading Career HQ:', error);
        showToast('Failed to load Career HQ', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [showToast, weekStart]);

  return (
    <div className="max-w-6xl mx-auto pb-8 space-y-5">
      <div className="glass-card rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Career HQ</h2>
          <p className="text-sm text-text-secondary">Coding output, interview readiness, and job-switch execution.</p>
        </div>
        <button
          onClick={() => setView('command')}
          className="px-3 py-2 rounded-lg border border-border bg-bg-secondary/40 text-text-secondary hover:text-text-primary"
        >
          Command Center
        </button>
      </div>

      {isLoading ? (
        <div className="glass-card rounded-2xl p-5 text-sm text-text-secondary">Loading career metrics...</div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-4">
            <Metric label="Coding streak" value={`${streak} days`} />
            <Metric label="Total coding hours" value={`${Math.round(totalHours)}h`} />
            <Metric label="Weekly career actions" value={`${weeklyActions.done}/${weeklyActions.total}`} />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-2">Active Project</h3>
              <p className="text-sm text-text-secondary">{latestProject}</p>
              <div className="mt-4 space-y-2">
                <ChecklistItem label="Ship 1 meaningful feature this week" done={weeklyActions.done >= 4} />
                <ChecklistItem label="Push code publicly with clean commit history" done={streak >= 3} />
                <ChecklistItem label="Maintain minimum 10h coding weekly" done={totalHours >= 10} />
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-2">Recommended Loop</h3>
              <p className="text-sm text-text-secondary">1. Build output</p>
              <p className="text-sm text-text-secondary">2. Package proof (README + demo)</p>
              <p className="text-sm text-text-secondary">3. Apply to targeted roles</p>
              <p className="text-sm text-text-secondary">4. Review interview feedback</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
    </div>
  );
}

function ChecklistItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className={done ? 'text-accent-green' : 'text-text-muted'}>{done ? 'Done' : 'Pending'}</span>
    </div>
  );
}
