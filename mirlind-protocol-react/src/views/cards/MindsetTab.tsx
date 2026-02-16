import { motion, AnimatePresence } from 'framer-motion';
import type { MindsetTabProps } from './types';

export function MindsetTab({
  teachings,
  dailyTeaching,
  selectedTeaching,
  setSelectedTeaching,
  quizQuestion,
  quizAnswered,
  showQuizResult,
  onStartQuiz,
  onAnswerQuiz,
}: MindsetTabProps) {
  const unlocked = teachings.filter(t => t.unlocked);
  const locked = teachings.filter(t => !t.unlocked);

  return (
    <>
      {/* Daily Teaching */}
      {dailyTeaching && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card border-accent-purple/30 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🧠</span>
            <span className="text-accent-purple font-semibold">Daily Teaching</span>
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-2">{dailyTeaching.principle}</h3>
          <p className="text-text-secondary mb-4">{dailyTeaching.explanation}</p>
          <div className="p-3 bg-accent-purple/10 rounded-xl">
            <p className="italic text-text-secondary">&quot;{dailyTeaching.quote}&quot;</p>
            <p className="text-accent-purple text-sm mt-1">— Fang Yuan</p>
          </div>
        </motion.div>
      )}

      {/* Quiz Section */}
      <div className="glass-card rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚔️</span>
            <h3 className="font-bold text-text-primary">Test Your Understanding</h3>
          </div>
          {!quizQuestion && (
            <button
              onClick={onStartQuiz}
              className="px-4 py-2 bg-accent-purple hover:bg-accent-purple/80 text-white rounded-lg transition-colors"
            >
              Start Quiz
            </button>
          )}
        </div>

        {quizQuestion && (
          <div>
            <p className="text-text-primary font-medium mb-4">{quizQuestion.question}</p>
            <div className="space-y-2">
              {quizQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => !showQuizResult && onAnswerQuiz(index)}
                  disabled={showQuizResult}
                  className={`
                    w-full p-3 rounded-lg text-left transition-all
                    ${showQuizResult && index === quizQuestion.correct ? 'bg-green-500/20 text-green-500 border border-green-500/30' : ''}
                    ${showQuizResult && index === quizAnswered && index !== quizQuestion.correct ? 'bg-red-500/20 text-red-500 border border-red-500/30' : ''}
                    ${!showQuizResult ? 'bg-bg-primary hover:bg-white/5 border border-white/10' : ''}
                    ${showQuizResult && index !== quizAnswered && index !== quizQuestion.correct ? 'opacity-50' : ''}
                  `}
                >
                  {option}
                </button>
              ))}
            </div>

            {showQuizResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-white/5 rounded-xl"
              >
                <p className={quizAnswered === quizQuestion.correct ? 'text-green-500' : 'text-red-500'}>
                  {quizAnswered === quizQuestion.correct ? '✅ Correct!' : '❌ Incorrect'}
                </p>
                <p className="text-text-secondary text-sm mt-1">{quizQuestion.explanation}</p>
                <button
                  onClick={onStartQuiz}
                  className="mt-3 px-4 py-2 bg-accent-purple text-white rounded-lg text-sm"
                >
                  Next Question
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Unlocked Teachings */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <span>🔓</span> Unlocked Principles ({unlocked.length})
        </h3>
        <div className="grid gap-3">
          {unlocked.map((teaching, index) => (
            <motion.div
              key={teaching.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedTeaching(teaching)}
              className="glass-card p-4 rounded-xl cursor-pointer hover:border-accent-purple/30 transition-all"
            >
              <h4 className="font-semibold text-text-primary">{teaching.principle}</h4>
              <p className="text-sm text-text-secondary line-clamp-1">{teaching.explanation}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Locked Teachings */}
      {locked.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <span>🔒</span> Locked Principles ({locked.length})
          </h3>
          <div className="grid gap-3 opacity-50">
            {locked.slice(0, 3).map((teaching) => (
              <div key={teaching.id} className="glass-card p-4 rounded-xl">
                <h4 className="font-semibold text-text-muted">{teaching.principle}</h4>
                <p className="text-sm text-text-muted">Keep earning XP to unlock...</p>
              </div>
            ))}
            {locked.length > 3 && (
              <p className="text-center text-text-muted text-sm">
                ...and {locked.length - 3} more
              </p>
            )}
          </div>
        </div>
      )}

      {/* Teaching Detail Modal */}
      <AnimatePresence>
        {selectedTeaching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setSelectedTeaching(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-bg-secondary border border-white/10 rounded-2xl w-full max-w-xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold text-text-primary">{selectedTeaching.principle}</h2>
                <button onClick={() => setSelectedTeaching(null)} className="p-2 hover:bg-white/5 rounded-lg">
                  <span className="text-2xl">✕</span>
                </button>
              </div>

              <p className="text-text-secondary mb-6">{selectedTeaching.explanation}</p>

              <div className="mb-6">
                <h4 className="font-semibold text-accent-purple mb-2">Application:</h4>
                <p className="text-text-secondary">{selectedTeaching.application}</p>
              </div>

              <div className="p-4 bg-accent-purple/10 rounded-xl">
                <p className="italic text-text-secondary">&quot;{selectedTeaching.quote}&quot;</p>
                <p className="text-accent-purple text-sm mt-2">— Fang Yuan</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
