import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/useAuth';
import { useGame } from '../../store/useGame';
import {
  createOutcomeAction,
  createOutcomeGoal,
  createOutcomeObjective,
  getOutcomeSummary,
  updateOutcomeAction,
  updateOutcomeObjective,
  upsertOutcomeCheckin,
  type OutcomeActionStatus,
  type OutcomeDomain,
  type OutcomeSummary,
  type OutcomeWeeklyObjective,
} from '../../services/outcomesApi';
import { getRetentionStatus, type RetentionStatusResponse } from '../../services/retentionApi';
import { logger } from '../../utils/logger';

const DOMAIN_OPTIONS: Array<{ value: OutcomeDomain; label: string }> = [
  { value: 'career', label: 'Career' },
  { value: 'body', label: 'Body' },
  { value: 'mind', label: 'Mind' },
  { value: 'finance', label: 'Finance' },
  { value: 'german', label: 'German' },
  { value: 'custom', label: 'Custom' },
];

const ACTION_STATUS_LABEL: Record<OutcomeActionStatus, string> = {
  pending: 'Pending',
  completed: 'Done',
  skipped: 'Skipped',
};

function getWeekStartISO(date: Date): string {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utcDate.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  utcDate.setUTCDate(utcDate.getUTCDate() - diffToMonday);
  return utcDate.toISOString().slice(0, 10);
}

interface CheckinState {
  energy: number;
  focus: number;
  mood: number;
}

