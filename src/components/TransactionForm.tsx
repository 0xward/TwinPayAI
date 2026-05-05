/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { ShoppingCart, Send, ArrowRight } from "lucide-react";
import { TransactionInput, TransactionToken } from "../types";

interface TransactionFormProps {
  onSubmit: (tx: TransactionInput) => void;
  isLoading: boolean;
}

export default function TransactionForm({ onSubmit, isLoading }: TransactionFormProps) {
  const [formData, setFormData] = useState<Partial<TransactionInput>>({
    token: 'cUSD',
    category: 'Shopping',
    item: '',
    recipient: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.item && formData.price && formData.recipient) {
      onSubmit(formData as TransactionInput);
    } else {
      // If validation fails natively, this might not even be called if 'required' is working.
      // But we can add a fallback check here.
      console.log("Validation failed", formData);
    }
  };

  return (
    <motion.form 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-surface border border-line rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full relative z-10"
    >
      <div className="p-5 border-b border-line bg-surface-bright flex justify-between items-center">
        <h2 className="text-sm font-bold uppercase tracking-wide">Propose Transaction</h2>
        <ShoppingCart className="w-4 h-4 text-ghost opacity-30" />
      </div>

      <div className="p-8 flex-1 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase text-muted font-bold mb-2 tracking-widest pl-1">Description</label>
            <input 
              type="text" 
              required
              placeholder="e.g. buy coffee at 7-Eleven"
              className="w-full bg-ink border border-line p-4 rounded-lg focus:outline-none focus:border-celo-green/50 font-mono text-sm placeholder:text-gray-700 transition-colors pointer-events-auto"
              onChange={e => setFormData({ ...formData, item: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase text-muted font-bold mb-2 tracking-widest pl-1">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-4 text-gray-700 font-mono text-sm">$</span>
                <input 
                  type="number" 
                  required
                  step="0.01"
                  placeholder="0.00"
                  className="w-full bg-ink border border-line p-4 pl-8 rounded-lg focus:outline-none focus:border-celo-green/50 font-mono text-sm placeholder:text-gray-700 pointer-events-auto"
                  onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase text-muted font-bold mb-2 tracking-widest pl-1">Asset</label>
              <div className="grid grid-cols-2 gap-2">
                {(['CELO', 'cUSD', 'cEUR', 'USDT'] as TransactionToken[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormData({ ...formData, token: t })}
                    className={`px-3 py-3 rounded-lg border text-xs font-mono transition-all pointer-events-auto cursor-pointer ${
                      formData.token === t 
                        ? "bg-celo-green/10 border-celo-green text-celo-green" 
                        : "bg-ink border-line text-ghost hover:border-ghost/30"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
             <label className="block text-[10px] uppercase text-muted font-bold mb-2 tracking-widest pl-1">Recipient Address</label>
             <input 
              type="text" 
              required
              placeholder="0x..."
              className="w-full bg-ink border border-line p-4 rounded-lg focus:outline-none focus:border-celo-green/50 font-mono text-xs placeholder:text-gray-700 pointer-events-auto"
              value={formData.recipient}
              onChange={e => setFormData({ ...formData, recipient: e.target.value })}
            />
            <p className="text-[9px] text-muted mt-2 px-1 uppercase tracking-tighter">AI will audit this address for security before authorization.</p>
          </div>
        </div>

        <div className="pt-6 border-t border-line/30 flex justify-between items-center text-[10px] uppercase font-bold tracking-widest">
           <div className="flex flex-col gap-1">
              <span className="text-muted">Est. Gas Fee</span>
              <span className="text-celo-green">~0.001 CELO</span>
           </div>
           <div className="flex flex-col gap-1 text-right">
              <span className="text-muted">Settlement Time</span>
              <span className="text-white">~5 Seconds</span>
           </div>
        </div>
      </div>

      <div className="p-6 bg-surface-bright border-t border-line relative z-20">
        <button 
          type="submit"
          disabled={isLoading}
          className="w-full bg-celo-green text-ink font-bold py-4 rounded-lg flex items-center justify-center gap-3 hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 uppercase text-xs tracking-widest cursor-pointer pointer-events-auto relative z-30"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              Initialize Analysis
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </motion.form>
  );
}
