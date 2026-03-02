import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/useAuth';
import { EMOJIS } from '../utils/emojis';
import { getApiUrl } from '../services/authApi';
import { exportUserData } from '../services/exportApi';
import { logger } from '../utils/logger';

export function AuthView() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const { login, register, error, clearError, isConnectivityError, isAuthenticated, user } = useAuth();
  const apiUrl = getApiUrl();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, username);
      }
    } catch {
      // Error is handled in auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated && user) {
    const handleExport = async () => {
      setIsExporting(true);
      try {
        const backup = await exportUserData();
        const fileName = `gamified-life-backup-${user.username}-${new Date()
          .toISOString()
          .slice(0, 10)}.json`;
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        logger.error('Failed to export user data:', error);
      } finally {
        setIsExporting(false);
      }
    };

    return (
      <div className="max-w-md mx-auto mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-8 text-center"
        >
          <div className="text-5xl mb-4">{EMOJIS.CROWN}</div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Welcome, {user.username}!
          </h2>
          <p className="text-text-secondary mb-6">
            You are authenticated and ready to build your empire.
          </p>
          <div className="text-sm text-text-muted">
            {user.email}
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="mt-5 px-4 py-2 rounded-lg bg-accent-cyan-dark text-white hover:bg-accent-cyan-dark/80 disabled:opacity-60"
          >
            {isExporting ? 'Exporting...' : 'Backup / Export Data'}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">{isLogin ? EMOJIS.LOCK : EMOJIS.STAR}</div>
          <h2 className="text-2xl font-bold text-text-primary">
            {isLogin ? 'Welcome Back' : 'Join the Protocol'}
          </h2>
          <p className="text-text-secondary mt-2">
            {isLogin 
              ? 'Continue your journey to mastery' 
              : 'Start building your empire today'}
          </p>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {error && isConnectivityError && (
          <div className="mb-4 p-3 bg-amber-500/15 border border-amber-500/40 rounded-lg text-amber-200 text-xs space-y-1">
            <p className="font-semibold">Connectivity help</p>
            <p>1. Start backend: `cd backend && npm run dev`</p>
            <p>2. Verify health: `http://localhost:3001/api/health`</p>
            <p>3. Ensure backend CORS allows your frontend origin</p>
          </div>
        )}

        <p className="mb-4 text-xs text-text-muted">
          API endpoint: <span className="font-mono text-text-secondary">{apiUrl}</span>
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                className="w-full px-4 py-3 bg-black/30 border border-border rounded-lg text-text-primary placeholder-text-muted focus:border-accent-purple focus:outline-none transition-colors"
                placeholder="Enter your username"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black/30 border border-border rounded-lg text-text-primary placeholder-text-muted focus:border-accent-purple focus:outline-none transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 bg-black/30 border border-border rounded-lg text-text-primary placeholder-text-muted focus:border-accent-purple focus:outline-none transition-colors"
              placeholder="Min 8 characters"
            />
          </div>

          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 px-4 bg-linear-to-r from-accent-purple to-accent-cyan text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting 
              ? 'Processing...' 
              : isLogin ? 'Sign In' : 'Create Account'}
          </motion.button>
        </form>

        {/* Toggle */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              clearError();
            }}
            className="text-sm text-accent-purple hover:text-accent-cyan transition-colors"
          >
            {isLogin 
              ? "Don't have an account? Sign up" 
              : 'Already have an account? Sign in'}
          </button>
        </div>

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-text-muted text-sm">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Demo Info */}
        <div className="text-center text-xs text-text-muted">
          <p>Backend required: Node.js + SQLite</p>
          <p className="mt-1">Run: cd backend && npm run dev</p>
        </div>
      </motion.div>
    </div>
  );
}
