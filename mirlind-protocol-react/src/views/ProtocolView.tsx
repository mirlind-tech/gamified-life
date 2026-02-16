import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EMOJIS } from '../utils/emojis';
import * as bodyApi from '../services/bodyApi';
import * as germanApi from '../services/germanApi';
import * as codeApi from '../services/codeApi';
import * as financeApi from '../services/financeApi';
import * as protocolApi from '../services/protocolApi';
import * as playerApi from '../services/playerApi';
import { useGame } from '../store/useGame';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';
import { LevelUpModal } from '../components/LevelUpModal';
import type { Achievement } from '../components/AchievementBadge';
import type { Workout } from '../services/bodyApi';
import { logger } from '../utils/logger';

// Import extracted tab components
import {
  DailyProtocolTab,
  BodyTrackingTab,
  GermanTab,
  CodeTab,
  FinanceTab,
  WeeklyTab,
} from './protocol';
import type {
  TabType,
  DailyProtocol,
  BodyStats,
  GermanStats,
  CodeStats,
  FinanceEntry,
  NewExpense,
  ProtocolHistoryEntry,
} from './protocol';

const STORAGE_KEYS = {
  daily: 'mirlind-protocol-daily',
  body: 'mirlind-protocol-body',
  german: 'mirlind-protocol-german',
  code: 'mirlind-protocol-code',
  finance: 'mirlind-protocol-finance',
};

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: 'daily', label: 'Daily', icon: EMOJIS.CHECK },
  { id: 'body', label: 'Body', icon: EMOJIS.VESSEL },
  { id: 'german', label: 'German', icon: EMOJIS.FLAG },
  { id: 'code', label: 'Code', icon: EMOJIS.CODE },
  { id: 'finance', label: 'Finance', icon: EMOJIS.CAPITAL },
  { id: 'weekly', label: 'Weekly Review', icon: '📊' },
];

