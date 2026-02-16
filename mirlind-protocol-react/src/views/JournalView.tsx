import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EMOJIS } from '../utils/emojis';
import { logger } from '../utils/logger';
import { useGame } from '../store/useGame';

// ============================================================================
// Types
// ============================================================================

interface JournalSection {
  id: 'morning' | 'progress' | 'evening';
  title: string;
  emoji: string;
  color: string;
  description: string;
  timeRange: string;
}

interface JournalPrompt {
  id: string;
  label: string;
  placeholder: string;
  required?: boolean;
  rows?: number;
}

interface JournalEntry {
  id: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  morning?: MorningData;
  progress?: ProgressData;
  evening?: EveningData;
  completionScore: number;
  mood?: 'great' | 'good' | 'neutral' | 'bad' | 'terrible';
}

interface MorningData {
  goal1: string;
  goal2?: string;
  goal3?: string;
  intention?: string;
  fangYuanMindset?: string;
}

interface ProgressData {
  wins?: string;
  obstacles?: string;
  adjustments?: string;
  energyLevel?: number;
  bakiIntensity?: number;
}

interface EveningData {
  gratitude1: string;
  gratitude2?: string;
  gratitude3?: string;
  completed?: string;
  learned?: string;
  tomorrow?: string;
}

// ============================================================================
// Constants
// ============================================================================

const JOURNAL_SECTIONS: JournalSection[] = [
  {
    id: 'morning',
    title: 'Morning Intentions',
    emoji: EMOJIS.SUN,
    color: '#f59e0b',
    description: 'Set your targets. Be specific. Be ambitious. Attack the day with purpose.',
    timeRange: '5AM - 12PM',
  },
  {
    id: 'progress',
    title: 'Progress Check',
    emoji: EMOJIS.ZAP,
    color: '#06b6d4',
    description: 'Track your wins, obstacles, and adjustments. Stay relentless.',
    timeRange: '12PM - 6PM',
  },
  {
    id: 'evening',
    title: 'Evening Gratitude',
    emoji: EMOJIS.MOON,
    color: '#8b5cf6',
    description: 'Reflect with gratitude. Celebrate progress. Plan tomorrow.',
    timeRange: '6PM+',
  },
];

const MORNING_PROMPTS: JournalPrompt[] = [
  {
    id: 'goal1',
    label: 'Primary Goal',
    placeholder: 'The ONE thing that MUST happen today. What is your main mission?',
    required: true,
    rows: 2,
  },
  {
    id: 'goal2',
    label: 'Secondary Goal',
    placeholder: 'Another important win that moves you closer to your gates...',
    rows: 2,
  },
  {
    id: 'goal3',
    label: 'Growth Goal',
    placeholder: 'How will you level up today? Which skill will you train?',
    rows: 2,
  },
  {
    id: 'fangYuanMindset',
    label: 'Fang Yuan Mindset',
    placeholder: 'What would Fang Yuan do? Where is the opportunity others miss? How do you turn this day to your advantage?',
    rows: 3,
  },
  {
    id: 'intention',
    label: 'Today I am...',
    placeholder: 'Complete this: Today I am unstoppable / disciplined / focused / ruthless in my pursuit...',
    rows: 2,
  },
];

const PROGRESS_PROMPTS: JournalPrompt[] = [
  {
    id: 'wins',
    label: 'Wins So Far',
    placeholder: 'What have you accomplished? Celebrate every victory, no matter how small.',
    rows: 3,
  },
  {
    id: 'obstacles',
    label: 'Obstacles Faced',
    placeholder: 'What got in your way? Be honest. Face your weaknesses.',
    rows: 2,
  },
  {
    id: 'adjustments',
    label: 'Adjustments Made',
    placeholder: 'How did you adapt? Remember: Adaptability is the key to survival.',
    rows: 2,
  },
];

const EVENING_PROMPTS: JournalPrompt[] = [
  {
    id: 'gratitude1',
    label: 'Gratitude #1',
    placeholder: 'I am grateful for... (something that pushed you forward today)',
    required: true,
    rows: 2,
  },
  {
    id: 'gratitude2',
    label: 'Gratitude #2',
    placeholder: 'I appreciate... (someone, something, or a lesson learned)',
    rows: 2,
  },
  {
    id: 'gratitude3',
    label: 'Gratitude #3',
    placeholder: 'I am thankful that... (an opportunity, a strength, a moment of clarity)',
    rows: 2,
  },
  {
    id: 'completed',
    label: 'What I Accomplished',
    placeholder: 'List your wins today. Did you move closer to your gates? Did you train like Baki?',
    rows: 3,
  },
  {
    id: 'learned',
    label: 'Lessons Learned',
    placeholder: 'What did today teach you? Every setback is a lesson. Every victory is data.',
    rows: 2,
  },
  {
    id: 'tomorrow',
    label: 'Tomorrow I Will',
    placeholder: 'One thing to focus on tomorrow. Set the intention now.',
    rows: 2,
  },
];

