"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { EMOJIS } from "@/lib/emojis";
import type { CodeEntry } from "@/types";

export default function CodeHQPage() {
  const [_entries, setEntries] = useState<CodeEntry[]>([]);
  const [todayHours, setTodayHours] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [hours, setHours] = useState("");
  const [project, setProject] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Get today's entry
      const today = new Date().toISOString().split("T")[0];
      const todayEntry = await api.getCodeByDate(today).catch(() => null);
      setTodayHours(todayEntry?.hours || 0);

      // Get latest entry
      const latestEntry = await api.getCodeLatest().catch(() => null);
      if (latestEntry) {
        setEntries([latestEntry]);
      }
    } catch (error) {
      console.error("Failed to load Code HQ:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hours || parseFloat(hours) <= 0) return;

    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      await api.saveCode({
        date: today,
        hours: parseFloat(hours),
        project: project || undefined,
        notes: notes || undefined,
      });
      
      setShowForm(false);
      setHours("");
      setProject("");
      setNotes("");
      await loadData();
    } catch (error) {
      console.error("Failed to save coding session:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const dailyGoal = 2; // 2 hours daily goal
  const progress = Math.min(100, (todayHours / dailyGoal) * 100);

  return (
    <div className="max-w-6xl mx-auto pb-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <span className="text-4xl">{EMOJIS.CODE}</span>
          <div>
            <h1 className="text-2xl font-bold text-white">Code HQ</h1>
            <p className="text-sm text-secondary">Deep work. Craft mastery.</p>
          </div>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="cyber-button text-sm"
        >
          {EMOJIS.ADD} Log Session
        </button>
      </motion.div>

      {/* Add Session Form Modal */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowForm(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-card rounded-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-white mb-4">{EMOJIS.ADD} Log Coding Session</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-secondary mb-1">Hours</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="12"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="2.5"
                  className="w-full input-field"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-secondary mb-1">Project (optional)</label>
                <input
                  type="text"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="e.g., Protocol V2, Job Hunt App"
                  className="w-full input-field"
                />
              </div>

              <div>
                <label className="block text-sm text-secondary mb-1">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What did you work on?"
                  rows={3}
                  className="w-full input-field resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Log Session"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {isLoading ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-secondary">Loading progress...</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            <StatCard
              label="Today"
              value={`${todayHours}h`}
              subtext={`Goal: ${dailyGoal}h`}
              icon={EMOJIS.CLOCK}
              color="cyan"
            />
            <StatCard
              label="Progress"
              value={`${Math.round(progress)}%`}
              subtext={progress >= 100 ? "Goal reached!" : `${dailyGoal - todayHours}h to go`}
              icon={EMOJIS.CHART}
              color="purple"
            />
            <StatCard
              label="Streak"
              value="--"
              subtext="Coming soon"
              icon={EMOJIS.FIRE}
              color="orange"
            />
          </div>

          {/* Daily Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Daily Goal Progress</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted">{todayHours}h / {dailyGoal}h</span>
                <span className={progress >= 100 ? "text-green-400" : "text-cyan"}>
                  {progress >= 100 ? "✓ Complete" : `${Math.round(progress)}%`}
                </span>
              </div>
              <div className="progress-bar h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8 }}
                  className={`progress-fill h-full rounded-full ${
                    progress >= 100 
                      ? "bg-green-500" 
                      : "bg-linear-to-r from-cyan-500 to-purple-500"
                  }`}
                />
              </div>
            </div>
          </motion.div>

          {/* Quick Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Focus Tips</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li>• Use Pomodoro: 25min work / 5min break</li>
              <li>• Eliminate distractions before deep work</li>
              <li>• Set a clear goal for each session</li>
              <li>• Track time honestly - quality over quantity</li>
            </ul>
          </motion.div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
  icon,
  color,
}: {
  label: string;
  value: string;
  subtext: string;
  icon: string;
  color: "cyan" | "purple" | "orange" | "green";
}) {
  const colorClasses = {
    cyan: "from-cyan/20 to-cyan/5 border-cyan/30",
    purple: "from-purple/20 to-purple/5 border-purple/30",
    orange: "from-orange/20 to-orange/5 border-orange/30",
    green: "from-green/20 to-green/5 border-green/30",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`glass-card rounded-2xl p-4 bg-linear-to-br ${colorClasses[color]} border`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-xs text-muted uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          <p className="text-xs text-muted">{subtext}</p>
        </div>
      </div>
    </motion.div>
  );
}
