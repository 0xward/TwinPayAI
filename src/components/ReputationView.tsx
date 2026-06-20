/**
 * ReputationView — Trust Score & Streaks.
 * Computed client-side from the existing users/{address}/transactions
 * history (no new contract or collection needed yet). This is the
 * "off-chain v1" of the on-chain Trust Score event log planned for the
 * smart-contract phase — same metric, upgradeable later without changing
 * the UI contract.
 */

import { useMemo, ReactNode } from 'react';
import { Award, Flame, ShieldCheck, TrendingUp, Calendar } from 'lucide-react';
import { TransactionRecord } from '../types';

interface ReputationViewProps {
  address: string | null;
  history: TransactionRecord[];
}

function computeStreak(history: TransactionRecord[]): number {
  if (history.length === 0) return 0;
  const days = Array.from(
    new Set(history.map((t) => new Date(t.timestamp).toDateString()))
  )
    .map((d) => new Date(d).getTime())
    .sort((a, b) => b - a);

  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (const day of days) {
    const diffDays = Math.round((cursor.getTime() - day) / (24 * 60 * 60 * 1000));
    if (diffDays === 0 || diffDays === 1) {
      streak += 1;
      cursor = new Date(day);
    } else {
      break;
    }
  }
  return streak;
}

function tierFor(score: number): { name: string; color: string; next: number } {
  if (score >= 100) return { name: 'Vault Architect', color: 'text-brass', next: Infinity };
  if (score >= 50) return { name: 'Trusted Spender', color: 'text-brand-orange', next: 100 };
  if (score >= 15) return { name: 'Active Builder', color: 'text-ok', next: 50 };
  return { name: 'New Signer', color: 'text-ghost', next: 15 };
}

export default function ReputationView({ address, history }: ReputationViewProps) {
  const approvedCount = useMemo(() => history.filter((t) => t.decision === 'approve').length, [history]);
  const efficientCount = useMemo(() => history.filter((t) => t.verdict === 'efficient').length, [history]);
  const streak = useMemo(() => computeStreak(history), [history]);
  const score = approvedCount * 2 + efficientCount * 3 + streak * 5;
  const tier = tierFor(score);

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <Award className="w-12 h-12 text-muted opacity-40" />
        <p className="text-sm text-ghost">Connect your wallet to see your Trust Score.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div
        className="relative overflow-hidden rounded-2xl p-8 border border-brass/25 ledger-strip"
        style={{ background: 'linear-gradient(135deg, rgba(17,20,28,0.95) 0%, rgba(11,14,20,0.98) 100%)' }}
      >
        <div className="relative z-10 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-3.5 h-3.5 text-brass" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brass">Trust Score</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl text-white leading-none">
              Your <span className="text-gradient-brass">Track Record</span>
            </h2>
            <p className="text-sm text-ghost mt-3 max-w-md">
              Built from your real approval history on TwinPay. A consistent, efficient record today becomes a verifiable on-chain reputation tomorrow.
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="num-display text-5xl font-bold text-white">{score}</div>
            <div className={`text-[11px] font-bold uppercase tracking-widest ${tier.color}`}>{tier.name}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Metric icon={<Flame className="w-4 h-4 text-brand-orange" />} label="Day Streak" value={streak} />
        <Metric icon={<ShieldCheck className="w-4 h-4 text-ok" />} label="Approved Txs" value={approvedCount} />
        <Metric icon={<TrendingUp className="w-4 h-4 text-brass" />} label="Efficient Spends" value={efficientCount} />
        <Metric icon={<Calendar className="w-4 h-4 text-muted" />} label="Total Activity" value={history.length} />
      </div>

      <div className="panel-quiet rounded-2xl p-6">
        <div className="text-[10px] uppercase text-muted font-bold tracking-widest mb-4">Progress to next tier</div>
        {tier.next === Infinity ? (
          <p className="text-sm text-ghost">You've reached the highest tier. New milestones are on the way.</p>
        ) : (
          <>
            <div className="w-full h-2.5 bg-ink rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-orange to-brass"
                style={{ width: `${Math.min(100, (score / tier.next) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-ghost">{score} / {tier.next} points to the next tier.</p>
          </>
        )}
        <p className="text-[10px] text-muted mt-4 leading-relaxed">
          Score = 2 × approved payments + 3 × efficient spends + 5 × consecutive day streak. This is currently computed client-side from your transaction history; a future update will mirror milestones on-chain via the TwinPay Vault contract.
        </p>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="panel-glass rounded-xl p-4">
      <div className="flex items-center gap-1.5 mb-2">{icon}<span className="text-[9px] uppercase text-muted font-bold tracking-widest">{label}</span></div>
      <div className="num-display text-2xl text-white font-bold">{value}</div>
    </div>
  );
}
