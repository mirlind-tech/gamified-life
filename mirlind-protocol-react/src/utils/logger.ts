/**
 * Logger utility that respects the environment
 * - In development: logs to console
 * - In production: logs are suppressed (except errors)
 */

const isDev = import.meta.env.DEV;

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.log('[DEBUG]', ...args);
    }
  },
  
  info: (...args: unknown[]) => {
    if (isDev) {
      console.info('[INFO]', ...args);
    }
  },
  
  warn: (...args: unknown[]) => {
    // Warnings are shown in both dev and production
    console.warn('[WARN]', ...args);
  },
  
  error: (...args: unknown[]) => {
    // Errors are always shown
    console.error('[ERROR]', ...args);
  },
};

export default logger;
