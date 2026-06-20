/**
 * RecurringView — AI-managed recurring payments.
 * Lets a user schedule a repeating payment (rent, subscription, allowance).
 * Execution is user-confirmed: when a schedule is due, the user taps "Run now",
 * which routes through the same Decision Engine + on-chain transfer flow used
 * for one-off payments (via the onRunNow callback supplied by App.tsx).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Repeat,
  Plus,
  Trash2,
  Pause,
  Play,
  Clock,
  Zap,
  CheckCircle2,
  CalendarClock,
  X,
} from 'lucide-react';
import {
  listenToRecurringPayments,
  createRecurringPayment,
  toggleRecurringPayment,
  deleteRecurringPayment,
} from '../services/recurringService';
import { resolveBnsName } from '../stacks-config';
import { RecurringPayment, TransactionToken, Contact } from '../types';

interface RecurringViewProps {
  address: string | null;
  contacts: Contact[];
  onRunNow: (payment: RecurringPayment) => void;
}

const INTERVAL_PRESETS = [
  { label: 'Weekly', days: 7 },
  { label: 'Monthly', days: 30 },
  { label: 'Quarterly', days: 90 },
];

export default function RecurringView({ address, contacts, onRunNow }: RecurringViewProps) {
  const [payments, setPayments] = useState<RecurringPayment[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState<TransactionToken>('STX');
  const [recipient, setRecipient] = useState('');
  const [intervalDays, setIntervalDays] = useState(30);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const bnsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!address) return;
    const unsub = listenToRecurringPayments(address, setPayments);
    return unsub;
  }, [address]);

  useEffect(() => {
    if (bnsDebounceRef.current) clearTimeout(bnsDebounceRef.current);
    if (!recipient.trim().endsWith('.btc')) {
      setResolvedAddress(null);
      return;
    }
    bnsDebounceRef.current = setTimeout(async () => {
      const addr = await resolveBnsName(recipient.trim());
      setResolvedAddress(addr);
    }, 600);
  }, [recipient]);

  const handleCreate = useCallback(async () => {
    if (!address) return;
    const amt = parseFloat(amount);
    const effectiveRecipient = resolvedAddress ?? recipient.trim();
    if (!label.trim() || isNaN(amt) || amt <= 0 || !effectiveRecipient) return;
    setSubmitting(true);
    try {
      await createRecurringPayment(address, {
        label: label.trim(),
        amount: amt,
        token,
        recipient: effectiveRecipient,
        recipientLabel: recipient.trim().endsWith('.btc') ? recipient.trim() : undefined,
        intervalDays,
      });
      setLabel('');
      setAmount('');
      setRecipient('');
      setShowCreate(false);
    } finally {
      setSubmitting(false);
    }
  }, [address, label, amount, token, recipient, resolvedAddress, intervalDays]);

  const isDue = (p: RecurringPayment) => new Date(p.nextRunAt).getTime() <= Date.now();

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <Repeat className="w-12 h-12 text-muted opacity-40" />
        <p className="text-sm text-ghost">Connect your wallet to manage recurring payments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="relative overflow-hidden rounded-2xl p-8 border border-brand-orange/20 ledger-strip"
        style={{ background: 'linear-gradient(135deg, rgba(17,20,28,0.95) 0%, rgba(11,14,20,0.98) 100%)' }}
      >
        <div className="relative z-10 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Repeat className="w-3.5 h-3.5 text-brand-orange" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-orange/70">
                Set once, let it run
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl text-white leading-none">
              Recurring <span className="text-gradient-brand">Payments</span>
            </h2>
            <p className="text-sm text-ghost mt-3 max-w-md">
              Schedule rent, subscriptions, or allowances. TwinPay AI reminds you when one is due and routes execution through your usual approval flow.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-orange to-brand-gold rounded-xl font-bold uppercase text-xs tracking-widest text-ink hover:brightness-110 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> New Schedule
          </button>
        </div>
      </div>

      {/* List */}
      {payments.length === 0 ? (
        <div className="panel-quiet rounded-2xl p-10 text-center space-y-3">
          <CalendarClock className="w-10 h-10 text-muted opacity-30 mx-auto" />
          <p className="text-sm text-ghost">No recurring payments yet.</p>
          <p className="text-[11px] text-muted max-w-xs mx-auto">
            Set up a schedule for something you pay regularly — TwinPay AI will surface it here when it's due.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {payments.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`panel-glass rounded-2xl p-5 ${isDue(p) && p.active ? 'ledger-strip border-brass/30' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-bold text-white">{p.label}</div>
                  <div className="text-[11px] text-muted font-mono mt-0.5">
                    {p.recipientLabel ?? `${p.recipient.slice(0, 8)}…${p.recipient.slice(-4)}`}
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                    p.active
                      ? 'bg-ok/10 border-ok/30 text-ok'
                      : 'bg-white/5 border-white/10 text-muted'
                  }`}
                >
                  {p.active ? 'Active' : 'Paused'}
                </span>
              </div>

              <div className="flex items-baseline gap-1.5 mb-3">
                <span className="num-display text-2xl text-white font-bold">{p.amount}</span>
                <span className="text-xs text-ghost">{p.token}</span>
                <span className="text-[11px] text-muted ml-1">
                  every {p.intervalDays === 7 ? 'week' : p.intervalDays === 30 ? 'month' : p.intervalDays === 90 ? 'quarter' : `${p.intervalDays}d`}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] mb-4">
                <Clock className="w-3 h-3 text-muted" />
                <span className={isDue(p) && p.active ? 'text-brass font-bold' : 'text-ghost'}>
                  {isDue(p) && p.active ? 'Due now' : `Next: ${new Date(p.nextRunAt).toLocaleDateString()}`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {p.active && isDue(p) && (
                  <button
                    onClick={() => onRunNow(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-brass/15 border border-brass/30 text-brass rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-brass/25 transition-all"
                  >
                    <Zap className="w-3 h-3" /> Run now
                  </button>
                )}
                <button
                  onClick={() => toggleRecurringPayment(address, p.id, !p.active)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold uppercase text-ghost hover:text-white transition-all"
                >
                  {p.active ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => deleteRecurringPayment(address, p.id)}
                  className="flex items-center justify-center px-3 py-2 bg-red-500/5 hover:bg-red-500/15 border border-red-500/20 rounded-lg text-red-400 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              {p.lastRunAt && (
                <div className="flex items-center gap-1.5 text-[10px] text-muted mt-3 pt-3 border-t border-line">
                  <CheckCircle2 className="w-3 h-3 text-ok" />
                  Last run {new Date(p.lastRunAt).toLocaleDateString()}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm"
              onClick={() => setShowCreate(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="panel-glass rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-display text-xl text-white">New Recurring Payment</h3>
                  <button onClick={() => setShowCreate(false)} className="text-muted hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] uppercase text-muted font-bold tracking-widest mb-1.5">Label</label>
                    <input
                      type="text"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="e.g. Monthly rent"
                      className="w-full px-4 py-3 bg-ink border border-line rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:border-brand-orange/50 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase text-muted font-bold tracking-widest mb-1.5">Amount</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-3 bg-ink border border-line rounded-xl font-mono text-sm text-white placeholder:text-white/20 outline-none focus:border-brand-orange/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase text-muted font-bold tracking-widest mb-1.5">Asset</label>
                      <select
                        value={token}
                        onChange={(e) => setToken(e.target.value as TransactionToken)}
                        className="w-full px-4 py-3 bg-ink border border-line rounded-xl text-sm text-white outline-none focus:border-brand-orange/50 transition-colors"
                      >
                        <option value="STX">STX</option>
                        <option value="sBTC">sBTC</option>
                        <option value="aeUSDC">aeUSDC</option>
                        <option value="USDCx">USDCx</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase text-muted font-bold tracking-widest mb-1.5">Recipient</label>
                    <input
                      type="text"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="SP... or name.btc"
                      list="recurring-contacts"
                      className="w-full px-4 py-3 bg-ink border border-line rounded-xl font-mono text-xs text-white placeholder:text-white/20 outline-none focus:border-brand-orange/50 transition-colors"
                    />
                    <datalist id="recurring-contacts">
                      {contacts.map((c) => (
                        <option key={c.id} value={c.address}>{c.name}</option>
                      ))}
                    </datalist>
                    {resolvedAddress && (
                      <p className="text-[10px] text-ok mt-1.5 font-mono">Resolved → {resolvedAddress.slice(0, 10)}…</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase text-muted font-bold tracking-widest mb-1.5">Frequency</label>
                    <div className="flex gap-2">
                      {INTERVAL_PRESETS.map((p) => (
                        <button
                          key={p.days}
                          onClick={() => setIntervalDays(p.days)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                            intervalDays === p.days
                              ? 'bg-brand-orange text-ink'
                              : 'bg-white/5 text-ghost hover:bg-white/10'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleCreate}
                    disabled={submitting || !label.trim() || !amount || !recipient.trim()}
                    className="w-full py-3 bg-gradient-to-r from-brand-orange to-brand-gold rounded-xl font-bold uppercase text-xs tracking-widest text-ink disabled:opacity-40 hover:brightness-110 transition-all"
                  >
                    {submitting ? 'Saving…' : 'Create Schedule'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
