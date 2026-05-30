/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile } from "../types";
import { explorerAddressUrl } from "../stacks-config";

interface WalletCardProps {
  profile: UserProfile;
  address: string;
  stxPrice: number;
  tokenBalances: Record<string, number>;
}

export default function WalletCard({ profile, address, stxPrice, tokenBalances }: WalletCardProps) {
  const stxUsdValue = profile.current_balance * stxPrice;
  const sBtcBalance = tokenBalances.sBTC ?? 0;
  const isRealAddress = address.startsWith("SP") && address.length > 20;

  return (
    <div className="panel-glass rounded-2xl p-6">
      <div className="flex justify-between items-start mb-6">
        <div className="text-[10px] uppercase text-muted font-bold tracking-widest">Vault Balances</div>
        {isRealAddress ? (
          <a
            href={explorerAddressUrl(address)}
            target="_blank"
            rel="noreferrer"
            className="text-[9px] font-mono opacity-40 hover:opacity-100 hover:text-brand-orange uppercase tracking-tighter transition-opacity"
            title={address}
          >
            {address.slice(0, 6)}...{address.slice(-4)}
          </a>
        ) : (
          <span className="text-[9px] font-mono opacity-40 uppercase tracking-tighter" title={address}>
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        )}
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center group">
          <div className="flex flex-col">
            <span className="text-sm text-ghost group-hover:text-white transition-colors">STX (Native)</span>
            <span className="text-[9px] text-muted font-mono">${stxPrice.toFixed(4)} / STX</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold tracking-tight font-mono text-brand-gold">{(profile.current_balance).toLocaleString(undefined, { minimumFractionDigits: 4 })}</div>
            <div className="text-[10px] text-muted font-mono italic">${stxUsdValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
        </div>
        
        <div className="flex justify-between items-center group">
          <span className="text-sm text-ghost group-hover:text-white transition-colors">sBTC (Stacks)</span>
          <span className="text-sm font-bold tracking-tight font-mono">{sBtcBalance.toLocaleString(undefined, { minimumFractionDigits: 8 })}</span>
        </div>
        
        <div className="h-[1px] bg-line my-4"></div>
        
        <div className="flex justify-between items-center pt-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#F4F4F7]">STX Value</span>
          <span className="text-lg font-bold text-brand-orange font-mono">
            ${stxUsdValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}
