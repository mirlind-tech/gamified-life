"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";
import { EMOJIS } from "@/lib/emojis";
import type { ProtocolEntry, JournalEntry, FangYuanDaily } from "@/types";

export default function MindHQPage() {
  const [protocol, setProtocol] = useState<ProtocolEntry | null>(null);
  const [streak, setStreak] = useState(0);
  const [dailyTeaching, setDailyTeaching] = useState<FangYuanDaily | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [protocolData, streakData, teachingData] = await Promise.all([
          api.getProtocol(today).catch(() => null),
          api.getProtocolStreak(),
          api.getFangYuanDaily().catch(() => null),
        ]);
        setProtocol(protocolData);
        setStreak(streakData.current_streak);
        setDailyTeaching(teachingData);
      } catch (error) {
        console.error("Failed to load Mind HQ:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [today]);

  const protocolItems = [
    { key: "wake_time", label: "05:00 Wake up", icon: EMOJIS.SUN },
    { key: "cold_shower", label: "Cold Shower", icon: EMOJIS.FIRE },
    { key: "meditation", label: "Meditation (10 min)", icon: EMOJIS.ZEN },
    { key: "read_pages", label: "Read 10 Pages", icon: EMOJIS.JOURNAL },
    { key: "workout", label: "Gym Workout", icon: EMOJIS.VESSEL },
    { key: "no_sugar", label: "No Sugar", icon: EMOJIS.CHECK },
    { key: "sleep_time", label: "22:00 Sleep", icon: EMOJIS.MOON },
  ];

  const completedCount = protocol
    ? [
        protocol.wake_time,
        protocol.cold_shower,
        (protocol.meditation_minutes ?? 0) >= 10,
        (protocol.read_pages ?? 0) >= 10,
        protocol.workout,
        protocol.no_sugar,
        protocol.sleep_time,
      ].filter(Boolean).length
    : 0;

  return (
    <div className="max-w-6xl mx-auto pb-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <span className="text-4xl">{EMOJIS.BRAIN}</span>
          <div>
            <h1 className="text-2xl font-bold text-white">Mind HQ</h1>
            <p className="text-sm text-secondary">
              Mental clarity, discipline, and Fang Yuan philosophy
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-muted uppercase tracking-wider">Protocol Streak</p>
            <p className="text-2xl font-bold text-yellow">{streak} {EMOJIS.FIRE}</p>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-secondary">Loading mind center...</p>
        </div>
      ) : (
        <>
          {/* Daily Protocol */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{EMOJIS.SCROLL}</span>
                <h2 className="text-xl font-semibold text-white">Daily Protocol</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted">
                  {completedCount}/{protocolItems.length} Completed
                </span>
                <div className="w-32 progress-bar">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(completedCount / protocolItems.length) * 100}%` }}
                    className="progress-fill bg-gradient-to-r from-cyan to-purple"
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              {protocolItems.map((item, index) => {
                const isCompleted = protocol
                  ? item.key === "wake_time"
                    ? !!protocol.wake_time
                    : item.key === "cold_shower"
                    ? protocol.cold_shower
                    : item.key === "meditation"
                    ? (protocol.meditation_minutes ?? 0) >= 10
                    : item.key === "read_pages"
                    ? (protocol.read_pages ?? 0) >= 10
                    : item.key === "workout"
                    ? protocol.workout
                    : item.key === "no_sugar"
                    ? protocol.no_sugar
                    : item.key === "sleep_time"
                    ? !!protocol.sleep_time
                    : false
                  : false;

                return (
                  <motion.button
                    key={item.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      flex items-center gap-4 p-4 rounded-xl border transition-all
                      ${isCompleted
                        ? "bg-green/10 border-green/30"
                        : "bg-gray-900/30 border-border hover:border-purple/30"
                      }
                    `}
                  >
                    <div
                      className={`
                        w-6 h-6 rounded border-2 flex items-center justify-center transition-colors
                        ${isCompleted
                          ? "bg-green border-green"
                          : "border-gray-600"
                        }
                      `}
                    >
                      {isCompleted && (
                        <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-xl">{item.icon}</span>
                    <span className={`flex-1 text-left ${isCompleted ? "text-muted line-through" : "text-white"}`}>
                      {item.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Fang Yuan Teaching & Meditation */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Daily Teaching */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-2xl p-6 border-l-4 border-l-purple"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{EMOJIS.SCROLL}</span>
                <h3 className="text-lg font-semibold text-white">Fang Yuan&apos;s Teaching</h3>
              </div>
              
              {dailyTeaching ? (
                <>
                  <blockquote className="text-lg italic text-secondary mb-4">
                    &ldquo;{dailyTeaching.quote}&rdquo;
                  </blockquote>
                  <div className="p-4 rounded-lg bg-purple/5 border border-purple/20">
                    <p className="text-sm font-semibold text-purple mb-1">
                      Principle #{dailyTeaching.principle.number}: {dailyTeaching.principle.title}
                    </p>
                    <p className="text-sm text-muted">{dailyTeaching.principle.application}</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted">
                  <p className="text-4xl mb-2">☯️</p>
                  <p>Loading daily wisdom...</p>
                </div>
              )}

              <Link
                href="/dashboard/mind/fangyuan"
                className="mt-4 w-full cyber-button text-sm inline-block text-center"
              >
                Explore All Principles →
              </Link>
            </motion.div>

            {/* Meditation Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card rounded-2xl p-6 border-l-4 border-l-cyan"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{EMOJIS.ZEN}</span>
                <h3 className="text-lg font-semibold text-white">Meditation</h3>
              </div>

              <div className="text-center py-6">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  {/* Animated rings */}
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute inset-0 rounded-full border-2 border-cyan/30"
                  />
                  <motion.div
                    animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                    className="absolute inset-0 rounded-full border-2 border-purple/30"
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-4xl">
                    {EMOJIS.ZEN}
                  </div>
                </div>

                <p className="text-secondary mb-4">
                  {protocol?.meditation_minutes || 0} minutes today
                </p>

                <div className="flex gap-3 justify-center">
                  <Link
                    href="/dashboard/mind/meditate"
                    className="cyber-button"
                  >
                    Start Session
                  </Link>
                  <button className="btn-secondary text-sm">
                    Log Minutes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Mind Practices</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickActionLink
                href="/dashboard/mind/journal"
                icon={EMOJIS.JOURNAL}
                label="Daily Journal"
                description="Reflect and plan"
              />
              <QuickActionLink
                href="/dashboard/mind/focus"
                icon={EMOJIS.CLOCK}
                label="Deep Focus"
                description="2-hour blocks"
              />
              <QuickActionLink
                href="/dashboard/mind/breathing"
                icon={EMOJIS.MOON}
                label="Breathing"
                description="Box breathing"
              />
              <QuickActionLink
                href="/dashboard/mind/retention"
                icon={EMOJIS.FIRE}
                label="Retention"
                description="Track progress"
              />
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}

function QuickActionLink({
  href,
  icon,
  label,
  description,
}: {
  href: string;
  icon: string;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-4 rounded-xl bg-gray-900/30 border border-border hover:border-purple/30 hover:bg-gray-800/30 transition-all group"
    >
      <span className="text-2xl group-hover:scale-110 transition-transform">{icon}</span>
      <div>
        <p className="font-medium text-white">{label}</p>
        <p className="text-xs text-muted">{description}</p>
      </div>
    </Link>
  );
}
