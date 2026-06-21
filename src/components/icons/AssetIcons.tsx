/**
 * Logo components for tokens (STX, sBTC, aeUSDC, USDCx) and third-party
 * protocols (Zest, Xverse, Leather, StackingDAO).
 *
 * Falls back to a generic lucide icon if the local asset fails to load,
 * so a missing/broken file degrades gracefully instead of showing a
 * broken-image icon.
 */

import { useState, type ComponentType } from 'react';
import { Coins, Bitcoin, DollarSign, Wallet } from 'lucide-react';

const TOKEN_LOGOS: Record<string, string> = {
  STX: '/logos/stx.png',
  sBTC: '/logos/sbtc.png',
  aeUSDC: '/logos/usdc.png',
  USDCx: '/logos/usdc.png',
};

const PROTOCOL_LOGOS: Record<string, string> = {
  zest: '/logos/zest.png',
  xverse: '/logos/xverse.png',
  leather: '/logos/leather.png',
  stackingdao: '/logos/stackingdao.png',
};

const FALLBACK_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  STX: Coins,
  sBTC: Bitcoin,
  aeUSDC: DollarSign,
  USDCx: DollarSign,
};

interface TokenIconProps {
  token: string;
  className?: string;
}

export function TokenIcon({ token, className = 'w-5 h-5' }: TokenIconProps) {
  const [failed, setFailed] = useState(false);
  const src = TOKEN_LOGOS[token];
  const FallbackIcon = FALLBACK_ICONS[token] ?? Coins;

  if (!src || failed) {
    return <FallbackIcon className={className} />;
  }

  return (
    <img
      src={src}
      alt={token}
      className={`${className} rounded-full object-cover`}
      onError={() => setFailed(true)}
    />
  );
}

interface ProtocolIconProps {
  protocol: 'zest' | 'xverse' | 'leather' | 'stackingdao';
  className?: string;
}

export function ProtocolIcon({ protocol, className = 'w-5 h-5' }: ProtocolIconProps) {
  const [failed, setFailed] = useState(false);
  const src = PROTOCOL_LOGOS[protocol];

  if (!src || failed) {
    return <Wallet className={className} />;
  }

  return (
    <img
      src={src}
      alt={protocol}
      className={`${className} rounded-full object-cover`}
      onError={() => setFailed(true)}
    />
  );
}
