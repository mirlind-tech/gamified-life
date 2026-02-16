import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EMOJIS } from '../utils/emojis';
import {
  getUserSkills,
  startSkill,
  completeStage,
  getCategoryColor,
  getCategoryIcon,
  getDifficultyStars,
  type MasterySkill,
} from '../data/skills';

export function TreeView() {
  const [skills, setSkills] = useState<MasterySkill[]>(() => getUserSkills());
  const [selectedSkill, setSelectedSkill] = useState<MasterySkill | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all');

  // Skills are loaded via lazy initialization above

  const categories = [
    { id: 'all', name: 'All Skills', icon: '🔥' },
    { id: 'physical', name: 'Physical', icon: '💪' },
    { id: 'creative', name: 'Creative', icon: '🎨' },
    { id: 'social', name: 'Social', icon: '🗣️' },
    { id: 'mental', name: 'Mental', icon: '🧠' },
    { id: 'survival', name: 'Survival', icon: '⛺' },
  ];

  const filteredSkills = skills.filter(skill => {
    if (activeCategory !== 'all' && skill.category !== activeCategory) return false;
    if (filter === 'in-progress' && !skill.started) return false;
    if (filter === 'completed' && !skill.completed) return false;
    return true;
  });

  const handleStartSkill = (skillId: string) => {
    startSkill(skillId);
    setSkills(getUserSkills());
  };

  const handleCompleteStage = (skillId: string, stageIndex: number) => {
    completeStage(skillId, stageIndex);
    setSkills(getUserSkills());
    // Refresh selected skill
    if (selectedSkill?.id === skillId) {
      const updated = getUserSkills().find(s => s.id === skillId);
      if (updated) setSelectedSkill(updated);
    }
  };

  const stats = {
    total: skills.length,
    completed: skills.filter(s => s.completed).length,
    inProgress: skills.filter(s => s.started && !s.completed).length,
    notStarted: skills.filter(s => !s.started).length,
  };

  return (
    <div className="max-w-6xl mx-auto animate-slide-up pb-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{EMOJIS.TREE}</span>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Skill Mastery</h2>
            <p className="text-text-secondary text-sm">
              Master random skills. Become dangerously capable.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-xl p-4 text-center"
        >
          <div className="text-2xl mb-1">📚</div>
          <div className="text-2xl font-bold text-text-primary">{stats.total}</div>
          <div className="text-text-muted text-xs">Total Skills</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-4 text-center"
        >
          <div className="text-2xl mb-1">✅</div>
          <div className="text-2xl font-bold text-accent-green">{stats.completed}</div>
          <div className="text-text-muted text-xs">Mastered</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-4 text-center"
        >
          <div className="text-2xl mb-1">🔥</div>
          <div className="text-2xl font-bold text-accent-orange">{stats.inProgress}</div>
          <div className="text-text-muted text-xs">In Progress</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl p-4 text-center"
        >
          <div className="text-2xl mb-1">🎯</div>
          <div className="text-2xl font-bold text-accent-cyan">{stats.notStarted}</div>
          <div className="text-text-muted text-xs">Available</div>
        </motion.div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              activeCategory === cat.id
                ? 'bg-accent-purple text-white'
                : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            <span className="mr-1">{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Progress Filter */}
      <div className="flex gap-2 mb-6">
        {(['all', 'in-progress', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              filter === f
                ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {f === 'all' ? 'All' : f === 'in-progress' ? 'In Progress' : 'Completed'}
          </button>
        ))}
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSkills.map((skill, index) => (
          <motion.div
            key={skill.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setSelectedSkill(skill)}
            className={`
              glass-card rounded-2xl p-5 cursor-pointer transition-all
              hover:border-accent-purple/30 hover:scale-[1.02]
              ${skill.completed ? 'border-green-500/30 bg-green-500/5' : 'border-white/10'}
              ${skill.started && !skill.completed ? 'border-accent-orange/30' : ''}
            `}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{skill.icon}</span>
                <div>
                  <h3 className="font-bold text-text-primary">{skill.name}</h3>
                  <div className="flex items-center gap-2 text-xs">
                    <span style={{ color: getCategoryColor(skill.category) }}>
                      {getCategoryIcon(skill.category)} {skill.category}
                    </span>
                    <span className="text-text-muted">•</span>
                    <span className="text-text-muted">~{skill.estimatedHours}h</span>
                  </div>
                </div>
              </div>
              {skill.completed && <span className="text-2xl">✅</span>}
              {skill.started && !skill.completed && <span className="text-2xl">🔥</span>}
            </div>

            {/* Description */}
            <p className="text-sm text-text-secondary mb-3 line-clamp-2">
              {skill.description}
            </p>

            {/* Why Learn */}
            <div className="text-xs text-text-muted mb-3">
              <span className="text-accent-purple">Why:</span> {skill.whyLearn}
            </div>

            {/* Progress */}
            {skill.started && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-text-muted mb-1">
                  <span>Progress</span>
                  <span>{skill.currentStage}/{skill.stages.length} stages</span>
                </div>
                <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(skill.currentStage / skill.stages.length) * 100}%` }}
                    className="h-full bg-accent-purple rounded-full"
                  />
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between">
              <span className="text-xs">{getDifficultyStars(skill.difficulty)}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!skill.started) {
                    handleStartSkill(skill.id);
                  } else {
                    setSelectedSkill(skill);
                  }
                }}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${skill.completed 
                    ? 'bg-green-500/20 text-green-500' 
                    : skill.started
                      ? 'bg-accent-orange/20 text-accent-orange'
                      : 'bg-accent-purple hover:bg-accent-purple/80 text-white'
                  }
                `}
              >
                {skill.completed ? 'Mastered' : skill.started ? 'Continue' : 'Start Learning'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Skill Detail Modal */}
      <AnimatePresence>
        {selectedSkill && (
          <SkillDetailModal
            skill={selectedSkill}
            onClose={() => setSelectedSkill(null)}
            onStart={() => handleStartSkill(selectedSkill.id)}
            onCompleteStage={(stageIndex) => handleCompleteStage(selectedSkill.id, stageIndex)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SkillDetailModal({
  skill,
  onClose,
  onStart,
  onCompleteStage,
}: {
  skill: MasterySkill;
  onClose: () => void;
  onStart: () => void;
  onCompleteStage: (index: number) => void;
}) {
  // Track current stage for UI display
  const currentStageIndex = skill.currentStage;

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
        className="bg-bg-secondary border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <span className="text-5xl">{skill.icon}</span>
              <div>
                <h2 className="text-2xl font-bold text-text-primary">{skill.name}</h2>
                <div className="flex items-center gap-3 text-sm mt-1">
                  <span style={{ color: getCategoryColor(skill.category) }}>
                    {getCategoryIcon(skill.category)} {skill.category}
                  </span>
                  <span className="text-text-muted">•</span>
                  <span className="text-text-muted">{getDifficultyStars(skill.difficulty)}</span>
                  <span className="text-text-muted">•</span>
                  <span className="text-text-muted">~{skill.estimatedHours} hours</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <span className="text-2xl">✕</span>
            </button>
          </div>
          
          <p className="text-text-secondary mt-4">{skill.description}</p>
          
          <div className="mt-4 p-3 bg-accent-purple/10 border border-accent-purple/20 rounded-xl">
            <span className="text-accent-purple font-semibold">Why learn this:</span>
            <span className="text-text-secondary ml-2">{skill.whyLearn}</span>
          </div>
        </div>

        {/* Stages */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {!skill.started ? (
            <div className="text-center py-8">
              <p className="text-text-secondary mb-4">
                Ready to master {skill.name}? This will take approximately {skill.estimatedHours} hours.
              </p>
              <button
                onClick={onStart}
                className="px-8 py-3 bg-accent-purple hover:bg-accent-purple/80 text-white font-bold rounded-xl transition-colors"
              >
                🚀 Start Learning
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {skill.stages.map((stage, index) => {
                const isCompleted = index < skill.currentStage;
                const isActive = index === skill.currentStage;
                const isLocked = index > skill.currentStage;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`
                      border rounded-xl p-4 transition-all
                      ${isCompleted ? 'border-green-500/30 bg-green-500/5' : ''}
                      ${isActive ? 'border-accent-orange/30 bg-accent-orange/5' : ''}
                      ${isLocked ? 'border-white/5 opacity-50' : 'border-white/10'}
                    `}
                  >
                    {/* Stage Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                          ${isCompleted ? 'bg-green-500 text-white' : ''}
                          ${isActive ? 'bg-accent-orange text-white' : ''}
                          ${isLocked ? 'bg-white/10 text-text-muted' : ''}
                        `}>
                          {isCompleted ? '✓' : index + 1}
                        </div>
                        <div>
                          <h3 className="font-bold text-text-primary">{stage.name}</h3>
                          <p className="text-xs text-text-muted">~{stage.hoursNeeded} hours</p>
                        </div>
                      </div>
                      
                      {isActive && !skill.completed && (
                        <button
                          onClick={() => onCompleteStage(index)}
                          className="px-4 py-2 bg-accent-green hover:bg-accent-green/80 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                          ✅ Complete Stage
                        </button>
                      )}
                      {isCompleted && <span className="text-green-500">✓ Completed</span>}
                    </div>

                    {/* Stage Description */}
                    <p className="text-sm text-text-secondary mb-3">{stage.description}</p>

                    {/* Micro Goals */}
                    <div className="mb-3">
                      <h4 className="text-xs font-semibold text-text-muted mb-2">Micro-Goals:</h4>
                      <ul className="space-y-1">
                        {stage.microGoals.map((goal, goalIndex) => (
                          <li key={goalIndex} className="text-sm text-text-secondary flex items-center gap-2">
                            <span className="text-accent-cyan">•</span> {goal}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Resources */}
                    <div>
                      <h4 className="text-xs font-semibold text-text-muted mb-2">Resources:</h4>
                      <div className="flex flex-wrap gap-2">
                        {stage.resources.map((resource, resIndex) => (
                          <span
                            key={resIndex}
                            className="text-xs px-2 py-1 bg-white/5 rounded text-text-secondary"
                          >
                            {resource.type === 'video' ? '🎥' : resource.type === 'book' ? '📚' : '📄'} {resource.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {skill.completed && (
          <div className="p-6 border-t border-white/10 bg-green-500/10 text-center">
            <span className="text-3xl mb-2 block">🎉</span>
            <h3 className="text-xl font-bold text-green-500">Skill Mastered!</h3>
            <p className="text-text-secondary">You are now dangerously capable.</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
