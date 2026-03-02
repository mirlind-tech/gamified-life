import { useEffect, useMemo, useState } from 'react';
import { useGame } from '../store/useGame';
import { getLatestMeasurement, getWorkouts, type BodyMeasurement, type Workout } from '../services/bodyApi';
import { getOutcomeSummary } from '../services/outcomesApi';
import { logger } from '../utils/logger';

function getWeekStartISO(date = new Date()): string {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay();
  const diff = (day + 6) % 7;
  utc.setUTCDate(utc.getUTCDate() - diff);
  return utc.toISOString().slice(0, 10);
}

export function BodyHQView() {
  const { setView, showToast } = useGame();
  const [measurement, setMeasurement] = useState<BodyMeasurement | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [weeklyActions, setWeeklyActions] = useState({ done: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const weekStart = useMemo(() => getWeekStartISO(), []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [latest, workoutData, summary] = await Promise.all([
          getLatestMeasurement(),
          getWorkouts(),
          getOutcomeSummary(weekStart),
        ]);
        setMeasurement(latest.measurement || null);
        setWorkouts(workoutData.workouts);

        const bodyGoalIds = new Set(summary.goals.filter((goal) => goal.domain === 'body').map((goal) => goal.id));
        const bodyObjectiveIds = new Set(
          summary.objectives.filter((objective) => bodyGoalIds.has(objective.goal_id)).map((objective) => objective.id)
        );
        const bodyActions = summary.actions.filter((action) => bodyObjectiveIds.has(action.objective_id));
        setWeeklyActions({
          total: bodyActions.length,
          done: bodyActions.filter((action) => action.status === 'completed').length,
        });
      } catch (error) {
        logger.error('Failed loading Body HQ:', error);
        showToast('Failed to load Body HQ', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [showToast, weekStart]);

  const latestWorkouts = workouts.slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto pb-8 space-y-5">
      <div className="glass-card rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Body HQ</h2>
          <p className="text-sm text-text-secondary">Strength, physique, recovery, and movement progression.</p>
        </div>
        <button
          onClick={() => setView('command')}
          className="px-3 py-2 rounded-lg border border-border bg-bg-secondary/40 text-text-secondary hover:text-text-primary"
        >
          Command Center
        </button>
      </div>

      {isLoading ? (
        <div className="glass-card rounded-2xl p-5 text-sm text-text-secondary">Loading body progress...</div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-4">
            <StatCard label="Weight" value={measurement?.weight ? `${measurement.weight} kg` : '--'} />
            <StatCard label="Biceps" value={measurement?.biceps ? `${measurement.biceps} cm` : '--'} />
            <StatCard
              label="Weekly Body Actions"
              value={`${weeklyActions.done}/${weeklyActions.total}`}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-2">Current Milestones</h3>
              <MilestoneItem
                label="4 weekly strength sessions"
                done={weeklyActions.done >= 4}
              />
              <MilestoneItem
                label="Biceps 30cm checkpoint"
                done={(measurement?.biceps || 0) >= 30}
              />
              <MilestoneItem
                label="Waist control under 80cm"
                done={measurement?.waist ? measurement.waist <= 80 : false}
              />
            </div>

            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-2">Recent Workouts</h3>
              <div className="space-y-2">
                {latestWorkouts.length === 0 && (
                  <p className="text-sm text-text-secondary">No workouts logged yet.</p>
                )}
                {latestWorkouts.map((workout) => (
                  <div key={workout.id ?? `${workout.date}-${workout.name}`} className="rounded-lg border border-border p-3 bg-bg-secondary/25">
                    <p className="font-semibold text-text-primary">{workout.name}</p>
                    <p className="text-xs text-text-muted">{workout.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
    </div>
  );
}

function MilestoneItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className={done ? 'text-accent-green' : 'text-text-muted'}>{done ? 'Done' : 'In progress'}</span>
    </div>
  );
}
