"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { EMOJIS } from "@/lib/emojis";
import type { GermanEntry } from "@/types";

interface GermanProgress {
  id: string | null;
  date: string;
  anki_cards: number;
  anki_time: number;
  radio_hours: number;
  tandem_minutes: number;
  notes: string;
}

export default function GermanHQPage() {
  const [progress, setProgress] = useState<GermanProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [ankiCards, setAnkiCards] = useState("");
  const [activity, setActivity] = useState("Anki + Podcast");
  const [notes, setNotes] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getGermanByDate(today);
      setProgress(
        data
          ? {
              id: data.id ?? null,
              date: data.date,
              anki_cards: data.anki_cards || 0,
              anki_time: data.anki_time || 0,
              radio_hours: data.radio_hours || 0,
              tandem_minutes: data.tandem_minutes || 0,
              notes: data.notes || "",
            }
          : null
      );
    } catch (error) {
      console.error("Failed to load German progress:", error);
    } finally {
      setIsLoading(false);
    }
  }, [today]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!durationMinutes || parseInt(durationMinutes) <= 0) return;

    setIsSubmitting(true);
    try {
      const minutes = parseInt(durationMinutes);
      
      // Backend expects camelCase fields: ankiCards, ankiTime, radioHours, tandemMinutes
      await api.saveGerman({
        date: today,
        minutes: minutes, // Base field in GermanEntry
        activity: activity,
        notes: notes || `${activity} session`,
      } as Partial<GermanEntry>);

      setShowForm(false);
      resetForm();
      await loadData();
    } catch (error) {
      console.error("Failed to save German session:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setDurationMinutes("30");
    setAnkiCards("");
    setActivity("Anki + Podcast");
    setNotes("");
  };

  const dailyGoal = 30;
  const todayMinutes = progress?.anki_time 
    ? progress.anki_time + Math.floor((progress.radio_hours * 60) + progress.tandem_minutes)
    : 0;
  const progressPercent = Math.min(100, (todayMinutes / dailyGoal) * 100);

  const activities = [
    "Anki + Podcast",
    "Anki Only",
    "Tandem Session",
    "Radio/Listening",
    "Grammar Study",
    "Reading",
  ];

  return (
    <div className="max-w-6xl mx-auto pb-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <span className="text-4xl">{EMOJIS.FLAG}</span>
          <div>
            <h1 className="text-2xl font-bold text-white">German HQ</h1>
            <p className="text-sm text-secondary">Deutsch lernen - Consistency is key</p>
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
      <AnimatePresence>
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
              <h2 className="text-xl font-semibold text-white mb-4">{EMOJIS.FLAG} Log German Session</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="duration" className="block text-sm text-secondary mb-1">Duration (minutes)</label>
                  <input
                    id="duration"
                    type="number"
                    min="5"
                    max="180"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full input-field"
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label htmlFor="activity" className="block text-sm text-secondary mb-1">Activity Type</label>
                  <select
                    id="activity"
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                    className="w-full input-field"
                  >
                    {activities.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-secondary mb-1">Anki Cards (optional)</label>
                  <input
                    type="number"
                    min="0"
                    value={ankiCards}
                    onChange={(e) => setAnkiCards(e.target.value)}
                    placeholder="e.g., 50"
                    className="w-full input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm text-secondary mb-1">Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="How did it go?"
                    rows={2}
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
      </AnimatePresence>

      {isLoading ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-secondary">Loading progress...</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-4">
            <StatCard
              label="Today"
              value={`${todayMinutes}m`}
              subtext={`Goal: ${dailyGoal}m`}
              icon={EMOJIS.CLOCK}
              color="yellow"
            />
            <StatCard
              label="Anki Cards"
              value={(progress?.anki_cards || 0).toString()}
              subtext="Today"
              icon={EMOJIS.CARDS}
              color="cyan"
            />
            <StatCard
              label="Progress"
              value={`${Math.round(progressPercent)}%`}
              subtext={progressPercent >= 100 ? "Goal reached!" : `${dailyGoal - todayMinutes}m to go`}
              icon={EMOJIS.CHART}
              color="purple"
            />
            <StatCard
              label="Level"
              value="A2.1"
              subtext="Moving to A2.2"
              icon={EMOJIS.TROPHY}
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
                <span className="text-muted">{todayMinutes}m / {dailyGoal}m</span>
                <span className={progressPercent >= 100 ? "text-green-400" : "text-cyan"}>
                  {progressPercent >= 100 ? "✓ Complete" : `${Math.round(progressPercent)}%`}
                </span>
              </div>
              <div className="progress-bar h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8 }}
                  className={`progress-fill h-full rounded-full ${
                    progressPercent >= 100 
                      ? "bg-green-500" 
                      : "bg-linear-to-r from-yellow-500 to-cyan-500"
                  }`}
                />
              </div>
            </div>
          </motion.div>

          {/* Today's Session Details */}
          {progress && todayMinutes > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Today&apos;s Session</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-gray-900/50">
                  <p className="text-muted">Anki Time</p>
                  <p className="text-white font-semibold">{progress.anki_time} min</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-900/50">
                  <p className="text-muted">Listening</p>
                  <p className="text-white font-semibold">{progress.radio_hours.toFixed(1)}h</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-900/50">
                  <p className="text-muted">Tandem</p>
                  <p className="text-white font-semibold">{progress.tandem_minutes} min</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-900/50">
                  <p className="text-muted">Cards</p>
                  <p className="text-white font-semibold">{progress.anki_cards}</p>
                </div>
              </div>
              {progress.notes && (
                <p className="mt-4 text-sm text-muted italic">&ldquo;{progress.notes}&rdquo;</p>
              )}
            </motion.div>
          )}

          {/* Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Learning Tips</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li>• Do Anki every day - consistency beats intensity</li>
              <li>• Listen to German podcasts during commute</li>
              <li>• Find a tandem partner for speaking practice</li>
              <li>• Track your time - 30 min daily = 180 hours/year</li>
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
  color: "cyan" | "purple" | "orange" | "green" | "yellow";
}) {
  const colorClasses = {
    cyan: "from-cyan/20 to-cyan/5 border-cyan/30",
    purple: "from-purple/20 to-purple/5 border-purple/30",
    orange: "from-orange/20 to-orange/5 border-orange/30",
    green: "from-green/20 to-green/5 border-green/30",
    yellow: "from-yellow/20 to-yellow/5 border-yellow/30",
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
