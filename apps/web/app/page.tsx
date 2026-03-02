"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, register, isLoading } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isRegistering) {
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (!formData.username) {
        setError("Username is required");
        return;
      }
    }

    try {
      if (isRegistering) {
        await register(formData.email, formData.username, formData.password);
      } else {
        await login(formData.email, formData.password);
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
      </div>

      <div className="glass-card w-full max-w-md p-8 relative z-10 animate-slide-up">
        {/* Title */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold gradient-text mb-2 tracking-tight">
            MIRLIND PROTOCOL
          </h1>
          <p className="text-secondary text-sm tracking-[0.2em] uppercase">
            Gamified Life OS
          </p>
        </div>

        {/* Status */}
        <div className="flex items-center justify-center gap-2 mb-6 text-center">
          <span className="status-dot status-online animate-pulse" />
          <span className="text-xs text-muted uppercase tracking-wider font-mono">
            Gateway Connected
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="text-center">
            <label htmlFor="email" className="block text-xs uppercase tracking-wider text-secondary mb-2 font-medium w-full">
              Email
            </label>
            <div className="flex justify-center">
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field text-center w-[70%]"
                placeholder="user@example.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Username */}
          {isRegistering && (
            <div className="text-center">
              <label htmlFor="username" className="block text-xs uppercase tracking-wider text-secondary mb-2 font-medium w-full">
                Username
              </label>
              <div className="flex justify-center">
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input-field text-center w-[70%]"
                  placeholder="Username"
                  required
                  autoComplete="username"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div className="text-center">
            <label htmlFor="password" className="block text-xs uppercase tracking-wider text-secondary mb-2 font-medium w-full">
              Password
            </label>
            <div className="flex justify-center">
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field text-center w-[70%]"
                placeholder="••••••••"
                required
                autoComplete={isRegistering ? "new-password" : "current-password"}
              />
            </div>
          </div>

          {/* Confirm Password */}
          {isRegistering && (
            <div className="text-center">
              <label htmlFor="confirmPassword" className="block text-xs uppercase tracking-wider text-secondary mb-2 font-medium w-full">
                Confirm Password
              </label>
              <div className="flex justify-center">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="input-field text-center w-[70%]"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}

          <div className="text-center">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
            {isLoading ? "Processing..." : isRegistering ? "Create Account" : "Enter System"}
            </button>
          </div>
        </form>

        {/* Toggle */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError("");
            }}
            className="text-sm text-cyan hover:text-magenta hover:underline hover:drop-shadow-[0_0_8px_rgba(255,42,109,0.5)] transition-all"
          >
            {isRegistering
              ? "Already have an account? Sign in"
              : "Need an account? Create one"}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-muted font-mono">
            Rust Gateway v2.0.0 • Actix-Web
          </p>
        </div>
      </div>
    </main>
  );
}
