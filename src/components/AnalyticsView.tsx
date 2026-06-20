/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from "react";
import { motion } from "motion/react";
import { BarChart2, TrendingUp, TrendingDown, Minus, Bot } from "lucide-react";
import { TransactionRecord, TransactionToken } from "../types";

interface AnalyticsViewProps {
  history: TransactionRecord[];
}

const TOKEN_COLORS: Record<string, string> = {
  STX: "bg-brand-gold",
  sBTC: "bg-brand-orange",
  aeUSDC: "bg-blue-400",
  USDCx: "bg-purple-400",
};

const CATEGORY_COLORS = [
  "bg-brand-gold",
  "bg-brand-orange",
  "bg-brand-green",
  "bg-blue-400",
  "bg-purple-400",
  "bg-pink-400",
  "bg-teal-400",
];

function getMonthStart(offset = 0): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() - offset);
  return d;
}

export default function AnalyticsView({ history }: AnalyticsViewProps) {
  const thisMonthStart = getMonthStart(0);
  const lastMonthStart = getMonthStart(1);

  const thisMonth = useMemo(
    () => history.filter((tx) => new Date(tx.timestamp) >= thisMonthStart),
    [history]
  );

  const lastMonth = useMemo(
    () =>
      history.filter(
        (tx) =>
          new Date(tx.timestamp) >= lastMonthStart &&
          new Date(tx.timestamp) < thisMonthStart
      ),
    [history]
  );

  // Total spent per token this month
  const tokenTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const tx of thisMonth) {
      totals[tx.token] = (totals[tx.token] ?? 0) + tx.amount;
    }
    return totals;
  }, [thisMonth]);

  // Spending by category this month
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const tx of thisMonth) {
      const cat = tx.category || "Uncategorized";
      totals[cat] = (totals[cat] ?? 0) + tx.amount;
    }
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [thisMonth]);

  const maxCategory = categoryTotals[0]?.[1] ?? 1;

  // Month-over-month total (USD)
  const thisTotal = useMemo(() => thisMonth.reduce((s, tx) => s + tx.amount, 0), [thisMonth]);
  const lastTotal = useMemo(() => lastMonth.reduce((s, tx) => s + tx.amount, 0), [lastMonth]);
  const momDiff = thisTotal - lastTotal;
  const momPct = lastTotal > 0 ? ((momDiff / lastTotal) * 100).toFixed(1) : null;

  // AI verdict distribution this month
  const verdictCounts = useMemo(() => {
    const counts = { approve: 0, modify: 0, reject: 0 };
    for (const tx of thisMonth) {
      if (tx.decision in counts) counts[tx.decision as keyof typeof counts]++;
    }
    return counts;
  }, [thisMonth]);

  const totalDecisions = verdictCounts.approve + verdictCounts.modify + verdictCounts.reject || 1;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="font-display text-2xl sm:text-3xl text-white mb-1">Spending Analytics</h2>
        <p className="text-[10px] text-muted font-mono uppercase tracking-widest">
          This Month // On-Chain Intelligence
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Transactions" value={String(thisMonth.length)} sub="this month" />
        <KpiCard
          label="Total Spent"
          value={`$${thisTotal.toFixed(2)}`}
          sub={
            momPct !== null
              ? `${momDiff >= 0 ? "+" : ""}${momPct}% vs last month`
              : "first month of data"
          }
          trend={momDiff === 0 ? "neutral" : momDiff > 0 ? "up" : "down"}
        />
        <KpiCard label="Approvals" value={String(verdictCounts.approve)} sub="AI approved" />
        <KpiCard label="Rejections" value={String(verdictCounts.reject)} sub="AI rejected" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spent per token */}
        <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-line bg-surface-bright">
            <h3 className="text-sm font-bold uppercase tracking-wide">Spent by Token – This Month</h3>
          </div>
          <div className="p-6 space-y-4">
            {Object.keys(tokenTotals).length === 0 ? (
              <p className="text-ghost italic text-sm text-center py-6">No transactions this month.</p>
            ) : (
              (["STX", "sBTC", "aeUSDC", "USDCx"] as TransactionToken[]).map((tok) => {
                const val = tokenTotals[tok] ?? 0;
                const maxVal = Math.max(...(Object.values(tokenTotals) as number[]), 1);
                return (
                  <div key={tok}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-bold text-white">{tok}</span>
                      <span className="font-mono text-ghost">${val.toFixed(4)}</span>
                    </div>
                    <div className="w-full h-3 bg-ink rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${TOKEN_COLORS[tok] ?? "bg-brand-green"}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(val / maxVal) * 100}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Spending by category */}
        <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-line bg-surface-bright">
            <h3 className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-brand-gold" /> By Category – This Month
            </h3>
          </div>
          <div className="p-6 space-y-3">
            {categoryTotals.length === 0 ? (
              <p className="text-ghost italic text-sm text-center py-6">No data yet.</p>
            ) : (
              categoryTotals.map(([cat, total], i) => (
                <div key={cat}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-white font-bold truncate max-w-[160px]">{cat}</span>
                    <span className="font-mono text-ghost">${total.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-3 bg-ink rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(total / maxCategory) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.05 }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Month-over-month + AI verdict row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MoM Trend */}
        <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-line bg-surface-bright">
            <h3 className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-orange" /> Month-over-Month
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-ink rounded-xl border border-line text-center">
                <div className="text-[10px] uppercase text-muted font-bold tracking-widest mb-1">This Month</div>
                <div className="text-2xl font-bold font-mono text-brand-gold">${thisTotal.toFixed(2)}</div>
                <div className="text-[10px] text-muted mt-1">{thisMonth.length} txs</div>
              </div>
              <div className="p-4 bg-ink rounded-xl border border-line text-center">
                <div className="text-[10px] uppercase text-muted font-bold tracking-widest mb-1">Last Month</div>
                <div className="text-2xl font-bold font-mono text-ghost">${lastTotal.toFixed(2)}</div>
                <div className="text-[10px] text-muted mt-1">{lastMonth.length} txs</div>
              </div>
            </div>
            {momPct !== null && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-bold ${
                  momDiff > 0
                    ? "bg-red-400/5 border-red-400/20 text-red-400"
                    : momDiff < 0
                    ? "bg-brand-green/5 border-brand-green/20 text-brand-green"
                    : "bg-white/5 border-line text-ghost"
                }`}
              >
                {momDiff > 0 ? (
                  <TrendingUp className="w-4 h-4 shrink-0" />
                ) : momDiff < 0 ? (
                  <TrendingDown className="w-4 h-4 shrink-0" />
                ) : (
                  <Minus className="w-4 h-4 shrink-0" />
                )}
                <span>
                  {momDiff >= 0 ? "+" : ""}
                  {momPct}% compared to last month
                </span>
              </div>
            )}
          </div>
        </div>

        {/* AI Verdict Distribution */}
        <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-line bg-surface-bright">
            <h3 className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
              <Bot className="w-4 h-4 text-brand-green" /> AI Verdict Distribution
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {[
              { label: "Approve", key: "approve", color: "bg-brand-green", textColor: "text-brand-green" },
              { label: "Modify", key: "modify", color: "bg-brand-gold", textColor: "text-brand-gold" },
              { label: "Reject", key: "reject", color: "bg-red-400", textColor: "text-red-400" },
            ].map(({ label, key, color, textColor }) => {
              const count = verdictCounts[key as keyof typeof verdictCounts];
              const pct = ((count / totalDecisions) * 100).toFixed(1);
              return (
                <div key={key}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className={`font-bold ${textColor}`}>{label}</span>
                    <span className="font-mono text-ghost">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-ink rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / totalDecisions) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
              );
            })}

            {thisMonth.length === 0 && (
              <p className="text-ghost italic text-sm text-center pt-2">No AI decisions this month.</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="bg-surface border border-line rounded-2xl p-5">
      <div className="text-[10px] uppercase text-muted font-bold tracking-widest mb-2">{label}</div>
      <div className="text-2xl font-bold font-mono text-white">{value}</div>
      {sub && (
        <div
          className={`text-[10px] mt-1 ${
            trend === "up"
              ? "text-red-400"
              : trend === "down"
              ? "text-brand-green"
              : "text-muted"
          }`}
        >
          {sub}
        </div>
      )}
    </div>
  );
}
