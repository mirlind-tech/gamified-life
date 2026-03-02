import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const SAVINGS_GOAL = 6000; // Job-switch safety buffer target
const MONTHLY_CHECKPOINTS = [
  { month: 'Jun 2026', amount: 2300, label: 'Stability Floor' },
  { month: 'Sep 2026', amount: 3000, label: 'Momentum Locked' },
  { month: 'Dec 2026', amount: 3700, label: 'Year-End Buffer' },
  { month: 'Mar 2027', amount: 4500, label: 'Interview Freedom' },
  { month: 'Jun 2027', amount: 5200, label: 'Switch Ready' },
  { month: 'Aug 2027', amount: 6000, label: 'Job Switch Safety Fund' },
];
const TARGET_DEADLINE = new Date('2027-08-31');
const TARGET_DEADLINE_LABEL = 'Aug 31, 2027';
const MONTHLY_INCOME = 2000;
const MONTHLY_FOOD_BUDGET = 320;
const FIXED_COSTS = {
  rent: 620,
  phoneInternet: 70,
  gym: 32,
  laptopInsurance: 5,
  aiSubscription: 20,
  kosovoApartment: 700,
};
const MONTHLY_FIXED_TOTAL =
  FIXED_COSTS.rent +
  FIXED_COSTS.phoneInternet +
  FIXED_COSTS.gym +
  FIXED_COSTS.laptopInsurance +
  FIXED_COSTS.aiSubscription +
  FIXED_COSTS.kosovoApartment;
const MONTHLY_SAVINGS_CAPACITY = MONTHLY_INCOME - MONTHLY_FIXED_TOTAL - MONTHLY_FOOD_BUDGET;

interface SavingsData {
  currentAmount: number;
  monthlyContributions: Record<string, number>;
  notes: string;
}

const STORAGE_KEY = 'mirlind-savings-progress';

