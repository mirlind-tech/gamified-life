import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EMOJIS } from '../utils/emojis';
import { useGame } from '../store/useGame';
import {
  getDailyChallenges,
  completeChallenge,
  getChallengeProgress,
  getDifficultyLabel,
  getDifficultyColor,
  getChallengeTypeIcon,
  getChallengeTypeLabel,
  initializeChallenges,
  SPECIAL_CHALLENGES,
  getActiveSpecialChallenges,
  startSpecialChallenge,
  completeSpecialChallengeDay,
  type Challenge,
  type SpecialChallenge,
} from '../data/challenges';

export function ChallengesView() {
  const { showToast, addXP, trackActivity } = useGame();
  const [activeTab, setActiveTab] = useState<'daily' | 'special'>('daily');
  
  // Daily challenges state
  initializeChallenges();
  const challenges = getDailyChallenges();
  const [completedToday, setCompletedToday] = useState<string[]>(() => {
    const progress = getChallengeProgress();
    return progress.completedToday;
  });
  const [streak, setStreak] = useState(() => {
    const progress = getChallengeProgress();
    return progress.streak;
  });
  const [showConfetti, setShowConfetti] = useState(false);

  // Special challenges state
  const [specialChallenges, setSpecialChallenges] = useState(() => getActiveSpecialChallenges());
  const [selectedSpecial, setSelectedSpecial] = useState<SpecialChallenge | null>(null);

  const handleComplete = async (challenge: Challenge) => {
    if (completedToday.includes(challenge.id)) return;

    const result = completeChallenge(challenge.id);
    setCompletedToday(prev => [...prev, challenge.id]);
    setStreak(result.newStreak);

    // Award XP
    await addXP(result.xp, challenge.type === 'physical' ? 'vessel' : 'principle');
    await trackActivity('questsCompleted', 1);

    // Show celebration
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);

    // Toast message
    const author = result.isFangYuan ? '🧠 Fang Yuan' : '💪 Baki Hanma';
    showToast(
      `${challenge.icon} Challenge Complete! +${result.xp} XP (${author})`,
      'success',
      4000
    );
  };

  const handleStartSpecial = (challenge: SpecialChallenge) => {
    const started = startSpecialChallenge(challenge.id);
    if (started) {
      setSpecialChallenges(getActiveSpecialChallenges());
      showToast(`🔥 ${challenge.title} started! Day 1 begins now.`, 'success', 4000);
    } else {
      showToast('⚠️ Challenge already active', 'error', 3000);
    }
  };

  const handleCompleteSpecialDay = (challengeId: string, dayIndex: number) => {
    const result = completeSpecialChallengeDay(challengeId, dayIndex);
    setSpecialChallenges(getActiveSpecialChallenges());
    
    if (result.completed) {
      addXP(result.totalReward, 'principle');
      showToast(`🏆 Challenge Complete! +${result.totalReward} XP`, 'success', 5000);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    } else {
      showToast('✅ Day completed! Keep the streak alive.', 'success', 3000);
    }
  };

  const getProgressPercentage = () => {
    return Math.round((completedToday.length / challenges.length) * 100);
  };

  return (
    <div className="max-w-5xl mx-auto animate-slide-up pb-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{EMOJIS.CHALLENGE}</span>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Challenges</h2>
            <p className="text-text-secondary text-sm">
              Daily battles and epic quests. Push your limits.
            </p>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
            activeTab === 'daily'
              ? 'bg-accent-purple text-white'
              : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
          }`}
        >
          📅 Daily Challenges ({completedToday.length}/{challenges.length})
        </button>
        <button
          onClick={() => setActiveTab('special')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
            activeTab === 'special'
              ? 'bg-accent-purple text-white'
              : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
          }`}
        >
          🔥 Special Challenges ({specialChallenges.length} active)
        </button>
      </div>

      {activeTab === 'daily' ? (
        <DailyChallengesTab
          challenges={challenges}
          completedToday={completedToday}
          streak={streak}
          getProgressPercentage={getProgressPercentage}
          onComplete={handleComplete}
        />
      ) : (
        <SpecialChallengesTab
          specialChallenges={specialChallenges}
          availableChallenges={SPECIAL_CHALLENGES.filter(
            sc => !specialChallenges.some(ac => ac.challenge.id === sc.id)
          )}
          onStart={handleStartSpecial}
          onCompleteDay={handleCompleteSpecialDay}
        />
      )}

      {/* Confetti Effect */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
          >
            <div className="text-6xl animate-bounce">
              {EMOJIS.PARTY}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Daily Challenges Component
function DailyChallengesTab({
  challenges,
  completedToday,
  streak,
  getProgressPercentage,
  onComplete,
}: {
  challenges: Challenge[];
  completedToday: string[];
  streak: number;
  getProgressPercentage: () => number;
  onComplete: (c: Challenge) => void;
}) {
  return (
    <>
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-xl p-4 text-center"
        >
          <div className="text-2xl mb-1">{EMOJIS.TARGET}</div>
          <div className="text-2xl font-bold text-accent-cyan">{getProgressPercentage()}%</div>
          <div className="text-text-muted text-xs">Daily Progress</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-4 text-center"
        >
          <div className="text-2xl mb-1">{EMOJIS.FIRE}</div>
          <div className="text-2xl font-bold text-accent-yellow">{streak}</div>
          <div className="text-text-muted text-xs">Day Streak</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-4 text-center"
        >
          <div className="text-2xl mb-1">{EMOJIS.CHECK_CIRCLE}</div>
          <div className="text-2xl font-bold text-accent-green">
            {completedToday.length}/{challenges.length}
          </div>
          <div className="text-text-muted text-xs">Completed</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl p-4 text-center"
        >
          <div className="text-2xl mb-1">{EMOJIS.GEM}</div>
          <div className="text-2xl font-bold text-accent-purple">
            {completedToday.reduce((sum, id) => {
              const c = challenges.find(ch => ch.id === id);
              return sum + (c?.xpReward || 0);
            }, 0)}
          </div>
          <div className="text-text-muted text-xs">XP Earned</div>
        </motion.div>
      </div>

      {/* Challenges Grid */}
      <div className="grid gap-4">
        {challenges.map((challenge, index) => {
          const isCompleted = completedToday.includes(challenge.id);
          const difficultyColor = getDifficultyColor(challenge.difficulty);
          
          return (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                glass-card border-2 rounded-2xl p-5 transition-all
                ${isCompleted 
                  ? 'border-green-500/50 bg-green-500/5' 
                  : 'border-white/10 hover:border-accent-purple/50'
                }
              `}
            >
              <div className="flex items-start gap-4">
                <div className={`
                  w-14 h-14 rounded-xl flex items-center justify-center text-2xl
                  ${isCompleted ? 'bg-green-500/20' : 'bg-accent-purple/20'}
                `}>
                  {isCompleted ? EMOJIS.CHECK : challenge.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className={`font-bold ${isCompleted ? 'text-green-500 line-through' : 'text-text-primary'}`}>
                      {challenge.title}
                    </h3>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: `${difficultyColor}30`, color: difficultyColor }}
                    >
                      {getDifficultyLabel(challenge.difficulty)}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-black/30 text-text-muted">
                      {getChallengeTypeIcon(challenge.type)} {getChallengeTypeLabel(challenge.type)}
                    </span>
                  </div>
                  
                  <p className={`text-sm mb-3 ${isCompleted ? 'text-text-muted line-through' : 'text-text-secondary'}`}>
                    {challenge.description}
                  </p>

                  <div className="flex items-start gap-2 text-xs italic text-text-muted">
                    <span>{challenge.author === 'Fang Yuan' ? '🧠' : '💪'}</span>
                    <span>&quot;{challenge.quote}&quot;</span>
                    <span className="text-accent-purple">— {challenge.author}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-lg font-bold ${isCompleted ? 'text-green-500' : 'text-accent-yellow'}`}>
                    +{challenge.xpReward} XP
                  </div>
                  {isCompleted && (
                    <div className="text-xs text-green-500 mt-1">Completed!</div>
                  )}
                </div>
              </div>

              {!isCompleted && (
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete(challenge);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-4 w-full py-2.5 bg-accent-purple hover:bg-accent-purple/80 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {EMOJIS.CHECK} Complete Challenge
                </motion.button>
              )}
            </motion.div>
          );
        })}
      </div>
    </>
  );
}

