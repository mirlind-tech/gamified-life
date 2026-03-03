"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@/lib/api";
import { EMOJIS } from "@/lib/emojis";
import type { JobApplication, JobStats } from "@/types";

type ApplicationStatus = JobApplication["status"];

const STATUS_COLORS: Record<ApplicationStatus, { bg: string; text: string; label: string }> = {
  saved: { bg: "bg-slate-500/20", text: "text-slate-300", label: "Saved" },
  applied: { bg: "bg-blue-500/20", text: "text-blue-300", label: "Applied" },
  screening: { bg: "bg-cyan-500/20", text: "text-cyan-300", label: "Screening" },
  interview: { bg: "bg-yellow-500/20", text: "text-yellow-300", label: "Interview" },
  offer: { bg: "bg-green-500/20", text: "text-green-300", label: "Offer" },
  rejected: { bg: "bg-red-500/20", text: "text-red-300", label: "Rejected" },
  accepted: { bg: "bg-emerald-500/20", text: "text-emerald-300", label: "Accepted" },
  withdrawn: { bg: "bg-zinc-500/20", text: "text-zinc-300", label: "Withdrawn" },
  ghosted: { bg: "bg-gray-500/20", text: "text-gray-300", label: "Ghosted" },
};

const EDITABLE_STATUSES: ApplicationStatus[] = [
  "saved",
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
];

function getMotivationMessage(totalApplications: number, interviews: number, offers: number) {
  if (offers > 0) {
    return { message: "An offer is live. Negotiate deliberately.", color: "#10b981", icon: "🎉" };
  }
  if (interviews >= 8) {
    return { message: "Interview volume is strong. Focus on conversion.", color: "#06b6d4", icon: "🎯" };
  }
  if (totalApplications >= 60) {
    return { message: "Application target met. Push follow-ups and interviews.", color: "#8b5cf6", icon: "✅" };
  }
  if (totalApplications >= 30) {
    return { message: "Halfway there. Keep the pipeline moving.", color: "#f59e0b", icon: "⚡" };
  }
  if (totalApplications > 0) {
    return { message: "Momentum exists. Keep applying every week.", color: "#f97316", icon: "🚀" };
  }
  return { message: "No applications logged yet. Start with three this week.", color: "#ef4444", icon: "💀" };
}