export function OutcomeCommandPanel() {
  const { isAuthenticated } = useAuth();
  const { setView } = useGame();
  const [summary, setSummary] = useState<OutcomeSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retention, setRetention] = useState<RetentionStatusResponse | null>(null);

  const [goalTitle, setGoalTitle] = useState('');
  const [goalDomain, setGoalDomain] = useState<OutcomeDomain>('career');

  const [objectiveTitle, setObjectiveTitle] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState<number | ''>('');

  const [actionTitle, setActionTitle] = useState('');
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<number | ''>('');

  const [checkin, setCheckin] = useState<CheckinState>({
    energy: 3,
    focus: 3,
    mood: 3,
  });

  const weekStart = useMemo(() => getWeekStartISO(new Date()), []);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const goals = useMemo(() => summary?.goals ?? [], [summary]);
  const objectives = useMemo(() => summary?.objectives ?? [], [summary]);
  const actions = useMemo(() => summary?.actions ?? [], [summary]);

  const goalMap = useMemo(() => {
    return new Map(goals.map((goal) => [goal.id, goal]));
  }, [goals]);

  const objectiveMap = useMemo(() => {
    return new Map(objectives.map((objective) => [objective.id, objective]));
  }, [objectives]);

  const todaysActions = useMemo(() => {
    return actions.filter((action) => action.action_date === today);
  }, [actions, today]);

  const reloadSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getOutcomeSummary(weekStart);
      setSummary(data);
    } catch (err) {
      logger.error('Failed to load outcome summary:', err);
      setError('Could not load outcomes right now.');
    } finally {
      setIsLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    void reloadSummary();
  }, [isAuthenticated, reloadSummary]);

  useEffect(() => {
    if (!isAuthenticated) return;
    getRetentionStatus()
      .then((data) => setRetention(data))
      .catch((err) => logger.error('Failed to load retention status:', err));
  }, [isAuthenticated]);

  useEffect(() => {
    if (goals.length === 0) {
      if (selectedGoalId !== '') setSelectedGoalId('');
      return;
    }

    if (selectedGoalId === '' || !goals.some((goal) => goal.id === selectedGoalId)) {
      setSelectedGoalId(goals[0].id);
    }
  }, [goals, selectedGoalId]);

  useEffect(() => {
    if (objectives.length === 0) {
      if (selectedObjectiveId !== '') setSelectedObjectiveId('');
      return;
    }

    if (selectedObjectiveId === '' || !objectives.some((objective) => objective.id === selectedObjectiveId)) {
      setSelectedObjectiveId(objectives[0].id);
    }
  }, [objectives, selectedObjectiveId]);

  const runMutation = useCallback(async (task: () => Promise<void>) => {
    setIsMutating(true);
    setError(null);
    try {
      await task();
      await reloadSummary();
    } catch (err) {
      logger.error('Outcome mutation failed:', err);
      setError('Could not save your update. Try again.');
    } finally {
      setIsMutating(false);
    }
  }, [reloadSummary]);

  const handleCreateGoal = async (): Promise<void> => {
    const trimmed = goalTitle.trim();
    if (!trimmed) return;
    await runMutation(async () => {
      await createOutcomeGoal({
        domain: goalDomain,
        title: trimmed,
      });
      setGoalTitle('');
    });
  };

  const handleCreateObjective = async (): Promise<void> => {
    const trimmed = objectiveTitle.trim();
    if (!trimmed || selectedGoalId === '') return;

    await runMutation(async () => {
      await createOutcomeObjective({
        goalId: selectedGoalId,
        weekStart,
        title: trimmed,
        targetCount: 5,
      });
      setObjectiveTitle('');
    });
  };

  const handleCreateAction = async (): Promise<void> => {
    const trimmed = actionTitle.trim();
    if (!trimmed || selectedObjectiveId === '') return;

    await runMutation(async () => {
      await createOutcomeAction({
        objectiveId: selectedObjectiveId,
        actionDate: today,
        title: trimmed,
        estimatedMinutes: 45,
      });
      setActionTitle('');
    });
  };

  const handleSetActionStatus = async (actionId: number, status: OutcomeActionStatus): Promise<void> => {
    await runMutation(async () => {
      await updateOutcomeAction(actionId, { status });
    });
  };

  const handleAdvanceObjective = async (objective: OutcomeWeeklyObjective): Promise<void> => {
    const nextCompleted = Math.min(objective.completed_count + 1, objective.target_count);
    const nextStatus = nextCompleted >= objective.target_count ? 'completed' : 'active';

    await runMutation(async () => {
      await updateOutcomeObjective(objective.id, {
        completedCount: nextCompleted,
        status: nextStatus,
      });
    });
  };

  const handleSaveCheckin = async (): Promise<void> => {
    await runMutation(async () => {
      await upsertOutcomeCheckin(today, checkin);
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="glass-card rounded-2xl p-4 border border-accent-yellow/30 bg-accent-yellow/10">
        <p className="text-sm font-semibold text-text-primary">Outcome Engine requires login</p>
        <p className="text-xs text-text-secondary mt-1">
          Log in to sync weekly objectives, daily actions, and your execution score.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="glass-card rounded-2xl p-3 border border-red-500/40 bg-red-500/10 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="glass-card rounded-2xl p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setView('weekly-plan')}
            className="px-3 py-1.5 rounded-lg text-xs bg-accent-purple-dark hover:bg-accent-purple-dark/80 text-white"
          >
            Weekly Plan Screen
          </button>
          <button
            onClick={() => setView('weekly-review')}
            className="px-3 py-1.5 rounded-lg text-xs bg-accent-cyan-dark hover:bg-accent-cyan-dark/80 text-white"
          >
            Weekly Review Screen
          </button>
          <button
            onClick={() => setView('assessment')}
            className="px-3 py-1.5 rounded-lg text-xs border border-border text-text-secondary hover:text-text-primary"
          >
            Baseline Assessment
          </button>
          <button
            onClick={() => setView('insights')}
            className="px-3 py-1.5 rounded-lg text-xs border border-border text-text-secondary hover:text-text-primary"
          >
            Progress Insights
          </button>
        </div>

        {retention?.status.minimumViableMode && (
          <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 mb-4">
            <p className="text-xs font-semibold text-amber-200">Minimum Viable Day Mode Active</p>
            <p className="text-xs text-amber-100/80 mt-1">
              Missed days detected. Run the minimum viable plan to prevent streak collapse.
            </p>
            <div className="mt-2 space-y-1">
              {retention.minimumViableDayTemplate.map((item) => (
                <p key={`${item.label}-${item.action}`} className="text-xs text-amber-100/80">
                  - {item.label}: {item.action}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-text-primary">Outcome Score Card</h3>
          <button
            onClick={() => void reloadSummary()}
            className="text-xs px-3 py-1 rounded-lg bg-bg-secondary hover:bg-bg-hover text-text-secondary"
            disabled={isLoading || isMutating}
          >
            Refresh
          </button>
        </div>

        {isLoading ? (
          <p className="text-sm text-text-secondary">Loading weekly outcomes...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ScoreMetric label="Outcome Score" value={`${summary?.score.score ?? 0}%`} emphasis />
            <ScoreMetric label="Action Completion" value={`${Math.round((summary?.score.completionRate ?? 0) * 100)}%`} />
            <ScoreMetric label="Objective Completion" value={`${Math.round((summary?.score.objectiveRate ?? 0) * 100)}%`} />
            <ScoreMetric label="Check-in Consistency" value={`${Math.round((summary?.score.checkinRate ?? 0) * 100)}%`} />
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl p-4">
        <h3 className="text-lg font-bold text-text-primary mb-3">Weekly Objectives Board</h3>

        <div className="space-y-3 mb-4">
          {objectives.length === 0 && <p className="text-sm text-text-secondary">No weekly objectives yet.</p>}
          {objectives.map((objective) => {
            const goal = goalMap.get(objective.goal_id);
            const progress = objective.target_count > 0
              ? (objective.completed_count / objective.target_count) * 100
              : 0;

            return (
              <motion.div
                key={objective.id}
                className="rounded-xl border border-border bg-bg-secondary/40 p-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-text-primary">{objective.title}</p>
                    <p className="text-xs text-text-muted">
                      {goal ? `${goal.domain.toUpperCase()} - ${goal.title}` : 'Unlinked goal'}
                    </p>
                  </div>
                  <button
                    onClick={() => void handleAdvanceObjective(objective)}
                    disabled={isMutating || objective.status === 'completed'}
                    className="px-3 py-1 rounded-lg text-xs bg-accent-purple-dark hover:bg-accent-purple-dark/80 text-white disabled:opacity-50"
                  >
                    +1 Progress
                  </button>
                </div>
                <div className="mt-2">
                  <div className="h-2 rounded-full bg-black/30 overflow-hidden">
                    <div className="h-full bg-linear-to-r from-accent-purple to-accent-cyan" style={{ width: `${Math.min(progress, 100)}%` }} />
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                    {objective.completed_count}/{objective.target_count} complete ({objective.status})
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="grid md:grid-cols-[1fr_auto] gap-2">
          <input
            id="weekly-objective-title"
            name="weekly_objective_title"
            value={objectiveTitle}
            onChange={(e) => setObjectiveTitle(e.target.value)}
            placeholder="New weekly objective..."
            className="bg-bg-secondary/60 rounded-lg px-3 py-2 text-sm border border-border focus:outline-none focus:border-accent-purple"
          />
          <div className="flex gap-2">
            <select
              id="weekly-objective-goal"
              name="weekly_objective_goal"
              value={selectedGoalId}
              onChange={(e) => setSelectedGoalId(e.target.value ? Number(e.target.value) : '')}
              className="cyber-select bg-bg-secondary/60 rounded-lg px-3 py-2 text-sm border border-border focus:outline-none focus:border-accent-purple"
            >
              {goals.length === 0 && <option value="">No goals</option>}
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.domain.toUpperCase()} - {goal.title}
                </option>
              ))}
            </select>
            <button
              onClick={() => void handleCreateObjective()}
              disabled={isMutating || objectiveTitle.trim().length === 0 || selectedGoalId === ''}
              className="px-3 py-2 rounded-lg bg-accent-cyan-dark hover:bg-accent-cyan-dark/80 text-white text-sm disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4">
        <h3 className="text-lg font-bold text-text-primary mb-3">Daily Actions ({today})</h3>

        <div className="space-y-2 mb-4">
          {todaysActions.length === 0 && <p className="text-sm text-text-secondary">No actions planned for today.</p>}
          {todaysActions.map((action) => {
            const objective = objectiveMap.get(action.objective_id);
            return (
              <div key={action.id} className="rounded-xl border border-border bg-bg-secondary/40 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-text-primary">{action.title}</p>
                    <p className="text-xs text-text-muted">
                      {objective?.title || 'Objective removed'} - {action.estimated_minutes}m
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {(['pending', 'completed', 'skipped'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => void handleSetActionStatus(action.id, status)}
                        disabled={isMutating}
                        className={`px-2 py-1 rounded text-xs border ${
                          action.status === status
                            ? 'border-accent-purple text-accent-purple'
                            : 'border-border text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {ACTION_STATUS_LABEL[status]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid md:grid-cols-[1fr_auto] gap-2">
          <input
            id="daily-action-title"
            name="daily_action_title"
            value={actionTitle}
            onChange={(e) => setActionTitle(e.target.value)}
            placeholder="New action for today..."
            className="bg-bg-secondary/60 rounded-lg px-3 py-2 text-sm border border-border focus:outline-none focus:border-accent-purple"
          />
          <div className="flex gap-2">
            <select
              id="daily-action-objective"
              name="daily_action_objective"
              value={selectedObjectiveId}
              onChange={(e) => setSelectedObjectiveId(e.target.value ? Number(e.target.value) : '')}
              className="cyber-select bg-bg-secondary/60 rounded-lg px-3 py-2 text-sm border border-border focus:outline-none focus:border-accent-purple"
            >
              {objectives.length === 0 && <option value="">No objectives</option>}
              {objectives.map((objective) => (
                <option key={objective.id} value={objective.id}>
                  {objective.title}
                </option>
              ))}
            </select>
            <button
              onClick={() => void handleCreateAction()}
              disabled={isMutating || actionTitle.trim().length === 0 || selectedObjectiveId === ''}
              className="px-3 py-2 rounded-lg bg-accent-green hover:bg-accent-green/80 text-black text-sm font-semibold disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4">
        <h3 className="text-lg font-bold text-text-primary mb-3">Today Check-in</h3>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <CheckinSelect label="Energy" value={checkin.energy} onChange={(value) => setCheckin((prev) => ({ ...prev, energy: value }))} />
          <CheckinSelect label="Focus" value={checkin.focus} onChange={(value) => setCheckin((prev) => ({ ...prev, focus: value }))} />
          <CheckinSelect label="Mood" value={checkin.mood} onChange={(value) => setCheckin((prev) => ({ ...prev, mood: value }))} />
        </div>
        <button
          onClick={() => void handleSaveCheckin()}
          disabled={isMutating}
          className="px-4 py-2 rounded-lg bg-accent-purple-dark hover:bg-accent-purple-dark/80 text-white text-sm disabled:opacity-50"
        >
          Save Check-in
        </button>
      </div>

      <div className="glass-card rounded-2xl p-4">
        <h3 className="text-lg font-bold text-text-primary mb-3">Goal Setup</h3>
        <div className="grid md:grid-cols-[1fr_auto_auto] gap-2">
          <input
            id="goal-title"
            name="goal_title"
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            placeholder="New goal title..."
            className="bg-bg-secondary/60 rounded-lg px-3 py-2 text-sm border border-border focus:outline-none focus:border-accent-purple"
          />
          <select
            id="goal-domain"
            name="goal_domain"
            value={goalDomain}
            onChange={(e) => setGoalDomain(e.target.value as OutcomeDomain)}
            className="cyber-select bg-bg-secondary/60 rounded-lg px-3 py-2 text-sm border border-border focus:outline-none focus:border-accent-purple"
          >
            {DOMAIN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => void handleCreateGoal()}
            disabled={isMutating || goalTitle.trim().length === 0}
            className="px-3 py-2 rounded-lg bg-accent-purple-dark hover:bg-accent-purple-dark/80 text-white text-sm disabled:opacity-50"
          >
            Add Goal
          </button>
        </div>
      </div>
    </div>
  );
}

interface ScoreMetricProps {
  label: string;
  value: string;
  emphasis?: boolean;
}

function ScoreMetric({ label, value, emphasis = false }: ScoreMetricProps) {
  return (
    <div className="rounded-xl bg-bg-secondary/50 border border-border p-3">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className={emphasis ? 'text-2xl font-bold text-accent-cyan' : 'text-lg font-semibold text-text-primary'}>
        {value}
      </p>
    </div>
  );
}

interface CheckinSelectProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

function CheckinSelect({ label, value, onChange }: CheckinSelectProps) {
  const fieldName = `checkin_${label.toLowerCase()}`;

  return (
    <label className="flex flex-col gap-1 text-xs text-text-muted">
      <span>{label}</span>
      <select
        id={fieldName}
        name={fieldName}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="cyber-select bg-bg-secondary/60 rounded-lg px-2 py-2 text-sm border border-border focus:outline-none focus:border-accent-purple text-text-primary"
      >
        <option value={1}>1</option>
        <option value={2}>2</option>
        <option value={3}>3</option>
        <option value={4}>4</option>
        <option value={5}>5</option>
      </select>
    </label>
  );
}
