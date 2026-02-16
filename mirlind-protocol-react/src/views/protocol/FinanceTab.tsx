import { motion } from 'framer-motion';
import { EMOJIS } from '../../utils/emojis';
import type { FinanceTabProps } from './types';

export function FinanceTab({
  financeEntries,
  newExpense,
  setNewExpense,
  addExpense,
  getDailyTotal,
  getWeeklyTotal
}: FinanceTabProps) {
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.slice(0, 7); // YYYY-MM
  
  // Budget constants
  const dailyBudget = 9.47; // Food budget per day
  const weeklyBudget = 63.75; // Food budget per week
  const monthlyFoodBudget = 255;
  const monthlyIncome = 2400; // Feb-Jun, then 2000
  const fixedCosts = 842;
  const kosovoPayment = 700;
  const availableForSavings = monthlyIncome - fixedCosts - kosovoPayment - monthlyFoodBudget;
  
  // Savings tracking
  const savingsGoal = 5233;
  const currentSavings = 2206; // Estimated current (March)
  const savingsProgress = (currentSavings / savingsGoal) * 100;
  
  // Calculate monthly spending
  const monthlyExpenses = financeEntries.filter(e => e.date.startsWith(currentMonth));
  const monthlyTotal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
  const monthlyFoodSpent = monthlyExpenses.filter(e => e.category === 'food').reduce((sum, e) => sum + e.amount, 0);
  
  // Category breakdown
  const categories = ['food', 'transport', 'gym', 'other'] as const;
  const categoryTotals = categories.map(cat => ({
    category: cat,
    amount: monthlyExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
  }));
  
  const todaysExpenses = financeEntries.filter(e => e.date === today);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Financial Health Dashboard */}
      <div className="glass-card rounded-2xl p-6 bg-linear-to-br from-accent-green/10 to-accent-cyan/10">
        <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          💰 Financial Health
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/20 rounded-xl p-4 text-center">
            <div className="text-xs text-text-muted mb-1">Monthly Income</div>
            <div className="text-2xl font-bold text-accent-green">€{monthlyIncome}</div>
            <div className="text-xs text-text-muted">Feb-Jun: €2,400</div>
          </div>
          <div className="bg-black/20 rounded-xl p-4 text-center">
            <div className="text-xs text-text-muted mb-1">Available to Save</div>
            <div className="text-2xl font-bold text-accent-cyan">€{availableForSavings}</div>
            <div className="text-xs text-accent-green">per month</div>
          </div>
        </div>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-4 text-center">
          <div className="text-3xl mb-1">{EMOJIS.COIN}</div>
          <div className="text-2xl font-bold text-accent-green">€{getDailyTotal().toFixed(2)}</div>
          <div className="text-xs text-text-muted">Today Spent</div>
          <div className={`text-xs mt-1 ${getDailyTotal() > dailyBudget ? 'text-accent-red' : 'text-accent-green'}`}>
            Budget: €{dailyBudget}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 text-center">
          <div className="text-3xl mb-1">{EMOJIS.MONEY}</div>
          <div className="text-2xl font-bold text-accent-purple">€{getWeeklyTotal().toFixed(2)}</div>
          <div className="text-xs text-text-muted">This Week</div>
          <div className={`text-xs mt-1 ${getWeeklyTotal() > weeklyBudget ? 'text-accent-red' : 'text-accent-green'}`}>
            Budget: €{weeklyBudget}
          </div>
        </div>
      </div>

      {/* Monthly Food Budget */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-bold text-text-primary mb-4">🍖 Monthly Food Budget</h3>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-text-secondary">Food spending this month</span>
          <span className="text-text-primary font-bold">€{monthlyFoodSpent.toFixed(2)} / €{monthlyFoodBudget}</span>
        </div>
        <div className="h-3 bg-black/30 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${monthlyFoodSpent > monthlyFoodBudget ? 'bg-accent-red' : 'bg-accent-green'}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (monthlyFoodSpent / monthlyFoodBudget) * 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-xs text-text-muted mt-2">
          {monthlyFoodSpent > monthlyFoodBudget 
            ? `⚠️ Over budget by €${(monthlyFoodSpent - monthlyFoodBudget).toFixed(2)}` 
            : `✅ Under budget by €${(monthlyFoodBudget - monthlyFoodSpent).toFixed(2)}`}
        </p>
      </div>

      {/* Savings Progress */}
      <div className="glass-card rounded-2xl p-6 border border-accent-green/30">
        <h3 className="text-lg font-bold text-accent-green mb-4 flex items-center gap-2">
          🎯 Savings Goal: €{savingsGoal}
        </h3>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-text-secondary">Current savings</span>
          <span className="text-text-primary font-bold">€{currentSavings} ({Math.round(savingsProgress)}%)</span>
        </div>
        <div className="h-4 bg-black/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-linear-to-r from-accent-green to-accent-cyan rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${savingsProgress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-black/20 rounded-lg p-3 text-center">
            <div className="text-xs text-text-muted">Remaining</div>
            <div className="text-xl font-bold text-text-primary">€{savingsGoal - currentSavings}</div>
          </div>
          <div className="bg-black/20 rounded-lg p-3 text-center">
            <div className="text-xs text-text-muted">Monthly Target</div>
            <div className="text-xl font-bold text-accent-cyan">€{Math.ceil((savingsGoal - currentSavings) / 9)}</div>
          </div>
        </div>
        <p className="text-xs text-text-muted mt-3">Deadline: December 31, 2026 (9 months left)</p>
      </div>

      {/* Add Expense */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-bold text-text-primary mb-4">{EMOJIS.PLUS} Add Expense</h3>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              placeholder="Amount (€)"
              className="flex-1 bg-bg-secondary/50 rounded-lg px-4 py-2 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-purple border border-transparent"
            />
            <select
              value={newExpense.category}
              onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as 'food' | 'transport' | 'gym' | 'other' })}
              className="bg-bg-secondary/50 rounded-lg px-4 py-2 text-text-primary focus:outline-none"
            >
              <option value="food">Food</option>
              <option value="transport">Transport</option>
              <option value="gym">Gym</option>
              <option value="other">Other</option>
            </select>
          </div>
          <input
            type="text"
            value={newExpense.description}
            onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
            placeholder="Description (optional)"
            className="w-full bg-bg-secondary/50 rounded-lg px-4 py-2 text-text-primary placeholder-text-muted focus:outline-none"
          />
          <button
            onClick={addExpense}
            className="w-full py-2 bg-accent-purple rounded-lg text-white font-semibold hover:bg-accent-purple/80"
          >
            Add Expense
          </button>
        </div>
      </div>

      {/* Today's Expenses */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-bold text-text-primary mb-4">{EMOJIS.BOOK} Today&apos;s Expenses</h3>
        {todaysExpenses.length === 0 ? (
          <p className="text-text-muted text-center py-4">No expenses today. Stay under budget!</p>
        ) : (
          <div className="space-y-2">
            {todaysExpenses.map((expense, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-bg-secondary/30 rounded-lg">
                <div>
                  <span className="text-text-primary font-medium capitalize">{expense.category}</span>
                  {expense.description && (
                    <span className="text-text-muted text-sm ml-2">- {expense.description}</span>
                  )}
                </div>
                <span className="text-accent-red font-bold">€{expense.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-bold text-text-primary mb-4">📊 Monthly Spending by Category</h3>
        <div className="space-y-3">
          {categoryTotals.map(({ category, amount }) => (
            <div key={category} className="flex items-center gap-3">
              <span className="w-20 text-sm text-text-secondary capitalize">{category}</span>
              <div className="flex-1 h-2 bg-black/30 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    category === 'food' ? 'bg-accent-green' : 
                    category === 'transport' ? 'bg-accent-cyan' : 
                    category === 'gym' ? 'bg-accent-purple' : 'bg-accent-pink'
                  }`}
                  style={{ width: `${Math.min(100, (amount / (monthlyTotal || 1)) * 100)}%` }}
                />
              </div>
              <span className="w-16 text-right text-sm font-bold text-text-primary">€{amount.toFixed(0)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex justify-between">
            <span className="text-text-secondary">Total This Month</span>
            <span className="text-xl font-bold text-text-primary">€{monthlyTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Kosovo Tracker */}
      <div className="glass-card rounded-2xl p-6 border border-accent-red/30">
        <h3 className="text-lg font-bold text-accent-red mb-4 flex items-center gap-2">
          ⚠️ Kosovo Debt Tracker
        </h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-black/20 rounded-lg p-3">
            <div className="text-xs text-text-muted">Current</div>
            <div className="text-xl font-bold text-accent-red">€{kosovoPayment}/mo</div>
          </div>
          <div className="bg-black/20 rounded-lg p-3">
            <div className="text-xs text-text-muted">Target</div>
            <div className="text-xl font-bold text-accent-green">€400/mo</div>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Negotiation Deadline</span>
            <span className="text-text-primary font-bold">May 1, 2026</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Contract Due</span>
            <span className="text-text-primary font-bold">Dec 30, 2026</span>
          </div>
        </div>
        <p className="text-xs text-accent-red mt-3 bg-accent-red/10 p-2 rounded">
          ⚠️ Must have €8,400 by Dec 30 or contract breach. Current trajectory: €{currentSavings}.
        </p>
      </div>
    </motion.div>
  );
}
