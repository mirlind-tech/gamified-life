import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, Award, Activity, Calendar } from 'lucide-react';
import type { ViewType } from '../types';
import { EMOJIS } from '../utils/emojis';

interface WeightEntry {
  id: string;
  date: string;
  weight: number;
  notes?: string;
}

interface XPLogEntry {
  id: string;
  date: string;
  amount: number;
  source: string;
  description: string;
}

interface ChartsViewProps {
  setView: (view: ViewType) => void;
}

// Weight Chart Component
function WeightChart({ data }: { data: WeightEntry[] }) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500">
        <span className="text-xl mr-2">{EMOJIS.INFO}</span>
        <span>Need at least 2 data points</span>
      </div>
    );
  }

  const weights = data.map(e => e.weight);
  const min = Math.min(...weights) - 0.5;
  const max = Math.max(...weights) + 0.5;
  const range = max - min || 1;
  
  const width = 600;
  const height = 200;
  const padding = 20;
  
  const points = data.map((entry, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((entry.weight - min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-125" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => (
          <line
            key={pct}
            x1={padding}
            y1={height - padding - pct * (height - 2 * padding)}
            x2={width - padding}
            y2={height - padding - pct * (height - 2 * padding)}
            stroke="#334155"
            strokeDasharray="4"
          />
        ))}
        
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="3"
        />
        
        {/* Data points */}
        {data.map((entry, i) => {
          const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
          const y = height - padding - ((entry.weight - min) / range) * (height - 2 * padding);
          return (
            <g key={entry.id}>
              <circle cx={x} cy={y} r="5" fill="#8b5cf6" stroke="#1e293b" strokeWidth="2" />
              <title>{`${entry.date}: ${entry.weight}kg${entry.notes ? ` - ${entry.notes}` : ''}`}</title>
            </g>
          );
        })}
        
        {/* Y-axis labels */}
        <text x="10" y={padding} fill="#94a3b8" fontSize="12">{max.toFixed(1)}</text>
        <text x="10" y={height - padding} fill="#94a3b8" fontSize="12">{min.toFixed(1)}</text>
        <text x="10" y={height / 2} fill="#94a3b8" fontSize="12">{((min + max) / 2).toFixed(1)}</text>
      </svg>
    </div>
  );
}