const MOODS = [
  { emoji: EMOJIS.FIRE, label: 'great', color: '#f59e0b', desc: 'Unstoppable' },
  { emoji: EMOJIS.SMILE, label: 'good', color: '#10b981', desc: 'On Track' },
  { emoji: EMOJIS.NEUTRAL, label: 'neutral', color: '#64748b', desc: 'Steady' },
  { emoji: EMOJIS.FROWN, label: 'bad', color: '#ef4444', desc: 'Struggling' },
  { emoji: EMOJIS.SKULL, label: 'terrible', color: '#475569', desc: 'Broken' },
];

const FANG_YUAN_QUOTES = [
  'The strong do what they can, the weak suffer what they must.',
  'In this world, only the useful are remembered. Only the strong are respected.',
  'Regret is for the weak. I take what I want.',
  'Every setback is just another opportunity to grow stronger.',
  'Emotions are tools. Use them, do not be used by them.',
  'The path to power is paved with calculated risks.',
  'Adapt or perish. There is no middle ground.',
];

const BAKI_QUOTES = [
  'The only thing that matters is becoming stronger than you were yesterday.',
  'Pain is just weakness leaving the body.',
  'Train until your heroes become rivals.',
  'The body achieves what the mind believes.',
  'Every rep is a step closer to the strongest version of yourself.',
  'Discipline is doing what needs to be done, even when you do not feel like it.',
  'Your only limit is you.',
];

// ============================================================================
// Component
// ============================================================================

