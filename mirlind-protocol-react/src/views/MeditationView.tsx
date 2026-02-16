import { useState, useEffect, useRef } from 'react';
import { EMOJIS } from '../utils/emojis';
import { useGame } from '../store/useGame';
import { FadeIn } from '../components/animations';
import { motion, AnimatePresence } from 'framer-motion';

type BreathingPhase = 'inhale' | 'hold' | 'exhale' | 'pause';

interface Technique {
  id: string;
  name: string;
  description: string;
  pattern: { phase: BreathingPhase; duration: number }[];
  color: string;
}

const TECHNIQUES: Technique[] = [
  {
    id: 'box',
    name: 'Box Breathing',
    description: 'Inhale, hold, exhale, hold - all equal counts',
    pattern: [
      { phase: 'inhale', duration: 4 },
      { phase: 'hold', duration: 4 },
      { phase: 'exhale', duration: 4 },
      { phase: 'pause', duration: 4 },
    ],
    color: '#8b5cf6',
  },
  {
    id: 'relax',
    name: '4-7-8 Relaxation',
    description: 'Deep relaxation technique for stress relief',
    pattern: [
      { phase: 'inhale', duration: 4 },
      { phase: 'hold', duration: 7 },
      { phase: 'exhale', duration: 8 },
    ],
    color: '#06b6d4',
  },
  {
    id: 'coherence',
    name: 'Heart Coherence',
    description: 'Balance your nervous system',
    pattern: [
      { phase: 'inhale', duration: 5 },
      { phase: 'exhale', duration: 5 },
    ],
    color: '#10b981',
  },
  {
    id: 'energy',
    name: 'Energizing Breath',
    description: 'Quick, energizing pattern',
    pattern: [
      { phase: 'inhale', duration: 2 },
      { phase: 'exhale', duration: 2 },
    ],
    color: '#f59e0b',
  },
];

