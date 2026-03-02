"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { EMOJIS } from "@/lib/emojis";
import type {
  CodeEntry,
  FinanceProfile,
  GermanEntry,
  JobStats,
  ProtocolEntry,
  WeeklyReview,
  Workout,
} from "@/types";

interface ScoreCardItem {
  name: string;
  score: number;
  weight: number;
  icon: string;
  color: string;
  detail: string;
}

function clampScore(score: number): number {
  return Math.max(1, Math.min(10, Number(score.toFixed(1))));
}

function getWeekStart(date: Date = new Date()): Date {
  const value = new Date(date);
  const day = value.getDay();
  const diff = value.getDate() - day;
  return new Date(value.setDate(diff));
}

function formatWeekLabel(date: Date): string {
  const endDate = new Date(date);
  endDate.setDate(date.getDate() + 6);
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${date.toLocaleDateString("en-US", options)} - ${endDate.toLocaleDateString("en-US", options)}`;
}

function buildScores(data: {
  review: WeeklyReview | null;
  jobStats: JobStats | null;
  finance: FinanceProfile | null;
  code: CodeEntry | null;
  german: GermanEntry | null;
  workouts: Workout[];
  protocol: ProtocolEntry | null;
}): ScoreCardItem[] {
  const weekStart = getWeekStart().toISOString().slice(0, 10);
  const workoutsThisWeek = data.workouts.filter((workout) => workout.date >= weekStart).length;
  const financeProgress = data.finance && data.finance.savings_goal > 0
    ? data.finance.current_savings / data.finance.savings_goal
    : 0;
  const protocolScore = data.protocol?.score || 0;
  const germanMinutes = data.german?.minutes || 0;
  const codingHours = data.code?.hours || 0;
  const applicationsTarget = data.jobStats?.target_applications || 60;
  const applicationsDone = data.jobStats?.total_applied || 0;

  return [
    {
      name: "Job Ready",
      score: clampScore((applicationsDone / Math.max(applicationsTarget, 1)) * 10),
      weight: 25,
      icon: EMOJIS.JOB,
      color: "#06b6d4",
      detail: `${applicationsDone}/${applicationsTarget} applications`,
    },
    {
      name: "Finance",
      score: clampScore(financeProgress * 10),
      weight: 20,
      icon: EMOJIS.CAPITAL,
      color: "#10b981",
      detail: data.finance
        ? `EUR ${data.finance.current_savings.toFixed(0)} saved`
        : "No finance profile",
    },
    {
      name: "Coding Depth",
      score: clampScore((codingHours / 4) * 10),
      weight: 20,
      icon: EMOJIS.CODE,
      color: "#8b5cf6",
      detail: codingHours > 0 ? `${codingHours}h latest session` : "No coding logged",
    },
    {
      name: "Body",
      score: clampScore((workoutsThisWeek / 4) * 10),
      weight: 15,
      icon: EMOJIS.VESSEL,
      color: "#ec4899",
      detail: `${workoutsThisWeek} workouts this week`,
    },
    {
      name: "German",
      score: clampScore((germanMinutes / 30) * 10),
      weight: 10,
      icon: EMOJIS.FLAG,
      color: "#f59e0b",
      detail: germanMinutes > 0 ? `${germanMinutes} minutes latest session` : "No German logged",
    },
    {
      name: "Recovery",
      score: clampScore(((protocolScore / 100) * 6) + (data.protocol?.sleep22 ? 2 : 0) + (data.protocol?.wake05 ? 2 : 0)),
      weight: 10,
      icon: EMOJIS.MOON,
      color: "#64748b",
      detail: data.protocol ? `Protocol score ${protocolScore}` : "No protocol logged",
    },
  ];
}

function getScoreStatus(score: number) {
  if (score >= 80) {
    return { color: "#10b981", label: "EXCELLENT", icon: "FIRE" };
  }
  if (score >= 60) {
    return { color: "#06b6d4", label: "SOLID", icon: "OK" };
  }
  if (score >= 40) {
    return { color: "#f59e0b", label: "WATCH", icon: "WARN" };
  }
  return { color: "#ef4444", label: "AT RISK", icon: "RISK" };
}

export function WeeklyScorecard() {
  const [review, setReview] = useState<WeeklyReview | null>(null);
  const [items, setItems] = useState<ScoreCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);

    const loadScorecard = async () => {
      setIsLoading(true);
      try {
        const [reviewData, jobStats, finance, code, german, workouts, protocol] = await Promise.all([
          api.getWeeklyReview().catch(() => null),
          api.getJobStats().catch(() => null),
          api.getFinance().catch(() => null),
          api.getCodeLatest().catch(() => null),
          api.getGermanLatest().catch(() => null),
          api.getWorkouts().catch(() => []),
          api.getProtocol(today).catch(() => null),
        ]);

        setReview(reviewData);
        setItems(
          buildScores({
            review: reviewData,
            jobStats,
            finance,
            code,
            german,
            workouts,
            protocol,
          })
        );
      } catch (error) {
        console.error("Failed to load weekly scorecard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadScorecard();
  }, []);

  const computedScore = items.reduce((sum, item) => sum + item.score * item.weight, 0) / 10;
  const totalScore = review && review.score > 0 ? review.score : computedScore;
  const status = getScoreStatus(totalScore);
  const wins = review?.wins || [];
  const lessons = review?.lessons || review?.learnings || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-3xl p-6 mb-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{EMOJIS.CHART}</span>
          <div>
            <h3 className="text-xl font-bold text-white">Weekly Scorecard</h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              Live operational score for {formatWeekLabel(getWeekStart())}
            </p>
          </div>
        </div>
        <div
          className="px-4 py-2 rounded-full border text-sm font-semibold"
          style={{ borderColor: status.color, color: status.color, backgroundColor: `${status.color}15` }}
        >
          {status.label} {totalScore.toFixed(0)}/100
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-[var(--color-text-muted)]">Loading weekly scorecard...</div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            {items.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                className="p-4 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="font-semibold text-white">{item.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{item.weight}% weight</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold font-mono" style={{ color: item.color }}>
                    {item.score}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.score * 10}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">{item.detail}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-sm font-semibold text-white mb-2">Wins</p>
              {wins.length > 0 ? (
                <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                  {wins.slice(0, 4).map((win) => (
                    <li key={win}>- {win}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">
                  No weekly review saved yet. This card is using live gateway signals.
                </p>
              )}
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-sm font-semibold text-white mb-2">Lessons</p>
              {lessons.length > 0 ? (
                <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                  {lessons.slice(0, 4).map((lesson) => (
                    <li key={lesson}>- {lesson}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">
                  Log a weekly review in the backend to persist explicit wins and lessons.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
