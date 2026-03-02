import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { EMOJIS } from '../utils/emojis';
import { useGame } from '../store/useGame';

import { fireConfetti } from '../utils/confetti';
import { logger } from '../utils/logger';

// Focus modes with different settings
interface FocusMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  defaultDuration: number;
  binauralFreq: { left: number; right: number };
  ambientType: 'study' | 'work' | 'workout' | 'creative' | 'meditate';
}

const FOCUS_MODES: FocusMode[] = [
  {
    id: 'study',
    name: 'Deep Study',
    description: '40Hz gamma waves for learning & memory',
    icon: '📚',
    color: '#7c3aed',  // Darker purple for WCAG AA button contrast
    defaultDuration: 45,
    binauralFreq: { left: 200, right: 240 }, // 40Hz gamma
    ambientType: 'study',
  },
  {
    id: 'work',
    name: 'Flow Work',
    description: 'Alpha waves for productivity & focus',
    icon: '💻',
    color: '#155e75',  // Darker cyan for WCAG AA button contrast
    defaultDuration: 52,
    binauralFreq: { left: 200, right: 210 }, // 10Hz alpha
    ambientType: 'work',
  },
  {
    id: 'workout',
    name: 'Beast Mode',
    description: 'Beta waves for energy & motivation',
    icon: '💪',
    color: '#dc2626',  // Darker red for WCAG AA button contrast
    defaultDuration: 30,
    binauralFreq: { left: 200, right: 220 }, // 20Hz beta
    ambientType: 'workout',
  },
  {
    id: 'creative',
    name: 'Creative Flow',
    description: 'Theta waves for creativity & insight',
    icon: '✨',
    color: '#d97706',  // Darker amber for WCAG AA button contrast
    defaultDuration: 60,
    binauralFreq: { left: 200, right: 206 }, // 6Hz theta
    ambientType: 'creative',
  },
  {
    id: 'meditate',
    name: 'Mindfulness',
    description: 'Delta waves for deep relaxation',
    icon: '🧘',
    color: '#059669',  // Darker emerald for WCAG AA button contrast
    defaultDuration: 20,
    binauralFreq: { left: 200, right: 202 }, // 2Hz delta
    ambientType: 'meditate',
  },
];

// Audio Context for binaural beats
class BinauralAudio {
  private ctx: AudioContext | null = null;
  private leftOsc: OscillatorNode | null = null;
  private rightOsc: OscillatorNode | null = null;
  private leftGain: GainNode | null = null;
  private rightGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
  }

  play(leftFreq: number, rightFreq: number, volume: number = 0.1) {
    this.init();
    if (!this.ctx) return;

    this.stop();

    // Master gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = volume;
    this.masterGain.connect(this.ctx.destination);

    // Left channel (ear)
    this.leftOsc = this.ctx.createOscillator();
    this.leftGain = this.ctx.createGain();
    this.leftOsc.frequency.value = leftFreq;
    this.leftOsc.type = 'sine';
    this.leftGain.gain.value = 0.5;
    
    // Stereo panner for left
    const leftPanner = this.ctx.createStereoPanner();
    leftPanner.pan.value = -1;
    
    this.leftOsc.connect(this.leftGain);
    this.leftGain.connect(leftPanner);
    leftPanner.connect(this.masterGain);

    // Right channel (ear)
    this.rightOsc = this.ctx.createOscillator();
    this.rightGain = this.ctx.createGain();
    this.rightOsc.frequency.value = rightFreq;
    this.rightOsc.type = 'sine';
    this.rightGain.gain.value = 0.5;
    
    // Stereo panner for right
    const rightPanner = this.ctx.createStereoPanner();
    rightPanner.pan.value = 1;
    
    this.rightOsc.connect(this.rightGain);
    this.rightGain.connect(rightPanner);
    rightPanner.connect(this.masterGain);

    // Start oscillators
    this.leftOsc.start();
    this.rightOsc.start();
    this.isPlaying = true;

    // Fade in
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 2);
    }
  }

  stop() {
    if (!this.ctx) return;

    // Resume context if suspended (browser policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.masterGain) {
      // Fade out quickly
      const currentTime = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(currentTime);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, currentTime);
      this.masterGain.gain.linearRampToValueAtTime(0, currentTime + 0.1);
    }

    // Stop oscillators immediately for responsiveness
    if (this.leftOsc) {
      try {
        this.leftOsc.stop();
      } catch {
        // Already stopped
      }
      this.leftOsc.disconnect();
      this.leftOsc = null;
    }
    if (this.rightOsc) {
      try {
        this.rightOsc.stop();
      } catch {
        // Already stopped
      }
      this.rightOsc.disconnect();
      this.rightOsc = null;
    }
    
    this.leftGain = null;
    this.rightGain = null;
    this.masterGain = null;
    this.isPlaying = false;
  }

  setVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.1);
    }
  }

  isActive() {
    return this.isPlaying;
  }
}

