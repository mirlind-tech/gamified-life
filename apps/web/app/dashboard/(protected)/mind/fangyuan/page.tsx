"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";
import { EMOJIS } from "@/lib/emojis";
import type { FangYuanDaily, FangYuanPrinciple } from "@/types";

export default function FangYuanPage() {
  const [dailyTeaching, setDailyTeaching] = useState<FangYuanDaily | null>(null);
  const [principles, setPrinciples] = useState<FangYuanPrinciple[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [daily, list] = await Promise.all([
          api.getFangYuanDaily().catch(() => null),
          api.getFangYuanPrinciples(),
        ]);
        setDailyTeaching(daily);
        setPrinciples(list);
      } catch (error) {
        console.error("Failed to load Fang Yuan data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, []);

  return (
    <div className="max-w-5xl mx-auto pb-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6"
      >
        <Link href="/dashboard/mind" className="text-sm text-muted hover:text-white inline-flex mb-4">
          {"<-"} Back to Mind HQ
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-4xl">{EMOJIS.SCROLL}</span>
          <div>
            <h1 className="text-2xl font-bold text-white">Fang Yuan Principles</h1>
            <p className="text-sm text-secondary">Unlocked mindset cards from the new gateway</p>
          </div>
        </div>
      </motion.div>

      {dailyTeaching && (
        <div className="glass-card rounded-2xl p-6 border-l-4 border-l-purple">
          <p className="text-xs text-purple uppercase tracking-wider mb-2">Daily teaching</p>
          <blockquote className="text-xl italic text-secondary">
            &ldquo;{dailyTeaching.quote}&rdquo;
          </blockquote>
          <p className="text-sm text-white mt-4">
            Principle #{dailyTeaching.principle.number}: {dailyTeaching.principle.title}
          </p>
          <p className="text-sm text-muted mt-1">{dailyTeaching.principle.description}</p>
        </div>
      )}

      {isLoading ? (
        <div className="glass-card rounded-2xl p-8 text-center text-secondary">Loading principles...</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {principles.map((principle, index) => (
            <motion.div
              key={principle.number}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className={`glass-card rounded-2xl p-5 border ${principle.unlocked ? "border-purple/30" : "border-white/10 opacity-70"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-purple">Principle #{principle.number}</p>
                  <h2 className="text-lg font-semibold text-white mt-1">{principle.title}</h2>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${principle.unlocked ? "bg-green-500/10 text-green-300 border-green-500/20" : "bg-white/5 text-muted border-white/10"}`}>
                  {principle.unlocked ? "Unlocked" : `Needs ${principle.xpRequired || 0} XP`}
                </span>
              </div>
              <p className="text-sm text-secondary mt-3">{principle.description}</p>
              <p className="text-sm text-muted mt-3">{principle.application}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
