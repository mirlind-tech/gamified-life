"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";
import { EMOJIS } from "@/lib/emojis";

const PHASES = [
  { label: "Inhale", seconds: 4 },
  { label: "Hold", seconds: 4 },
  { label: "Exhale", seconds: 4 },
  { label: "Hold", seconds: 4 },
];

export default function BreathingPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(PHASES[0].seconds);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const interval = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current > 1) {
          return current - 1;
        }

        setPhaseIndex((previous) => {
          const next = (previous + 1) % PHASES.length;
          if (next === 0) {
            setCyclesCompleted((count) => count + 1);
          }
          setSecondsLeft(PHASES[next].seconds);
          return next;
        });

        return 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning]);

  const reset = () => {
    setIsRunning(false);
    setPhaseIndex(0);
    setSecondsLeft(PHASES[0].seconds);
    setCyclesCompleted(0);
    setMessage("");
  };

  const logSession = async () => {
    try {
      await api.trackActivity("breathing_session", { cyclesCompleted });
      setMessage(`Logged breathing session with ${cyclesCompleted} completed cycles.`);
    } catch (error) {
      console.error("Failed to track breathing session:", error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6"
      >
        <Link href="/dashboard/mind" className="text-sm text-muted hover:text-white inline-flex mb-4">
          {"<-"} Back to Mind HQ
        </Link>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <span className="text-4xl">{EMOJIS.MOON}</span>
          Box Breathing
        </h1>
        <p className="text-sm text-secondary mt-2">
          Four seconds in, four hold, four out, four hold.
        </p>
      </motion.div>

      <div className="glass-card rounded-2xl p-8 text-center">
        <motion.div
          animate={{ scale: isRunning ? [1, 1.12, 1] : 1 }}
          transition={{ duration: 4, repeat: isRunning ? Infinity : 0 }}
          className="w-48 h-48 mx-auto rounded-full border-2 border-cyan/30 flex items-center justify-center mb-6"
        >
          <div>
            <p className="text-sm text-muted uppercase tracking-wider">{PHASES[phaseIndex].label}</p>
            <p className="text-5xl font-bold text-white mt-2">{secondsLeft}</p>
          </div>
        </motion.div>

        <p className="text-secondary mb-6">Completed cycles: {cyclesCompleted}</p>

        <div className="flex justify-center gap-3">
          <button onClick={() => setIsRunning((current) => !current)} className="btn-primary">
            {isRunning ? "Pause" : "Start"}
          </button>
          <button onClick={reset} className="btn-secondary">
            Reset
          </button>
          <button onClick={() => void logSession()} className="btn-secondary">
            Log
          </button>
        </div>

        {message && <p className="text-sm text-green-400 mt-4">{message}</p>}
      </div>
    </div>
  );
}
