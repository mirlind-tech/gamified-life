import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TabTransition } from '../../components/animations';
import { EMOJIS } from '../../utils/emojis';
import type { FinanceTabProps } from './types';

type FixedCosts = {
  rent: number;
  phoneInternet: number;
  gym: number;
  laptopInsurance: number;
  aiSubscription: number;
  kosovoApartment: number;
};

type FinanceProfile = {
  monthlyIncome: number;
  monthlyFoodBudget: number;
  currentSavings: number;
  savingsGoal: number;
  fixedCosts: FixedCosts;
};

const FINANCE_PROFILE_STORAGE_KEY = 'mirlind-finance-profile';
const SAVINGS_PROGRESS_STORAGE_KEY = 'mirlind-savings-progress';

const DEFAULT_PROFILE: FinanceProfile = {
  monthlyIncome: 2000,
  monthlyFoodBudget: 320,
  currentSavings: 1400,
  savingsGoal: 6000,
  fixedCosts: {
    rent: 620,
    phoneInternet: 70,
    gym: 32,
    laptopInsurance: 5,
    aiSubscription: 20,
    kosovoApartment: 700,
  },
};

function parseNonNegativeNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function loadProfile(): FinanceProfile {
  let profile = DEFAULT_PROFILE;

  try {
    const raw = localStorage.getItem(FINANCE_PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FinanceProfile>;
      profile = {
        ...DEFAULT_PROFILE,
        ...parsed,
        fixedCosts: {
          ...DEFAULT_PROFILE.fixedCosts,
          ...(parsed.fixedCosts ?? {}),
        },
      };
    }
  } catch {
    // ignore invalid local data
  }

  try {
    const raw = localStorage.getItem(SAVINGS_PROGRESS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { currentAmount?: unknown };
      if (typeof parsed.currentAmount === 'number' && Number.isFinite(parsed.currentAmount) && parsed.currentAmount >= 0) {
        profile = { ...profile, currentSavings: parsed.currentAmount };
      }
    }
  } catch {
    // ignore invalid local data
  }

  return profile;
}