export function JobHuntTracker() {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [stats, setStats] = useState<JobStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [busyJobId, setBusyJobId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [jobsData, statsData] = await Promise.all([api.getJobs(), api.getJobStats()]);
      setJobs(jobsData);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to load job hunt tracker:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const totalApplications = stats?.total_applied ?? jobs.filter((job) => job.status !== "saved").length;
  const interviews = stats?.total_interviews ?? (stats?.by_status.interview || 0) + (stats?.by_status.offer || 0);
  const offers = stats?.by_status.offer || 0;
  const activePipeline =
    (stats?.by_status.applied || 0) +
    (stats?.by_status.screening || 0) +
    (stats?.by_status.interview || 0);
  const daysUntilDeadline = Math.max(0, stats?.days_remaining || 0);
  const appsPerWeekNeeded = Math.max(0, Math.ceil(stats?.weekly_applications_needed || 0));
  const motivation = getMotivationMessage(totalApplications, interviews, offers);

  const handleUpdate = async (id: string, updates: Partial<JobApplication>) => {
    setBusyJobId(id);
    try {
      await api.updateJob(id, updates);
      await loadData();
    } catch (error) {
      console.error("Failed to update job:", error);
    } finally {
      setBusyJobId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyJobId(id);
    try {
      await api.deleteJob(id);
      await loadData();
    } catch (error) {
      console.error("Failed to delete job:", error);
    } finally {
      setBusyJobId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-3xl p-6 mb-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{EMOJIS.JOB}</span>
          <div>
            <h3 className="text-xl font-bold text-white">Job Switch Tracker</h3>
            <p className="text-xs text-(--color-text-muted)">
              Live pipeline from the Rust gateway
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#10b981] text-white rounded-lg font-medium hover:bg-[#10b981]/80 transition-colors flex items-center gap-2"
        >
          <span>+</span> Add Application
        </button>
      </div>

      <div
        className="mb-6 p-4 rounded-xl border"
        style={{ borderColor: `${motivation.color}30`, backgroundColor: `${motivation.color}10` }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{motivation.icon}</span>
          <p className="font-medium" style={{ color: motivation.color }}>
            {motivation.message}
          </p>
        </div>
        <p className="text-sm text-(--color-text-muted) mt-2">
          {daysUntilDeadline > 0
            ? `${daysUntilDeadline} days left. ${appsPerWeekNeeded} applications/week needed.`
            : "Deadline target is not set or already passed."}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatBox
          label="Applications"
          value={totalApplications}
          target={stats?.target_applications || 60}
          color="#06b6d4"
          icon="📨"
        />
        <StatBox
          label="Interviews"
          value={interviews}
          target={stats?.target_interviews || 8}
          color="#8b5cf6"
          icon="🎯"
        />
        <StatBox label="Offers" value={offers} target={1} color="#10b981" icon="🎉" />
        <StatBox label="Active Pipeline" value={activePipeline} target={12} color="#f59e0b" icon="🧭" />
      </div>

      <div className="space-y-4 mb-6">
        <ProgressBar
          label="Applications Progress"
          current={totalApplications}
          target={stats?.target_applications || 60}
          color="#06b6d4"
        />
        <ProgressBar
          label="Interview Goal"
          current={interviews}
          target={stats?.target_interviews || 8}
          color="#8b5cf6"
        />
      </div>

      <div>
        <h4 className="text-sm font-semibold text-(--color-text-secondary) mb-3">
          Recent Applications ({jobs.length})
        </h4>

        {isLoading ? (
          <div className="text-center py-8 text-(--color-text-muted)">
            <p>Loading job pipeline...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-8 text-(--color-text-muted)">
            <p className="text-4xl mb-2">🚀</p>
            <p>No applications yet. Log the first one here.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {jobs.slice(0, 8).map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-white">{job.company}</h4>
                      <StatusBadge status={job.status} />
                    </div>
                    <p className="text-sm text-(--color-text-secondary)">{job.position}</p>
                    <p className="text-xs text-(--color-text-muted) mt-1">
                      Applied: {new Date(job.applied_date).toLocaleDateString()}
                    </p>
                    {job.location && (
                      <p className="text-xs text-(--color-text-muted) mt-1">{job.location}</p>
                    )}
                    {job.notes && (
                      <p className="text-xs text-(--color-text-muted) mt-1 italic">{job.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={job.status}
                      onChange={(event) =>
                        void handleUpdate(job.id, {
                          status: event.target.value as ApplicationStatus,
                        })
                      }
                      disabled={busyJobId === job.id}
                      className="bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-(--color-accent-purple)"
                    >
                      {EDITABLE_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_COLORS[status].label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => void handleDelete(job.id)}
                      disabled={busyJobId === job.id}
                      className="p-1.5 text-(--color-text-muted) hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <AddApplicationModal
            onClose={() => setShowAddModal(false)}
            onAdd={async (_application) => {
              await api.createJob(_application);
              setShowAddModal(false);
              await loadData();
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatBox({
  label,
  value,
  target,
  color,
  icon,
}: {
  label: string;
  value: number;
  target: number;
  color: string;
  icon: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs text-(--color-text-muted)">
          {value}/{target}
        </span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-(--color-text-muted)">{label}</div>
      <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, (value / Math.max(target, 1)) * 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function ProgressBar({
  label,
  current,
  target,
  color,
}: {
  label: string;
  current: number;
  target: number;
  color: string;
}) {
  const percentage = Math.min(100, (current / Math.max(target, 1)) * 100);

  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-(--color-text-secondary)">{label}</span>
        <span className="text-(--color-text-muted)">
          {current}/{target}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8 }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const config = STATUS_COLORS[status] || STATUS_COLORS.applied;

  return (
    <span className={`px-2 py-1 rounded-full text-xs border ${config.bg} ${config.text} border-white/10`}>
      {config.label}
    </span>
  );
}

function AddApplicationModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (_application: Partial<JobApplication>) => Promise<void>;
}) {
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!company.trim() || !position.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd({
        company: company.trim(),
        position: position.trim(),
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        status: "applied",
        applied_date: new Date().toISOString().slice(0, 10),
      });
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
      <motion.form
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md glass-card rounded-2xl p-6 space-y-4"
      >
        <div>
          <h4 className="text-xl font-semibold text-white">Add Application</h4>
          <p className="text-sm text-(--color-text-muted)">This saves directly to the gateway.</p>
        </div>

        <div>
          <label className="block text-sm text-(--color-text-secondary) mb-1">Company</label>
          <input
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            className="w-full input-field"
            placeholder="Company name"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm text-(--color-text-secondary) mb-1">Position</label>
          <input
            value={position}
            onChange={(event) => setPosition(event.target.value)}
            className="w-full input-field"
            placeholder="Frontend Engineer"
          />
        </div>

        <div>
          <label className="block text-sm text-(--color-text-secondary) mb-1">Location</label>
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className="w-full input-field"
            placeholder="Berlin / Remote"
          />
        </div>

        <div>
          <label className="block text-sm text-(--color-text-secondary) mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="w-full input-field min-h-24"
            placeholder="Referral, stack match, follow-up date..."
          />
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 disabled:opacity-50">
            {isSubmitting ? "Saving..." : "Save Application"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
