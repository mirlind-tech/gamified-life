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
      { key: 'o', description: 'Switch to Command Center', handler: () => onSwitchViewRef.current('command') },
      { key: 'b', description: 'Switch to Body', handler: () => onSwitchViewRef.current('body') },
      { key: 'm', description: 'Switch to Mind', handler: () => onSwitchViewRef.current('mind') },
      { key: 'r', description: 'Switch to Career', handler: () => onSwitchViewRef.current('career') },
      { key: 'f', description: 'Switch to Finance', handler: () => onSwitchViewRef.current('finance') },
      { key: 'g', description: 'Switch to German', handler: () => onSwitchViewRef.current('german') },
      { key: 'c', description: 'Switch to AI Coach', handler: () => onSwitchViewRef.current('coach') },
      { key: 'u', description: 'Switch to Profile', handler: () => onSwitchViewRef.current('analytics') },
      { key: 'a', description: 'Switch to Account', handler: () => onSwitchViewRef.current('auth') },
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