export function FinanceTab({
  financeEntries,
  newExpense,
  setNewExpense,
  addExpense,
  getDailyTotal,
  getWeeklyTotal,
}: FinanceTabProps) {
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.slice(0, 7);
  const [profile, setProfile] = useState<FinanceProfile>(loadProfile);

  useEffect(() => {
    localStorage.setItem(FINANCE_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVINGS_PROGRESS_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      const next = {
        ...parsed,
        currentAmount: profile.currentSavings,
        monthlyContributions: parsed.monthlyContributions ?? {},
        notes: parsed.notes ?? '',
      };
      localStorage.setItem(SAVINGS_PROGRESS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      localStorage.setItem(
        SAVINGS_PROGRESS_STORAGE_KEY,
        JSON.stringify({
          currentAmount: profile.currentSavings,
          monthlyContributions: {},
          notes: '',
        })
      );
    }
  }, [profile.currentSavings]);

  const { monthlyIncome, monthlyFoodBudget, currentSavings, savingsGoal, fixedCosts } = profile;

  const updateProfileField = (
    field: 'monthlyIncome' | 'monthlyFoodBudget' | 'currentSavings' | 'savingsGoal',
    value: string
  ) => {
    const numericValue = parseNonNegativeNumber(value);
    setProfile((prev) => ({ ...prev, [field]: numericValue }));
  };

  const updateFixedCostField = (field: keyof FixedCosts, value: string) => {
    const numericValue = parseNonNegativeNumber(value);
    setProfile((prev) => ({
      ...prev,
      fixedCosts: {
        ...prev.fixedCosts,
        [field]: numericValue,
      },
    }));
  };

  const totalFixedCosts =
    fixedCosts.rent +
    fixedCosts.phoneInternet +
    fixedCosts.gym +
    fixedCosts.laptopInsurance +
    fixedCosts.aiSubscription +
    fixedCosts.kosovoApartment;

  const dailyBudget = Number((monthlyFoodBudget / 30).toFixed(2));
  const weeklyBudget = Number((monthlyFoodBudget / 4.33).toFixed(2));

  const availableForSavings = monthlyIncome - totalFixedCosts - monthlyFoodBudget;

  const savingsProgress = savingsGoal > 0 ? (currentSavings / savingsGoal) * 100 : 0;
  const remainingToGoal = Math.max(0, savingsGoal - currentSavings);
  const monthsToGoal = availableForSavings > 0 ? Math.ceil(remainingToGoal / availableForSavings) : null;
  const runwayMonths = Number((currentSavings / (totalFixedCosts + monthlyFoodBudget)).toFixed(1));

  const monthlyExpenses = financeEntries.filter((e) => e.date.startsWith(currentMonth));
  const monthlyTotal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
  const monthlyFoodSpent = monthlyExpenses
    .filter((e) => e.category === 'food')
    .reduce((sum, e) => sum + e.amount, 0);

  const categories = ['food', 'transport', 'gym', 'other'] as const;
  const categoryTotals = categories.map((cat) => ({
    category: cat,
    amount: monthlyExpenses.filter((e) => e.category === cat).reduce((sum, e) => sum + e.amount, 0),
  }));

  const todaysExpenses = financeEntries.filter((e) => e.date === today);

  return (
    <TabTransition>
      <div className="glass-card rounded-2xl p-6 border border-accent-purple/30 bg-accent-purple/5">
        <h3 className="text-lg font-bold text-text-primary mb-2">{EMOJIS.PLUS} Financial Inputs</h3>
        <p className="text-xs text-text-muted mb-4">
          Edit your real numbers here. Saved automatically in your browser and used by all savings calculations.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <label className="bg-black/20 rounded-lg p-3">
            <span className="text-xs text-text-muted">Income / month</span>
            <input
              id="finance-monthly-income"
              name="finance_monthly_income"
              type="number"
              min="0"
              step="1"
              aria-label="Monthly income"
              value={monthlyIncome}
              onChange={(e) => updateProfileField('monthlyIncome', e.target.value)}
              className="w-full bg-transparent text-lg font-bold text-accent-green focus:outline-none mt-1"
            />
          </label>

          <label className="bg-black/20 rounded-lg p-3">
            <span className="text-xs text-text-muted">Food budget / month</span>
            <input
              id="finance-monthly-food-budget"
              name="finance_monthly_food_budget"
              type="number"
              min="0"
              step="1"
              aria-label="Monthly food budget"
              value={monthlyFoodBudget}
              onChange={(e) => updateProfileField('monthlyFoodBudget', e.target.value)}
              className="w-full bg-transparent text-lg font-bold text-accent-yellow focus:outline-none mt-1"
            />
          </label>

          <label className="bg-black/20 rounded-lg p-3">
            <span className="text-xs text-text-muted">Current savings</span>
            <input
              id="finance-current-savings"
              name="finance_current_savings"
              type="number"
              min="0"
              step="1"
              aria-label="Current savings"
              value={currentSavings}
              onChange={(e) => updateProfileField('currentSavings', e.target.value)}
              className="w-full bg-transparent text-lg font-bold text-accent-cyan focus:outline-none mt-1"
            />
          </label>

          <label className="bg-black/20 rounded-lg p-3">
            <span className="text-xs text-text-muted">Savings goal</span>
            <input
              id="finance-savings-goal"
              name="finance_savings_goal"
              type="number"
              min="0"
              step="1"
              aria-label="Savings goal"
              value={savingsGoal}
              onChange={(e) => updateProfileField('savingsGoal', e.target.value)}
              className="w-full bg-transparent text-lg font-bold text-text-primary focus:outline-none mt-1"
            />
          </label>

          <label className="bg-black/20 rounded-lg p-3">
            <span className="text-xs text-text-muted">Rent</span>
            <input
              id="finance-rent"
              name="finance_rent"
              type="number"
              min="0"
              step="1"
              aria-label="Rent"
              value={fixedCosts.rent}
              onChange={(e) => updateFixedCostField('rent', e.target.value)}
              className="w-full bg-transparent text-lg font-bold text-text-primary focus:outline-none mt-1"
            />
          </label>

          <label className="bg-black/20 rounded-lg p-3">
            <span className="text-xs text-text-muted">Phone + internet</span>
            <input
              id="finance-phone-internet"
              name="finance_phone_internet"
              type="number"
              min="0"
              step="1"
              aria-label="Phone and internet"
              value={fixedCosts.phoneInternet}
              onChange={(e) => updateFixedCostField('phoneInternet', e.target.value)}
              className="w-full bg-transparent text-lg font-bold text-text-primary focus:outline-none mt-1"
            />
          </label>

          <label className="bg-black/20 rounded-lg p-3">
            <span className="text-xs text-text-muted">Gym</span>
            <input
              id="finance-gym"
              name="finance_gym"
              type="number"
              min="0"
              step="1"
              aria-label="Gym membership"
              value={fixedCosts.gym}
              onChange={(e) => updateFixedCostField('gym', e.target.value)}
              className="w-full bg-transparent text-lg font-bold text-text-primary focus:outline-none mt-1"
            />
          </label>

          <label className="bg-black/20 rounded-lg p-3">
            <span className="text-xs text-text-muted">Laptop insurance</span>
            <input
              id="finance-laptop-insurance"
              name="finance_laptop_insurance"
              type="number"
              min="0"
              step="1"
              aria-label="Laptop insurance"
              value={fixedCosts.laptopInsurance}
              onChange={(e) => updateFixedCostField('laptopInsurance', e.target.value)}
              className="w-full bg-transparent text-lg font-bold text-text-primary focus:outline-none mt-1"
            />
          </label>

          <label className="bg-black/20 rounded-lg p-3">
            <span className="text-xs text-text-muted">AI subscription</span>
            <input
              id="finance-ai-subscription"
              name="finance_ai_subscription"
              type="number"
              min="0"
              step="1"
              aria-label="AI subscription"
              value={fixedCosts.aiSubscription}
              onChange={(e) => updateFixedCostField('aiSubscription', e.target.value)}
              className="w-full bg-transparent text-lg font-bold text-text-primary focus:outline-none mt-1"
            />
          </label>

          <label className="bg-black/20 rounded-lg p-3 md:col-span-3">
            <span className="text-xs text-text-muted">Kosovo apartment payment</span>
            <input
              id="finance-kosovo-apartment"
              name="finance_kosovo_apartment"
              type="number"
              min="0"
              step="1"
              aria-label="Kosovo apartment payment"
              value={fixedCosts.kosovoApartment}
              onChange={(e) => updateFixedCostField('kosovoApartment', e.target.value)}
              className="w-full bg-transparent text-lg font-bold text-accent-red focus:outline-none mt-1"
            />
          </label>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() =>
              setProfile((prev) => ({
                ...prev,
                currentSavings: Number((prev.currentSavings + Math.max(0, availableForSavings)).toFixed(2)),
              }))
            }
            className="px-4 py-2 bg-accent-green-dark text-white rounded-lg text-sm font-semibold hover:bg-accent-green-dark/80"
          >
            Add Planned Monthly Savings (+EUR {Math.max(0, availableForSavings)})
          </button>
          <span className="text-xs text-text-muted">Use once per salary month if you followed budget.</span>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-accent-cyan/30 bg-accent-cyan/5">
        <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          {EMOJIS.CAPITAL} Money Command
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/20 rounded-xl p-4 text-center">
            <div className="text-xs text-text-muted mb-1">Income</div>
            <div className="text-2xl font-bold text-accent-green">EUR {monthlyIncome}</div>
          </div>
          <div className="bg-black/20 rounded-xl p-4 text-center">
            <div className="text-xs text-text-muted mb-1">Fixed Costs (Mandatory)</div>
            <div className="text-2xl font-bold text-accent-red">EUR {totalFixedCosts}</div>
            <div className="text-[11px] text-text-muted">includes Kosovo apartment: EUR {fixedCosts.kosovoApartment}</div>
          </div>
          <div className="bg-black/20 rounded-xl p-4 text-center">
            <div className="text-xs text-text-muted mb-1">Food Budget</div>
            <div className="text-2xl font-bold text-accent-yellow">EUR {monthlyFoodBudget}</div>
          </div>
          <div className="bg-black/20 rounded-xl p-4 text-center">
            <div className="text-xs text-text-muted mb-1">Can Save / Month</div>
            <div className="text-2xl font-bold text-accent-cyan">EUR {availableForSavings}</div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4 border border-accent-yellow/30 bg-accent-yellow/5">
        <p className="text-sm text-text-primary">
          Kosovo apartment commitment: EUR {fixedCosts.kosovoApartment}/month for 10 years (started January 2026).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-4 text-center">
          <div className="text-3xl mb-1">{EMOJIS.COIN}</div>
          <div className="text-2xl font-bold text-accent-green">EUR {getDailyTotal().toFixed(2)}</div>
          <div className="text-xs text-text-muted">Today Spent</div>
          <div className={`text-xs mt-1 ${getDailyTotal() > dailyBudget ? 'text-accent-red' : 'text-accent-green'}`}>
            Ceiling: EUR {dailyBudget}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 text-center">
          <div className="text-3xl mb-1">{EMOJIS.MONEY}</div>
          <div className="text-2xl font-bold text-accent-purple">EUR {getWeeklyTotal().toFixed(2)}</div>
          <div className="text-xs text-text-muted">This Week</div>
          <div className={`text-xs mt-1 ${getWeeklyTotal() > weeklyBudget ? 'text-accent-red' : 'text-accent-green'}`}>
            Ceiling: EUR {weeklyBudget}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-accent-green/30">
        <h3 className="text-lg font-bold text-accent-green mb-4">Emergency Fund / Job Switch Buffer</h3>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-text-secondary">Current savings</span>
          <span className="text-text-primary font-bold">
            EUR {currentSavings} / EUR {savingsGoal} ({Math.round(savingsProgress)}%)
          </span>
        </div>
        <div className="h-4 bg-black/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-linear-to-r from-accent-green to-accent-cyan rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, savingsProgress)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-black/20 rounded-lg p-3 text-center">
            <div className="text-xs text-text-muted">Remaining</div>
            <div className="text-xl font-bold text-text-primary">EUR {remainingToGoal}</div>
          </div>
          <div className="bg-black/20 rounded-lg p-3 text-center">
            <div className="text-xs text-text-muted">Goal ETA</div>
            <div className="text-xl font-bold text-accent-cyan">{monthsToGoal ? `~${monthsToGoal} mo` : 'N/A'}</div>
          </div>
          <div className="bg-black/20 rounded-lg p-3 text-center">
            <div className="text-xs text-text-muted">Runway</div>
            <div className="text-xl font-bold text-accent-yellow">{runwayMonths} mo</div>
          </div>
        </div>

        <p className="text-xs text-text-muted mt-3">
          {monthsToGoal
            ? `If you protect EUR ${availableForSavings}/month, your fund reaches target in about ${monthsToGoal} months.`
            : 'Current budget leaves no monthly savings capacity. Reduce expenses or increase income to build buffer.'}
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-bold text-text-primary mb-4">{EMOJIS.PLUS} Add Expense</h3>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              id="finance-expense-amount"
              name="finance_expense_amount"
              type="number"
              step="0.01"
              aria-label="Amount in Euros"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              placeholder="Amount (EUR)"
              className="flex-1 bg-bg-secondary/50 rounded-lg px-4 py-2 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-purple border border-transparent"
            />
            <select
              id="finance-expense-category"
              name="finance_expense_category"
              aria-label="Expense category"
              value={newExpense.category}
              onChange={(e) =>
                setNewExpense({ ...newExpense, category: e.target.value as 'food' | 'transport' | 'gym' | 'other' })
              }
              className="cyber-select rounded-lg px-4 py-2 text-text-primary focus:outline-none"
            >
              <option value="food">Food</option>
              <option value="transport">Transport</option>
              <option value="gym">Gym</option>
              <option value="other">Other</option>
            </select>
          </div>
          <input
            id="finance-expense-description"
            name="finance_expense_description"
            type="text"
            aria-label="Description (optional)"
            value={newExpense.description}
            onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
            placeholder="Description (optional)"
            className="w-full bg-bg-secondary/50 rounded-lg px-4 py-2 text-text-primary placeholder-text-muted focus:outline-none"
          />
          <button
            onClick={addExpense}
            className="w-full py-2 bg-accent-purple-dark rounded-lg text-white font-semibold hover:bg-accent-purple-dark/80"
          >
            Add Expense
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-bold text-text-primary mb-4">{EMOJIS.BOOK} Today&apos;s Expenses</h3>
        {todaysExpenses.length === 0 ? (
          <p className="text-text-muted text-center py-4">No expenses logged today.</p>
        ) : (
          <div className="space-y-2">
            {todaysExpenses.map((expense, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-bg-secondary/30 rounded-lg">
                <div>
                  <span className="text-text-primary font-medium capitalize">{expense.category}</span>
                  {expense.description && <span className="text-text-muted text-sm ml-2">- {expense.description}</span>}
                </div>
                <span className="text-accent-red font-bold">EUR {expense.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-bold text-text-primary mb-4">Monthly Spending by Category</h3>
        <div className="space-y-3">
          {categoryTotals.map(({ category, amount }) => (
            <div key={category} className="flex items-center gap-3">
              <span className="w-20 text-sm text-text-secondary capitalize">{category}</span>
              <div className="flex-1 h-2 bg-black/30 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    category === 'food'
                      ? 'bg-accent-green'
                      : category === 'transport'
                      ? 'bg-accent-cyan'
                      : category === 'gym'
                      ? 'bg-accent-purple'
                      : 'bg-accent-pink'
                  }`}
                  style={{ width: `${Math.min(100, (amount / (monthlyTotal || 1)) * 100)}%` }}
                />
              </div>
              <span className="w-20 text-right text-sm font-bold text-text-primary">EUR {amount.toFixed(0)}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex justify-between">
            <span className="text-text-secondary">Total This Month</span>
            <span className="text-xl font-bold text-text-primary">EUR {monthlyTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mt-1 text-sm">
            <span className="text-text-secondary">Food Budget Status</span>
            <span className={monthlyFoodSpent > monthlyFoodBudget ? 'text-accent-red' : 'text-accent-green'}>
              {monthlyFoodSpent > monthlyFoodBudget
                ? `Over by EUR ${(monthlyFoodSpent - monthlyFoodBudget).toFixed(2)}`
                : `Under by EUR ${(monthlyFoodBudget - monthlyFoodSpent).toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4 border border-accent-cyan/20 bg-accent-cyan/5">
        <p className="text-sm text-text-secondary">
          Keep finance logging fast: open tab, add expense, close app. Execution matters more than app time.
        </p>
      </div>
    </TabTransition>
  );
}
