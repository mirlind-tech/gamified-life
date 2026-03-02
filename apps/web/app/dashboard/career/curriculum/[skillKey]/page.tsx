"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { EMOJIS } from "@/lib/emojis";
import type { TechModule, TechSkill } from "@/types";

export default function CurriculumSkillDetailPage() {
  const params = useParams<{ skillKey: string }>();
  const skillKey = Array.isArray(params.skillKey) ? params.skillKey[0] : params.skillKey;
  const [skill, setSkill] = useState<TechSkill | null>(null);
  const [modules, setModules] = useState<TechModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyModuleId, setBusyModuleId] = useState<string | null>(null);

  const loadSkill = useCallback(async () => {
    if (!skillKey) {
      return;
    }

    setIsLoading(true);
    try {
      const detail = await api.getCurriculumSkillDetail(skillKey);
      setSkill(detail.skill);
      setModules(detail.modules);
    } catch (error) {
      console.error("Failed to load curriculum skill:", error);
    } finally {
      setIsLoading(false);
    }
  }, [skillKey]);

  useEffect(() => {
    void loadSkill();
  }, [loadSkill]);

  const updateModule = async (module: TechModule, status: TechModule["status"]) => {
    setBusyModuleId(module.id);
    try {
      await api.updateModuleProgress(module.id, {
        status,
        hours_spent: status === "completed" ? Math.max(module.hours_spent, module.estimated_hours) : module.hours_spent,
      });
      await loadSkill();
    } catch (error) {
      console.error("Failed to update module:", error);
    } finally {
      setBusyModuleId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6"
      >
        <Link href="/dashboard/career/curriculum" className="text-sm text-muted hover:text-white inline-flex mb-4">
          {"<-"} Back to curriculum
        </Link>

        {skill ? (
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-5xl">{skill.icon}</span>
              <div>
                <h1 className="text-3xl font-bold text-white">{skill.name}</h1>
                <p className="text-secondary mt-1">{skill.description}</p>
                <p className="text-sm text-muted mt-2">
                  {skill.hours_spent}h logged / {skill.estimated_hours}h estimated
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-cyan">{skill.progress}%</p>
              <p className="text-xs text-muted uppercase tracking-wider">Complete</p>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-3xl font-bold text-white">Curriculum Skill</h1>
            <p className="text-secondary mt-1">Loading skill detail...</p>
          </div>
        )}
      </motion.div>

      {isLoading ? (
        <div className="glass-card rounded-2xl p-8 text-center text-secondary">Loading modules...</div>
      ) : (
        <div className="space-y-4">
          {modules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card rounded-2xl p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-muted">
                      Phase {module.phase}
                    </span>
                    <StatusBadge status={module.status} />
                  </div>
                  <h2 className="text-xl font-semibold text-white mt-3">{module.title}</h2>
                  <p className="text-sm text-secondary mt-1">{module.description || "Core module for this skill path."}</p>
                  <p className="text-xs text-muted mt-2">
                    {module.hours_spent}h logged / {module.estimated_hours}h estimated
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => void updateModule(module, "in_progress")}
                    disabled={busyModuleId === module.id || module.status === "in_progress"}
                    className="btn-secondary text-sm disabled:opacity-50"
                  >
                    Start
                  </button>
                  <button
                    onClick={() => void updateModule(module, "completed")}
                    disabled={busyModuleId === module.id || module.status === "completed"}
                    className="btn-primary text-sm disabled:opacity-50"
                  >
                    Complete
                  </button>
                </div>
              </div>

              {module.topics.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {module.topics.map((topic) => (
                    <span key={topic} className="text-xs px-2 py-1 rounded-full bg-cyan/10 text-cyan border border-cyan/20">
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white mb-2">{EMOJIS.CURRICULUM} Next step</h3>
        <p className="text-secondary">
          Mark a module as started when you begin it and completed when you finish the material. The skill summary is recalculated in the Rust backend after each update.
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    locked: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    available: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    in_progress: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    completed: "bg-green-500/20 text-green-300 border-green-500/30",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs border ${classes[status] || classes.available}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
