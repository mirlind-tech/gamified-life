"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { EMOJIS } from "@/lib/emojis";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import type { ProtocolEntry } from "@/types";

// Protocol data from backend API
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
  { key: "wake05", label: "05:00 Wake up", icon: EMOJIS.SUN, description: "Start the day early" },
  { key: "german_study", label: "German Study (30 min)", icon: EMOJIS.FLAG, description: "Language consistency" },
  { key: "gym_workout", label: "Gym Workout", icon: EMOJIS.VESSEL, description: "Physical strength" },
  { key: "coding_hours", label: "Coding Deep Work", icon: EMOJIS.CODE, description: "2+ hours focused" },
  { key: "sleep22", label: "22:00 Sleep", icon: EMOJIS.MOON, description: "Recovery & growth" },
] as const;

export default function ProtocolPage() {
  const [protocol, setProtocol] = useState<ProtocolData | null>(null);
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");

  const { 
    isSupported, 
    permission, 
    requestPermission, 
    scheduleProtocolReminders,
    notify 
  } = usePushNotifications();

  const today = new Date().toISOString().split("T")[0];

  // Schedule reminders when protocol loads
  useEffect(() => {
    if (permission === "granted") {
      scheduleProtocolReminders();
    }
  }, [permission, scheduleProtocolReminders]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [protocolData, streakData] = await Promise.all([
        api.getProtocol(today),
        api.getProtocolStreak(),
      ]);
      setProtocol(protocolData as unknown as ProtocolData);
      setStreak({
        current: streakData.current_streak,
        longest: streakData.longest_streak,
      });
      setNotes((protocolData as unknown as ProtocolData).notes || "");
    } catch (error) {
      console.error("Failed to load protocol:", error);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleToggle = async (key: string) => {
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

  const handleSaveNotes = async () => {
    if (!protocol) return;
    
    setSaving(true);
    try {
      const response = await api.createProtocol({
        date: today,
        wake05: protocol.wake05,
        germanStudy: protocol.german_study,
        gymWorkout: protocol.gym_workout,
        sleep22: protocol.sleep22,
        codingHours: protocol.coding_hours,
        notes,
      } as unknown as Partial<ProtocolEntry>);

      setProtocol(response as unknown as ProtocolData);
    } catch (error) {
      console.error("Failed to save notes:", error);
    } finally {
      setSaving(false);
    }
  };

  // Calculate completion
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
  const isComplete = completionPercent >= 80;

  return (
    <div className="max-w-4xl mx-auto pb-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{EMOJIS.SCROLL}</span>
            <div>
              <h1 className="text-2xl font-bold text-white">Daily Protocol</h1>
              <p className="text-sm text-secondary">Discipline equals freedom</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Notification Toggle */}
            {isSupported && permission !== "granted" && (
              <button
                onClick={requestPermission}
                className="px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm hover:bg-yellow-500/20 transition-colors"
              >
                🔔 Enable Reminders
              </button>
            )}
            {isSupported && permission === "granted" && (
              <button
                onClick={() => notify("Test Notification", "Protocol reminders are active!")}
                className="px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm hover:bg-green-500/20 transition-colors"
              >
                🔔 Active
              </button>
            )}
            
            <div className="flex gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-cyan">{streak.current}</p>
                <p className="text-xs text-muted">Day Streak</p>
              </div>
              <div className="w-px bg-border" />
              <div>
                <p className="text-2xl font-bold text-purple">{streak.longest}</p>
                <p className="text-xs text-muted">Best</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Progress Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`glass-card rounded-2xl p-6 border ${
          isComplete ? "border-green-500/30 bg-green-500/5" : ""
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Today&apos;s Progress</h3>
          <span className={`text-2xl font-bold ${isComplete ? "text-green-400" : "text-cyan"}`}>
            {completionPercent}%
          </span>
        </div>
        <div className="progress-bar h-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercent}%` }}
            transition={{ duration: 0.8 }}
            className={`progress-fill h-full rounded-full ${
              isComplete 
                ? "bg-green-500" 
                : "bg-linear-to-r from-cyan-500 to-purple-500"
            }`}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm text-muted">
          <span>{completedCount} of {totalItems} completed</span>
          <span>{isComplete ? "✓ Protocol Complete!" : `${totalItems - completedCount} remaining`}</span>
        </div>
      </motion.div>

      {/* Protocol Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Protocol Items</h3>
        
        {loading ? (
          <div className="text-center py-8 text-muted">Loading...</div>
        ) : (
          <div className="space-y-3">
            {PROTOCOL_ITEMS.map((item, index) => {
              const isCompleted =
                item.key === "coding_hours"
                  ? (protocol?.coding_hours || 0) > 0
                  : protocol?.[item.key as keyof ProtocolData] === true;

              return (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  onClick={() => !saving && handleToggle(item.key)}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all cursor-pointer ${
                    isCompleted
                      ? "bg-green-500/10 border border-green-500/30"
                      : "bg-gray-900/50 hover:bg-gray-800/50 border border-transparent"
                  } ${saving ? "opacity-50" : ""}`}
                >
                  <button
                    type="button"
                    disabled={saving}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(item.key);
                    }}
                    className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-colors ${
                      isCompleted 
                        ? "bg-green-500 border-green-500" 
                        : "border-gray-600 hover:border-cyan"
                    }`}
                  >
                    {isCompleted && (
                      <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1">
                    <p className={`font-medium ${isCompleted ? "text-muted line-through" : "text-white"}`}>
                      {item.label}
                    </p>
                    <p className="text-xs text-muted">{item.description}</p>
                  </div>
                  {isCompleted && <span className="text-green-400 text-sm">✓ Done</span>}
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Notes Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Daily Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did today go? Any observations or reflections?"
          rows={4}
          className="w-full input-field resize-none mb-4"
        />
        <div className="flex justify-end">
          <button
            onClick={handleSaveNotes}
            disabled={saving}
            className="cyber-button text-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : `${EMOJIS.SAVE} Save Notes`}
          </button>
        </div>
      </motion.div>

      {/* Rules Reminder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Protocol Rules</h3>
        <ul className="space-y-2 text-sm text-muted">
          <li>• Complete 4+ items to maintain your streak (80%+ score)</li>
          <li>• Wake at 05:00 - no snooze, no excuses</li>
          <li>• Minimum 30min German study daily</li>
          <li>• Gym 4x per week minimum</li>
          <li>• 2+ hours of deep coding work</li>
          <li>• Sleep by 22:00 for recovery</li>
        </ul>
      </motion.div>
    </div>
  );
}
