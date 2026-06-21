/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { UserProfile, StackingInfo, VaultStatus } from "../types";
import { explorerAddressUrl, fetchStackingInfo, VAULT_CONTRACT } from "../stacks-config";
import { Lock, Unlock, Shield, ShieldCheck, ShieldOff } from "lucide-react";
import { TokenIcon } from "./icons/AssetIcons";

interface WalletCardProps {
  profile: UserProfile;
  address: string;
  stxPrice: number;
  tokenBalances: Record<string, number>;
  vaultStatus?: VaultStatus | null;
  onOpenVault?: () => void;
}

export default function WalletCard({ profile, address, stxPrice, tokenBalances, vaultStatus, onOpenVault }: WalletCardProps) {
  const stxUsdValue = profile.current_balance * stxPrice;
  const sBtcBalance = tokenBalances.sBTC ?? 0;
  const aeUsdcBalance = tokenBalances.aeUSDC ?? 0;
  const usdcxBalance = tokenBalances.USDCx ?? 0;
  const isRealAddress = address.startsWith("SP") && address.length > 20;

  const [stackingInfo, setStackingInfo] = useState<StackingInfo | null>(null);
  const [loadingStacking, setLoadingStacking] = useState(false);

  useEffect(() => {
    if (!isRealAddress) {
      setStackingInfo(null);
      return;
    }
    setLoadingStacking(true);
    fetchStackingInfo(address)
      .then((info) => setStackingInfo(info))
      .catch(() => setStackingInfo({ isStacking: false }))
      .finally(() => setLoadingStacking(false));
  }, [address, isRealAddress]);

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
          <div className="flex items-center gap-2">
            <TokenIcon token="STX" className="w-5 h-5" />
            <div className="flex flex-col">
              <span className="text-sm text-ghost group-hover:text-white transition-colors">STX (Native)</span>
              <span className="text-[9px] text-muted font-mono">${stxPrice.toFixed(4)} / STX</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold tracking-tight font-mono text-brand-gold">
              {profile.current_balance.toLocaleString(undefined, { minimumFractionDigits: 4 })}
            </div>
            <div className="text-[10px] text-muted font-mono italic">
              ${stxUsdValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center group">
          <div className="flex items-center gap-2">
            <TokenIcon token="sBTC" className="w-5 h-5" />
            <span className="text-sm text-ghost group-hover:text-white transition-colors">sBTC (Stacks)</span>
          </div>
          <span className="text-sm font-bold tracking-tight font-mono">
            {sBtcBalance.toLocaleString(undefined, { minimumFractionDigits: 8 })}
          </span>
        </div>

        {aeUsdcBalance > 0 && (
          <div className="flex justify-between items-center group">
            <div className="flex items-center gap-2">
              <TokenIcon token="aeUSDC" className="w-5 h-5" />
              <span className="text-sm text-ghost group-hover:text-white transition-colors">aeUSDC</span>
            </div>
            <span className="text-sm font-bold tracking-tight font-mono">
              {aeUsdcBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {usdcxBalance > 0 && (
          <div className="flex justify-between items-center group">
            <span className="text-sm text-ghost group-hover:text-white transition-colors">USDCx</span>
            <span className="text-sm font-bold tracking-tight font-mono">
              {usdcxBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}

        <div className="h-[1px] bg-line my-4"></div>

        <div className="flex justify-between items-center pt-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#F4F4F7]">STX Value</span>
          <span className="text-lg font-bold text-brand-orange font-mono">
            ${stxUsdValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Stacking Info */}
        <div className="h-[1px] bg-line mt-2"></div>
        <div className="pt-2">
          <div className="text-[10px] uppercase text-muted font-bold tracking-widest mb-2 flex items-center gap-1.5">
            <Lock className="w-3 h-3" /> Stacking Status
          </div>

          {loadingStacking ? (
            <div className="text-[10px] text-ghost italic">Checking stacking...</div>
          ) : stackingInfo?.isStacking ? (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted">Locked STX</span>
                <span className="text-brand-gold font-mono font-bold">
                  {stackingInfo.locked?.toLocaleString(undefined, { minimumFractionDigits: 2 })} STX
                </span>
              </div>
              {stackingInfo.unlockBlock && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted">Unlock Block</span>
                  <span className="font-mono text-ghost">{stackingInfo.unlockBlock.toLocaleString()}</span>
                </div>
              )}
              {stackingInfo.estimatedUnlockDate && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted">Est. Unlock</span>
                  <span className="text-ghost">{stackingInfo.estimatedUnlockDate}</span>
                </div>
              )}
              {stackingInfo.rewardCycle !== undefined && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted">Reward Cycle</span>
                  <span className="text-brand-green font-mono">#{stackingInfo.rewardCycle}</span>
                </div>
              )}
            </div>
          ) : isRealAddress ? (
            <div className="flex items-center gap-2 text-[11px]">
              <Unlock className="w-3 h-3 text-muted" />
              <span className="text-muted italic">Not stacking</span>
              <a
                href="https://stacks.co/learn/stacking"
                target="_blank"
                rel="noreferrer"
                className="text-brand-green underline hover:opacity-80 transition-opacity"
              >
                Learn more
              </a>
            </div>
          ) : (
            <div className="text-[10px] text-muted italic">Connect wallet to view stacking info</div>
          )}
        </div>

        {/* Vault Status */}
        <div className="h-[1px] bg-line mt-2"></div>
        <div className="pt-2">
          <div className="text-[10px] uppercase text-muted font-bold tracking-widest mb-2 flex items-center gap-1.5">
            <Shield className="w-3 h-3" /> TwinPay Vault
          </div>
          {vaultStatus?.configured ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted">Status</span>
                <span className={`flex items-center gap-1 font-bold ${vaultStatus.active ? 'text-brand-green' : 'text-red-400'}`}>
                  {vaultStatus.active
                    ? <><ShieldCheck className="w-3 h-3" /> Active</>
                    : <><ShieldOff className="w-3 h-3" /> Paused</>
                  }
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted">Remaining</span>
                <span className="font-mono text-brand-gold font-bold">
                  {vaultStatus.remainingStx.toFixed(4)} STX
                </span>
              </div>
              <div className="w-full h-1.5 bg-ink rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    vaultStatus.limitStx > 0
                      ? (vaultStatus.spentStx / vaultStatus.limitStx) > 0.8
                        ? 'bg-red-500'
                        : (vaultStatus.spentStx / vaultStatus.limitStx) > 0.5
                        ? 'bg-brand-gold'
                        : 'bg-brand-green'
                      : 'bg-brand-green'
                  }`}
                  style={{
                    width: vaultStatus.limitStx > 0
                      ? `${Math.min(100, (vaultStatus.spentStx / vaultStatus.limitStx) * 100)}%`
                      : '0%'
                  }}
                />
              </div>
              {onOpenVault && (
                <button
                  onClick={onOpenVault}
                  className="w-full mt-1 text-[9px] uppercase font-bold tracking-widest text-ghost hover:text-brand-green transition-colors"
                >
                  Manage Vault →
                </button>
              )}
            </div>
          ) : (
            <div className="text-[10px] text-muted italic flex items-center justify-between">
              <span>Not configured</span>
              {onOpenVault && (
                <button
                  onClick={onOpenVault}
                  className="text-brand-green text-[9px] font-bold uppercase tracking-widest hover:underline"
                >
                  Setup →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
