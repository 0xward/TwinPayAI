/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Filter, Clock, ChevronDown, ChevronUp, ExternalLink, Tag, User } from "lucide-react";
import { TransactionRecord } from "../types";
import { explorerTxUrl } from "../stacks-config";

interface HistoryViewProps {
  history: TransactionRecord[];
}

export default function HistoryView({ history }: HistoryViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'efficient': return 'text-ok bg-ok/10';
      case 'overspending': return 'text-red-400 bg-red-400/10';
      case 'underutilized': return 'text-brand-gold bg-brand-gold/10';
      default: return 'text-ghost bg-white/5';
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-end mb-8 flex-wrap gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl text-white mb-1">Transaction Ledger</h2>
          <p className="text-muted font-mono uppercase tracking-widest text-[10px]">Stacks Mainnet // Deterministic History</p>
        </div>
        <div className="flex gap-2">
           <div className="px-3 py-1.5 bg-surface border border-line rounded-lg flex items-center gap-2 text-xs text-ghost cursor-pointer hover:bg-surface-bright transition-colors">
             <Filter className="w-3 h-3" />
             <span>Filter</span>
           </div>
           <div className="px-3 py-1.5 bg-surface border border-line rounded-lg flex items-center gap-2 text-xs text-ghost cursor-pointer hover:bg-surface-bright transition-colors">
             <Search className="w-3 h-3" />
             <span>Search</span>
           </div>
        </div>
      </div>

      {/* ── Mobile: card list (avoids horizontal table scroll on small screens) ── */}
      <div className="sm:hidden space-y-3">
        {history.length === 0 ? (
          <div className="panel-quiet rounded-2xl p-10 text-center text-ghost italic text-sm">
            No deterministic records found in ledger.
          </div>
        ) : (
          history.map((tx) => {
            const isOpen = expandedId === tx.id;
            return (
              <div key={tx.id} className="panel-glass rounded-2xl overflow-hidden">
                <button onClick={() => toggleExpand(tx.id)} className="w-full text-left p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-bold text-white">{tx.item}</div>
                      <div className="text-[10px] text-muted font-mono mt-0.5">
                        {new Date(tx.timestamp).toLocaleDateString()} · {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-ghost shrink-0" /> : <ChevronDown className="w-4 h-4 text-ghost shrink-0" />}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="num-display text-lg text-white font-bold">
                      ${tx.amount.toFixed(2)} <span className="text-[10px] text-muted font-sans">{tx.token}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                        tx.decision === 'approve' ? 'border-brand-green/30 text-brand-green bg-brand-green/5' :
                        tx.decision === 'reject' ? 'border-red-500/30 text-red-500 bg-red-500/5' : 'border-brand-gold/30 text-brand-gold bg-brand-gold/5'
                      }`}>
                        {tx.decision}
                      </span>
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${getVerdictColor(tx.verdict)}`}>
                        {tx.verdict}
                      </span>
                    </div>
                  </div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-line"
                    >
                      <div className="p-4 space-y-3">
                        <DetailRow icon={<Tag className="w-3.5 h-3.5 text-muted" />} label="Category" value={tx.category || 'Uncategorized'} />
                        <DetailRow icon={<User className="w-3.5 h-3.5 text-muted" />} label="Recipient" value={tx.recipient} mono />
                        <p className="text-[11px] text-ghost italic leading-relaxed">
                          TwinPay AI marked this payment as <span className="text-white font-bold uppercase">{tx.decision}</span> with a{" "}
                          <span className="text-white font-bold uppercase">{tx.verdict}</span> spending verdict against your budget.
                        </p>
                        <a
                          href={explorerTxUrl(tx.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 bg-line hover:bg-surface-bright text-white text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-lg transition-all"
                        >
                          <ExternalLink className="w-3 h-3" /> View in Explorer
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
        {history.length > 0 && (
          <div className="flex items-center justify-between text-[10px] text-muted font-mono uppercase tracking-widest px-1 pt-2">
            <span>Ledger Size: {history.length}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Live Sync</span>
          </div>
        )}
      </div>

      {/* ── Desktop / tablet: table ── */}
      <div className="hidden sm:block bg-surface border border-line rounded-2xl overflow-hidden shadow-2xl ledger-strip">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="bg-surface-bright border-b border-line">
              <tr>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted tracking-widest">Timestamp</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted tracking-widest">Resource</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted tracking-widest text-right">Amount</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted tracking-widest">Decision</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted tracking-widest text-center">Outcome</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-ghost italic text-sm">
                    No deterministic records found in ledger.
                  </td>
                </tr>
              ) : (
                history.map((tx) => (
                  <React.Fragment key={tx.id}>
                    <tr
                      onClick={() => toggleExpand(tx.id)}
                      className={`cursor-pointer transition-colors group ${expandedId === tx.id ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'}`}
                    >
                      <td className="px-6 py-4 border-b border-line/50">
                        <div className="flex flex-col">
                          <span className="text-sm font-mono text-white/90">
                            {new Date(tx.timestamp).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-muted font-mono">
                            {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 border-b border-line/50">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white mb-0.5">{tx.item}</span>
                          <span className="text-[10px] font-mono text-muted tracking-tighter truncate max-w-[120px]">
                            {tx.recipient.slice(0, 10)}...
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right border-b border-line/50">
                        <div className="font-mono text-sm">
                          <span className="font-bold text-white">${tx.amount.toFixed(2)}</span>
                          <span className="ml-1 text-[10px] text-muted">{tx.token}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 border-b border-line/50">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                          tx.decision === 'approve' ? 'border-brand-green/30 text-brand-green bg-brand-green/5' :
                          tx.decision === 'reject' ? 'border-red-500/30 text-red-500 bg-red-500/5' : 'border-brand-gold/30 text-brand-gold bg-brand-gold/5'
                        }`}>
                          {tx.decision}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center border-b border-line/50">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${getVerdictColor(tx.verdict)}`}>
                          {tx.verdict}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right border-b border-line/50">
                        {expandedId === tx.id ? <ChevronUp className="w-4 h-4 text-ghost" /> : <ChevronDown className="w-4 h-4 text-ghost group-hover:text-white transition-colors" />}
                      </td>
                    </tr>

                    <AnimatePresence>
                      {expandedId === tx.id && (
                        <tr>
                          <td colSpan={6} className="p-0 border-b border-line bg-ink/30">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-4">
                                  <div className="flex items-center gap-3">
                                    <Tag className="w-4 h-4 text-muted" />
                                    <div>
                                      <p className="text-[10px] uppercase text-muted font-bold tracking-widest mb-1">Category</p>
                                      <p className="text-sm font-medium">{tx.category || 'Uncategorized'}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <User className="w-4 h-4 text-muted" />
                                    <div>
                                      <p className="text-[10px] uppercase text-muted font-bold tracking-widest mb-1">Recipient</p>
                                      <p className="text-[11px] font-mono break-all text-ghost">{tx.recipient}</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                   <div>
                                     <p className="text-[10px] uppercase text-muted font-bold tracking-widest mb-1">Network Context</p>
                                     <div className="bg-ink p-3 rounded border border-line text-[10px] font-mono text-muted break-all">
                                       Network: Stacks Mainnet<br/>
                                       Token: {tx.token}<br/>
                                       Tx ID: {tx.id.slice(0, 18)}...
                                     </div>
                                   </div>
                                </div>

                                <div className="flex flex-col justify-between">
                                  <div className="text-[10px] uppercase text-muted font-bold tracking-widest mb-2">AI Decision</div>
                                  <p className="text-xs text-ghost italic leading-relaxed">
                                    TwinPay AI marked this payment as <span className="text-white font-bold uppercase">{tx.decision}</span> with a <span className="text-white font-bold uppercase">{tx.verdict}</span> spending verdict against your budget.
                                  </p>
                                  <a
                                    href={explorerTxUrl(tx.id)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-4 flex items-center justify-center gap-2 bg-line hover:bg-surface-bright text-white text-[10px] font-bold uppercase tracking-widest py-2 rounded transition-all"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    View in Explorer
                                  </a>
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-[#0F121A] border-t border-line flex justify-between items-center text-[10px] text-muted font-mono uppercase tracking-widest">
           <div>Ledger Size: {history.length} Entries</div>
           <div className="flex items-center gap-2">
             <Clock className="w-3 h-3" />
             Real-time Stacks Index Sync
           </div>
        </div>
      </div>
    </motion.div>
  );
}

function DetailRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      {icon}
      <div>
        <p className="text-[9px] uppercase text-muted font-bold tracking-widest mb-0.5">{label}</p>
        <p className={`text-[11px] ${mono ? 'font-mono break-all text-ghost' : 'text-white/90'}`}>{value}</p>
      </div>
    </div>
  );
}
