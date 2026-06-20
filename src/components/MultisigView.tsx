/**
 * MultisigView — placeholder for the shared/multisig vault feature.
 * Full implementation depends on a new Clarity contract extending the
 * existing twinpay-vault pattern with N-of-M threshold approval, planned
 * for the smart-contract phase of this roadmap.
 */

import { Users2, Construction } from 'lucide-react';

export default function MultisigView() {
  return (
    <div className="space-y-6">
      <div
        className="relative overflow-hidden rounded-2xl p-8 border border-line ledger-strip"
        style={{ background: 'linear-gradient(135deg, rgba(17,20,28,0.95) 0%, rgba(11,14,20,0.98) 100%)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Users2 className="w-3.5 h-3.5 text-muted" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted">Coming Soon</span>
        </div>
        <h2 className="font-display text-3xl sm:text-4xl text-white leading-none mb-3">
          Multisig <span className="text-gradient-brand">Vault</span>
        </h2>
        <p className="text-sm text-ghost max-w-md">
          A shared vault for teams, families, or co-founders — every transfer above a threshold needs N-of-M
          approvals before TwinPay AI is allowed to execute it. This requires a new Clarity contract extending
          the current TwinPay Vault, and will ship after the smart-contract phase of this roadmap.
        </p>
      </div>

      <div className="panel-quiet rounded-2xl p-10 text-center space-y-3">
        <Construction className="w-10 h-10 text-muted opacity-30 mx-auto" />
        <p className="text-sm text-ghost">This feature is on the roadmap.</p>
        <p className="text-[11px] text-muted max-w-sm mx-auto">
          We'll announce it here once the contract is deployed and audited on mainnet.
        </p>
      </div>
    </div>
  );
}
