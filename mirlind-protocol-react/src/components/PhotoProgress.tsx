import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PhotoEntry {
  id: string;
  date: string;
  front?: string;
  side?: string;
  back?: string;
  weight: number;
  notes: string;
}

const STORAGE_KEY = 'mirlind-photo-progress';

export function PhotoProgress() {
  const [photos, setPhotos] = useState<PhotoEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<{ before: PhotoEntry | null; after: PhotoEntry | null }>({ before: null, after: null });
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
  }, [photos]);

  const handleAddPhotos = (entry: PhotoEntry) => {
    setPhotos(prev => [entry, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  // Select first and latest for comparison
  const handleQuickCompare = () => {
    if (photos.length >= 2) {
      setSelectedPhotos({
        before: photos[photos.length - 1],
        after: photos[0]
      });
      setCompareMode(true);
    }
  };

  const weeksLogged = photos.length;
  const hasPhotos = photos.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-3xl p-6 mb-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📸</span>
          <div>
            <h3 className="text-xl font-bold text-text-primary">Body Transformation</h3>
            <p className="text-xs text-text-muted">Weekly progress photos • {weeksLogged} weeks logged</p>
          </div>
        </div>
        <div className="flex gap-2">
          {photos.length >= 2 && (
            <button
              onClick={handleQuickCompare}
              className="px-4 py-2 bg-accent-purple/20 text-accent-purple rounded-lg text-sm font-medium hover:bg-accent-purple/30 transition-colors"
            >
              📊 Compare First vs Latest
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-accent-green text-white rounded-lg font-medium hover:bg-accent-green/80 transition-colors"
          >
            + Add Week
          </button>
        </div>
      </div>

      {/* Stats */}
      {hasPhotos && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-white/5 rounded-xl text-center">
            <div className="text-2xl font-bold text-accent-cyan">{weeksLogged}</div>
            <div className="text-xs text-text-muted">Weeks Logged</div>
          </div>
          <div className="p-4 bg-white/5 rounded-xl text-center">
            <div className="text-2xl font-bold text-accent-green">
              {photos[0]?.weight || 0}kg
            </div>
            <div className="text-xs text-text-muted">Current Weight</div>
          </div>
          <div className="p-4 bg-white/5 rounded-xl text-center">
            <div className="text-2xl font-bold" style={{ color: calculateWeightChange(photos) >= 0 ? '#10b981' : '#ef4444' }}>
              {calculateWeightChange(photos) > 0 ? '+' : ''}{calculateWeightChange(photos)}kg
            </div>
            <div className="text-xs text-text-muted">Total Change</div>
          </div>
        </div>
      )}

      {/* View Toggle */}
      {hasPhotos && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-text-muted hover:text-white'}`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${viewMode === 'timeline' ? 'bg-white/20 text-white' : 'text-text-muted hover:text-white'}`}
          >
            Timeline
          </button>
        </div>
      )}

      {/* Photos Display */}
      {!hasPhotos ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📸</div>
          <p className="text-text-secondary mb-2">No progress photos yet</p>
          <p className="text-text-muted text-sm mb-4">Take weekly photos to track your Baki transformation</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-accent-green text-white rounded-xl font-medium hover:bg-accent-green/80 transition-colors"
          >
            Add First Week
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              index={index}
              onDelete={() => handleDelete(photo.id)}
              onCompare={() => {
                setSelectedPhotos({ before: photo, after: null });
                setCompareMode(true);
              }}
            />
          ))}
        </div>
      ) : (
        <TimelineView photos={photos} />
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddPhotoModal
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddPhotos}
            lastWeight={photos[0]?.weight}
          />
        )}
      </AnimatePresence>

      {/* Compare Modal */}
      <AnimatePresence>
        {compareMode && (
          <CompareModal
            photos={selectedPhotos}
            allPhotos={photos}
            onClose={() => setCompareMode(false)}
            onSelectBefore={(p) => setSelectedPhotos(prev => ({ ...prev, before: p }))}
            onSelectAfter={(p) => setSelectedPhotos(prev => ({ ...prev, after: p }))}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PhotoCard({ photo, index, onDelete, onCompare }: { photo: PhotoEntry; index: number; onDelete: () => void; onCompare: () => void }) {
  const [showFull, setShowFull] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        className="glass-card rounded-2xl overflow-hidden group"
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <p className="font-semibold text-text-primary">Week {index + 1}</p>
            <p className="text-xs text-text-muted">{new Date(photo.date).toLocaleDateString()}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCompare}
              className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-accent-purple transition-colors"
              title="Compare"
            >
              ⚖️
            </button>
            <button
              onClick={onDelete}
              className="p-2 hover:bg-red-500/20 rounded-lg text-text-muted hover:text-red-500 transition-colors"
              title="Delete"
            >
              🗑️
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 p-2">
          {['front', 'side', 'back'].map((angle) => {
            const imgUrl = photo[angle as keyof PhotoEntry] as string | undefined;
            return (
              <div
                key={angle}
                className="aspect-3/4 bg-black/40 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative"
                onClick={() => imgUrl && setShowFull(true)}
              >
                {imgUrl ? (
                  <img src={imgUrl} alt={`${angle} view`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">
                    {angle}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-4 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-accent-green">{photo.weight}kg</span>
            {photo.notes && <span className="text-xs text-text-muted truncate max-w-37.5">{photo.notes}</span>}
          </div>
        </div>
      </motion.div>

      {/* Full Image Modal */}
      <AnimatePresence>
        {showFull && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setShowFull(false)}
          >
            <div className="grid grid-cols-3 gap-4 max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
              {(['front', 'side', 'back'] as const).map((angle) => {
                const imgUrl = photo[angle];
                return imgUrl ? (
                  <div key={angle} className="aspect-3/4">
                    <img src={imgUrl} alt={angle} className="w-full h-full object-contain" />
                    <p className="text-center text-text-muted text-sm mt-2 capitalize">{angle}</p>
                  </div>
                ) : null;
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function TimelineView({ photos }: { photos: PhotoEntry[] }) {
  return (
    <div className="space-y-4">
      {photos.map((photo, index) => (
        <motion.div
          key={photo.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex gap-4 p-4 bg-white/5 rounded-xl"
        >
          <div className="w-24 shrink-0">
            {photo.front ? (
              <img src={photo.front} alt="Front" className="w-full aspect-3/4 object-cover rounded-lg" />
            ) : (
              <div className="w-full aspect-3/4 bg-black/40 rounded-lg flex items-center justify-center text-text-muted text-xs">
                No photo
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-semibold text-text-primary">Week {photos.length - index}</span>
              <span className="text-text-muted">•</span>
              <span className="text-text-muted">{new Date(photo.date).toLocaleDateString()}</span>
              <span className="text-accent-green font-bold ml-auto">{photo.weight}kg</span>
            </div>
            {photo.notes && <p className="text-sm text-text-secondary">{photo.notes}</p>}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function AddPhotoModal({ onClose, onAdd, lastWeight }: { onClose: () => void; onAdd: (entry: PhotoEntry) => void; lastWeight?: number }) {
  const [weight, setWeight] = useState(lastWeight?.toString() || '');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<{ front?: string; side?: string; back?: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeAngle, setActiveAngle] = useState<'front' | 'side' | 'back'>('front');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => ({ ...prev, [activeAngle]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    const weightNum = parseFloat(weight);
    if (!weightNum) return;

    onAdd({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      weight: weightNum,
      notes,
      ...photos
    });
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
        className="bg-bg-secondary border border-white/10 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-xl font-bold text-text-primary mb-4">Add Weekly Progress</h3>

        {/* Photo Upload */}
        <div className="mb-6">
          <label className="text-sm text-text-muted block mb-2">Photos (optional)</label>
          <div className="flex gap-2 mb-3">
            {(['front', 'side', 'back'] as const).map((angle) => (
              <button
                key={angle}
                onClick={() => setActiveAngle(angle)}
                className={`flex-1 py-2 rounded-lg text-sm capitalize transition-colors ${
                  activeAngle === angle ? 'bg-accent-purple text-white' : 'bg-white/10 text-text-muted'
                }`}
              >
                {photos[angle] ? '✓ ' : ''}{angle}
              </button>
            ))}
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="aspect-video bg-black/40 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-accent-purple/50 transition-colors"
          >
            {photos[activeAngle] ? (
              <img src={photos[activeAngle]} alt={activeAngle} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <>
                <span className="text-3xl mb-2">📷</span>
                <span className="text-sm text-text-muted">Click to upload {activeAngle} photo</span>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Weight */}
        <div className="mb-4">
          <label htmlFor="weight" className="text-sm text-text-muted block mb-1">Weight (kg) *</label>
          <input
            id="weight"
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-accent-green"
            placeholder="e.g., 65.5"
            autoFocus
          />
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label htmlFor="notes" className="text-sm text-text-muted block mb-1">Notes (optional)</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-20 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-accent-purple"
            placeholder="How did you feel this week? Any observations?"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-white/10 text-text-secondary rounded-lg hover:bg-white/20 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!weight}
            className="flex-1 py-2 bg-accent-green text-white rounded-lg hover:bg-accent-green/80 transition-colors disabled:opacity-50"
          >
            Save Progress
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CompareModal({
  photos,
  allPhotos,
  onClose,
  onSelectBefore,
  onSelectAfter
}: {
  photos: { before: PhotoEntry | null; after: PhotoEntry | null };
  allPhotos: PhotoEntry[];
  onClose: () => void;
  onSelectBefore: (p: PhotoEntry) => void;
  onSelectAfter: (p: PhotoEntry) => void;
}) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [compareView, setCompareView] = useState<'slider' | 'side'>('side');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      onClick={onClose}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/10">
        <h3 className="text-lg font-bold text-text-primary">Progress Comparison</h3>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-2xl">✕</button>
      </div>

      {/* Photo Selectors */}
      <div className="p-4 grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-text-muted block mb-2">Before</label>
          <select
            value={photos.before?.id || ''}
            onChange={(e) => {
              const photo = allPhotos.find(p => p.id === e.target.value);
              if (photo) onSelectBefore(photo);
            }}
            className="w-full bg-bg-secondary border border-white/10 rounded-lg px-3 py-2 text-text-primary"
          >
            <option value="">Select photo...</option>
            {[...allPhotos].reverse().map(p => (
              <option key={p.id} value={p.id}>
                {new Date(p.date).toLocaleDateString()} ({p.weight}kg)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-text-muted block mb-2">After</label>
          <select
            value={photos.after?.id || ''}
            onChange={(e) => {
              const photo = allPhotos.find(p => p.id === e.target.value);
              if (photo) onSelectAfter(photo);
            }}
            className="w-full bg-bg-secondary border border-white/10 rounded-lg px-3 py-2 text-text-primary"
          >
            <option value="">Select photo...</option>
            {[...allPhotos].reverse().map(p => (
              <option key={p.id} value={p.id}>
                {new Date(p.date).toLocaleDateString()} ({p.weight}kg)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Compare View Toggle */}
      <div className="px-4 pb-4 flex justify-center gap-2">
        <button
          onClick={() => setCompareView('side')}
          className={`px-4 py-1.5 rounded-lg text-sm ${compareView === 'side' ? 'bg-white/20 text-white' : 'text-text-muted'}`}
        >
          Side by Side
        </button>
        <button
          onClick={() => setCompareView('slider')}
          className={`px-4 py-1.5 rounded-lg text-sm ${compareView === 'slider' ? 'bg-white/20 text-white' : 'text-text-muted'}`}
        >
          Slider
        </button>
      </div>

      {/* Comparison Display */}
      <div className="flex-1 p-4 flex items-center justify-center overflow-auto" onClick={(e) => e.stopPropagation()}>
        {photos.before && photos.after ? (
          compareView === 'side' ? (
            <div className="grid grid-cols-2 gap-4 h-full">
              <div className="text-center">
                <p className="text-text-muted mb-2">{new Date(photos.before.date).toLocaleDateString()} • {photos.before.weight}kg</p>
                {photos.before.front ? (
                  <img src={photos.before.front} alt="Before" className="max-h-[70vh] mx-auto rounded-xl" />
                ) : (
                  <div className="aspect-3/4 bg-black/40 rounded-xl flex items-center justify-center text-text-muted">No photo</div>
                )}
              </div>
              <div className="text-center">
                <p className="text-text-muted mb-2">{new Date(photos.after.date).toLocaleDateString()} • {photos.after.weight}kg</p>
                {photos.after.front ? (
                  <img src={photos.after.front} alt="After" className="max-h-[70vh] mx-auto rounded-xl" />
                ) : (
                  <div className="aspect-3/4 bg-black/40 rounded-xl flex items-center justify-center text-text-muted">No photo</div>
                )}
              </div>
            </div>
          ) : (
            <div className="relative w-full max-w-2xl">
              <div className="relative aspect-3/4 rounded-xl overflow-hidden">
                {/* After image (bottom layer) */}
                {photos.after.front && (
                  <img src={photos.after.front} alt="After" className="absolute inset-0 w-full h-full object-cover" />
                )}
                {/* Before image (top layer, clipped) */}
                {photos.before.front && (
                  <img
                    src={photos.before.front}
                    alt="Before"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                  />
                )}
                {/* Slider handle */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
                  style={{ left: `${sliderPosition}%` }}
                  onMouseDown={(e) => {
                    const startX = e.clientX;
                    const startPos = sliderPosition;
                    const handleMove = (moveEvent: MouseEvent) => {
                      const delta = ((moveEvent.clientX - startX) / (e.currentTarget.parentElement?.offsetWidth || 1)) * 100;
                      setSliderPosition(Math.max(0, Math.min(100, startPos + delta)));
                    };
                    const handleUp = () => {
                      window.removeEventListener('mousemove', handleMove);
                      window.removeEventListener('mouseup', handleUp);
                    };
                    window.addEventListener('mousemove', handleMove);
                    window.addEventListener('mouseup', handleUp);
                  }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                    ↔
                  </div>
                </div>
              </div>
              <div className="flex justify-between mt-2 text-sm text-text-muted">
                <span>{new Date(photos.before.date).toLocaleDateString()} • {photos.before.weight}kg</span>
                <span>{new Date(photos.after.date).toLocaleDateString()} • {photos.after.weight}kg</span>
              </div>
            </div>
          )
        ) : (
          <div className="text-center text-text-muted">
            <p className="text-4xl mb-2">📸</p>
            <p>Select both photos to compare</p>
          </div>
        )}
      </div>

      {/* Weight Change */}
      {photos.before && photos.after && (
        <div className="p-4 border-t border-white/10 text-center">
          <span className="text-text-muted">Weight Change: </span>
          <span className={
            (photos.after.weight - photos.before.weight) >= 0 ? 'text-green-500 font-bold' : 'text-red-500 font-bold'
          }>
            {(photos.after.weight - photos.before.weight) >= 0 ? '+' : ''}
            {(photos.after.weight - photos.before.weight).toFixed(1)}kg
          </span>
        </div>
      )}
    </motion.div>
  );
}

function calculateWeightChange(photos: PhotoEntry[]): number {
  if (photos.length < 2) return 0;
  return parseFloat((photos[0].weight - photos[photos.length - 1].weight).toFixed(1));
}
