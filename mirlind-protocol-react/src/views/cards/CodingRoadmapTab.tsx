import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  JAVASCRIPT_ROADMAP,
  getRoadmapProgress,
  completeModule,
  type Module,
} from '../../data/roadmap';
import { ModuleDetailModal } from './ModuleDetailModal';

export function CodingRoadmapTab() {
  const [progress, setProgress] = useState(() => getRoadmapProgress());
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  const handleCompleteModule = (moduleId: string) => {
    completeModule(moduleId);
    setProgress(getRoadmapProgress());
  };

  const totalModules = JAVASCRIPT_ROADMAP.reduce((sum, p) => sum + p.modules.length, 0);
  const completedModules = progress.completed.length;
  const progressPercent = Math.round((completedModules / totalModules) * 100);

  return (
    <>
      {/* Progress Overview */}
      <div className="glass-card rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-text-primary">JavaScript Mastery Roadmap</h3>
            <p className="text-text-secondary text-sm">From basics to advanced. Step by step.</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-accent-cyan">{progressPercent}%</div>
            <div className="text-text-muted text-sm">{completedModules}/{totalModules} modules</div>
          </div>
        </div>
        <div className="h-3 bg-black/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            className="h-full bg-linear-to-r from-accent-cyan to-accent-blue rounded-full"
          />
        </div>
      </div>

      {/* Phases */}
      <div className="space-y-6">
        {JAVASCRIPT_ROADMAP.map((phase, phaseIndex) => {
          const phaseCompleted = phase.modules.filter(m => progress.completed.includes(m.id)).length;
          const phaseProgress = Math.round((phaseCompleted / phase.modules.length) * 100);

          return (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: phaseIndex * 0.1 }}
              className="glass-card rounded-2xl overflow-hidden"
            >
              {/* Phase Header */}
              <div className="p-5 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{phase.icon}</span>
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">{phase.name}</h3>
                      <p className="text-text-secondary text-sm">{phase.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-accent-cyan">{phaseProgress}%</div>
                    <div className="text-text-muted text-xs">{phaseCompleted}/{phase.modules.length}</div>
                  </div>
                </div>
              </div>

              {/* Modules Grid */}
              <div className="p-5 grid gap-3">
                {phase.modules.map((module, modIndex) => {
                  const isCompleted = progress.completed.includes(module.id);
                  const isLocked = module.prerequisites?.some(p => !progress.completed.includes(p));

                  return (
                    <motion.div
                      key={module.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: phaseIndex * 0.1 + modIndex * 0.05 }}
                      onClick={() => !isLocked && setSelectedModule(module)}
                      className={`
                        p-4 rounded-xl border transition-all cursor-pointer
                        ${isCompleted ? 'bg-green-500/10 border-green-500/30' : ''}
                        ${isLocked ? 'opacity-50 cursor-not-allowed border-white/5' : 'border-white/10 hover:border-accent-cyan/30'}
                        ${!isCompleted && !isLocked ? 'hover:bg-white/5' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-10 h-10 rounded-lg flex items-center justify-center text-lg
                            ${isCompleted ? 'bg-green-500/20 text-green-500' : isLocked ? 'bg-white/5 text-text-muted' : 'bg-accent-cyan/20 text-accent-cyan'}
                          `}>
                            {isCompleted ? '✓' : isLocked ? '🔒' : module.icon}
                          </div>
                          <div>
                            <h4 className={`font-semibold ${isCompleted ? 'text-green-500' : 'text-text-primary'}`}>
                              {module.name}
                            </h4>
                            <p className="text-xs text-text-muted">~{module.estimatedHours} hours • {module.topics.length} topics</p>
                          </div>
                        </div>
                        {!isCompleted && !isLocked && (
                          <button className="px-3 py-1.5 bg-accent-cyan/20 text-accent-cyan text-sm rounded-lg">
                            Start
                          </button>
                        )}
                        {isCompleted && (
                          <span className="text-green-500 text-sm">Completed</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Module Detail Modal */}
      <AnimatePresence>
        {selectedModule && (
          <ModuleDetailModal
            module={selectedModule}
            isCompleted={progress.completed.includes(selectedModule.id)}
            onClose={() => setSelectedModule(null)}
            onComplete={() => handleCompleteModule(selectedModule.id)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
