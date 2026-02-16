import { useState, useEffect, useCallback } from 'react';
import { logger } from '../utils/logger';

export interface NotificationSettings {
  enabled: boolean;
  habitReminders: boolean;
  habitReminderTime: string;
  habitEveningReminder: boolean;
  habitEveningTime: string;
  focusTimerComplete: boolean;
  dailyQuestReminder: boolean;
  questReminderTime: string;
  weeklySummary: boolean;
  weeklySummaryDay: number;
  weeklySummaryTime: string;
  streakAlerts: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  habitReminders: true,
  habitReminderTime: '08:00',
  habitEveningReminder: true,
  habitEveningTime: '20:00',
  focusTimerComplete: true,
  dailyQuestReminder: true,
  questReminderTime: '09:00',
  weeklySummary: true,
  weeklySummaryDay: 0, // Sunday
  weeklySummaryTime: '10:00',
  streakAlerts: true,
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};

export function useNotifications() {
  const isSupported = 'Notification' in window;

  const [settings, setSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('mirlind-notification-settings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (_e) {
        logger.error('Failed to parse notification settings:', _e);
      }
    }
    return DEFAULT_SETTINGS;
  });
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    return isSupported ? Notification.permission : 'default';
  });

  // Save settings when changed
  useEffect(() => {
    localStorage.setItem('mirlind-notification-settings', JSON.stringify(settings));
  }, [settings]);

  // Permission is checked during lazy initialization above

  // Check if in quiet hours
  const isQuietHours = useCallback(() => {
    if (!settings.quietHoursEnabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = settings.quietHoursStart.split(':').map(Number);
    const [endHour, endMin] = settings.quietHoursEnd.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes < endMinutes) {
      return currentTime >= startMinutes && currentTime < endMinutes;
    } else {
      return currentTime >= startMinutes || currentTime < endMinutes;
    }
  }, [settings.quietHoursEnabled, settings.quietHoursStart, settings.quietHoursEnd]);

  // Show notification
  const showLocalNotification = useCallback(async ({
    title,
    body,
    icon = '👑',
    tag,
  }: {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
  }) => {
    if (!settings.enabled || permission !== 'granted') return;
    if (isQuietHours()) return;

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          body,
          icon: getIconDataUrl(icon),
          badge: getBadgeDataUrl(),
          tag,
          requireInteraction: false,
        });
      } else {
        new Notification(title, { body, icon: getIconDataUrl(icon), tag });
      }
    } catch (_err) {
      logger.error('Failed to show notification:', _err);
    }
  }, [settings.enabled, permission, isQuietHours]);

  // Request permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        setSettings(prev => ({ ...prev, enabled: true }));
        showLocalNotification({
          title: '🔔 Notifications Enabled',
          body: "You'll now receive reminders for habits, focus sessions, and daily quests.",
          icon: '👑',
        });
      }

      return result === 'granted';
    } catch (err) {
      logger.error('Failed to request permission:', err);
      return false;
    }
  }, [isSupported, showLocalNotification]);

  // Update a setting
  const updateSetting = useCallback(<K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    if (!settings.enabled) {
      throw new Error('Please enable notifications first');
    }
    await showLocalNotification({
      title: '🔔 Test Notification',
      body: "Notifications are working! You'll receive reminders like this.",
      icon: '🔔',
    });
  }, [settings.enabled, showLocalNotification]);

  // Notify focus complete
  const notifyFocusComplete = useCallback(async () => {
    if (!settings.focusTimerComplete) return;
    await showLocalNotification({
      title: '🎯 Focus Session Complete!',
      body: 'Great work! You completed your focus session. Time for a break.',
      icon: '🎯',
    });
  }, [settings.focusTimerComplete, showLocalNotification]);

  // Notify streak milestone
  const notifyStreakMilestone = useCallback(async (habitName: string, streak: number) => {
    if (!settings.streakAlerts) return;
    const milestones = [7, 14, 30, 60, 90, 180, 365];
    if (!milestones.includes(streak)) return;

    await showLocalNotification({
      title: `🔥 ${streak} Day Streak!`,
      body: `Incredible! You've kept "${habitName}" going for ${streak} days straight!`,
      icon: '🔥',
    });
  }, [settings.streakAlerts, showLocalNotification]);

  // Notify level up
  const notifyLevelUp = useCallback(async (skillName: string, newLevel: number) => {
    await showLocalNotification({
      title: '🎉 Level Up!',
      body: `${skillName} has reached Level ${newLevel}! Your dedication is paying off.`,
      icon: '📈',
    });
  }, [showLocalNotification]);

  // Notify achievement
  const notifyAchievement = useCallback(async (achievementName: string) => {
    await showLocalNotification({
      title: '🏆 Achievement Unlocked!',
      body: `You earned: ${achievementName}`,
      icon: '🏆',
    });
  }, [showLocalNotification]);

  return {
    settings,
    permission,
    isSupported,
    canNotify: settings.enabled && permission === 'granted',
    requestPermission,
    updateSetting,
    sendTestNotification,
    notifyFocusComplete,
    notifyStreakMilestone,
    notifyLevelUp,
    notifyAchievement,
  };
}

// Helper functions
function getIconDataUrl(emoji: string): string {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="#0a0a0f" width="192" height="192" rx="24"/><text x="96" y="120" font-size="100" text-anchor="middle" fill="#8b5cf6">${emoji}</text></svg>`
  )}`;
}

function getBadgeDataUrl(): string {
  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"%3E%3Crect fill="%238b5cf6" width="72" height="72" rx="12"/%3E%3C/svg%3E';
}
