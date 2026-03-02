import { EMOJIS } from '../utils/emojis';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const ACHIEVEMENTS: Achievement[] = [
  { id: '1', name: 'Early Bird', description: 'Wake up at 5 AM', icon: EMOJIS.WAKE_UP, unlocked: true, rarity: 'common' },
  { id: '2', name: 'Cold Warrior', description: 'Complete 7 cold showers', icon: EMOJIS.COLD_SHOWER, unlocked: true, rarity: 'common' },
  { id: '3', name: 'Polyglot', description: 'Study German for 30 days', icon: EMOJIS.GERMAN, unlocked: false, rarity: 'rare' },
  { id: '4', name: 'Deep Worker', description: 'Complete 50 focus sessions', icon: EMOJIS.FOCUS, unlocked: false, rarity: 'epic' },
  { id: '5', name: 'Iron Discipline', description: '30-day streak on any habit', icon: EMOJIS.FIRE, unlocked: false, rarity: 'legendary' },
  { id: '6', name: 'Master Coder', description: 'Reach level 20 in Craft', icon: EMOJIS.CODING, unlocked: false, rarity: 'epic' },
];

const rarityColors = {
  common: 'border-gray-500 bg-gray-500/10',
  rare: 'border-accent-cyan bg-accent-cyan/10',
  epic: 'border-accent-purple bg-accent-purple/10',
  legendary: 'border-accent-yellow bg-accent-yellow/10',
};

export function AchievementsView() {
  const unlockedCount = ACHIEVEMENTS.filter(a => a.unlocked).length;

  return (
    <div className="max-w-6xl mx-auto animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            {EMOJIS.TROPHY} Achievements
          </h2>
          <p className="text-text-secondary">Collect badges by completing challenges</p>
        </div>
        <div className="px-4 py-2 bg-bg-card border border-border rounded-xl">
          <span className="text-text-primary font-semibold">{unlockedCount}</span>
          <span className="text-text-secondary"> / {ACHIEVEMENTS.length} unlocked</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {ACHIEVEMENTS.map(achievement => (
          <div 
            key={achievement.id}
            className={`
              relative p-6 rounded-2xl border-2 transition-all
              ${achievement.unlocked 
                ? rarityColors[achievement.rarity]
                : 'bg-black/20 border-border'
              }
            `}
          >
            <div className={`flex items-start gap-4 ${!achievement.unlocked ? 'grayscale' : ''}`}>
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-4xl bg-black/30">
                {achievement.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`
                    text-xs px-2 py-0.5 rounded-full uppercase font-bold
                    ${achievement.unlocked 
                      ? 'bg-white/20 text-white' 
                      : 'bg-text-secondary/30 text-text-secondary'
                    }
                  `}>
                    {achievement.rarity}
                  </span>
                  {achievement.unlocked && (
                    <span className="text-accent-green-dark text-sm">{EMOJIS.CHECK}</span>
                  )}
                </div>
                <h3 className={`text-lg font-bold mb-1 ${achievement.unlocked ? 'text-text-primary' : 'text-text-secondary'}`}>
                  {achievement.name}
                </h3>
                <p className="text-sm text-text-secondary">{achievement.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
