import { motion } from 'framer-motion';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementBadgeProps {
  achievement: Achievement;
  isNew?: boolean;
}

const rarityColors = {
  common: 'from-gray-400 to-gray-600 border-gray-400',
  rare: 'from-accent-cyan to-accent-blue border-accent-cyan',
  epic: 'from-accent-purple to-accent-pink border-accent-purple',
  legendary: 'from-accent-yellow to-orange-500 border-accent-yellow',
};

const rarityGlow = {
  common: '',
  rare: 'shadow-accent-cyan/30',
  epic: 'shadow-accent-purple/30',
  legendary: 'shadow-accent-yellow/30',
};

export function AchievementBadge({ achievement, isNew }: AchievementBadgeProps) {
  const isUnlocked = !!achievement.unlockedAt;

  return (
    <motion.div
      initial={isNew ? { scale: 0, rotate: -180 } : { opacity: 0, y: 20 }}
      animate={{ scale: 1, rotate: 0, opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 12 }}
      className={`relative group ${isNew ? 'z-10' : ''}`}
    >
      <div
        className={`glass-card rounded-2xl p-4 border-2 transition-all duration-300 ${
          isUnlocked
            ? `bg-linear-to-br ${rarityColors[achievement.rarity]} bg-opacity-10 border-opacity-50 shadow-lg ${rarityGlow[achievement.rarity]}`
            : 'border-white/10 opacity-50 grayscale'
        } ${isNew ? 'ring-4 ring-accent-yellow/50 animate-pulse' : ''}`}
      >
        {/* Shine effect for new unlocks */}
        {isNew && (
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent animate-shimmer rounded-2xl" />
        )}

        <div className="flex items-center gap-4">
          <div
            className={`text-4xl p-3 rounded-xl ${
              isUnlocked ? 'bg-black/30' : 'bg-black/10'
            }`}
          >
            {achievement.icon}
          </div>
          
          <div className="flex-1">
            <h4 className={`font-bold ${isUnlocked ? 'text-text-primary' : 'text-text-muted'}`}>
              {achievement.name}
            </h4>
            <p className="text-sm text-text-secondary">{achievement.description}</p>
            {achievement.unlockedAt && (
              <p className="text-xs text-text-muted mt-1">
                Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Rarity indicator */}
          {isUnlocked && (
            <div
              className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded bg-linear-to-r ${
                rarityColors[achievement.rarity]
              } bg-opacity-20 text-white`}
            >
              {achievement.rarity}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface AchievementsListProps {
  achievements: Achievement[];
  newUnlocks?: string[];
}

export function AchievementsList({ achievements, newUnlocks = [] }: AchievementsListProps) {
  return (
    <div className="space-y-3">
      {achievements.map((achievement) => (
        <AchievementBadge
          key={achievement.id}
          achievement={achievement}
          isNew={newUnlocks.includes(achievement.id)}
        />
      ))}
    </div>
  );
}
