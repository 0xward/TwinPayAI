/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { Wallet, Shield, Zap, Target } from "lucide-react";
import { UserProfile } from "../types";

interface WalletCardProps {
  profile: UserProfile;
  address: string;
  stxPrice: number;
}

export default function WalletCard({ profile, address, stxPrice }: WalletCardProps) {
  const stxUsdValue = profile.current_balance * stxPrice;

  return (
    <div className="bg-surface border border-line rounded-2xl p-6">
      <div className="flex justify-between items-start mb-6">
        <div className="text-[10px] uppercase text-muted font-bold tracking-widest">Vault Balances</div>
        <div className="text-[9px] font-mono opacity-40 uppercase tracking-tighter" title={address}>
          {address.slice(0, 6)}...{address.slice(-4)}
        </div>
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
        
        {/* We'll keep these static for now, as user specifically asked for Native real-time price */}
        <div className="flex justify-between items-center group opacity-50">
          <span className="text-sm text-ghost group-hover:text-white transition-colors">sBTC (Stacks)</span>
          <span className="text-sm font-bold tracking-tight font-mono">0.00</span>
        </div>
        
        <div className="h-[1px] bg-line my-4"></div>
        
        <div className="flex justify-between items-center pt-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#F4F4F7]">Net Balance</span>
          <span className="text-lg font-bold text-brand-green font-mono">
            ${stxUsdValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}
