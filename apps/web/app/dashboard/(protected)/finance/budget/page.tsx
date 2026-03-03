"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { EMOJIS } from "@/lib/emojis";
import type { FinanceProfile } from "@/types";

function normalizeProfile(profile: FinanceProfile): FinanceProfile {
  return {
    ...profile,
    fixed_costs_breakdown: profile.fixed_costs_breakdown || {},
    monthly_fixed_costs:
      profile.monthly_fixed_costs ||
      Object.values(profile.fixed_costs_breakdown || {}).reduce((sum, value) => sum + value, 0),
  };
}

export default function BudgetPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<FinanceProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const financeProfile = await api.getFinance();
        setProfile(normalizeProfile(financeProfile));
      } catch (loadError) {
        console.error("Failed to load finance profile:", loadError);
        setError("Failed to load finance profile.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const updateField = <K extends keyof FinanceProfile>(key: K, value: FinanceProfile[K]) => {
    setProfile((current) => (current ? { ...current, [key]: value } : current));
  };

  const updateFixedCost = (key: string, value: number) => {
    setProfile((current) => {
      if (!current) {
        return current;
      }

      const fixed_costs_breakdown = {
        ...(current.fixed_costs_breakdown || {}),
        [key]: value,
      };

      const monthly_fixed_costs = Object.values(fixed_costs_breakdown).reduce(
        (sum, amount) => sum + amount,
        0
      );

      return {
        ...current,
        fixed_costs_breakdown,
        monthly_fixed_costs,
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await api.updateFinanceProfile(profile);
      router.push("/dashboard/finance");
    } catch (saveError) {
      console.error("Failed to save finance profile:", saveError);
      setError("Failed to save finance profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6"
      >
        <button
          onClick={() => router.push("/dashboard/finance")}
          className="text-sm text-muted hover:text-white mb-4"
        >
          {"<-"} Back to Finance HQ
        </button>
        <div className="flex items-center gap-4">
          <span className="text-4xl">{EMOJIS.CALENDAR}</span>
          <div>
            <h1 className="text-2xl font-bold text-white">Budget Settings</h1>
            <p className="text-sm text-secondary">Edit the finance profile served by the Rust gateway</p>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="glass-card rounded-2xl p-8 text-center text-secondary">Loading budget...</div>
      ) : !profile ? (
        <div className="glass-card rounded-2xl p-8 text-center text-red-400">{error || "Profile unavailable."}</div>
      ) : (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="glass-card rounded-2xl p-6 space-y-6"
        >
          {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">{error}</div>}

          <div className="grid md:grid-cols-2 gap-4">
            <LabeledNumberInput
              label="Monthly income"
              value={profile.monthly_income}
              onChange={(value) => updateField("monthly_income", value)}
            />
            <LabeledNumberInput
              label="Current savings"
              value={profile.current_savings}
              onChange={(value) => updateField("current_savings", value)}
            />
            <LabeledNumberInput
              label="Food budget"
              value={profile.food_budget || 0}
              onChange={(value) => updateField("food_budget", value)}
            />
            <LabeledNumberInput
              label="Discretionary budget"
              value={profile.discretionary_budget || 0}
              onChange={(value) => updateField("discretionary_budget", value)}
            />
            <LabeledNumberInput
              label="Savings goal"
              value={profile.savings_goal}
              onChange={(value) => updateField("savings_goal", value)}
            />
            <LabeledNumberInput
              label="Monthly savings target"
              value={profile.monthly_savings_target || 0}
              onChange={(value) => updateField("monthly_savings_target", value)}
            />
          </div>

          <div>
            <label htmlFor="goal-target-date" className="block text-sm font-medium text-secondary mb-2">Goal target date</label>
            <input
              id="goal-target-date"
              type="date"
              value={profile.savings_goal_target_date || ""}
              onChange={(event) => updateField("savings_goal_target_date", event.target.value)}
              className="w-full input-field"
              aria-label="Goal target date"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-white">Fixed costs</h2>
              <span className="text-sm text-cyan">EUR {(profile.monthly_fixed_costs || 0).toFixed(0)} total</span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(profile.fixed_costs_breakdown || {}).map(([key, value]) => (
                <LabeledNumberInput
                  key={key}
                  label={key.replace(/_/g, " ")}
                  value={value}
                  onChange={(amount) => updateFixedCost(key, amount)}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => router.push("/dashboard/finance")} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="btn-primary flex-1 disabled:opacity-50">
              {isSaving ? "Saving..." : "Save Budget"}
            </button>
          </div>
        </motion.form>
      )}
    </div>
  );
}

function LabeledNumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (_value: number) => void;
}) {
  const inputId = `input-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-secondary mb-2 capitalize">{label}</label>
      <input
        id={inputId}
        type="number"
        step="0.01"
        value={value}
        onChange={(event) => onChange(Number(event.target.value || 0))}
        className="w-full input-field"
        aria-label={label}
      />
    </div>
  );
}
