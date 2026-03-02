import { useState, useMemo } from 'react';
import { useGame } from '../store/useGame';
import { useAuth } from '../contexts/useAuth';
import type { ViewType } from '../types';
import { EMOJIS } from '../utils/emojis';
import { motion } from 'framer-motion';
import { calculateCoreStats } from '../utils/coreStats';

interface NavItem {
  id: ViewType;
  icon: string;
  label: string;
  shortcut: string;
}

interface NavSectionConfig {
  title: string;
  items: NavItem[];
}

const navSections: NavSectionConfig[] = [
  {
    title: 'CORE JOURNEY',
    items: [
      { id: 'command', icon: EMOJIS.SCROLL, label: 'Command Center', shortcut: 'O' },
      { id: 'body', icon: EMOJIS.VESSEL, label: 'Body (Baki)', shortcut: 'B' },
      { id: 'mind', icon: EMOJIS.BRAIN, label: 'Mind (Fang Yuan)', shortcut: 'M' },
      { id: 'career', icon: EMOJIS.CODE, label: 'Career (Code)', shortcut: 'R' },
      { id: 'finance', icon: EMOJIS.CAPITAL, label: 'Finance', shortcut: 'F' },
      { id: 'german', icon: EMOJIS.FLAG, label: 'German', shortcut: 'G' },
      { id: 'coach', icon: EMOJIS.COACH, label: 'AI Coach', shortcut: 'C' },
    ],
  },
  {
    title: 'OVERVIEW',
    items: [
      { id: 'analytics', icon: EMOJIS.USER, label: 'Profile', shortcut: 'U' },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { id: 'auth', icon: EMOJIS.LOCK, label: 'Account', shortcut: 'A' },
    ],
  },
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
      {/* Mobile toggle button - hidden when sidebar is open */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-bg-secondary/90 border border-border rounded-xl backdrop-blur-sm shadow-lg"
        aria-label="Open menu"
        initial={false}
        animate={{ opacity: isOpen ? 0 : 1, scale: isOpen ? 0.8 : 1 }}
        transition={{ duration: 0.2 }}
        style={{ pointerEvents: isOpen ? 'none' : 'auto' }}
      >
        <span className="text-lg">☰</span>
      </motion.button>

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
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👑</span>
            <span className="text-lg font-bold bg-linear-to-r from-accent-purple to-accent-cyan bg-clip-text text-transparent">Protocol</span>
          </div>
          <motion.button 
            onClick={() => setIsOpen(false)} 
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            whileTap={{ scale: 0.95 }}
            aria-label="Close menu"
          >
            <span className="text-xl text-text-secondary hover:text-text-primary transition-colors">✕</span>
          </motion.button>
        </div>

        {/* Mini Character Profile */}
        <MiniProfile />

        <nav className="flex-1 p-4 space-y-6 overflow-y-auto" tabIndex={0}>
          {navSections.map(section => (
            <NavSection
              key={section.title}
              title={section.title}
              items={section.items}
              currentView={currentView}
              onSelect={handleSelectView}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}

// Mini Character Profile Component for Sidebar
function MiniProfile() {
  const { state, setView } = useGame();
  const { player } = state;
  const { user } = useAuth();

  const level = Math.floor((player?.totalXPEarned || 0) / 1000) + 1;
  const xp = (player?.totalXPEarned || 0) % 1000;
  const xpPercent = (xp / 1000) * 100;

  // Calculate core stats using same logic as CharacterProfileView
  const coreStats = useMemo(() => calculateCoreStats(player), [player]);

  // Calculate total power from core stats
  const totalPower = useMemo(() => {
    return Object.values(coreStats).reduce((sum, val) => sum + val, 0);
  }, [coreStats]);

  // Get dominant stat for avatar
  const dominantStat = useMemo(() => {
    const entries = Object.entries(coreStats);
    return entries.reduce((max, [key, val]) => val > max[1] ? [key, val] : max, entries[0])[0];
  }, [coreStats]);

  // Get display name - prefer username from auth, then player name, then fallback
  const displayName = user?.username || (player?.name && player.name !== 'Unnamed Warrior' ? player.name : 'Novice Seeker');

  const avatars: Record<string, string> = {
    strength: '💪',
    intelligence: '🧠',
    wisdom: '🔮',
    agility: '⚡',
    charisma: '🗣️',
    constitution: '❤️',
    discipline: '⛓️',
    creativity: '✨',
  };

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full px-4 py-3 border-b border-border/50 cursor-pointer hover:bg-white/5 transition-colors text-left"
      onClick={() => setView('analytics')}
      aria-label="Open profile dashboard"
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-linear-to-br from-accent-purple/30 to-accent-cyan/30 flex items-center justify-center text-2xl border border-border">
            {avatars[dominantStat] || '🎭'}
          </div>
          {/* Level badge */}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-accent-purple text-white text-xs font-bold flex items-center justify-center border border-bg-secondary">
            {level}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-primary text-sm truncate">
            {displayName}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent-purple rounded-full transition-all"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <span className="text-xs text-text-muted">{xp}/1000</span>
          </div>
        </div>

        {/* Power */}
        <div className="text-right">
          <p className="text-xs text-text-muted">PWR</p>
          <p className="text-lg font-bold text-accent-cyan">{totalPower}</p>
        </div>
      </div>
    </motion.button>
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
