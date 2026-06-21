/**
 * TwinPay AI - Landing Page
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import {
  Bot,
  ShieldCheck,
  Zap,
  ArrowRight,
  Github,
  Info,
  ChevronDown,
  Wallet,
  Lock,
  Globe,
  Cpu,
  Sparkles,
  Bitcoin,
  Repeat,
  Award,
  HelpCircle,
  Plus,
} from "lucide-react";

interface LandingPageProps {
  onEnterApp: () => void;
  onAbout: () => void;
}

/* ── Floating transaction card mock data ── */
const MOCK_TXS = [
  { item: "Coffee at Starbucks", amount: "0.82 STX", decision: "approve", conf: "97%" },
  { item: "Netflix Subscription", amount: "4.20 STX", decision: "approve", conf: "91%" },
  { item: "Luxury Watch", amount: "840 STX", decision: "reject", conf: "88%" },
  { item: "Groceries", amount: "12.5 STX", decision: "approve", conf: "99%" },
];

const FEATURES = [
  {
    icon: Bot,
    color: "#FF7A18",
    glow: "rgba(255,122,24,0.25)",
    title: "AI Decision Engine",
    desc: "Groq LLM analyzes every transaction against your budget, personality, and spending history — approving, modifying, or rejecting in milliseconds.",
    tag: "Powered by Groq",
  },
  {
    icon: Lock,
    color: "#FFB066",
    glow: "rgba(255,176,102,0.2)",
    title: "Bitcoin-Secured",
    desc: "Stacks anchors every block to Bitcoin. Your payments inherit Bitcoin's proof-of-work finality — the most battle-tested security in crypto.",
    tag: "Stacks × Bitcoin",
  },
  {
    icon: ShieldCheck,
    color: "#FF7A18",
    glow: "rgba(255,122,24,0.2)",
    title: "On-Chain Address Audit",
    desc: "Every recipient address is verified on Stacks Mainnet via Hiro API before you sign. Zero tolerance for typos or suspicious contracts.",
    tag: "Hiro API",
  },
];

const STATS = [
  { label: "Built on", value: "Stacks L2" },
  { label: "Secured by", value: "Bitcoin" },
  { label: "Custody", value: "Non-custodial" },
  { label: "Source", value: "Open Source" },
  { label: "Network", value: "Mainnet" },
];

const GROWTH_FEATURES = [
  {
    icon: Sparkles,
    accent: "brass",
    title: "AI Insight Digest",
    desc: "Your co-pilot checks in proactively — spending trends, vault status, and one concrete next step, without you having to ask.",
  },
  {
    icon: Bitcoin,
    accent: "brass",
    title: "BTC Yield",
    desc: "See live Stacking network parameters and pooled or liquid stacking options for the STX you're not actively spending.",
  },
  {
    icon: Repeat,
    accent: "orange",
    title: "Recurring Payments",
    desc: "Schedule rent, subscriptions, or allowances once. TwinPay AI surfaces it when due and routes it through the same audit flow.",
  },
  {
    icon: Award,
    accent: "ok",
    title: "Trust Score",
    desc: "A running record of your approved, efficient payments — the foundation for an on-chain reputation system.",
  },
  {
    icon: ShieldCheck,
    accent: "orange",
    title: "TwinPay Vault",
    desc: "A live Clarity smart contract enforcing your own spending limit on-chain — not just a UI promise.",
  },
  {
    icon: Bot,
    accent: "brass",
    title: "Multisig & Credit Line",
    desc: "Shared vaults with threshold approval, and sBTC-collateralized credit — on the roadmap, built on the same contract foundation.",
  },
];

