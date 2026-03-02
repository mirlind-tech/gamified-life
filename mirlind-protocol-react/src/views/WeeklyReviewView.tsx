import { useEffect, useMemo, useState } from 'react';
import { useGame } from '../store/useGame';
import { logger } from '../utils/logger';
import { getWeeklyPlan, saveWeeklyReview } from '../services/weeklyApi';

function getWeekStartISO(date = new Date()): string {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay();
  const diff = (day + 6) % 7;
  utc.setUTCDate(utc.getUTCDate() - diff);
  return utc.toISOString().slice(0, 10);
}

interface ReviewDraft {
  wins: string;
  failures: string;
  lessons: string;
  adjustments: string;
  confidence: number;
}

export function WeeklyReviewView() {
  const { setView, showToast } = useGame();
  const weekStart = useMemo(() => getWeekStartISO(), []);
  const [totals, setTotals] = useState<{ completed: number; total: number }>({ completed: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [nextWeek, setNextWeek] = useState<{ weekStart: string; objectives: Array<{ id: number; title: string; target_count: number }> } | null>(null);
  const [draft, setDraft] = useState<ReviewDraft>({
    wins: '',
    failures: '',
    lessons: '',
    adjustments: '',
    confidence: 3,
  });

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const plan = await getWeeklyPlan(weekStart);
        const completed = plan.actions.filter((action) => action.status === 'completed').length;
        setTotals({ completed, total: plan.actions.length });
        if (plan.review) {
          setDraft({
            wins: plan.review.wins || '',
            failures: plan.review.failures || '',
            lessons: plan.review.lessons || '',
            adjustments: plan.review.adjustments || '',
            confidence: plan.review.confidence || 3,
          });
        }
      } catch (error) {
        logger.error('Failed to load weekly review data:', error);
        showToast('Failed to load weekly review', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [showToast, weekStart]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await saveWeeklyReview({
        weekStart,
        wins: draft.wins,
        failures: draft.failures,
        lessons: draft.lessons,
        adjustments: draft.adjustments,
        confidence: draft.confidence,
      });
      setNextWeek({
        weekStart: response.nextWeek.weekStart,
        objectives: response.nextWeek.objectives.map((objective) => ({
          id: objective.id,
          title: objective.title,
          target_count: objective.target_count,
        })),
      });
      showToast('Review saved and next week auto-adjusted', 'success');
    } catch (error) {
      logger.error('Failed to save weekly review:', error);
      showToast('Could not save weekly review', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-8 space-y-5">
      <div className="glass-card rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Weekly Review</h2>
          <p className="text-sm text-text-secondary">Review wins/failures and auto-adjust next week.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('weekly-plan')}
            className="px-3 py-2 rounded-lg border border-border bg-bg-secondary/40 text-text-secondary hover:text-text-primary"
          >
            Weekly Plan
          </button>
          <button
            onClick={() => setView('insights')}
            className="px-3 py-2 rounded-lg bg-accent-cyan-dark text-white hover:bg-accent-cyan-dark/80"
          >
            Insights
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs text-text-muted">Action Completion</p>
          <p className="text-3xl font-bold text-accent-green">
            {totals.completed}/{totals.total}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs text-text-muted">Confidence For Next Week</p>
          <div className="mt-2 flex gap-2">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                onClick={() => setDraft((prev) => ({ ...prev, confidence: score }))}
                className={`w-10 h-10 rounded-lg border ${
                  draft.confidence === score
                    ? 'border-accent-purple bg-accent-purple/20 text-accent-purple'
                    : 'border-border text-text-secondary'
                }`}
              >
                {score}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <label className="text-sm text-text-muted block">
          Wins
          <textarea
            id="weekly-review-wins"
            name="weekly_review_wins"
            value={draft.wins}
            onChange={(e) => setDraft((prev) => ({ ...prev, wins: e.target.value }))}
            rows={3}
            className="mt-1 w-full rounded-lg px-3 py-2 bg-black/30 border border-border text-text-primary"
          />
        </label>
        <label className="text-sm text-text-muted block">
          Failures
          <textarea
            id="weekly-review-failures"
            name="weekly_review_failures"
            value={draft.failures}
            onChange={(e) => setDraft((prev) => ({ ...prev, failures: e.target.value }))}
            rows={3}
            className="mt-1 w-full rounded-lg px-3 py-2 bg-black/30 border border-border text-text-primary"
          />
        </label>
        <label className="text-sm text-text-muted block">
          Lessons
          <textarea
            id="weekly-review-lessons"
            name="weekly_review_lessons"
            value={draft.lessons}
            onChange={(e) => setDraft((prev) => ({ ...prev, lessons: e.target.value }))}
            rows={3}
            className="mt-1 w-full rounded-lg px-3 py-2 bg-black/30 border border-border text-text-primary"
          />
        </label>
        <label className="text-sm text-text-muted block">
          Adjustments For Next Week
          <textarea
            id="weekly-review-adjustments"
            name="weekly_review_adjustments"
            value={draft.adjustments}
            onChange={(e) => setDraft((prev) => ({ ...prev, adjustments: e.target.value }))}
            rows={3}
            className="mt-1 w-full rounded-lg px-3 py-2 bg-black/30 border border-border text-text-primary"
          />
        </label>
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="px-4 py-2 rounded-lg bg-accent-purple-dark text-white hover:bg-accent-purple-dark/80 disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save Review + Auto-Adjust'}
          </button>
        </div>
      </div>

      {nextWeek && (
        <div className="glass-card rounded-2xl p-5 border border-accent-cyan/40 bg-accent-cyan/10">
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Next Week Auto-Adjusted ({nextWeek.weekStart})
          </h3>
          <div className="space-y-2">
            {nextWeek.objectives.map((objective) => (
              <div key={objective.id} className="rounded-lg border border-border bg-bg-secondary/30 p-3">
                <p className="font-semibold text-text-primary">{objective.title}</p>
                <p className="text-xs text-text-muted">New target count: {objective.target_count}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
