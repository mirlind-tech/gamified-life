"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { EMOJIS } from "@/lib/emojis";

export default function WeightLogPage() {
  const router = useRouter();
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!weight || parseFloat(weight) <= 0) {
      setError("Please enter a valid weight");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.addWeightEntry({
        weight: parseFloat(weight),
        date,
        notes: notes || undefined,
      });
      
      setSuccess(true);
      setWeight("");
      setNotes("");
      
      // Redirect after short delay
      setTimeout(() => {
        router.push("/dashboard/body");
      }, 1500);
    } catch (err) {
      console.error("Failed to log weight:", err);
      setError("Failed to save weight entry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 mb-6"
      >
        <button
          onClick={() => router.push("/dashboard/body")}
          className="text-sm text-muted hover:text-white mb-4 flex items-center gap-1"
        >
          ← Back to Body HQ
        </button>
        <div className="flex items-center gap-4">
          <span className="text-4xl">{EMOJIS.WEIGHT}</span>
          <div>
            <h1 className="text-2xl font-bold text-white">Log Weight</h1>
            <p className="text-sm text-secondary">Track your body weight progression</p>
          </div>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-6"
      >
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400">
            ✓ Weight logged successfully! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Weight Input */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Weight (kg)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="75.5"
                required
                className="w-full input-field text-2xl font-bold"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted">kg</span>
            </div>
          </div>

          {/* Date Input */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full input-field"
            />
          </div>

          {/* Notes Input */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How are you feeling? Any observations?"
              rows={3}
              className="w-full input-field resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard/body")}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                `${EMOJIS.SAVE} Save Entry`
              )}
            </button>
          </div>
        </form>

        {/* Quick Stats */}
        <div className="mt-8 pt-6 border-t border-border">
          <h3 className="text-sm font-medium text-secondary mb-3">Quick Tips</h3>
          <ul className="space-y-2 text-sm text-muted">
            <li>• Weigh yourself at the same time each day (morning is best)</li>
            <li>• Use the same scale for consistency</li>
            <li>• Track trends over weeks, not daily fluctuations</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