const FAQS = [
  {
    q: "Is TwinPay AI custodial?",
    a: "No. TwinPay never holds your funds. Every transfer is signed by you in your own wallet (Leather or Xverse) and settles directly on Stacks Mainnet. The AI only proposes and audits — it cannot move funds without your signature.",
  },
  {
    q: "What does the TwinPay Vault contract actually enforce?",
    a: "The Vault is a deployed Clarity smart contract that lets you set a per-window STX spending limit on-chain. Once active, execute-transfer calls are checked against your remaining allowance by the contract itself, not just by the app's UI.",
  },
  {
    q: "How does the AI make decisions?",
    a: "TwinPay sends your budget, personality setting, balance, and recent transaction history to an LLM (via Groq), which returns an approve/modify/reject decision with a confidence score and a written reason. You always see the reasoning before signing.",
  },
  {
    q: "What happens if the AI rejects a payment?",
    a: "Nothing is broadcast. A rejected or modified decision simply shows you the AI's reasoning — you can adjust the amount, change the recipient, or override and proceed at your own discretion.",
  },
  {
    q: "Which assets are supported?",
    a: "STX natively, plus SIP-010 tokens including sBTC, aeUSDC, and USDCx. The Vault contract currently enforces limits on native STX transfers.",
  },
  {
    q: "Is this open source?",
    a: "Yes — the frontend and the Vault contract source are both available on GitHub, linked in the footer.",
  },
];

