import { motion } from 'framer-motion';
import { EMOJIS } from '../../utils/emojis';
import { ProtocolHeatmap } from '../../components/ProtocolHeatmap';
import type { DailyProtocolTabProps, ProtocolTaskProps } from './types';

export function DailyProtocolTab({
  protocol,
  toggleTask,
  updateCodingHours,
  getCompletionPercentage,
  protocolHistory,
}: DailyProtocolTabProps) {
  const getFangYuanQuote = () => {
    const quotes = [
      "Strength is the only virtue that matters.",
      "Detach from emotion, attach to results.",
      "Never depend on luck, only on preparation.",
      "Sacrifice the present for the future.",
      "Be ruthless with yourself, be calculating with others.",
      "There are no shortcuts, only discipline.",
      "The strong do what they can, the weak suffer what they must.",
    ];
    return quotes[new Date().getDay() % quotes.length];
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Progress Bar */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-text-secondary">Daily Progress</span>
          <span className="text-text-primary font-bold">{Math.round(getCompletionPercentage())}%</span>
        </div>
        <div className="h-3 bg-black/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-linear-to-r from-accent-purple via-accent-cyan to-accent-green rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${getCompletionPercentage()}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-3">
        <ProtocolTask
          icon={EMOJIS.SUN}
          title="05:00 - WAKE"
          subtitle="Alarm 04:55, no snooze. Today begins."
          completed={protocol.wake05}
          onToggle={() => toggleTask('wake05')}
          time="05:00"
        />

        <ProtocolTask
          icon={EMOJIS.FLAG}
          title="GERMAN STUDY"
          subtitle="Anki 50 cards + Language Transfer 1 lesson"
          completed={protocol.germanStudy}
          onToggle={() => toggleTask('germanStudy')}
          time="05:00-06:00"
        />

        <ProtocolTask
          icon={EMOJIS.VESSEL}
          title="GYM WORKOUT"
          subtitle="Baki Protocol. Every set is combat."
          completed={protocol.gymWorkout}
          onToggle={() => toggleTask('gymWorkout')}
          time="17:30-18:30"
        />

        {/* Coding Task */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`glass-card rounded-2xl p-4 border-l-4 transition-all ${
            protocol.codingHours >= 2 ? 'border-accent-green bg-accent-green/5' : 'border-accent-purple'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">{EMOJIS.CODE}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-bold text-text-primary">CODE DEEP WORK</h4>
                <span className="text-xs text-text-muted">19:30-21:30</span>
              </div>
              <p className="text-sm text-text-secondary">Weapon sharpening time. No distractions.</p>

              <div className="flex items-center gap-4 mt-3">
                <span className="text-sm text-text-secondary">Hours:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateCodingHours(protocol.codingHours - 0.5)}
                    className="w-8 h-8 rounded-lg bg-bg-secondary hover:bg-bg-hover text-text-primary"
                  >
                    -
                  </button>
                  <span className={`text-xl font-bold w-16 text-center ${
                    protocol.codingHours >= 2 ? 'text-accent-green' : 'text-text-primary'
                  }`}>
                    {protocol.codingHours}
                  </span>
                  <button
                    onClick={() => updateCodingHours(protocol.codingHours + 0.5)}
                    className="w-8 h-8 rounded-lg bg-bg-secondary hover:bg-bg-hover text-text-primary"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-text-muted">Target: 2h</span>
              </div>
            </div>
            {protocol.codingHours >= 2 && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-3xl">
                {EMOJIS.CHECK}
              </motion.div>
            )}
          </div>
        </motion.div>

        <ProtocolTask
          icon={EMOJIS.MOON}
          title="22:00 - HARD SLEEP"
          subtitle="Phone in kitchen. Recovery is training."
          completed={protocol.sleep22}
          onToggle={() => toggleTask('sleep22')}
          time="22:00"
        />
      </div>

      {/* Quote */}
      <div className="glass-card rounded-2xl p-6 border border-accent-purple/30 bg-accent-purple/5">
        <div className="text-center">
          <div className="text-2xl mb-2">{EMOJIS.SCROLL}</div>
          <p className="text-lg italic text-text-primary font-medium">&ldquo;{getFangYuanQuote()}&rdquo;</p>
          <p className="text-sm text-text-muted mt-2">— Fang Yuan</p>
        </div>
      </div>

      {/* Notes */}
      <div className="glass-card rounded-2xl p-4">
        <h4 className="text-sm font-semibold text-text-secondary mb-2">Daily Notes</h4>
        <textarea
          value={protocol.notes}
          onChange={() => {}}
          placeholder="What weakness did you attack today?"
          className="w-full h-24 bg-bg-secondary/50 rounded-lg p-3 text-text-primary placeholder-text-muted resize-none focus:border-accent-purple focus:outline-none border border-transparent"
        />
      </div>

      {/* Protocol Heatmap */}
      <ProtocolHeatmap data={protocolHistory} />
    </motion.div>
  );
}

function ProtocolTask({ icon, title, subtitle, completed, onToggle, time }: ProtocolTaskProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onToggle}
      className={`glass-card rounded-2xl p-4 cursor-pointer border-l-4 transition-all hover:bg-bg-hover ${
        completed ? 'border-accent-green bg-accent-green/5' : 'border-accent-purple'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="text-4xl">{icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${completed ? 'text-accent-green' : 'text-text-primary'}`}>
              {title}
            </span>
            <span className="text-xs text-text-muted">{time}</span>
          </div>
          <p className="text-sm text-text-secondary">{subtitle}</p>
        </div>
        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
          completed ? 'bg-accent-green border-accent-green' : 'border-text-muted'
        }`}>
          {completed && <span className="text-black text-lg">✓</span>}
        </div>
      </div>
    </motion.div>
  );
}
