import { motion } from 'framer-motion';
import { useNotifications } from '../hooks/useNotifications';
import { EMOJIS } from '../utils/emojis';
import { FadeIn } from '../components/animations';



export function NotificationsView() {
  const {
    settings,
    permission,
    canNotify,
    requestPermission,
    updateSetting,
    sendTestNotification,
  } = useNotifications();

  const isGranted = permission === 'granted';
  const isDenied = permission === 'denied';

  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to send notification');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <FadeIn>
        <div className="text-center mb-8 p-8 bg-linear-to-br from-accent-purple/20 to-accent-cyan/20 rounded-2xl border border-accent-purple/30">
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            {EMOJIS.NOTIFICATIONS} Notification Settings
          </h2>
          <p className="text-text-secondary">Stay on track with timely reminders</p>
        </div>
      </FadeIn>

      {/* Permission Status */}
      {isDenied ? (
        <div className="bg-accent-red/10 border border-accent-red/30 rounded-xl p-6 mb-6 text-center">
          <div className="text-3xl mb-2">{EMOJIS.ERROR}</div>
          <h3 className="text-accent-red font-semibold mb-2">Notifications Blocked</h3>
          <p className="text-text-secondary mb-4">Browser has blocked notification permission.</p>
          <ol className="text-left text-sm text-text-secondary space-y-2 mb-4 bg-black/20 p-4 rounded-lg">
            <li>1. Click the 🔒 icon in the browser address bar</li>
            <li>2. Find "Notifications" and change it to "Allow"</li>
            <li>3. Refresh this page</li>
          </ol>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-accent-red hover:bg-accent-red/80 text-white font-semibold rounded-lg transition-colors"
          >
            {EMOJIS.REFRESH} Refresh Page
          </button>
        </div>
      ) : !isGranted ? (
        <div className="bg-accent-yellow/10 border border-accent-yellow/30 rounded-xl p-6 mb-6 text-center">
          <div className="text-3xl mb-2">{EMOJIS.LOCK}</div>
          <h3 className="text-accent-yellow font-semibold mb-2">Notifications Not Enabled</h3>
          <p className="text-text-secondary mb-4">Enable notifications to receive habit reminders, focus alerts, and more.</p>
          <button
            onClick={requestPermission}
            className="px-6 py-2.5 bg-accent-yellow hover:bg-accent-yellow/80 text-black font-semibold rounded-lg transition-colors"
          >
            {EMOJIS.UNLOCK} Enable Notifications
          </button>
        </div>
      ) : (
        <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-4 mb-6 flex items-center gap-4">
          <span className="text-2xl">{EMOJIS.CHECK}</span>
          <div className="flex-1">
            <div className="text-accent-green font-semibold">Notifications Enabled</div>
            <div className="text-text-secondary text-sm">You'll receive reminders for habits, focus sessions, and more.</div>
          </div>
          <button
            onClick={handleTestNotification}
            className="px-3 py-1.5 bg-accent-purple/20 hover:bg-accent-purple/30 border border-accent-purple/30 text-accent-purple rounded-lg text-sm font-medium transition-colors"
          >
            Test
          </button>
        </div>
      )}

      {/* Settings */}
      <div className="space-y-4">
        {/* Master Toggle */}
        <SettingCard disabled={!isGranted}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-text-primary">Enable Notifications</h3>
              <p className="text-sm text-text-secondary">Master switch for all notifications</p>
            </div>
            <Toggle
              checked={settings.enabled && isGranted}
              onChange={(v) => updateSetting('enabled', v)}
              disabled={!isGranted}
            />
          </div>
        </SettingCard>

        {/* Habit Reminders */}
        <SettingCard disabled={!canNotify}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">{EMOJIS.HABITS}</span>
              <div>
                <h3 className="font-semibold text-text-primary">Habit Reminders</h3>
                <p className="text-sm text-text-secondary">Daily reminders to check in on your habits</p>
              </div>
            </div>
            <Toggle
              checked={settings.habitReminders}
              onChange={(v) => updateSetting('habitReminders', v)}
              disabled={!canNotify}
              color="bg-accent-cyan"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 pl-9">
            <div>
              <label className="block text-xs text-text-secondary mb-1">Morning</label>
              <input
                type="time"
                value={settings.habitReminderTime}
                onChange={(e) => updateSetting('habitReminderTime', e.target.value)}
                disabled={!settings.habitReminders || !canNotify}
                className="w-full px-3 py-2 bg-black/30 border border-border rounded-lg text-text-primary text-sm disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Evening</label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.habitEveningReminder}
                  onChange={(e) => updateSetting('habitEveningReminder', e.target.checked)}
                  disabled={!settings.habitReminders || !canNotify}
                  className="w-4 h-4 accent-accent-purple"
                />
                <input
                  type="time"
                  value={settings.habitEveningTime}
                  onChange={(e) => updateSetting('habitEveningTime', e.target.value)}
                  disabled={!settings.habitEveningReminder || !settings.habitReminders || !canNotify}
                  className="flex-1 px-3 py-2 bg-black/30 border border-border rounded-lg text-text-primary text-sm disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        </SettingCard>

        {/* Focus Timer */}
        <SettingCard disabled={!canNotify}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">{EMOJIS.FOCUS}</span>
              <div>
                <h3 className="font-semibold text-text-primary">Focus Timer Complete</h3>
                <p className="text-sm text-text-secondary">Get notified when your focus session ends</p>
              </div>
            </div>
            <Toggle
              checked={settings.focusTimerComplete}
              onChange={(v) => updateSetting('focusTimerComplete', v)}
              disabled={!canNotify}
            />
          </div>
        </SettingCard>

        {/* Quest Reminders */}
        <SettingCard disabled={!canNotify}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">{EMOJIS.QUESTS}</span>
              <div>
                <h3 className="font-semibold text-text-primary">Daily Quest Reminder</h3>
                <p className="text-sm text-text-secondary">Reminder when new quests are available</p>
              </div>
            </div>
            <Toggle
              checked={settings.dailyQuestReminder}
              onChange={(v) => updateSetting('dailyQuestReminder', v)}
              disabled={!canNotify}
              color="bg-accent-pink"
            />
          </div>
          
          <div className="pl-9">
            <label className="block text-xs text-text-secondary mb-1">Reminder Time</label>
            <input
              type="time"
              value={settings.questReminderTime}
              onChange={(e) => updateSetting('questReminderTime', e.target.value)}
              disabled={!settings.dailyQuestReminder || !canNotify}
              className="w-32 px-3 py-2 bg-black/30 border border-border rounded-lg text-text-primary text-sm disabled:opacity-50"
            />
          </div>
        </SettingCard>

        {/* Streak Alerts */}
        <SettingCard disabled={!canNotify}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">{EMOJIS.FIRE}</span>
              <div>
                <h3 className="font-semibold text-text-primary">Streak Milestones</h3>
                <p className="text-sm text-text-secondary">Celebrate streak milestones (7, 14, 30 days...)</p>
              </div>
            </div>
            <Toggle
              checked={settings.streakAlerts}
              onChange={(v) => updateSetting('streakAlerts', v)}
              disabled={!canNotify}
              color="bg-accent-yellow"
            />
          </div>
        </SettingCard>

        {/* Quiet Hours */}
        <SettingCard disabled={!canNotify}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">{EMOJIS.MOON}</span>
              <div>
                <h3 className="font-semibold text-text-primary">Quiet Hours</h3>
                <p className="text-sm text-text-secondary">No notifications during these hours</p>
              </div>
            </div>
            <Toggle
              checked={settings.quietHoursEnabled}
              onChange={(v) => updateSetting('quietHoursEnabled', v)}
              disabled={!canNotify}
              color="bg-indigo-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 pl-9">
            <div>
              <label className="block text-xs text-text-secondary mb-1">Start</label>
              <input
                type="time"
                value={settings.quietHoursStart}
                onChange={(e) => updateSetting('quietHoursStart', e.target.value)}
                disabled={!settings.quietHoursEnabled || !canNotify}
                className="w-full px-3 py-2 bg-black/30 border border-border rounded-lg text-text-primary text-sm disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">End</label>
              <input
                type="time"
                value={settings.quietHoursEnd}
                onChange={(e) => updateSetting('quietHoursEnd', e.target.value)}
                disabled={!settings.quietHoursEnabled || !canNotify}
                className="w-full px-3 py-2 bg-black/30 border border-border rounded-lg text-text-primary text-sm disabled:opacity-50"
              />
            </div>
          </div>
        </SettingCard>
      </div>
    </div>
  );
}

// Helper Components
function SettingCard({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  return (
    <motion.div
      className={`bg-bg-card border border-border rounded-xl p-5 transition-opacity ${disabled ? 'opacity-50' : ''}`}
      whileHover={!disabled ? { borderColor: 'rgba(139, 92, 246, 0.3)' } : {}}
    >
      {children}
    </motion.div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
  color = 'bg-accent-purple',
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  color?: string;
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative w-12 h-6 rounded-full transition-colors ${checked ? color : 'bg-text-muted/30'} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <motion.div
        className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
        animate={{ x: checked ? 24 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}