export function ProtocolView() {
  const { addXP: addXPToGame } = useGame();
  const today = new Date().toISOString().split('T')[0];
  const [activeTab, setActiveTab] = useState<TabType>('daily');

  // Daily Protocol State
  const [protocol, setProtocol] = useState<DailyProtocol>({
    date: today,
    wake05: false,
    germanStudy: false,
    gymWorkout: false,
    codingHours: 0,
    sleep22: false,
    notes: '',
  });

  // Body State - Starting measurements (170cm, 60kg, Baki journey begins)
  const [bodyStats, setBodyStats] = useState<BodyStats>({
    date: today,
    weight: 60,
    height: 170,
    chest: 90,
    biceps: 26,
    forearms: 25,
    waist: 75,
    hips: 81,
    thighs: 50,
    calves: 35,
    shoulders: 112,
    wrist: 16.5,
    workout: null,
  });

  // German State
  const [germanStats, setGermanStats] = useState<GermanStats>({
    date: today,
    ankiCards: 0,
    ankiTime: 0,
    ankiStreak: 0,
    totalWords: 0,
    languageTransfer: false,
    languageTransferLesson: 1,
    radioHours: 0,
    tandemMinutes: 0,
    notes: '',
  });

  // Code State
  const [codeStats, setCodeStats] = useState<CodeStats>({
    date: today,
    hours: 0,
    githubCommits: 0,
    project: 'Protocol Tracker',
    skills: [],
    notes: '',
  });

  // Finance State
  const [financeEntries, setFinanceEntries] = useState<FinanceEntry[]>([]);
  const [newExpense, setNewExpense] = useState<NewExpense>({ amount: '', category: 'food', description: '' });

  // Streaks & Scores
  const [streak, setStreak] = useState(0);
  const [weeklyScore, setWeeklyScore] = useState(0);

  // Toast notifications
  const { toasts, removeToast, success, error, xp } = useToast();

  // Level up modal
  const [levelUpModal, setLevelUpModal] = useState<{ isOpen: boolean; newLevel: number; pillar?: string }>({
    isOpen: false,
    newLevel: 1,
  });

  // Workout history
  const [workoutHistory, setWorkoutHistory] = useState<Workout[]>([]);
  const [showWorkoutHistory, setShowWorkoutHistory] = useState(false);

  // Loading states
  const [isSavingWorkout, setIsSavingWorkout] = useState(false);
  const [isSavingMeasurements, setIsSavingMeasurements] = useState(false);

  // Achievements
  const [achievements, setAchievements] = useState<Achievement[]>([
    { id: 'first-workout', name: 'First Blood', description: 'Complete your first workout', icon: '💪', rarity: 'common' },
    { id: '7-day-streak', name: 'Week Warrior', description: '7 day protocol streak', icon: '🔥', rarity: 'rare' },
    { id: '30-day-streak', name: 'Monthly Master', description: '30 day protocol streak', icon: '⚡', rarity: 'epic' },
    { id: '1000-words', name: 'Polyglot', description: 'Learn 1000 German words', icon: '📚', rarity: 'rare' },
    { id: 'baki-arms', name: 'Baki Arms', description: 'Biceps reach 30cm', icon: '🦾', rarity: 'epic' },
    { id: 'code-ninja', name: 'Code Ninja', description: 'Complete 50 coding sessions', icon: '👨‍💻', rarity: 'epic' },
    { id: 'early-bird', name: 'Early Bird', description: 'Wake up at 5am 10 times', icon: '🌅', rarity: 'common' },
    { id: 'german-master', name: 'German Master', description: 'Complete Language Transfer course', icon: '🇩🇪', rarity: 'legendary' },
  ]);
  const [newUnlocks, setNewUnlocks] = useState<string[]>([]);

  // Protocol history for heatmap (last 90 days)
  const [protocolHistory, setProtocolHistory] = useState<ProtocolHistoryEntry[]>([]);

  // Achievement unlock helper
  const unlockAchievement = useCallback((id: string) => {
    setAchievements(prev => {
      const achievement = prev.find(a => a.id === id);
      if (achievement && !achievement.unlockedAt) {
        setNewUnlocks(n => [...n, id]);
        setTimeout(() => setNewUnlocks(n => n.filter(x => x !== id)), 5000);
        success(`Achievement unlocked: ${achievement.name}!`, 5000);
        return prev.map(a => a.id === id ? { ...a, unlockedAt: new Date().toISOString() } : a);
      }
      return prev;
    });
  }, [success]);

  // Helper functions
  const calculateStreak = useCallback(() => {
    let currentStreak = 0;
    const checkDate = new Date();

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const saved = localStorage.getItem(`${STORAGE_KEYS.daily}-${dateStr}`);

      if (!saved) break;

      const data = JSON.parse(saved);
      const completed = data.wake05 && data.germanStudy && data.gymWorkout && data.sleep22 && data.codingHours >= 2;

      if (completed) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    setStreak(currentStreak);
  }, []);

  const calculateWeeklyScore = useCallback(() => {
    let totalScore = 0;
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      const saved = localStorage.getItem(`${STORAGE_KEYS.daily}-${dateStr}`);

      if (saved) {
        const data = JSON.parse(saved);
        let dayScore = 0;
        if (data.wake05) dayScore += 20;
        if (data.germanStudy) dayScore += 20;
        if (data.gymWorkout) dayScore += 20;
        if (data.codingHours >= 2) dayScore += 20;
        if (data.sleep22) dayScore += 20;
        totalScore += dayScore;
      }
    }

    setWeeklyScore(Math.round(totalScore / 7));
  }, []);

  const getCompletionPercentage = useCallback(() => {
    let completed = 0;
    if (protocol.wake05) completed++;
    if (protocol.germanStudy) completed++;
    if (protocol.gymWorkout) completed++;
    if (protocol.codingHours >= 2) completed++;
    if (protocol.sleep22) completed++;
    return (completed / 5) * 100;
  }, [protocol]);

  // Load data
  useEffect(() => {
    requestAnimationFrame(() => {
      // Load daily protocol from backend
      protocolApi.getProtocol(today)
        .then(({ protocol: data }) => {
          setProtocol(prev => ({
            ...prev,
            date: data.date || today,
            wake05: data.wake05 ?? prev.wake05,
            germanStudy: data.german_study ?? prev.germanStudy,
            gymWorkout: data.gym_workout ?? prev.gymWorkout,
            codingHours: data.coding_hours ?? prev.codingHours,
            sleep22: data.sleep22 ?? prev.sleep22,
            notes: data.notes ?? prev.notes,
          }));
        })
        .catch(err => logger.error('Failed to load protocol:', err));

      // Load body from localStorage (measurements saved manually)
      const savedBody = localStorage.getItem(`${STORAGE_KEYS.body}-${today}`);
      if (savedBody) setBodyStats(JSON.parse(savedBody));

      // Load german from backend
      germanApi.getGermanProgress(today)
        .then(({ progress }) => {
          setGermanStats(prev => ({
            ...prev,
            date: progress.date || today,
            ankiCards: progress.anki_cards ?? prev.ankiCards,
            ankiTime: progress.anki_time ?? prev.ankiTime,
            ankiStreak: progress.anki_streak ?? prev.ankiStreak,
            totalWords: progress.total_words ?? prev.totalWords,
            languageTransfer: progress.language_transfer ?? prev.languageTransfer,
            languageTransferLesson: progress.language_transfer_lesson ?? prev.languageTransferLesson,
            radioHours: progress.radio_hours ?? prev.radioHours,
            tandemMinutes: progress.tandem_minutes ?? prev.tandemMinutes,
            notes: progress.notes ?? prev.notes,
          }));
        })
        .catch(err => logger.error('Failed to load German progress:', err));

      // Load code from backend
      codeApi.getCodeProgress(today)
        .then(({ progress }) => {
          setCodeStats(prev => ({
            ...prev,
            date: progress.date || today,
            hours: progress.hours ?? prev.hours,
            githubCommits: progress.github_commits ?? prev.githubCommits,
            project: progress.project ?? prev.project,
            skills: progress.skills ?? prev.skills,
            notes: progress.notes ?? prev.notes,
          }));
        })
        .catch(err => logger.error('Failed to load code progress:', err));

      // Load finance from backend (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      financeApi.getFinanceEntries(thirtyDaysAgo.toISOString().split('T')[0], today)
        .then(({ entries }) => {
          setFinanceEntries(entries.map(e => ({
            id: e.id,
            date: e.date,
            amount: e.amount,
            category: e.category,
            description: e.description,
          })));
        })
        .catch(err => logger.error('Failed to load finance entries:', err));

      // Load workout history
      bodyApi.getWorkouts()
        .then(({ workouts }) => {
          setWorkoutHistory(workouts);
          if (workouts.length > 0) {
            unlockAchievement('first-workout');
          }
        })
        .catch(err => logger.error('Failed to load workouts:', err));

      // Build protocol history for heatmap (last 90 days from localStorage)
      const history: ProtocolHistoryEntry[] = [];
      for (let i = 0; i < 90; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const saved = localStorage.getItem(`${STORAGE_KEYS.daily}-${dateStr}`);
        if (saved) {
          const data = JSON.parse(saved);
          let completed = 0;
          if (data.wake05) completed++;
          if (data.germanStudy) completed++;
          if (data.gymWorkout) completed++;
          if (data.codingHours >= 2) completed++;
          if (data.sleep22) completed++;
          history.push({
            date: dateStr,
            completed: completed === 5,
            percentage: (completed / 5) * 100,
          });
        }
      }
      setProtocolHistory(history.reverse());

      // Load streak from backend
      protocolApi.getProtocolStreak()
        .then(({ streak }) => setStreak(streak))
        .catch(() => calculateStreak()); // Fallback to localStorage

      calculateWeeklyScore();
    });
  }, [today, unlockAchievement, calculateStreak, calculateWeeklyScore]);

  // Save data effects
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEYS.daily}-${today}`, JSON.stringify(protocol));
  }, [protocol, today]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      protocolApi.saveProtocol({
        date: protocol.date,
        wake05: protocol.wake05,
        german_study: protocol.germanStudy,
        gym_workout: protocol.gymWorkout,
        coding_hours: protocol.codingHours,
        sleep22: protocol.sleep22,
        notes: protocol.notes,
      }).catch(err => logger.error('Failed to save protocol:', err));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [protocol]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEYS.body}-${today}`, JSON.stringify(bodyStats));
  }, [bodyStats, today]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEYS.german}-${today}`, JSON.stringify(germanStats));
  }, [germanStats, today]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      germanApi.saveGermanProgress({
        date: germanStats.date,
        anki_cards: germanStats.ankiCards,
        anki_time: germanStats.ankiTime,
        anki_streak: germanStats.ankiStreak,
        total_words: germanStats.totalWords,
        language_transfer: germanStats.languageTransfer,
        language_transfer_lesson: germanStats.languageTransferLesson,
        radio_hours: germanStats.radioHours,
        tandem_minutes: germanStats.tandemMinutes,
        notes: germanStats.notes,
      }).catch(err => logger.error('Failed to save German progress:', err));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [germanStats]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEYS.code}-${today}`, JSON.stringify(codeStats));
  }, [codeStats, today]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      codeApi.saveCodeProgress({
        date: codeStats.date,
        hours: codeStats.hours,
        github_commits: codeStats.githubCommits,
        project: codeStats.project,
        skills: codeStats.skills,
        notes: codeStats.notes,
      }).catch(err => logger.error('Failed to save code progress:', err));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [codeStats]);

  // Action handlers
  const toggleTask = (task: keyof DailyProtocol) => {
    if (typeof protocol[task] === 'boolean') {
      const newValue = !protocol[task];
      setProtocol(prev => ({ ...prev, [task]: newValue }));
      
      if (newValue) {
        const xpMap: Record<string, { amount: number; type: string; skillId?: string; message: string }> = {
          wake05: { amount: 10, type: 'principle', message: 'Early rise!' },
          germanStudy: { amount: 25, type: 'tongue', skillId: 'germanA1', message: 'German progress!' },
          gymWorkout: { amount: 30, type: 'vessel', skillId: 'strength', message: 'Workout complete!' },
          sleep22: { amount: 10, type: 'principle', message: 'Discipline!' },
        };
        
        const xpReward = xpMap[task as string];
        if (xpReward) {
          xp(xpReward.amount, xpReward.message);
          addXPToGame(xpReward.amount, xpReward.type);
          playerApi.addXP(xpReward.amount, xpReward.type, xpReward.skillId)
            .then(response => {
              if (response.levelUp) {
                setLevelUpModal({ isOpen: true, newLevel: response.newLevel, pillar: xpReward.type });
              }
            })
            .catch(err => logger.error('Failed to award XP:', err));
        }
      }
    }
  };

  const updateCodingHours = (hours: number) => {
    const newHours = Math.max(0, Math.min(4, hours));
    const wasCompleted = protocol.codingHours >= 2;
    const isNowCompleted = newHours >= 2;
    
    setProtocol(prev => ({ ...prev, codingHours: newHours }));
    
    if (!wasCompleted && isNowCompleted) {
      xp(25, 'Deep work complete!');
      addXPToGame(25, 'craft');
      playerApi.addXP(25, 'craft', 'javascript')
        .then(response => {
          if (response.levelUp) {
            setLevelUpModal({ isOpen: true, newLevel: response.newLevel, pillar: 'craft' });
          }
        })
        .catch(err => logger.error('Failed to award XP:', err));
    }
  };

  const addExpense = async () => {
    if (!newExpense.amount || isNaN(Number(newExpense.amount))) return;

    try {
      const result = await financeApi.addFinanceEntry({
        date: today,
        amount: Number(newExpense.amount),
        category: newExpense.category,
        description: newExpense.description,
      });

      const entry: FinanceEntry = {
        id: result.id,
        date: today,
        amount: Number(newExpense.amount),
        category: newExpense.category,
        description: newExpense.description,
      };

      setFinanceEntries(prev => [...prev, entry]);
      setNewExpense({ amount: '', category: 'food', description: '' });
      success('Expense added!');
    } catch (err) {
      logger.error('Failed to add expense:', err);
      error('Failed to save expense');
      // Fallback to localStorage
      const entry: FinanceEntry = {
        date: today,
        amount: Number(newExpense.amount),
        category: newExpense.category,
        description: newExpense.description,
      };
      const updated = [...financeEntries, entry];
      setFinanceEntries(updated);
      localStorage.setItem(`${STORAGE_KEYS.finance}-${today}`, JSON.stringify(
        updated.filter(e => e.date === today)
      ));
      setNewExpense({ amount: '', category: 'food', description: '' });
      success('Expense saved locally');
    }
  };

  const getDailyTotal = () => {
    return financeEntries
      .filter(e => e.date === today)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const getWeeklyTotal = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return financeEntries
      .filter(e => new Date(e.date) >= weekAgo)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const saveMeasurements = async () => {
    setIsSavingMeasurements(true);
    try {
      await bodyApi.addMeasurement({
        date: bodyStats.date,
        weight: bodyStats.weight,
        height: bodyStats.height,
        chest: bodyStats.chest,
        biceps: bodyStats.biceps,
        forearms: bodyStats.forearms,
        waist: bodyStats.waist,
        hips: bodyStats.hips,
        thighs: bodyStats.thighs,
        calves: bodyStats.calves,
        shoulders: bodyStats.shoulders,
        wrist: bodyStats.wrist,
      });
      success('Measurements saved!');
    } catch (e) {
      logger.error('Failed to save:', e);
      error('Failed to save measurements');
    } finally {
      setIsSavingMeasurements(false);
    }
  };

  const saveWorkout = async () => {
    if (!bodyStats.workout || bodyStats.workout.exercises.length === 0) {
      error('No workout to save. Select a preset or add exercises.');
      return;
    }

    setIsSavingWorkout(true);
    try {
      await bodyApi.addWorkout({
        date: bodyStats.date,
        name: bodyStats.workout.type,
        exercises: bodyStats.workout.exercises.map(e => ({
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          weight: e.weight,
        })),
        duration: 60,
      });
      
      addXPToGame(30, 'vessel');
      const response = await playerApi.addXP(30, 'vessel', 'strength');
      xp(30, 'Workout crushed!');
      
      const { workouts } = await bodyApi.getWorkouts();
      setWorkoutHistory(workouts);
      
      if (workouts.length === 1) {
        unlockAchievement('first-workout');
      }
      
      success('Workout saved!');
      
      if (response.levelUp) {
        setLevelUpModal({ isOpen: true, newLevel: response.newLevel, pillar: 'vessel' });
      }
    } catch (e) {
      logger.error('Failed to save workout:', e);
      error('Failed to save workout');
    } finally {
      setIsSavingWorkout(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-gradient mb-2">
          {EMOJIS.CROWN} PROTOCOL TRACKER
        </h2>
        <p className="text-text-secondary">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="glass-card rounded-2xl p-4 text-center"
        >
          <div className="text-3xl mb-1">{EMOJIS.FIRE}</div>
          <div className="text-2xl font-bold text-accent-orange">{streak}</div>
          <div className="text-xs text-text-muted">Day Streak</div>
        </motion.div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-4 text-center"
        >
          <div className="text-3xl mb-1">{EMOJIS.STAR}</div>
          <div className="text-2xl font-bold text-accent-purple">{weeklyScore}%</div>
          <div className="text-xs text-text-muted">Weekly Score</div>
        </motion.div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-4 text-center"
        >
          <div className="text-3xl mb-1">{EMOJIS.TARGET}</div>
          <div className="text-2xl font-bold text-accent-green">{Math.round(getCompletionPercentage())}%</div>
          <div className="text-xs text-text-muted">Today Complete</div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-accent-purple text-white'
                : 'glass-card text-text-secondary hover:bg-bg-hover'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'daily' && (
          <DailyProtocolTab
            key="daily"
            protocol={protocol}
            setProtocol={setProtocol}
            toggleTask={toggleTask}
            updateCodingHours={updateCodingHours}
            getCompletionPercentage={getCompletionPercentage}
            protocolHistory={protocolHistory}
          />
        )}

        {activeTab === 'body' && (
          <BodyTrackingTab
            key="body"
            bodyStats={bodyStats}
            setBodyStats={setBodyStats}
            workoutHistory={workoutHistory}
            showWorkoutHistory={showWorkoutHistory}
            setShowWorkoutHistory={setShowWorkoutHistory}
            isSavingMeasurements={isSavingMeasurements}
            isSavingWorkout={isSavingWorkout}
            onSaveMeasurements={saveMeasurements}
            onSaveWorkout={saveWorkout}
          />
        )}

        {activeTab === 'german' && (
          <GermanTab
            key="german"
            germanStats={germanStats}
            setGermanStats={setGermanStats}
          />
        )}

        {activeTab === 'code' && (
          <CodeTab
            key="code"
            codeStats={codeStats}
            setCodeStats={setCodeStats}
          />
        )}

        {activeTab === 'finance' && (
          <FinanceTab
            key="finance"
            financeEntries={financeEntries}
            newExpense={newExpense}
            setNewExpense={setNewExpense}
            addExpense={addExpense}
            getDailyTotal={getDailyTotal}
            getWeeklyTotal={getWeeklyTotal}
          />
        )}

        {activeTab === 'weekly' && (
          <WeeklyTab 
            key="weekly" 
            achievements={achievements}
            newUnlocks={newUnlocks}
          />
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Level Up Modal */}
      <LevelUpModal
        isOpen={levelUpModal.isOpen}
        onClose={() => setLevelUpModal({ isOpen: false, newLevel: 1 })}
        newLevel={levelUpModal.newLevel}
        pillar={levelUpModal.pillar}
      />
    </div>
  );
}
