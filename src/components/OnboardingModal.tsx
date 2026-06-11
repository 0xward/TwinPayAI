import { motion, AnimatePresence } from "motion/react";
import { Wallet, Settings, FileText, Bot, ShieldCheck, X, ArrowRight, Check } from "lucide-react";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
  isConnected: boolean;
}

const steps = [
  { icon: Wallet, title: "Connect Wallet", desc: "Use Leather or Xverse (Stacks). Non‑custodial." },
  { icon: Settings, title: "Set Budget & Personality", desc: "Conservative, balanced, or aggressive. AI learns your style." },
  { icon: FileText, title: "Propose a Payment", desc: "Describe what you're buying, recipient, amount." },
  { icon: Bot, title: "AI Audits & Advises", desc: "Approve, modify, or reject with reasoning." },
  { icon: ShieldCheck, title: "Sign & Settle", desc: "Review and sign in wallet. Secured by Bitcoin finality." },
];

export default function OnboardingModal({ isOpen, onClose, onConnect, isConnected }: OnboardingModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            className="w-full max-w-lg bg-[#111827] border border-white/10 rounded-3xl shadow-[0_0_60px_rgba(0,255,140,0.1)] overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-brand-gold">
                Welcome to TwinPay AI
              </h2>
              <button onClick={onClose} className="text-gray-500 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-brand-green/10 border border-brand-green/30 flex items-center justify-center text-brand-green shrink-0">
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">{idx + 1}. {step.title}</h3>
                    <p className="text-gray-400 text-xs mt-1">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-white/5 flex items-center justify-between bg-white/5">
              <span className="text-xs text-gray-400">
                {isConnected ? "✅ Wallet connected" : "Step 1: Connect wallet"}
              </span>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-gradient-to-r from-brand-green to-brand-gold text-black font-bold rounded-xl text-sm flex items-center gap-2 hover:scale-105 transition-transform"
              >
                Got it <Check className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}