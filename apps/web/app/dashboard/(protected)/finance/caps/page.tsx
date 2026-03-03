"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";
import { EMOJIS } from "@/lib/emojis";

export default function CapsPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCaps = async () => {
      setIsLoading(true);
      try {
        const caps = await api.getCaps();
        setBalance(caps.balance);
        setTransactions(caps.transactions);
      } catch (error) {
        console.error("Failed to load CAPs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadCaps();
  }, []);

  return (
    <div className="max-w-4xl mx-auto pb-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6"
      >
        <Link href="/dashboard/finance" className="text-sm text-muted hover:text-white inline-flex mb-4">
          {"<-"} Back to Finance HQ
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-4xl">{EMOJIS.COIN}</span>
          <div>
            <h1 className="text-2xl font-bold text-white">CAPs Ledger</h1>
            <p className="text-sm text-secondary">Current CAP balance and transaction stream</p>
          </div>
        </div>
      </motion.div>

      <div className="glass-card rounded-2xl p-6">
        <div className="text-sm text-muted uppercase tracking-wider">Current balance</div>
        <div className="text-5xl font-bold text-yellow mt-2">{balance}</div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Transactions</h2>
        {isLoading ? (
          <p className="text-secondary">Loading CAP transactions...</p>
        ) : transactions.length === 0 ? (
          <p className="text-secondary">
            No CAP transaction history is being emitted by the gateway yet. The route is now wired, so the page will populate as soon as the backend starts returning entries.
          </p>
        ) : (
          <pre className="overflow-x-auto text-sm text-secondary">
            {JSON.stringify(transactions, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
