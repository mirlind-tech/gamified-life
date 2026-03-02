import { useEffect, useState } from 'react';
import { useGame } from '../store/useGame';
import { logger } from '../utils/logger';
import {
  getAdaptiveProfile,
  getAdaptiveRecommendation,
  saveAdaptiveProfile,
  type AdaptiveProfile,
  type AdaptiveRecommendation,
} from '../services/adaptiveApi';

interface AssessmentDraft {
  bodyLevel: number;
  mindLevel: number;
  careerLevel: number;
  financeLevel: number;
  germanLevel: number;
  dailyMinutes: number;
  stressLevel: number;
}

function toDraft(profile: AdaptiveProfile): AssessmentDraft {
  return {
    bodyLevel: profile.body_level,
    mindLevel: profile.mind_level,
    careerLevel: profile.career_level,
    financeLevel: profile.finance_level,
    germanLevel: profile.german_level,
    dailyMinutes: profile.daily_minutes,
    stressLevel: profile.stress_level,
  };
}

export function AssessmentView() {
  const { setView, showToast } = useGame();
  const [draft, setDraft] = useState<AssessmentDraft>({
    bodyLevel: 3,
    mindLevel: 3,
    careerLevel: 3,
    financeLevel: 3,
    germanLevel: 3,
    dailyMinutes: 90,
    stressLevel: 3,
  });
  const [recommendation, setRecommendation] = useState<AdaptiveRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const recommendedMinutes = recommendation?.recommendedDailyMinutes ?? {
    body: 0,
    mind: 0,
    career: 0,
    finance: 0,
    german: 0,
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [{ profile }, recommendationData] = await Promise.all([
          getAdaptiveProfile(),
          getAdaptiveRecommendation(),
        ]);
        setDraft(toDraft(profile));
        setRecommendation(recommendationData);
      } catch (error) {
        logger.error('Failed to load adaptive assessment:', error);
        showToast('Failed to load assessment', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [showToast]);

  const updateField = <K extends keyof AssessmentDraft>(key: K, value: number) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveAdaptiveProfile({
        bodyLevel: draft.bodyLevel,
        mindLevel: draft.mindLevel,
        careerLevel: draft.careerLevel,
        financeLevel: draft.financeLevel,
        germanLevel: draft.germanLevel,
        dailyMinutes: draft.dailyMinutes,
        stressLevel: draft.stressLevel,
        baselineCompleted: true,
      });
      const recommendationData = await getAdaptiveRecommendation();
      setRecommendation(recommendationData);
      showToast('Assessment saved. Difficulty updated.', 'success');
    } catch (error) {
      logger.error('Failed to save adaptive profile:', error);
      showToast('Could not save assessment', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-8 space-y-5">
      <div className="glass-card rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Baseline Assessment</h2>
          <p className="text-sm text-text-secondary">
            Set your current levels so weekly targets stay hard but sustainable.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('command')}
            className="px-3 py-2 rounded-lg border border-border bg-bg-secondary/40 text-text-secondary hover:text-text-primary"
          >
            Command Center
          </button>
          <button
            onClick={() => setView('weekly-plan')}
            className="px-3 py-2 rounded-lg bg-accent-purple-dark text-white hover:bg-accent-purple-dark/80"
          >
            Weekly Plan
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h3 className="text-lg font-semibold text-text-primary">Current Capacity (1-10)</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <SliderInput fieldName="body_level" label="Body" value={draft.bodyLevel} onChange={(v) => updateField('bodyLevel', v)} />
          <SliderInput fieldName="mind_level" label="Mind" value={draft.mindLevel} onChange={(v) => updateField('mindLevel', v)} />
          <SliderInput fieldName="career_level" label="Career" value={draft.careerLevel} onChange={(v) => updateField('careerLevel', v)} />
          <SliderInput fieldName="finance_level" label="Finance" value={draft.financeLevel} onChange={(v) => updateField('financeLevel', v)} />
          <SliderInput fieldName="german_level" label="German" value={draft.germanLevel} onChange={(v) => updateField('germanLevel', v)} />
          <SliderInput fieldName="stress_level" label="Stress" value={draft.stressLevel} onChange={(v) => updateField('stressLevel', v)} max={5} />
        </div>

        <label className="text-sm text-text-muted block">
          Daily minutes realistically available
          <input
            id="adaptive-daily-minutes"
            name="adaptive_daily_minutes"
            type="number"
            min={30}
            max={600}
            value={draft.dailyMinutes}
            onChange={(e) => updateField('dailyMinutes', Number(e.target.value))}
            className="mt-1 w-full rounded-lg px-3 py-2 bg-black/30 border border-border text-text-primary"
          />
        </label>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="px-4 py-2 rounded-lg bg-accent-green text-black font-semibold disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save Assessment'}
          </button>
        </div>
      </div>

      {recommendation && (
        <div className="glass-card rounded-2xl p-5 border border-accent-cyan/40 bg-accent-cyan/10">
          <h3 className="text-lg font-semibold text-text-primary mb-2">Adaptive Difficulty</h3>
          <p className="text-sm text-text-secondary mb-3">
            Difficulty factor: <span className="font-semibold text-accent-cyan">{recommendation.difficultyFactor}</span>
          </p>
          <div className="grid sm:grid-cols-2 gap-2 text-sm">
            <p className="text-text-secondary">Body: {recommendedMinutes.body}m</p>
            <p className="text-text-secondary">Mind: {recommendedMinutes.mind}m</p>
            <p className="text-text-secondary">Career: {recommendedMinutes.career}m</p>
            <p className="text-text-secondary">Finance: {recommendedMinutes.finance}m</p>
            <p className="text-text-secondary">German: {recommendedMinutes.german}m</p>
          </div>
          <p className="mt-3 text-sm text-text-primary">{recommendation.guidance}</p>
        </div>
      )}
    </div>
  );
}

interface SliderInputProps {
  fieldName: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  max?: number;
}

function SliderInput({ fieldName, label, value, onChange, max = 10 }: SliderInputProps) {
  return (
    <label className="text-sm text-text-muted block">
      {label}: <span className="font-semibold text-text-primary">{value}</span>
      <input
        id={`adaptive-${fieldName}`}
        name={`adaptive_${fieldName}`}
        type="range"
        min={1}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full mt-2 accent-accent-purple"
      />
    </label>
  );
}
