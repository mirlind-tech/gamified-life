import { useEffect, useMemo, useState } from 'react';
import { useGame } from '../store/useGame';
import { getLatestGermanProgress, type GermanProgress } from '../services/germanApi';
import { getOutcomeSummary } from '../services/outcomesApi';
import { logger } from '../utils/logger';

function getWeekStartISO(date = new Date()): string {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay();
  const diff = (day + 6) % 7;
  utc.setUTCDate(utc.getUTCDate() - diff);
  return utc.toISOString().slice(0, 10);
}

function estimateCEFR(totalWords: number): string {
  if (totalWords >= 8000) return 'C1+';
  if (totalWords >= 5000) return 'B2';
  if (totalWords >= 2500) return 'B1';
  if (totalWords >= 1200) return 'A2';
  return 'A1';
}

export function GermanHQView() {
  const { setView, showToast } = useGame();
  const [progress, setProgress] = useState<GermanProgress | null>(null);
  const [weeklyActions, setWeeklyActions] = useState({ done: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const weekStart = useMemo(() => getWeekStartISO(), []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [latest, summary] = await Promise.all([getLatestGermanProgress(), getOutcomeSummary(weekStart)]);
        setProgress(latest.progress || null);

        const goalIds = new Set(summary.goals.filter((goal) => goal.domain === 'german').map((goal) => goal.id));
        const objectiveIds = new Set(
          summary.objectives.filter((objective) => goalIds.has(objective.goal_id)).map((objective) => objective.id)
        );
        const actions = summary.actions.filter((action) => objectiveIds.has(action.objective_id));
        setWeeklyActions({
          total: actions.length,
          done: actions.filter((action) => action.status === 'completed').length,
        });
      } catch (error) {
        logger.error('Failed loading German HQ:', error);
        showToast('Failed to load German HQ', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [showToast, weekStart]);

  const totalWords = progress?.total_words || 0;
  const cefr = estimateCEFR(totalWords);

  return (
    <div className="max-w-5xl mx-auto pb-8 space-y-5">
      <div className="glass-card rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">German HQ</h2>
          <p className="text-sm text-text-secondary">Daily reps for B1 speed-run, then B2/C1 scale-up.</p>
        </div>
        <button
          onClick={() => setView('command')}
          className="px-3 py-2 rounded-lg border border-border bg-bg-secondary/40 text-text-secondary hover:text-text-primary"
        >
          Command Center
        </button>
      </div>

      {isLoading ? (
        <div className="glass-card rounded-2xl p-5 text-sm text-text-secondary">Loading German metrics...</div>
      ) : (
        <>
          <div className="grid md:grid-cols-4 gap-4">
            <Metric label="Estimated CEFR" value={cefr} />
            <Metric label="Total Words" value={String(totalWords)} />
            <Metric label="Anki Streak" value={`${progress?.anki_streak || 0} days`} />
            <Metric label="Weekly Actions" value={`${weeklyActions.done}/${weeklyActions.total}`} />
          </div>

          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-lg font-semibold text-text-primary mb-3">B1 Milestones</h3>
            <Milestone label="2500+ words active vocabulary" done={totalWords >= 2500} />
            <Milestone label="7+ day Anki streak" done={(progress?.anki_streak || 0) >= 7} />
            <Milestone label="Language Transfer lesson 45+" done={(progress?.language_transfer_lesson || 0) >= 45} />
            <Milestone label="Consistent weekly action completion" done={weeklyActions.total > 0 && weeklyActions.done / weeklyActions.total >= 0.7} />
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

function Milestone({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className={done ? 'text-accent-green' : 'text-text-muted'}>{done ? 'Done' : 'In progress'}</span>
    </div>
  );
}
