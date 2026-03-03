"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { EMOJIS } from "@/lib/emojis";

const EXPENSE_CATEGORIES = [
  { key: "food", label: "Food & Groceries", icon: "🍽️" },
  { key: "transport", label: "Transport", icon: "🚌" },
  { key: "utilities", label: "Utilities", icon: "💡" },
  { key: "gym", label: "Gym & Health", icon: "💪" },
  { key: "learning", label: "Learning", icon: "📚" },
  { key: "entertainment", label: "Entertainment", icon: "🎮" },
  { key: "other", label: "Other", icon: "📦" },
];

export default function ExpensePage() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.createFinanceEntry({
        amount: parseFloat(amount),
        category,
        description: description || undefined,
        date,
        entry_type: "expense",
      });

      setSuccess(true);
      setAmount("");
      setDescription("");
      
      setTimeout(() => {
        router.push("/dashboard/finance");
      }, 1500);
    } catch (err) {
      console.error("Failed to save expense:", err);
      setError("Failed to save expense. Please try again.");
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
          onClick={() => router.push("/dashboard/finance")}
          className="text-sm text-muted hover:text-white mb-4 flex items-center gap-1"
        >
          ← Back to Finance HQ
        </button>
        <div className="flex items-center gap-4">
          <span className="text-4xl">{EMOJIS.MONEY}</span>
          <div>
            <h1 className="text-2xl font-bold text-white">Add Expense</h1>
            <p className="text-sm text-secondary">Track your spending</p>
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
            ✓ Expense logged successfully.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Amount (€)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="25.00"
                required
                className="w-full input-field text-2xl font-bold"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted">€</span>
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {EXPENSE_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setCategory(cat.key)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    category === cat.key
                      ? "border-cyan bg-cyan/10"
                      : "border-border hover:border-gray-600"
                  }`}
                >
                  <span className="text-lg mr-2">{cat.icon}</span>
                  <span className={category === cat.key ? "text-white" : "text-muted"}>
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Date Input */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-secondary mb-2">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full input-field"
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Weekly groceries, Train ticket..."
              className="w-full input-field"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard/finance")}
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
                `${EMOJIS.SAVE} Save Expense`
              )}
            </button>
          </div>
        </form>

        {/* Tips */}
        <div className="mt-8 pt-6 border-t border-border">
          <h3 className="text-sm font-medium text-secondary mb-3">Tips</h3>
          <ul className="space-y-2 text-sm text-muted">
            <li>• Track expenses immediately for accuracy</li>
            <li>• Review weekly to spot spending patterns</li>
            <li>• Categorize consistently for better insights</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
