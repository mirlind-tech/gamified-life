import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../store/useGame';
import { logger } from '../utils/logger';
import {
  getWeeklyPlan,
  saveWeeklyPlan,
  type PlanObjectiveInput,
  type WeeklyPlanResponse,
} from '../services/weeklyApi';

interface DraftObjective extends PlanObjectiveInput {
  id: string;
}

const DOMAIN_OPTION_STYLE = {
  backgroundColor: '#0f172a',
  color: '#f8fafc',
};

function getWeekStartISO(date = new Date()): string {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay();
  const diff = (day + 6) % 7;
  utc.setUTCDate(utc.getUTCDate() - diff);
  return utc.toISOString().slice(0, 10);
}

function createDraftObjective(): DraftObjective {
  return {
    id: Math.random().toString(36).slice(2),
    domain: 'career',
    goalTitle: '',
    title: '',
    dailyActionTitle: '',
    targetCount: 5,
    estimatedMinutes: 45,
    days: [1, 2, 3, 4, 5],
  };
}

function getDraftFieldId(draftId: string, field: string): string {
  return `weekly-plan-${draftId}-${field}`;
}

const DAY_OPTIONS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' },
];

export function WeeklyPlanView() {
  const { setView, showToast } = useGame();
  const weekStart = useMemo(() => getWeekStartISO(), []);
  const [plan, setPlan] = useState<WeeklyPlanResponse | null>(null);
  const [drafts, setDrafts] = useState<DraftObjective[]>([createDraftObjective()]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadPlan = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getWeeklyPlan(weekStart);
      setPlan(response);
    } catch (error) {
      logger.error('Failed to load weekly plan:', error);
      showToast('Failed to load weekly plan', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast, weekStart]);

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  const setDraftField = <K extends keyof DraftObjective>(
    id: string,
    key: K,
    value: DraftObjective[K]
  ) => {
    setDrafts((prev) =>
      prev.map((draft) => (draft.id === id ? { ...draft, [key]: value } : draft))
    );
  };

  const toggleDay = (id: string, day: number) => {
    setDrafts((prev) =>
      prev.map((draft) => {
        if (draft.id !== id) return draft;
        const currentDays = draft.days || [];
        const nextDays = currentDays.includes(day)
          ? currentDays.filter((d) => d !== day)
          : [...currentDays, day];
        return { ...draft, days: nextDays.sort((a, b) => a - b) };
      })
    );
  };

  const addDraft = () => setDrafts((prev) => [...prev, createDraftObjective()]);
  const removeDraft = (id: string) => setDrafts((prev) => prev.filter((draft) => draft.id !== id));

  const handleSavePlan = async () => {
    const objectives = drafts
      .map((draft) => ({
        domain: draft.domain,
        goalTitle: draft.goalTitle?.trim() || undefined,
        title: draft.title.trim(),
        description: draft.description?.trim() || undefined,
        targetCount: draft.targetCount,
        dailyActionTitle: draft.dailyActionTitle?.trim() || undefined,
        estimatedMinutes: draft.estimatedMinutes,
        days: draft.days,
      }))
      .filter((objective) => objective.title.length > 0);

    if (objectives.length === 0) {
      showToast('Add at least one objective title', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      await saveWeeklyPlan({ weekStart, objectives });
      showToast('Weekly plan saved', 'success');
      setDrafts([createDraftObjective()]);
      await loadPlan();
    } catch (error) {
      logger.error('Failed to save weekly plan:', error);
      showToast('Could not save weekly plan', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-8 space-y-5">
      <div className="glass-card rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Weekly Planning</h2>
          <p className="text-sm text-text-secondary">
            Plan objectives and daily actions for week starting <span className="font-mono">{weekStart}</span>.
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
            onClick={() => setView('weekly-review')}
            className="px-3 py-2 rounded-lg bg-accent-purple-dark text-white hover:bg-accent-purple-dark/80"
          >
            Go To Weekly Review
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-text-primary">Plan Builder</h3>
          <button
            onClick={addDraft}
            className="px-3 py-1 text-sm rounded-lg border border-border bg-bg-secondary/40 hover:bg-bg-hover text-text-secondary hover:text-text-primary"
          >
            + Objective
          </button>
        </div>

        <div className="space-y-4">
          {drafts.map((draft, index) => (
            <motion.div
              key={draft.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-bg-secondary/30 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-text-primary">Objective {index + 1}</p>
                {drafts.length > 1 && (
                  <button
                    onClick={() => removeDraft(draft.id)}
                    className="text-xs px-2 py-1 rounded border border-red-400/40 text-red-300 hover:bg-red-500/10"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <label className="text-xs text-text-muted">
                  Domain
                  <select
                    id={getDraftFieldId(draft.id, 'domain')}
                    name={`draft_${draft.id}_domain`}
                    value={draft.domain}
                    onChange={(e) => setDraftField(draft.id, 'domain', e.target.value as DraftObjective['domain'])}
                    className="cyber-select mt-1 w-full px-3 py-2 rounded-lg text-sm text-slate-100"
                  >
                    <option value="career" style={DOMAIN_OPTION_STYLE}>Career</option>
                    <option value="body" style={DOMAIN_OPTION_STYLE}>Body</option>
                    <option value="mind" style={DOMAIN_OPTION_STYLE}>Mind</option>
                    <option value="finance" style={DOMAIN_OPTION_STYLE}>Finance</option>
                    <option value="german" style={DOMAIN_OPTION_STYLE}>German</option>
                    <option value="custom" style={DOMAIN_OPTION_STYLE}>Custom</option>
                  </select>
                </label>

                <label className="text-xs text-text-muted">
                  Goal Title
                  <input
                    id={getDraftFieldId(draft.id, 'goal-title')}
                    name={`draft_${draft.id}_goal_title`}
                    value={draft.goalTitle || ''}
                    onChange={(e) => setDraftField(draft.id, 'goalTitle', e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-black/30 border border-border text-sm text-text-primary"
                    placeholder="Optional. Creates goal if needed."
                  />
                </label>
              </div>

              <label className="text-xs text-text-muted block">
                Weekly Objective
                <input
                  id={getDraftFieldId(draft.id, 'weekly-objective')}
                  name={`draft_${draft.id}_weekly_objective`}
                  value={draft.title}
                  onChange={(e) => setDraftField(draft.id, 'title', e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-black/30 border border-border text-sm text-text-primary"
                  placeholder="What outcome will be advanced this week?"
                />
              </label>

              <div className="grid md:grid-cols-3 gap-3">
                <label className="text-xs text-text-muted">
                  Daily Action
                  <input
                    id={getDraftFieldId(draft.id, 'daily-action')}
                    name={`draft_${draft.id}_daily_action`}
                    value={draft.dailyActionTitle || ''}
                    onChange={(e) => setDraftField(draft.id, 'dailyActionTitle', e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-black/30 border border-border text-sm text-text-primary"
                    placeholder="Task title for action list"
                  />
                </label>
                <label className="text-xs text-text-muted">
                  Target Count
                  <input
                    id={getDraftFieldId(draft.id, 'target-count')}
                    name={`draft_${draft.id}_target_count`}
                    type="number"
                    min={1}
                    max={14}
                    value={draft.targetCount ?? 5}
                    onChange={(e) => setDraftField(draft.id, 'targetCount', Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-black/30 border border-border text-sm text-text-primary"
                  />
                </label>
                <label className="text-xs text-text-muted">
                  Minutes
                  <input
                    id={getDraftFieldId(draft.id, 'minutes')}
                    name={`draft_${draft.id}_minutes`}
                    type="number"
                    min={10}
                    max={240}
                    value={draft.estimatedMinutes ?? 45}
                    onChange={(e) => setDraftField(draft.id, 'estimatedMinutes', Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-black/30 border border-border text-sm text-text-primary"
                  />
                </label>
              </div>

              <div>
                <p className="text-xs text-text-muted mb-2">Action Days</p>
                <div className="flex flex-wrap gap-2">
                  {DAY_OPTIONS.map((day) => {
                    const selected = (draft.days || []).includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(draft.id, day.value)}
                        className={`px-2 py-1 rounded-lg text-xs border ${
                          selected
                            ? 'border-accent-purple/60 bg-accent-purple/20 text-accent-purple'
                            : 'border-border text-text-secondary'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSavePlan}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-accent-green text-black font-semibold disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save Weekly Plan'}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-text-primary mb-3">Existing Objectives</h3>
          {isLoading && <p className="text-sm text-text-secondary">Loading...</p>}
          {!isLoading && plan?.objectives.length === 0 && (
            <p className="text-sm text-text-secondary">No objectives planned yet.</p>
          )}
          <div className="space-y-2">
            {plan?.objectives.map((objective) => (
              <div key={objective.id} className="rounded-lg border border-border bg-bg-secondary/20 p-3">
                <p className="font-semibold text-text-primary">{objective.title}</p>
                <p className="text-xs text-text-muted">
                  {objective.completed_count}/{objective.target_count} complete
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-text-primary mb-3">Planner Hints</h3>
          <div className="space-y-2">
            {(plan?.hints || []).map((hint) => (
              <p key={hint} className="text-sm text-text-secondary">
                - {hint}
              </p>
            ))}
            {!plan?.hints?.length && (
              <p className="text-sm text-text-secondary">
                Keep scope tight: fewer objectives, daily consistency, measurable outputs.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
