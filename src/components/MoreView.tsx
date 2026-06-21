/**
 * MoreView — the hub for everything beyond core payments.
 * Replaces the standalone "Analytics" nav slot: Analytics now lives here as
 * one tile among the newer growth/utility features, reachable from a single
 * "More" entry point in the bottom nav (mobile) and sidebar (desktop).
 */

import { ReactNode } from 'react';
import {
  BarChart2,
  Sparkles,
  Bitcoin,
  Repeat,
  Award,
  Users2,
  Landmark,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { ViewType } from '../types';

interface MoreViewProps {
  onNavigate: (view: ViewType) => void;
  insightBadge?: boolean;
  recurringDueCount?: number;
}

interface Tile {
  view: ViewType;
  title: string;
  description: string;
  icon: ReactNode;
  badge?: string;
  accent: 'orange' | 'brass' | 'ok' | 'muted';
  comingSoon?: boolean;
}

export default function MoreView({ onNavigate, insightBadge, recurringDueCount }: MoreViewProps) {
  const tiles: Tile[] = [
    {
      view: 'insights',
      title: 'AI Insight Digest',
      description: 'Proactive spending and vault summaries from your co-pilot.',
      icon: <Sparkles className="w-5 h-5" />,
      accent: 'brass',
      badge: insightBadge ? 'New' : undefined,
    },
    {
      view: 'analytics',
      title: 'Analytics',
      description: 'Spending breakdowns, trends, and AI decision history.',
      icon: <BarChart2 className="w-5 h-5" />,
      accent: 'orange',
    },
    {
      view: 'yield',
      title: 'BTC Yield',
      description: 'Live stacking parameters and pooled/liquid options for idle STX.',
      icon: <Bitcoin className="w-5 h-5" />,
      accent: 'brass',
    },
    {
      view: 'recurring',
      title: 'Recurring Payments',
      description: 'Schedule rent, subscriptions, or allowances on autopilot.',
      icon: <Repeat className="w-5 h-5" />,
      accent: 'orange',
      badge: recurringDueCount ? `${recurringDueCount} due` : undefined,
    },
    {
      view: 'reputation',
      title: 'Trust Score',
      description: 'Your on-chain track record — streaks and approval history.',
      icon: <Award className="w-5 h-5" />,
      accent: 'ok',
    },
    {
      view: 'multisig',
      title: 'Multisig Vault',
      description: 'Shared vaults with threshold approval for teams or family. Live on Mainnet.',
      icon: <Users2 className="w-5 h-5" />,
      accent: 'orange',
    },
    {
      view: 'credit',
      title: 'sBTC Credit Line',
      description: 'Borrow stablecoins against sBTC via Zest Protocol, without selling your BTC.',
      icon: <Landmark className="w-5 h-5" />,
      accent: 'brass',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl text-white mb-2">More</h2>
        <p className="text-sm text-ghost max-w-md">
          Everything beyond a single payment — insights, yield, automation, and reputation, all built on the same on-chain foundation.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiles.map((t) => (
          <button
            key={t.view}
            onClick={() => !t.comingSoon && onNavigate(t.view)}
            disabled={t.comingSoon}
            className={`text-left panel-glass rounded-2xl p-5 transition-all group relative overflow-hidden ${
              t.comingSoon ? 'opacity-60 cursor-default' : 'hover:border-brand-orange/30 hover:-translate-y-0.5'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  t.accent === 'brass'
                    ? 'bg-brass/10 text-brass'
                    : t.accent === 'ok'
                    ? 'bg-ok/10 text-ok'
                    : t.accent === 'orange'
                    ? 'bg-brand-orange/10 text-brand-orange'
                    : 'bg-white/5 text-muted'
                }`}
              >
                {t.icon}
              </div>
              {t.badge && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-brass/15 text-brass border border-brass/30">
                  {t.badge}
                </span>
              )}
              {t.comingSoon && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-white/5 text-muted border border-white/10">
                  <Lock className="w-2.5 h-2.5" /> Soon
                </span>
              )}
            </div>
            <div className="text-sm font-bold text-white mb-1 flex items-center gap-1">
              {t.title}
              {!t.comingSoon && (
                <ChevronRight className="w-3.5 h-3.5 text-muted group-hover:text-brand-orange group-hover:translate-x-0.5 transition-all" />
              )}
            </div>
            <p className="text-[11px] text-ghost leading-relaxed">{t.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
