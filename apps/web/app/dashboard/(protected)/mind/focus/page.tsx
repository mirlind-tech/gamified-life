"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";
import { EMOJIS } from "@/lib/emojis";

const PRESETS = [25, 50, 90];

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function FocusPage() {
  const [minutes, setMinutes] = useState(50);
  const [task, setTask] = useState("Ship one meaningful improvement");
  const [secondsRemaining, setSecondsRemaining] = useState(50 * 60);
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
          void api.trackActivity("focus_session", { minutes, task }).catch((error) => {
            console.error("Failed to track focus session:", error);
          });
          setMessage(`Logged ${minutes} minute focus session.`);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning, minutes, task]);

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
          <span className="text-4xl">{EMOJIS.CLOCK}</span>
          Focus Block
        </h1>
        <p className="text-sm text-secondary mt-2">
          Lightweight deep-work timer. Completion is tracked as a player activity.
        </p>
      </motion.div>

      <div className="glass-card rounded-2xl p-8">
        <label className="block text-sm text-secondary mb-2">Focus target</label>
        <input
          value={task}
          onChange={(event) => setTask(event.target.value)}
          className="w-full input-field mb-6"
          placeholder="Name the single outcome for this block"
        />

        <div className="flex justify-center gap-2 mb-6">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => applyPreset(preset)}
              className={`px-4 py-2 rounded-full border ${minutes === preset ? "border-purple bg-purple/10 text-white" : "border-white/10 text-muted"}`}
            >
              {preset} min
            </button>
          ))}
        </div>

        <div className="text-center py-6">
          <div className="text-6xl mb-4">{EMOJIS.CLOCK}</div>
          <div className="text-5xl font-mono font-bold text-white">{formatTime(secondsRemaining)}</div>
          <p className="text-secondary mt-3">{task}</p>
        </div>

        <div className="flex justify-center gap-3">
          <button onClick={() => setIsRunning((current) => !current)} className="btn-primary">
            {isRunning ? "Pause" : "Start"}
          </button>
          <button onClick={() => applyPreset(minutes)} className="btn-secondary">
            Reset
          </button>
        </div>

        {message && <p className="text-sm text-green-400 mt-4 text-center">{message}</p>}
      </div>
    </div>
  );
}
