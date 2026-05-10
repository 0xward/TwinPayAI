import { useState, useEffect } from "react";
import { useSendTransaction, useAccount } from "wagmi";
import { parseEther } from "viem";
import { Heart, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

const DONATION_ADDRESS = "0x2A6b5204B83C7619c90c4EB6b5365AA0b7d912F7";

export default function MiniPayDonation() {
  const { isConnected } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState<string>("1");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isMiniPay, setIsMiniPay] = useState(false);
  
  const { sendTransaction, isPending, isSuccess } = useSendTransaction();

  useEffect(() => {
    // Check if running inside MiniPay
    if (typeof window !== "undefined" && window.ethereum && (window.ethereum as any).isMiniPay) {
      setIsMiniPay(true);
    } else {
      setIsMiniPay(false);
    }
  }, []);

  const prests = ["1", "5", "10"];

  const handleDonate = () => {
    const finalAmount = customAmount || amount;
    if (!finalAmount || isNaN(Number(finalAmount)) || Number(finalAmount) <= 0) return;
    
    sendTransaction({
      to: DONATION_ADDRESS,
      value: parseEther(finalAmount.toString()),
    });
  };

  useEffect(() => {
    if (isSuccess) {
      setIsOpen(false);
      setCustomAmount("");
      setAmount("1");
    }
  }, [isSuccess]);

  // Don't show if not connected? Actually, they should be able to see it and it prompts wallet on submit if wagmi auto prompts, but better to hide or show it.
  // The user says "mempunyai fitur minipay... auto konek... tambahkan mengapung"
  
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
            {isMiniPay && (
              <div className="absolute top-0 right-0 bg-celo-green text-ink text-[8px] font-black uppercase px-2 py-1 rounded-bl-lg">
                MiniPay Ready
              </div>
            )}
            
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 text-ghost hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold uppercase tracking-widest text-celo-green mb-1 flex items-center gap-2">
              <Heart className="w-4 h-4 fill-celo-green" /> Donate
            </h3>
            <p className="text-[10px] text-muted italic mb-4 leading-relaxed">
              Support the developer with CELO. Fast & secure {isMiniPay ? "via MiniPay" : "via Celo network"}.
            </p>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {prests.map(p => (
                <button
                  key={p}
                  onClick={() => { setAmount(p); setCustomAmount(""); }}
                  className={`py-2 rounded-lg border text-xs font-bold font-mono transition-all ${
                    amount === p && !customAmount
                      ? "bg-celo-green/20 border-celo-green text-celo-green"
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
                  className="w-full bg-ink border border-line p-3 pr-12 rounded-lg font-mono text-sm focus:border-celo-green outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ghost text-xs font-bold">
                  CELO
                </span>
              </div>
            </div>

            <button
              onClick={handleDonate}
              disabled={isPending || (!isConnected)}
              className="w-full py-3 bg-celo-green text-ink font-bold rounded-lg uppercase text-xs tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Waiting..." : !isConnected ? "Connect Wallet" : "Send Donation"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 ${
          isOpen ? "bg-surface border border-celo-green" : "bg-celo-green border border-transparent shadow-[0_0_20px_rgba(53,208,127,0.4)]"
        }`}
      >
        <Heart className={`w-6 h-6 ${isOpen ? "text-celo-green" : "text-ink"}`} fill={isOpen ? "none" : "currentColor"} />
      </button>
    </div>
  );
}
