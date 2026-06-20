/**
 * CreditLineView — placeholder for the sBTC-collateralized STX credit line.
 * Full implementation needs a new lending contract (collateral lock, price
 * oracle, liquidation logic) planned for the smart-contract phase.
 */

import { Landmark, Construction } from 'lucide-react';

export default function CreditLineView() {
  return (
    <div className="space-y-6">
      <div
        className="relative overflow-hidden rounded-2xl p-8 border border-line ledger-strip"
        style={{ background: 'linear-gradient(135deg, rgba(17,20,28,0.95) 0%, rgba(11,14,20,0.98) 100%)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Landmark className="w-3.5 h-3.5 text-muted" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted">Coming Soon</span>
        </div>
        <h2 className="font-display text-3xl sm:text-4xl text-white leading-none mb-3">
          sBTC <span className="text-gradient-brass">Credit Line</span>
        </h2>
        <p className="text-sm text-ghost max-w-md">
          Lock sBTC as collateral and draw a small STX credit line for everyday TwinPay payments — without
          selling your Bitcoin. This needs a dedicated lending contract with a price oracle and liquidation
          safeguards, planned for the smart-contract phase of this roadmap.
        </p>
      </div>

      <div className="panel-quiet rounded-2xl p-10 text-center space-y-3">
        <Construction className="w-10 h-10 text-muted opacity-30 mx-auto" />
        <p className="text-sm text-ghost">This feature is on the roadmap.</p>
        <p className="text-[11px] text-muted max-w-sm mx-auto">
          We'll announce it here once the lending contract is deployed and audited on mainnet.
        </p>
      </div>
    </div>
  );
}
