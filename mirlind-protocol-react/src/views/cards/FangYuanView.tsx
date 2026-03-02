import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, LockOpen, Key, ArrowRight, X } from 'lucide-react';
import { useGame } from '../../store/useGame';
import { logger } from '../../utils/logger';
import {
  FANG_YUAN_TEACHINGS,
  getUnlockedTeachings,
  checkAndUnlockTeachings,
  getDailyTeaching,
  getRandomQuizQuestion,
  type FangYuanTeaching,
  type QuizQuestion,
} from '../../data/fangyuan';

const XP_THRESHOLDS = [
  { id: 'strength_virtue', xp: 0, position: 0 },
  { id: 'detach_emotion', xp: 0, position: 1 },
  { id: 'sacrifice_present', xp: 0, position: 2 },
  { id: 'ruthless_self', xp: 500, position: 3 },
  { id: 'useful_remembered', xp: 1000, position: 4 },
  { id: 'regret_weakness', xp: 1500, position: 5 },
  { id: 'strategic_thinking', xp: 2000, position: 6 },
  { id: 'endure_pain', xp: 2500, position: 7 },
  { id: 'exploitation_world', xp: 3000, position: 8 },
  { id: 'adapt_overcome', xp: 3500, position: 9 },
  { id: 'no_permanent_enemies', xp: 4000, position: 10 },
  { id: 'hidden_cards', xp: 5000, position: 11 },
];

