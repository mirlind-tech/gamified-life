"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Hexagon, Loader2 } from "lucide-react";
import { loginAction, type AuthState } from "./actions/auth";

// Auto-login for preview mode - no manual login needed
const AUTO_LOGIN = true;

export default function LoginPage() {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [autoLoggingIn, setAutoLoggingIn] = useState(AUTO_LOGIN);
  
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    loginAction,
    { success: false }
  );

  // Auto-login on mount for preview
  useEffect(() => {
    if (AUTO_LOGIN) {
      const autoLogin = async () => {
        const formData = new FormData();
        formData.append('email', 'demo@mirlind.io');
        formData.append('password', 'demo');
        
        // Programmatically submit the form
        const form = document.createElement('form');
        form.action = formAction as unknown as string;
        form.method = 'POST';
        
        // Use the form action directly
        try {
          const result = await loginAction({ success: false }, formData);
          if (result.success) {
            router.push('/dashboard');
          }
        } catch {
          setAutoLoggingIn(false);
        }
      };
      
      autoLogin();
    }
  }, [router]);

  useEffect(() => {
    if (state.success) {
      router.push("/dashboard");
    }
  }, [state.success, router]);

  // Show loading screen while auto-logging in
  if (autoLoggingIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center animate-pulse">
            <Hexagon className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <p className="text-[#6b6b80]">Loading preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0f]">
      {/* Subtle background gradient */}
      <div 
        className="fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0, 212, 255, 0.08), transparent),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(168, 85, 247, 0.05), transparent)
          `
        }}
      />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/20">
            <Hexagon className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-white">Mirlind Protocol</h1>
          <p className="text-sm text-[#6b6b80] mt-1">Gamified Life OS</p>
        </div>

        {/* Card */}
        <div className="bg-[#12121a] border border-[#ffffff0f] rounded-xl p-6">
          {/* Status */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-[#6b6b80] uppercase tracking-wider font-mono">
              Preview Mode
            </span>
          </div>

          {/* Error/Success */}
          {state.error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{state.error}</p>
            </div>
          )}

          {/* Form */}
          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-[#a1a1b5] uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue="demo@mirlind.io"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 bg-[#1a1a25] border border-[#ffffff0f] rounded-lg text-white text-sm placeholder:text-[#4a4a5c] focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>

            {isRegistering && (
              <div>
                <label htmlFor="username" className="block text-xs font-medium text-[#a1a1b5] uppercase tracking-wider mb-1.5">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="username"
                  className="w-full px-4 py-2.5 bg-[#1a1a25] border border-[#ffffff0f] rounded-lg text-white text-sm placeholder:text-[#4a4a5c] focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-[#a1a1b5] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                defaultValue="demo"
                required
                autoComplete={isRegistering ? "new-password" : "current-password"}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-[#1a1a25] border border-[#ffffff0f] rounded-lg text-white text-sm placeholder:text-[#4a4a5c] focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>

            {isRegistering && (
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-medium text-[#a1a1b5] uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-[#1a1a25] border border-[#ffffff0f] rounded-lg text-white text-sm placeholder:text-[#4a4a5c] focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-[#0a0a0f] font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {pending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                isRegistering ? "Create Account" : "Sign In"
              )}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              disabled={pending}
              className="text-sm text-[#6b6b80] hover:text-cyan-400 transition-colors"
            >
              {isRegistering
                ? "Already have an account? Sign in"
                : "Need an account? Create one"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#4a4a5c] mt-6 font-mono">
          Rust Gateway v2.0 • Actix-Web • React 19
        </p>
      </div>
    </div>
  );
}
