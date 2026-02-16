import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface HeatmapDay {
  date: string;
  completed: boolean;
  partial?: boolean;
  percentage?: number;
}

interface ProtocolHeatmapProps {
  data: HeatmapDay[];
  title?: string;
}

export function ProtocolHeatmap({ data, title = 'Protocol Streak' }: ProtocolHeatmapProps) {
  const weeks = useMemo(() => {
    const days = [...data];
    // Pad to start on Sunday
    const firstDay = new Date(days[0]?.date || new Date()).getDay();
    for (let i = 0; i < firstDay; i++) {
      days.unshift({ date: '', completed: false });
    }
    
    // Group into weeks
    const result: HeatmapDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [data]);

  const getColor = (day: HeatmapDay) => {
    if (!day.date) return 'bg-transparent';
    if (day.percentage === 100) return 'bg-accent-green';
    if (day.percentage && day.percentage >= 80) return 'bg-accent-green/70';
    if (day.percentage && day.percentage >= 60) return 'bg-accent-green/50';
    if (day.percentage && day.percentage >= 40) return 'bg-accent-yellow/50';
    if (day.percentage && day.percentage >= 20) return 'bg-accent-orange/50';
    return 'bg-white/10';
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-lg font-bold text-text-primary mb-4">{title}</h3>
      
      <div className="flex gap-2">
        {/* Day labels */}
        <div className="flex flex-col gap-1 pt-6">
          {days.filter((_, i) => i % 2 === 0).map((day) => (
            <div key={day} className="h-3 text-xs text-text-muted w-8">
              {day.slice(0, 3)}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex gap-1 overflow-x-auto pb-2">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <motion.div
                  key={`${weekIndex}-${dayIndex}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: (weekIndex * 7 + dayIndex) * 0.001 }}
                  className={`w-3 h-3 rounded-sm ${getColor(day)} ${
                    day.date ? 'cursor-pointer hover:ring-2 ring-accent-cyan' : ''
                  }`}
                  title={day.date ? `${day.date}: ${day.percentage || 0}% complete` : ''}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-text-muted">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-white/10" />
          <div className="w-3 h-3 rounded-sm bg-accent-orange/50" />
          <div className="w-3 h-3 rounded-sm bg-accent-yellow/50" />
          <div className="w-3 h-3 rounded-sm bg-accent-green/50" />
          <div className="w-3 h-3 rounded-sm bg-accent-green/70" />
          <div className="w-3 h-3 rounded-sm bg-accent-green" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
