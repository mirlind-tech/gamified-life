"use client";

import React, { createContext, useContext, useCallback, useEffect, useState } from "react";
import { useWebSocket, WsMessage } from "@/hooks/useWebSocket";

interface Notification {
  id: string;
  title: string;
  body: string;
  level: "info" | "warning" | "error" | "success";
  timestamp: number;
}

interface WebSocketContextValue {
  isConnected: boolean;
  isAuthenticated: boolean;
  notifications: Notification[];
  subscribe: (_channel: string) => boolean;
  unsubscribe: (_channel: string) => boolean;
  sendNotification: (_title: string, _body: string, _level?: Notification["level"]) => void;
  dismissNotification: (_id: string) => void;
  clearNotifications: () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function useWebSocketContext() {
  const ctx = useContext(WebSocketContext);
  if (!ctx) {
    throw new Error("useWebSocketContext must be used within WebSocketProvider");
  }
  return ctx;
}

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const handleMessage = useCallback((msg: WsMessage) => {
    switch (msg.type) {
      case "notification":
        addNotification({
          title: msg.payload.title,
          body: msg.payload.body,
          level: msg.payload.level as Notification["level"],
        });
        break;
      case "stats_update":
        // Could update global state here
        console.log("[WS] Stats update:", msg.payload);
        break;
      case "protocol_complete":
        addNotification({
          title: "Protocol Complete!",
          body: `You scored ${msg.payload.score}% today. Streak maintained!`,
          level: "success",
        });
        break;
      case "error":
        addNotification({
          title: "Error",
          body: msg.payload.message,
          level: "error",
        });
        break;
    }
  }, []);

  const { isConnected, isAuthenticated, subscribe, unsubscribe, send: _send } = useWebSocket({
    onMessage: handleMessage,
    autoReconnect: true,
  });

  const addNotification = useCallback((notification: Omit<Notification, "id" | "timestamp">) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };

    setNotifications((prev) => [newNotification, ...prev].slice(0, 50)); // Keep last 50

    // Show browser notification if permitted
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.body,
        icon: "/favicon.ico",
      });
    }
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const sendNotification = useCallback(
    (title: string, body: string, level: Notification["level"] = "info") => {
      addNotification({ title, body, level });
    },
    [addNotification]
  );

  // Request browser notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const value: WebSocketContextValue = {
    isConnected,
    isAuthenticated,
    notifications,
    subscribe,
    unsubscribe,
    sendNotification,
    dismissNotification,
    clearNotifications,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}
