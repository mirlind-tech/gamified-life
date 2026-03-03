"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { EMOJIS } from "@/lib/emojis";
import type { JobApplication } from "@/types";

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const data = await api.getJobs();
      setJobs(data);
    } catch (error) {
      console.error("Failed to load jobs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <span className="text-4xl">{EMOJIS.JOB}</span>
          <div>
            <h1 className="text-2xl font-bold text-white">Job Applications</h1>
            <p className="text-sm text-secondary">Track your job hunt pipeline</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="cyber-button"
        >
          {EMOJIS.ADD} Add Application
        </button>
      </motion.div>

      {/* Add Job Form Modal */}
      <AnimatePresence>
        {showForm && (
          <JobFormModal
            onClose={() => setShowForm(false)}
            onSuccess={() => {
              setShowForm(false);
              loadJobs();
            }}
          />
        )}
      </AnimatePresence>

      {/* Jobs List */}
      {isLoading ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-secondary">Loading applications...</p>
        </div>
      ) : jobs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-2xl p-12 text-center"
        >
          <p className="text-6xl mb-4">{EMOJIS.JOB}</p>
          <h2 className="text-xl font-semibold text-white mb-2">No Applications Yet</h2>
          <p className="text-secondary mb-6">Start tracking your job hunt by adding your first application</p>
          <button onClick={() => setShowForm(true)} className="cyber-button">
            Add Your First Application
          </button>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job, index) => (
            <JobCard
              key={job.id}
              job={job}
              index={index}
              onUpdate={loadJobs}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function JobCard({
  job,
  index,
  onUpdate,
}: {
  job: JobApplication;
  index: number;
  onUpdate: () => void;
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const statuses = ["applied", "screening", "interview", "offer", "rejected", "accepted"] as const;
  
  const currentStatusIndex = statuses.indexOf(job.status as typeof statuses[number]);
  const nextStatus = statuses[currentStatusIndex + 1];

  const advanceStatus = async () => {
    if (!nextStatus || isUpdating) return;
    
    setIsUpdating(true);
    try {
      await api.updateJob(job.id, { status: nextStatus });
      onUpdate();
    } catch (error) {
      console.error("Failed to update job:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const statusColors: Record<string, string> = {
    applied: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    screening: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    interview: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    offer: "bg-green-500/20 text-green-300 border-green-500/30",
    rejected: "bg-red-500/20 text-red-300 border-red-500/30",
    accepted: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-white">{job.position}</h3>
            <span className={`px-2 py-1 rounded-full text-xs border ${statusColors[job.status]}`}>
              {job.status}
            </span>
          </div>
          <p className="text-secondary mb-2">{job.company}</p>
          <p className="text-sm text-muted">Applied: {new Date(job.applied_date).toLocaleDateString()}</p>
          {job.notes && (
            <p className="text-sm text-muted mt-2 italic">{job.notes}</p>
          )}
        </div>

        <div className="flex gap-2">
          {nextStatus && nextStatus !== "rejected" && (
            <button
              onClick={advanceStatus}
              disabled={isUpdating}
              className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 text-sm hover:bg-green-500/30 transition-colors"
            >
              {isUpdating ? "..." : `→ ${nextStatus}`}
            </button>
          )}
          <button
            onClick={async () => {
              await api.updateJob(job.id, { status: "rejected" });
              onUpdate();
            }}
            className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-sm hover:bg-red-500/30 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function JobFormModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!company.trim() || !position.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createJob({
        company: company.trim(),
        position: position.trim(),
        status: "applied",
        applied_date: new Date().toISOString().split("T")[0],
      });
      onSuccess();
    } catch (err) {
      console.error("Failed to create job:", err);
      setError("Failed to save application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card rounded-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-white mb-4">{EMOJIS.ADD} Add Application</h2>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-secondary mb-1">Company</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g., Google"
              className="w-full input-field"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-secondary mb-1">Position</label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g., Senior Rust Developer"
              className="w-full input-field"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Add Application"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
