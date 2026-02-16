import { useEffect, useCallback, useState, useRef } from 'react';

interface Shortcut {
  key: string;
  description: string;
  handler: () => void;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}

export function useKeyboardShortcuts(
  onSwitchView: (view: string) => void,
  onCloseModal?: () => void
) {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [showHelp, setShowHelp] = useState(false);

  // Register default shortcuts - use refs to avoid dependency issues
  const onSwitchViewRef = useRef(onSwitchView);
  const onCloseModalRef = useRef(onCloseModal);
  
  // Keep refs updated - only when values actually change
  useEffect(() => {
    if (onSwitchViewRef.current !== onSwitchView) {
      onSwitchViewRef.current = onSwitchView;
    }
  });
  
  useEffect(() => {
    if (onCloseModalRef.current !== onCloseModal) {
      onCloseModalRef.current = onCloseModal;
    }
  });

  // Initialize shortcuts once
  useEffect(() => {
    const defaultShortcuts: Shortcut[] = [
      { key: '1', description: 'Switch to Tree view', handler: () => onSwitchViewRef.current('tree') },
      { key: '2', description: 'Switch to Cards view', handler: () => onSwitchViewRef.current('cards') },
      { key: '3', description: 'Switch to Quests view', handler: () => onSwitchViewRef.current('quests') },
      { key: '4', description: 'Switch to Gates view', handler: () => onSwitchViewRef.current('gates') },
      { key: '5', description: 'Switch to Analytics view', handler: () => onSwitchViewRef.current('analytics') },
      { key: '6', description: 'Switch to Achievements view', handler: () => onSwitchViewRef.current('achievements') },
      { key: '7', description: 'Switch to Focus Timer', handler: () => onSwitchViewRef.current('focus') },
      { key: '8', description: 'Switch to Journal', handler: () => onSwitchViewRef.current('journal') },
      { key: '9', description: 'Switch to Education', handler: () => onSwitchViewRef.current('education') },
      { key: '0', description: 'Switch to Meditation', handler: () => onSwitchViewRef.current('meditate') },
      { key: 'c', description: 'Switch to AI Coach', handler: () => onSwitchViewRef.current('coach') },
      { key: 'h', description: 'Switch to Habits', handler: () => onSwitchViewRef.current('habits') },
      { key: 'd', description: 'Switch to Daily Challenges', handler: () => onSwitchViewRef.current('challenges') },
      { key: 'n', description: 'Notification Settings', handler: () => onSwitchViewRef.current('notifications') },
      { key: '?', description: 'Show keyboard shortcuts', handler: () => setShowHelp(true), shift: true },
      { key: 'Escape', description: 'Close modals / Go back', handler: () => {
        if (onCloseModalRef.current) onCloseModalRef.current();
        setShowHelp(false);
      }},
    ];

    setShortcuts(defaultShortcuts);
  }, []); // Only run once on mount

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = event.ctrlKey === !!shortcut.ctrl;
        const shiftMatch = event.shiftKey === !!shortcut.shift;
        const altMatch = event.altKey === !!shortcut.alt;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.handler();
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  const formatKey = useCallback((shortcut: Shortcut) => {
    let key = shortcut.key.toUpperCase();
    if (shortcut.key === ' ') key = 'Space';
    if (shortcut.ctrl) key = 'Ctrl+' + key;
    if (shortcut.shift) key = 'Shift+' + key;
    if (shortcut.alt) key = 'Alt+' + key;
    return key;
  }, []);

  return {
    shortcuts,
    showHelp,
    setShowHelp,
    formatKey,
  };
}
