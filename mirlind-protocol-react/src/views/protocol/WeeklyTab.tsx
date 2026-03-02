import { useCallback, useState } from 'react';
import { Check, Save } from 'lucide-react';
import { TabTransition } from '../../components/animations';
import { AchievementsList } from '../../components/AchievementBadge';
import type { WeeklyTabProps } from './types';

const STORAGE_KEY = 'mirlind-protocol-weekly';

interface ScoreCategory {
  key: 'body' | 'mind' | 'german' | 'code' | 'finance' | 'protocol';
  label: string;
  icon: string;
  weight: number;
  questions: string[];
}

interface WeeklyData {
  scores: {
    body: number;
    mind: number;
    german: number;
    code: number;
    finance: number;
    protocol: number;
  };
  biggestWin: string;
  weaknessToAttack: string;
  fangYuanPrinciple: string;
  actionItems: {
    workouts: boolean;
    anki: boolean;
    coding: boolean;
    budget: boolean;
  };
}

const DEFAULT_WEEKLY_DATA: WeeklyData = {
  scores: {
    body: 5,
    mind: 5,
    german: 5,
    code: 5,
    finance: 5,
    protocol: 5,
  },
  biggestWin: '',
  weaknessToAttack: '',
  fangYuanPrinciple: 'Strength is the only virtue',
  actionItems: {
    workouts: false,
    anki: false,
    coding: false,
    budget: false,
  },
};

function loadWeeklyData(): WeeklyData {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return DEFAULT_WEEKLY_DATA;

  try {
    const parsed = JSON.parse(saved) as Partial<WeeklyData>;
    return {
      ...DEFAULT_WEEKLY_DATA,
      ...parsed,
      scores: {
        ...DEFAULT_WEEKLY_DATA.scores,
        ...parsed.scores,
      },
      actionItems: {
        ...DEFAULT_WEEKLY_DATA.actionItems,
        ...parsed.actionItems,
      },
    };
  } catch {
    return DEFAULT_WEEKLY_DATA;
  }
}

const CATEGORIES: ScoreCategory[] = [
  {
    key: 'body',
    label: 'BODY (Baki Protocol)',
    icon: '💪',
    weight: 20,
    questions: [
      'Did you train 4x this week?',
      'Did you eat 150g+ protein daily?',
      'Did you sleep 8h every night?',
    ],
  },
  {
    key: 'mind',
    label: 'MIND (Fang Yuan)',
    icon: '🧠',
    weight: 20,
    questions: [
      'No wasted time on distractions?',
      'Maintained discipline all week?',
      'Attacked a weakness daily?',
    ],
  },
  {
    key: 'german',
    label: 'GERMAN (B1 Goal)',
    icon: '🇩🇪',
    weight: 20,
    questions: [
      'Anki streak maintained?',
      'Language Transfer complete?',
      'Radio 10h/day all week?',
    ],
  },
  {
    key: 'code',
    label: 'CODE (Job Goal)',
    icon: '💻',
    weight: 20,
    questions: [
      '10+ hours coded this week?',
      'GitHub commits pushed?',
      'Progress on portfolio?',
    ],
  },
  {
    key: 'finance',
    label: 'FINANCE',
    icon: '💰',
    weight: 10,
    questions: [
      'Stayed under EUR 73.90 weekly food budget?',
      'No unnecessary expenses?',
      'Savings on track?',
    ],
  },
  {
    key: 'protocol',
    label: 'PROTOCOL',
    icon: '⏰',
    weight: 10,
    questions: [
      'Woke at 05:00 all week?',
      'No snooze button?',
      'Sleep by 22:00?',
    ],
  },
];

interface Grade {
  label: string;
  color: string;
  emoji: string;
}

function getGrade(score: number): Grade {
  if (score >= 54) return { label: 'EXCELLENT', color: 'text-accent-green', emoji: '👑' };
  if (score >= 48) return { label: 'GOOD', color: 'text-accent-cyan', emoji: '💪' };
  if (score >= 36) return { label: 'AVERAGE', color: 'text-accent-yellow', emoji: '⚠️' };
  return { label: 'CRISIS', color: 'text-accent-red', emoji: '🚨' };
}

