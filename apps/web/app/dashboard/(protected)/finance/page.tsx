"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";
import { EMOJIS } from "@/lib/emojis";
import { ProgressBar } from "@/components/ProgressBar";
import type { FinanceProfile } from "@/types";

export default function FinanceHQPage() {
  const [finance, setFinance] = useState<FinanceProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [caps, setCaps] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [financeData, capsData] = await Promise.all([
          api.getFinance().catch(() => null),
          api.getCaps().catch(() => ({ balance: 0 })),
        ]);
        setFinance(financeData);
        setCaps(capsData.balance);
      } catch (error) {
        console.error("Failed to load Finance HQ:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const savingsRate = finance && finance.monthly_income > 0
    ? Math.round((finance.current_savings / finance.monthly_income) * 100)
    : 0;

  const goalProgress = finance && finance.savings_goal > 0
    ? Math.round((finance.current_savings / finance.savings_goal) * 100)
    : 0;

  return (
    <div className="max-w-6xl mx-auto pb-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <span className="text-4xl">{EMOJIS.CAPITAL}</span>
          <div>
            <h1 className="text-2xl font-bold text-white">Finance HQ</h1>
            <p className="text-sm text-secondary">Wealth building and financial tracking</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/finance/expense" className="cyber-button text-sm">
            {EMOJIS.ADD} Add Expense
          </Link>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-secondary">Loading financial data...</p>
        </div>
      ) : (
        <>
          {/* Main Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <StatCard
              label="Monthly Income"
              value={`€${finance?.monthly_income || 0}`}
              icon={EMOJIS.MONEY}
              color="green"
            />
            <StatCard
              label="Current Savings"
              value={`€${finance?.current_savings || 0}`}
              icon={EMOJIS.PIGGY}
              color="cyan"
            />
            <StatCard
              label="Savings Goal"
              value={`€${finance?.savings_goal || 0}`}
              icon={EMOJIS.TROPHY}
              color="purple"
            />
            <StatCard
              label="CAPs Balance"
              value={caps.toString()}
              icon={EMOJIS.COIN}
              color="yellow"
            />
          </div>

          {/* Progress & Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Savings Progress */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                {EMOJIS.CHART} Savings Progress
              </h3>
              
              <div className="space-y-6">
                {/* Goal Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted">Goal Progress</span>
                    <span className="text-cyan font-bold">{goalProgress}%</span>
                  </div>
                  <div className="progress-bar h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, goalProgress)}%` }}
                      transition={{ duration: 1 }}
                      className="progress-fill h-3 bg-linear-to-r from-purple-500 to-cyan-500"
                    />
                  </div>
                  <p className="text-xs text-muted mt-1">
                    €{finance?.current_savings || 0} of €{finance?.savings_goal || 0} saved
                  </p>
                </div>

                {/* Monthly Savings Rate */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted">Monthly Savings Rate</span>
                    <span className={savingsRate >= 20 ? "text-green font-bold" : "text-yellow font-bold"}>
                      {savingsRate}%
                    </span>
                  </div>
                  <div className="progress-bar h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, savingsRate * 2)}%` }}
                      transition={{ duration: 1 }}
                      className={`progress-fill h-3 ${savingsRate >= 20 ? "bg-green" : "bg-yellow"}`}
                    />
                  </div>
                  <p className="text-xs text-muted mt-1">
                    Target: 20% minimum
                  </p>
                </div>
              </div>
            </motion.div>

            {/* CAPs System */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                {EMOJIS.COIN} CAPs System
              </h3>
              
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                  <span className="text-3xl">{EMOJIS.COIN}</span>
                  <span className="text-4xl font-bold text-yellow">{caps}</span>
                  <span className="text-sm text-muted">CAPs</span>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                <div className="flex justify-between items-center p-3 rounded-lg bg-gray-900/30">
                  <span className="text-sm text-secondary">Protocol Complete</span>
                  <span className="text-green text-sm">+10 CAPs</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-gray-900/30">
                  <span className="text-sm text-secondary">Workout Logged</span>
                  <span className="text-green text-sm">+5 CAPs</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-gray-900/30">
                  <span className="text-sm text-secondary">German Study</span>
                  <span className="text-green text-sm">+5 CAPs</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-gray-900/30">
                  <span className="text-sm text-secondary">Coding Session</span>
                  <span className="text-green text-sm">+5 CAPs</span>
                </div>
              </div>

              <Link
                href="/dashboard/finance/caps"
                className="mt-4 w-full cyber-button text-sm inline-block text-center"
              >
                View CAP History →
              </Link>
            </motion.div>
          </div>

          {/* Monthly Budget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                {EMOJIS.CALENDAR} Monthly Budget
              </h3>
              <Link href="/dashboard/finance/budget" className="text-sm text-cyan hover:underline">
                Edit Budget →
              </Link>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <BudgetCategory
                name="Housing"
                spent={450}
                budget={500}
                color="purple"
              />
              <BudgetCategory
                name="Food"
                spent={280}
                budget={300}
                color="cyan"
              />
              <BudgetCategory
                name="Transport"
                spent={120}
                budget={150}
                color="yellow"
              />
              <BudgetCategory
                name="Entertainment"
                spent={45}
                budget={100}
                color="pink"
              />
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: "green" | "cyan" | "purple" | "yellow";
}) {
  const colorClasses = {
    green: "from-green/20 to-green/5 border-green/30",
    cyan: "from-cyan/20 to-cyan/5 border-cyan/30",
    purple: "from-purple/20 to-purple/5 border-purple/30",
    yellow: "from-yellow/20 to-yellow/5 border-yellow/30",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`glass-card rounded-2xl p-4 bg-linear-to-br ${colorClasses[color]} border`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-xs text-muted uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

function BudgetCategory({
  name,
  spent,
  budget,
  color,
}: {
  name: string;
  spent: number;
  budget: number;
  color: "purple" | "cyan" | "yellow" | "pink";
}) {
  const progress = Math.min(100, (spent / budget) * 100);
  const colorClasses = {
    purple: "bg-purple-500",
    cyan: "bg-cyan-500",
    yellow: "bg-yellow-500",
    pink: "bg-pink-500",
  };

  return (
    <div className="p-4 rounded-xl bg-gray-900/30 border border-border">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-white">{name}</span>
        <span className={progress > 90 ? "text-red-400" : "text-muted"}>
          €{spent}/€{budget}
        </span>
      </div>
      <ProgressBar 
        progress={progress} 
        colorClass={`${colorClasses[color]} ${progress > 90 ? "bg-red-500" : ""}`}
      />
    </div>
  );
}
