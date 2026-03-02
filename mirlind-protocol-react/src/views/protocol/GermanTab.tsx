import { TabTransition } from '../../components/animations';
import type { GermanTabProps, ProgressStepProps, ProgressStatus } from './types';
import { B1Countdown } from '../../components/B1Countdown';
import { Save } from 'lucide-react';

export function GermanTab({ germanStats, setGermanStats, onSave, isSaving, streak }: GermanTabProps) {
  return (
    <TabTransition>
      {/* Header with Save Button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gradient">🇩🇪 German Training</h2>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-accent-purple hover:bg-accent-purple/80 disabled:opacity-50 rounded-lg text-white font-medium transition-colors"
        >
          <Save size={18} />
          {isSaving ? 'Saving...' : 'Save Progress'}
        </button>
      </div>

      {/* B1 Countdown Dashboard - Premium Component */}
      <B1Countdown 
        wordsLearned={germanStats.totalWords}
        ankiStreak={germanStats.ankiStreak}
      />

      {/* Anki Stats */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          🧠 Anki Daily Stats
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-bg-secondary/50 rounded-xl p-4">
            <label htmlFor="anki-cards" className="text-xs text-text-muted uppercase">Cards Today</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                id="anki-cards"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="50"
                value={germanStats.ankiCards || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d+$/.test(val)) {
                    setGermanStats((prev) => ({ ...prev, ankiCards: val === '' ? 0 : parseInt(val, 10) }));
                  }
                }}
                className="w-20 bg-transparent text-3xl font-bold text-text-primary focus:outline-none placeholder:text-text-muted/30"
              />
              <span className="text-accent-green text-sm">/ 70</span>
            </div>
          </div>

          <div className="bg-bg-secondary/50 rounded-xl p-4">
            <label htmlFor="anki-time" className="text-xs text-text-muted uppercase">Study Time</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                id="anki-time"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="15"
                value={germanStats.ankiTime || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d+$/.test(val)) {
                    setGermanStats((prev) => ({ ...prev, ankiTime: val === '' ? 0 : parseInt(val, 10) }));
                  }
                }}
                className="w-20 bg-transparent text-3xl font-bold text-text-primary focus:outline-none placeholder:text-text-muted/30"
              />
              <span className="text-text-muted">min</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-bg-secondary/50 rounded-xl p-4">
            <span className="text-xs text-text-muted uppercase">Current Streak</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-3xl font-bold text-accent-cyan">{streak}</span>
              <span className="text-text-muted">days</span>
            </div>
            <span className="text-xs text-text-muted/60 mt-1 block">Auto-calculated from activity</span>
          </div>

          <div className="bg-bg-secondary/50 rounded-xl p-4">
            <label htmlFor="total-words" className="text-xs text-text-muted uppercase">Total Words</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                id="total-words"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="500"
                value={germanStats.totalWords || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d+$/.test(val)) {
                    setGermanStats((prev) => ({ ...prev, totalWords: val === '' ? 0 : parseInt(val, 10) }));
                  }
                }}
                className="w-20 bg-transparent text-3xl font-bold text-accent-green focus:outline-none placeholder:text-text-muted/30"
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
            <label htmlFor="lesson-completed" className="text-text-primary cursor-pointer">Lesson Completed Today</label>
            <input
              id="lesson-completed"
              type="checkbox"
              checked={germanStats.languageTransfer}
              onChange={(e) => setGermanStats((prev) => ({ ...prev, languageTransfer: e.target.checked }))}
              className="w-6 h-6 accent-accent-purple"
            />
          </div>
          
          <div className="p-3 bg-bg-secondary/30 rounded-lg">
            <label htmlFor="lesson-number" className="text-sm text-text-muted">Current Lesson Number</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                id="lesson-number"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="25"
                value={germanStats.languageTransferLesson || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d+$/.test(val)) {
                    setGermanStats((prev) => ({ ...prev, languageTransferLesson: val === '' ? 0 : parseInt(val, 10) }));
                  }
                }}
                className="w-20 bg-transparent text-2xl font-bold text-text-primary focus:outline-none placeholder:text-text-muted/30"
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
            <label htmlFor="radio-hours" className="text-sm text-text-muted">Radio/Audiobook Hours</label>
            <input
              id="radio-hours"
              type="text"
              inputMode="decimal"
              placeholder="2.5"
              value={germanStats.radioHours || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                  setGermanStats((prev) => ({ ...prev, radioHours: val === '' ? 0 : parseFloat(val) }));
                }
              }}
              className="w-full bg-transparent text-xl font-bold text-text-primary focus:outline-none mt-1 placeholder:text-text-muted/30"
            />
            <span className="text-xs text-accent-green">Target: 10h/day (work + commute)</span>
          </div>

          <div className="p-3 bg-bg-secondary/30 rounded-lg">
            <label htmlFor="tandem-minutes" className="text-sm text-text-muted">Tandem Session (minutes)</label>
            <input
              id="tandem-minutes"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="45"
              value={germanStats.tandemMinutes || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d+$/.test(val)) {
                  setGermanStats((prev) => ({ ...prev, tandemMinutes: val === '' ? 0 : parseInt(val, 10) }));
                }
              }}
              className="w-full bg-transparent text-xl font-bold text-text-primary focus:outline-none mt-1 placeholder:text-text-muted/30"
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
    </TabTransition>
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
