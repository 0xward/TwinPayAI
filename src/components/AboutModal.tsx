/**
 * TwinPay AI - About & Guide Modal
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Zap,
  ShieldCheck,
  Bot,
  Wallet,
  ArrowRight,
  HelpCircle,
  AlertTriangle,
  Layers,
  ChevronDown,
  Globe,
  Lock,
  Coins,
} from "lucide-react";
import { useState } from "react";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const faqs = [
  {
    q: "What wallet do I need?",
    a: "TwinPay works with Leather and Xverse — both are non-custodial Stacks wallets. You can download Leather at leather.io or Xverse at xverse.app. No seed phrases are shared with TwinPay.",
  },
  {
    q: "Can the AI send money without my permission?",
    a: "Never. The AI only generates a Transaction Plan. Nothing is sent until you physically click 'Authorize & Execute' and sign inside your Leather or Xverse wallet. Two clicks minimum — AI proposes, you decide.",
  },
  {
    q: "What tokens are supported?",
    a: "Currently STX (native Stacks), sBTC (Bitcoin-pegged on Stacks), and aeUSDC (bridged USD stablecoin). More tokens can be added by updating the TOKEN_CONTRACTS config.",
  },
  {
    q: "What is the AI actually doing?",
    a: "The AI (powered by Groq LLM) checks your monthly budget, your spending personality (conservative / balanced / aggressive), the recipient address validity, and proposes whether to approve, modify, or reject your transaction — with reasoning.",
  },
  {
    q: "Is my data stored anywhere?",
    a: "Transaction history is stored in Firebase Firestore tied to your anonymous or Google session. Your wallet private keys are never accessible to TwinPay — all signing happens inside your Stacks wallet.",
  },
  {
    q: "What does 'Bitcoin-secured' mean?",
    a: "Stacks settles its blocks anchored to Bitcoin, meaning your transaction finality is backed by Bitcoin's proof-of-work. This gives Stacks transactions a higher security guarantee than chains that don't anchor to Bitcoin.",
  },
];

const steps = [
  {
    icon: Wallet,
    color: "text-brand-green",
    bg: "bg-brand-green/10 border-brand-green/30",
    title: "1. Connect Your Wallet",
    desc: "Click 'Connect' in the top bar. Leather or Xverse will open and ask you to authorize TwinPay. Your keys stay in your wallet — always.",
  },
  {
    icon: Bot,
    color: "text-brand-gold",
    bg: "bg-brand-gold/10 border-brand-gold/30",
    title: "2. Set Your Budget & Personality",
    desc: "Go to Settings (⚙️) and define your monthly budget and spending personality. The AI uses these to decide whether to approve or flag a transaction.",
  },
  {
    icon: Layers,
    color: "text-blue-400",
    bg: "bg-blue-400/10 border-blue-400/30",
    title: "3. Propose a Transaction",
    desc: "Fill in the Description (what you're buying), Amount, Token (STX / sBTC / aeUSDC), and Recipient Stacks address (SP...). Click 'Initialize Analysis'.",
  },
  {
    icon: ShieldCheck,
    color: "text-brand-green",
    bg: "bg-brand-green/10 border-brand-green/30",
    title: "4. AI Audits & Decides",
    desc: "TwinPay AI audits the recipient address, compares the amount to your budget, and returns a verdict: Approve, Modify, or Reject — with a confidence score and reason.",
  },
  {
    icon: Lock,
    color: "text-brand-orange",
    bg: "bg-brand-orange/10 border-brand-orange/30",
    title: "5. Authorize & Sign",
    desc: "If you agree with the AI decision, click 'Authorize & Execute'. Your Stacks wallet (Leather/Xverse) will open and show the exact transaction for you to review and sign.",
  },
  {
    icon: Globe,
    color: "text-purple-400",
    bg: "bg-purple-400/10 border-purple-400/30",
    title: "6. Confirmed on Stacks",
    desc: "Once signed, the transaction is broadcast to Stacks Mainnet and anchored to Bitcoin. You can track it in the Hiro Explorer via the Transaction History tab.",
  },
];

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"about" | "guide" | "faq">("about");

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative w-full max-w-xl bg-[#0d1117] border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,255,140,0.08)] flex flex-col"
            style={{ maxHeight: "92vh" }}
          >
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-white/8 flex items-center justify-between shrink-0 bg-gradient-to-r from-brand-green/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-brand rounded-xl flex items-center justify-center font-black text-ink text-lg glow-brand-sm">
                  T
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-white">
                    TwinPay AI
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[8px] bg-brand-green/20 text-brand-green px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                      Beta v0.1
                    </span>
                    <span className="text-[8px] text-muted uppercase tracking-wider">
                      Stacks Mainnet
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/8 rounded-full transition-colors text-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/8 shrink-0 bg-black/20">
              {(["about", "guide", "faq"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                    activeTab === tab
                      ? "text-brand-green border-b-2 border-brand-green bg-brand-green/5"
                      : "text-muted hover:text-ghost"
                  }`}
                >
                  {tab === "about" ? "About" : tab === "guide" ? "How to Use" : "FAQ"}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* ── ABOUT TAB ── */}
              {activeTab === "about" && (
                <div className="p-5 sm:p-7 space-y-6">
                  {/* Hero description */}
                  <div className="p-4 bg-brand-green/5 border border-brand-green/20 rounded-2xl">
                    <p className="text-sm text-white font-bold leading-relaxed mb-2">
                      What is TwinPay AI?
                    </p>
                    <p className="text-[11px] text-ghost leading-relaxed">
                      TwinPay AI is an <span className="text-white font-semibold">AI-powered payment agent</span> built on the{" "}
                      <span className="text-white font-semibold">Stacks blockchain</span> — a Layer 2 network secured by Bitcoin.
                      Instead of manually constructing blockchain transactions, you describe what you want to pay for in plain English,
                      and the AI audits, plans, and prepares the transaction for your wallet signature.
                    </p>
                  </div>

                  {/* Feature pills */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Bot, label: "AI Decision Engine", desc: "Groq LLM analyzes every transaction", color: "text-brand-green" },
                      { icon: ShieldCheck, label: "Address Auditing", desc: "Auto-validates recipient addresses", color: "text-blue-400" },
                      { icon: Coins, label: "Multi-Token", desc: "STX, sBTC, and aeUSDC", color: "text-brand-gold" },
                      { icon: Zap, label: "Bitcoin Finality", desc: "Settled on Stacks → anchored to BTC", color: "text-brand-orange" },
                    ].map(({ icon: Icon, label, desc, color }) => (
                      <div key={label} className="p-3 bg-white/4 border border-white/8 rounded-xl">
                        <Icon className={`w-4 h-4 ${color} mb-2`} />
                        <p className="text-[10px] font-bold text-white mb-0.5">{label}</p>
                        <p className="text-[9px] text-muted leading-relaxed">{desc}</p>
                      </div>
                    ))}
                  </div>

                  {/* Tech stack */}
                  <div>
                    <p className="text-[9px] uppercase font-bold text-muted tracking-widest mb-3">
                      Built With
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "React + TypeScript",
                        "Stacks Connect",
                        "Groq LLM",
                        "Firebase",
                        "Hiro API",
                        "Tailwind CSS",
                        "Vite",
                      ].map((tech) => (
                        <span
                          key={tech}
                          className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-mono text-ghost"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Risk disclosure */}
                  <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-red-400">
                        Risk Disclosure
                      </p>
                    </div>
                    <p className="text-[10px] text-red-300/80 leading-relaxed font-medium italic mb-1">
                      DO NOT sign transactions you don't understand.
                    </p>
                    <p className="text-[10px] text-muted leading-relaxed">
                      This is an experimental beta. The AI analysis is an aid, not a guarantee.
                      Always verify the destination address and amount inside your wallet popup before signing.
                      Blockchain transactions are irreversible.
                    </p>
                  </div>
                </div>
              )}

              {/* ── GUIDE TAB ── */}
              {activeTab === "guide" && (
                <div className="p-5 sm:p-7 space-y-4">
                  <p className="text-[10px] text-muted uppercase tracking-widest font-bold mb-4">
                    Step-by-step Guide
                  </p>
                  {steps.map(({ icon: Icon, color, bg, title, desc }) => (
                    <div
                      key={title}
                      className={`flex gap-4 p-4 rounded-xl border ${bg} bg-opacity-5`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 ${bg}`}
                      >
                        <Icon className={`w-4 h-4 ${color}`} />
                      </div>
                      <div>
                        <p className={`text-[11px] font-bold ${color} mb-1`}>{title}</p>
                        <p className="text-[10px] text-ghost leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}

                  <div className="mt-4 p-4 bg-white/3 border border-white/8 rounded-xl">
                    <p className="text-[9px] uppercase font-bold text-muted tracking-widest mb-2">
                      Tip
                    </p>
                    <p className="text-[10px] text-ghost leading-relaxed italic">
                      Run a small test transaction (e.g. 0.01 STX) first to verify everything works before sending larger amounts.
                    </p>
                  </div>
                </div>
              )}

              {/* ── FAQ TAB ── */}
              {activeTab === "faq" && (
                <div className="p-5 sm:p-7 space-y-2">
                  <p className="text-[9px] uppercase font-bold text-muted tracking-widest mb-4">
                    Frequently Asked Questions
                  </p>
                  {faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className="bg-white/3 border border-white/8 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                        className="w-full p-4 flex justify-between items-start text-left hover:bg-white/5 transition-colors gap-3"
                      >
                        <span className="text-[10px] font-bold text-white leading-relaxed">{faq.q}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-muted shrink-0 mt-0.5 transition-transform ${openFaq === idx ? "rotate-180" : ""}`}
                        />
                      </button>
                      <AnimatePresence>
                        {openFaq === idx && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="px-4 pb-4 border-t border-white/8">
                              <p className="text-[10px] text-ghost leading-relaxed pt-3">{faq.a}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-white/8 flex items-center justify-between shrink-0 bg-black/30">
              <span className="text-[8px] font-mono text-muted uppercase tracking-widest">
                TwinPay AI // Beta v0.1.0 // Stacks Mainnet
              </span>
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-brand text-ink font-bold rounded-lg text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Got it <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
