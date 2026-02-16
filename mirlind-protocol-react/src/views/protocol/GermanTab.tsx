import { motion } from 'framer-motion';
import type { GermanTabProps, ProgressStepProps, ProgressStatus } from './types';

export function GermanTab({ germanStats, setGermanStats }: GermanTabProps) {
  const b1Deadline = new Date('2026-12-31');
  const today = new Date();
  const daysLeft = Math.ceil((b1Deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate progress to B1
  const wordsNeeded = 3000;
  const progressPercent = Math.min(100, (germanStats.totalWords / wordsNeeded) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* B1 Countdown Dashboard */}
      <div className="glass-card rounded-2xl p-6 bg-linear-to-br from-accent-yellow/10 via-accent-orange/10 to-accent-red/10 border border-accent-yellow/30">
        <div className="text-center mb-6">
          <h3 className="text-lg text-text-secondary mb-2">🇩🇪 B1 CERTIFICATE COUNTDOWN</h3>
          <div className="text-6xl font-bold text-accent-yellow mb-2">{daysLeft}</div>
          <p className="text-text-muted">days until December 31, 2026</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-accent-green">{germanStats.totalWords}</div>
            <div className="text-xs text-text-muted">words learned</div>
            <div className="text-xs text-accent-green">Goal: {wordsNeeded}</div>
          </div>
          <div className="bg-black/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-accent-cyan">{germanStats.ankiStreak}</div>
            <div className="text-xs text-text-muted">day streak</div>
            <div className="text-xs text-accent-cyan">Goal: 365</div>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between text-xs text-text-muted mb-1">
            <span>B1 Progress</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 bg-black/30 rounded-full overflow-hidden">
            <div className="h-full bg-accent-yellow rounded-full" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Anki Stats */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          🧠 Anki Daily Stats
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-bg-secondary/50 rounded-xl p-4">
            <label className="text-xs text-text-muted uppercase">Cards Today</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                value={germanStats.ankiCards}
                onChange={(e) => setGermanStats((prev) => ({ ...prev, ankiCards: Number(e.target.value) }))}
                className="w-20 bg-transparent text-3xl font-bold text-text-primary focus:outline-none"
              />
              <span className="text-accent-green text-sm">/ 70</span>
            </div>
          </div>

          <div className="bg-bg-secondary/50 rounded-xl p-4">
            <label className="text-xs text-text-muted uppercase">Study Time</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                value={germanStats.ankiTime}
                onChange={(e) => setGermanStats((prev) => ({ ...prev, ankiTime: Number(e.target.value) }))}
                className="w-20 bg-transparent text-3xl font-bold text-text-primary focus:outline-none"
              />
              <span className="text-text-muted">min</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-bg-secondary/50 rounded-xl p-4">
            <label className="text-xs text-text-muted uppercase">Current Streak</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                value={germanStats.ankiStreak}
                onChange={(e) => setGermanStats((prev) => ({ ...prev, ankiStreak: Number(e.target.value) }))}
                className="w-20 bg-transparent text-3xl font-bold text-accent-cyan focus:outline-none"
              />
              <span className="text-text-muted">days</span>
            </div>
          </div>

          <div className="bg-bg-secondary/50 rounded-xl p-4">
            <label className="text-xs text-text-muted uppercase">Total Words</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                value={germanStats.totalWords}
                onChange={(e) => setGermanStats((prev) => ({ ...prev, totalWords: Number(e.target.value) }))}
                className="w-20 bg-transparent text-3xl font-bold text-accent-green focus:outline-none"
              />
              <span className="text-text-muted">words</span>
            </div>
          </div>
        </div>
      </div>

      {/* Language Transfer */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          🎧 Language Transfer Progress
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-bg-secondary/30 rounded-lg">
            <span className="text-text-primary">Lesson Completed Today</span>
            <input
              type="checkbox"
              checked={germanStats.languageTransfer}
              onChange={(e) => setGermanStats((prev) => ({ ...prev, languageTransfer: e.target.checked }))}
              className="w-6 h-6 accent-accent-purple"
            />
          </div>
          
          <div className="p-3 bg-bg-secondary/30 rounded-lg">
            <label className="text-sm text-text-muted">Current Lesson Number</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                value={germanStats.languageTransferLesson}
                onChange={(e) => setGermanStats((prev) => ({ ...prev, languageTransferLesson: Number(e.target.value) }))}
                className="w-20 bg-transparent text-2xl font-bold text-text-primary focus:outline-none"
              />
              <span className="text-text-muted">/ 90 lessons</span>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-text-muted">
                <span>Progress</span>
                <span>{Math.round((germanStats.languageTransferLesson / 90) * 100)}%</span>
              </div>
              <div className="h-1 bg-black/30 rounded-full mt-1">
                <div className="h-full bg-accent-purple rounded-full" style={{ width: `${(germanStats.languageTransferLesson / 90) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Immersion Stats */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          📻 Daily Immersion
        </h3>

        <div className="space-y-4">
          <div className="p-3 bg-bg-secondary/30 rounded-lg">
            <label className="text-sm text-text-muted">Radio/Audiobook Hours</label>
            <input
              type="number"
              step="0.5"
              value={germanStats.radioHours}
              onChange={(e) => setGermanStats((prev) => ({ ...prev, radioHours: Number(e.target.value) }))}
              className="w-full bg-transparent text-xl font-bold text-text-primary focus:outline-none mt-1"
            />
            <span className="text-xs text-accent-green">Target: 10h/day (work + commute)</span>
          </div>

          <div className="p-3 bg-bg-secondary/30 rounded-lg">
            <label className="text-sm text-text-muted">Tandem Session (minutes)</label>
            <input
              type="number"
              value={germanStats.tandemMinutes}
              onChange={(e) => setGermanStats((prev) => ({ ...prev, tandemMinutes: Number(e.target.value) }))}
              className="w-full bg-transparent text-xl font-bold text-text-primary focus:outline-none mt-1"
            />
            <span className="text-xs text-accent-green">Target: 3h/week (starting May)</span>
          </div>
        </div>
      </div>

      {/* Progress Roadmap */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-bold text-text-primary mb-4">A0 → B1 Roadmap</h3>
        <div className="space-y-4">
          <ProgressStep
            label="Phase 1: Foundation (A1)"
            period="Feb - Apr 2026"
            status="in-progress"
            tasks={["Language Transfer daily", "Anki 50 cards/day", "Radio 10h/day"]}
          />
          <ProgressStep
            label="Phase 2: Acceleration (A2)"
            period="May - Aug 2026"
            status="pending"
            tasks={["Tandem 3h/week", "Nicos Weg A2", "Active speaking"]}
          />
          <ProgressStep
            label="Phase 3: B1 Conquest"
            period="Sep - Dec 2026"
            status="pending"
            tasks={["B1 exam prep", "Practice tests", "Certificate exam"]}
          />
        </div>
      </div>
    </motion.div>
  );
}

function ProgressStep({ label, period, status, tasks }: ProgressStepProps) {
  const colors: Record<ProgressStatus, string> = {
    completed: 'border-accent-green text-accent-green',
    'in-progress': 'border-accent-yellow text-accent-yellow',
    pending: 'border-text-muted text-text-muted',
  };

  const emojis = {
    completed: '✅',
    'in-progress': '🔥',
    pending: '⏳',
  };

  return (
    <div className={`border-l-4 pl-4 py-2 ${colors[status]}`}>
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold">{label}</h4>
          <p className="text-sm opacity-70">{period}</p>
        </div>
        <span className={status === 'in-progress' ? 'animate-pulse' : ''}>
          {emojis[status]}
        </span>
      </div>
      <ul className="mt-2 space-y-1">
        {tasks.map((task, i) => (
          <li key={i} className="text-sm opacity-80 flex items-center gap-2">
            <span>•</span> {task}
          </li>
        ))}
      </ul>
    </div>
  );
}
