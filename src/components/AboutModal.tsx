/**
 * TwinPay AI - About & Guide Modal
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ShieldCheck,
  Bot,
  Wallet,
  ArrowRight,
  AlertTriangle,
  Layers,
  ChevronDown,
  Globe,
  Lock,
  Sparkles,
  Repeat,
  Users2,
  Landmark,
} from "lucide-react";
import { useState } from "react";
import { TokenIcon, ProtocolIcon } from "./icons/AssetIcons";

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
    a: "Currently STX (native Stacks), sBTC (Bitcoin-pegged on Stacks), aeUSDC, and USDCx. More tokens can be added by updating the TOKEN_CONTRACTS config.",
  },
  {
    q: "What is the AI actually doing?",
    a: "The AI (powered by Groq LLM) checks your monthly budget, your spending personality (conservative / balanced / aggressive), the recipient address validity, and proposes whether to approve, modify, or reject your transaction — with reasoning.",
  },
  {
    q: "What does the TwinPay Vault smart contract do?",
    a: "TwinPay Vault is a deployed Clarity contract on Stacks Mainnet that enforces a per-window STX spending limit on-chain. Once configured and active, every execute-transfer call is checked against your remaining allowance by the contract itself — not just by the app's interface.",
  },
  {
    q: "What is the TwinPay Multisig Vault?",
    a: "A separate, deployed Clarity contract for shared vaults — up to 5 owners with a configurable N-of-M approval threshold. Any owner can propose a transfer, but it only executes once enough owners approve.",
  },
  {
    q: "What is the AI Insight Digest?",
    a: "A proactive summary the AI generates from your recent activity and vault status — highlighting spending patterns, vault headroom, and one concrete suggestion. It's cached for a few hours so it feels like a check-in, not a spam notification.",
  },
  {
    q: "Does TwinPay manage my stacking for me?",
    a: "No. The BTC Yield panel is read-only — it shows live Proof-of-Transfer network parameters and your current stacking status, and links out to pool or liquid-stacking providers. TwinPay never moves your STX into stacking on your behalf.",
  },
  {
    q: "How does the sBTC Credit Line work?",
    a: "TwinPay doesn't run its own lending pool. The Credit Line panel shows your sBTC balance and a rough borrow estimate, then routes you directly to Zest Protocol — the largest sBTC-collateralized lending market on Stacks. TwinPay never holds your collateral.",
  },
  {
    q: "How do Recurring Payments execute?",
    a: "You schedule a payment once (amount, recipient, frequency). When it's due, TwinPay surfaces a 'Run now' action that routes through the exact same AI audit and wallet-signature flow as a one-off payment — there's no background auto-pay without your signature.",
  },
  {
    q: "Is my data stored anywhere?",
    a: "Transaction history, contacts, and recurring schedules are stored in Firebase Firestore keyed to your wallet address. Your wallet private keys are never accessible to TwinPay — all signing happens inside your Stacks wallet.",
  },
  {
    q: "What does 'Bitcoin-secured' mean?",
    a: "Stacks settles its blocks anchored to Bitcoin, meaning your transaction finality is backed by Bitcoin's proof-of-work. This gives Stacks transactions a higher security guarantee than chains that don't anchor to Bitcoin.",
  },
];

const steps = [
  {
    icon: Wallet,
    color: "text-brand-orange",
    title: "1. Connect Your Wallet",
    desc: "Tap 'Connect' in the top bar. Leather or Xverse will open and ask you to authorize TwinPay. Your keys stay in your wallet — always.",
  },
  {
    icon: Bot,
    color: "text-brass",
    title: "2. Set Your Budget & Personality",
    desc: "Open Settings and define your monthly budget and spending personality. The AI uses these to decide whether to approve or flag a transaction.",
  },
  {
    icon: Layers,
    color: "text-blue-400",
    title: "3. Propose a Transaction",
    desc: "Describe what you're paying for, the amount, the asset (STX / sBTC / aeUSDC / USDCx), and the recipient. Tap 'Initialize AI Analysis'.",
  },
  {
    icon: ShieldCheck,
    color: "text-ok",
    title: "4. AI Audits & Decides",
    desc: "TwinPay AI audits the recipient address, compares the amount to your budget, and returns a verdict — Approve, Modify, or Reject — with a confidence score and reason.",
  },
  {
    icon: Lock,
    color: "text-brand-orange",
    title: "5. Authorize & Sign",
    desc: "If you agree with the AI's decision, tap 'Authorize & Execute'. Your wallet opens and shows the exact transaction for you to review and sign.",
  },
  {
    icon: Globe,
    color: "text-purple-400",
    title: "6. Confirmed on Stacks",
    desc: "Once signed, the transaction broadcasts to Stacks Mainnet and anchors to Bitcoin. Track it anytime from the History tab.",
  },
];

const features = [
  { icon: Bot, label: "AI Decision Engine", desc: "Groq LLM analyzes every transaction", color: "text-brand-orange" },
  { icon: ShieldCheck, label: "TwinPay Vault", desc: "Live Clarity contract enforcing limits", color: "text-blue-400" },
  { icon: Users2, label: "Multisig Vault", desc: "N-of-M shared vault, live on Mainnet", color: "text-ok" },
  { icon: Landmark, label: "sBTC Credit Line", desc: "Borrow via Zest Protocol, no custody", color: "text-brass" },
  { icon: Sparkles, label: "AI Insight Digest", desc: "Proactive spending & vault check-ins", color: "text-brass" },
  { icon: Repeat, label: "Recurring Payments", desc: "Schedule, then audit & sign when due", color: "text-brand-orange" },
];

const tokens = [
  { key: "STX", name: "Stacks", note: "Native asset" },
  { key: "sBTC", name: "sBTC", note: "1:1 Bitcoin-pegged" },
  { key: "aeUSDC", name: "aeUSDC", note: "Bridged USDC" },
  { key: "USDCx", name: "USDCx", note: "Stablecoin" },
];

const protocols = [
  { key: "zest" as const, name: "Zest Protocol", note: "sBTC-backed lending" },
  { key: "xverse" as const, name: "Xverse", note: "Wallet & pooled stacking" },
  { key: "leather" as const, name: "Leather", note: "Wallet & in-app stacking" },
  { key: "stackingdao" as const, name: "StackingDAO", note: "Liquid stacking" },
];

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"about" | "guide" | "faq">("about");

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative w-full max-w-xl panel-glass rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(255,122,24,0.10)] flex flex-col ledger-strip"
            style={{ maxHeight: "92vh" }}
          >
            <div className="p-4 sm:p-6 border-b border-white/8 flex items-center justify-between shrink-0 bg-gradient-to-r from-brand-orange/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-brand rounded-xl flex items-center justify-center font-black text-ink text-lg glow-brand-sm">
                  T
                </div>
                <div>
                  <h2 className="font-display text-base text-white">
                    TwinPay AI
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[8px] bg-brand-orange/20 text-brand-orange px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
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

            <div className="flex border-b border-white/8 shrink-0 bg-black/20">
              {(["about", "guide", "faq"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                    activeTab === tab
                      ? "text-brand-orange border-b-2 border-brand-orange bg-brand-orange/5"
                      : "text-muted hover:text-ghost"
                  }`}
                >
                  {tab === "about" ? "About" : tab === "guide" ? "How to Use" : "FAQ"}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {activeTab === "about" && (
                <div className="p-5 sm:p-7 space-y-7">
                  <div className="p-5 rounded-2xl border border-brand-orange/20 bg-gradient-to-br from-brand-orange/8 to-transparent ledger-strip">
                    <p className="font-display text-lg text-white mb-2">
                      What is TwinPay AI?
                    </p>
                    <p className="text-[11px] text-ghost leading-relaxed">
                      TwinPay AI is an <span className="text-white font-semibold">AI-powered payment agent</span> built on the{" "}
                      <span className="text-white font-semibold">Stacks blockchain</span> — a Layer 2 network secured by Bitcoin.
                      Instead of manually constructing blockchain transactions, you describe what you want to pay for in plain
                      English, and the AI audits, plans, and prepares the transaction for your wallet signature. Two on-chain
                      Clarity contracts — a personal Vault and a shared Multisig Vault — let you enforce spending rules at the
                      protocol level, not just in the app's interface.
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] uppercase font-bold text-muted tracking-widest mb-3">
                      What's Inside
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {features.map(({ icon: Icon, label, desc, color }) => (
                        <div key={label} className="p-3 bg-white/4 border border-white/8 rounded-xl">
                          <Icon className={`w-4 h-4 ${color} mb-2`} />
                          <p className="text-[10px] font-bold text-white mb-0.5">{label}</p>
                          <p className="text-[9px] text-muted leading-relaxed">{desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] uppercase font-bold text-muted tracking-widest mb-3">
                      Tokens Supported
                    </p>
                    <div className="grid grid-cols-2 gap-2.5 mb-5">
                      {tokens.map((t) => (
                        <div key={t.key} className="flex items-center gap-2.5 p-2.5 bg-white/4 border border-white/8 rounded-xl">
                          <TokenIcon token={t.key} className="w-7 h-7 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-white truncate">{t.name}</p>
                            <p className="text-[8px] text-muted truncate">{t.note}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="text-[9px] uppercase font-bold text-muted tracking-widest mb-3">
                      Protocols We Connect To
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {protocols.map((p) => (
                        <div key={p.key} className="flex items-center gap-2.5 p-2.5 bg-white/4 border border-white/8 rounded-xl">
                          <ProtocolIcon protocol={p.key} className="w-7 h-7 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-white truncate">{p.name}</p>
                            <p className="text-[8px] text-muted truncate">{p.note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[9px] text-muted mt-3 leading-relaxed italic">
                      TwinPay never custodies your funds on these protocols — it audits and links out; you always sign directly.
                    </p>
                  </div>

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

              {activeTab === "guide" && (
                <div className="p-5 sm:p-7 space-y-3">
                  <p className="text-[10px] text-muted uppercase tracking-widest font-bold mb-4">
                    Step-by-step Guide
                  </p>
                  {steps.map(({ icon: Icon, color, title, desc }) => (
                    <div
                      key={title}
                      className="flex gap-4 p-4 rounded-xl border border-white/8 bg-white/4"
                    >
                      <div className="w-9 h-9 rounded-full border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
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
