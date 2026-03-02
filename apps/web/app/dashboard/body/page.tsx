"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";
import { EMOJIS } from "@/lib/emojis";
import type { BodyMeasurements, Workout, WeightEntry } from "@/types";

export default function BodyHQPage() {
  const [measurement, setMeasurement] = useState<BodyMeasurements | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Workout form state
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workoutType, setWorkoutType] = useState("Strength Training");
  const [duration, setDuration] = useState("60");
  const [workoutNotes, setWorkoutNotes] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [measurementData, workoutsData, weightData] = await Promise.all([
        api.getBodyLatest().catch(() => null),
        api.getWorkouts(),
        api.getWeightHistory(),
      ]);
      setMeasurement(measurementData);
      setWorkouts(workoutsData);
      setWeightHistory(weightData);
    } catch (error) {
      console.error("Failed to load Body HQ:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!duration || parseInt(duration) <= 0) return;

    setIsSubmitting(true);
    try {
      await api.createWorkout({
        type: workoutType,
        duration_minutes: parseInt(duration),
        notes: workoutNotes || undefined,
        date: new Date().toISOString().split("T")[0],
      });

      setShowWorkoutForm(false);
      resetWorkoutForm();
      await loadData();
    } catch (error) {
      console.error("Failed to save workout:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetWorkoutForm = () => {
    setWorkoutType("Strength Training");
    setDuration("60");
    setWorkoutNotes("");
  };

  const latestWeight = weightHistory[0]?.weight;
  const latestWorkouts = workouts.slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto pb-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <span className="text-4xl">{EMOJIS.VESSEL}</span>
          <div>
            <h1 className="text-2xl font-bold text-white">Body HQ</h1>
            <p className="text-sm text-secondary">
              Strength, physique, recovery, and movement progression
            </p>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setShowWorkoutForm(true)}
            className="cyber-button text-sm"
          >
            {EMOJIS.FIRE} Log Workout
          </button>
          <Link
            href="/dashboard/body/weight"
            className="cyber-button text-sm"
          >
            {EMOJIS.ADD} Log Weight
          </Link>
        </div>
      </motion.div>

      {/* Workout Form Modal */}
      <AnimatePresence>
        {showWorkoutForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowWorkoutForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold text-white mb-4">{EMOJIS.FIRE} Log Workout</h2>
              
              <form onSubmit={handleWorkoutSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-secondary mb-1">Workout Type</label>
                  <select
                    value={workoutType}
                    onChange={(e) => setWorkoutType(e.target.value)}
                    className="w-full input-field"
                  >
                    <option value="Strength Training">Strength Training</option>
                    <option value="Cardio">Cardio</option>
                    <option value="HIIT">HIIT</option>
                    <option value="Calisthenics">Calisthenics</option>
                    <option value="Running">Running</option>
                    <option value="Cycling">Cycling</option>
                    <option value="Swimming">Swimming</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-secondary mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-secondary mb-1">Notes (optional)</label>
                  <textarea
                    value={workoutNotes}
                    onChange={(e) => setWorkoutNotes(e.target.value)}
                    placeholder="How did it go? Exercises, sets, reps..."
                    rows={3}
                    className="w-full input-field resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowWorkoutForm(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : "Log Workout"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-secondary">Loading body progress...</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-4">
            <StatCard
              label="Weight"
              value={latestWeight ? `${latestWeight} kg` : "--"}
              icon={EMOJIS.WEIGHT}
              color="cyan"
            />
            <StatCard
              label="Body Fat"
              value={measurement?.body_fat ? `${measurement.body_fat}%` : "--"}
              icon={EMOJIS.FIRE}
              color="orange"
            />
            <StatCard
              label="Workouts"
              value={workouts.length.toString()}
              icon={EMOJIS.VESSEL}
              color="purple"
            />
            <StatCard
              label="This Week"
              value={`${workouts.filter(w => {
                const workoutDate = new Date(w.date);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return workoutDate >= weekAgo;
              }).length}`}
              icon={EMOJIS.CALENDAR}
              color="green"
            />
          </div>

          {/* Measurements & Milestones */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Current Measurements */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                {EMOJIS.MEASURE} Current Measurements
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <MeasurementItem
                  label="Chest"
                  value={measurement?.chest}
                  unit="cm"
                />
                <MeasurementItem
                  label="Waist"
                  value={measurement?.waist}
                  unit="cm"
                />
                <MeasurementItem
                  label="Arms"
                  value={measurement?.arms}
                  unit="cm"
                />
                <MeasurementItem
                  label="Thighs"
                  value={measurement?.thighs}
                  unit="cm"
                />
              </div>
            </motion.div>

            {/* Milestones */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                {EMOJIS.TROPHY} Current Milestones
              </h3>
              <div className="space-y-3">
                <MilestoneItem
                  label="4 weekly strength sessions"
                  progress={Math.min(100, (workouts.filter(w => {
                    const workoutDate = new Date(w.date);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return workoutDate >= weekAgo;
                  }).length / 4) * 100)}
                  current={workouts.filter(w => {
                    const workoutDate = new Date(w.date);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return workoutDate >= weekAgo;
                  }).length}
                  target={4}
                />
                <MilestoneItem
                  label="Arms 40cm checkpoint"
                  progress={Math.min(100, ((measurement?.arms || 0) / 40) * 100)}
                  current={measurement?.arms || 0}
                  target={40}
                  unit="cm"
                />
                <MilestoneItem
                  label="Waist under 85cm"
                  progress={measurement?.waist ? Math.max(0, 100 - ((measurement.waist - 85) / 85) * 100) : 0}
                  current={measurement?.waist || 0}
                  target={85}
                  unit="cm"
                  reverse
                />
              </div>
            </motion.div>
          </div>

          {/* Weight Chart Placeholder & Recent Workouts */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Weight Trend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2 glass-card rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                {EMOJIS.CHART} Weight Trend
              </h3>
              {weightHistory.length > 0 ? (
                <div className="h-48 flex items-end gap-2">
                  {weightHistory.slice(0, 14).reverse().map((entry, i) => {
                    const maxWeight = Math.max(...weightHistory.map(w => w.weight));
                    const minWeight = Math.min(...weightHistory.map(w => w.weight));
                    const range = maxWeight - minWeight || 1;
                    const height = ((entry.weight - minWeight) / range) * 100;
                    return (
                      <div
                        key={entry.id}
                        className="flex-1 flex flex-col items-center gap-1"
                      >
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(10, height)}%` }}
                          transition={{ delay: i * 0.05 }}
                          className="w-full bg-gradient-to-t from-cyan/50 to-cyan rounded-t"
                        />
                        <span className="text-xs text-muted rotate-45 origin-left">
                          {new Date(entry.date).getDate()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-secondary">
                  No weight data yet. Start logging!
                </div>
              )}
            </motion.div>

            {/* Recent Workouts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                {EMOJIS.FIRE} Recent Workouts
              </h3>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {latestWorkouts.length === 0 ? (
                  <p className="text-sm text-secondary text-center py-4">
                    No workouts logged yet.
                  </p>
                ) : (
                  latestWorkouts.map((workout) => (
                    <div
                      key={workout.id}
                      className="rounded-lg border border-border p-3 bg-gray-900/25 hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-white">{workout.type}</p>
                        <span className="text-xs text-muted">{workout.duration_minutes}min</span>
                      </div>
                      <p className="text-xs text-muted">{workout.date}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: "cyan" | "purple" | "green" | "orange";
}) {
  const colorClasses = {
    cyan: "from-cyan/20 to-cyan/5 border-cyan/30",
    purple: "from-purple/20 to-purple/5 border-purple/30",
    green: "from-green/20 to-green/5 border-green/30",
    orange: "from-orange/20 to-orange/5 border-orange/30",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`glass-card rounded-2xl p-4 bg-gradient-to-br ${colorClasses[color]} border`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-xs text-muted uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

function MeasurementItem({
  label,
  value,
  unit,
}: {
  label: string;
  value?: number;
  unit: string;
}) {
  return (
    <div className="rounded-xl bg-gray-900/50 p-3 border border-border">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-xl font-bold text-white">
        {value ? `${value} ${unit}` : "--"}
      </p>
    </div>
  );
}

function MilestoneItem({
  label,
  progress,
  current,
  target,
  unit = "",
  reverse = false,
}: {
  label: string;
  progress: number;
  current: number;
  target: number;
  unit?: string;
  reverse?: boolean;
}) {
  const isComplete = reverse ? current <= target : current >= target;
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-secondary">{label}</span>
        <span className={isComplete ? "text-green" : "text-muted"}>
          {isComplete ? "✓ Complete" : `${current}/${target}${unit}`}
        </span>
      </div>
      <div className="progress-bar">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`progress-fill ${isComplete ? "bg-green" : "bg-gradient-to-r from-purple-500 to-cyan-500"}`}
        />
      </div>
    </div>
  );
}