export function SavingsProgress() {
  const [data, setData] = useState<SavingsData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      currentAmount: 1400,
      monthlyContributions: {},
      notes: ''
    };
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState(data.currentAmount.toString());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const percentage = Math.min(100, (data.currentAmount / SAVINGS_GOAL) * 100);
  const remaining = Math.max(0, SAVINGS_GOAL - data.currentAmount);
  
  // Calculate days until deadline
  const today = new Date();
  const daysLeft = Math.ceil((TARGET_DEADLINE.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const dailySavingsNeeded = daysLeft > 0 ? remaining / daysLeft : 0;
  const monthsLeft = daysLeft > 0 ? daysLeft / 30.44 : 0;
  const requiredMonthlySavings = monthsLeft > 0 ? remaining / monthsLeft : 0;
  const monthlySavingsGap = requiredMonthlySavings - MONTHLY_SAVINGS_CAPACITY;
  const deadlineAtRisk = daysLeft > 0 && requiredMonthlySavings > MONTHLY_SAVINGS_CAPACITY;
  const projectedAtCurrentPace = data.currentAmount + MONTHLY_SAVINGS_CAPACITY * monthsLeft;
  const projectedGap = Math.max(0, SAVINGS_GOAL - projectedAtCurrentPace);

  // Find next checkpoint
  const nextCheckpoint = MONTHLY_CHECKPOINTS.find(c => c.amount > data.currentAmount);
  // const passedCheckpoints = MONTHLY_CHECKPOINTS.filter(c => c.amount <= data.currentAmount);

  const handleSave = () => {
    const amount = parseFloat(editAmount) || 0;
    setData(prev => ({
      ...prev,
      currentAmount: amount,
      monthlyContributions: {
        ...prev.monthlyContributions,
        [new Date().toISOString().slice(0, 7)]: amount
      }
    }));
    setIsEditing(false);
  };

  const getStatus = () => {
    if (percentage >= 100) return { label: 'GOAL REACHED!', color: '#10b981', emoji: '🏆' };
    if (percentage >= 80) return { label: 'Almost there!', color: '#06b6d4', emoji: '🔥' };
    if (percentage >= 50) return { label: 'Halfway there', color: '#f59e0b', emoji: '⛰️' };
    if (percentage >= 25) return { label: 'Building momentum', color: '#f97316', emoji: '📈' };
    return { label: 'Just started', color: '#ef4444', emoji: '🌱' };
  };

  const status = getStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-3xl p-6 mb-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">💰</span>
          <div>
            <h3 className="text-xl font-bold text-text-primary">Job-Switch Savings Buffer</h3>
            <p className="text-xs text-text-muted">
              Target: EUR {SAVINGS_GOAL.toLocaleString()} by {TARGET_DEADLINE_LABEL} (aggressive realistic path)
            </p>
          </div>
        </div>
        <div 
          className="px-3 py-1 rounded-full text-sm font-semibold border"
          style={{ borderColor: status.color, color: status.color, backgroundColor: `${status.color}15` }}
        >
          {status.emoji} {status.label}
        </div>
      </div>

      {/* Main Progress Circle */}
      <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
        <div className="relative">
          <svg width="160" height="160" className="transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="12"
            />
            <motion.circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke={status.color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${(percentage / 100) * 440} 440`}
              initial={{ strokeDashoffset: 440 }}
              animate={{ strokeDashoffset: 440 - ((percentage / 100) * 440) }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              style={{ filter: `drop-shadow(0 0 20px ${status.color}50)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold font-mono" style={{ color: status.color }}>
              {percentage.toFixed(1)}%
            </span>
            <span className="text-xs text-text-muted">Complete</span>
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label htmlFor="savings-amount" className="text-sm text-text-muted block mb-1">Current Savings (€)</label>
                <input
                  id="savings-amount"
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full max-w-50 bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-2xl font-bold text-text-primary focus:outline-none focus:border-accent-green"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 justify-center md:justify-start">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-accent-green text-white rounded-lg font-medium hover:bg-accent-green/80 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditAmount(data.currentAmount.toString());
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-white/10 text-text-secondary rounded-lg hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-4xl font-bold text-text-primary mb-1">
                €{data.currentAmount.toLocaleString()}
              </div>
              <p className="text-text-secondary mb-4">
                of €{SAVINGS_GOAL.toLocaleString()} goal
              </p>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-text-primary rounded-lg transition-colors text-sm"
              >
                Update Amount
              </button>
            </>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-3 bg-white/5 rounded-xl">
              <div className="text-lg font-bold text-accent-yellow">
                €{remaining.toLocaleString()}
              </div>
              <div className="text-xs text-text-muted">Remaining</div>
            </div>
            <div className="p-3 bg-white/5 rounded-xl">
              <div className="text-lg font-bold text-accent-cyan">
                {daysLeft}
              </div>
              <div className="text-xs text-text-muted">Days Left</div>
            </div>
            <div className="p-3 bg-white/5 rounded-xl col-span-2">
              <div className="text-lg font-bold" style={{ color: dailySavingsNeeded > 20 ? '#ef4444' : '#10b981' }}>
                €{dailySavingsNeeded.toFixed(2)}/day
              </div>
              <div className="text-xs text-text-muted">Daily savings needed</div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-black/20 border border-white/10 rounded-xl">
            <div className="text-xs text-text-muted">Budget reality check (includes Kosovo apartment €700/month)</div>
            <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-text-muted text-xs">Current monthly capacity</div>
                <div className="font-bold text-accent-cyan">€{MONTHLY_SAVINGS_CAPACITY.toFixed(0)}</div>
              </div>
              <div>
                <div className="text-text-muted text-xs">Monthly needed for deadline</div>
                <div className={`font-bold ${deadlineAtRisk ? 'text-accent-red' : 'text-accent-green'}`}>
                  €{requiredMonthlySavings.toFixed(0)}
                </div>
              </div>
            </div>
            {deadlineAtRisk && (
              <p className="text-xs text-accent-red mt-2">
                Gap: about €{monthlySavingsGap.toFixed(0)}/month. Increase income or reduce costs to stay on deadline.
              </p>
            )}
            {deadlineAtRisk && (
              <p className="text-xs text-text-muted mt-1">
                At current pace, projected total by deadline: €{projectedAtCurrentPace.toFixed(0)} (short by ~€{projectedGap.toFixed(0)}).
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-text-secondary">Progress to Goal</span>
          <span className="font-bold" style={{ color: status.color }}>{percentage.toFixed(0)}%</span>
        </div>
        <div className="h-4 bg-black/40 rounded-full overflow-hidden relative">
          {/* Checkpoint markers */}
          {MONTHLY_CHECKPOINTS.map((checkpoint) => {
            const checkpointPercent = (checkpoint.amount / SAVINGS_GOAL) * 100;
            const isPassed = data.currentAmount >= checkpoint.amount;
            return (
              <div
                key={checkpoint.month}
                className="absolute top-0 bottom-0 w-0.5 bg-white/30"
                style={{ left: `${checkpointPercent}%` }}
              >
                <div className={`
                  absolute -top-1 -translate-x-1/2 w-2 h-2 rounded-full
                  ${isPassed ? 'bg-green-500' : 'bg-white/30'}
                `} />
              </div>
            );
          })}
          <motion.div
            className="h-full rounded-full relative"
            style={{ backgroundColor: status.color }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </motion.div>
        </div>
      </div>

      {/* Checkpoints */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-text-secondary mb-3">Milestones</h4>
        {MONTHLY_CHECKPOINTS.map((checkpoint) => {
          const isPassed = data.currentAmount >= checkpoint.amount;
          const isNext = !isPassed && (!nextCheckpoint || nextCheckpoint.month === checkpoint.month);
          
          return (
            <div
              key={checkpoint.month}
              className={`
                flex items-center justify-between p-3 rounded-xl border transition-all
                ${isPassed ? 'bg-green-500/10 border-green-500/30' : ''}
                ${isNext ? 'bg-accent-yellow/5 border-accent-yellow/30' : ''}
                ${!isPassed && !isNext ? 'bg-white/5 border-white/5' : ''}
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm
                  ${isPassed ? 'bg-green-500/20 text-green-500' : isNext ? 'bg-accent-yellow/20 text-accent-yellow' : 'bg-white/10 text-text-muted'}
                `}>
                  {isPassed ? '✓' : isNext ? '→' : '○'}
                </div>
                <div>
                  <p className={`font-medium ${isPassed ? 'text-green-500' : isNext ? 'text-text-primary' : 'text-text-muted'}`}>
                    {checkpoint.label}
                  </p>
                  <p className="text-xs text-text-muted">{checkpoint.month}</p>
                </div>
              </div>
              <div className={`font-bold ${isPassed ? 'text-green-500' : isNext ? 'text-accent-yellow' : 'text-text-muted'}`}>
                €{checkpoint.amount.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Motivational Message */}
      <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
        <p className="text-sm text-text-secondary text-center">
          {percentage >= 100 ? (
            <span className="text-green-500 font-medium">🏆 Incredible! You've reached your savings goal!</span>
          ) : percentage >= 80 ? (
            <span>🔥 Final stretch! Keep pushing, you're almost there!</span>
          ) : percentage >= 50 ? (
            <span>⛰️ Halfway point passed! Maintain this momentum!</span>
          ) : percentage >= 25 ? (
            <span>📈 Good start! Consistency is key to building your safety buffer.</span>
          ) : (
            <span>🌱 Every euro counts. Start building your safety net today!</span>
          )}
        </p>
      </div>
    </motion.div>
  );
}



