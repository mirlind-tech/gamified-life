import { useState } from 'react';
import { useGame } from '../store/useGame';
import type { ViewType } from '../types';
import { EMOJIS } from '../utils/emojis';
import { motion } from 'framer-motion';

interface NavItem {
  id: ViewType;
  icon: string;
  label: string;
  shortcut: string;
}

const navItems: NavItem[] = [
  { id: 'protocol', icon: EMOJIS.SCROLL, label: 'Protocol', shortcut: 'P' },
  { id: 'challenges', icon: EMOJIS.CHALLENGE, label: 'Challenges', shortcut: 'D' },
  { id: 'analytics', icon: EMOJIS.USER, label: 'Profile', shortcut: '5' },
  { id: 'achievements', icon: EMOJIS.ACHIEVEMENTS, label: 'Achievements', shortcut: '6' },
  { id: 'tree', icon: EMOJIS.TREE, label: 'Skills', shortcut: '1' },
  { id: 'focus', icon: EMOJIS.FOCUS, label: 'Focus', shortcut: '7' },
  { id: 'journal', icon: EMOJIS.JOURNAL, label: 'Journal', shortcut: '8' },
  { id: 'education', icon: EMOJIS.EDUCATION, label: 'Learn', shortcut: '9' },
  { id: 'meditate', icon: EMOJIS.MEDITATE, label: 'Meditate', shortcut: '0' },
  { id: 'habits', icon: EMOJIS.HABITS, label: 'Habits', shortcut: 'H' },
  { id: 'coach', icon: EMOJIS.COACH, label: 'AI Coach', shortcut: 'C' },
  { id: 'auth', icon: EMOJIS.LOCK, label: 'Account', shortcut: 'A' },
];

export function Sidebar() {
  const { state, setView } = useGame();
  const { currentView } = state;
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar when view changes (on mobile)
  const handleSelectView = (view: ViewType) => {
    setView(view);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-bg-secondary/80 border border-border rounded-lg backdrop-blur-sm"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        <span className="text-xl">{isOpen ? '✕' : '☰'}</span>
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-bg-secondary/95 lg:bg-bg-secondary/50 
          border-r border-border backdrop-blur-sm 
          flex flex-col transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `} 
        aria-label="Main navigation"
      >
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border">
          <span className="text-lg font-bold text-gradient">Protocol</span>
          <button onClick={() => setIsOpen(false)} className="p-1">
            <span className="text-xl">✕</span>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-6 overflow-y-auto" tabIndex={0}>
          <NavSection title="MAIN" items={navItems.slice(0, 4)} currentView={currentView} onSelect={handleSelectView} />
          <NavSection title="SKILLS" items={navItems.slice(4, 5)} currentView={currentView} onSelect={handleSelectView} />
          <NavSection title="GROWTH" items={navItems.slice(5, 11)} currentView={currentView} onSelect={handleSelectView} />
          <NavSection title="SETTINGS" items={navItems.slice(11)} currentView={currentView} onSelect={handleSelectView} />
        </nav>
      </aside>
    </>
  );
}

interface NavSectionProps {
  title: string;
  items: NavItem[];
  currentView: ViewType;
  onSelect: (view: ViewType) => void;
}

function NavSection({ title, items, currentView, onSelect }: NavSectionProps) {
  return (
    <div>
      <span className="text-xs font-bold text-text-muted tracking-wider px-3 mb-2 block">{title}</span>
      <div className="space-y-1">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <NavButton
              item={item}
              isActive={currentView === item.id}
              onClick={() => onSelect(item.id)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

interface NavButtonProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}

function NavButton({ item, isActive, onClick }: NavButtonProps) {
  return (
    <motion.button
      className={`
        w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
        transition-colors relative
        ${isActive 
          ? 'text-accent-purple' 
          : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
        }
      `}
      onClick={onClick}
      title={`${item.label} (${item.shortcut})`}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Active indicator */}
      {isActive && (
        <motion.div
          className="absolute inset-0 bg-accent-purple/10 border border-accent-purple/30 rounded-lg"
          layoutId="activeNav"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
        />
      )}
      
      <span className="text-lg relative z-10">{item.icon}</span>
      <span className="flex-1 text-left relative z-10">{item.label}</span>
      <kbd className={`
        px-1.5 py-0.5 text-xs rounded border relative z-10
        ${isActive 
          ? 'border-accent-purple/30 text-accent-purple' 
          : 'border-border text-text-muted'
        }
      `}>
        {item.shortcut}
      </kbd>
    </motion.button>
  );
}
