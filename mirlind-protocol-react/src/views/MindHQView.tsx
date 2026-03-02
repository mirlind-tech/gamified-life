import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../store/useGame';
import { EMOJIS } from '../utils/emojis';
import type { ViewType } from '../types';
import { getOutcomeSummary } from '../services/outcomesApi';
import { logger } from '../utils/logger';

interface MindModule {
  view: ViewType;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
}

const MIND_MODULES: MindModule[] = [
  {
    view: 'fangyuan',
    title: 'Fang Yuan Mindset',
    subtitle: 'Strategic identity and ruthless clarity',
    icon: '🦋',
    color: '#8b5cf6',
  },
  {
    view: 'focus',
    title: 'Deep Focus',
    subtitle: 'High-cognitive work blocks and concentration',
    icon: EMOJIS.FOCUS,
    color: '#06b6d4',
  },
  {
    view: 'journal',
    title: 'Inner Journal',
    subtitle: 'Reflection, decisions, and pattern tracking',
    icon: EMOJIS.JOURNAL,
    color: '#10b981',
  },
  {
    view: 'habits',
    title: 'Discipline Habits',
    subtitle: 'Daily rituals that shape identity',
    icon: EMOJIS.HABITS,
    color: '#f59e0b',
  },
  {
    view: 'meditate',
    title: 'Meditation',
    subtitle: 'Attention control and emotional detachment',
    icon: EMOJIS.MEDITATE,
    color: '#14b8a6',
  },
];

function getWeekStartISO(date = new Date()): string {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay();
  const diff = (day + 6) % 7;
  utc.setUTCDate(utc.getUTCDate() - diff);
  return utc.toISOString().slice(0, 10);
}

export function MindHQView() {
  const { setView, state } = useGame();
  const [weeklyMindActions, setWeeklyMindActions] = useState({ done: 0, total: 0 });
  const weekStart = useMemo(() => getWeekStartISO(), []);

  useEffect(() => {
    const load = async () => {
      try {
        const summary = await getOutcomeSummary(weekStart);
        const goalIds = new Set(summary.goals.filter((goal) => goal.domain === 'mind').map((goal) => goal.id));
        const objectiveIds = new Set(
          summary.objectives.filter((objective) => goalIds.has(objective.goal_id)).map((objective) => objective.id)
        );
        const actions = summary.actions.filter((action) => objectiveIds.has(action.objective_id));
        setWeeklyMindActions({
          done: actions.filter((action) => action.status === 'completed').length,
          total: actions.length,
        });
      } catch (error) {
        logger.error('Failed loading mind outcome metrics:', error);
      }
    };
    void load();
  }, [weekStart]);

  return (
    <div className="max-w-6xl mx-auto animate-slide-up pb-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          {EMOJIS.BRAIN} Mind HQ
        </h2>
        <p className="text-text-secondary">
          Build clarity, memory, cognitive sharpness, and Fang Yuan-level strategic thinking.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Focus Sessions" value={String(state.player.activityStats.focusSessions || 0)} />
        <StatCard label="Mind Actions" value={`${weeklyMindActions.done}/${weeklyMindActions.total}`} />
        <StatCard label="Discipline Stat" value={String(Math.round(state.player.coreStats.discipline || 0))} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MIND_MODULES.map((module, index) => (
          <motion.button
            key={module.view}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setView(module.view)}
            className="glass-card rounded-2xl p-5 text-left border border-border hover:border-white/15 transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{module.icon}</span>
              <h3 className="text-lg font-semibold" style={{ color: module.color }}>
                {module.title}
              </h3>
            </div>
            <p className="text-text-secondary text-sm">{module.subtitle}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
    </div>
  );
}
