import { TabTransition } from '../../components/animations';
import { useGame } from '../../store/useGame';
import { EMOJIS } from '../../utils/emojis';
import type { CodeTabProps } from './types';
import { ALL_SKILLS, getSkillProgress, calculateTotalProgress } from '../../data/expandedRoadmap';

const STORAGE_KEYS = {
  code: 'mirlind-protocol-code',
};

export function CodeTab({ codeStats, setCodeStats }: CodeTabProps) {
  const { setView } = useGame();
  const totalProgress = calculateTotalProgress();

  // Calculate weekly stats from localStorage
  let totalHours = 0;
  let totalCommits = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const saved = localStorage.getItem(`${STORAGE_KEYS.code}-${dateStr}`);

    if (saved) {
      const data = JSON.parse(saved);
      totalHours += data.hours || 0;
      totalCommits += data.githubCommits || 0;
    }
  }
  const weeklyStats = { totalHours, totalCommits };
  
  // Get top 3 skills in progress
  const skillsInProgress = ALL_SKILLS.map(skill => ({
    ...skill,
    progress: getSkillProgress(skill.id)
  }))
    .filter(s => s.progress.percentage > 0 && s.progress.percentage < 100)
    .slice(0, 3);

  return (
    <TabTransition>
      {/* Tech Stack Overview Card */}
      <div 
        className="glass-card rounded-2xl p-6 bg-linear-to-br from-accent-cyan/10 to-accent-purple/10 border border-accent-cyan/30 cursor-pointer hover:border-accent-cyan/50 transition-all"
        onClick={() => setView('skills-roadmap')}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-text-primary mb-2 flex items-center gap-2">
              💻 Full Stack Curriculum
            </h3>
            <p className="text-text-secondary text-sm">
              Master 10 technologies. {totalProgress.percentage}% complete.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-accent-cyan font-bold">{totalProgress.completedModules}/{totalProgress.totalModules} modules</span>
              <span className="text-text-muted">•</span>
              <span className="text-accent-purple font-bold">{totalProgress.totalHours}h logged</span>
            </div>
          </div>
          <div className="text-3xl">→</div>
        </div>
        
        {/* Quick skill progress */}
        <div className="mt-4 grid grid-cols-5 gap-2">
          {ALL_SKILLS.slice(0, 5).map(skill => {
            const progress = getSkillProgress(skill.id);
            return (
              <div key={skill.id} className="text-center">
                <div className="text-lg">{skill.icon}</div>
                <div className="text-xs font-medium mt-1" style={{ color: skill.color }}>
                  {progress.percentage}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Coding Stats */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          {EMOJIS.GIT} Today&apos;s Job-Ready Coding
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-bg-secondary/50 rounded-xl p-4 text-center">
            <p className="text-xs text-text-muted uppercase">Hours Coded</p>
            <input
              id="code-hours"
              name="code_hours"
              type="text"
              inputMode="decimal"
              placeholder="1.5"
              value={codeStats.hours || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                  setCodeStats((prev) => ({ ...prev, hours: val === '' ? 0 : parseFloat(val) }));
                }
              }}
              className="w-full bg-transparent text-4xl font-bold text-accent-purple mt-1 text-center focus:outline-none placeholder:text-text-muted/30"
            />
            <span className="text-xs text-text-muted">Target: 2h</span>
          </div>

          <div className="bg-bg-secondary/50 rounded-xl p-4 text-center">
            <p className="text-xs text-text-muted uppercase">GitHub Commits</p>
            <input
              id="code-commits"
              name="code_commits"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="3"
              value={codeStats.githubCommits || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d+$/.test(val)) {
                  setCodeStats((prev) => ({ ...prev, githubCommits: val === '' ? 0 : parseInt(val, 10) }));
                }
              }}
              className="w-full bg-transparent text-4xl font-bold text-accent-green mt-1 text-center focus:outline-none placeholder:text-text-muted/30"
            />
            <span className="text-xs text-text-muted">Today</span>
          </div>
        </div>

        <div className="p-3 bg-bg-secondary/30 rounded-lg">
          <label htmlFor="project-focus" className="text-sm text-text-muted">Current Job-Switch Output</label>
          <input
            id="project-focus"
            type="text"
            value={codeStats.project}
            onChange={(e) => setCodeStats((prev) => ({ ...prev, project: e.target.value }))}
            placeholder="What can directly improve hiring chances today?"
            className="w-full bg-transparent text-lg font-semibold text-text-primary focus:outline-none mt-1 placeholder:text-text-muted"
          />
        </div>
      </div>

      {/* Currently Learning */}
      {skillsInProgress.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-bold text-text-primary mb-4">Currently Learning</h3>
          <div className="space-y-3">
            {skillsInProgress.map(skill => (
              <div 
                key={skill.id}
                className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => setView('skills-roadmap')}
              >
                <span className="text-2xl">{skill.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-text-primary">{skill.name}</span>
                    <span className="text-sm" style={{ color: skill.color }}>
                      {skill.progress.percentage}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-black/30 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${skill.progress.percentage}%`,
                        backgroundColor: skill.color 
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setView('skills-roadmap')}
            className="w-full mt-4 py-2.5 bg-accent-cyan/20 hover:bg-accent-cyan/30 text-accent-cyan rounded-lg transition-colors text-sm font-medium"
          >
            Open Full Curriculum →
          </button>
        </div>
      )}

      {/* Learning Stats - Weekly Aggregated */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-bold text-text-primary mb-4">This Week&apos;s Job-Ready Output</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-white/5 rounded-xl text-center">
            <div className="text-2xl font-bold text-accent-cyan">
              {weeklyStats.totalHours.toFixed(1)}
            </div>
            <div className="text-xs text-text-muted">Hours this week</div>
          </div>
          <div className="p-3 bg-white/5 rounded-xl text-center">
            <div className="text-2xl font-bold text-accent-green">
              {weeklyStats.totalCommits}
            </div>
            <div className="text-xs text-text-muted">Commits this week</div>
          </div>
          <div className="p-3 bg-white/5 rounded-xl text-center col-span-2">
            <div className="text-2xl font-bold text-accent-purple">
              {totalProgress.completedModules}
            </div>
            <div className="text-xs text-text-muted">Total modules completed</div>
          </div>
        </div>
      </div>

      {/* Motivation */}
      <div className="p-4 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30">
        <p className="text-sm text-text-secondary text-center">
          <span className="text-accent-cyan font-medium">Pro tip:</span> Ship outcomes recruiters can see, then log hours. 
          {totalProgress.percentage < 50 
            ? " Small consistent steps lead to mastery." 
            : " You're making great progress! Keep it up!"}
        </p>
      </div>
    </TabTransition>
  );
}

