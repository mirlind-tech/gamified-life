"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWebSocketContext } from "@/contexts/WebSocketContext";

export function Notifications() {
  const { notifications, dismissNotification, isConnected } = useWebSocketContext();

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    notifications.forEach((notification) => {
      if (Date.now() - notification.timestamp > 5000) {
        setTimeout(() => dismissNotification(notification.id), 5000);
      }
    });
  }, [notifications, dismissNotification]);

  const getLevelStyles = (level: string) => {
    switch (level) {
      case "success":
        return "bg-green-500/10 border-green-500/30 text-green-400";
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/30 text-yellow-400";
      case "error":
        return "bg-red-500/10 border-red-500/30 text-red-400";
      default:
        return "bg-cyan/10 border-cyan/30 text-cyan";
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "success":
        return "✓";
      case "warning":
        return "⚠";
      case "error":
        return "✕";
      default:
        return "ℹ";
    }
  };

  return (
    <>
      {/* Connection Status Indicator */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
          }`}
          title={isConnected ? "Connected" : "Disconnected"}
        />
      </div>

      {/* Notifications Stack */}
      <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 w-80">
        <AnimatePresence mode="popLayout">
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              layout
              className={`glass-card p-4 rounded-xl border ${getLevelStyles(notification.level)}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg">{getLevelIcon(notification.level)}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white text-sm">{notification.title}</h4>
                  <p className="text-sm text-muted mt-0.5">{notification.body}</p>
                </div>
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="text-muted hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
