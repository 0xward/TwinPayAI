/**
 * InsightDigest — proactive AI co-pilot summary.
 * Generates a short, encouraging-but-honest digest from the user's recent
 * transactions and vault status, so the AI feels like it "checks in" on the
 * user rather than only reacting to new payments.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Circle,
} from 'lucide-react';
import { generateInsightDigest, type InsightDigest as InsightDigestData } from '../services/groqService';
import { UserProfile, TransactionRecord } from '../types';
import { VaultInfo } from '../services/vaultService';

interface InsightDigestProps {
  profile: UserProfile;
  history: TransactionRecord[];
  vault: VaultInfo | null;
  address: string | null;
  variant?: 'full' | 'compact';
}

const CACHE_KEY_PREFIX = 'twinpay_digest_';
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours — proactive, not spammy on every reload

function readCache(address: string): { digest: InsightDigestData; at: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY_PREFIX + address);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCache(address: string, digest: InsightDigestData) {
  try {
    localStorage.setItem(CACHE_KEY_PREFIX + address, JSON.stringify({ digest, at: Date.now() }));
  } catch {}
}

export default function InsightDigest({ profile, history, vault, address, variant = 'full' }: InsightDigestProps) {
  const [digest, setDigest] = useState<InsightDigestData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async (force = false) => {
    if (!address) return;
    if (!force) {
      const cached = readCache(address);
      if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
        setDigest(cached.digest);
        return;
      }
    }
    setLoading(true);
    setError(false);
    try {
      const result = await generateInsightDigest(
        profile,
        history.slice(0, 12),
        vault
          ? {
              configured: true,
              active: vault.active,
              limitStx: vault.limitStx,
              spentStx: vault.spentStx,
              remainingStx: vault.remainingStx,
            }
          : { configured: false, active: false, limitStx: 0, spentStx: 0, remainingStx: 0 }
      );
      setDigest(result);
      writeCache(address, result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [address, profile, history, vault]);

  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  if (!address) return null;

  const TrendIcon = digest?.trend === 'up' ? TrendingUp : digest?.trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    digest?.trend === 'up' ? 'text-ok' : digest?.trend === 'down' ? 'text-red-400' : 'text-muted';

  if (variant === 'compact') {
    return (
      <div className="panel-quiet ledger-strip rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brass">
            <Sparkles className="w-3 h-3" /> AI Digest
          </div>
          {digest && <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />}
        </div>
        {loading ? (
          <div className="text-xs text-ghost italic">Reading your activity…</div>
        ) : digest ? (
          <>
            <div className="font-display text-base text-white leading-snug mb-1">{digest.headline}</div>
            <p className="text-[11px] text-ghost leading-relaxed">{digest.summary}</p>
          </>
        ) : (
          <div className="text-xs text-ghost italic">No digest yet.</div>
        )}
      </div>
    );
  }

  return (
    <div className="panel-glass ledger-strip rounded-2xl p-6 sm:p-8 relative overflow-hidden">
      <div
        className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.10) 0%, transparent 70%)' }}
      />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brass animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brass">
              TwinPay AI Co-Pilot
            </span>
          </div>
          <button
            onClick={() => load(true)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold uppercase text-ghost hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-10 flex flex-col items-center justify-center gap-3 text-ghost">
            <div className="w-5 h-5 border-2 border-brass border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Reviewing your recent activity…</span>
          </div>
        ) : error ? (
          <div className="py-8 text-center space-y-2">
            <AlertTriangle className="w-8 h-8 text-red-400/60 mx-auto" />
            <p className="text-xs text-ghost">Couldn't generate a digest right now.</p>
            <button onClick={() => load(true)} className="text-xs text-brass underline hover:opacity-80">
              Try again
            </button>
          </div>
        ) : digest ? (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-display text-2xl sm:text-3xl text-white leading-tight">{digest.headline}</h3>
                <TrendIcon className={`w-5 h-5 shrink-0 ${trendColor}`} />
              </div>
              <p className="text-sm text-ghost mt-2 leading-relaxed max-w-lg">{digest.summary}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {digest.highlights.map((h, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-ink/60 border border-line flex items-start gap-2.5"
                >
                  {h.tone === 'positive' && <CheckCircle2 className="w-4 h-4 text-ok mt-0.5 shrink-0" />}
                  {h.tone === 'warning' && <AlertTriangle className="w-4 h-4 text-brand-orange mt-0.5 shrink-0" />}
                  {h.tone === 'neutral' && <Circle className="w-3 h-3 text-muted mt-1 shrink-0" />}
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wide text-white/80">{h.label}</div>
                    <div className="text-[11px] text-ghost mt-0.5">{h.detail}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl border border-brass/25 bg-brass/5 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-brass mt-0.5 shrink-0" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-brass mb-1">Suggested next step</div>
                <p className="text-[12px] text-white/80 leading-relaxed">{digest.recommendation}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-ghost text-sm">No digest available yet.</div>
        )}
      </div>
    </div>
  );
}