// Progress path component showing unlock pathway
function UnlockPath({ 
  totalXP, 
  unlockedIds,
  onSelectTeaching 
}: { 
  totalXP: number; 
  unlockedIds: string[];
  onSelectTeaching: (teaching: FangYuanTeaching) => void;
}) {
  return (
    <div className="relative py-8">
      {/* Path line */}
      <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/10 -translate-y-1/2 rounded-full" />
      <motion.div 
        className="absolute top-1/2 left-0 h-1 bg-accent-purple -translate-y-1/2 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, (totalXP / 5000) * 100)}%` }}
        transition={{ duration: 1 }}
      />
      
      {/* Nodes */}
      <div className="relative flex justify-between">
        {XP_THRESHOLDS.map((threshold, index) => {
          const isUnlocked = unlockedIds.includes(threshold.id);
          const isNext = !isUnlocked && (
            index === 0 || unlockedIds.includes(XP_THRESHOLDS[index - 1].id)
          );
          const teaching = FANG_YUAN_TEACHINGS.find(t => t.id === threshold.id);
          
          return (
            <motion.button
              key={threshold.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => teaching && isUnlocked && onSelectTeaching(teaching)}
              disabled={!isUnlocked}
              className={`
                relative flex flex-col items-center group
                ${!isUnlocked ? 'cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {/* Node */}
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center text-lg
                border-2 transition-all z-10
                ${isUnlocked 
                  ? 'bg-accent-purple border-accent-purple text-white shadow-lg shadow-accent-purple/30' 
                  : isNext
                    ? 'bg-bg-secondary border-accent-purple/50 text-accent-purple animate-pulse'
                    : 'bg-bg-secondary border-white/20 text-text-muted'
                }
              `}>
                {isUnlocked ? <LockOpen className="w-5 h-5" /> : isNext ? <Key className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              
              {/* XP Label */}
              <span className={`
                text-xs mt-2 font-medium transition-colors
                ${isUnlocked ? 'text-accent-purple' : 'text-text-muted'}
              `}>
                {threshold.xp === 0 ? 'Start' : threshold.xp.toLocaleString()} XP
              </span>
              
              {/* Tooltip */}
              {teaching && (
                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-bg-secondary border border-white/10 rounded-lg px-3 py-2 whitespace-nowrap">
                    <p className="text-sm font-medium text-text-primary">{teaching.principle}</p>
                    {!isUnlocked && (
                      <p className="text-xs text-accent-yellow">
                        {Math.max(0, threshold.xp - totalXP)} XP to unlock
                      </p>
                    )}
                  </div>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// Teaching card component
function TeachingCard({ 
  teaching, 
  isDaily = false,
  onClick 
}: { 
  teaching: FangYuanTeaching; 
  isDaily?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`
        glass-card rounded-2xl p-6 cursor-pointer transition-all hover:scale-[1.02]
        ${isDaily ? 'border-accent-purple/30 bg-accent-purple/5' : 'border-white/10 hover:border-accent-purple/30'}
      `}
    >
      {isDaily && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-accent-purple text-sm font-semibold">★ Daily Teaching</span>
        </div>
      )}
      
      <h3 className="text-xl font-bold text-text-primary mb-2">{teaching.principle}</h3>
      <p className="text-text-secondary text-sm mb-4 line-clamp-2">{teaching.explanation}</p>
      
      <div className="p-3 bg-black/20 rounded-xl">
        <p className="text-sm italic text-text-secondary">&ldquo;{teaching.quote}&rdquo;</p>
        <p className="text-accent-purple text-xs mt-1">— Fang Yuan</p>
      </div>
      
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-text-muted">Click to read more</span>
        <ArrowRight className="w-4 h-4 text-accent-purple" />
      </div>
    </motion.div>
  );
}

// Quiz component
function FangYuanQuiz({ 
  onComplete 
}: { 
  onComplete: (correct: boolean) => void;
}) {
  const [question, setQuestion] = useState<QuizQuestion>(() => getRandomQuizQuestion());
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  const handleAnswer = (index: number) => {
    setSelected(index);
    setShowResult(true);
    onComplete(index === question.correct);
  };
  
  const nextQuestion = () => {
    setQuestion(getRandomQuizQuestion());
    setSelected(null);
    setShowResult(false);
  };
  
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">⚔️</span>
        <h3 className="font-bold text-text-primary">Test Your Understanding</h3>
      </div>
      
      <p className="text-text-primary font-medium mb-4">{question.question}</p>
      
      <div className="space-y-2">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => !showResult && handleAnswer(index)}
            disabled={showResult}
            className={`
              w-full p-3 rounded-lg text-left transition-all border
              ${showResult && index === question.correct 
                ? 'bg-green-500/20 border-green-500/50 text-green-500' 
                : showResult && index === selected && index !== question.correct
                  ? 'bg-red-500/20 border-red-500/50 text-red-500'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-accent-purple/30'
              }
            `}
          >
            <span className="font-mono mr-2">{String.fromCharCode(65 + index)}.</span>
            {option}
          </button>
        ))}
      </div>
      
      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-white/5 rounded-xl"
        >
          <p className={selected === question.correct ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
            {selected === question.correct ? '✅ Correct!' : '❌ Incorrect'}
          </p>
          <p className="text-text-secondary text-sm mt-1">{question.explanation}</p>
          <button
            onClick={nextQuestion}
            className="mt-3 px-4 py-2 bg-accent-purple-dark text-white rounded-lg text-sm hover:bg-accent-purple-dark/80 transition-colors"
          >
            Next Question
          </button>
        </motion.div>
      )}
    </div>
  );
}

// Detail modal
function TeachingDetailModal({ 
  teaching, 
  onClose 
}: { 
  teaching: FangYuanTeaching; 
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-bg-secondary border border-accent-purple/30 rounded-2xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <span className="text-accent-purple text-sm font-medium">Fang Yuan Principle</span>
            <h2 className="text-3xl font-bold text-text-primary mt-1">{teaching.principle}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-text-muted" />
          </button>
        </div>
        
        <div className="space-y-6">
          <section>
            <h3 className="text-accent-purple font-semibold mb-2">Explanation</h3>
            <p className="text-text-secondary leading-relaxed">{teaching.explanation}</p>
          </section>
          
          <section>
            <h3 className="text-accent-purple font-semibold mb-2">Real-World Application</h3>
            <div className="p-4 bg-accent-purple/10 rounded-xl border border-accent-purple/20">
              <p className="text-text-primary">{teaching.application}</p>
            </div>
          </section>
          
          <section>
            <h3 className="text-accent-purple font-semibold mb-2">Quote</h3>
            <blockquote className="border-l-4 border-accent-purple pl-4 py-2">
              <p className="text-xl italic text-text-primary">&ldquo;{teaching.quote}&rdquo;</p>
              <cite className="text-accent-purple text-sm mt-2 block">— Fang Yuan, Reverend Insanity</cite>
            </blockquote>
          </section>
        </div>
        
        <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-accent-purple-dark text-white rounded-lg hover:bg-accent-purple-dark/80 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function FangYuanView() {
  const { state } = useGame();
  const totalXP = state.player.totalXPEarned || 0;
  
  const [teachings, setTeachings] = useState<FangYuanTeaching[]>([]);
  const [dailyTeaching, setDailyTeaching] = useState<FangYuanTeaching | null>(null);
  const [selectedTeaching, setSelectedTeaching] = useState<FangYuanTeaching | null>(null);
  const [quizStreak, setQuizStreak] = useState(0);
  // const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Check for new unlocks
    const newlyUnlocked = checkAndUnlockTeachings(totalXP);
    if (newlyUnlocked.length > 0) {
      // Show toast or notification for new unlocks
      logger.debug('Newly unlocked:', newlyUnlocked);
    }
    
    setTimeout(() => {
      setTeachings(getUnlockedTeachings());
      setDailyTeaching(getDailyTeaching());
    }, 0);
  }, [totalXP]);
  
  const unlockedTeachings = teachings.filter(t => t.unlocked);
  const nextUnlock = XP_THRESHOLDS.find(t => !unlockedTeachings.some(ut => ut.id === t.id));
  
  const handleQuizComplete = (correct: boolean) => {
    // setLastCorrect(correct);
    if (correct) {
      setQuizStreak(s => s + 1);
    } else {
      setQuizStreak(0);
    }
  };
  
  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-1">Fang Yuan Mindset</h2>
            <p className="text-text-secondary">Master the principles of Reverend Insanity</p>
          </div>
          <div className="flex gap-4">
            <div className="text-center px-4 py-2 bg-accent-purple/10 rounded-xl">
              <div className="text-2xl font-bold text-accent-purple">{unlockedTeachings.length}</div>
              <div className="text-xs text-text-muted">Unlocked</div>
            </div>
            <div className="text-center px-4 py-2 bg-white/5 rounded-xl">
              <div className="text-2xl font-bold text-text-primary">{totalXP.toLocaleString()}</div>
              <div className="text-xs text-text-muted">Total XP</div>
            </div>
            <div className="text-center px-4 py-2 bg-accent-yellow/10 rounded-xl">
              <div className="text-2xl font-bold text-accent-yellow">{quizStreak}</div>
              <div className="text-xs text-text-muted">Quiz Streak</div>
            </div>
          </div>
        </div>
        
        {/* Next unlock info */}
        {nextUnlock && (
          <div className="mt-4 p-3 bg-white/5 rounded-xl flex items-center justify-between">
            <span className="text-sm text-text-secondary">
              Next principle unlocks at <span className="text-accent-purple font-semibold">{nextUnlock.xp.toLocaleString()} XP</span>
            </span>
            <span className="text-sm text-accent-yellow">
              {Math.max(0, nextUnlock.xp - totalXP).toLocaleString()} XP to go
            </span>
          </div>
        )}
      </div>
      
      {/* Unlock Path */}
      <div className="glass-card rounded-2xl p-6 overflow-x-auto">
        <h3 className="text-lg font-bold text-text-primary mb-6">Your Path to Mastery</h3>
        <div className="min-w-200">
          <UnlockPath 
            totalXP={totalXP} 
            unlockedIds={unlockedTeachings.map(t => t.id)}
            onSelectTeaching={setSelectedTeaching}
          />
        </div>
      </div>
      
      {/* Daily Teaching */}
      {dailyTeaching && (
        <TeachingCard 
          teaching={dailyTeaching} 
          isDaily 
          onClick={() => setSelectedTeaching(dailyTeaching)}
        />
      )}
      
      {/* Quiz Section */}
      <FangYuanQuiz onComplete={handleQuizComplete} />
      
      {/* Unlocked Principles Grid */}
      <div>
        <h3 className="text-lg font-bold text-text-primary mb-4">
          Unlocked Principles ({unlockedTeachings.length}/{teachings.length})
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {unlockedTeachings.map((teaching, index) => (
            <motion.div
              key={teaching.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <TeachingCard 
                teaching={teaching}
                onClick={() => setSelectedTeaching(teaching)}
              />
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Detail Modal */}
      <AnimatePresence>
        {selectedTeaching && (
          <TeachingDetailModal 
            teaching={selectedTeaching}
            onClose={() => setSelectedTeaching(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
