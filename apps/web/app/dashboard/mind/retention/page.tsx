"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";
import { EMOJIS } from "@/lib/emojis";

export default function RetentionPage() {
  const [retention, setRetention] = useState<{
    status: string;
    risk_level: string;
    suggestions: unknown[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRetention = async () => {
      setIsLoading(true);
      try {
        const data = await api.getRetention();
        setRetention(data);
      } catch (error) {
        console.error("Failed to load retention data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadRetention();
  }, []);

  return (
    <div className="max-w-4xl mx-auto pb-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6"
      >
        <Link href="/dashboard/mind" className="text-sm text-muted hover:text-white inline-flex mb-4">
          {"<-"} Back to Mind HQ
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-4xl">{EMOJIS.FIRE}</span>
          <div>
            <h1 className="text-2xl font-bold text-white">Retention Status</h1>
            <p className="text-sm text-secondary">Current streak retention signal from the gateway</p>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="glass-card rounded-2xl p-8 text-center text-secondary">Loading retention...</div>
      ) : retention ? (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-6">
              <p className="text-xs text-muted uppercase tracking-wider mb-2">Status</p>
              <p className="text-3xl font-bold text-white">{retention.status}</p>
            </div>
            <div className="glass-card rounded-2xl p-6">
              <p className="text-xs text-muted uppercase tracking-wider mb-2">Risk level</p>
              <p className="text-3xl font-bold text-cyan">{retention.risk_level}</p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Suggestions</h2>
            {retention.suggestions.length === 0 ? (
              <p className="text-secondary">
                The current Rust handler returns an empty suggestion list. The route is live and ready for richer retention logic later.
              </p>
            ) : (
              <pre className="overflow-x-auto text-sm text-secondary">
                {JSON.stringify(retention.suggestions, null, 2)}
              </pre>
            )}
          </div>
        </>
      ) : (
        <div className="glass-card rounded-2xl p-8 text-center text-red-400">Retention status unavailable.</div>
      )}
    </div>
  );
}