export function JournalView() {
  const { showToast, trackActivity, addXP } = useGame();
  
  // Helper to get daily quote
  const getDailyQuote = useCallback(() => {
    const today = new Date().toDateString();
    const quoteIndex = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const isFangYuanDay = quoteIndex % 2 === 0;
    return {
      text: isFangYuanDay 
        ? FANG_YUAN_QUOTES[quoteIndex % FANG_YUAN_QUOTES.length]
        : BAKI_QUOTES[quoteIndex % BAKI_QUOTES.length],
      author: isFangYuanDay ? 'Fang Yuan' : 'Baki Hanma',
    };
  }, []);

  // Helper to get initial section based on time
  const getInitialSection = useCallback((): JournalSection['id'] => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'progress';
    return 'evening';
  }, []);

  // Load initial data from localStorage using lazy initialization
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem('mirlind-journal-v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.entries || [];
      }
    } catch (e) {
      logger.error('Failed to load journal:', e);
    }
    return [];
  });

  const [currentSection, setCurrentSection] = useState<JournalSection['id']>(getInitialSection);
  const [dailyQuote] = useState<{ text: string; author: string }>(getDailyQuote);
  const [isSaving, setIsSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Initialize form data from today's entry using lazy initialization
  const [formData, setFormData] = useState<Partial<JournalEntry>>(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayEntry = entries.find(e => e.date === today);
    return todayEntry || {};
  });

  const [selectedMood, setSelectedMood] = useState<JournalEntry['mood']>(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayEntry = entries.find(e => e.date === today);
    return todayEntry?.mood || 'neutral';
  });

  const [energyLevel, setEnergyLevel] = useState<number>(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayEntry = entries.find(e => e.date === today);
    return todayEntry?.progress?.energyLevel || 3;
  });

  const [bakiIntensity, setBakiIntensity] = useState<number>(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayEntry = entries.find(e => e.date === today);
    return todayEntry?.progress?.bakiIntensity || 3;
  });

  // Auto-save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(formData).length > 0) {
        localStorage.setItem('mirlind-journal-draft', JSON.stringify({
          ...formData,
          mood: selectedMood,
          energyLevel,
          bakiIntensity,
        }));
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [formData, selectedMood, energyLevel, bakiIntensity]);

  const calculateCompletionScore = useCallback((entry: Partial<JournalEntry>): number => {
    let score = 0;
    let maxScore = 0;

    // Morning section (35%)
    if (entry.morning) {
      if (entry.morning.goal1) score += 15;
      if (entry.morning.goal2) score += 8;
      if (entry.morning.goal3) score += 7;
      if (entry.morning.fangYuanMindset) score += 5;
      maxScore += 35;
    }

    // Progress section (25%)
    if (entry.progress) {
      if (entry.progress.wins) score += 10;
      if (entry.progress.obstacles) score += 5;
      if (entry.progress.adjustments) score += 5;
      if (entry.progress.energyLevel) score += 5;
      maxScore += 25;
    }

    // Evening section (40%)
    if (entry.evening) {
      if (entry.evening.gratitude1) score += 15;
      if (entry.evening.gratitude2) score += 8;
      if (entry.evening.gratitude3) score += 7;
      if (entry.evening.completed) score += 10;
      maxScore += 40;
    }

    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  }, []);

  const handleInputChange = (section: keyof JournalEntry, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as object || {}),
        [field]: value,
      },
    }));
  };

  const saveSection = async (sectionId: JournalSection['id']) => {
    setIsSaving(true);
    
    const today = new Date().toISOString().split('T')[0];
    const existingIndex = entries.findIndex(e => e.date === today);
    
    const sectionData = formData[sectionId];
    const isValid = sectionId === 'morning' 
      ? (sectionData as MorningData)?.goal1?.trim()
      : sectionId === 'evening'
      ? (sectionData as EveningData)?.gratitude1?.trim()
      : true;

    if (!isValid && sectionId !== 'progress') {
      showToast('Please fill in the required fields', 'warning', 3000);
      setIsSaving(false);
      return;
    }

    const newEntry: JournalEntry = {
      id: existingIndex >= 0 ? entries[existingIndex].id : Date.now().toString(),
      date: today,
      createdAt: existingIndex >= 0 ? entries[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      morning: formData.morning as MorningData,
      progress: { ...formData.progress as ProgressData, energyLevel, bakiIntensity },
      evening: formData.evening as EveningData,
      mood: selectedMood,
      completionScore: 0,
    };

    newEntry.completionScore = calculateCompletionScore(newEntry);

    const updatedEntries = existingIndex >= 0 
      ? entries.map((e, i) => i === existingIndex ? newEntry : e)
      : [newEntry, ...entries];

    setEntries(updatedEntries);
    localStorage.setItem('mirlind-journal-v2', JSON.stringify({ entries: updatedEntries }));
    
    // Track activity and award XP
    await trackActivity('journalEntries', 1);
    await addXP(25, 'emotionalControl');

    // Show success message
    const score = newEntry.completionScore;
    if (score >= 90) {
      showToast(`Perfect entry! ${score}% complete! +25 XP`, 'success', 3000);
    } else if (score >= 70) {
      showToast(`Great progress! ${score}% complete +25 XP`, 'success', 2000);
    } else {
      showToast(`Section saved! ${score}% complete +25 XP`, 'success', 2000);
    }

    setIsSaving(false);
  };

  const getSectionStatus = (sectionId: JournalSection['id']) => {
    const today = new Date().toISOString().split('T')[0];
    const todayEntry = entries.find(e => e.date === today);
    const hasData = formData[sectionId] && Object.values(formData[sectionId]!).some(v => v && String(v).trim());
    const isSaved = todayEntry?.[sectionId];
    
    if (isSaved) return 'completed';
    if (hasData) return 'in-progress';
    return 'pending';
  };

  const getPromptsForSection = (sectionId: JournalSection['id']) => {
    switch (sectionId) {
      case 'morning': return MORNING_PROMPTS;
      case 'progress': return PROGRESS_PROMPTS;
      case 'evening': return EVENING_PROMPTS;
      default: return [];
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  const stats = {
    total: entries.length,
    streak: calculateStreak(entries),
    avgScore: entries.length > 0 
      ? Math.round(entries.reduce((sum, e) => sum + (e.completionScore || 0), 0) / entries.length)
      : 0,
    todayScore: entries.find(e => e.date === new Date().toISOString().split('T')[0])?.completionScore || 0,
  };

  return (
    <div className="max-w-5xl mx-auto animate-slide-up pb-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{EMOJIS.JOURNAL}</span>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Goal Achievement Journal</h2>
            <p className="text-text-secondary text-sm">Where goals meet gratitude in 3 daily steps</p>
          </div>
        </div>
      </div>

      {/* Daily Quote Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-5 rounded-2xl bg-linear-to-r from-accent-purple/20 via-accent-cyan/10 to-accent-purple/20 border border-accent-purple/30"
      >
        <div className="flex items-start gap-4">
          <span className="text-4xl">{dailyQuote.author === 'Fang Yuan' ? '🧠' : '💪'}</span>
          <div className="flex-1">
            <p className="text-text-primary italic text-lg leading-relaxed mb-2">
              &quot;{dailyQuote.text}&quot;
            </p>
            <p className="text-text-secondary text-sm font-medium">
              — {dailyQuote.author}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Entries', value: stats.total, color: '#8b5cf6', icon: EMOJIS.BOOK },
          { label: 'Streak', value: stats.streak, color: '#f59e0b', icon: EMOJIS.FIRE },
          { label: 'Avg Score', value: `${stats.avgScore}%`, color: '#06b6d4', icon: EMOJIS.CHART },
          { label: 'Today', value: `${stats.todayScore}%`, color: '#10b981', icon: EMOJIS.TARGET },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-bg-card border border-border rounded-xl p-4 text-center"
          >
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-text-muted text-xs">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {JOURNAL_SECTIONS.map((section, index) => {
          const status = getSectionStatus(section.id);
          const isActive = currentSection === section.id;
          
          return (
            <motion.button
              key={section.id}
              onClick={() => setCurrentSection(section.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                flex-1 min-w-35 p-4 rounded-xl border-2 transition-all text-left relative overflow-hidden
                ${isActive ? 'border-opacity-100' : 'border-transparent hover:border-border'}
                ${status === 'completed' ? 'bg-green-500/10' : 'bg-bg-card'}
              `}
              style={{ 
                borderColor: isActive ? section.color : undefined,
                background: isActive ? `${section.color}15` : undefined 
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{section.emoji}</span>
                <span 
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ background: `${section.color}30`, color: section.color }}
                >
                  Step {index + 1}
                </span>
                {status === 'completed' && <span className="text-green-500">{EMOJIS.CHECK}</span>}
              </div>
              <div className="font-semibold text-text-primary text-sm">{section.title}</div>
              <div className="text-text-muted text-xs mt-0.5">{section.timeRange}</div>
              
              {status === 'in-progress' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-accent-yellow to-transparent" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Mood Selector */}
      <div className="bg-bg-card border border-border rounded-xl p-4 mb-6">
        <label className="block text-sm font-medium text-text-secondary mb-3">
          How are you feeling right now?
        </label>
        <div className="flex gap-2 flex-wrap">
          {MOODS.map(mood => (
            <motion.button
              key={mood.label}
              onClick={() => setSelectedMood(mood.label as JournalEntry['mood'])}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all
                ${selectedMood === mood.label ? 'border-opacity-100' : 'border-transparent bg-black/30 hover:bg-white/5'}
              `}
              style={{
                borderColor: selectedMood === mood.label ? mood.color : undefined,
                background: selectedMood === mood.label ? `${mood.color}20` : undefined,
              }}
            >
              <span className="text-xl">{mood.emoji}</span>
              <div className="text-left">
                <div className="text-sm font-medium capitalize" style={{ color: mood.color }}>
                  {mood.label}
                </div>
                <div className="text-xs text-text-muted">{mood.desc}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Journal Form */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSection}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="bg-bg-card border border-border rounded-2xl overflow-hidden"
        >
          {/* Section Header */}
          <div 
            className="px-6 py-4 border-b border-border"
            style={{ background: `linear-gradient(90deg, ${JOURNAL_SECTIONS.find(s => s.id === currentSection)?.color}15, transparent)` }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {JOURNAL_SECTIONS.find(s => s.id === currentSection)?.emoji}
              </span>
              <div>
                <h3 className="font-bold text-text-primary">
                  {JOURNAL_SECTIONS.find(s => s.id === currentSection)?.title}
                </h3>
                <p className="text-text-secondary text-sm">
                  {JOURNAL_SECTIONS.find(s => s.id === currentSection)?.description}
                </p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-5">
            {getPromptsForSection(currentSection).map((prompt, index) => (
              <motion.div
                key={prompt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {prompt.label}
                  {prompt.required && <span className="text-accent-red ml-1">*</span>}
                </label>
                <textarea
                  value={(formData[currentSection] as Record<string, string> | undefined)?.[prompt.id] || ''}
                  onChange={(e) => handleInputChange(currentSection, prompt.id, e.target.value)}
                  placeholder={prompt.placeholder}
                  rows={prompt.rows || 2}
                  className="w-full px-4 py-3 bg-black/30 border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:border-accent-purple focus:outline-none resize-none transition-all hover:border-border-hover"
                />
              </motion.div>
            ))}

            {/* Special Rating Inputs for Progress Section */}
            {currentSection === 'progress' && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-4 border-t border-border"
                >
                  <label className="block text-sm font-medium text-text-secondary mb-3">
                    {EMOJIS.ZAP} Energy Level (1-5)
                  </label>
                  <div className="flex gap-3">
                    {[1, 2, 3, 4, 5].map(level => (
                      <motion.button
                        key={level}
                        onClick={() => setEnergyLevel(level)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className={`
                          w-12 h-12 rounded-xl border-2 font-bold text-lg transition-all
                          ${energyLevel === level 
                            ? 'border-accent-cyan bg-accent-cyan/20 text-accent-cyan' 
                            : 'border-border bg-black/30 text-text-muted hover:border-accent-cyan/50'}
                        `}
                      >
                        {level}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <label className="block text-sm font-medium text-text-secondary mb-3">
                    {EMOJIS.FIRE} Baki Intensity (How hard did you train?)
                  </label>
                  <div className="flex gap-3">
                    {[1, 2, 3, 4, 5].map(level => (
                      <motion.button
                        key={level}
                        onClick={() => setBakiIntensity(level)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className={`
                          w-12 h-12 rounded-xl border-2 font-bold text-lg transition-all
                          ${bakiIntensity === level 
                            ? 'border-accent-pink bg-accent-pink/20 text-accent-pink' 
                            : 'border-border bg-black/30 text-text-muted hover:border-accent-pink/50'}
                        `}
                      >
                        {level === 5 ? '💀' : level}
                      </motion.button>
                    ))}
                  </div>
                  <p className="text-text-muted text-xs mt-2">
                    Level 5 = &quot;I trained so hard I questioned my existence&quot; (Baki level)
                  </p>
                </motion.div>
              </>
            )}
          </div>

          {/* Save Button */}
          <div className="px-6 py-4 bg-black/20 border-t border-border flex justify-between items-center">
            <div className="text-text-muted text-sm">
              {getSectionStatus(currentSection) === 'completed' ? (
                <span className="text-green-500 flex items-center gap-1">
                  {EMOJIS.CHECK} Saved
                </span>
              ) : (
                'Draft auto-saves'
              )}
            </div>
            <motion.button
              onClick={() => saveSection(currentSection)}
              disabled={isSaving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2.5 bg-accent-purple hover:bg-accent-purple/80 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Saving...
                </>
              ) : (
                <>
                  {EMOJIS.SAVE} Save {currentSection === 'morning' ? 'Intentions' : currentSection === 'progress' ? 'Progress' : 'Reflection'}
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* History Toggle */}
      <div className="mt-8">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <span>{showHistory ? '✕' : EMOJIS.BOOK}</span>
          <span className="font-medium">
            {showHistory ? 'Hide History' : `View Past Entries (${entries.length})`}
          </span>
        </button>

        {/* Past Entries */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-3"
            >
              {entries.slice(0, 10).map((entry, index) => {
                const mood = MOODS.find(m => m.label === entry.mood);
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-border-hover transition-colors cursor-pointer"
                  >
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold"
                      style={{ 
                        background: entry.completionScore >= 80 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                        color: entry.completionScore >= 80 ? '#10b981' : '#8b5cf6',
                      }}
                    >
                      {entry.completionScore}%
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-text-primary">{formatDate(entry.date)}</span>
                        <span className="text-lg">{mood?.emoji}</span>
                      </div>
                      <div className="flex gap-2 mt-1">
                        {entry.morning && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-accent-yellow/20 text-accent-yellow">
                            Morning
                          </span>
                        )}
                        {entry.progress && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-accent-cyan/20 text-accent-cyan">
                            Progress
                          </span>
                        )}
                        {entry.evening && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-accent-purple/20 text-accent-purple">
                            Evening
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-text-muted">→</div>
                  </motion.div>
                );
              })}
              
              {entries.length === 0 && (
                <div className="text-center py-8 text-text-secondary">
                  <div className="text-4xl mb-2">{EMOJIS.JOURNAL}</div>
                  <p>No entries yet. Start your journey today!</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Helper function to calculate streak
function calculateStreak(entries: JournalEntry[]): number {
  if (entries.length === 0) return 0;

  const sorted = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let streak = 0;
  const checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);

  for (const entry of sorted) {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((checkDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1 && entry.completionScore >= 50) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (diffDays > 1) {
      break;
    }
  }

  return streak;
}
