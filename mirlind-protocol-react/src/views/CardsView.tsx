import { useState, useEffect } from 'react';
import { EMOJIS } from '../utils/emojis';
import { logger } from '../utils/logger';
import { useGame } from '../store/useGame';
import {
  getUnlockedTeachings,
  getDailyTeaching,
  checkAndUnlockTeachings,
  getRandomQuizQuestion,
  type FangYuanTeaching,
  type QuizQuestion,
} from '../data/fangyuan';
import { CodingRoadmapTab, MindsetTab } from './cards';

export function CardsView() {
  const { state } = useGame();
  const [activeTab, setActiveTab] = useState<'code' | 'mindset'>('code');
  const [teachings, setTeachings] = useState<FangYuanTeaching[]>([]);
  const [dailyTeaching, setDailyTeaching] = useState<FangYuanTeaching | null>(null);
  const [selectedTeaching, setSelectedTeaching] = useState<FangYuanTeaching | null>(null);
  const [quizQuestion, setQuizQuestion] = useState<QuizQuestion | null>(null);
  const [quizAnswered, setQuizAnswered] = useState<number | null>(null);
  const [showQuizResult, setShowQuizResult] = useState(false);

  useEffect(() => {
    // Check for new unlocks based on XP
    const newlyUnlocked = checkAndUnlockTeachings(state.player.totalXPEarned);
    if (newlyUnlocked.length > 0) {
      logger.debug('Unlocked Fang Yuan teachings:', newlyUnlocked);
    }
    
    setTeachings(getUnlockedTeachings());
    setDailyTeaching(getDailyTeaching());
  }, [state.player.totalXPEarned]);

  const handleStartQuiz = () => {
    setQuizQuestion(getRandomQuizQuestion());
    setQuizAnswered(null);
    setShowQuizResult(false);
  };

  const handleAnswerQuiz = (index: number) => {
    setQuizAnswered(index);
    setShowQuizResult(true);
  };

  const unlockedCount = teachings.filter(t => t.unlocked).length;

  return (
    <div className="max-w-5xl mx-auto animate-slide-up pb-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{EMOJIS.EDUCATION}</span>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Learn</h2>
            <p className="text-text-secondary text-sm">
              Master code. Master mind. Become unstoppable.
            </p>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setActiveTab('code')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
            activeTab === 'code'
              ? 'bg-accent-cyan text-white'
              : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
          }`}
        >
          💻 JavaScript Mastery
        </button>
        <button
          onClick={() => setActiveTab('mindset')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
            activeTab === 'mindset'
              ? 'bg-accent-purple text-white'
              : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
          }`}
        >
          🧠 Fang Yuan Mindset ({unlockedCount}/{teachings.length})
        </button>
      </div>

      {activeTab === 'code' ? (
        <CodingRoadmapTab />
      ) : (
        <MindsetTab
          teachings={teachings}
          dailyTeaching={dailyTeaching}
          selectedTeaching={selectedTeaching}
          setSelectedTeaching={setSelectedTeaching}
          quizQuestion={quizQuestion}
          quizAnswered={quizAnswered}
          showQuizResult={showQuizResult}
          onStartQuiz={handleStartQuiz}
          onAnswerQuiz={handleAnswerQuiz}
        />
      )}
    </div>
  );
}