export function WeeklyTab({ achievements, newUnlocks }: WeeklyTabProps) {
  const [weeklyData, setWeeklyData] = useState<WeeklyData>(() => loadWeeklyData());
  const [isSaved, setIsSaved] = useState(true);

  const updateWeeklyData = useCallback((updater: (prev: WeeklyData) => WeeklyData) => {
    setIsSaved(false);
    setWeeklyData(prev => {
      const next = updater(prev);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    queueMicrotask(() => setIsSaved(true));
  }, []);

  const { scores, biggestWin, weaknessToAttack, fangYuanPrinciple, actionItems } = weeklyData;

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const maxScore = 60; // 6 categories * 10 points each
  const percentage = (totalScore / maxScore) * 100;

  const grade = getGrade(totalScore);

  return (
    <TabTransition>
      {/* Weekly Score Header */}
      <div className="glass-card rounded-2xl p-6 bg-linear-to-br from-accent-purple/20 to-accent-cyan/20 border border-accent-purple/30">
        <div className="text-center">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg text-text-secondary">📊 WEEKLY SCORECARD</h3>
            <div className={`flex items-center gap-1 text-xs ${isSaved ? 'text-accent-green' : 'text-accent-yellow'}`}>
              <Save className="w-3 h-3" />
              {isSaved ? 'Saved' : 'Unsaved'}
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-4xl">{grade.emoji}</span>
            <div className="text-6xl font-bold text-text-primary">{totalScore}</div>
            <span className="text-2xl text-text-muted">/ {maxScore}</span>
          </div>
          <div className={`text-xl font-bold ${grade.color} mb-2`}>{grade.label}</div>
          <div className="h-3 bg-black/30 rounded-full overflow-hidden max-w-xs mx-auto">
            <div
              className="h-full bg-linear-to-r from-accent-purple to-accent-cyan rounded-full transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-xs text-text-muted mt-2">
            Rate yourself 1-10 on each category. Target: 48+ points weekly.
          </p>
        </div>
      </div>

      {/* Score Categories */}
      <div className="space-y-4">
        {CATEGORIES.map((cat) => (
          <div key={cat.key} className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.icon}</span>
                <div>
                  <h4 className="font-bold text-text-primary">{cat.label}</h4>
                  <span className="text-xs text-text-muted">Weight: {cat.weight}%</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  aria-label={`${cat.label} score`}
                  value={scores[cat.key]}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    updateWeeklyData(prev => ({
                      ...prev,
                      scores: { ...prev.scores, [cat.key]: value },
                    }));
                  }}
                  className="w-24 accent-accent-purple"
                />
                <span className="w-8 text-right font-bold text-2xl text-accent-cyan">
                  {scores[cat.key]}
                </span>
              </div>
            </div>

            <div className="space-y-1 pl-11">
              {cat.questions.map((q, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-text-secondary">
                  <Check className="w-4 h-4 text-accent-green" />
                  <span>{q}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Weekly Summary */}
      <div className="glass-card rounded-2xl p-6 border border-accent-yellow/30">
        <h3 className="text-lg font-bold text-accent-yellow mb-4">📝 Weekly Reflection</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="weekly-win" className="text-sm text-text-muted">What was your biggest win this week?</label>
            <textarea
              id="weekly-win"
              value={biggestWin}
              onChange={(e) => {
                const value = e.target.value;
                updateWeeklyData(prev => ({ ...prev, biggestWin: value }));
              }}
              className="w-full mt-2 p-3 bg-bg-secondary/50 rounded-lg text-text-primary text-sm focus:outline-none"
              rows={2}
              placeholder="I crushed my..."
            />
          </div>
          <div>
            <label htmlFor="weekly-weakness" className="text-sm text-text-muted">What weakness will you attack next week?</label>
            <textarea
              id="weekly-weakness"
              value={weaknessToAttack}
              onChange={(e) => {
                const value = e.target.value;
                updateWeeklyData(prev => ({ ...prev, weaknessToAttack: value }));
              }}
              className="w-full mt-2 p-3 bg-bg-secondary/50 rounded-lg text-text-primary text-sm focus:outline-none"
              rows={2}
              placeholder="I need to improve..."
            />
          </div>
          <div>
            <label htmlFor="fang-yuan-principle" className="text-sm text-text-muted">Fang Yuan Principle Applied:</label>
            <select
              id="fang-yuan-principle"
              value={fangYuanPrinciple}
              onChange={(e) => {
                const value = e.target.value;
                updateWeeklyData(prev => ({ ...prev, fangYuanPrinciple: value }));
              }}
              className="cyber-select w-full mt-2 p-3 rounded-lg text-text-primary text-sm focus:outline-none"
            >
              <option>Strength is the only virtue</option>
              <option>Detach from emotion</option>
              <option>Never depend on luck</option>
              <option>Sacrifice present for future</option>
              <option>Be ruthless with yourself</option>
              <option>No shortcuts, only discipline</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-bold text-text-primary mb-4">🎯 Next Week Focus</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 bg-bg-secondary/30 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={actionItems.workouts}
              onChange={(e) => {
                const checked = e.target.checked;
                updateWeeklyData(prev => ({
                  ...prev,
                  actionItems: { ...prev.actionItems, workouts: checked },
                }));
              }}
              aria-label="Hit all 4 workouts (no excuses)"
              className="w-5 h-5 accent-accent-purple"
            />
            <span className="text-text-primary">Hit all 4 workouts (no excuses)</span>
          </label>
          <label className="flex items-center gap-3 p-3 bg-bg-secondary/30 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={actionItems.anki}
              onChange={(e) => {
                const checked = e.target.checked;
                updateWeeklyData(prev => ({
                  ...prev,
                  actionItems: { ...prev.actionItems, anki: checked },
                }));
              }}
              aria-label="Anki 50 cards every single day"
              className="w-5 h-5 accent-accent-purple"
            />
            <span className="text-text-primary">Anki 50 cards every single day</span>
          </label>
          <label className="flex items-center gap-3 p-3 bg-bg-secondary/30 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={actionItems.coding}
              onChange={(e) => {
                const checked = e.target.checked;
                updateWeeklyData(prev => ({
                  ...prev,
                  actionItems: { ...prev.actionItems, coding: checked },
                }));
              }}
              aria-label="10+ hours coding (project work)"
              className="w-5 h-5 accent-accent-purple"
            />
            <span className="text-text-primary">10+ hours coding (project work)</span>
          </label>
          <label className="flex items-center gap-3 p-3 bg-bg-secondary/30 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={actionItems.budget}
              onChange={(e) => {
                const checked = e.target.checked;
                updateWeeklyData(prev => ({
                  ...prev,
                  actionItems: { ...prev.actionItems, budget: checked },
                }));
              }}
              aria-label="Stay under EUR 73.90 weekly food budget"
              className="w-5 h-5 accent-accent-purple"
            />
            <span className="text-text-primary">Stay under EUR 73.90 weekly food budget</span>
          </label>
        </div>
      </div>

      {/* Achievements */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-bold text-text-primary mb-4">🏆 Achievements</h3>
        <AchievementsList
          achievements={achievements}
          newUnlocks={newUnlocks}
        />
      </div>
    </TabTransition>
  );
}
