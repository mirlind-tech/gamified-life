"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";
import { EMOJIS } from "@/lib/emojis";
import { ProgressBar } from "@/components/ProgressBar";
import type { TechSkill, CurriculumStats } from "@/types";

export default function CurriculumPage() {
  const [skills, setSkills] = useState<TechSkill[]>([]);
  const [stats, setStats] = useState<CurriculumStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [skillsData, statsData] = await Promise.all([
          api.getCurriculumSkills(),
          api.getCurriculumStats(),
        ]);
        setSkills(skillsData);
        setStats(statsData);
      } catch (error) {
        console.error("Failed to load curriculum:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const categories = [...new Set(skills.map((s) => s.category))];

  return (
    <div className="max-w-6xl mx-auto pb-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{EMOJIS.CURRICULUM}</span>
            <div>
              <h1 className="text-2xl font-bold text-white">Tech Stack Curriculum</h1>
              <p className="text-sm text-secondary">
                Master the 10 essential skills for full-stack mastery
              </p>
            </div>
          </div>
          {stats && (
            <div className="text-right">
              <p className="text-3xl font-bold text-cyan">{stats.overall_progress}%</p>
              <p className="text-xs text-muted">Overall Progress</p>
            </div>
          )}
        </div>

        {/* Overall Progress Bar */}
        {stats && (
          <div className="mt-6">
            <div className="progress-bar h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.overall_progress}%` }}
                transition={{ duration: 1 }}
                className="progress-fill h-3 bg-linear-to-r from-purple-500 via-cyan-500 to-purple-500"
              />
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-muted">
                {stats.completed_modules} / {stats.total_modules} modules completed
              </span>
              <span className="text-muted">
                {stats.hours_total}h / {stats.estimated_total_hours}h
              </span>
            </div>
          </div>
        )}
      </motion.div>

      {isLoading ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-secondary">Loading curriculum...</p>
        </div>
      ) : (
        <>
          {categories.map((category, catIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIndex * 0.1 }}
            >
              <h2 className="text-lg font-semibold text-white mb-4 capitalize flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan" />
                {category}
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {skills
                  .filter((s) => s.category === category)
                  .map((skill, index) => (
                    <SkillCard key={skill.key} skill={skill} index={index} />
                  ))}
              </div>
            </motion.div>
          ))}
        </>
      )}
    </div>
  );
}

function SkillCard({ skill, index }: { skill: TechSkill; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
    >
      <Link
        href={`/dashboard/career/curriculum/${skill.key}`}
        className="block glass-card rounded-2xl p-5 border-l-4 hover:border-l-cyan transition-all"
        style={{ borderLeftColor: skill.color }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{skill.icon}</span>
            <div>
              <h3 className="font-semibold text-white">{skill.name}</h3>
              <p className="text-sm text-muted">{skill.estimated_hours}h estimated</p>
            </div>
          </div>
          <StatusBadge status={skill.status} />
        </div>

        <p className="text-sm text-secondary mt-3 line-clamp-2">{skill.description}</p>

        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted">{skill.hours_spent}h spent</span>
            <span className="text-cyan font-bold">{skill.progress}%</span>
          </div>
          <ProgressBar progress={skill.progress} />
        </div>
      </Link>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    not_started: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    in_progress: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    completed: "bg-green-500/20 text-green-400 border-green-500/30",
  };

  const labels: Record<string, string> = {
    not_started: "Not Started",
    in_progress: "In Progress",
    completed: "Completed",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs border ${colors[status]}`}>
      {labels[status]}
    </span>
  );
}
