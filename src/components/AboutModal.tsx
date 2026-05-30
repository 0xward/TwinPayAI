/**
 * TwinPay AI - About & FAQ Modal
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { X, Info, ShieldAlert, Sparkles, Zap, Bug, HelpCircle, ChevronDown } from "lucide-react";
import { useState } from "react";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "How does the AI know where to send funds?",
      a: "The AI agent parses your natural language input (like 'buy coffee'). It extracts the recipient Stacks address (SP...), the token (STX, sBTC, aeUSDC, etc.), and the amount automatically."
    },
    {
      q: "What wallet do I use?",
      a: "TwinPay integrates with the Leather and Xverse wallets on Stacks to provide a seamless experience for authorizing your AI-generated transaction plans, with transactions secured by Bitcoin finality."
    },
    {
      q: "Is it safe to use direct Stacks addresses?",
      a: "Absolutely. We encourage using the SP... format for the recipient. The AI and the audit engine verify every character to prevent simple typos from losing your funds."
    },
    {
      q: "What if the AI gets my intent wrong?",
      a: "TwinPay will show you a 'Transaction Plan' first. If the amount or address is wrong, simply click 'Cancel' and refine your description. Nothing happens until you sign in your wallet."
    },
    {
      q: "Can the AI send money without my permission?",
      a: "Never. The AI only generates a 'Transaction Plan'. Execution requires you to click 'Authorize' and sign the transaction with your Leather or Xverse wallet."
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/90 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-paper border border-line rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-line flex justify-between items-center bg-ink/30">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-brand-green/20 rounded-lg flex items-center justify-center">
                    <Info className="w-4 h-4 text-brand-green" />
                 </div>
                 <div>
                   <h2 className="text-sm font-black uppercase tracking-widest">Protocol & FAQ</h2>
                   <div className="flex items-center gap-2">
                     <span className="text-[8px] bg-brand-gold/20 text-brand-gold px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">EXPERIMENTAL BETA v0.1.0</span>
                   </div>
                 </div>
               </div>
               <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-muted hover:text-white"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>

            {/* Content */}
            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
               <div className="space-y-8">
                  {/* Neural Architecture */}
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="w-4 h-4 text-brand-green" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-ghost">How It Works</h3>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[11px] text-muted leading-relaxed">
                        TwinPay AI translates your natural intent (e.g. "buying lunch") into secure blockchain operations.
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                         <div className="p-3 bg-ink/40 border border-line/30 rounded-xl flex flex-col items-center text-center">
                            <span className="text-brand-green font-bold text-xs mb-1">1</span>
                            <span className="text-[9px] uppercase tracking-tighter text-ghost">Enter Intent</span>
                         </div>
                         <div className="p-3 bg-ink/40 border border-line/30 rounded-xl flex flex-col items-center text-center">
                            <span className="text-brand-green font-bold text-xs mb-1">2</span>
                            <span className="text-[9px] uppercase tracking-tighter text-ghost">AI Audit</span>
                         </div>
                         <div className="p-3 bg-ink/40 border border-line/30 rounded-xl flex flex-col items-center text-center">
                            <span className="text-brand-green font-bold text-xs mb-1">3</span>
                            <span className="text-[9px] uppercase tracking-tighter text-ghost">Safe Pay</span>
                         </div>
                      </div>
                      <p className="text-[10px] text-muted leading-relaxed italic border-l-2 border-brand-green pl-3">
                        The AI analyzes the amount vs your budget, checks the recipient address reputation, and prepares the exact data your wallet needs to sign.
                      </p>
                    </div>
                  </section>

                  {/* Protocol Stack Section */}
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-4 h-4 text-brand-green" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-ghost">Protocol Stack</h3>
                    </div>
                    <p className="text-[11px] text-muted leading-relaxed mb-4">
                      TwinPay combines an <span className="text-white font-bold">Intelligent Agent</span> with the <span className="text-white font-bold">Leather & Xverse</span> wallets to simplify blockchain interactions on Stacks.
                    </p>
                    <div className="space-y-3">
                       <div className="p-3 bg-white/5 border border-line rounded-xl">
                          <p className="text-[10px] text-ghost font-bold mb-1 italic">Intent Decoding</p>
                          <p className="text-[10px] text-muted">It translates human jargon (e.g. "buy coffee") into Clarity contract calls and STX transfers without requiring you to handle complex post-conditions or payload construction.</p>
                       </div>
                       <div className="p-3 bg-white/5 border border-line rounded-xl">
                          <p className="text-[10px] text-ghost font-bold mb-1 italic">Stacks Native</p>
                          <p className="text-[10px] text-muted">Designed for the Stacks ecosystem, allowing you to sign transactions secured by Bitcoin finality with low fees.</p>
                       </div>
                    </div>
                  </section>

                  {/* FAQ Section */}
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <HelpCircle className="w-4 h-4 text-brand-gold" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-ghost">Common Inquiries</h3>
                    </div>
                    <div className="space-y-2">
                       {faqs.map((faq, idx) => (
                         <div key={idx} className="bg-ink/40 border border-line/50 rounded-xl overflow-hidden">
                           <button 
                             onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                             className="w-full p-3 flex justify-between items-center text-left hover:bg-white/5 transition-colors"
                           >
                             <span className="text-[10px] font-bold text-ghost pr-4">{faq.q}</span>
                             <ChevronDown className={`w-3 h-3 text-muted transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                           </button>
                           <AnimatePresence>
                             {openFaq === idx && (
                               <motion.div
                                 initial={{ height: 0, opacity: 0 }}
                                 animate={{ height: 'auto', opacity: 1 }}
                                 exit={{ height: 0, opacity: 0 }}
                                 className="px-3 pb-3"
                               >
                                 <p className="text-[10px] text-muted leading-relaxed border-t border-line/30 pt-2">
                                   {faq.a}
                                 </p>
                               </motion.div>
                             )}
                           </AnimatePresence>
                         </div>
                       ))}
                    </div>
                  </section>

                  {/* Risks */}
                  <section className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl">
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldAlert className="w-4 h-4 text-red-500" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Risk Disclosure</h3>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[10px] text-red-400 font-medium italic underline">DO NOT SIGN TRANSACTIONS YOU DON'T UNDERSTAND.</p>
                       <p className="text-[10px] text-muted leading-relaxed">
                         The AI analysis is an aid, not a guarantee. Always verify the destination address and amount in your wallet pop-up.
                       </p>
                    </div>
                  </section>
               </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-ink/50 border-t border-line flex items-center justify-center">
               <div className="flex items-center gap-2 text-[9px] text-muted uppercase tracking-widest font-mono">
                 <Bug className="w-3 h-3 text-brand-green" />
                 <span>Terminal Version 0.1 // Node Alpha</span>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
