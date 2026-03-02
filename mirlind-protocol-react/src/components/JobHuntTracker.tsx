import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TARGET_APPLICATIONS = 60;
const TARGET_INTERVIEWS = 8;
const DEADLINE = new Date('2026-07-31');

interface Application {
  id: string;
  company: string;
  position: string;
  date: string;
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'ghosted';
  notes: string;
  link?: string;
}

interface JobHuntStats {
  applications: Application[];
  startDate: string;
}

const STATUS_COLORS: Record<Application['status'], { bg: string; text: string; label: string }> = {
  applied: { bg: 'bg-blue-500/20', text: 'text-blue-500', label: 'Applied' },
  screening: { bg: 'bg-yellow-500/20', text: 'text-yellow-500', label: 'Screening' },
  interview: { bg: 'bg-accent-purple/20', text: 'text-accent-purple', label: 'Interview' },
  offer: { bg: 'bg-green-500/20', text: 'text-green-500', label: 'Offer 🎉' },
  rejected: { bg: 'bg-red-500/20', text: 'text-red-500', label: 'Rejected' },
  ghosted: { bg: 'bg-gray-500/20', text: 'text-gray-500', label: 'Ghosted' },
};

const STORAGE_KEY = 'mirlind-job-hunt';

export function JobHuntTracker() {
  const [stats, setStats] = useState<JobHuntStats>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : { applications: [], startDate: '' };
  });
  const [showAddModal, setShowAddModal] = useState(false);
  // TODO: Implement edit functionality
  // const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  }, [stats]);

  const totalApplications = stats.applications.length;
  const interviews = stats.applications.filter(a => 
    a.status === 'interview' || a.status === 'offer'
  ).length;
  const offers = stats.applications.filter(a => a.status === 'offer').length;
  const activePipeline = stats.applications.filter(a => a.status === 'applied' || a.status === 'screening' || a.status === 'interview').length;

  const daysUntilDeadline = Math.ceil((DEADLINE.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const appsPerWeekNeeded = daysUntilDeadline > 0 
    ? Math.ceil((TARGET_APPLICATIONS - totalApplications) / (daysUntilDeadline / 7))
    : 0;

  const handleAdd = (application: Omit<Application, 'id'>) => {
    const newApp: Application = {
      ...application,
      id: Date.now().toString(),
    };
    setStats(prev => ({
      ...prev,
      applications: [newApp, ...prev.applications],
      startDate: prev.startDate || new Date().toISOString(),
    }));
    setShowAddModal(false);
  };

  const handleUpdate = (id: string, updates: Partial<Application>) => {
    setStats(prev => ({
      ...prev,
      applications: prev.applications.map(app =>
        app.id === id ? { ...app, ...updates } : app
      ),
    }));
    // setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setStats(prev => ({
      ...prev,
      applications: prev.applications.filter(app => app.id !== id),
    }));
  };

  const getMotivationMessage = () => {
    if (offers > 0) return { message: '🎉 You have an offer! Negotiate and decide!', color: '#10b981' };
    if (interviews >= TARGET_INTERVIEWS) return { message: '🔥 Great interview activity! One will convert!', color: '#06b6d4' };
    if (totalApplications >= TARGET_APPLICATIONS) return { message: '✅ Application target met! Focus on interviews now!', color: '#8b5cf6' };
    if (totalApplications >= TARGET_APPLICATIONS / 2) return { message: '⚡ Halfway there! Keep the momentum going!', color: '#f59e0b' };
    if (totalApplications > 0) return { message: '🚀 Good start! Quantity leads to quality!', color: '#f97316' };
    return { message: '💀 CRITICAL: Start applying NOW! Your future depends on it!', color: '#ef4444' };
  };

  const motivation = getMotivationMessage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-3xl p-6 mb-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">💼</span>
          <div>
            <h3 className="text-xl font-bold text-text-primary">Job Switch Tracker</h3>
            <p className="text-xs text-text-muted">Goal: 60 applications and 8 interviews by Jul 31, 2026</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-accent-green text-white rounded-lg font-medium hover:bg-accent-green/80 transition-colors flex items-center gap-2"
        >
          <span>+</span> Add Application
        </button>
      </div>

      {/* Urgency Banner */}
      <div 
        className="mb-6 p-4 rounded-xl border"
        style={{ borderColor: `${motivation.color}30`, backgroundColor: `${motivation.color}10` }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{motivation.message.split(' ')[0]}</span>
          <p className="font-medium" style={{ color: motivation.color }}>
            {motivation.message.split(' ').slice(1).join(' ')}
          </p>
        </div>
        {daysUntilDeadline > 0 && (
          <p className="text-sm text-text-muted mt-2">
            {daysUntilDeadline} days until deadline - {appsPerWeekNeeded} applications/week needed
          </p>
        )}
        <p className="text-xs text-text-muted mt-2">Pipeline numbers = Applied → Screening → Interview → Offer</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatBox 
          label="Applications" 
          value={totalApplications} 
          target={TARGET_APPLICATIONS}
          color="#06b6d4"
          icon="📨"
        />
        <StatBox 
          label="Interviews" 
          value={interviews} 
          target={TARGET_INTERVIEWS}
          color="#8b5cf6"
          icon="🎯"
        />
        <StatBox 
          label="Offers" 
          value={offers} 
          target={1}
          color="#10b981"
          icon="🎉"
        />
        <StatBox 
          label="Active Pipeline" 
          value={activePipeline} 
          target={12}
          color="#f59e0b"
          icon="🧭"
        />
      </div>

      {/* Progress Bars */}
      <div className="space-y-4 mb-6">
        <ProgressBar 
          label="Applications Progress" 
          current={totalApplications} 
          target={TARGET_APPLICATIONS}
          color="#06b6d4"
        />
        <ProgressBar 
          label="Interview Goal" 
          current={interviews} 
          target={TARGET_INTERVIEWS}
          color="#8b5cf6"
        />
      </div>

      {/* Applications List */}
      <div>
        <h4 className="text-sm font-semibold text-text-secondary mb-3">
          Recent Applications ({stats.applications.length})
        </h4>
        
        {stats.applications.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <p className="text-4xl mb-2">🚀</p>
            <p>No applications yet. Start today with 3 applications.</p>
            <p className="text-sm mt-1">Target: 60 applications by Jul 31, 2026</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-100 overflow-y-auto">
            {stats.applications.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-text-primary">{app.company}</h4>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="text-sm text-text-secondary">{app.position}</p>
                    <p className="text-xs text-text-muted mt-1">
                      Applied: {new Date(app.date).toLocaleDateString()}
                    </p>
                    {app.notes && (
                      <p className="text-xs text-text-muted mt-1 italic">{app.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={app.status}
                      onChange={(e) => handleUpdate(app.id, { status: e.target.value as Application['status'] })}
                      className="bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-accent-purple"
                    >
                      {Object.entries(STATUS_COLORS).map(([status, config]) => (
                        <option key={status} value={status}>{config.label.replace(' 🎉', '')}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="p-1.5 text-text-muted hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Application Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddApplicationModal
            onClose={() => setShowAddModal(false)}
            onAdd={handleAdd}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatBox({ label, value, target, color, icon }: { 
  label: string; 
  value: number; 
  target: number | null;
  color: string;
  icon: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-white/5 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold font-mono" style={{ color }}>
        {value}{target ? `/${target}` : ''}
      </div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
  );
}

function ProgressBar({ label, current, target, color }: { 
  label: string; 
  current: number; 
  target: number;
  color: string;
}) {
  const percentage = Math.min(100, (current / target) * 100);
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-text-secondary">{label}</span>
        <span className="font-medium" style={{ color }}>{percentage.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-black/30 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Application['status'] }) {
  const config = STATUS_COLORS[status];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

function AddApplicationModal({ 
  onClose, 
  onAdd 
}: { 
  onClose: () => void;
  onAdd: (app: Omit<Application, 'id'>) => void;
}) {
  const [form, setForm] = useState({
    company: '',
    position: '',
    date: new Date().toISOString().split('T')[0],
    status: 'applied' as Application['status'],
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company || !form.position) return;
    onAdd(form);
  };

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
        className="bg-bg-secondary border border-white/10 rounded-2xl w-full max-w-md p-6"
      >
        <h3 className="text-xl font-bold text-text-primary mb-4">Add Application</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="company" className="text-sm text-text-muted block mb-1">Company *</label>
            <input
              id="company"
              type="text"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
              placeholder="e.g., Google"
              autoFocus
            />
          </div>
          
          <div>
            <label htmlFor="position" className="text-sm text-text-muted block mb-1">Position *</label>
            <input
              id="position"
              type="text"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
              placeholder="e.g., Frontend Developer"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="text-sm text-text-muted block mb-1">Date</label>
              <input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
              />
            </div>
            <div>
              <label htmlFor="status" className="text-sm text-text-muted block mb-1">Status</label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Application['status'] })}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
              >
                {Object.entries(STATUS_COLORS).map(([status, config]) => (
                  <option key={status} value={status}>{config.label.replace(' 🎉', '')}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label htmlFor="notes" className="text-sm text-text-muted block mb-1">Notes</label>
            <textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full h-20 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-accent-purple"
              placeholder="Any notes about this application..."
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-white/10 text-text-secondary rounded-lg hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!form.company || !form.position}
              className="flex-1 py-2 bg-accent-purple-dark text-white rounded-lg hover:bg-accent-purple-dark/80 transition-colors disabled:opacity-50"
            >
              Add Application
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}




