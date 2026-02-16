import { useGame } from '../store/useGame';
import { EMOJIS } from '../utils/emojis';
import { motion } from 'framer-motion';
import { WillpowerIndicator } from './WillpowerIndicator';

const pillarConfig = [
  { id: 'craft', icon: EMOJIS.CRAFT, color: '#06b6d4', label: 'Craft' },
  { id: 'vessel', icon: EMOJIS.VESSEL, color: '#ec4899', label: 'Vessel' },
  { id: 'tongue', icon: EMOJIS.TONGUE, color: '#8b5cf6', label: 'Tongue' },
  { id: 'principle', icon: EMOJIS.PRINCIPLE, color: '#a855f7', label: 'Principle' },
  { id: 'capital', icon: EMOJIS.CAPITAL, color: '#10b981', label: 'Capital' },
] as const;

export function Header() {
  const { state } = useGame();
  const { player } = state;

  const willpower = player?.willpower ?? 100;
  const maxWillpower = player?.maxWillpower ?? 100;

  const pillars = player?.pillars ?? {
    craft: { level: 1 },
    vessel: { level: 1 },
    tongue: { level: 1 },
    principle: { level: 1 },
    capital: { level: 1 },
  };

  return (
    <header className="h-16 glass-card border-b border-white/5 relative z-10">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between">
        {/* Logo */}
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            <div className="text-2xl animate-pulse-glow">{EMOJIS.CROWN}</div>
            <div className="absolute inset-0 blur-lg bg-accent-purple/50 rounded-full" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gradient tracking-tight">
              Protocol
            </h1>
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-mono">
              v2.0 • Alpha
            </p>
          </div>
        </motion.div>

        {/* Stats Container */}
        <div className="flex items-center gap-4 lg:gap-6">
          {/* Pillar Badges - Hidden on mobile */}
          <motion.div 
            className="hidden md:flex items-center gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {pillarConfig.map((pillar, index) => {
              const pillarData = pillars[pillar.id as keyof typeof pillars];
              const value = pillarData?.level ?? 1;
              
              return (
                <motion.div
                  key={pillar.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                    bg-white/3 border border-white/8 
                    hover:border-white/15 hover:bg-white/5
                    transition-all duration-300 cursor-pointer"
                  style={{ 
                    boxShadow: `0 0 20px ${pillar.color}10`,
                  }}
                >
                  <span className="text-sm">{pillar.icon}</span>
                  <span 
                    className="text-sm font-bold font-mono"
                    style={{ color: pillar.color }}
                  >
                    {value}
                  </span>
                  
                  {/* Tooltip */}
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 
                    px-2 py-1 bg-bg-secondary border border-border rounded text-xs
                    text-text-secondary opacity-0 group-hover:opacity-100
                    transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {pillar.label}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Divider - Hidden on mobile */}
          <div className="hidden md:block w-px h-8 bg-linear-to-b from-transparent via-white/10 to-transparent" />

          {/* Willpower Bar */}
          <motion.div 
            className="w-32 lg:w-48"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <WillpowerIndicator 
              current={willpower} 
              max={maxWillpower}
              size="sm"
              showLabel={false}
            />
          </motion.div>
        </div>
      </div>
      
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-accent-purple/50 to-transparent" />
    </header>
  );
}
