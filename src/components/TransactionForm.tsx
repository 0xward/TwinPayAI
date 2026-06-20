/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, User, CheckCircle, XCircle, Loader, Zap } from "lucide-react";
import { TransactionInput, TransactionToken, Contact } from "../types";
import { resolveBnsName } from "../stacks-config";

interface TransactionFormProps {
  onSubmit: (tx: TransactionInput) => void;
  isLoading: boolean;
  balance?: number;
  contacts?: Contact[];
}

type BnsStatus = "idle" | "resolving" | "resolved" | "error";

// Avatar color from wallet address initials
function getAvatarColor(str: string) {
  const colors = [
    "#FF7A18", "#FFB066", "#C2410C", "#F97316",
    "#FB923C", "#FDBA74", "#EA580C", "#9A3412",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function TransactionForm({
  onSubmit,
  isLoading,
  balance = 0,
  contacts = [],
}: TransactionFormProps) {
  const [item, setItem] = useState("");
  const [price, setPrice] = useState("");
  const [token, setToken] = useState<TransactionToken>("STX");
  const [recipient, setRecipient] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [bnsStatus, setBnsStatus] = useState<BnsStatus>("idle");
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const bnsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowContactDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (bnsDebounceRef.current) clearTimeout(bnsDebounceRef.current);
    if (!recipient.trim().endsWith(".btc")) {
      setBnsStatus("idle");
      setResolvedAddress(null);
      return;
    }
    setBnsStatus("resolving");
    bnsDebounceRef.current = setTimeout(async () => {
      const addr = await resolveBnsName(recipient.trim());
      if (addr) {
        setResolvedAddress(addr);
        setBnsStatus("resolved");
      } else {
        setResolvedAddress(null);
        setBnsStatus("error");
      }
    }, 600);
    return () => { if (bnsDebounceRef.current) clearTimeout(bnsDebounceRef.current); };
  }, [recipient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(price);
    const effectiveRecipient = resolvedAddress ?? recipient.trim();
    if (item.trim() && !isNaN(priceNum) && priceNum > 0 && effectiveRecipient) {
      onSubmit({ item: item.trim(), price: priceNum, token, recipient: effectiveRecipient, category: "General" });
    }
  };

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setRecipient(contact.address);
    setResolvedAddress(null);
    setBnsStatus("idle");
    setShowContactDropdown(false);
  };

  const handleClearContact = () => {
    setSelectedContact(null);
    setRecipient("");
    setBnsStatus("idle");
    setResolvedAddress(null);
  };

  const filteredContacts = contacts.filter(
    (c) =>
      !selectedContact &&
      (c.name.toLowerCase().includes(recipient.toLowerCase()) ||
        c.address.toLowerCase().includes(recipient.toLowerCase()) ||
        (c.bns && c.bns.toLowerCase().includes(recipient.toLowerCase())))
  );

  const tokens: TransactionToken[] = ["STX", "sBTC", "aeUSDC", "USDCx"];

  const glowStyle = (field: string) => focusedField === field
    ? { boxShadow: "0 0 0 1px rgba(255,122,24,0.5), 0 0 20px rgba(255,122,24,0.12)", borderColor: "rgba(255,122,24,0.6)" }
    : {};

  return (
    <motion.form
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      onSubmit={handleSubmit}
      className="relative overflow-hidden rounded-2xl flex flex-col"
      style={{
        background: "linear-gradient(160deg, rgba(23,27,37,0.97) 0%, rgba(15,18,26,0.99) 100%)",
        backdropFilter: "blur(24px)",
        border: "1px solid rgba(255,122,24,0.15)",
        boxShadow: "0 4px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03) inset",
      }}
    >
      {/* Subtle top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "var(--gradient-ledger)" }} />

      {/* Faint mesh inside card */}
      <div className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: "linear-gradient(rgba(255,122,24,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,122,24,0.03) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />

      {/* Header */}
      <div className="relative z-10 px-7 pt-7 pb-5 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-brand-green/60 mb-1">AI-Powered</p>
          <h2 className="font-display text-xl text-white">New Transaction</h2>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-green/20 bg-brand-green/5">
          <Zap className="w-3 h-3 text-brand-green" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-brand-green">Live Analysis</span>
        </div>
      </div>

      <div className="relative z-10 px-7 pb-7 flex-1 space-y-5">

        {/* Description */}
        <div className="space-y-2">
          <label className="block text-[9px] uppercase text-muted font-bold tracking-[0.25em]">What are you paying for?</label>
          <div className="relative">
            <input
              type="text"
              required
              value={item}
              onChange={(e) => setItem(e.target.value)}
              onFocus={() => setFocusedField("item")}
              onBlur={() => setFocusedField(null)}
              placeholder="e.g. buy coffee at 7-Eleven"
              style={glowStyle("item")}
              className="w-full px-4 py-3.5 rounded-xl font-mono text-sm placeholder:text-white/15 text-white transition-all duration-200 outline-none"
              css-override="true"
            />
            <style>{`
              input[css-override], textarea[css-override] {
                background: rgba(7, 9, 13, 0.7);
                border: 1px solid rgba(35, 41, 54, 0.8);
              }
            `}</style>
          </div>
        </div>

        {/* Amount + Asset */}
        <div className="grid grid-cols-5 gap-4">
          {/* Amount */}
          <div className="col-span-2 space-y-2">
            <label className="block text-[9px] uppercase text-muted font-bold tracking-[0.25em]">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-mono text-sm select-none">$</span>
              <input
                type="number"
                required
                step="0.01"
                min="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onFocus={() => setFocusedField("price")}
                onBlur={() => setFocusedField(null)}
                placeholder="0.00"
                style={{
                  background: "rgba(7, 9, 13, 0.7)",
                  border: "1px solid rgba(35, 41, 54, 0.8)",
                  ...(focusedField === "price"
                    ? { boxShadow: "0 0 0 1px rgba(255,122,24,0.5), 0 0 20px rgba(255,122,24,0.12)", borderColor: "rgba(255,122,24,0.6)" }
                    : {}),
                }}
                className="w-full px-4 py-3.5 pl-8 rounded-xl font-mono text-sm placeholder:text-white/15 text-white transition-all duration-200 outline-none"
              />
            </div>
          </div>

          {/* Token pills */}
          <div className="col-span-3 space-y-2">
            <label className="block text-[9px] uppercase text-muted font-bold tracking-[0.25em]">Asset</label>
            <div className="flex gap-2 flex-wrap">
              {tokens.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setToken(t)}
                  className="flex-1 min-w-0 px-2 py-3 rounded-xl text-[10px] font-bold font-mono transition-all duration-200 cursor-pointer"
                  style={
                    token === t
                      ? {
                          background: "rgba(255,122,24,0.15)",
                          border: "1px solid rgba(255,122,24,0.5)",
                          color: "#FF7A18",
                          boxShadow: "0 0 12px rgba(255,122,24,0.2)",
                        }
                      : {
                          background: "rgba(7,9,13,0.5)",
                          border: "1px solid rgba(35,41,54,0.8)",
                          color: "#6E7686",
                        }
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recipient */}
        <div className="space-y-2" ref={dropdownRef}>
          <label className="block text-[9px] uppercase text-muted font-bold tracking-[0.25em]">Recipient</label>

          {selectedContact ? (
            /* Selected contact chip */
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: "rgba(255,122,24,0.08)", border: "1px solid rgba(255,122,24,0.25)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-black text-ink"
                style={{ background: getAvatarColor(selectedContact.name) }}>
                {selectedContact.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate">{selectedContact.name}</div>
                <div className="text-[10px] font-mono text-muted truncate">{selectedContact.address.slice(0, 16)}...</div>
              </div>
              <button
                type="button"
                onClick={handleClearContact}
                className="text-muted hover:text-white transition-colors p-1 rounded"
                title="Clear"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                required
                value={recipient}
                onChange={(e) => { setRecipient(e.target.value); setShowContactDropdown(true); }}
                onFocus={() => { setFocusedField("recipient"); setShowContactDropdown(true); }}
                onBlur={() => setFocusedField(null)}
                placeholder="SP... or name.btc"
                style={{
                  background: "rgba(7, 9, 13, 0.7)",
                  border: "1px solid rgba(35, 41, 54, 0.8)",
                  ...(focusedField === "recipient"
                    ? { boxShadow: "0 0 0 1px rgba(255,122,24,0.5), 0 0 20px rgba(255,122,24,0.12)", borderColor: "rgba(255,122,24,0.6)" }
                    : {}),
                }}
                className="w-full px-4 py-3.5 rounded-xl font-mono text-xs placeholder:text-white/15 text-white transition-all duration-200 outline-none pr-10"
              />
              {contacts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowContactDropdown((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-brand-green transition-colors"
                  title="Show contacts"
                >
                  <User className="w-4 h-4" />
                </button>
              )}

              {/* Contacts dropdown */}
              <AnimatePresence>
                {showContactDropdown && filteredContacts.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl overflow-hidden max-h-48 overflow-y-auto"
                    style={{
                      background: "rgba(17, 20, 28, 0.98)",
                      border: "1px solid rgba(35, 41, 54, 0.9)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                      backdropFilter: "blur(20px)",
                    }}
                  >
                    {filteredContacts.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectContact(c)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left transition-colors"
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black text-ink"
                          style={{ background: getAvatarColor(c.name) }}
                        >
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-white truncate">{c.name}</div>
                          <div className="text-[10px] font-mono text-muted truncate">
                            {c.bns ? `${c.bns} → ` : ""}{c.address.slice(0, 14)}...
                          </div>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* BNS status */}
          <AnimatePresence>
            {bnsStatus === "resolving" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-1">
                <Loader className="w-3 h-3 text-ghost animate-spin" />
                <span className="text-[10px] text-ghost">Resolving BNS name...</span>
              </motion.div>
            )}
            {bnsStatus === "resolved" && resolvedAddress && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-1">
                <CheckCircle className="w-3.5 h-3.5 text-brand-green shrink-0" />
                <span className="text-[10px] text-brand-green font-mono bg-brand-green/5 border border-brand-green/20 rounded px-2 py-0.5 truncate">
                  {resolvedAddress}
                </span>
              </motion.div>
            )}
            {bnsStatus === "error" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-1">
                <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="text-[10px] text-red-400">BNS name not found.</span>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-[9px] text-muted px-1 uppercase tracking-tighter">
            AI will audit this address for security before authorization.
          </p>
        </div>

        {/* Fee info */}
        <div className="flex justify-between items-center pt-4 border-t"
          style={{ borderColor: "rgba(35,41,54,0.6)" }}>
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] uppercase text-muted font-bold tracking-widest">Est. Network Fee</span>
            <span className="text-xs font-bold text-brand-green">~0.0005 STX</span>
          </div>
          <div className="flex flex-col gap-0.5 text-right">
            <span className="text-[9px] uppercase text-muted font-bold tracking-widest">Settlement</span>
            <span className="text-xs font-bold text-white">Bitcoin-secured</span>
          </div>
        </div>
      </div>

      {/* Submit button */}
      <div className="relative z-10 px-7 pb-7">
        <motion.button
          type="submit"
          disabled={isLoading || bnsStatus === "resolving" || bnsStatus === "error"}
          whileHover={!isLoading ? { scale: 1.01 } : {}}
          whileTap={!isLoading ? { scale: 0.99 } : {}}
          className="w-full relative overflow-hidden rounded-xl py-4 font-black uppercase text-xs tracking-[0.2em] text-ink flex items-center justify-center gap-3 disabled:opacity-50 transition-opacity cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #FFB066 0%, #FF7A18 45%, #C2410C 100%)",
            boxShadow: isLoading
              ? "none"
              : "0 0 24px rgba(255,122,24,0.4), 0 0 48px rgba(255,122,24,0.15), 0 4px 16px rgba(0,0,0,0.4)",
          }}
        >
          {/* Animated shimmer on hover */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)",
              backgroundSize: "200% 100%",
            }}
            animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          />

          {isLoading ? (
            <div className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Initialize AI Analysis
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </div>
    </motion.form>
  );
}
