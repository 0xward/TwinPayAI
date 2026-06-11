/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Link, Copy, CheckCircle, QrCode } from "lucide-react";
import { TransactionToken } from "../types";

interface RequestViewProps {
  userAddress: string | null;
}

declare global {
  interface Window {
    QRCode: any;
  }
}

const TOKENS: TransactionToken[] = ["STX", "sBTC", "aeUSDC", "USDCx"];

export default function RequestView({ userAddress }: RequestViewProps) {
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<TransactionToken>("STX");
  const [note, setNote] = useState("");
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const qrInstanceRef = useRef<any>(null);

  // Load QRCode.js from CDN
  useEffect(() => {
    if (window.QRCode) return;
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    script.async = true;
    document.head.appendChild(script);
  }, []);

  // Re-render QR when URL changes
  useEffect(() => {
    if (!payUrl || !qrRef.current) return;

    const generate = () => {
      if (!window.QRCode) {
        setTimeout(generate, 200);
        return;
      }
      if (qrRef.current) {
        qrRef.current.innerHTML = "";
      }
      qrInstanceRef.current = new window.QRCode(qrRef.current, {
        text: payUrl,
        width: 200,
        height: 200,
        colorDark: "#FF7A18",
        colorLight: "#07090D",
        correctLevel: window.QRCode.CorrectLevel?.H ?? 3,
      });
    };

    generate();
  }, [payUrl]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAddress) return;
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const base = window.location.origin;
    const params = new URLSearchParams({
      to: userAddress,
      amount: amountNum.toString(),
      token,
    });
    if (note.trim()) params.set("note", note.trim());
    setPayUrl(`${base}/pay?${params.toString()}`);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!payUrl) return;
    try {
      await navigator.clipboard.writeText(payUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight uppercase mb-1">Payment Request</h2>
        <p className="text-[10px] text-muted font-mono uppercase tracking-widest">
          Generate Invoice // Share & Receive
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-line bg-surface-bright flex justify-between items-center">
            <h3 className="text-sm font-bold uppercase tracking-wide">Create Request</h3>
            <QrCode className="w-4 h-4 text-ghost opacity-30" />
          </div>

          {!userAddress ? (
            <div className="p-8 text-center">
              <p className="text-ghost italic text-sm">Connect your Stacks wallet to create payment requests.</p>
            </div>
          ) : (
            <form onSubmit={handleGenerate} className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] uppercase text-muted font-bold mb-2 tracking-widest">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-mono text-sm">$</span>
                  <input
                    type="number"
                    required
                    step="0.000001"
                    min="0.000001"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-ink border border-line p-4 pl-8 rounded-lg focus:outline-none focus:border-brand-green/50 font-mono text-sm placeholder:text-gray-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-muted font-bold mb-2 tracking-widest">
                  Token
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {TOKENS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setToken(t)}
                      className={`py-2.5 rounded-lg border text-[10px] font-mono transition-all ${
                        token === t
                          ? "bg-brand-green/10 border-brand-green text-brand-green"
                          : "bg-ink border-line text-ghost hover:border-ghost/30"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-muted font-bold mb-2 tracking-widest">
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Invoice #001"
                  maxLength={80}
                  className="w-full bg-ink border border-line p-3 rounded-lg focus:outline-none focus:border-brand-green/50 font-mono text-sm placeholder:text-gray-700"
                />
              </div>

              <div className="pt-1">
                <div className="text-[10px] text-muted mb-1 uppercase font-bold tracking-widest">
                  Your Address
                </div>
                <div className="font-mono text-[10px] text-ghost bg-ink border border-line rounded-lg px-3 py-2 truncate">
                  {userAddress}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-brand text-ink font-bold rounded-lg uppercase text-xs tracking-widest glow-brand-sm hover:opacity-90 transition-all"
              >
                Generate Request
              </button>
            </form>
          )}
        </div>

        {/* Preview / QR */}
        <div className="space-y-4">
          {payUrl ? (
            <>
              {/* Shareable URL */}
              <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-line bg-surface-bright flex justify-between items-center">
                  <h3 className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                    <Link className="w-4 h-4 text-brand-green" /> Shareable Link
                  </h3>
                </div>
                <div className="p-5 space-y-3">
                  <div className="bg-ink border border-line rounded-lg p-3 font-mono text-[10px] text-ghost break-all leading-relaxed">
                    {payUrl}
                  </div>
                  <button
                    onClick={handleCopy}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border text-xs font-bold uppercase tracking-widest transition-all ${
                      copied
                        ? "border-brand-green/50 text-brand-green bg-brand-green/10"
                        : "border-line text-ghost hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {copied ? (
                      <><CheckCircle className="w-4 h-4" /> Copied!</>
                    ) : (
                      <><Copy className="w-4 h-4" /> Copy Link</>
                    )}
                  </button>
                </div>
              </div>

              {/* QR Code */}
              <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-line bg-surface-bright">
                  <h3 className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-brand-gold" /> QR Code
                  </h3>
                </div>
                <div className="p-6 flex flex-col items-center gap-4">
                  <div
                    ref={qrRef}
                    className="bg-[#07090D] p-3 rounded-xl border border-line"
                    style={{ minWidth: 220, minHeight: 220 }}
                  />
                  <p className="text-[10px] text-muted text-center uppercase tracking-widest">
                    Scan to pay {amount} {token}
                  </p>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-surface border border-brand-gold/20 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-line bg-surface-bright">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-brand-gold">
                    Payer Preview
                  </h3>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted uppercase font-bold tracking-widest">Pay to</span>
                    <span className="font-mono text-ghost">{userAddress?.slice(0, 10)}...</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted uppercase font-bold tracking-widest">Amount</span>
                    <span className="font-bold text-brand-gold font-mono">{amount} {token}</span>
                  </div>
                  {note && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted uppercase font-bold tracking-widest">Note</span>
                      <span className="text-ghost italic">{note}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted uppercase font-bold tracking-widest">Network</span>
                    <span className="text-brand-green">Stacks Mainnet</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-surface border border-line rounded-2xl p-12 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
              <QrCode className="w-14 h-14 text-muted opacity-20 mb-4" />
              <p className="text-ghost italic text-sm">Fill in the form to generate your payment request.</p>
              <p className="text-[10px] text-muted mt-2 uppercase tracking-widest">
                QR code and link will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
