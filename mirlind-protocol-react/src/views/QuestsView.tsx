import { useState, useEffect, useRef } from 'react';
import type { Quest } from '../types';
import { getQuests, completeQuest, getTimeUntilReset } from '../data/quests';
import { EMOJIS } from '../utils/emojis';
import { useGame } from '../store/useGame';

export function QuestsView() {
  const [quests, setQuests] = useState<Quest[]>(() => getQuests());
  const [timeUntilReset, setTimeUntilReset] = useState(() => getTimeUntilReset());
  const { showToast, trackActivity } = useGame();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeUntilReset(getTimeUntilReset());
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleComplete = (questId: string) => {
    const result = completeQuest(questId);
    if (result) {
      setQuests(getQuests());
      trackActivity('focusSessions', 1);
      trackActivity('questsCompleted', 1);
      showToast(
        `${EMOJIS.CHECK} ${result.name} completed! +${result.xpReward} XP`,
        'success',
        3000
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            {EMOJIS.QUESTS} Daily Quests
          </h2>
          <p className="text-text-secondary">Complete daily challenges to earn XP</p>
        </div>
        <div className="px-4 py-2 bg-accent-purple/20 border border-accent-purple/30 rounded-lg text-accent-purple font-semibold">
          Resets in: {timeUntilReset}
        </div>
      </div>

      <div className="space-y-3">
        {quests.map(quest => (
          <div 
            key={quest.id}
            className={`
              flex items-center gap-4 p-4 bg-bg-card border rounded-xl transition-all
              ${quest.completed 
                ? 'border-accent-green/30 opacity-60' 
                : 'border-border hover:border-border-hover'
              }
            `}
          >
            <div className="text-3xl">{quest.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold truncate ${quest.completed ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                  {quest.name}
                </h3>
                {quest.time && (
                  <span className="text-xs px-2 py-0.5 bg-bg-hover rounded text-text-secondary">
                    {quest.time}
                  </span>
                )}
              </div>
              <p className="text-sm text-text-secondary truncate">{quest.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-accent-purple/20 text-accent-purple">
                +{quest.xpReward} XP
              </span>
              <button
                onClick={() => handleComplete(quest.id)}
                disabled={quest.completed}
                className={`
                  px-4 py-2 rounded-lg font-semibold transition-all
                  ${quest.completed
                    ? 'bg-accent-green text-white cursor-default'
                    : 'bg-accent-purple hover:bg-accent-purple/80 text-white'
                  }
                `}
              >
                {quest.completed ? EMOJIS.CHECK : 'Complete'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