/* ── Animated floating card ── */
function FloatingCard({ tx, delay, x, y }: { tx: typeof MOCK_TXS[0]; delay: number; x: number; y: number; key?: string | number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{
        opacity: [0, 1, 1, 0.7],
        y: [30, y, y - 12, y],
      }}
      transition={{
        duration: 6,
        delay,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
      }}
      style={{ left: `${x}%`, top: `${y}%` }}
      className="absolute w-52 pointer-events-none"
    >
      <div className="bg-[#11141C]/90 backdrop-blur-md border border-[#232936] rounded-xl p-3 shadow-2xl">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[9px] uppercase tracking-widest text-[#6E7686] font-bold">AI Decision</span>
          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
            tx.decision === "approve"
              ? "bg-[#FF7A18]/10 text-[#FF7A18]"
              : "bg-red-500/10 text-red-400"
          }`}>
            {tx.decision}
          </span>
        </div>
        <p className="text-[11px] text-white font-medium mb-1 truncate">{tx.item}</p>
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-mono text-[#FFB066]">{tx.amount}</span>
          <span className="text-[9px] text-[#6E7686]">conf: {tx.conf}</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Animated grid lines ── */
function GridLines() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="opacity-[0.04]">
        <defs>
          <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M 44 0 L 0 0 0 44" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

/* ── Typing animation ── */
function TypingText({ texts }: { texts: string[] }) {
  const [idx, setIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const target = texts[idx];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && displayed.length < target.length) {
      timeout = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), 60);
    } else if (!deleting && displayed.length === target.length) {
      timeout = setTimeout(() => setDeleting(true), 2200);
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 30);
    } else if (deleting && displayed.length === 0) {
      setDeleting(false);
      setIdx((i) => (i + 1) % texts.length);
    }

    return () => clearTimeout(timeout);
  }, [displayed, deleting, idx, texts]);

  return (
    <span className="text-gradient-brand">
      {displayed}
      <span className="animate-pulse">|</span>
    </span>
  );
}

export default function LandingPage({ onEnterApp, onAbout }: LandingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#07090D] text-[#F4F4F7] overflow-x-hidden">

      {/* ── Ambient background glows ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-[#FF7A18]/8 blur-[120px]" />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full bg-[#C2410C]/6 blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[300px] rounded-full bg-[#FFB066]/5 blur-[100px]" />
        <GridLines />
      </div>

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 sm:px-10 border-b border-white/5 bg-[#07090D]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <img
            src="/TwinPayAI_Logo.png"
            alt="TwinPay AI Logo"
            className="w-8 h-8 rounded-lg object-contain shadow-[0_0_14px_rgba(255,122,24,0.35)]"
          />
          <span className="text-sm font-black uppercase italic bg-gradient-to-r from-[#FFB066] to-[#FF7A18] bg-clip-text text-transparent">
            TwinPay AI
          </span>
          <span className="hidden sm:inline text-[8px] bg-[#FF7A18]/15 text-[#FF7A18] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
            Beta
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onAbout}
            className="hidden sm:flex items-center gap-1.5 text-[#6E7686] hover:text-white text-xs font-medium transition-colors"
          >
            <Info className="w-3.5 h-3.5" /> Learn More
          </button>
          <button
            onClick={onEnterApp}
            className="flex items-center gap-2 px-4 h-9 bg-gradient-to-r from-[#FFB066] via-[#FF7A18] to-[#C2410C] text-[#07090D] rounded-lg text-[10px] font-black uppercase tracking-wider shadow-[0_0_14px_rgba(255,122,24,0.3)] hover:shadow-[0_0_22px_rgba(255,122,24,0.5)] hover:scale-105 transition-all active:scale-95"
          >
            Launch App <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <motion.section
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-16 pb-24 z-10"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FF7A18]/10 border border-[#FF7A18]/25 rounded-full mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A18] animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF7A18]">
            Live on Stacks Mainnet
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase leading-[0.95] tracking-tight mb-6 max-w-4xl"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Your AI Agent for{" "}
          <br className="hidden sm:block" />
          <TypingText texts={["Bitcoin Payments.", "Stacks Transfers.", "Smart Finance.", "Secure Crypto."]} />
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-sm sm:text-base text-[#9CA3AF] max-w-xl leading-relaxed mb-10"
        >
          Describe what you want to pay. TwinPay AI audits the transaction,
          checks your budget, and prepares the exact payload for your wallet —
          secured by Bitcoin finality.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-16"
        >
          <button
            onClick={onEnterApp}
            className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#FFB066] via-[#FF7A18] to-[#C2410C] text-[#07090D] font-black uppercase text-sm tracking-widest rounded-xl shadow-[0_0_30px_rgba(255,122,24,0.35)] hover:shadow-[0_0_50px_rgba(255,122,24,0.55)] hover:scale-105 transition-all active:scale-95"
          >
            <Wallet className="w-4 h-4" />
            Launch App
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <a
            href="https://github.com/0xward/TwinPayAI"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-6 py-4 bg-white/5 border border-white/10 text-white font-bold uppercase text-xs tracking-widest rounded-xl hover:bg-white/10 transition-all"
          >
            <Github className="w-4 h-4" /> View Source
          </a>
        </motion.div>

        {/* Floating cards */}
        <div className="relative w-full max-w-3xl h-56 sm:h-72 mx-auto">
          {/* Center mock terminal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-80 z-20"
          >
            <div className="bg-[#0B0E14]/95 backdrop-blur-xl border border-[#232936] rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(255,122,24,0.12)]">
              <div className="px-4 py-3 bg-[#11141C] border-b border-[#232936] flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                </div>
                <span className="text-[9px] font-mono text-[#6E7686] ml-2">TwinPay AI // Engine</span>
              </div>
              <div className="p-4 font-mono text-[10px] space-y-1.5">
                {[
                  { c: "text-[#6E7686]", t: "[SYSTEM] Initialized..." },
                  { c: "text-[#FF7A18]", t: "[WALLET] SP3FA...connected" },
                  { c: "text-[#9CA3AF]", t: "[AI] Analyzing transaction..." },
                  { c: "text-[#FF7A18]", t: "[AI] APPROVE — conf: 97%" },
                  { c: "text-[#9CA3AF]", t: "[TX] Broadcasting to Stacks..." },
                  { c: "text-[#FFB066]", t: "[OK] Anchored to Bitcoin ✓" },
                ].map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + i * 0.18 }}
                    className={line.c}
                  >
                    {line.t}
                  </motion.div>
                ))}
                <motion.div
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="text-[#FF7A18]"
                >
                  █
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Floating cards around terminal */}
          {MOCK_TXS.map((tx, i) => (
            <FloatingCard
              key={i}
              tx={tx}
              delay={1.2 + i * 0.4}
              x={i < 2 ? (i === 0 ? 2 : 68) : (i === 2 ? 5 : 65)}
              y={i < 2 ? 5 : 55}
            />
          ))}
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#6E7686]"
        >
          <span className="text-[9px] uppercase tracking-widest font-bold">Scroll</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ══════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════ */}
      <section className="relative z-10 border-y border-white/6 bg-[#0B0E14]/60 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center">
          {/* Scrolling marquee on mobile, static on desktop */}
          <motion.div
            className="flex items-center gap-0 sm:gap-0 w-full"
          >
            <div className="flex items-center w-full overflow-x-auto no-scrollbar">
              {[...STATS, ...STATS].map((stat, i) => (
                <div
                  key={i}
                  className="flex items-center gap-6 px-8 py-4 border-r border-white/6 shrink-0"
                >
                  <div className="text-center">
                    <div className="text-[8px] uppercase tracking-[0.2em] text-[#6E7686] font-bold mb-0.5">
                      {stat.label}
                    </div>
                    <div className="text-xs font-black text-[#FF7A18] uppercase tracking-wider">
                      {stat.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURES
      ══════════════════════════════════════ */}
      <section className="relative z-10 px-6 sm:px-10 py-24 sm:py-32 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full mb-5">
            <Cpu className="w-3 h-3 text-[#FF7A18]" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">
              Core Protocol
            </span>
          </div>
          <h2
            className="text-3xl sm:text-5xl font-black uppercase leading-tight tracking-tight mb-4"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Built different.
            <br />
            <span className="bg-gradient-to-r from-[#FFB066] to-[#FF7A18] bg-clip-text text-transparent">
              Secured by Bitcoin.
            </span>
          </h2>
          <p className="text-sm text-[#6E7686] max-w-lg mx-auto leading-relaxed">
            TwinPay combines behavioral AI with Stacks blockchain infrastructure to make crypto payments intelligent, auditable, and safe.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, color, glow, title, desc, tag }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group relative p-6 bg-[#0B0E14] border border-[#232936] rounded-2xl overflow-hidden cursor-default"
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle at 30% 30%, ${glow}, transparent 65%)` }}
              />

              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 relative"
                style={{ background: `${color}15`, border: `1px solid ${color}30` }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>

              {/* Tag */}
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full mb-3"
                style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
                <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color }}>
                  {tag}
                </span>
              </div>

              <h3 className="text-sm font-black uppercase tracking-wide text-white mb-3">{title}</h3>
              <p className="text-[11px] text-[#6E7686] leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          HOW IT WORKS (mini)
      ══════════════════════════════════════ */}
      <section className="relative z-10 px-6 sm:px-10 py-16 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            {[
              { step: "01", label: "Describe", desc: "Tell TwinPay what you want to pay for" },
              { step: "02", label: "AI Audits", desc: "Budget check + address verification" },
              { step: "03", label: "You Sign", desc: "Review & sign in Leather or Xverse" },
              { step: "04", label: "Bitcoin✓", desc: "Settled on Stacks, anchored to BTC" },
            ].map(({ step, label, desc }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex-1 flex flex-col items-center text-center relative"
              >
                {i < 3 && (
                  <div className="hidden sm:block absolute right-0 top-4 w-full h-px bg-gradient-to-r from-[#FF7A18]/30 to-transparent translate-x-1/2" />
                )}
                <div className="w-10 h-10 rounded-full border border-[#FF7A18]/40 flex items-center justify-center mb-3 bg-[#FF7A18]/8 relative z-10">
                  <span className="text-[10px] font-black text-[#FF7A18]">{step}</span>
                </div>
                <p className="text-xs font-black uppercase tracking-wider text-white mb-1">{label}</p>
                <p className="text-[10px] text-[#6E7686] leading-relaxed max-w-[120px]">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          BEYOND PAYMENTS (growth features)
      ══════════════════════════════════════ */}
      <section className="relative z-10 px-6 sm:px-10 py-24 sm:py-32 max-w-6xl mx-auto border-t border-white/5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brass/10 border border-brass/25 rounded-full mb-5">
            <Sparkles className="w-3 h-3 text-brass" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-brass">
              Beyond a single payment
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl leading-tight tracking-tight mb-4 text-white">
            One payment is a start.
            <br />
            <span className="text-gradient-brass">A financial co-pilot is the point.</span>
          </h2>
          <p className="text-sm text-[#6E7686] max-w-lg mx-auto leading-relaxed">
            TwinPay grows with you — from a single AI-audited transfer to ongoing insight, yield, automation, and a verifiable track record.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {GROWTH_FEATURES.map(({ icon: Icon, accent, title, desc }, i) => {
            const colorMap: Record<string, { text: string; bg: string; border: string }> = {
              brass: { text: "text-brass", bg: "bg-brass/10", border: "border-brass/25" },
              orange: { text: "text-[#FF7A18]", bg: "bg-[#FF7A18]/10", border: "border-[#FF7A18]/25" },
              ok: { text: "text-ok", bg: "bg-ok/10", border: "border-ok/25" },
            };
            const c = colorMap[accent];
            return (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="panel-quiet ledger-strip rounded-2xl p-6 text-left"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${c.bg} border ${c.border}`}>
                  <Icon className={`w-5 h-5 ${c.text}`} />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{title}</h3>
                <p className="text-[11px] text-[#6E7686] leading-relaxed">{desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════ */}
      <section className="relative z-10 px-6 sm:px-10 py-20 sm:py-28">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center relative"
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#FF7A18]/5 via-[#FFB066]/8 to-[#FF7A18]/5 border border-[#FF7A18]/15 blur-sm" />
          <div className="relative p-10 sm:p-14 rounded-3xl bg-[#0B0E14]/80 border border-[#FF7A18]/15 backdrop-blur">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FFB066] via-[#FF7A18] to-[#C2410C] flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(255,122,24,0.4)] overflow-hidden">
              <img src="/TwinPayAI_Logo.png" alt="TwinPay AI Logo" className="w-10 h-10 object-contain" />
            </div>
            <h2
              className="text-2xl sm:text-4xl font-black uppercase tracking-tight mb-4"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Ready to pay{" "}
              <span className="bg-gradient-to-r from-[#FFB066] to-[#FF7A18] bg-clip-text text-transparent">
                smarter?
              </span>
            </h2>
            <p className="text-sm text-[#6E7686] mb-8 max-w-sm mx-auto leading-relaxed">
              Connect your Leather or Xverse wallet and let TwinPay AI handle the complexity of blockchain payments.
            </p>
            <button
              onClick={onEnterApp}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#FFB066] via-[#FF7A18] to-[#C2410C] text-[#07090D] font-black uppercase text-sm tracking-widest rounded-xl shadow-[0_0_30px_rgba(255,122,24,0.35)] hover:shadow-[0_0_50px_rgba(255,122,24,0.55)] hover:scale-105 transition-all active:scale-95"
            >
              <Wallet className="w-4 h-4" />
              Launch TwinPay AI
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════
          FAQ
      ══════════════════════════════════════ */}
      <FaqSection />

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-white/6 px-6 sm:px-10 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-gradient-to-br from-[#FFB066] via-[#FF7A18] to-[#C2410C] rounded-lg flex items-center justify-center overflow-hidden">
              <img src="/TwinPayAI_Logo.png" alt="TwinPay AI Logo" className="w-5 h-5 object-contain" />
            </div>
            <div>
              <span className="text-xs font-black uppercase italic bg-gradient-to-r from-[#FFB066] to-[#FF7A18] bg-clip-text text-transparent">
                TwinPay AI
              </span>
              <span className="text-[9px] text-[#6E7686] ml-2">Beta v0.1.0 // Stacks Mainnet</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={onAbout}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#6E7686] hover:text-[#FF7A18] transition-colors"
            >
              <Info className="w-3 h-3" /> About
            </button>
            <a
              href="https://github.com/0xward/TwinPayAI"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#6E7686] hover:text-[#FF7A18] transition-colors"
            >
              <Github className="w-3 h-3" /> GitHub
            </a>
            <a
              href="https://www.stacks.co"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#6E7686] hover:text-[#FF7A18] transition-colors"
            >
              <Globe className="w-3 h-3" /> Stacks
            </a>
          </div>

          <p className="text-[9px] text-[#6E7686] font-mono text-center sm:text-right">
            Non-custodial · Open Source · Apache-2.0
          </p>
        </div>
      </footer>

    </div>
  );
}

/* ── FAQ accordion ── */
function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="relative z-10 px-6 sm:px-10 py-20 sm:py-28 border-t border-white/5">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full mb-5">
            <HelpCircle className="w-3 h-3 text-[#FF7A18]" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">
              Frequently Asked
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl text-white">Questions, answered</h2>
        </motion.div>

        <div className="space-y-3">
          {FAQS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={item.q}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="border border-white/8 rounded-xl bg-[#0B0E14]/60 overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-bold text-white">{item.q}</span>
                  <Plus
                    className={`w-4 h-4 text-[#FF7A18] shrink-0 transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}
                  />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-[12px] text-[#9CA3AF] leading-relaxed">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
