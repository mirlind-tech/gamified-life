"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { EMOJIS } from "@/lib/emojis";
import { WeeklyScorecard, SavingsProgress, JobHuntTracker } from "@/components";
import type { PlayerStats, ProtocolStreak, ProtocolEntry } from "@/types";

// Protocol data structure from backend
interface ProtocolData {
  id: string | null;
  date: string;
  score: number;
  notes: string;
  wake05: boolean;
  german_study: boolean;
  gym_workout: boolean;
  sleep22: boolean;
  coding_hours: number;
}

const PROTOCOL_ITEMS = [
  { key: "wake05", label: "05:00 Wake up", icon: EMOJIS.SUN },
  { key: "german_study", label: "German Study (30 min)", icon: EMOJIS.FLAG },
  { key: "gym_workout", label: "Gym Workout", icon: EMOJIS.VESSEL },
  { key: "coding_hours", label: "Coding Deep Work", icon: EMOJIS.CODE },
  { key: "sleep22", label: "22:00 Sleep", icon: EMOJIS.MOON },
] as const;

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [streak, setStreak] = useState<ProtocolStreak | null>(null);
  const [protocol, setProtocol] = useState<ProtocolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, streakData, protocolData] = await Promise.all([
          api.getPlayerStats(),
          api.getProtocolStreak(),
          api.getProtocol(today),
        ]);
        setStats(statsData as PlayerStats);
        setStreak(streakData as ProtocolStreak);
        setProtocol(protocolData as unknown as ProtocolData);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [today]);

  const xpProgress = stats ? Math.round((stats.xp / stats.xp_to_next) * 100) : 0;

  // Calculate completion count
  const completedCount = protocol
    ? [
        protocol.wake05,
        protocol.german_study,
        protocol.gym_workout,
        protocol.sleep22,
        protocol.coding_hours > 0,
      ].filter(Boolean).length
    : 0;
  const totalItems = 5;
  const completionPercent = Math.round((completedCount / totalItems) * 100);

  const handleProtocolToggle = async (key: string) => {
    if (!protocol || saving) return;

    setSaving(true);
    try {
      const updatedProtocol = { ...protocol };
      
      if (key === "coding_hours") {
        updatedProtocol.coding_hours = updatedProtocol.coding_hours > 0 ? 0 : 2;
      } else {
        const boolKey = key as "wake05" | "german_study" | "gym_workout" | "sleep22";
        updatedProtocol[boolKey] = !updatedProtocol[boolKey];
      }

      // API expects camelCase field names matching backend CreateProtocolRequest
      const response = await api.createProtocol({
        date: today,
        wake05: updatedProtocol.wake05,
        germanStudy: updatedProtocol.german_study,
        gymWorkout: updatedProtocol.gym_workout,
        sleep22: updatedProtocol.sleep22,
        codingHours: updatedProtocol.coding_hours,
        notes: updatedProtocol.notes,
      } as unknown as Partial<ProtocolEntry>);

      setProtocol(response as unknown as ProtocolData);
    } catch (error) {
      console.error("Failed to update protocol:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            Welcome back, <span className="gradient-text">{user?.username}</span>
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            System online •{" "}
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Level Badge */}
        <div className="flex items-center gap-4 glass-card px-6 py-3">
          <div className="text-right">
            <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Level</p>
            <p className="text-2xl font-bold text-[var(--color-accent-cyan)]">
              {loading ? "—" : stats?.level || 1}
            </p>
          </div>
          <div className="w-px h-10 bg-[var(--color-border)]" />
          <div className="w-32">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[var(--color-text-muted)]">XP</span>
              <span className="text-[var(--color-accent-cyan)]">{xpProgress}%</span>
            </div>
            <div className="progress-bar">
              <motion.div
                className="progress-fill bg-gradient-to-r from-purple-500 to-[var(--color-accent-cyan)]"
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Weekly Scorecard */}
      <WeeklyScorecard />

      {/* Savings Progress */}
      <SavingsProgress />

      {/* Job Hunt Tracker */}
      <JobHuntTracker />

      {/* Protocol Check-in Success Message */}
      {completionPercent >= 80 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-4 border-green-500/30 bg-green-500/10"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{EMOJIS.FIRE}</span>
            <div>
              <p className="text-green-400 font-semibold">Protocol Day Complete!</p>
              <p className="text-sm text-muted">Streak maintained. Keep it up!</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total XP"
          value={stats?.total_xp_earned || 0}
          icon={EMOJIS.CROWN}
          color="purple"
          loading={loading}
          delay={0}
        />
        <StatCard
          title="XP to Next"
          value={stats?.xp_to_next || "—"}
          icon={EMOJIS.CODE}
          color="cyan"
          loading={loading}
          delay={0.1}
        />
        <StatCard
          title="Protocol Streak"
          value={streak?.current_streak || 0}
          suffix="days"
          icon={EMOJIS.FIRE}
          color="yellow"
          loading={loading}
          delay={0.2}
        />
        <StatCard
          title="Current XP"
          value={stats?.xp || 0}
          icon={EMOJIS.STAR}
          color="pink"
          loading={loading}
          delay={0.3}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Protocol */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{EMOJIS.SCROLL}</span>
              <h2 className="text-xl font-semibold text-white">Daily Protocol</h2>
            </div>
            <span className="px-3 py-1 bg-[var(--color-accent-cyan)]/10 text-[var(--color-accent-cyan)] text-xs rounded-full border border-[var(--color-accent-cyan)]/30 font-medium">
              ACTIVE
            </span>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-muted">Loading protocol...</div>
            ) : (
              PROTOCOL_ITEMS.map((item) => (
                <ProtocolItem
                  key={item.key}
                  label={item.label}
                  icon={item.icon}
                  completed={
                    item.key === "coding_hours"
                      ? (protocol?.coding_hours || 0) > 0
                      : protocol?.[item.key as keyof ProtocolData] === true
                  }
                  onToggle={() => handleProtocolToggle(item.key)}
                  disabled={saving}
                />
              ))
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">Completion</span>
              <span className="text-[var(--color-accent-cyan)] font-mono">
                {completedCount}/{totalItems}
              </span>
            </div>
            <div className="progress-bar mt-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPercent}%` }}
                className="progress-fill bg-[var(--color-accent-cyan)]"
              />
            </div>
            {completionPercent < 50 && completedCount > 0 && (
              <p className="text-xs text-muted mt-2">
                {totalItems - completedCount} more to reach 100%
              </p>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">{EMOJIS.GEAR}</span>
            <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
          </div>

          <div className="space-y-3">
            <QuickActionButton 
              icon={EMOJIS.VESSEL} 
              label="Log Workout" 
              onClick={() => router.push("/dashboard/body")}
            />
            <QuickActionButton 
              icon={EMOJIS.WEIGHT} 
              label="Log Weight" 
              onClick={() => router.push("/dashboard/body/weight")}
            />
            <QuickActionButton 
              icon={EMOJIS.FLAG} 
              label="German Session" 
              onClick={() => router.push("/dashboard/german")}
            />
            <QuickActionButton 
              icon={EMOJIS.CODE} 
              label="Log Coding" 
              onClick={() => router.push("/dashboard/code")}
            />
            <QuickActionButton 
              icon={EMOJIS.JOB} 
              label="Job Application" 
              onClick={() => router.push("/dashboard/career/jobs")}
            />
            <QuickActionButton 
              icon={EMOJIS.SCROLL} 
              label="Full Protocol" 
              onClick={() => router.push("/dashboard/protocol")}
            />
          </div>
        </motion.div>
      </div>

      {/* Quote Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6 border-l-4 border-l-[var(--color-accent-cyan)]"
      >
        <blockquote className="text-lg italic text-[var(--color-text-secondary)]">
          &ldquo;Strength is the only virtue. The weak are destined to be slaves.&rdquo;
        </blockquote>
        <cite className="block mt-2 text-sm text-[var(--color-accent-cyan)] not-italic font-medium">
          — Fang Yuan, Reverend Insanity
        </cite>
      </motion.div>

      {/* Daily Challenge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="cyber-card p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center text-2xl">
              {EMOJIS.TROPHY}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Daily Challenge</h3>
              <p className="text-sm text-[var(--color-text-muted)]">Complete 5 protocol items today</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#fbbf24]">+100 XP</p>
            <p className="text-xs text-[var(--color-text-muted)]">Reward</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function StatCard({
  title,
  value,
  suffix = "",
  icon,
  color,
  loading,
  delay = 0,
}: {
  title: string;
  value: string | number;
  suffix?: string;
  icon: string;
  color: "cyan" | "pink" | "yellow" | "green" | "purple";
  loading: boolean;
  delay?: number;
}) {
  const colorClasses = {
    cyan: "text-[var(--color-accent-cyan)] border-[var(--color-accent-cyan)]/30 bg-[var(--color-accent-cyan)]/5",
    pink: "text-pink-500 border-pink-500/30 bg-pink-500/5",
    yellow: "text-[#fbbf24] border-[#fbbf24]/30 bg-[#fbbf24]/5",
    green: "text-green-500 border-green-500/30 bg-green-500/5",
    purple: "text-purple-500 border-purple-500/30 bg-purple-500/5",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`glass-card p-6 border ${colorClasses[color]} hover-lift`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-1">{title}</p>
          <p className={`text-2xl font-bold ${loading ? "skeleton w-16 h-8 rounded" : ""}`}>
            {loading ? "" : `${value}${suffix ? ` ${suffix}` : ""}`}
          </p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </motion.div>
  );
}

function ProtocolItem({
  label,
  completed,
  icon,
  onToggle,
  disabled = false,
}: {
  label: string;
  completed: boolean;
  icon: string;
  onToggle?: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      onClick={!disabled ? onToggle : undefined}
      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
        completed
          ? "bg-green-500/10 border border-green-500/20"
          : "bg-gray-900/50 hover:bg-gray-800/50 border border-transparent"
      } ${onToggle && !disabled ? "cursor-pointer" : ""} ${disabled ? "opacity-50" : ""}`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          onToggle?.();
        }}
        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
          completed ? "bg-green-500 border-green-500" : "border-gray-600 hover:border-purple-500"
        } ${disabled ? "cursor-not-allowed" : ""}`}
      >
        {completed && (
          <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>
      <span className="text-lg">{icon}</span>
      <span className={`flex-1 ${completed ? "text-[var(--color-text-muted)] line-through" : "text-white"}`}>
        {label}
      </span>
      {completed && <span className="text-green-500 text-xs">✓ Done</span>}
    </div>
  );
}

function QuickActionButton({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className="w-full cyber-button flex items-center gap-3 text-sm group text-left"
    >
      <span className="text-lg group-hover:scale-110 transition-transform">{icon}</span>
      <span>{label}</span>
      <span className="ml-auto text-[var(--color-text-muted)] group-hover:text-white transition-colors">→</span>
    </button>
  );
}
