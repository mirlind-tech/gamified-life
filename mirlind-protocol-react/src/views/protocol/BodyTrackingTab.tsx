import { useState } from 'react';
import { motion } from 'framer-motion';
import { TabTransition } from '../../components/animations';
import { EMOJIS } from '../../utils/emojis';
import { WorkoutHistory } from '../../components/WorkoutHistory';
import * as bodyApi from '../../services/bodyApi';
import type { BodyTrackingTabProps, BodyStats } from './types';

export function BodyTrackingTab({
  bodyStats,
  setBodyStats,
  workoutHistory,
  showWorkoutHistory,
  setShowWorkoutHistory,
  isSavingMeasurements,
  isSavingWorkout,
  onSaveMeasurements,
  onSaveWorkout,
}: BodyTrackingTabProps) {
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);

  const updateMeasurement = (key: keyof BodyStats, value: number) => {
    setBodyStats((prev: BodyStats) => ({ ...prev, [key]: value }));
  };

  const loadBakiWorkout = (type: 'arms' | 'chestShoulders' | 'legsBack' | 'legFocus') => {
    const workout = bodyApi.BAKI_WORKOUTS[type];
    setBodyStats((prev: BodyStats) => ({
      ...prev,
      workout: {
        type: workout.name,
        exercises: workout.exercises.map(e => ({ 
          ...e, 
          weight: e.weight || 0,
          target: e.target 
        }))
      }
    }));
    setSelectedWorkout(type);
  };

  const addExercise = () => {
    const newExercise = { name: '', sets: 3, reps: 10, weight: 0, target: undefined as number | undefined };
    setBodyStats((prev: BodyStats) => ({
      ...prev,
      workout: prev.workout
        ? { ...prev.workout, exercises: [...prev.workout.exercises, newExercise] }
        : { type: 'Custom', exercises: [newExercise] }
    }));
  };

  // Calculate progress to Baki goals
  const getProgress = (current: number, target: number) => Math.min(100, (current / target) * 100);

  return (
    <TabTransition>
      {/* Baki Status Card */}
      <div className="glass-card rounded-2xl p-6 bg-linear-to-br from-accent-pink/10 to-transparent border border-accent-pink/30">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-4xl">💪</span>
          <div>
            <h3 className="text-xl font-bold text-accent-pink">BAKI TRANSFORMATION</h3>
            <p className="text-text-secondary text-sm">170cm frame • Small wrist (16.5cm) • Hardgainer protocol</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-text-primary">{bodyStats.weight}</div>
            <div className="text-xs text-text-muted">kg current</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-accent-green">75</div>
            <div className="text-xs text-text-muted">kg target</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-accent-cyan">+{75 - bodyStats.weight}</div>
            <div className="text-xs text-text-muted">kg to gain</div>
          </div>
        </div>
      </div>

      {/* Measurements Grid */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
            {EMOJIS.VESSEL} Body Measurements
          </h3>
          <button
            onClick={onSaveMeasurements}
            disabled={isSavingMeasurements}
            className="px-4 py-2 bg-accent-green-dark rounded-lg text-white font-semibold text-sm hover:bg-accent-green-dark/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSavingMeasurements ? (
              <>
                <span className="animate-spin">⏳</span> Saving...
              </>
            ) : (
              'Save Record'
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { key: 'weight', label: 'Weight', unit: 'kg', current: bodyStats.weight, target: 75, color: 'text-accent-green' },
            { key: 'biceps', label: 'Biceps', unit: 'cm', current: bodyStats.biceps, target: 36, color: 'text-accent-pink' },
            { key: 'chest', label: 'Chest', unit: 'cm', current: bodyStats.chest, target: 105, color: 'text-accent-purple' },
            { key: 'shoulders', label: 'Shoulders', unit: 'cm', current: bodyStats.shoulders, target: 120, color: 'text-accent-cyan' },
            { key: 'waist', label: 'Waist', unit: 'cm', current: bodyStats.waist, target: 70, color: 'text-accent-green' },
            { key: 'forearms', label: 'Forearms', unit: 'cm', current: bodyStats.forearms, target: 32, color: 'text-accent-pink' },
            { key: 'thighs', label: 'Thighs', unit: 'cm', current: bodyStats.thighs, target: 58, color: 'text-accent-purple' },
            { key: 'calves', label: 'Calves', unit: 'cm', current: bodyStats.calves, target: 40, color: 'text-accent-cyan' },
            { key: 'hips', label: 'Hips', unit: 'cm', current: bodyStats.hips, target: 85, color: 'text-text-secondary' },
            { key: 'wrist', label: 'Wrist', unit: 'cm', current: bodyStats.wrist, target: 16.5, color: 'text-text-secondary' },
            { key: 'height', label: 'Height', unit: 'cm', current: bodyStats.height, target: 170, color: 'text-text-secondary' },
          ].map((item) => (
            <div key={item.key} className="bg-bg-secondary/50 rounded-xl p-3">
              <label htmlFor={`${item.key}-input`} className="text-xs text-text-muted uppercase">{item.label}</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  id={`${item.key}-input`}
                  type="number"
                  step={item.key === 'weight' ? 0.1 : 0.5}
                  value={bodyStats[item.key as keyof BodyStats] as number}
                  onChange={(e) => updateMeasurement(item.key as keyof BodyStats, Number(e.target.value))}
                  className="w-16 bg-transparent text-xl font-bold text-text-primary focus:outline-none"
                />
                <span className="text-text-muted text-sm">{item.unit}</span>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Target: {item.target}</span>
                  <span className={item.color}>{Math.round(getProgress(item.current, item.target))}%</span>
                </div>
                <div className="h-1 bg-black/30 rounded-full mt-1 overflow-hidden">
                  <div 
                    className="h-full bg-accent-green rounded-full"
                    style={{ width: `${getProgress(item.current, item.target)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Baki Workout Presets */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-text-primary mb-2 flex items-center gap-2">
          {EMOJIS.FIRE} BAKI WORKOUT PRESETS
        </h3>
        <p className="text-xs text-text-muted mb-4">Weights shown: [Start → Target] kg | Add 2.5kg when you hit all reps</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() => loadBakiWorkout('arms')}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedWorkout === 'arms' 
                ? 'bg-accent-pink/20 border-accent-pink' 
                : 'bg-bg-secondary/50 border-transparent hover:border-accent-pink/50'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="text-2xl mb-2">💪</div>
                <div className="font-bold text-text-primary">ARMS DAY</div>
                <div className="text-xs text-text-muted">Tuesday Priority</div>
              </div>
              <span className="text-xs bg-accent-pink/20 text-accent-pink px-2 py-1 rounded">WEAK POINT!</span>
            </div>
            <div className="mt-3 space-y-1 text-xs">
              <div className="flex justify-between text-text-muted">
                <span>Barbell Curls</span>
                <span className="text-accent-green">25→45kg</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Close-Grip Bench</span>
                <span className="text-accent-green">40→80kg</span>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => loadBakiWorkout('chestShoulders')}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedWorkout === 'chestShoulders' 
                ? 'bg-accent-cyan/20 border-accent-cyan' 
                : 'bg-bg-secondary/50 border-transparent hover:border-accent-cyan/50'
            }`}
          >
            <div className="text-2xl mb-2">🏋️</div>
            <div className="font-bold text-text-primary">CHEST & SHOULDERS</div>
            <div className="text-xs text-text-muted">Thursday Focus</div>
            <div className="mt-3 space-y-1 text-xs">
              <div className="flex justify-between text-text-muted">
                <span>Bench Press</span>
                <span className="text-accent-green">45→100kg</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Overhead Press</span>
                <span className="text-accent-green">30→60kg</span>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => loadBakiWorkout('legsBack')}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedWorkout === 'legsBack' 
                ? 'bg-accent-purple/20 border-accent-purple' 
                : 'bg-bg-secondary/50 border-transparent hover:border-accent-purple/50'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="text-2xl mb-2">🦵</div>
                <div className="font-bold text-text-primary">LEGS & BACK</div>
                <div className="text-xs text-text-muted">Saturday Power</div>
              </div>
              <span className="text-xs bg-accent-purple/20 text-accent-purple px-2 py-1 rounded">SKINNY LEGS!</span>
            </div>
            <div className="mt-3 space-y-1 text-xs">
              <div className="flex justify-between text-text-muted">
                <span>Squats</span>
                <span className="text-accent-green">50→120kg</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Romanian DL</span>
                <span className="text-accent-green">50→100kg</span>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => loadBakiWorkout('legFocus')}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedWorkout === 'legFocus' 
                ? 'bg-orange-500/20 border-orange-500' 
                : 'bg-bg-secondary/50 border-transparent hover:border-orange-500/50'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="text-2xl mb-2">🔥</div>
                <div className="font-bold text-text-primary">EXTRA LEG DAY</div>
                <div className="text-xs text-text-muted">Sunday - Fix skinny legs!</div>
              </div>
              <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">PRIORITY!</span>
            </div>
            <div className="mt-3 space-y-1 text-xs">
              <div className="flex justify-between text-text-muted">
                <span>Front Squats</span>
                <span className="text-accent-green">40→90kg</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Walking Lunges</span>
                <span className="text-accent-green">12→30kg</span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Workout Logger */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
            {EMOJIS.DUMBBELL} {bodyStats.workout?.type || 'Today\'s Workout'}
          </h3>
          <button
            onClick={addExercise}
            className="px-4 py-2 bg-accent-purple-dark rounded-lg text-white font-semibold hover:bg-accent-purple-dark/80"
          >
            + Add Exercise
          </button>
        </div>

        {bodyStats.workout?.exercises.map((exercise, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 mb-2 p-3 bg-bg-secondary/30 rounded-lg items-center">
            <div className="col-span-4">
              <input
                id={`workout-exercise-name-${idx}`}
                name={`workout_exercise_name_${idx}`}
                type="text"
                aria-label="Exercise name"
                value={exercise.name}
                onChange={(e) => {
                  const updated = [...bodyStats.workout!.exercises];
                  updated[idx].name = e.target.value;
                  setBodyStats((prev: BodyStats) => ({ ...prev, workout: { ...prev.workout!, exercises: updated } }));
                }}
                placeholder="Exercise name"
                className="w-full bg-transparent text-text-primary placeholder-text-muted focus:outline-none text-sm"
              />
            </div>
            <div className="col-span-2 flex items-center gap-1">
              <input
                id={`workout-exercise-sets-${idx}`}
                name={`workout_exercise_sets_${idx}`}
                type="number"
                aria-label="Sets"
                value={exercise.sets}
                onChange={(e) => {
                  const updated = [...bodyStats.workout!.exercises];
                  updated[idx].sets = Number(e.target.value);
                  setBodyStats((prev: BodyStats) => ({ ...prev, workout: { ...prev.workout!, exercises: updated } }));
                }}
                className="w-8 bg-transparent text-text-primary text-center focus:outline-none"
              />
              <span className="text-text-muted text-xs">sets</span>
            </div>
            <div className="col-span-2 flex items-center gap-1">
              <input
                id={`workout-exercise-reps-${idx}`}
                name={`workout_exercise_reps_${idx}`}
                type="number"
                aria-label="Reps"
                value={exercise.reps}
                onChange={(e) => {
                  const updated = [...bodyStats.workout!.exercises];
                  updated[idx].reps = Number(e.target.value);
                  setBodyStats((prev: BodyStats) => ({ ...prev, workout: { ...prev.workout!, exercises: updated } }));
                }}
                className="w-8 bg-transparent text-text-primary text-center focus:outline-none"
              />
              <span className="text-text-muted text-xs">reps</span>
            </div>
            <div className="col-span-2 flex items-center gap-1">
              <input
                id={`workout-exercise-weight-${idx}`}
                name={`workout_exercise_weight_${idx}`}
                type="number"
                aria-label="Weight kg"
                value={exercise.weight}
                onChange={(e) => {
                  const updated = [...bodyStats.workout!.exercises];
                  updated[idx].weight = Number(e.target.value);
                  setBodyStats((prev: BodyStats) => ({ ...prev, workout: { ...prev.workout!, exercises: updated } }));
                }}
                className="w-12 bg-transparent text-text-primary text-center focus:outline-none font-bold"
              />
              <span className="text-text-muted text-xs">kg</span>
            </div>
            <div className="col-span-2 text-right">
              {exercise.target && (
                <span className="text-xs text-accent-green">
                  →{exercise.target}kg
                </span>
              )}
            </div>
          </div>
        ))}

        {!bodyStats.workout?.exercises.length && (
          <p className="text-text-muted text-center py-8">Select a Baki workout preset or add custom exercises</p>
        )}

        {(bodyStats.workout?.exercises.length ?? 0) > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <button
              onClick={onSaveWorkout}
              disabled={isSavingWorkout}
              className="w-full py-3 bg-accent-green-dark rounded-lg text-white font-semibold hover:bg-accent-green-dark/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSavingWorkout ? (
                <>
                  <span className="animate-spin">⏳</span> Saving...
                </>
              ) : (
                <>💾 Save Workout (+30 XP)</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Workout History Toggle */}
      <div className="glass-card rounded-2xl p-4">
        <button
          onClick={() => setShowWorkoutHistory(!showWorkoutHistory)}
          className="w-full flex items-center justify-between text-text-primary font-semibold"
        >
          <span>📋 Workout History ({workoutHistory.length})</span>
          <span className={`transform transition-transform ${showWorkoutHistory ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        
        {showWorkoutHistory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4"
          >
            <WorkoutHistory workouts={workoutHistory} />
          </motion.div>
        )}
      </div>

      {/* Strength Goals */}
      <div className="glass-card rounded-2xl p-6 border border-accent-pink/30">
        <h3 className="text-lg font-bold text-accent-pink mb-4">{EMOJIS.TROPHY} STRENGTH GOALS</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { name: 'Bench Press', current: 0, target: 100, unit: 'kg' },
            { name: 'Squat', current: 0, target: 120, unit: 'kg' },
            { name: 'Deadlift', current: 0, target: 160, unit: 'kg' },
          ].map((lift) => (
            <div key={lift.name} className="text-center p-3 bg-bg-secondary/30 rounded-xl">
              <div className="text-sm text-text-secondary mb-1">{lift.name}</div>
              <div className="text-2xl font-bold text-text-primary">{lift.target}</div>
              <div className="text-xs text-text-muted">{lift.unit} target</div>
            </div>
          ))}
        </div>
      </div>
    </TabTransition>
  );
}
