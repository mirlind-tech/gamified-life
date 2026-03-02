import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Lock } from 'lucide-react';
import { EMOJIS } from '../utils/emojis';
import {
  ALL_SKILLS,
  getRoadmapProgress,
  completeModule,
  uncompleteModule,
  calculateTotalProgress,
  getSkillProgress,
  setModuleHours,
  setModuleNotes,
  type SkillRoadmap,
  type Phase,
  type Module,
} from '../data/expandedRoadmap';

// Circular progress component
function SkillProgressRing({ 
  percentage, 
  color, 
  size = 60,
  icon,
  label
}: { 
  percentage: number; 
  color: string; 
  size?: number;
  icon: string;
  label: string;
}) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-2xl">
          {icon}
        </div>
      </div>
      <span className="text-xs font-medium text-text-secondary mt-1 text-center">{label}</span>
      <span className="text-xs font-bold" style={{ color }}>{percentage}%</span>
    </div>
  );
}

// Module card component
function ModuleCard({
  module,
  isCompleted,
  isLocked,
  onToggle,
  hoursSpent,
  notes,
  onUpdateHours,
  onUpdateNotes,
}: {
  module: Module;
  isCompleted: boolean;
  isLocked: boolean;
  onToggle: () => void;
  hoursSpent: number;
  notes: string;
  onUpdateHours: (hours: number) => void;
  onUpdateNotes: (notes: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localHours, setLocalHours] = useState(hoursSpent || 0);
  const [localNotes, setLocalNotes] = useState(notes || '');
  
  return (
    <motion.div
      layout
      className={`
        rounded-xl border transition-all overflow-hidden
        ${isCompleted ? 'bg-green-500/10 border-green-500/30' : ''}
        ${isLocked ? 'opacity-50 border-white/5' : 'border-white/10 hover:border-white/20'}
        ${!isCompleted && !isLocked ? 'bg-white/5' : ''}
      `}
    >
      {/* Header */}
      <div 
        className="p-4 cursor-pointer"
        onClick={() => !isLocked && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`
              w-10 h-10 rounded-lg flex items-center justify-center text-lg
              ${isCompleted ? 'bg-green-500/20 text-green-500' : isLocked ? 'bg-white/5 text-text-muted' : 'bg-white/10 text-text-primary'}
            `}>
              {isCompleted ? <Check className="w-5 h-5" /> : isLocked ? <Lock className="w-5 h-5" /> : module.icon}
            </div>
            <div>
              <h4 className={`font-semibold ${isCompleted ? 'text-green-500' : 'text-text-primary'}`}>
                {module.name}
              </h4>
              <p className="text-xs text-text-muted">~{module.estimatedHours} hours • {module.topics.length} topics</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isLocked && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${isCompleted 
                    ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' 
                    : 'bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/30'
                  }
                `}
              >
                {isCompleted ? 'Completed' : 'Mark Complete'}
              </button>
            )}
            <span className="text-text-muted">{isExpanded ? '▼' : '▶'}</span>
          </div>
        </div>
      </div>
      
      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && !isLocked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10"
          >
            <div className="p-4 space-y-4">
              {/* Description */}
              <p className="text-sm text-text-secondary">{module.description}</p>
              
              {/* Topics */}
              <div>
                <h5 className="text-sm font-semibold text-text-primary mb-2">Topics Covered:</h5>
                <div className="space-y-2">
                  {module.topics.map((topic, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-black/20">
                      <div className="flex items-center gap-2">
                        <span className="text-accent-cyan text-xs">•</span>
                        <span className="text-sm text-text-primary">{topic.name}</span>
                      </div>
                      <p className="text-xs text-text-muted ml-4">{topic.description}</p>
                      {topic.concepts && (
                        <div className="flex flex-wrap gap-1 mt-1 ml-4">
                          {topic.concepts.map((concept, cidx) => (
                            <span key={cidx} className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded text-text-muted">
                              {concept}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Hours & Notes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`hours-${module.id}`} className="text-xs text-text-muted block mb-1">Hours Spent</label>
                  <input
                    id={`hours-${module.id}`}
                    type="number"
                    value={localHours}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setLocalHours(val);
                      onUpdateHours(val);
                    }}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-cyan"
                  />
                </div>
                <div>
                  <p className="text-xs text-text-muted block mb-1">Target: {module.estimatedHours}h</p>
                  <div className="text-sm text-text-secondary py-2">
                    {localHours >= module.estimatedHours ? (
                      <span className="text-green-500 flex items-center gap-1">
                        <Check className="w-4 h-4" /> Target met!
                      </span>
                    ) : (
                      <span>{module.estimatedHours - localHours}h remaining</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor={`notes-${module.id}`} className="text-xs text-text-muted block mb-1">Notes</label>
                <textarea
                  id={`notes-${module.id}`}
                  value={localNotes}
                  onChange={(e) => {
                    setLocalNotes(e.target.value);
                    onUpdateNotes(e.target.value);
                  }}
                  placeholder="Add your learning notes here..."
                  className="w-full h-20 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-accent-cyan"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Phase section component
function PhaseSection({
  phase,
  skillId: _skillId,
  progress,
  onUpdate,
}: {
  phase: Phase;
  skillId: string;
  progress: ReturnType<typeof getRoadmapProgress>;
  onUpdate: () => void;
}) {
  const phaseProgress = useMemo(() => {
    const moduleIds = phase.modules.map(m => m.id);
    const completed = progress.completedModules.filter(id => moduleIds.includes(id)).length;
    return {
      completed,
      total: phase.modules.length,
      percentage: Math.round((completed / phase.modules.length) * 100)
    };
  }, [phase.modules, progress.completedModules]);
  
  const [isExpanded, setIsExpanded] = useState(phaseProgress.percentage < 100);
  
  const handleToggleModule = (moduleId: string) => {
    if (progress.completedModules.includes(moduleId)) {
      uncompleteModule(moduleId);
    } else {
      completeModule(moduleId);
    }
    onUpdate();
  };
  
  const isModuleLocked = (module: Module) => {
    if (!module.prerequisites) return false;
    return module.prerequisites.some(prereq => !progress.completedModules.includes(prereq));
  };
  
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Phase Header */}
      <div 
        className="p-5 border-b border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{phase.icon}</span>
            <div>
              <h3 className="text-lg font-bold text-text-primary">{phase.name}</h3>
              <p className="text-text-secondary text-sm">{phase.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xl font-bold text-accent-cyan">{phaseProgress.percentage}%</div>
              <div className="text-text-muted text-xs">{phaseProgress.completed}/{phaseProgress.total}</div>
            </div>
            <span className="text-text-muted text-lg">{isExpanded ? '▼' : '▶'}</span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-black/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-accent-cyan rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${phaseProgress.percentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
      
      {/* Modules */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="p-5 grid gap-3"
          >
            {phase.modules.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                isCompleted={progress.completedModules.includes(module.id)}
                isLocked={isModuleLocked(module)}
                onToggle={() => handleToggleModule(module.id)}
                hoursSpent={progress.hoursSpent[module.id] || 0}
                notes={progress.notes[module.id] || ''}
                onUpdateHours={(hours) => {
                  setModuleHours(module.id, hours);
                  onUpdate();
                }}
                onUpdateNotes={(notes) => {
                  setModuleNotes(module.id, notes);
                  onUpdate();
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Main view component
export function SkillsRoadmapView() {
  const [selectedSkill, setSelectedSkill] = useState<SkillRoadmap | null>(null);
  const [progress, setProgress] = useState(() => getRoadmapProgress());
  const [refreshKey, setRefreshKey] = useState(0);
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const totalProgress = useMemo(() => calculateTotalProgress(), [refreshKey]);
  
  const handleUpdate = () => {
    setProgress(getRoadmapProgress());
    setRefreshKey(k => k + 1);
  };
  
  // Skill selection view
  if (!selectedSkill) {
    return (
      <div className="max-w-6xl mx-auto animate-slide-up pb-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{EMOJIS.EDUCATION}</span>
            <div>
              <h2 className="text-2xl font-bold text-text-primary">Skills Mastery</h2>
              <p className="text-text-secondary text-sm">
                Master 10 essential technologies. Become a full-stack developer.
              </p>
            </div>
          </div>
        </div>
        
        {/* Overall Progress */}
        <div className="glass-card rounded-3xl p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
              <svg width="140" height="140" className="transform -rotate-90">
                <circle
                  cx="70"
                  cy="70"
                  r="60"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="10"
                />
                <motion.circle
                  cx="70"
                  cy="70"
                  r="60"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(totalProgress.percentage / 100) * 377} 377`}
                  initial={{ strokeDashoffset: 377 }}
                  animate={{ strokeDashoffset: 377 - ((totalProgress.percentage / 100) * 377) }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold font-mono text-accent-cyan">
                  {totalProgress.percentage}%
                </span>
                <span className="text-xs text-text-muted">Complete</span>
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold text-text-primary mb-2">
                Full Stack Developer Journey
              </h3>
              <p className="text-text-secondary mb-4">
                {totalProgress.completedModules} of {totalProgress.totalModules} modules completed
                • {totalProgress.totalHours} hours logged
              </p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-500 text-sm">
                  💛 JavaScript - {getSkillProgress('javascript').percentage}%
                </span>
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-500 text-sm">
                  🔷 TypeScript - {getSkillProgress('typescript').percentage}%
                </span>
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-500 text-sm">
                  ⚛️ React - {getSkillProgress('react').percentage}%
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Skills Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {ALL_SKILLS.map((skill, index) => {
            const skillProgress = getSkillProgress(skill.id);
            return (
              <motion.button
                key={skill.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedSkill(skill)}
                className="glass-card rounded-2xl p-5 text-center hover:bg-white/5 transition-all hover:scale-105"
              >
                <SkillProgressRing
                  percentage={skillProgress.percentage}
                  color={skill.color}
                  icon={skill.icon}
                  label={skill.name}
                />
                <p className="text-xs text-text-muted mt-3 line-clamp-2">
                  {skillProgress.completedModules}/{skillProgress.totalModules} modules
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }
  
  // Skill detail view
  return (
    <div className="max-w-5xl mx-auto animate-slide-up pb-8">
      {/* Back button & Header */}
      <div className="mb-6">
        <button
          onClick={() => setSelectedSkill(null)}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-4"
        >
          <span>←</span> Back to Skills
        </button>
        
        <div className="flex items-center gap-4">
          <span className="text-4xl">{selectedSkill.icon}</span>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">{selectedSkill.name}</h2>
            <p className="text-text-secondary">{selectedSkill.description}</p>
          </div>
        </div>
      </div>
      
      {/* Phases */}
      <div className="space-y-6">
        {selectedSkill.phases.map((phase) => (
          <PhaseSection
            key={phase.id}
            phase={phase}
            skillId={selectedSkill.id}
            progress={progress}
            onUpdate={handleUpdate}
          />
        ))}
      </div>
    </div>
  );
}