export function MeditationView() {
  const [selectedTechnique, setSelectedTechnique] = useState<Technique>(TECHNIQUES[0]);
  const [isActive, setIsActive] = useState(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [phaseTimeLeft, setPhaseTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { showToast, trackActivity } = useGame();

  const currentPhase = selectedTechnique.pattern[currentPhaseIndex];

  useEffect(() => {
    if (isActive && phaseTimeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setPhaseTimeLeft(t => {
          if (t <= 1) {
            // Move to next phase
            const nextIndex = (currentPhaseIndex + 1) % selectedTechnique.pattern.length;
            setCurrentPhaseIndex(nextIndex);
            return selectedTechnique.pattern[nextIndex].duration;
          }
          return t - 1;
        });
        setTotalTime(t => t + 1);
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, phaseTimeLeft, currentPhaseIndex, selectedTechnique]);

  const startSession = () => {
    setIsActive(true);
    setSessionComplete(false);
    setCurrentPhaseIndex(0);
    setPhaseTimeLeft(selectedTechnique.pattern[0].duration);
    setTotalTime(0);
  };

  const stopSession = () => {
    setIsActive(false);
    if (totalTime > 60) {
      const minutes = Math.floor(totalTime / 60);
      trackActivity('meditationMinutes', minutes);
      showToast(
        `${EMOJIS.MEDITATION} Session complete! ${minutes} minutes logged`,
        'success',
        3000
      );
      setSessionComplete(true);
    }
  };

  const getPhaseText = (phase: BreathingPhase) => {
    switch (phase) {
      case 'inhale': return 'Breathe In';
      case 'hold': return 'Hold';
      case 'exhale': return 'Breathe Out';
      case 'pause': return 'Pause';
    }
  };

  const getPhaseAnimation = (phase: BreathingPhase) => {
    switch (phase) {
      case 'inhale':
        return { scale: 1.5, opacity: 0.8 };
      case 'hold':
        return { scale: 1.5, opacity: 0.8 };
      case 'exhale':
        return { scale: 1, opacity: 0.5 };
      case 'pause':
        return { scale: 1, opacity: 0.5 };
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <FadeIn>
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            {EMOJIS.MEDITATE} Meditation
          </h2>
          <p className="text-text-secondary">Breathe. Center. Focus.</p>
        </div>
      </FadeIn>

      {/* Technique Selection */}
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {TECHNIQUES.map((technique) => (
            <motion.button
              key={technique.id}
              onClick={() => {
                if (!isActive) {
                  setSelectedTechnique(technique);
                  setSessionComplete(false);
                }
              }}
              className={`
                p-4 rounded-xl border-2 text-left transition-all
                ${selectedTechnique.id === technique.id 
                  ? 'border-accent-purple bg-accent-purple/10' 
                  : 'border-border bg-bg-card hover:border-border-hover'
                }
                ${isActive ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              whileHover={!isActive ? { scale: 1.02 } : {}}
              whileTap={!isActive ? { scale: 0.98 } : {}}
            >
              <div 
                className="w-3 h-3 rounded-full mb-2"
                style={{ backgroundColor: technique.color }}
              />
              <h3 className="font-semibold text-text-primary text-sm">{technique.name}</h3>
              <p className="text-xs text-text-secondary mt-1">{technique.description}</p>
            </motion.button>
          ))}
        </div>
      </FadeIn>

      {/* Breathing Visualization */}
      <FadeIn delay={0.2}>
        <div className="bg-bg-card border border-border rounded-3xl p-8 mb-6">
          <div className="relative h-80 flex items-center justify-center">
            {/* Animated Circle */}
            <AnimatePresence mode="wait">
              {isActive && (
                <motion.div
                  key={currentPhase?.phase || 'inhale'}
                  className="absolute rounded-full"
                  style={{
                    width: 200,
                    height: 200,
                    background: `radial-gradient(circle, ${selectedTechnique.color}40, ${selectedTechnique.color}20)`,
                    boxShadow: `0 0 60px ${selectedTechnique.color}30`,
                  }}
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={getPhaseAnimation(currentPhase?.phase || 'inhale')}
                  transition={{
                    duration: currentPhase?.duration || 4,
                    ease: currentPhase?.phase === 'inhale' ? 'easeIn' : 
                          currentPhase?.phase === 'exhale' ? 'easeOut' : 'linear',
                  }}
                />
              )}
            </AnimatePresence>

            {/* Static Circle when not active */}
            {!isActive && (
              <div 
                className="absolute rounded-full"
                style={{
                  width: 200,
                  height: 200,
                  background: `radial-gradient(circle, ${selectedTechnique.color}20, transparent)`,
                }}
              />
            )}

            {/* Center Text */}
            <div className="relative z-10 text-center">
              {isActive ? (
                <>
                  <motion.div
                    key={currentPhaseIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-2xl font-bold text-text-primary"
                  >
                    {getPhaseText(currentPhase?.phase || 'inhale')}
                  </motion.div>
                  <div className="text-4xl font-bold text-accent-purple mt-2">
                    {phaseTimeLeft}
                  </div>
                </>
              ) : sessionComplete ? (
                <div className="text-center">
                  <div className="text-4xl mb-2">{EMOJIS.CHECK}</div>
                  <div className="text-xl font-bold text-text-primary">Session Complete</div>
                  <div className="text-text-secondary">
                    {Math.floor(totalTime / 60)} minutes
                  </div>
                </div>
              ) : (
                <div className="text-text-secondary">
                  Press start to begin
                </div>
              )}
            </div>
          </div>

          {/* Progress Dots */}
          {isActive && (
            <div className="flex justify-center gap-2 mt-4">
              {selectedTechnique.pattern.map((_pattern, index) => (
                <motion.div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentPhaseIndex 
                      ? 'bg-accent-purple' 
                      : 'bg-text-muted/30'
                  }`}
                  animate={index === currentPhaseIndex ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
              ))}
            </div>
          )}

          {/* Session Timer */}
          {isActive && (
            <div className="text-center mt-4 text-text-secondary">
              Session time: {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}
            </div>
          )}
        </div>
      </FadeIn>

      {/* Controls */}
      <FadeIn delay={0.3}>
        <div className="flex justify-center gap-4">
          {!isActive ? (
            <motion.button
              onClick={startSession}
              className="px-8 py-3 bg-accent-purple hover:bg-accent-purple/80 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {EMOJIS.PLAY} Start Session
            </motion.button>
          ) : (
            <motion.button
              onClick={stopSession}
              className="px-8 py-3 bg-accent-red hover:bg-accent-red/80 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {EMOJIS.STOP} End Session
            </motion.button>
          )}
        </div>
      </FadeIn>

      {/* Instructions */}
      <FadeIn delay={0.4}>
        <div className="mt-8 bg-bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold text-text-primary mb-4">
            {EMOJIS.INFO} How to practice
          </h3>
          <ul className="space-y-2 text-text-secondary text-sm">
            <li>• Find a comfortable seated position</li>
            <li>• Close your eyes or soften your gaze</li>
            <li>• Follow the visual guide for breathing</li>
            <li>• Let thoughts pass without judgment</li>
            <li>• Start with 5-10 minutes daily</li>
          </ul>
        </div>
      </FadeIn>
    </div>
  );
}