// Special Challenges Component
function SpecialChallengesTab({
  specialChallenges,
  availableChallenges,
  onStart,
  onCompleteDay,
}: {
  specialChallenges: { challenge: SpecialChallenge; progress: number; day: number; completed: boolean }[];
  availableChallenges: SpecialChallenge[];
  onStart: (c: SpecialChallenge) => void;
  onCompleteDay: (id: string, day: number) => void;
}) {
  return (
    <>
      {/* Active Special Challenges */}
      {specialChallenges.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <span>🔥</span> Active Quests
          </h3>
          <div className="grid gap-4">
            {specialChallenges.map(({ challenge, progress, day, completed }) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`
                  glass-card border-2 rounded-2xl p-6
                  ${completed ? 'border-green-500/50 bg-green-500/5' : 'border-accent-orange/30'}
                `}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-4xl">{challenge.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-text-primary">{challenge.title}</h3>
                    <p className="text-text-secondary text-sm mt-1">{challenge.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-accent-yellow font-bold">Day {day}/{challenge.duration}</span>
                      <span className="text-accent-purple font-bold">+{challenge.xpReward} XP</span>
                      <span className="text-text-muted">{getDifficultyLabel(challenge.difficulty)}</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-text-muted mb-1">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-3 bg-black/30 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-linear-to-r from-accent-orange to-accent-red rounded-full"
                    />
                  </div>
                </div>

                {/* Daily Requirements */}
                <div className="bg-black/20 rounded-xl p-4 mb-4">
                  <h4 className="text-sm font-semibold text-text-primary mb-2">Today&apos;s Tasks:</h4>
                  <ul className="space-y-1">
                    {challenge.dailyTasks.map((task, idx) => (
                      <li key={idx} className="text-sm text-text-secondary flex items-center gap-2">
                        <span className="text-accent-cyan">•</span> {task}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Quote */}
                <div className="text-xs italic text-text-muted mb-4">
                  &quot;{challenge.quote}&quot; — {challenge.author}
                </div>

                {/* Complete Day Button */}
                {!completed && (
                  <button
                    onClick={() => onCompleteDay(challenge.id, day - 1)}
                    className="w-full py-3 bg-accent-orange hover:bg-accent-orange/80 text-white font-semibold rounded-lg transition-colors"
                  >
                    ✅ Complete Day {day}
                  </button>
                )}

                {completed && (
                  <div className="text-center text-green-500 font-bold">
                    🏆 CHALLENGE COMPLETED!
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Available Special Challenges */}
      <div>
        <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <span>⚔️</span> Available Quests
        </h3>
        <div className="grid gap-4">
          {availableChallenges.map((challenge) => (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card border border-white/10 rounded-2xl p-5 hover:border-accent-purple/30 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">{challenge.icon}</div>
                <div className="flex-1">
                  <h3 className="font-bold text-text-primary">{challenge.title}</h3>
                  <p className="text-sm text-text-secondary mt-1">{challenge.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <span className="text-accent-cyan">{challenge.duration} days</span>
                    <span className="text-accent-purple">+{challenge.xpReward} XP</span>
                    <span style={{ color: getDifficultyColor(challenge.difficulty) }}>
                      {getDifficultyLabel(challenge.difficulty)}
                    </span>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    {challenge.requirements.map((req, idx) => (
                      <span key={idx} className="text-xs px-2 py-1 bg-black/30 rounded text-text-muted">
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => onStart(challenge)}
                  className="px-4 py-2 bg-accent-purple hover:bg-accent-purple/80 text-white font-semibold rounded-lg transition-colors text-sm whitespace-nowrap"
                >
                  Start Quest
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}
