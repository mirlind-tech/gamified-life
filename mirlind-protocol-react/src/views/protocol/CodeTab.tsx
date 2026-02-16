import { motion } from 'framer-motion';
import { EMOJIS } from '../../utils/emojis';
import type { CodeTabProps } from './types';

const SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL',
  'Git', 'Docker', 'System Design', 'Rust', 'Python'
] as const;

export function CodeTab({ codeStats, setCodeStats }: CodeTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* GitHub Stats */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          {EMOJIS.GIT} Today&apos;s Coding
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-bg-secondary/50 rounded-xl p-4 text-center">
            <label className="text-xs text-text-muted uppercase">Hours Coded</label>
            <div className="text-4xl font-bold text-accent-purple mt-1">
              {codeStats.hours}
            </div>
            <span className="text-xs text-text-muted">Target: 2h</span>
          </div>

          <div className="bg-bg-secondary/50 rounded-xl p-4 text-center">
            <label className="text-xs text-text-muted uppercase">GitHub Commits</label>
            <div className="text-4xl font-bold text-accent-green mt-1">
              {codeStats.githubCommits}
            </div>
            <span className="text-xs text-text-muted">Today</span>
          </div>
        </div>

        <div className="p-3 bg-bg-secondary/30 rounded-lg">
          <label className="text-sm text-text-muted">Current Project</label>
          <input
            type="text"
            value={codeStats.project}
            onChange={(e) => setCodeStats((prev) => ({ ...prev, project: e.target.value }))}
            className="w-full bg-transparent text-lg font-semibold text-text-primary focus:outline-none mt-1"
          />
        </div>
      </div>

      {/* Skills Checklist */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-bold text-text-primary mb-4">Skills to Master</h3>
        <div className="grid grid-cols-2 gap-2">
          {SKILLS.map((skill) => (
            <label key={skill} className="flex items-center gap-2 p-2 bg-bg-secondary/30 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={codeStats.skills.includes(skill)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setCodeStats((prev) => ({ ...prev, skills: [...prev.skills, skill] }));
                  } else {
                    setCodeStats((prev) => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
                  }
                }}
                className="accent-accent-purple"
              />
              <span className={`text-sm ${codeStats.skills.includes(skill) ? 'text-accent-green' : 'text-text-secondary'}`}>
                {skill}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Job Hunt Tracker */}
      <div className="glass-card rounded-2xl p-6 border border-accent-cyan/30">
        <h3 className="text-lg font-bold text-accent-cyan mb-4">{EMOJIS.TARGET} Job Hunt Progress</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-text-secondary">Applications Sent</span>
            <span className="text-text-primary font-bold">0 / 50</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Interviews</span>
            <span className="text-text-primary font-bold">0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Offers</span>
            <span className="text-accent-green font-bold">0</span>
          </div>
          <div className="mt-4 p-3 bg-accent-cyan/10 rounded-lg">
            <p className="text-sm text-text-secondary">Deadline: September 30, 2026</p>
            <p className="text-xs text-text-muted mt-1">Start applying: June 1, 2026</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
