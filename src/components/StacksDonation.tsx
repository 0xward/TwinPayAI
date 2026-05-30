/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { openSTXTransfer } from "@stacks/connect";
import { Heart, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { network, APP_DETAILS } from "../stacks-config";

interface StacksDonationProps {
  isConnected: boolean;
}

// TODO: Replace with the real Stacks donation address before going live.
const DONATION_ADDRESS = "SP000000000000000000002Q6VF78";

export default function StacksDonation({ isConnected }: StacksDonationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState<string>("1");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isPending, setIsPending] = useState(false);
  const [hasWallet, setHasWallet] = useState(false);

  useEffect(() => {
    // Detect an installed Stacks wallet provider (Leather / Xverse).
    if (typeof window !== "undefined") {
      const w = window as any;
      setHasWallet(Boolean(w.LeatherProvider || w.StacksProvider || w.XverseProviders));
    }
  }, []);

  const prests = ["1", "5", "10"];

  const handleDonate = () => {
    const finalAmount = customAmount || amount;
    if (!finalAmount || isNaN(Number(finalAmount)) || Number(finalAmount) <= 0) return;

    // STX uses microSTX (1 STX = 1,000,000 microSTX).
    const microStx = BigInt(Math.round(Number(finalAmount) * 1_000_000)).toString();

    setIsPending(true);
    openSTXTransfer({
      recipient: DONATION_ADDRESS,
      amount: microStx,
      memo: "TwinPay AI donation",
      network,
      appDetails: APP_DETAILS,
      onFinish: () => {
        setIsPending(false);
        setIsOpen(false);
        setCustomAmount("");
        setAmount("1");
      },
      onCancel: () => {
        setIsPending(false);
      },
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 w-72 bg-surface-bright border border-line p-5 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden"
          >
            {hasWallet && (
              <div className="absolute top-0 right-0 bg-brand-green text-ink text-[8px] font-black uppercase px-2 py-1 rounded-bl-lg">
                Wallet Ready
              </div>
            )}

            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 text-ghost hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold uppercase tracking-widest text-brand-green mb-1 flex items-center gap-2">
              <Heart className="w-4 h-4 fill-brand-green" /> Donate
            </h3>
            <p className="text-[10px] text-muted italic mb-4 leading-relaxed">
              Support the developer with STX. Fast & secure {hasWallet ? "via your Stacks wallet" : "via the Stacks network"}.
            </p>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {prests.map(p => (
                <button
                  key={p}
                  onClick={() => { setAmount(p); setCustomAmount(""); }}
                  className={`py-2 rounded-lg border text-xs font-bold font-mono transition-all ${
                    amount === p && !customAmount
                      ? "bg-brand-green/20 border-brand-green text-brand-green"
                      : "bg-ink border-line text-muted hover:border-ghost/50"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="mb-4">
              <div className="relative">
                <input
                  type="number"
                  placeholder="Custom amount..."
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setAmount("");
                  }}
                  className="w-full bg-ink border border-line p-3 pr-12 rounded-lg font-mono text-sm focus:border-brand-green outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ghost text-xs font-bold">
                  STX
                </span>
              </div>
            </div>

            <button
              onClick={handleDonate}
              disabled={isPending || (!isConnected)}
              className="w-full py-3 bg-brand-green text-ink font-bold rounded-lg uppercase text-xs tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Waiting..." : !isConnected ? "Connect Wallet" : "Send Donation"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 ${
          isOpen ? "bg-surface border border-brand-green" : "bg-brand-green border border-transparent shadow-[0_0_20px_rgba(85,70,255,0.4)]"
        }`}
      >
        <Heart className={`w-6 h-6 ${isOpen ? "text-brand-green" : "text-ink"}`} fill={isOpen ? "none" : "currentColor"} />
      </button>
    </div>
  );
}
