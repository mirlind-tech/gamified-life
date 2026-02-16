import type { Achievement } from '../../components/AchievementBadge';
import type { Workout } from '../../services/bodyApi';

export type TabType = 'daily' | 'body' | 'german' | 'code' | 'finance' | 'weekly';

// Daily Protocol Interface
export interface DailyProtocol {
  date: string;
  wake05: boolean;
  germanStudy: boolean;
  gymWorkout: boolean;
  codingHours: number;
  sleep22: boolean;
  notes: string;
}

// Body Tracker Interface
export interface BodyStats {
  date: string;
  weight: number;
  height: number;
  chest: number;
  biceps: number;
  forearms: number;
  waist: number;
  hips: number;
  thighs: number;
  calves: number;
  shoulders: number;
  wrist: number;
  workout: {
    type: string;
    exercises: {
      name: string;
      sets: number;
      reps: number;
      weight: number;
      target?: number;
    }[];
  } | null;
  photoFront?: string;
  photoSide?: string;
  photoBack?: string;
}

// German Tracker Interface
export interface GermanStats {
  date: string;
  ankiCards: number;
  ankiTime: number;
  ankiStreak: number;
  totalWords: number;
  languageTransfer: boolean;
  languageTransferLesson: number;
  radioHours: number;
  tandemMinutes: number;
  notes: string;
}

// Code Tracker Interface
export interface CodeStats {
  date: string;
  hours: number;
  githubCommits: number;
  project: string;
  skills: string[];
  notes: string;
}

// Finance Tracker Interface
export interface FinanceEntry {
  id?: number;
  date: string;
  amount: number;
  category: 'food' | 'transport' | 'gym' | 'other';
  description: string;
}

// New expense form state
export interface NewExpense {
  amount: string;
  category: 'food' | 'transport' | 'gym' | 'other';
  description: string;
}

// Protocol history entry for heatmap
export interface ProtocolHistoryEntry {
  date: string;
  completed: boolean;
  percentage: number;
}

// Tab configuration
export interface TabConfig {
  id: TabType;
  label: string;
  icon: string;
}

// Props interfaces for tab components
export interface DailyProtocolTabProps {
  protocol: DailyProtocol;
  setProtocol: React.Dispatch<React.SetStateAction<DailyProtocol>>;
  toggleTask: (task: keyof DailyProtocol) => void;
  updateCodingHours: (hours: number) => void;
  getCompletionPercentage: () => number;
  protocolHistory: ProtocolHistoryEntry[];
}

export interface BodyTrackingTabProps {
  bodyStats: BodyStats;
  setBodyStats: React.Dispatch<React.SetStateAction<BodyStats>>;
  workoutHistory: Workout[];
  showWorkoutHistory: boolean;
  setShowWorkoutHistory: (show: boolean) => void;
  isSavingMeasurements: boolean;
  isSavingWorkout: boolean;
  onSaveMeasurements: () => Promise<void>;
  onSaveWorkout: () => Promise<void>;
}

export interface GermanTabProps {
  germanStats: GermanStats;
  setGermanStats: React.Dispatch<React.SetStateAction<GermanStats>>;
}

export interface CodeTabProps {
  codeStats: CodeStats;
  setCodeStats: React.Dispatch<React.SetStateAction<CodeStats>>;
}

export interface FinanceTabProps {
  financeEntries: FinanceEntry[];
  newExpense: NewExpense;
  setNewExpense: React.Dispatch<React.SetStateAction<NewExpense>>;
  addExpense: () => void;
  getDailyTotal: () => number;
  getWeeklyTotal: () => number;
}

export interface WeeklyTabProps {
  achievements: Achievement[];
  newUnlocks: string[];
}

// Progress step status
export type ProgressStatus = 'completed' | 'in-progress' | 'pending';

// Progress step props
export interface ProgressStepProps {
  label: string;
  period: string;
  status: ProgressStatus;
  tasks: string[];
}

// Protocol task props
export interface ProtocolTaskProps {
  icon: string;
  title: string;
  subtitle: string;
  completed: boolean;
  onToggle: () => void;
  time: string;
}
