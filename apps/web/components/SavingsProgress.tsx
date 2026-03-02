"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { EMOJIS } from "@/lib/emojis";
import type { FinanceProfile } from "@/types";

function sumFixedCosts(profile: FinanceProfile | null): number {
  if (!profile) {
    return 0;
  }

  if (typeof profile.monthly_fixed_costs === "number" && profile.monthly_fixed_costs > 0) {
    return profile.monthly_fixed_costs;
  }

  return Object.values(profile.fixed_costs_breakdown || {}).reduce(
    (sum, value) => sum + (typeof value === "number" ? value : 0),
    0
  );
}

function formatBudgetKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function SavingsProgress() {
  const [profile, setProfile] = useState<FinanceProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editAmount, setEditAmount] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const financeProfile = await api.getFinance();
        setProfile(financeProfile);
        setEditAmount(String(financeProfile.current_savings));
      } catch (error) {
        console.error("Failed to load savings progress:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const fixedCosts = sumFixedCosts(profile);
  const foodBudget = profile?.food_budget || 0;
  const discretionaryBudget = profile?.discretionary_budget || 0;
  const monthlyCapacity = Math.max(
    0,
    (profile?.monthly_income || 0) - fixedCosts - foodBudget - discretionaryBudget
  );
  const goal = profile?.savings_goal || 0;
  const currentSavings = profile?.current_savings || 0;
  const percentage = goal > 0 ? Math.min(100, (currentSavings / goal) * 100) : 0;
  const remaining = Math.max(0, goal - currentSavings);
  const targetDate = profile?.savings_goal_target_date
    ? new Date(profile.savings_goal_target_date)
    : null;
  const daysLeft = targetDate
    ? Math.max(0, Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;
  const monthsLeft = daysLeft > 0 ? daysLeft / 30.44 : 0;
  const requiredMonthlySavings = monthsLeft > 0 ? remaining / monthsLeft : 0;
  const monthlyGap = Math.max(0, requiredMonthlySavings - monthlyCapacity);

  const handleSave = async () => {
    if (!profile) {
      return;
    }

    setIsSaving(true);
    try {
      const amount = Number.parseFloat(editAmount);
      const updated = await api.updateFinanceProfile({
        ...profile,
        current_savings: Number.isFinite(amount) ? amount : profile.current_savings,
      });
      setProfile(updated);
      setEditAmount(String(updated.current_savings));
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update savings amount:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const status =
    percentage >= 100
      ? { label: "Goal reached", color: "#10b981", icon: "🏆" }
      : percentage >= 60
        ? { label: "On track", color: "#06b6d4", icon: "📈" }
        : percentage >= 30
          ? { label: "Building buffer", color: "#f59e0b", icon: "⚡" }
          : { label: "Early stage", color: "#ef4444", icon: "🌱" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-3xl p-6 mb-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{EMOJIS.CAPITAL}</span>
          <div>
            <h3 className="text-xl font-bold text-white">Savings Buffer</h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              Backed by the new finance profile in Rust
            </p>
          </div>
        </div>
        <div
          className="px-3 py-1 rounded-full text-sm font-semibold border"
          style={{ borderColor: status.color, color: status.color, backgroundColor: `${status.color}15` }}
        >
          {status.icon} {status.label}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-[var(--color-text-muted)]">Loading savings profile...</div>
      ) : !profile ? (
        <div className="text-center py-10 text-[var(--color-text-muted)]">Finance profile unavailable.</div>
      ) : (
        <>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="relative mx-auto lg:mx-0">
              <svg width="180" height="180" className="transform -rotate-90">
                <circle cx="90" cy="90" r="76" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="14" />
                <motion.circle
                  cx="90"
                  cy="90"
                  r="76"
                  fill="none"
                  stroke={status.color}
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={`${(percentage / 100) * 478} 478`}
                  initial={{ strokeDashoffset: 478 }}
                  animate={{ strokeDashoffset: 478 - (percentage / 100) * 478 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  style={{ filter: `drop-shadow(0 0 20px ${status.color}50)` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold font-mono text-white">{percentage.toFixed(0)}%</span>
                <span className="text-xs text-[var(--color-text-muted)]">of target</span>
              </div>
            </div>

            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <label htmlFor="current-savings" className="block text-sm text-[var(--color-text-muted)]">
                    Current savings
                  </label>
                  <input
                    id="current-savings"
                    type="number"
                    value={editAmount}
                    onChange={(event) => setEditAmount(event.target.value)}
                    className="w-full max-w-60 input-field text-2xl font-bold"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={() => void handleSave()} disabled={isSaving} className="btn-primary disabled:opacity-50">
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => {
                        setEditAmount(String(profile.current_savings));
                        setIsEditing(false);
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <div className="text-4xl font-bold text-white mb-1">
                    EUR {currentSavings.toLocaleString()}
                  </div>
                  <p className="text-[var(--color-text-secondary)] mb-4">
                    of EUR {goal.toLocaleString()} target
                  </p>
                  <button onClick={() => setIsEditing(true)} className="btn-secondary text-sm">
                    Update current savings
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <MetricCard label="Remaining" value={`EUR ${remaining.toLocaleString()}`} color="#f59e0b" />
                <MetricCard label="Monthly target" value={`EUR ${(profile.monthly_savings_target || 0).toFixed(0)}`} color="#06b6d4" />
                <MetricCard label="Capacity" value={`EUR ${monthlyCapacity.toFixed(0)}`} color="#10b981" />
                <MetricCard label="Days left" value={daysLeft.toString()} color="#8b5cf6" />
              </div>

              <div className="mt-5 p-4 rounded-xl bg-black/20 border border-white/10 space-y-2">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Goal deadline: {profile.savings_goal_target_date || "Not set"}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Monthly fixed costs: EUR {fixedCosts.toFixed(0)} | Food: EUR {foodBudget.toFixed(0)} | Discretionary: EUR {discretionaryBudget.toFixed(0)}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Required monthly savings: EUR {requiredMonthlySavings.toFixed(0)}
                </p>
                {monthlyGap > 0 && (
                  <p className="text-sm text-red-400">
                    Current plan is short by about EUR {monthlyGap.toFixed(0)} per month.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3">Fixed cost breakdown</h4>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(profile.fixed_costs_breakdown || {}).map(([key, value]) => (
                <div key={key} className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-sm text-white">{formatBudgetKey(key)}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">EUR {value}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
      <div className="text-xs text-[var(--color-text-muted)]">{label}</div>
      <div className="text-lg font-bold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
