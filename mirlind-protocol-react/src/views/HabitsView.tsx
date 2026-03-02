import { useState } from 'react';
import { useGame } from '../store/useGame';
import type { Habit, PillarType } from '../types';
import { 
  getHabits, 
  checkInHabit, 
  isHabitCheckedInToday,
  getHabitCategoryColor,
  addCustomHabit,
  removeHabit,
} from '../data/habits';
import { EMOJIS } from '../utils/emojis';
import { FadeIn, StaggerContainer, StaggerItem, CardHover, ModalOverlay } from '../components/animations';
import { motion, AnimatePresence } from 'framer-motion';

export function HabitsView() {
  const [habits, setHabits] = useState<Habit[]>(() => getHabits());
  const [showAddModal, setShowAddModal] = useState(false);
  const { showToast, trackActivity } = useGame();

  const handleCheckIn = (habitId: string) => {
    const habit = checkInHabit(habitId);
    if (habit) {
      setHabits(getHabits());
      trackActivity('habitsCompleted', 1);
      
      const streakText = habit.streak >= 7 ? ` ${EMOJIS.FIRE} ${habit.streak} DAY STREAK!` : '';
      showToast(
        `${EMOJIS.CHECK} ${habit.name} completed! +${habit.xpReward} XP${streakText}`,
        'success',
        3000
      );
    } else {
      showToast('Already checked in today!', 'warning', 2000);
    }
  };

  const handleRemove = (habitId: string) => {
    removeHabit(habitId);
    setHabits(getHabits());
    showToast(`${EMOJIS.DELETE} Habit removed`, 'default', 2000);
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return EMOJIS.FIRE + EMOJIS.FIRE + EMOJIS.FIRE;
    if (streak >= 14) return EMOJIS.FIRE + EMOJIS.FIRE;
    if (streak >= 7) return EMOJIS.FIRE;
    return '';
  };

  const getLast7Days = () => {
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        name: dayNames[d.getDay()],
        date: d.toISOString().split('T')[0],
      });
    }
    return days;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <FadeIn>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              {EMOJIS.HABITS} Habit Tracker
            </h2>
            <p className="text-text-secondary">Build atomic habits with streaks</p>
          </div>
          <motion.button 
            className="px-4 py-2 bg-accent-purple-dark hover:bg-accent-purple-dark/80 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
            onClick={() => setShowAddModal(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {EMOJIS.PLUS} Add Custom Habit
          </motion.button>
        </div>
      </FadeIn>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {habits.map((habit, index) => {
          const isCheckedIn = isHabitCheckedInToday(habit.id);
          const color = getHabitCategoryColor(habit.category);
          const last7Days = getLast7Days();
          
          return (
            <StaggerItem key={habit.id}>
              <CardHover>
                <motion.div 
                  className="bg-bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 h-full"
                  whileHover={{ borderColor: `${color}40` }}
                >
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className="text-4xl"
                      whileHover={{ rotate: 10, scale: 1.1 }}
                    >
                      {habit.icon}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-text-primary truncate">{habit.name}</h3>
                      <p className="text-sm text-text-secondary truncate">{habit.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <motion.span 
                      className="px-3 py-1 rounded-full text-xs font-semibold border capitalize"
                      style={{ 
                        backgroundColor: `${color}20`, 
                        color: color, 
                        borderColor: `${color}40` 
                      }}
                      whileHover={{ scale: 1.05 }}
                    >
                      {habit.category}
                    </motion.span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-accent-purple/20 text-accent-purple">
                      +{habit.xpReward} XP
                    </span>
                  </div>

                  <AnimatePresence mode="wait">
                    {habit.streak > 0 && (
                      <motion.div 
                        className="min-h-6"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <span className="text-sm font-semibold text-accent-yellow">
                          {EMOJIS.FIRE} {habit.streak} day streak {getStreakEmoji(habit.streak)}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex justify-center gap-1">
                    {last7Days.map((day, i) => (
                      <motion.div 
                        key={day.date}
                        className={`
                          w-8 h-8 flex items-center justify-center rounded-md text-xs font-medium
                          ${habit.completedDays.includes(day.date) 
                            ? 'bg-linear-to-br from-accent-purple to-accent-cyan text-white' 
                            : 'bg-black/30 text-text-muted'
                          }
                        `}
                        title={day.date}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 + i * 0.02 }}
                      >
                        {day.name}
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <motion.button
                      className={`
                        flex-1 py-2.5 rounded-lg font-bold text-white transition-all
                        ${isCheckedIn 
                          ? 'bg-accent-green cursor-default' 
                          : ''
                        }
                      `}
                      onClick={() => handleCheckIn(habit.id)}
                      disabled={isCheckedIn}
                      style={!isCheckedIn ? { background: `linear-gradient(135deg, ${color}, #8b5cf6)` } : {}}
                      whileHover={!isCheckedIn ? { scale: 1.02 } : {}}
                      whileTap={!isCheckedIn ? { scale: 0.98 } : {}}
                    >
                      {isCheckedIn ? (
                        <>{EMOJIS.CHECK} Completed</>
                      ) : (
                        <>{EMOJIS.CHECK} Check In</>
                      )}
                    </motion.button>
                    
                    {habit.isCustom && (
                      <motion.button 
                        className="px-3 py-2.5 bg-accent-red/20 hover:bg-accent-red/30 border border-accent-red/30 text-accent-red rounded-lg transition-colors"
                        onClick={() => handleRemove(habit.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {EMOJIS.DELETE}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              </CardHover>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      <AddHabitModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={() => setHabits(getHabits())}
      />
    </div>
  );
}

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void;
}

function AddHabitModal({ isOpen, onClose, onAdd }: AddHabitModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PillarType | 'general'>('general');
  const [xpReward, setXpReward] = useState(25);
  const { showToast } = useGame();

  const categories = [
    { id: 'craft', name: 'Craft', color: '#06b6d4' },
    { id: 'vessel', name: 'Vessel', color: '#ec4899' },
    { id: 'tongue', name: 'Tongue', color: '#8b5cf6' },
    { id: 'principle', name: 'Principle', color: '#a855f7' },
    { id: 'capital', name: 'Capital', color: '#10b981' },
    { id: 'general', name: 'General', color: '#f59e0b' },
  ];

  const icons = [
    { emoji: EMOJIS.WAKE_UP, label: 'Wake Up' },
    { emoji: EMOJIS.COLD_SHOWER, label: 'Cold' },
    { emoji: EMOJIS.CODING, label: 'Code' },
    { emoji: EMOJIS.GYM, label: 'Gym' },
    { emoji: EMOJIS.MEDITATION, label: 'Meditate' },
    { emoji: EMOJIS.BOOK, label: 'Read' },
    { emoji: EMOJIS.JOURNAL_ICON, label: 'Journal' },
    { emoji: EMOJIS.GERMAN, label: 'Language' },
    { emoji: EMOJIS.MONEY, label: 'Finance' },
    { emoji: EMOJIS.WATER, label: 'Hydrate' },
  ];

  const [selectedIcon, setSelectedIcon] = useState(icons[0].emoji);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addCustomHabit({
      name,
      description,
      category,
      icon: selectedIcon,
      xpReward,
      targetSkill: 'timeManagement',
      frequency: 'daily',
    });

    showToast(`${EMOJIS.HABITS} New habit created!`, 'success', 2000);
    onAdd();
    onClose();
  };

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose} className="w-full max-w-md">
      <div className="bg-bg-secondary border border-border rounded-2xl p-6 w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-text-primary mb-6">{EMOJIS.PLUS} Add New Habit</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label id="habit-name-label" className="block text-sm font-semibold text-text-secondary mb-2">Name</label>
            <input 
              type="text" 
              aria-labelledby="habit-name-label"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Read 30 minutes"
              required
              className="w-full px-4 py-2.5 bg-black/30 border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:border-accent-purple focus:outline-none transition-colors"
            />
          </div>
          
          <div>
            <label id="habit-description-label" className="block text-sm font-semibold text-text-secondary mb-2">Description</label>
            <input 
              type="text" 
              aria-labelledby="habit-description-label"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description"
              className="w-full px-4 py-2.5 bg-black/30 border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:border-accent-purple focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label id="habit-category-label" className="block text-sm font-semibold text-text-secondary mb-2">Category</label>
            <select 
              aria-labelledby="habit-category-label"
              value={category} 
              onChange={e => setCategory(e.target.value as PillarType | 'general')}
              className="w-full px-4 py-2.5 bg-black/30 border border-border rounded-lg text-text-primary focus:border-accent-purple focus:outline-none transition-colors"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label id="habit-xp-label" className="block text-sm font-semibold text-text-secondary mb-2">XP Reward</label>
            <input 
              type="number" 
              aria-labelledby="habit-xp-label"
              value={xpReward}
              onChange={e => setXpReward(Number(e.target.value))}
              min={5}
              max={200}
              className="w-full px-4 py-2.5 bg-black/30 border border-border rounded-lg text-text-primary focus:border-accent-purple focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label id="habit-icon-label" className="block text-sm font-semibold text-text-secondary mb-2">Icon</label>
            <div role="group" aria-labelledby="habit-icon-label" className="flex flex-wrap gap-2">
              {icons.map(icon => (
                <motion.button
                  key={icon.emoji}
                  type="button"
                  onClick={() => setSelectedIcon(icon.emoji)}
                  className={`
                    w-12 h-12 text-2xl rounded-lg border-2 transition-all
                    ${selectedIcon === icon.emoji 
                      ? 'border-accent-purple bg-accent-purple/20' 
                      : 'border-transparent bg-black/30 hover:bg-white/10'
                    }
                  `}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {icon.emoji}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <motion.button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-bg-hover hover:bg-bg-hover/80 text-text-primary font-semibold rounded-lg transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
            <motion.button 
              type="submit"
              className="flex-1 px-4 py-2.5 bg-accent-purple-dark hover:bg-accent-purple-dark/80 text-white font-semibold rounded-lg transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Create Habit
            </motion.button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}
