"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";
import { EMOJIS } from "@/lib/emojis";
import type { JobApplication, JobStats, TechSkill, CurriculumStats } from "@/types";

export default function CareerHQPage() {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [jobStats, setJobStats] = useState<JobStats | null>(null);
  const [skills, setSkills] = useState<TechSkill[]>([]);
  const [curriculumStats, setCurriculumStats] = useState<CurriculumStats | null>(null);
  const [codeStats, setCodeStats] = useState<{ total_hours: number; streak_days: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [jobsData, jobStatsData, skillsData, curriculumData, codeData] = await Promise.all([
          api.getJobs(),
          api.getJobStats(),
          api.getCurriculumSkills(),
          api.getCurriculumStats(),
          api.getCodeStats(),
        ]);
        setJobs(jobsData);
        setJobStats(jobStatsData);
        setSkills(skillsData);
        setCurriculumStats(curriculumData);
        setCodeStats(codeData);
      } catch (error) {
        console.error("Failed to load Career HQ:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const recentJobs = jobs.slice(0, 5);
  const inProgressSkills = skills.filter(s => s.status === "in_progress");

  return (
    <div className="max-w-6xl mx-auto pb-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <span className="text-4xl">{EMOJIS.CODE}</span>
          <div>
            <h1 className="text-2xl font-bold text-white">Career HQ</h1>
            <p className="text-sm text-secondary">
              Job hunt, skill development, and coding progression
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/career/jobs" className="cyber-button text-sm">
            {EMOJIS.ADD} Add Job
          </Link>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-secondary">Loading career data...</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-4">
            <StatCard
              label="Jobs Applied"
              value={jobStats?.total_applied.toString() || "0"}
              icon={EMOJIS.JOB}
              color="purple"
            />
            <StatCard
              label="Coding Hours"
              value={codeStats?.total_hours.toString() || "0"}
              icon={EMOJIS.CODE}
              color="cyan"
            />
            <StatCard
              label="Code Streak"
              value={`${codeStats?.streak_days || 0}d`}
              icon={EMOJIS.FIRE}
              color="yellow"
            />
            <StatCard
              label="Skills in Progress"
              value={inProgressSkills.length.toString()}
              icon={EMOJIS.CURRICULUM}
              color="green"
            />
          </div>

          {/* Job Pipeline & Curriculum */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Job Pipeline */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{EMOJIS.JOB}</span>
                  <h3 className="text-lg font-semibold text-white">Job Pipeline</h3>
                </div>
                <Link href="/dashboard/career/jobs" className="text-sm text-cyan hover:underline">
                  View All →
                </Link>
              </div>

              {/* Pipeline Status */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {["applied", "screening", "interview", "offer"].map((status) => (
                  <div key={status} className="text-center p-2 rounded-lg bg-gray-900/30">
                    <p className="text-2xl font-bold text-white">
                      {jobStats?.by_status[status] || 0}
                    </p>
                    <p className="text-xs text-muted capitalize">{status}</p>
                  </div>
                ))}
              </div>

              {/* Recent Jobs */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {recentJobs.length === 0 ? (
                  <p className="text-sm text-secondary text-center py-4">
                    No jobs applied yet. Start your hunt!
                  </p>
                ) : (
                  recentJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-900/30 border border-border hover:border-purple/30 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-white">{job.position}</p>
                        <p className="text-xs text-muted">{job.company}</p>
                      </div>
                      <StatusBadge status={job.status} />
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Tech Stack Progress */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{EMOJIS.CURRICULUM}</span>
                  <h3 className="text-lg font-semibold text-white">Tech Stack</h3>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-cyan">
                    {curriculumStats?.overall_progress || 0}%
                  </p>
                  <p className="text-xs text-muted">Complete</p>
                </div>
              </div>

              {/* Overall Progress */}
              <div className="progress-bar mb-4">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${curriculumStats?.overall_progress || 0}%` }}
                  transition={{ duration: 1 }}
                  className="progress-fill bg-gradient-to-r from-cyan to-purple"
                />
              </div>

              {/* Skills List */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {skills.slice(0, 6).map((skill) => (
                  <div key={skill.key} className="flex items-center gap-3">
                    <span className="text-lg">{skill.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white">{skill.name}</span>
                        <span className="text-muted">{skill.progress}%</span>
                      </div>
                      <div className="progress-bar h-1.5">
                        <div
                          className="progress-fill h-1.5 bg-gradient-to-r from-purple-500 to-cyan-500"
                          style={{ width: `${skill.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/dashboard/career/curriculum"
                className="mt-4 w-full cyber-button text-sm inline-block text-center"
              >
                Open Curriculum →
              </Link>
            </motion.div>
          </div>

          {/* Coding Stats & Quick Actions */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Coding Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                {EMOJIS.CODE} Coding Activity
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-xl bg-gray-900/30">
                  <p className="text-3xl font-bold text-cyan">{codeStats?.total_hours || 0}</p>
                  <p className="text-xs text-muted">Total Hours</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-gray-900/30">
                  <p className="text-3xl font-bold text-yellow">{codeStats?.streak_days || 0}</p>
                  <p className="text-xs text-muted">Day Streak</p>
                </div>
              </div>
              <Link
                href="/dashboard/code"
                className="mt-4 w-full cyber-button text-sm inline-block text-center"
              >
                Log Coding Session
              </Link>
            </motion.div>

            {/* Active Skill */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2 glass-card rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Continue Learning
              </h3>
              
              {inProgressSkills.length > 0 ? (
                <div className="space-y-3">
                  {inProgressSkills.slice(0, 2).map((skill) => (
                    <div
                      key={skill.key}
                      className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-purple/10 to-cyan/10 border border-purple/20"
                    >
                      <span className="text-3xl">{skill.icon}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-white">{skill.name}</p>
                        <p className="text-sm text-muted">
                          {skill.hours_spent}h / {skill.estimated_hours}h estimated
                        </p>
                        <div className="progress-bar mt-2">
                          <div
                            className="progress-fill bg-gradient-to-r from-purple-500 to-cyan-500"
                            style={{ width: `${skill.progress}%` }}
                          />
                        </div>
                      </div>
                      <Link
                        href={`/dashboard/career/curriculum/${skill.key}`}
                        className="cyber-button text-sm"
                      >
                        Continue
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-4xl mb-2">🎯</p>
                  <p className="text-secondary">No active skills</p>
                  <Link href="/dashboard/career/curriculum" className="text-cyan hover:underline">
                    Start learning →
                  </Link>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: "purple" | "cyan" | "yellow" | "green";
}) {
  const colorClasses = {
    purple: "from-purple/20 to-purple/5 border-purple/30",
    cyan: "from-cyan/20 to-cyan/5 border-cyan/30",
    yellow: "from-yellow/20 to-yellow/5 border-yellow/30",
    green: "from-green/20 to-green/5 border-green/30",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`glass-card rounded-2xl p-4 bg-gradient-to-br ${colorClasses[color]} border`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-xs text-muted uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    applied: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    screening: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    interview: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    offer: "bg-green-500/20 text-green-300 border-green-500/30",
    rejected: "bg-red-500/20 text-red-300 border-red-500/30",
    accepted: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs border ${colors[status] || colors.applied}`}>
      {status}
    </span>
  );
}
