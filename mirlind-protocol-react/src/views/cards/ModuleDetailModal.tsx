import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { type Module, type Topic } from '../../data/roadmap';

interface ModuleDetailModalProps {
  module: Module;
  isCompleted: boolean;
  onClose: () => void;
  onComplete: () => void;
}

function TopicItem({
  topic,
  isCompleted,
  onToggle,
}: {
  topic: Topic;
  isCompleted: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${isCompleted ? 'border-green-500/30' : 'border-white/10'}`}>
      <div
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            aria-label={isCompleted ? 'Mark topic incomplete' : 'Mark topic complete'}
            className={`
              w-6 h-6 rounded border-2 flex items-center justify-center transition-colors
              ${isCompleted ? 'bg-green-500 border-green-500' : 'border-white/30 hover:border-accent-cyan'}
            `}
          >
            {isCompleted && <Check className="w-4 h-4 text-white" />}
          </button>
          <span 
            onClick={() => setExpanded(!expanded)}
            className={`font-medium flex-1 cursor-pointer ${isCompleted ? 'text-green-500 line-through' : 'text-text-primary'}`}
          >
            {topic.name}
          </span>
        </div>
        <button 
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? 'Collapse topic details' : 'Expand topic details'}
          className="text-text-muted hover:text-text-primary transition-colors"
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-white/5">
              <p className="text-text-secondary text-sm mb-3">{topic.description}</p>
              
              <div className="space-y-2">
                <div className="text-xs font-semibold text-accent-cyan">Key Concepts:</div>
                <ul className="text-sm text-text-secondary space-y-1">
                  {topic.concepts.map((concept, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-accent-cyan">•</span> {concept}
                    </li>
                  ))}
                </ul>
              </div>

              {topic.code && (
                <div className="mt-3 p-3 bg-black/40 rounded-lg font-mono text-xs text-green-400 overflow-x-auto">
                  <pre>{topic.code}</pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ModuleDetailModal({
  module,
  isCompleted,
  onClose,
  onComplete,
}: ModuleDetailModalProps) {
  const [completedTopics, setCompletedTopics] = useState<number[]>([]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-bg-secondary border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <span className="text-4xl">{module.icon}</span>
              <div>
                <h2 className="text-2xl font-bold text-text-primary">{module.name}</h2>
                <p className="text-text-secondary">~{module.estimatedHours} hours • {module.topics.length} topics</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg">
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-text-secondary mt-4">{module.description}</p>
        </div>

        {/* Topics */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <h3 className="font-semibold text-text-primary mb-4">Topics to Master:</h3>
          <div className="space-y-3">
            {module.topics.map((topic, index) => (
              <TopicItem
                key={index}
                topic={topic}
                isCompleted={completedTopics.includes(index)}
                onToggle={() => {
                  setCompletedTopics(prev =>
                    prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
                  );
                }}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          {!isCompleted ? (
            <button
              onClick={onComplete}
              disabled={completedTopics.length < module.topics.length}
              className="w-full py-3 bg-accent-cyan hover:bg-accent-cyan/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
            >
              {completedTopics.length < module.topics.length
                ? `Complete ${module.topics.length - completedTopics.length} more topics`
                : '✅ Mark Module Complete'
              }
            </button>
          ) : (
            <div className="text-center text-green-500 font-bold py-3">
              ✅ Module Completed
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