const binauralAudio = new BinauralAudio();

export function FocusView() {
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedMode, setSelectedMode] = useState<FocusMode>(FOCUS_MODES[0]);
  const [volume, setVolume] = useState(0.1);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [sessionCount, setSessionCount] = useState(0);
  const [showBreathing, setShowBreathing] = useState(false);
  const [customDuration, setCustomDuration] = useState<number | null>(null);
  
  const { showToast, trackActivity, addXP } = useGame();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const completionInFlightRef = useRef(false);
  const volumeRef = useRef(volume);
  const totalTime = useRef(customDuration ? customDuration * 60 : selectedMode.defaultDuration * 60);

  const getSessionSeconds = useCallback(() => {
    return (customDuration ?? selectedMode.defaultDuration) * 60;
  }, [customDuration, selectedMode.defaultDuration]);

  // Complete session callback - defined before timer effect
  const completeSession = useCallback(async () => {
    if (completionInFlightRef.current) return;
    completionInFlightRef.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRunning(false);
    endTimeRef.current = null;
    binauralAudio.stop();
    
    const minutes = Math.floor(totalTime.current / 60);

    let trackingFailed = false;
    try {
      // Award XP and track
      await addXP(minutes * 2, 'principle');
      await trackActivity('focusSessions', 1);
      await trackActivity('focusMinutes', minutes);
    } catch (error) {
      trackingFailed = true;
      logger.error('Focus session completion tracking failed:', error);
    }

    setSessionCount(prev => prev + 1);

    // Celebration
    fireConfetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: [selectedMode.color, '#ffffff'],
    });

    if (trackingFailed) {
      showToast(
        `${selectedMode.name} complete. Progress sync failed, try again.`,
        'warning',
        4000
      );
    } else {
      showToast(
        `🎯 ${selectedMode.name} complete! +${minutes * 2} XP`,
        'success',
        4000
      );
    }

    // Reset timer
    const resetSeconds = getSessionSeconds();
    totalTime.current = resetSeconds;
    setTimeLeft(resetSeconds);
    completionInFlightRef.current = false;
  }, [addXP, trackActivity, showToast, selectedMode, getSessionSeconds]);

  // Update total time when mode or custom duration changes (only when not running)
  useEffect(() => {
    if (!isRunning) {
      totalTime.current = getSessionSeconds();
      setTimeLeft(totalTime.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMode, customDuration, getSessionSeconds]); // Intentionally NOT including isRunning to prevent reset on pause

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      if (endTimeRef.current === null) {
        endTimeRef.current = Date.now() + (totalTime.current * 1000);
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      const tick = () => {
        if (endTimeRef.current === null) return;

        const remainingMs = endTimeRef.current - Date.now();
        const nextTimeLeft = Math.max(0, Math.ceil(remainingMs / 1000));

        setTimeLeft(prev => (prev === nextTimeLeft ? prev : nextTimeLeft));

        if (remainingMs <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          completeSession();
        }
      };

      // Immediate tick avoids visual lag after start/resume.
      tick();
      timerRef.current = setInterval(tick, 250);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [isRunning, completeSession]);

  // Audio control
  useEffect(() => {
    if (isRunning && audioEnabled) {
      binauralAudio.play(
        selectedMode.binauralFreq.left,
        selectedMode.binauralFreq.right,
        volumeRef.current
      );
    } else {
      binauralAudio.stop();
    }

    return () => {
      binauralAudio.stop();
    };
  }, [isRunning, audioEnabled, selectedMode]);

  useEffect(() => {
    volumeRef.current = volume;
    if (binauralAudio.isActive()) {
      binauralAudio.setVolume(volume);
    }
  }, [volume]);

  const toggleTimer = useCallback(() => {
    if (isRunning) {
      if (endTimeRef.current !== null) {
        const remainingSeconds = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
        setTimeLeft(remainingSeconds);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Just pause - audio useEffect will handle stopping
      setIsRunning(false);
      endTimeRef.current = null;
    } else {
      const sessionSeconds = timeLeft > 0 ? timeLeft : getSessionSeconds();

      if (timeLeft <= 0) {
        setTimeLeft(sessionSeconds);
      }

      try {
        // Initialize audio context on user interaction (required by browsers)
        binauralAudio.init();
        endTimeRef.current = Date.now() + (sessionSeconds * 1000);
        setIsRunning(true);
      } catch (error) {
        logger.error('Audio init failed:', error);
        // Start timer anyway even if audio fails
        endTimeRef.current = Date.now() + (sessionSeconds * 1000);
        setIsRunning(true);
      }
    }
  }, [isRunning, timeLeft, getSessionSeconds]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRunning(false);
    endTimeRef.current = null;
    completionInFlightRef.current = false;
    binauralAudio.stop();

    const resetSeconds = getSessionSeconds();
    totalTime.current = resetSeconds;
    setTimeLeft(resetSeconds);
  }, [getSessionSeconds]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = ((totalTime.current - timeLeft) / totalTime.current) * 100;

  return (
    <div className="max-w-5xl mx-auto animate-slide-up pb-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary mb-2 neon-text">
          {EMOJIS.FOCUS} NeuroFocus
        </h2>
        <p className="text-text-secondary">
          Binaural beats enhanced timer for peak cognitive performance
        </p>
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {FOCUS_MODES.map((mode) => (
          <motion.button
            key={mode.id}
            onClick={() => !isRunning && setSelectedMode(mode)}
            whileHover={{ scale: isRunning ? 1 : 1.02 }}
            whileTap={{ scale: isRunning ? 1 : 0.98 }}
            className={`
              p-4 rounded-2xl border-2 transition-all text-left
              ${selectedMode.id === mode.id
                ? 'glass-card'
                : 'bg-black/20 border-transparent hover:border-white/10'
            }
              ${isRunning && selectedMode.id !== mode.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            style={{
              borderColor: selectedMode.id === mode.id ? mode.color : undefined,
              boxShadow: selectedMode.id === mode.id ? `0 0 30px ${mode.color}20` : undefined,
            }}
          >
            <div className="text-3xl mb-2">{mode.icon}</div>
            <div className="text-sm font-semibold text-text-primary">{mode.name}</div>
            <div className="text-xs text-text-muted">{mode.defaultDuration} min</div>
          </motion.button>
        ))}
      </div>

      {/* Main Timer Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Timer */}
        <div className="lg:col-span-2">
          <div
            className="glass-card neon-panel rounded-3xl p-8 text-center relative overflow-hidden"
            style={{ minHeight: '400px' }}
          >
            {/* Background glow */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                background: `radial-gradient(circle at center, ${selectedMode.color}, transparent 70%)`,
              }}
            />

            {/* Breathing Circle Animation */}
            {showBreathing && isRunning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  className="rounded-full border-2"
                  style={{ borderColor: selectedMode.color }}
                  animate={{
                    width: [200, 280, 200],
                    height: [200, 280, 200],
                    opacity: [0.3, 0.1, 0.3],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </div>
            )}

            {/* Mode Info */}
            <div className="relative z-10 mb-8">
              <div className="text-4xl mb-2">{selectedMode.icon}</div>
              <h3 className="text-xl font-bold text-text-primary">{selectedMode.name}</h3>
              <p className="text-sm text-text-muted">{selectedMode.description}</p>
            </div>

            {/* Timer Display */}
            <div className="relative z-10 mb-8">
              <motion.div
                className="text-8xl font-bold font-mono tracking-wider"
                style={{ color: selectedMode.color }}
                animate={isRunning ? { scale: [1, 1.02, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {formatTime(timeLeft)}
              </motion.div>
              
              {/* Progress bar */}
              <div className="mt-6 h-2 bg-black/40 rounded-full overflow-hidden max-w-md mx-auto">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: selectedMode.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="relative z-10 flex items-center justify-center gap-4">
              <motion.button
                onClick={toggleTimer}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-xl font-bold text-lg text-white transition-all"
                style={{ backgroundColor: selectedMode.color }}
              >
                {isRunning ? '⏸️ Pause' : '▶️ Start'}
              </motion.button>
              
              <motion.button
                onClick={resetTimer}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-4 rounded-xl font-semibold bg-white/10 hover:bg-white/20 text-text-primary transition-all"
              >
                ⏹️ Reset
              </motion.button>
            </div>

            {/* Session counter */}
            <div className="relative z-10 mt-6 text-sm text-text-muted">
              Sessions completed: <span className="font-bold text-text-primary">{sessionCount}</span>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        <div className="space-y-4">
          {/* Audio Settings */}
          <div className="glass-card neon-panel rounded-2xl p-6">
            <h4 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              🎧 Audio Settings
            </h4>
            
            {/* Enable/Disable Audio */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-text-secondary">Binaural Beats</span>
              <button
                onClick={() => {
                  setAudioEnabled(prev => !prev);
                }}
                className={`
                  px-3 py-1 rounded-full text-sm font-semibold transition-all
                  ${audioEnabled ? 'bg-accent-green-dark text-white' : 'bg-white/10 text-text-muted'}
                `}
              >
                {audioEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Volume */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-text-muted mb-2">
                <span>Volume</span>
                <span>{Math.round(volume * 100)}%</span>
              </div>
              <input
                id="focus-volume"
                name="focus_volume"
                type="range"
                min="0"
                max="0.5"
                step="0.01"
                aria-label="Volume"
                value={volume}
                onChange={(e) => {
                  const newVol = parseFloat(e.target.value);
                  setVolume(newVol);
                }}
                className="w-full h-2 bg-black/40 rounded-lg appearance-none cursor-pointer accent-accent-purple"
              />
            </div>

            {/* Breathing Guide Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Breathing Visual</span>
              <button
                onClick={() => setShowBreathing(!showBreathing)}
                className={`
                  px-3 py-1 rounded-full text-sm font-semibold transition-all
                  ${showBreathing ? 'bg-accent-cyan text-white' : 'bg-white/10 text-text-muted'}
                `}
              >
                {showBreathing ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Duration Settings */}
          <div className="glass-card neon-panel rounded-2xl p-6">
            <h4 className="text-lg font-semibold text-text-primary mb-4">
              ⏱️ Duration
            </h4>
            
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[15, 25, 45, 52, 60, 90].map((mins) => (
                <button
                  key={mins}
                  onClick={() => !isRunning && setCustomDuration(mins)}
                  disabled={isRunning}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${customDuration === mins || (!customDuration && selectedMode.defaultDuration === mins)
                      ? 'bg-accent-purple-dark text-white'
                      : 'bg-white/5 text-text-secondary hover:bg-white/10'
                    }
                    ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {mins}m
                </button>
              ))}
            </div>

            {/* Custom duration input */}
            <div className="flex items-center gap-2">
              <span className="text-text-muted text-sm">Custom:</span>
              <input
                id="focus-custom-duration"
                name="focus_custom_duration"
                type="number"
                min="1"
                max="180"
                value={customDuration || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setCustomDuration(isNaN(val) ? null : val);
                }}
                disabled={isRunning}
                placeholder="Minutes"
                className="w-20 px-3 py-2 bg-black/30 border border-border rounded-lg text-text-primary text-center focus:border-accent-purple outline-none disabled:opacity-50"
              />
              <span className="text-text-muted text-sm">min</span>
            </div>
          </div>

          {/* Mode Info */}
          <div className="glass-card neon-panel rounded-2xl p-6">
            <h4 className="text-lg font-semibold text-text-primary mb-3">
              🧠 Brain Waves
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Frequency</span>
                <span className="font-mono" style={{ color: selectedMode.color }}>
                  {Math.abs(selectedMode.binauralFreq.right - selectedMode.binauralFreq.left)} Hz
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Wave Type</span>
                <span className="text-text-primary">
                  {selectedMode.id === 'study' && 'Gamma (40Hz)'}
                  {selectedMode.id === 'work' && 'Alpha (10Hz)'}
                  {selectedMode.id === 'workout' && 'Beta (20Hz)'}
                  {selectedMode.id === 'creative' && 'Theta (6Hz)'}
                  {selectedMode.id === 'meditate' && 'Delta (2Hz)'}
                </span>
              </div>
              <p className="text-xs text-text-muted mt-2">
                Binaural beats work by playing slightly different frequencies in each ear, 
                creating a perceived beat that entrains brainwaves.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card neon-panel rounded-2xl p-6"
      >
        <h4 className="text-lg font-semibold text-text-primary mb-4">
          💡 Focus Tips
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-accent-purple">🎧</span>
            <p className="text-text-secondary">Use headphones for optimal binaural beat effect. The different frequencies need to reach each ear separately.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-accent-purple">📵</span>
            <p className="text-text-secondary">Put your phone on silent and place it face down. Eliminate all visual distractions.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-accent-purple">🪑</span>
            <p className="text-text-secondary">Sit upright with good posture. Your alertness is directly linked to your body position.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-accent-purple">🧘</span>
            <p className="text-text-secondary">If your mind wanders, gently bring it back to your breath or task. Don't judge the wandering.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
