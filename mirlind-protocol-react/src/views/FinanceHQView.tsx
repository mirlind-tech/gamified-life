import { useEffect, useMemo, useState } from 'react';
import { useGame } from '../store/useGame';
import {
  getFinanceEntries,
  getFinanceSummary,
  getFinanceCap,
  saveFinanceCap,
  type FinanceCap,
} from '../services/financeApi';
import { logger } from '../utils/logger';

function getMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function FinanceHQView() {
  const { setView, showToast } = useGame();
  const monthKey = useMemo(() => getMonthKey(), []);
  const range = useMemo(() => getMonthRange(), []);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [cap, setCap] = useState<FinanceCap | null>(null);
  const [capInput, setCapInput] = useState('320');
  const [isSavingCap, setIsSavingCap] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [entries, summary, capData] = await Promise.all([
          getFinanceEntries(range.start, range.end),
          getFinanceSummary(range.start, range.end),
          getFinanceCap(monthKey),
        ]);
        setMonthlyTotal(summary.total || 0);
        setMonthlyCount(entries.entries.length);
        setCap(capData.cap || null);
        if (capData.cap?.cap_amount) {
          setCapInput(String(Math.round(capData.cap.cap_amount)));
        }
      } catch (error) {
        logger.error('Failed loading Finance HQ:', error);
        showToast('Failed to load Finance HQ', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [monthKey, range.end, range.start, showToast]);

  const capAmount = cap?.cap_amount || Number(capInput) || 0;
  const usagePct =
    capAmount > 0 ? Math.min(100, (monthlyTotal / capAmount) * 100) : 0;

  const handleSaveCap = async () => {
    const parsed = Number(capInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      showToast('Enter a valid monthly cap amount', 'warning');
      return;
    }
    setIsSavingCap(true);
    try {
      const response = await saveFinanceCap(
        monthKey,
        parsed,
        'Manual HQ update'
      );
      setCap(response.cap);
      showToast('Monthly cap saved', 'success');
    } catch (error) {
      logger.error('Failed saving finance cap:', error);
      showToast('Failed to save cap', 'error');
    } finally {
      setIsSavingCap(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-8 space-y-5">
      <div className="glass-card rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Finance HQ</h2>
          <p className="text-sm text-text-secondary">
            Cash control, spending caps, and wealth progression.
          </p>
        </div>
        <button
          onClick={() => setView('command')}
          className="px-3 py-2 rounded-lg border border-border bg-bg-secondary/40 text-text-secondary hover:text-text-primary"
        >
          Command Center
        </button>
      </div>

      {isLoading ? (
        <div className="glass-card rounded-2xl p-5 text-sm text-text-secondary">
          Loading finance metrics...
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-4">
            <Metric
              label="Monthly spend"
              value={`EUR ${monthlyTotal.toFixed(2)}`}
            />
            <Metric label="Transactions" value={String(monthlyCount)} />
            <Metric label="Monthly cap" value={`EUR ${capAmount.toFixed(2)}`} />
          </div>

          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-lg font-semibold text-text-primary mb-3">
              Cap Utilization
            </h3>
            <div className="h-3 rounded-full bg-black/30 overflow-hidden">
              <div
                className={`h-full ${
                  usagePct > 100
                    ? 'bg-red-500'
                    : usagePct > 80
                      ? 'bg-amber-400'
                      : 'bg-accent-green'
                }`}
                style={{ width: `${Math.min(100, usagePct)}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-text-secondary">
              {usagePct.toFixed(1)}% of monthly cap used
            </p>

            <div className="mt-4 grid sm:grid-cols-[1fr_auto] gap-2">
              <input
                id="finance-hq-monthly-cap"
                name="finance_hq_monthly_cap"
                type="number"
                value={capInput}
                onChange={(e) => setCapInput(e.target.value)}
                className="rounded-lg px-3 py-2 bg-black/30 border border-border text-text-primary"
              />
              <button
                onClick={handleSaveCap}
                disabled={isSavingCap}
                className="px-4 py-2 rounded-lg bg-accent-cyan-dark text-white hover:bg-accent-cyan-dark/80 disabled:opacity-60"
              >
                {isSavingCap ? 'Saving...' : 'Save Cap'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
    </div>
  );
}
