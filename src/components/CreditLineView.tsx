/**
 * CreditLineView — "Borrow against your sBTC, without selling it"
 * Read-only educational panel + deep link to Zest Protocol, the largest
 * sBTC-collateralized lending market on Stacks. TwinPay does not run its
 * own lending pool, hold collateral, or run any liquidation logic here —
 * this view informs and routes the user to an established third-party
 * protocol, the same integration pattern used by YieldView for stacking.
 */

import { useState } from 'react';
import {
  Landmark,
  ShieldCheck,
  ArrowUpRight,
  Info,
  AlertTriangle,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { UserProfile } from '../types';

interface CreditLineViewProps {
  address: string | null;
  profile: UserProfile;
  tokenBalances: Record<string, number>;
}

const ZEST_URL = 'https://app.zestprotocol.com/borrow';

export default function CreditLineView({ address, tokenBalances }: CreditLineViewProps) {
  const [estimateAmount, setEstimateAmount] = useState('');

  const sbtcBalance = tokenBalances['sBTC'] ?? 0;
  const hasSbtc = sbtcBalance > 0;

  // Rough illustrative borrow estimate at Zest's published 70% LTV for sBTC
  // collateral. This is informational only — actual borrow limits depend
  // on live oracle pricing inside Zest itself, not anything TwinPay computes.
  const estimateNum = parseFloat(estimateAmount);
  const estimatedBorrowableSbtc = !isNaN(estimateNum) && estimateNum > 0 ? estimateNum * 0.7 : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="relative overflow-hidden rounded-2xl p-8 border border-brass/25 ledger-strip"
        style={{ background: 'linear-gradient(135deg, rgba(17,20,28,0.95) 0%, rgba(11,14,20,0.98) 100%)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(212,175,55,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.05) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Landmark className="w-3.5 h-3.5 text-brass" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brass">
              Powered by Zest Protocol
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl text-white leading-none">
            Borrow against <span className="text-gradient-brass">sBTC</span>
            <span className="block">without selling it</span>
          </h2>
          <p className="text-sm text-ghost mt-3 max-w-md">
            TwinPay doesn't run its own lending pool or hold your collateral. This panel connects you
            directly to Zest Protocol — the largest sBTC-collateralized lending market on Stacks.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: how it works + your balance */}
        <div className="lg:col-span-7 space-y-4">
          <div className="panel-glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-brand-orange" />
              <span className="text-sm font-bold uppercase tracking-wide">Your sBTC</span>
            </div>
            {!address ? (
              <p className="text-sm text-ghost">Connect your wallet to see your sBTC balance.</p>
            ) : hasSbtc ? (
              <div className="num-display text-2xl text-white font-bold">
                {sbtcBalance.toFixed(8)} <span className="text-xs text-ghost font-sans">sBTC</span>
              </div>
            ) : (
              <p className="text-sm text-ghost">
                You don't have any sBTC yet. You'll need sBTC as collateral before borrowing — see the
                BTC Yield panel or{' '}
                <a href="https://app.stacks.co" target="_blank" rel="noreferrer" className="text-brass underline">
                  mint sBTC via the official bridge
                </a>.
              </p>
            )}
          </div>

          {/* Illustrative estimate */}
          <div className="panel-quiet rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-brass" />
              <span className="text-sm font-bold uppercase tracking-wide">Rough Borrow Estimate</span>
            </div>
            <label className="block text-[9px] uppercase text-muted font-bold tracking-widest mb-1.5">
              sBTC amount to use as collateral
            </label>
            <input
              type="number"
              step="0.0001"
              value={estimateAmount}
              onChange={(e) => setEstimateAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-ink border border-line rounded-xl font-mono text-sm text-white placeholder:text-white/20 outline-none focus:border-brass/50 transition-colors mb-3"
            />
            {estimatedBorrowableSbtc !== null && (
              <div className="p-3.5 rounded-xl bg-brass/5 border border-brass/20">
                <p className="text-[12px] text-white/80">
                  At Zest's published <span className="font-bold text-brass">70% LTV</span> for sBTC collateral,
                  that's roughly{' '}
                  <span className="num-display font-bold text-brass">{estimatedBorrowableSbtc.toFixed(4)}</span>{' '}
                  worth of stablecoins borrowable — before fees and live price movement.
                </p>
              </div>
            )}
            <p className="text-[10px] text-muted mt-3 leading-relaxed">
              This is a rough illustration only, not a quote. Actual limits depend on Zest's live oracle
              pricing and risk parameters at the time you borrow.
            </p>
          </div>

          <a
            href={ZEST_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-brass to-brand-orange rounded-xl font-bold uppercase text-xs tracking-widest text-ink hover:brightness-110 transition-all"
          >
            Open Zest Protocol <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>

        {/* Right: risk info */}
        <div className="lg:col-span-5 space-y-4">
          <div className="panel-quiet rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-brand-orange" />
              <span className="text-sm font-bold uppercase tracking-wide">How it works</span>
            </div>
            <Step n={1} text="Connect your wallet directly on Zest Protocol — TwinPay never holds your sBTC." />
            <Step n={2} text="Supply sBTC as collateral. Zest currently allows up to 70% LTV for sBTC." />
            <Step n={3} text="Borrow stablecoins (USDCx, USDh) against it. Your sBTC stays locked but yours." />
            <Step n={4} text="Repay anytime to unlock your collateral, partially or in full." />
          </div>

          <div className="p-4 rounded-xl border border-red-500/25 bg-red-500/5 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div className="text-[11px] text-white/80 leading-relaxed">
              <span className="font-bold text-red-400">Liquidation risk:</span> if your loan-to-value
              reaches Zest's liquidation threshold (70% for sBTC), your collateral becomes eligible for
              liquidation with a penalty fee. Borrowing against volatile collateral can result in losing
              some or all of it if prices move against you.
            </div>
          </div>

          <div className="p-4 bg-ink/40 border border-line/50 rounded-xl text-[10px] text-ghost space-y-2 leading-relaxed">
            <div className="flex items-center gap-1.5 text-muted font-bold uppercase tracking-widest mb-2">
              <TrendingDown className="w-3 h-3" /> Why TwinPay doesn't run this itself
            </div>
            <p>
              Building a safe lending market requires a live price oracle, liquidation infrastructure, and
              a deeply audited contract holding real collateral. Zest Protocol has been running this on
              Stacks for years with significant TVL. Rather than rebuild that, TwinPay connects you to it
              directly.
            </p>
            <p className="pt-1 text-muted/60 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> TwinPay AI does not custody your sBTC or execute any
              borrow/repay transaction on your behalf — you always interact with Zest Protocol directly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-5 h-5 rounded-full bg-brand-orange/15 border border-brand-orange/30 text-brand-orange text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
        {n}
      </span>
      <p className="text-[12px] text-ghost leading-relaxed">{text}</p>
    </div>
  );
}
