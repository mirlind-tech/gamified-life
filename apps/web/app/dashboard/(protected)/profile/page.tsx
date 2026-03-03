"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar3D } from "@/components/Avatar3D";
import { EMOJIS } from "@/lib/emojis";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-6xl mx-auto pb-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6"
      >
        <div className="flex items-center gap-4">
          <span className="text-4xl">{EMOJIS.USER}</span>
          <div>
            <h1 className="text-2xl font-bold text-white">Profile</h1>
            <p className="text-sm text-secondary">Your character and achievements</p>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 3D Avatar Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card rounded-2xl p-8"
        >
          <h2 className="text-lg font-semibold text-white mb-6 text-center">
            Character Avatar (3D Preview)
          </h2>
          <div className="w-64 h-64 mx-auto">
            <Avatar3D level={5} />
          </div>
          <p className="text-center text-sm text-muted mt-4">
            Full Three.js integration coming soon
          </p>
        </motion.div>

        {/* User Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card rounded-2xl p-8"
        >
          <h2 className="text-lg font-semibold text-white mb-6">Account</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-muted">Username</span>
              <span className="text-white font-medium">{user?.username}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-muted">Email</span>
              <span className="text-white font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-muted">Level</span>
              <span className="text-cyan font-bold">{user?.level || 1}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-muted">XP</span>
              <span className="text-purple font-bold">{user?.xp || 0}</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="mt-6 w-full btn-primary bg-red-500/80 hover:bg-red-500"
          >
            {EMOJIS.LOGOUT} Logout
          </button>
        </motion.div>
      </div>
    </div>
  );
}
