/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, XCircle, AlertCircle, Sparkles, ShieldCheck } from "lucide-react";
import { DecisionResponse } from "../types";

interface DecisionCardProps {
  decision: DecisionResponse | null;
  onExecute: () => void;
  isPending: boolean;
}

export default function DecisionCard({ decision, onExecute, isPending }: DecisionCardProps) {
  if (!decision) return null;

  const getStatusColor = () => {
    switch (decision.decision) {
      case 'approve': return 'text-celo-green';
      case 'reject': return 'text-red-500';
      case 'modify': return 'text-celo-gold';
    }
  };

  const getRiskColor = (score: number) => {
    if (score > 50) return 'text-red-500';
    if (score > 20) return 'text-celo-gold';
    return 'text-celo-green';
  };

  return (
    <AnimatePresence>
      <motion.section 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-surface border border-line rounded-2xl overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="p-5 border-b border-line bg-surface-bright flex justify-between items-center">
          <h2 className="text-sm font-bold uppercase tracking-wide">Current Transaction Analysis</h2>
          <span className="text-[10px] font-mono opacity-50 uppercase">ID: TX-{Math.floor(Math.random() * 10000)}-TP</span>
        </div>

        <div className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="text-4xl font-light tracking-tight font-mono">
                ${decision.tx_plan.amount.toFixed(2)} <span className="text-xl opacity-40 uppercase">{decision.tx_plan.token}</span>
              </div>
              <div className="text-sm text-ghost mt-1 max-w-sm italic">"{decision.reason}"</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase text-muted font-bold mb-1 tracking-widest">AI Confidence</div>
              <div className={`text-2xl font-bold ${getStatusColor()}`}>{(decision.confidence * 100).toFixed(1)}%</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-ink rounded-lg border border-line">
              <div className="text-[10px] uppercase text-muted font-bold mb-1 tracking-widest">Decision</div>
              <div className={`text-lg font-bold uppercase ${getStatusColor()}`}>{decision.decision}</div>
            </div>
            <div className="p-4 bg-ink rounded-lg border border-line">
              <div className="text-[10px] uppercase text-muted font-bold mb-1 tracking-widest">Efficiency</div>
              <div className="text-lg font-bold uppercase">Optimized</div>
            </div>
          </div>

          <div className="mb-8 p-4 bg-ink/50 border border-line rounded-xl">
             <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className={`w-4 h-4 ${decision.security_audit?.address_valid ? 'text-celo-green' : 'text-red-500'}`} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-ghost">Security Audit</span>
             </div>
             <div className="space-y-3">
                <div className="flex justify-between items-center text-[11px]">
                   <span className="text-muted">Target Integrity</span>
                   <span className={decision.security_audit?.address_valid ? 'text-celo-green' : 'text-red-500'}>
                     {decision.security_audit?.address_valid ? 'Verified Format' : 'Invalid Format'}
                   </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                   <span className="text-muted">Anomalous Activity</span>
                   <span className={getRiskColor(decision.security_audit?.suspicious_score || 0)}>
                     {decision.security_audit?.risk_summary || "Audit inconclusive"}
                   </span>
                </div>
             </div>
          </div>

          <div className="space-y-4">
            <div className="text-[11px] uppercase text-muted font-bold tracking-widest">Execution Deterministic Plan</div>
            <div className="font-mono text-[11px] bg-ink p-4 rounded-lg text-ghost leading-relaxed border border-line">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(decision.tx_plan, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        <div className="p-6 bg-surface-bright border-t border-line flex gap-3 relative z-10">
          {(decision.decision === 'approve' || decision.decision === 'modify') && (
            <button 
              onClick={onExecute}
              disabled={isPending}
              className="flex-1 py-3 bg-celo-green text-ink font-bold rounded-lg uppercase text-xs tracking-widest hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer pointer-events-auto relative z-20"
            >
              {isPending ? (
                <>
                  <div className="w-3 h-3 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                  Broadcasting...
                </>
              ) : (
                "Authorize & Execute"
              )}
            </button>
          )}
          <button 
            disabled={isPending}
            className="px-6 py-3 border border-line text-white/50 font-bold rounded-lg uppercase text-xs tracking-widest hover:text-white hover:bg-white/5 transition-all disabled:opacity-50 cursor-pointer pointer-events-auto relative z-20"
          >
            Override
          </button>
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
