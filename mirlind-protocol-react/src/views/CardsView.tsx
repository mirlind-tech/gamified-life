import { useGame } from '../store/useGame';
import { EMOJIS } from '../utils/emojis';
import { FangYuanView } from './cards/FangYuanView';
import { calculateTotalProgress } from '../data/expandedRoadmap';
import { ArrowRight } from 'lucide-react';

export function CardsView() {
  const { setView } = useGame();
  const techStackProgress = calculateTotalProgress();

  return (
    <div className="max-w-5xl mx-auto animate-slide-up pb-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{EMOJIS.EDUCATION}</span>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Learn</h2>
            <p className="text-text-secondary text-sm">
              Master your mind. Master your craft.
            </p>
          </div>
        </div>
      </div>

      {/* Tech Stack Redirect Card */}
      <div 
        className="glass-card rounded-2xl p-6 mb-8 bg-linear-to-br from-accent-cyan/10 to-accent-purple/10 border border-accent-cyan/30 cursor-pointer hover:border-accent-cyan/50 transition-all group"
        onClick={() => setView('skills-roadmap')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-4xl">💻</div>
            <div>
              <h3 className="text-xl font-bold text-text-primary">Tech Stack Curriculum</h3>
              <p className="text-text-secondary text-sm mt-1">
                JavaScript • TypeScript • React • Node.js • PostgreSQL • Git • Docker • Rust • Python
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-accent-cyan font-bold">{techStackProgress.percentage}% Complete</span>
                <span className="text-text-muted">•</span>
                <span className="text-accent-purple">{techStackProgress.completedModules} modules done</span>
              </div>
            </div>
          </div>
          <ArrowRight className="w-8 h-8 text-text-muted group-hover:text-accent-cyan transition-colors" />
        </div>
        
        {/* Mini progress bar */}
        <div className="mt-4 h-2 bg-black/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-linear-to-r from-accent-cyan to-accent-purple rounded-full transition-all"
            style={{ width: `${techStackProgress.percentage}%` }}
          />
        </div>
      </div>

      {/* Fang Yuan Mindset */}
      <FangYuanView />
    </div>
  );
}
