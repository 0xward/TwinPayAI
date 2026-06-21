/**
 * YieldView — "Put your Bitcoin to work"
 * Read-only panel surfacing live Proof-of-Transfer (PoX) parameters and the
 * user's current stacking status, with an AI-generated recommendation on
 * whether/how to put idle STX to work. No new contract calls are made here —
 * this panel informs and links out to stacking providers (solo threshold is
 * usually unreachable for retail users, so pooled/liquid options are surfaced).
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Bitcoin,
  TrendingUp,
  Lock,
  Unlock,
  RefreshCw,
  Sparkles,
  Info,
  ArrowUpRight,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { fetchPoxInfo, fetchStackingInfo, type PoxInfo } from '../stacks-config';
import { UserProfile, StackingInfo } from '../types';
import { ProtocolIcon } from './icons/AssetIcons';

interface YieldViewProps {
  address: string | null;
  profile: UserProfile;
}

const POOL_PROVIDERS = [
  {
    name: 'Xverse Pool',
    icon: 'xverse' as const,
    minStx: 500,
    description: 'Wallet-native delegated stacking. STX never leaves your wallet.',
    url: 'https://wallet.xverse.app/earn/stacking',
  },
  {
    name: 'StackingDAO',
    icon: 'stackingdao' as const,
    minStx: 0,
    description: 'Liquid stacking — receive stSTX while your STX stays locked, auto-compounding.',
    url: 'https://app.stackingdao.com/',
  },
  {
    name: 'Leather Wallet',
    icon: 'leather' as const,
    minStx: 0,
    description: 'Open the Stacking section inside the Leather extension itself — pooled or liquid stacking, no separate site needed.',
    url: 'https://leather.io/',
  },
];

export default function YieldView({ address, profile }: YieldViewProps) {
  const [pox, setPox] = useState<PoxInfo | null>(null);
  const [stacking, setStacking] = useState<StackingInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [poxInfo, stackingInfo] = await Promise.all([
        fetchPoxInfo(),
        address ? fetchStackingInfo(address) : Promise.resolve<StackingInfo>({ isStacking: false }),
      ]);
      setPox(poxInfo);
      setStacking(stackingInfo);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    load();
  }, [load]);

  const currentBalance = profile.current_balance;
  const meetsSoloThreshold = pox ? currentBalance >= pox.minThresholdStx : false;

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
        <div className="relative z-10 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Bitcoin className="w-3.5 h-3.5 text-brass" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brass">
                Bitcoin-Secured Yield
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl text-white leading-none">
              Put your <span className="text-gradient-brass">BTC</span>
              <span className="block">to work</span>
            </h2>
            <p className="text-sm text-ghost mt-3 max-w-md">
              Stacking secures the network via Proof-of-Transfer and pays rewards in BTC. Your STX stays in your control — it's locked, not spent.
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="p-2.5 rounded-xl border border-brass/20 bg-brass/5 hover:bg-brass/10 transition-all disabled:opacity-50 shrink-0"
            title="Refresh network data"
          >
            <RefreshCw className={`w-4 h-4 text-brass ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: live network + personal status */}
        <div className="lg:col-span-7 space-y-4">
          {/* Live PoX stats */}
          <div className="panel-glass ledger-strip rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-4 h-4 text-brass" />
              <span className="text-sm font-bold uppercase tracking-wide">Live Network Parameters</span>
            </div>
            {pox ? (
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Min. solo threshold" value={`${pox.minThresholdStx.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} unit="STX" accent />
                <Stat label="Current cycle" value={`#${pox.currentCycleId}`} unit="" />
                <Stat label="Network participation" value={pox.participationPct.toFixed(1)} unit="%" />
                <Stat label="Total stacked" value={(pox.stackedStx / 1_000_000).toFixed(2)} unit="M STX" />
              </div>
            ) : loading ? (
              <div className="py-6 text-center text-ghost text-sm">Loading network data…</div>
            ) : (
              <div className="py-6 text-center text-ghost text-sm">Network data unavailable right now.</div>
            )}
            <p className="text-[10px] text-muted mt-4 leading-relaxed">
              Solo stacking requires the full threshold above. Most users reach stacking through a pool or liquid-stacking provider instead — see options on the right.
            </p>
          </div>

          {/* Personal stacking status */}
          <div className="panel-glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-brand-orange" />
              <span className="text-sm font-bold uppercase tracking-wide">Your Stacking Status</span>
            </div>
            {!address ? (
              <p className="text-sm text-ghost">Connect your wallet to see your stacking status.</p>
            ) : stacking?.isStacking ? (
              <div className="space-y-2.5">
                <div className="flex justify-between text-[12px]">
                  <span className="text-muted">Locked</span>
                  <span className="num-display text-brass font-bold">{stacking.locked?.toLocaleString(undefined, { maximumFractionDigits: 2 })} STX</span>
                </div>
                {stacking.estimatedUnlockDate && (
                  <div className="flex justify-between text-[12px]">
                    <span className="text-muted">Est. unlock</span>
                    <span className="text-ghost">{stacking.estimatedUnlockDate}</span>
                  </div>
                )}
                {stacking.rewardCycle !== undefined && (
                  <div className="flex justify-between text-[12px]">
                    <span className="text-muted">Reward cycle</span>
                    <span className="text-brand-orange font-mono">#{stacking.rewardCycle}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[12px] text-ghost">
                <Unlock className="w-3.5 h-3.5 text-muted" />
                Not currently stacking — {currentBalance.toFixed(2)} STX sitting idle.
              </div>
            )}
          </div>

          {/* AI recommendation */}
          {address && (
            <div className="p-4 rounded-xl border border-brass/25 bg-brass/5 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-brass mt-0.5 shrink-0" />
              <div className="text-[12px] text-white/80 leading-relaxed">
                {stacking?.isStacking ? (
                  <>You're already stacking — TwinPay AI will factor your locked balance into spending decisions automatically.</>
                ) : meetsSoloThreshold ? (
                  <>Your balance meets the solo stacking threshold. You could run your own signer, or simplify with a pool below.</>
                ) : currentBalance > 50 ? (
                  <>You have <span className="font-bold num-display">{currentBalance.toFixed(2)} STX</span> idle — well above most pool minimums. Consider stacking the portion you don't need for near-term payments.</>
                ) : (
                  <>Your balance is small for now — keep using TwinPay for payments, and revisit stacking once your balance grows.</>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: provider options */}
        <div className="lg:col-span-5 space-y-4">
          <div className="panel-quiet rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-brand-orange" />
              <span className="text-sm font-bold uppercase tracking-wide">Stacking Options</span>
            </div>
            <div className="space-y-3">
              {POOL_PROVIDERS.map((p) => (
                <a
                  key={p.name}
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block p-4 rounded-xl bg-ink/60 border border-line hover:border-brass/40 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-white flex items-center gap-2">
                      <ProtocolIcon protocol={p.icon} className="w-5 h-5" />
                      {p.name}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted group-hover:text-brass transition-colors" />
                  </div>
                  <p className="text-[11px] text-ghost leading-relaxed mb-2">{p.description}</p>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-brass/70">
                    {p.minStx > 0 ? `Min. ${p.minStx} STX` : 'No practical minimum'}
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className="p-4 bg-ink/40 border border-line/50 rounded-xl text-[10px] text-ghost space-y-2 leading-relaxed">
            <div className="flex items-center gap-1.5 text-muted font-bold uppercase tracking-widest mb-2">
              <Info className="w-3 h-3" /> How stacking works
            </div>
            <p>• Stacking locks STX for a reward cycle (~2 weeks) to help secure the network via Proof-of-Transfer.</p>
            <p>• Rewards are paid in BTC, proportional to your share of the stacked pool.</p>
            <p>• Solo stacking requires the full network threshold; pools and liquid stacking lower that bar significantly.</p>
            <p className="pt-1 text-muted/60 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> TwinPay AI does not custody or move your STX into stacking — you always transact directly with the provider you choose.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, unit, accent }: { label: string; value: string; unit: string; accent?: boolean }) {
  return (
    <div className="p-3 bg-ink rounded-xl border border-line">
      <div className="text-[9px] uppercase text-muted font-bold mb-1 tracking-widest">{label}</div>
      <div className={`num-display text-lg font-bold ${accent ? 'text-brass' : 'text-white'}`}>
        {value}
        {unit && <span className="text-[10px] text-ghost ml-1 font-sans">{unit}</span>}
      </div>
    </div>
  );
}