// XP Chart Component
function XPChart({ data }: { data: XPLogEntry[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-500">
        <span className="text-xl mr-2">{EMOJIS.INFO}</span>
        <span>No XP data available</span>
      </div>
    );
  }

  // Group by date
  const byDate: Record<string, number> = {};
  data.forEach(e => {
    byDate[e.date] = (byDate[e.date] || 0) + e.amount;
  });
  
  const dates = Object.keys(byDate).sort();
  const maxXP = Math.max(...Object.values(byDate));
  
  return (
    <div className="flex items-end gap-1 h-32 overflow-x-auto">
      {dates.map(date => {
        const amount = byDate[date];
        const height = maxXP > 0 ? (amount / maxXP) * 100 : 0;
        return (
          <div
            key={date}
            className="flex-1 min-w-2 bg-emerald-500/60 hover:bg-emerald-500 rounded-t transition-all relative group"
            style={{ height: `${Math.max(height, 5)}%` }}
          >
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-800 text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
              {date}: {amount} XP
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Generate sample XP data for the past 30 days
function generateSampleXPData(): XPLogEntry[] {
  const data: XPLogEntry[] = [];
  const sources = ['Daily Quest', 'Pillar Completion', 'Principle Unlock', 'Challenge', 'Skill Progress'];
  const descriptions = [
    'Completed daily German lesson',
    'Finished workout session',
    'Read for 30 minutes',
    'Unlocked new principle',
    'Completed skill stage',
    'Weekly challenge done',
    'Meditation streak',
    'Coding practice'
  ];
  
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Add 1-3 XP entries per day
    const entriesCount = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < entriesCount; j++) {
      data.push({
        id: `xp-${i}-${j}`,
        date: date.toISOString().split('T')[0],
        amount: [50, 75, 100, 150, 200, 250][Math.floor(Math.random() * 6)],
        source: sources[Math.floor(Math.random() * sources.length)],
        description: descriptions[Math.floor(Math.random() * descriptions.length)]
      });
    }
  }
  return data;
}

export default function ChartsView({ setView }: ChartsViewProps) {
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [xpLog, setXpLog] = useState<XPLogEntry[]>([]);
  const [newWeight, setNewWeight] = useState('');
  const [newNote, setNewNote] = useState('');
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [weightTimeRange, setWeightTimeRange] = useState<'1m' | '3m' | '6m' | '1y'>('3m');
  const [xpTimeRange, setXpTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Load data from localStorage
  useEffect(() => {
    const savedWeights = localStorage.getItem('mirlind-weight-data');
    if (savedWeights) {
      setTimeout(() => setWeightEntries(JSON.parse(savedWeights)), 0);
    } else {
      // Initialize with some sample data
      const sampleData: WeightEntry[] = [
        { id: '1', date: '2026-01-01', weight: 78.5, notes: 'Starting point' },
        { id: '2', date: '2026-01-08', weight: 78.2 },
        { id: '3', date: '2026-01-15', weight: 77.8 },
        { id: '4', date: '2026-01-22', weight: 77.5 },
        { id: '5', date: '2026-01-29', weight: 77.0 },
        { id: '6', date: '2026-02-05', weight: 76.8 },
        { id: '7', date: '2026-02-12', weight: 76.5 },
      ];
      setTimeout(() => setWeightEntries(sampleData), 0);
      localStorage.setItem('mirlind-weight-data', JSON.stringify(sampleData));
    }

    const savedXP = localStorage.getItem('mirlind-xp-log');
    if (savedXP) {
      setTimeout(() => setXpLog(JSON.parse(savedXP)), 0);
    } else {
      const sampleXP = generateSampleXPData();
      setTimeout(() => setXpLog(sampleXP), 0);
      localStorage.setItem('mirlind-xp-log', JSON.stringify(sampleXP));
    }
  }, []);

  // Save weight entries
  const saveWeightEntries = (entries: WeightEntry[]) => {
    setWeightEntries(entries);
    localStorage.setItem('mirlind-weight-data', JSON.stringify(entries));
  };

  // Add new weight entry
  const addWeightEntry = () => {
    if (!newWeight) return;
    
    const entry: WeightEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      weight: parseFloat(newWeight),
      notes: newNote || undefined
    };
    
    const updated = [...weightEntries, entry].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    saveWeightEntries(updated);
    setNewWeight('');
    setNewNote('');
    setShowAddWeight(false);
  };

  // Delete weight entry
  const deleteWeightEntry = (id: string) => {
    const updated = weightEntries.filter(e => e.id !== id);
    saveWeightEntries(updated);
  };

  // Filter weight data by time range
  const filteredWeightData = useMemo(() => {
    const now = new Date();
    const ranges = {
      '1m': 30,
      '3m': 90,
      '6m': 180,
      '1y': 365
    };
    const days = ranges[weightTimeRange];
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    return weightEntries.filter(e => new Date(e.date) >= cutoff);
  }, [weightEntries, weightTimeRange]);

  // Filter XP data by time range
  const filteredXPData = useMemo(() => {
    const now = new Date();
    const ranges = {
      '7d': 7,
      '30d': 30,
      '90d': 90
    };
    const days = ranges[xpTimeRange];
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    return xpLog.filter(e => new Date(e.date) >= cutoff);
  }, [xpLog, xpTimeRange]);

  // Calculate weight stats
  const weightStats = useMemo(() => {
    if (filteredWeightData.length === 0) return null;
    
    const weights = filteredWeightData.map(e => e.weight);
    const current = weights[weights.length - 1];
    const start = weights[0];
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const change = current - start;
    const avg = weights.reduce((a, b) => a + b, 0) / weights.length;
    
    return { current, start, min, max, change, avg };
  }, [filteredWeightData]);

  // Calculate XP stats
  const xpStats = useMemo(() => {
    if (filteredXPData.length === 0) return { total: 0, daily: 0, best: 0, bySource: {} };
    
    const total = filteredXPData.reduce((sum, e) => sum + e.amount, 0);
    const days = new Set(filteredXPData.map(e => e.date)).size || 1;
    const daily = Math.round(total / days);
    const best = Math.max(...filteredXPData.map(e => e.amount));
    
    const bySource: Record<string, number> = {};
    filteredXPData.forEach(e => {
      bySource[e.source] = (bySource[e.source] || 0) + e.amount;
    });
    
    return { total, daily, best, bySource };
  }, [filteredXPData]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-100">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-800 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setView('character-profile')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <span className="text-lg">←</span>
              <span>Back</span>
            </button>
            <h1 className="text-xl font-bold bg-linear-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Analytics & Progress
            </h1>
            <div className="w-20" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Weight Tracking Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <span className="text-2xl">⚖️</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">Weight Tracker</h2>
                <p className="text-sm text-slate-400">Monitor your body transformation</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(['1m', '3m', '6m', '1y'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setWeightTimeRange(range)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    weightTimeRange === range
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {range === '1m' ? '1M' : range === '3m' ? '3M' : range === '6m' ? '6M' : '1Y'}
                </button>
              ))}
            </div>
          </div>

          {/* Weight Stats */}
          {weightStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-900/50 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Current</p>
                <p className="text-2xl font-bold text-white">{weightStats.current.toFixed(1)} <span className="text-sm text-slate-400">kg</span></p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Change</p>
                <p className={`text-2xl font-bold flex items-center gap-1 ${
                  weightStats.change <= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {weightStats.change <= 0 ? (
                    <span className="text-lg">📉</span>
                  ) : (
                    <span className="text-lg">📈</span>
                  )}
                  {Math.abs(weightStats.change).toFixed(1)}
                </p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Lowest</p>
                <p className="text-2xl font-bold text-emerald-400">{weightStats.min.toFixed(1)} <span className="text-sm text-slate-400">kg</span></p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Average</p>
                <p className="text-2xl font-bold text-slate-200">{weightStats.avg.toFixed(1)} <span className="text-sm text-slate-400">kg</span></p>
              </div>
            </div>
          )}

          {/* Weight Chart */}
          <div className="bg-slate-900/30 rounded-xl p-4 mb-4">
            <WeightChart data={filteredWeightData} />
          </div>

          {/* Add Weight Button */}
          {!showAddWeight ? (
            <button
              onClick={() => setShowAddWeight(true)}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition-colors"
            >
              <span className="text-lg">{EMOJIS.PLUS}</span>
              Add Weight Entry
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-900/50 rounded-xl">
              <input
                type="number"
                step="0.1"
                placeholder="Weight (kg)"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
              <input
                type="text"
                placeholder="Note (optional)"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={addWeightEntry}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowAddWeight(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Weight History */}
          {weightEntries.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-slate-400 mb-3">Recent Entries</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {[...weightEntries].reverse().slice(0, 10).map(entry => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg text-slate-500">{EMOJIS.CALENDAR}</span>
                      <span className="text-sm text-slate-300">{entry.date}</span>
                      {entry.notes && (
                        <span className="text-xs text-slate-500">{entry.notes}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{entry.weight} kg</span>
                      <button
                        onClick={() => deleteWeightEntry(entry.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <span className="text-lg">{EMOJIS.DELETE}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* XP History Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">XP History</h2>
                <p className="text-sm text-slate-400">Track your progress momentum</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(['7d', '30d', '90d'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setXpTimeRange(range)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    xpTimeRange === range
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {range === '7d' ? '7D' : range === '30d' ? '30D' : '90D'}
                </button>
              ))}
            </div>
          </div>

          {/* XP Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-900/50 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total XP</p>
              <p className="text-2xl font-bold text-emerald-400">{xpStats.total.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Daily Avg</p>
              <p className="text-2xl font-bold text-cyan-400">{xpStats.daily}</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Best Day</p>
              <p className="text-2xl font-bold text-amber-400">{xpStats.best}</p>
            </div>
          </div>

          {/* XP Chart */}
          <div className="bg-slate-900/30 rounded-xl p-4 mb-6">
            <XPChart data={filteredXPData} />
          </div>

          {/* XP by Source */}
          {Object.keys(xpStats.bySource).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-400 mb-3">XP by Source</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {Object.entries(xpStats.bySource)
                  .sort((a, b) => b[1] - a[1])
                  .map(([source, amount]) => (
                    <div
                      key={source}
                      className="p-3 bg-slate-900/30 rounded-lg text-center"
                    >
                      <p className="text-xs text-slate-500 mb-1">{source}</p>
                      <p className="text-lg font-bold text-slate-200">{amount}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Character Profile', view: 'character-profile' as const, icon: Target, iconColorClass: 'text-sky-400' },
            { label: 'Body Journey', view: 'body' as const, icon: Award, iconColorClass: 'text-violet-400' },
            { label: 'Mind HQ', view: 'mind' as const, icon: Activity, iconColorClass: 'text-amber-400' },
            { label: 'Career Lab', view: 'career' as const, icon: Calendar, iconColorClass: 'text-rose-400' },
          ].map(({ label, view, icon: Icon, iconColorClass }) => (
            <button
              key={view}
              onClick={() => setView(view)}
              className={`p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700/50 transition-all group`}
            >
              <Icon className={`w-6 h-6 mb-2 ${iconColorClass} group-hover:scale-110 transition-transform`} />
              <p className="text-sm font-medium">{label}</p>
            </button>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
