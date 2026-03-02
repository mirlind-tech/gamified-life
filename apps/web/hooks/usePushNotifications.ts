"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ProtocolReminder {
  id: string;
  title: string;
  body: string;
  scheduledTime: number;
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const remindersRef = useRef<Map<string, number>>(new Map());

  // Check support on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  // Request permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    } catch (e) {
      console.error("[Push] Failed to request permission:", e);
      return false;
    }
  }, [isSupported]);

  // Show notification immediately
  const notify = useCallback((title: string, body: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== "granted") return false;

    try {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "mirlind-protocol",
        requireInteraction: false,
        ...options,
      });
      return true;
    } catch (e) {
      console.error("[Push] Failed to show notification:", e);
      return false;
    }
  }, [isSupported, permission]);

  // Schedule a reminder
  const scheduleReminder = useCallback((id: string, title: string, body: string, delayMs: number) => {
    // Clear existing reminder with same id
    if (remindersRef.current.has(id)) {
      clearTimeout(remindersRef.current.get(id));
    }

    const timeoutId = window.setTimeout(() => {
      notify(title, body);
      remindersRef.current.delete(id);
    }, delayMs);

    remindersRef.current.set(id, timeoutId);
    return id;
  }, [notify]);

  // Cancel a reminder
  const cancelReminder = useCallback((id: string) => {
    if (remindersRef.current.has(id)) {
      clearTimeout(remindersRef.current.get(id));
      remindersRef.current.delete(id);
      return true;
    }
    return false;
  }, []);

  // Clear all reminders
  const clearAllReminders = useCallback(() => {
    remindersRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    remindersRef.current.clear();
  }, []);

  // Schedule protocol reminders
  const scheduleProtocolReminders = useCallback(() => {
    if (permission !== "granted") return;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    // 05:00 Wake up reminder
    const wakeTime = 5 * 60; // 5:00 AM in minutes
    if (currentTime < wakeTime) {
      const delay = (wakeTime - currentTime) * 60 * 1000;
      scheduleReminder("wake", "🌅 Wake Up", "It's 05:00. Time to start your protocol.", delay);
    }

    // 22:00 Sleep reminder
    const sleepTime = 22 * 60; // 22:00 in minutes
    if (currentTime < sleepTime) {
      const delay = (sleepTime - currentTime) * 60 * 1000;
      scheduleReminder("sleep", "🌙 Sleep Time", "It's 22:00. Time to sleep and recover.", delay);
    }

    // Protocol completion reminder at 21:00
    const completionTime = 21 * 60; // 21:00
    if (currentTime < completionTime) {
      const delay = (completionTime - currentTime) * 60 * 1000;
      scheduleReminder("protocol", "📋 Protocol Check", "Have you completed today's protocol items?", delay);
    }

    // Streak alert - check at 20:00 if protocol is not complete
    const streakTime = 20 * 60; // 20:00
    if (currentTime < streakTime) {
      const delay = (streakTime - currentTime) * 60 * 1000;
      scheduleReminder("streak", "🔥 Streak Alert", "Complete your protocol items to maintain your streak!", delay);
    }
  }, [permission, scheduleReminder]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearAllReminders();
  }, [clearAllReminders]);

  return {
    isSupported,
    permission,
    requestPermission,
    notify,
    scheduleReminder,
    cancelReminder,
    clearAllReminders,
    scheduleProtocolReminders,
  };
}
