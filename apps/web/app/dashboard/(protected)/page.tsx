"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { 
  Trophy, 
  Target, 
  Flame, 
  Star, 
  Dumbbell,
  Languages,
  Code,
  ArrowRight 
} from "lucide-react";
import { WeeklyScorecard, SavingsProgress, JobHuntTracker } from "@/components";
import type { PlayerStats, ProtocolStreak, ProtocolEntry } from "@/types";

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
  { key: "wake05", label: "05:00 Wake up", icon: "sun" },
  { key: "german_study", label: "German Study", icon: "flag" },
  { key: "gym_workout", label: "Gym Workout", icon: "dumbbell" },
  { key: "coding_hours", label: "Deep Work", icon: "code" },
  { key: "sleep22", label: "22:00 Sleep", icon: "moon" },
] as const;

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [streak, setStreak] = useState<ProtocolStreak | null>(null);
  const [protocol, setProtocol] = useState<ProtocolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(new Date().toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    if (!today) return;

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

  const completedCount = protocol
    ? [protocol.wake05, protocol.german_study, protocol.gym_workout, protocol.sleep22, protocol.coding_hours > 0].filter(Boolean).length
    : 0;
  const totalItems = 5;
  const completionPercent = Math.round((completedCount / totalItems) * 100);

  const handleProtocolToggle = async (key: string) => {
    if (!protocol || saving) return;

    setSaving(true);
    try {
      const updated = { ...protocol };
      if (key === "coding_hours") {
        updated.coding_hours = updated.coding_hours > 0 ? 0 : 2;
      } else {
        const boolKey = key as "wake05" | "german_study" | "gym_workout" | "sleep22";
        updated[boolKey] = !updated[boolKey];
      }

      const response = await api.createProtocol({
        date: today,
        wake05: updated.wake05,
        germanStudy: updated.german_study,
        gymWorkout: updated.gym_workout,
        sleep22: updated.sleep22,
        codingHours: updated.coding_hours,
        notes: updated.notes,
      } as unknown as Partial<ProtocolEntry>);

      setProtocol(response as unknown as ProtocolData);
    } catch (error) {
      console.error("Failed to update protocol:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Welcome back, <span className="text-cyan-400">{user?.username}</span>
          </h1>
          <p className="text-sm text-[#6b6b80] mt-0.5">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Level Badge */}
        <div className="flex items-center gap-4 bg-[#12121a] border border-[#ffffff0f] rounded-xl px-5 py-3">
          <div className="text-right">
            <p className="text-[10px] text-[#6b6b80] uppercase tracking-wider">Level</p>
            <p className="text-xl font-bold text-cyan-400">{loading ? "—" : stats?.level || 1}</p>
          </div>
          <div className="w-px h-8 bg-[#ffffff0f]" />
          <div className="w-28">
            <div className="flex justify-between text-[10px] text-[#6b6b80] mb-1">
              <span>XP</span>
              <span className="text-cyan-400">{xpProgress}%</span>
            </div>
            <div className="h-1.5 bg-[#1a1a25] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total XP" value={stats?.total_xp_earned || 0} icon={Trophy} color="purple" loading={loading} />
        <StatCard title="XP to Next" value={stats?.xp_to_next || "—"} icon={Target} color="cyan" loading={loading} />
        <StatCard title="Streak" value={streak?.current_streak || 0} suffix="days" icon={Flame} color="yellow" loading={loading} />
        <StatCard title="Current XP" value={stats?.xp || 0} icon={Star} color="pink" loading={loading} />
      </div>

      {/* Weekly & Trackers */}
      <WeeklyScorecard />
      <SavingsProgress />
      <JobHuntTracker />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Protocol */}
        <div className="lg:col-span-2 bg-[#12121a] border border-[#ffffff0f] rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white">Daily Protocol</h2>
            <span className="px-2.5 py-1 bg-cyan-500/10 text-cyan-400 text-[10px] font-medium uppercase tracking-wider rounded-full border border-cyan-500/20">
              Active
            </span>
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-8 text-[#6b6b80]">Loading...</div>
            ) : (
              PROTOCOL_ITEMS.map((item) => {
                const completed = item.key === "coding_hours" 
                  ? (protocol?.coding_hours || 0) > 0 
                  : item.key === "wake05" 
                    ? protocol?.wake05
                    : item.key === "german_study"
                      ? protocol?.german_study
                      : item.key === "gym_workout"
                        ? protocol?.gym_workout
                        : protocol?.sleep22;
                
                return (
                  <button
                    key={item.key}
                    onClick={() => handleProtocolToggle(item.key)}
                    disabled={saving}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-lg transition-all
                      ${completed 
                        ? "bg-green-500/10 border border-green-500/20" 
                        : "bg-[#1a1a25] hover:bg-[#22222e] border border-transparent"
                      }
                      ${saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                    `}
                  >
                    <div className={`
                      w-5 h-5 rounded border flex items-center justify-center transition-colors
                      ${completed 
                        ? "bg-green-500 border-green-500" 
                        : "border-[#4a4a5c]"
                      }
                    `}>
                      {completed && <span className="text-black text-xs">✓</span>}
                    </div>
                    <span className={`flex-1 text-sm ${completed ? "text-[#6b6b80] line-through" : "text-white"}`}>
                      {item.label}
                    </span>
                    {completed && <span className="text-xs text-green-400">Done</span>}
                  </button>
                );
              })
            )}
          </div>

          {/* Progress */}
          <div className="mt-5 pt-4 border-t border-[#ffffff0f]">
            <div className="flex justify-between text-xs text-[#6b6b80] mb-2">
              <span>Completion</span>
              <span className="text-cyan-400 font-mono">{completedCount}/{totalItems}</span>
            </div>
            <div className="h-2 bg-[#1a1a25] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-cyan-500"
                initial={{ width: 0 }}
                animate={{ width: `${completionPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#12121a] border border-[#ffffff0f] rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <QuickAction icon={Dumbbell} label="Log Workout" onClick={() => router.push("/dashboard/body")} />
            <QuickAction icon={Languages} label="German Session" onClick={() => router.push("/dashboard/german")} />
            <QuickAction icon={Code} label="Log Coding" onClick={() => router.push("/dashboard/code")} />
          </div>
        </div>
      </div>

      {/* Quote */}
      <div className="bg-[#12121a] border border-[#ffffff0f] rounded-xl p-5 border-l-2 border-l-cyan-500">
        <blockquote className="text-[#a1a1b5] italic">
          "Strength is the only virtue. The weak are destined to be slaves."
        </blockquote>
        <cite className="block mt-2 text-sm text-cyan-400 not-italic">— Fang Yuan</cite>
      </div>
    </div>
  );
}

function StatCard({ title, value, suffix = "", icon: Icon, color, loading }: {
  title: string;
  value: string | number;
  suffix?: string;
  icon: typeof Trophy;
  color: "cyan" | "purple" | "yellow" | "pink" | "green";
  loading: boolean;
}) {
  const colors: Record<string, string> = {
    cyan: "text-cyan-400",
    purple: "text-purple-400",
    yellow: "text-yellow-400",
    pink: "text-pink-400",
    green: "text-green-400",
  };

  return (
    <div className="bg-[#12121a] border border-[#ffffff0f] rounded-xl p-4 hover:border-[#ffffff12] transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] text-[#6b6b80] uppercase tracking-wider mb-1">{title}</p>
          <p className={`text-xl font-bold ${loading ? "skeleton w-12 h-6 rounded" : colors[color]}`}>
            {loading ? "" : `${value}${suffix ? ` ${suffix}` : ""}`}
          </p>
        </div>
        <Icon className={`w-5 h-5 ${colors[color]} opacity-60`} />
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick }: {
  icon: typeof Dumbbell;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 bg-[#1a1a25] hover:bg-[#22222e] rounded-lg transition-colors group"
    >
      <Icon className="w-4 h-4 text-[#6b6b80] group-hover:text-cyan-400 transition-colors" />
      <span className="flex-1 text-sm text-[#a1a1b5] group-hover:text-white transition-colors text-left">{label}</span>
      <ArrowRight className="w-4 h-4 text-[#4a4a5c] group-hover:text-cyan-400 transition-colors" />
    </button>
  );
}
