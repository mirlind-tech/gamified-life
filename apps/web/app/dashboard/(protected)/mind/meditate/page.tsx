"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";
import { EMOJIS } from "@/lib/emojis";

const PRESETS = [5, 10, 20];

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function MeditatePage() {
  const [minutes, setMinutes] = useState(10);
  const [secondsRemaining, setSecondsRemaining] = useState(10 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const interval = window.setInterval(() => {
      setSecondsRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          setIsRunning(false);
          void api.trackActivity("meditation_session", { minutes }).catch((error) => {
            console.error("Failed to track meditation session:", error);
          });
          setMessage(`Logged ${minutes} minute meditation session.`);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning, minutes]);

  const applyPreset = (value: number) => {
    setMinutes(value);
    setSecondsRemaining(value * 60);
    setIsRunning(false);
    setMessage("");
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
          <span className="text-4xl">{EMOJIS.ZEN}</span>
          Meditation Session
        </h1>
        <p className="text-sm text-secondary mt-2">
          Simple session timer. Completion is tracked through the new gateway activity endpoint.
        </p>
      </motion.div>

      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="flex justify-center gap-2 mb-6">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => applyPreset(preset)}
              className={`px-4 py-2 rounded-full border ${minutes === preset ? "border-cyan bg-cyan/10 text-white" : "border-white/10 text-muted"}`}
            >
              {preset} min
            </button>
          ))}
        </div>

        <div className="relative w-56 h-56 mx-auto mb-6">
          <motion.div
            animate={{ scale: isRunning ? [1, 1.08, 1] : 1, opacity: isRunning ? [0.5, 0.9, 0.5] : 0.6 }}
            transition={{ duration: 4, repeat: isRunning ? Infinity : 0 }}
            className="absolute inset-0 rounded-full border-2 border-cyan/30"
          />
          <motion.div
            animate={{ scale: isRunning ? [1.15, 1, 1.15] : 1.1, opacity: isRunning ? [0.3, 0.6, 0.3] : 0.4 }}
            transition={{ duration: 4, repeat: isRunning ? Infinity : 0, delay: 0.4 }}
            className="absolute inset-0 rounded-full border-2 border-purple/30"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl mb-2">{EMOJIS.ZEN}</div>
            <div className="text-4xl font-mono font-bold text-white">{formatTime(secondsRemaining)}</div>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <button onClick={() => setIsRunning((current) => !current)} className="btn-primary">
            {isRunning ? "Pause" : "Start"}
          </button>
          <button onClick={() => applyPreset(minutes)} className="btn-secondary">
            Reset
          </button>
        </div>

        {message && <p className="text-sm text-green-400 mt-4">{message}</p>}
      </div>
    </div>
  );
}
