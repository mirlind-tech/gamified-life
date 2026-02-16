import { useState } from 'react';
import { motion } from 'framer-motion';
import { AchievementsList } from '../../components/AchievementBadge';
import type { WeeklyTabProps } from './types';

interface ScoreCategory {
  key: 'body' | 'mind' | 'german' | 'code' | 'finance' | 'protocol';
  label: string;
  icon: string;
  weight: number;
  questions: string[];
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
      'Stayed under €63.75 food budget?',
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
  const [scores, setScores] = useState({
    body: 5,
    mind: 5,
    german: 5,
    code: 5,
    finance: 5,
    protocol: 5,
  });

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const maxScore = 60; // 6 categories x 10
  const percentage = (totalScore / maxScore) * 100;

  const grade = getGrade(totalScore);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Weekly Score Header */}
      <div className="glass-card rounded-2xl p-6 bg-linear-to-br from-accent-purple/20 to-accent-cyan/20 border border-accent-purple/30">
        <div className="text-center">
          <h3 className="text-lg text-text-secondary mb-2">📊 WEEKLY SCORECARD</h3>
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
            Rate yourself 1-10 on each category. Target: 80+ points weekly.
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
                  value={scores[cat.key]}
                  onChange={(e) => setScores(prev => ({ ...prev, [cat.key]: Number(e.target.value) }))}
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
                  <span className="text-accent-green">✓</span>
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
            <label className="text-sm text-text-muted">What was your biggest win this week?</label>
            <textarea 
              className="w-full mt-2 p-3 bg-bg-secondary/50 rounded-lg text-text-primary text-sm focus:outline-none"
              rows={2}
              placeholder="I crushed my..."
            />
          </div>
          <div>
            <label className="text-sm text-text-muted">What weakness will you attack next week?</label>
            <textarea 
              className="w-full mt-2 p-3 bg-bg-secondary/50 rounded-lg text-text-primary text-sm focus:outline-none"
              rows={2}
              placeholder="I need to improve..."
            />
          </div>
          <div>
            <label className="text-sm text-text-muted">Fang Yuan Principle Applied:</label>
            <select className="w-full mt-2 p-3 bg-bg-secondary/50 rounded-lg text-text-primary text-sm focus:outline-none">
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
            <input type="checkbox" className="w-5 h-5 accent-accent-purple" />
            <span className="text-text-primary">Hit all 4 workouts (no excuses)</span>
          </label>
          <label className="flex items-center gap-3 p-3 bg-bg-secondary/30 rounded-lg cursor-pointer">
            <input type="checkbox" className="w-5 h-5 accent-accent-purple" />
            <span className="text-text-primary">Anki 50 cards every single day</span>
          </label>
          <label className="flex items-center gap-3 p-3 bg-bg-secondary/30 rounded-lg cursor-pointer">
            <input type="checkbox" className="w-5 h-5 accent-accent-purple" />
            <span className="text-text-primary">10+ hours coding (project work)</span>
          </label>
          <label className="flex items-center gap-3 p-3 bg-bg-secondary/30 rounded-lg cursor-pointer">
            <input type="checkbox" className="w-5 h-5 accent-accent-purple" />
            <span className="text-text-primary">Stay under €63.75 food budget</span>
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
    </motion.div>
  );
}
