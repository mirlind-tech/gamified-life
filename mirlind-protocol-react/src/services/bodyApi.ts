import { apiRequest } from './authApi';

export interface BodyMeasurement {
  id?: number;
  date: string;
  weight: number;
  height?: number;
  biceps?: number;
  forearms?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  thighs?: number;
  calves?: number;
  shoulders?: number;
  wrist?: number;
  notes?: string;
}

export interface Workout {
  id?: number;
  date: string;
  name: string;
  exercises: Exercise[];
  duration?: number;
  notes?: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  notes?: string;
}

// Body measurements
export const getMeasurements = async (): Promise<{ measurements: BodyMeasurement[] }> => {
  return apiRequest('/body/measurements');
};

export const addMeasurement = async (data: BodyMeasurement): Promise<{ id: number; message: string }> => {
  return apiRequest('/body/measurements', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getLatestMeasurement = async (): Promise<{ measurement: BodyMeasurement | null }> => {
  return apiRequest('/body/latest');
};

// Workouts
export const getWorkouts = async (): Promise<{ workouts: Workout[] }> => {
  return apiRequest('/workouts');
};

export const addWorkout = async (data: Workout): Promise<{ id: number; message: string }> => {
  return apiRequest('/workouts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getWorkout = async (id: number): Promise<Workout> => {
  return apiRequest(`/workouts/${id}`);
};

// Baki workout presets with realistic weights for 60kg beginner
// Format: weight = [starting weight, target weight] in kg
export const BAKI_WORKOUTS = {
  arms: {
    name: 'ARMS - Baki Protocol (Priority!)',
    focus: 'Your weakest area - 2x/week minimum',
    exercises: [
      { name: 'Barbell Curls', sets: 4, reps: 8, weight: 25, target: 45 },
      { name: 'Hammer Curls (DB)', sets: 4, reps: 10, weight: 10, target: 20 },
      { name: 'Preacher Curls', sets: 3, reps: 12, weight: 20, target: 35 },
      { name: 'Close-Grip Bench Press', sets: 4, reps: 8, weight: 40, target: 80 },
      { name: 'Tricep Pushdowns', sets: 4, reps: 12, weight: 25, target: 50 },
      { name: 'Skullcrushers (EZ Bar)', sets: 3, reps: 10, weight: 20, target: 40 },
    ]
  },
  chestShoulders: {
    name: 'CHEST & SHOULDERS - Baki Protocol',
    focus: 'Build that armor plate chest',
    exercises: [
      { name: 'Bench Press', sets: 4, reps: 6, weight: 45, target: 100 },
      { name: 'Incline DB Press', sets: 4, reps: 10, weight: 14, target: 32 },
      { name: 'Cable Flyes', sets: 3, reps: 12, weight: 10, target: 25 },
      { name: 'Overhead Press', sets: 4, reps: 6, weight: 30, target: 60 },
      { name: 'Lateral Raises (DB)', sets: 4, reps: 15, weight: 6, target: 14 },
      { name: 'Face Pulls', sets: 3, reps: 15, weight: 15, target: 35 },
    ]
  },
  legsBack: {
    name: 'LEGS & BACK - Baki Protocol (Your Skinny Legs Fix!)',
    focus: 'EMPHASIS: Legs are lagging - priority area!',
    exercises: [
      { name: 'Squats (ATG)', sets: 4, reps: 5, weight: 50, target: 120 },
      { name: 'Romanian Deadlifts', sets: 4, reps: 8, weight: 50, target: 100 },
      { name: 'Leg Press', sets: 3, reps: 12, weight: 80, target: 180 },
      { name: 'Bulgarian Split Squats', sets: 3, reps: 10, weight: 10, target: 30 },
      { name: 'Leg Curls', sets: 3, reps: 12, weight: 25, target: 55 },
      { name: 'Calf Raises (Standing)', sets: 5, reps: 15, weight: 40, target: 100 },
      { name: 'Pull-ups', sets: 4, reps: 5, weight: 0, target: 20 },
      { name: 'Barbell Rows', sets: 4, reps: 8, weight: 40, target: 80 },
    ]
  },
  legFocus: {
    name: 'EXTRA LEG DAY - Fix Those Skinny Legs!',
    focus: 'Sunday: Additional leg work to catch up',
    exercises: [
      { name: 'Front Squats', sets: 4, reps: 6, weight: 40, target: 90 },
      { name: 'Hack Squat', sets: 3, reps: 10, weight: 60, target: 140 },
      { name: 'Walking Lunges', sets: 3, reps: 20, weight: 12, target: 30 },
      { name: 'Leg Extensions', sets: 4, reps: 15, weight: 30, target: 70 },
      { name: 'Seated Calf Raises', sets: 5, reps: 20, weight: 25, target: 60 },
      { name: 'Hip Thrusts', sets: 4, reps: 10, weight: 60, target: 140 },
    ]
  }
};
