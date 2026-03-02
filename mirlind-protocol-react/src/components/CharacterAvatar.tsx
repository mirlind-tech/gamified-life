import { useGame } from '../store/useGame';
import { motion } from 'framer-motion';


interface AuraConfig {
  color: string;
  intensity: number;
  particles: number;
}

export function CharacterAvatar() {
  const { state } = useGame();
  const { player } = state;

  // Calculate overall power level
  const totalLevel = Object.values(player?.pillars || {}).reduce((sum, p) => sum + (p.level || 0), 0);
  const powerLevel = Math.min(100, totalLevel * 2);
  
  // Determine rank based on power level
  const getRank = () => {
    if (powerLevel >= 80) return { name: 'Legend', color: '#fbbf24', icon: '👑' };
    if (powerLevel >= 60) return { name: 'Master', color: '#a855f7', icon: '⚔️' };
    if (powerLevel >= 40) return { name: 'Warrior', color: '#06b6d4', icon: '🛡️' };
    if (powerLevel >= 20) return { name: 'Apprentice', color: '#10b981', icon: '🔰' };
    return { name: 'Novice', color: '#64748b', icon: '⭐' };
  };
  
  const rank = getRank();
  
  // Get aura config based on power
  const getAuraConfig = (): AuraConfig => {
    if (powerLevel >= 80) return { color: '#fbbf24', intensity: 1, particles: 8 };
    if (powerLevel >= 60) return { color: '#a855f7', intensity: 0.8, particles: 6 };
    if (powerLevel >= 40) return { color: '#06b6d4', intensity: 0.6, particles: 4 };
    if (powerLevel >= 20) return { color: '#10b981', intensity: 0.4, particles: 3 };
    return { color: '#64748b', intensity: 0.2, particles: 2 };
  };
  
  const aura = getAuraConfig();

  return (
    <div className="relative w-full max-w-sm mx-auto pb-6">
      {/* Outer Glow Rings */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${aura.color}20 0%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Rotating Aura Particles */}
      {Array.from({ length: aura.particles }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: aura.color,
            boxShadow: `0 0 10px ${aura.color}`,
            top: '50%',
            left: '50%',
          }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <motion.div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: aura.color,
              transform: `translateX(${60 + powerLevel * 0.5}px)`,
            }}
          />
        </motion.div>
      ))}

      {/* Main Avatar Container */}
      <motion.div
        className="relative z-10 aspect-square rounded-full p-1"
        style={{
          background: `linear-gradient(135deg, ${aura.color}40, transparent)`,
        }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {/* Avatar Circle */}
        <div className="w-full h-full rounded-full glass-card flex flex-col items-center justify-center relative overflow-hidden">
          {/* Background Pattern */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${aura.color}, transparent 50%)`,
            }}
          />
          
          {/* Rank Icon */}
          <motion.div
            className="text-6xl mb-2"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {rank.icon}
          </motion.div>
          
          {/* Rank Name */}
          <span 
            className="text-sm font-bold uppercase tracking-widest"
            style={{ color: rank.color }}
          >
            {rank.name}
          </span>
          
          {/* Power Level */}
          <div className="mt-2 text-center">
            <span className="text-xs text-text-muted">Power Level</span>
            <div className="text-2xl font-mono font-bold text-text-primary">
              {powerLevel}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Ring */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
        {Object.entries(player?.pillars || {}).slice(0, 3).map(([key, pillar], i) => {
          const colors: Record<string, string> = {
            craft: '#06b6d4',
            vessel: '#ec4899',
            tongue: '#8b5cf6',
            principle: '#a855f7',
            capital: '#10b981',
          };
          return (
            <motion.div
              key={key}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="w-9 h-9 rounded-full glass-card flex items-center justify-center text-sm font-bold border leading-none"
              style={{ 
                borderColor: colors[key],
                color: colors[key],
              }}
              title={key}
            >
              <span className="mt-0.5">{pillar.level}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// Compact version for sidebar/header
export function CharacterAvatarCompact() {
  const { state } = useGame();
  const { player } = state;
  
  const totalLevel = Object.values(player?.pillars || {}).reduce((sum, p) => sum + (p.level || 0), 0);
  const powerLevel = Math.min(100, totalLevel * 2);
  
  const getRankIcon = () => {
    if (powerLevel >= 80) return '👑';
    if (powerLevel >= 60) return '⚔️';
    if (powerLevel >= 40) return '🛡️';
    if (powerLevel >= 20) return '🔰';
    return '⭐';
  };

  return (
    <motion.div
      className="flex items-center gap-3 p-3 glass-card rounded-xl cursor-pointer hover:border-accent-purple/30 transition-colors"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative">
        <span className="text-2xl">{getRankIcon()}</span>
        <div className="absolute inset-0 blur-md bg-accent-purple/50 rounded-full -z-10" />
      </div>
      <div>
        <div className="text-sm font-semibold text-text-primary">Level {Math.floor(powerLevel / 10)}</div>
        <div className="text-xs text-text-muted font-mono">Power: {powerLevel}</div>
      </div>
    </motion.div>
  );
}
