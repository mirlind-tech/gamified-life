import { motion, AnimatePresence } from 'framer-motion';
import type { Workout } from '../services/bodyApi';

interface WorkoutHistoryProps {
  workouts: Workout[];
  onSelect?: (workout: Workout) => void;
}

export function WorkoutHistory({ workouts, onSelect }: WorkoutHistoryProps) {
  if (workouts.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <span className="text-4xl mb-4 block">💪</span>
        <h3 className="text-lg font-bold text-text-primary">No Workouts Yet</h3>
        <p className="text-text-muted text-sm mt-2">
          Complete your first Baki workout and start building your legacy.
        </p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return `${diff} days ago`;
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-lg font-bold text-text-primary mb-4">
        💪 Workout History ({workouts.length} total)
      </h3>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {workouts.map((workout, index) => (
            <motion.div
              key={workout.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelect?.(workout)}
              className={`p-4 rounded-xl bg-bg-secondary/30 border border-white/5 transition-all hover:border-accent-purple/50 ${
                onSelect ? 'cursor-pointer' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-bold text-text-primary">{workout.name}</h4>
                  <p className="text-xs text-text-muted">
                    {formatDate(workout.date)} · {getDaysAgo(workout.date)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-accent-green font-bold">
                    {workout.exercises.length}
                  </span>
                  <span className="text-text-muted text-sm ml-1">exercises</span>
                  {workout.duration && (
                    <p className="text-xs text-text-muted">{workout.duration} min</p>
                  )}
                </div>
              </div>

              {/* Exercise summary */}
              <div className="flex flex-wrap gap-2 mt-2">
                {workout.exercises.slice(0, 4).map((exercise, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 rounded bg-black/30 text-text-secondary"
                  >
                    {exercise.name}
                  </span>
                ))}
                {workout.exercises.length > 4 && (
                  <span className="text-xs px-2 py-1 rounded bg-black/30 text-text-muted">
                    +{workout.exercises.length - 4} more
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
