import { useGame } from '../store/useGame';
import { getStatTrainingOptions, getStatDecayStatus, ACTIVITY_STAT_GAINS } from '../utils/willpower';
import { STAT_DECAY_DAYS } from '../types';
import { motion } from 'framer-motion';

export function StatTrainingGuide() {
  const { state } = useGame();
  const { player } = state;

  const stats = [
    { key: 'strength', name: 'Strength', icon: '💪', desc: 'Physical power and muscle' },
    { key: 'agility', name: 'Agility', icon: '⚡', desc: 'Speed, reflexes, coordination' },
    { key: 'constitution', name: 'Constitution', icon: '🫀', desc: 'Health, endurance, stamina' },
    { key: 'intelligence', name: 'Intelligence', icon: '🧠', desc: 'Mental capacity, problem solving' },
    { key: 'wisdom', name: 'Wisdom', icon: '📿', desc: 'Decision making, insight' },
    { key: 'charisma', name: 'Charisma', icon: '🗣️', desc: 'Social skills, influence' },
    { key: 'discipline', name: 'Discipline', icon: '⛓️', desc: 'Willpower, self-control' },
    { key: 'creativity', name: 'Creativity', icon: '🎨', desc: 'Innovation, imagination' },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-xl font-bold text-text-primary mb-2">Stat Training Guide</h2>
        <p className="text-text-secondary text-sm mb-4">
          Stats increase through activities and decrease if neglected. 
          Use them or lose them!
        </p>

        <div className="grid gap-4">
          {stats.map((stat) => {
            const currentValue = player.coreStats[stat.key];
            const gracePeriod = STAT_DECAY_DAYS[stat.key];
            const lastUsed = player.statLastUsed[stat.key];
            const daysSinceUsed = Math.floor(
              (new Date().getTime() - new Date(lastUsed).getTime()) / (1000 * 60 * 60 * 24)
            );
            const decayStatus = getStatDecayStatus(daysSinceUsed, gracePeriod);
            const trainingOptions = getStatTrainingOptions(stat.key).slice(0, 3);

            const statusColors = {
              healthy: 'bg-green-500/20 text-green-500 border-green-500/30',
              warning: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
              critical: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
              atrophying: 'bg-red-500/20 text-red-500 border-red-500/30',
            };

            return (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl border border-white/10 bg-white/5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{stat.icon}</span>
                    <div>
                      <h3 className="font-bold text-text-primary">{stat.name}</h3>
                      <p className="text-xs text-text-muted">{stat.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[decayStatus]}`}>
                      {decayStatus.toUpperCase()}
                    </span>
                    <span className="text-xl font-bold text-text-primary font-mono">
                      {currentValue.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Decay Info */}
                <div className="flex items-center gap-4 text-xs text-text-muted mb-3">
                  <span>Grace period: {gracePeriod} days</span>
                  <span>•</span>
                  <span>Last used: {daysSinceUsed} days ago</span>
                  <span>•</span>
                  <span>Decay: 5% per day after grace</span>
                </div>

                {/* Training Options */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Best Ways to Train
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {trainingOptions.map((option) => (
                      <span
                        key={option.activity}
                        className="text-xs px-2 py-1 rounded bg-accent-purple/20 text-accent-purple"
                      >
                        {option.activity} (+{option.gain.toFixed(2)})
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Activity Quick Reference */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-bold text-text-primary mb-4">Activity Rewards</h3>
        <div className="grid gap-3">
          {Object.entries(ACTIVITY_STAT_GAINS).map(([key, data]) => (
            <div
              key={key}
              className="flex items-center justify-between p-3 rounded-lg bg-white/5"
            >
              <span className="font-medium text-text-primary">{data.activity}</span>
              <div className="flex gap-2">
                {data.stats.map((s) => (
                  <span
                    key={s.stat}
                    className="text-xs px-2 py-1 rounded bg-white/10 text-text-secondary"
                  >
                    {s.stat} +{s.amount}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
