import { useGame } from '../store/useGame';
import { EMOJIS } from '../utils/emojis';

export function AnalyticsView() {
  const { state } = useGame();
  const { player } = state;

  const stats = [
    { label: 'Focus Sessions', value: player.activityStats.focusSessions, icon: EMOJIS.FOCUS, color: 'text-accent-purple' },
    { label: 'Habits Completed', value: player.activityStats.habitsCompleted, icon: EMOJIS.HABITS, color: 'text-accent-pink' },
    { label: 'Journal Entries', value: player.activityStats.journalEntries, icon: EMOJIS.JOURNAL, color: 'text-accent-cyan' },
    { label: 'Quests Done', value: player.questsCompleted, icon: EMOJIS.QUESTS, color: 'text-accent-green' },
    { label: 'AI Chats', value: player.activityStats.aiCoachChats || 0, icon: EMOJIS.COACH, color: 'text-accent-yellow' },
    { label: 'Total XP Earned', value: player.totalXPEarned || 0, icon: EMOJIS.STAR, color: 'text-accent-purple' },
  ];

  return (
    <div className="max-w-6xl mx-auto animate-slide-up">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          {EMOJIS.STATS} Analytics
        </h2>
        <p className="text-text-secondary">Track your progress and growth</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map(stat => (
          <div 
            key={stat.label}
            className="bg-bg-card border border-border rounded-2xl p-6 hover:border-border-hover transition-all"
          >
            <div className={`text-3xl mb-3 ${stat.color}`}>{stat.icon}</div>
            <div className="text-3xl font-bold text-text-primary mb-1">{stat.value}</div>
            <div className="text-text-secondary">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Professional Skills */}
      <div className="bg-bg-card border border-border rounded-2xl p-6">
        <h3 className="text-lg font-bold text-text-primary mb-4">
          {EMOJIS.CROWN} Professional Skills
        </h3>
        <div className="space-y-4">
          {Object.entries(player.professionalSkills).map(([key, skill]) => (
            <div key={key} className="flex items-center gap-4">
              <span className="text-2xl">{EMOJIS[key.toUpperCase() as keyof typeof EMOJIS] || EMOJIS.STAR}</span>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-text-primary capitalize">{key}</span>
                  <span className="text-text-secondary">Lv.{skill.level}</span>
                </div>
                <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-linear-to-r from-accent-purple to-accent-cyan transition-all"
                    style={{ width: `${skill.xpToNext ? (skill.xp / skill.xpToNext) * 100 : 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
