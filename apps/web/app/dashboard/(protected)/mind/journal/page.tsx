"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";
import { EMOJIS } from "@/lib/emojis";

export default function JournalPage() {
  const [gratitude, setGratitude] = useState("");
  const [reflection, setReflection] = useState("");
  const [intention, setIntention] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const saveEntry = async () => {
    const entry = [
      `Date: ${new Date().toISOString().slice(0, 10)}`,
      `Gratitude: ${gratitude}`,
      `Reflection: ${reflection}`,
      `Tomorrow: ${intention}`,
    ].join("\n");

    setIsSaving(true);
    setMessage("");

    try {
      await api.upsertMemory(entry, "journal", 5);
      setMessage("Journal entry stored in memory.");
    } catch (error) {
      console.error("Failed to save journal entry:", error);
      setMessage("Failed to save journal entry.");
    } finally {
      setIsSaving(false);
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
          <span className="text-4xl">{EMOJIS.JOURNAL}</span>
          Daily Journal
        </h1>
        <p className="text-sm text-secondary mt-2">
          This page saves reflections into the new AI memory store instead of the legacy frontend.
        </p>
      </motion.div>

      <div className="glass-card rounded-2xl p-6 space-y-5">
        <Field
          label="Gratitude"
          value={gratitude}
          onChange={setGratitude}
          placeholder="What is already working in your favor?"
        />
        <Field
          label="Reflection"
          value={reflection}
          onChange={setReflection}
          placeholder="What happened today? What mattered?"
        />
        <Field
          label="Tomorrow's intention"
          value={intention}
          onChange={setIntention}
          placeholder="What is the one non-negotiable move tomorrow?"
        />

        <div className="flex gap-3">
          <button onClick={() => void saveEntry()} disabled={isSaving} className="btn-primary disabled:opacity-50">
            {isSaving ? "Saving..." : "Save Journal Entry"}
          </button>
        </div>

        {message && (
          <p className={`text-sm ${message.startsWith("Failed") ? "text-red-400" : "text-green-400"}`}>{message}</p>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (_value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-secondary mb-2">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full input-field min-h-28"
        placeholder={placeholder}
      />
    </div>
  );
}
