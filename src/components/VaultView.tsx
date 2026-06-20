/**
 * VaultView — TwinPay Vault Smart Contract Management
 * Contract: SPQ189E66S20X7ATY7794HBY6743JE9YJMCKHAEF.twinpay-vault
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Settings2,
  RefreshCw,
  Power,
  Zap,
  AlertTriangle,
  Info,
  CheckCircle,
  ExternalLink,
  Lock,
  TrendingDown,
  Clock,
  Sparkles,
  Wand2,
} from 'lucide-react';
import {
  openContractCall,
} from '@stacks/connect';
import {
  Pc,
  PostConditionMode,
  trueCV,
  falseCV,
} from '@stacks/transactions';
import {
  network,
  APP_DETAILS,
} from '../stacks-config';
import {
  VAULT_CONTRACT_ADDRESS,
  VAULT_CONTRACT_NAME,
  VAULT_WINDOW_BLOCKS,
  fetchVaultInfo,
  encodeConfigureVaultArgs,
  encodeExecuteTransferArgs,
  type VaultInfo,
} from '../services/vaultService';
import { suggestVaultLimit } from '../services/groqService';
import { UserProfile } from '../types';

interface VaultViewProps {
  address: string | null;
  onLog: (msg: string) => void;
  profile?: UserProfile;
}

type TxStatus = 'idle' | 'pending' | 'success' | 'error';

export default function VaultView({ address, onLog, profile }: VaultViewProps) {
  const [vault, setVault] = useState<VaultInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [txMsg, setTxMsg] = useState('');

  // Configure form
  const [limitInput, setLimitInput] = useState('');
  const [showConfigure, setShowConfigure] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ amount: number; reasoning: string } | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  // Test transfer form
  const [testAmount, setTestAmount] = useState('');
  const [testRecipient, setTestRecipient] = useState('');
  const [showTestTransfer, setShowTestTransfer] = useState(false);

  const loadVault = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const info = await fetchVaultInfo(address);
      setVault(info);
      onLog(info
        ? `[VAULT] Loaded: limit=${info.limitStx} STX | remaining=${info.remainingStx.toFixed(4)} STX | ${info.active ? 'ACTIVE' : 'PAUSED'}`
        : '[VAULT] Not configured.'
      );
    } finally {
      setLoading(false);
    }
  }, [address, onLog]);

  useEffect(() => {
    loadVault();
  }, [loadVault]);

  // ── Auto-Pilot: AI-suggested limit ────────────────────────────────────
  const requestAiSuggestion = useCallback(async () => {
    if (!profile) return;
    setLoadingSuggestion(true);
    try {
      const result = await suggestVaultLimit(profile);
      setAiSuggestion({ amount: result.suggested_limit_stx, reasoning: result.reasoning });
      onLog(`[AI] Suggested vault limit: ${result.suggested_limit_stx} STX`);
    } catch {
      onLog('[AI] Could not generate a vault limit suggestion.');
    } finally {
      setLoadingSuggestion(false);
    }
  }, [profile, onLog]);

  // Fetch a suggestion automatically the first time an unconfigured user opens the configure panel
  useEffect(() => {
    if (showConfigure && !vault && !aiSuggestion && !loadingSuggestion && profile) {
      requestAiSuggestion();
    }
  }, [showConfigure, vault, aiSuggestion, loadingSuggestion, profile, requestAiSuggestion]);

  const applyAiSuggestion = () => {
    if (aiSuggestion) setLimitInput(String(aiSuggestion.amount));
  };

  // ── configure-vault ───────────────────────────────────────────────────
  const handleConfigure = () => {
    const limit = parseFloat(limitInput);
    if (!address || isNaN(limit) || limit <= 0) return;

    setTxStatus('pending');
    setTxMsg('Waiting for wallet signature…');
    onLog(`[VAULT] Configuring vault with limit ${limit} STX…`);

    openContractCall({
      contractAddress: VAULT_CONTRACT_ADDRESS,
      contractName: VAULT_CONTRACT_NAME,
      functionName: 'configure-vault',
      functionArgs: encodeConfigureVaultArgs(limit),
      postConditionMode: PostConditionMode.Allow,
      network,
      appDetails: APP_DETAILS,
      onFinish: (data) => {
        setTxStatus('success');
        setTxMsg(`Vault configured! TxID: ${data.txId?.slice(0, 12)}…`);
        onLog(`[VAULT] configure-vault broadcast: ${data.txId?.slice(0, 12)}…`);
        setShowConfigure(false);
        setLimitInput('');
        setTimeout(loadVault, 3000);
      },
      onCancel: () => {
        setTxStatus('idle');
        setTxMsg('');
        onLog('[VAULT] configure-vault cancelled.');
      },
    });
  };

  // ── set-active ───────────────────────────────────────────────────────
  const handleToggleActive = () => {
    if (!address || !vault) return;
    const newActive = !vault.active;
    setTxStatus('pending');
    setTxMsg(`${newActive ? 'Activating' : 'Pausing'} vault…`);
    onLog(`[VAULT] set-active(${newActive})…`);

    openContractCall({
      contractAddress: VAULT_CONTRACT_ADDRESS,
      contractName: VAULT_CONTRACT_NAME,
      functionName: 'set-active',
      functionArgs: [newActive ? trueCV() : falseCV()],
      postConditionMode: PostConditionMode.Allow,
      network,
      appDetails: APP_DETAILS,
      onFinish: (data) => {
        setTxStatus('success');
        setTxMsg(`Vault ${newActive ? 'activated' : 'paused'}! TxID: ${data.txId?.slice(0, 12)}…`);
        onLog(`[VAULT] set-active broadcast: ${data.txId?.slice(0, 12)}…`);
        setTimeout(loadVault, 3000);
      },
      onCancel: () => {
        setTxStatus('idle');
        setTxMsg('');
        onLog('[VAULT] set-active cancelled.');
      },
    });
  };

  // ── reset-window ─────────────────────────────────────────────────────
  const handleResetWindow = () => {
    if (!address || !vault) return;
    setTxStatus('pending');
    setTxMsg('Resetting spending window…');
    onLog('[VAULT] reset-window…');

    openContractCall({
      contractAddress: VAULT_CONTRACT_ADDRESS,
      contractName: VAULT_CONTRACT_NAME,
      functionName: 'reset-window',
      functionArgs: [],
      postConditionMode: PostConditionMode.Allow,
      network,
      appDetails: APP_DETAILS,
      onFinish: (data) => {
        setTxStatus('success');
        setTxMsg(`Window reset! TxID: ${data.txId?.slice(0, 12)}…`);
        onLog(`[VAULT] reset-window broadcast: ${data.txId?.slice(0, 12)}…`);
        setTimeout(loadVault, 3000);
      },
      onCancel: () => {
        setTxStatus('idle');
        setTxMsg('');
        onLog('[VAULT] reset-window cancelled.');
      },
    });
  };

  // ── execute-transfer (vault-routed STX send) ──────────────────────────
  const handleVaultTransfer = () => {
    const amount = parseFloat(testAmount);
    if (!address || !vault || isNaN(amount) || amount <= 0 || !testRecipient.trim()) return;

    const amountUstx = Math.round(amount * 1_000_000);
    setTxStatus('pending');
    setTxMsg('Executing vault transfer…');
    onLog(`[VAULT] execute-transfer: ${amount} STX → ${testRecipient.slice(0, 10)}…`);

    const postCondition = Pc.principal(address)
      .willSendEq(BigInt(amountUstx))
      .ustx();

    openContractCall({
      contractAddress: VAULT_CONTRACT_ADDRESS,
      contractName: VAULT_CONTRACT_NAME,
      functionName: 'execute-transfer',
      functionArgs: encodeExecuteTransferArgs(amount, testRecipient.trim()),
      postConditions: [postCondition],
      postConditionMode: PostConditionMode.Deny,
      network,
      appDetails: APP_DETAILS,
      onFinish: (data) => {
        setTxStatus('success');
        setTxMsg(`Transfer sent! TxID: ${data.txId?.slice(0, 12)}…`);
        onLog(`[VAULT] execute-transfer broadcast: ${data.txId?.slice(0, 12)}…`);
        setShowTestTransfer(false);
        setTestAmount('');
        setTestRecipient('');
        setTimeout(loadVault, 3000);
      },
      onCancel: () => {
        setTxStatus('idle');
        setTxMsg('');
        onLog('[VAULT] execute-transfer cancelled.');
      },
    });
  };

  // ── helpers ───────────────────────────────────────────────────────────
  const spentPct = vault
    ? Math.min(100, (vault.spent / (vault.limitUstx || 1)) * 100)
    : 0;

  const explorerUrl = `https://explorer.hiro.so/address/${VAULT_CONTRACT_ADDRESS}.${VAULT_CONTRACT_NAME}?chain=mainnet`;

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <Shield className="w-12 h-12 text-muted opacity-40" />
        <p className="text-sm text-ghost">Connect your wallet to manage TwinPay Vault.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="relative overflow-hidden rounded-2xl p-8 border border-brand-orange/20 ledger-strip"
        style={{
          background: 'linear-gradient(135deg, rgba(17,20,28,0.95) 0%, rgba(11,14,20,0.98) 100%)',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,122,24,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,122,24,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,122,24,0.10) 0%, transparent 70%)' }} />

        <div className="relative z-10 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-orange/70">
                On-Chain Spending Control
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl text-white leading-none">
              TwinPay
              <span className="block text-gradient-brand">Vault</span>
            </h2>
            <p className="text-sm text-ghost mt-3 max-w-sm">
              Configure your on-chain spending limit. Every STX transfer is enforced by the smart contract.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold uppercase text-ghost hover:text-white transition-all"
            >
              <ExternalLink className="w-3 h-3" /> Explorer
            </a>
            <button
              onClick={loadVault}
              disabled={loading}
              className="p-2.5 rounded-xl border border-brand-orange/20 bg-brand-orange/5 hover:bg-brand-orange/10 transition-all disabled:opacity-50"
              title="Refresh vault"
            >
              <RefreshCw className={`w-4 h-4 text-brand-orange ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Proactive: idle balance nudge — the AI "checking in" instead of waiting to be asked */}
      <AnimatePresence>
        {vault && vault.active && vault.remainingStx > 0.01 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 rounded-xl border border-brass/25 bg-brass/5"
          >
            <Sparkles className="w-4 h-4 text-brass shrink-0" />
            <p className="text-[12px] text-white/80 leading-relaxed">
              You still have <span className="text-brass font-bold num-display">{vault.remainingStx.toFixed(4)} STX</span> available
              this window. TwinPay AI will keep enforcing your limit automatically — no action needed unless you want to spend it.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tx Status Banner */}
      <AnimatePresence>
        {txStatus !== 'idle' && txMsg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 ${
              txStatus === 'pending'
                ? 'bg-brand-gold/10 border-brand-gold/30 text-brand-gold'
                : txStatus === 'success'
                ? 'bg-ok/10 border-ok/30 text-ok'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {txStatus === 'pending' && <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin shrink-0" />}
            {txStatus === 'success' && <CheckCircle className="w-3.5 h-3.5 shrink-0" />}
            {txStatus === 'error' && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
            <span>{txMsg}</span>
            {txStatus !== 'pending' && (
              <button onClick={() => { setTxStatus('idle'); setTxMsg(''); }} className="ml-auto text-muted hover:text-white">✕</button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Vault Status Card */}
        <div className="lg:col-span-7 space-y-4">
          <div className="panel-glass rounded-2xl p-6 border border-line">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                {vault?.active
                  ? <ShieldCheck className="w-5 h-5 text-ok" />
                  : vault
                  ? <ShieldOff className="w-5 h-5 text-red-400" />
                  : <Shield className="w-5 h-5 text-muted" />
                }
                <span className="text-sm font-bold uppercase tracking-wide">
                  {loading ? 'Loading…' : vault ? 'Vault Configured' : 'No Vault'}
                </span>
              </div>
              {vault && (
                <span
                  className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                    vault.active
                      ? 'bg-ok/10 border-ok/30 text-ok'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}
                >
                  {vault.active ? 'Active' : 'Paused'}
                </span>
              )}
            </div>

            {vault ? (
              <div className="space-y-5">
                {/* Spending Progress */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] uppercase text-muted font-bold tracking-widest">Window Spent</span>
                    <span className="text-xs font-mono text-ghost">
                      {vault.spentStx.toFixed(4)} / {vault.limitStx.toFixed(4)} STX
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-ink rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        spentPct > 80 ? 'bg-red-500' : spentPct > 50 ? 'bg-brand-gold' : 'bg-ok'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${spentPct}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-ghost">{spentPct.toFixed(1)}% used</span>
                    <span className="text-[10px] text-ok font-mono font-bold">
                      {vault.remainingStx.toFixed(4)} STX remaining
                    </span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-ink rounded-xl border border-line">
                    <div className="text-[9px] uppercase text-muted font-bold mb-1 tracking-widest flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Limit
                    </div>
                    <div className="text-base font-bold font-mono text-white">
                      {vault.limitStx.toFixed(4)}
                    </div>
                    <div className="text-[9px] text-ghost">STX / window</div>
                  </div>
                  <div className="p-3 bg-ink rounded-xl border border-line">
                    <div className="text-[9px] uppercase text-muted font-bold mb-1 tracking-widest flex items-center gap-1">
                      <TrendingDown className="w-2.5 h-2.5" /> Spent
                    </div>
                    <div className="text-base font-bold font-mono text-brand-gold">
                      {vault.spentStx.toFixed(4)}
                    </div>
                    <div className="text-[9px] text-ghost">STX this window</div>
                  </div>
                  <div className="p-3 bg-ink rounded-xl border border-line col-span-2 sm:col-span-1">
                    <div className="text-[9px] uppercase text-muted font-bold mb-1 tracking-widest flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> Window
                    </div>
                    <div className="text-base font-bold font-mono text-ok">
                      {VAULT_WINDOW_BLOCKS.toLocaleString()}
                    </div>
                    <div className="text-[9px] text-ghost">blocks (~30 days)</div>
                  </div>
                </div>

                {/* Contract info */}
                <div className="p-3 bg-ink/50 rounded-xl border border-line/50 text-[10px] text-muted font-mono break-all">
                  <span className="text-ghost/50 mr-1">CONTRACT</span>
                  {VAULT_CONTRACT_ADDRESS}.{VAULT_CONTRACT_NAME}
                </div>
              </div>
            ) : loading ? (
              <div className="py-8 flex items-center justify-center gap-2 text-ghost text-sm">
                <div className="w-4 h-4 border border-ghost border-t-transparent rounded-full animate-spin" />
                Fetching vault data…
              </div>
            ) : (
              <div className="py-6 text-center space-y-3">
                <Shield className="w-10 h-10 text-muted opacity-30 mx-auto" />
                <p className="text-sm text-ghost">No vault configured yet.</p>
                <p className="text-[11px] text-muted max-w-xs mx-auto">
                  Set a per-window spending limit to enforce on-chain budget control for all STX transfers.
                </p>
              </div>
            )}
          </div>

          {/* Vault Transfer Panel */}
          <AnimatePresence>
            {vault?.active && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="panel-glass rounded-2xl p-6 border border-ok/20"
              >
                <button
                  onClick={() => setShowTestTransfer(!showTestTransfer)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-ok" />
                    <span className="text-sm font-bold uppercase tracking-wide">Vault Transfer</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-ok/10 border border-ok/20 text-ok rounded font-bold uppercase">
                      execute-transfer
                    </span>
                  </div>
                  <span className="text-xs text-muted">{showTestTransfer ? '▲' : '▼'}</span>
                </button>

                <AnimatePresence>
                  {showTestTransfer && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-5 space-y-4">
                        <p className="text-[11px] text-ghost leading-relaxed">
                          Send STX via the vault contract. The contract enforces your spending limit and records the transfer on-chain.
                        </p>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[9px] uppercase text-muted font-bold tracking-widest mb-1.5">
                              Amount (STX) — max {vault.remainingStx.toFixed(4)} STX remaining
                            </label>
                            <input
                              type="number"
                              step="0.0001"
                              min="0.0001"
                              max={vault.remainingStx}
                              value={testAmount}
                              onChange={(e) => setTestAmount(e.target.value)}
                              placeholder="0.0000"
                              className="w-full px-4 py-3 bg-ink border border-line rounded-xl font-mono text-sm text-white placeholder:text-white/20 outline-none focus:border-ok/50 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] uppercase text-muted font-bold tracking-widest mb-1.5">
                              Recipient (SP…)
                            </label>
                            <input
                              type="text"
                              value={testRecipient}
                              onChange={(e) => setTestRecipient(e.target.value)}
                              placeholder="SP..."
                              className="w-full px-4 py-3 bg-ink border border-line rounded-xl font-mono text-xs text-white placeholder:text-white/20 outline-none focus:border-ok/50 transition-colors"
                            />
                          </div>
                          <button
                            onClick={handleVaultTransfer}
                            disabled={txStatus === 'pending' || !testAmount || !testRecipient}
                            className="w-full py-3 bg-gradient-to-r from-ok/80 to-ok rounded-xl font-bold uppercase text-xs tracking-widest text-ink disabled:opacity-40 hover:brightness-110 transition-all"
                          >
                            {txStatus === 'pending' ? 'Broadcasting…' : 'Execute via Vault'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Actions */}
        <div className="lg:col-span-5 space-y-4">
          {/* Configure Vault */}
          <div className="panel-glass rounded-2xl p-5 border border-line">
            <button
              onClick={() => setShowConfigure(!showConfigure)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-brand-orange" />
                <span className="text-sm font-bold uppercase tracking-wide">
                  {vault ? 'Reconfigure Vault' : 'Configure Vault'}
                </span>
              </div>
              <span className="text-xs text-muted">{showConfigure ? '▲' : '▼'}</span>
            </button>

            <AnimatePresence>
              {showConfigure && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 space-y-3">
                    <p className="text-[11px] text-ghost">
                      Sets your per-window spending limit. The window is {VAULT_WINDOW_BLOCKS.toLocaleString()} burn-blocks (~30 days).
                    </p>

                    {/* Auto-Pilot AI suggestion */}
                    {!vault && (
                      <div className="p-3.5 rounded-xl border border-brass/25 bg-brass/5">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Wand2 className="w-3.5 h-3.5 text-brass" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-brass">Auto-Pilot suggestion</span>
                        </div>
                        {loadingSuggestion ? (
                          <div className="flex items-center gap-2 text-[11px] text-ghost py-1">
                            <div className="w-3 h-3 border border-brass border-t-transparent rounded-full animate-spin" />
                            Calculating a sensible limit for you…
                          </div>
                        ) : aiSuggestion ? (
                          <div className="flex items-end justify-between gap-3 flex-wrap">
                            <div>
                              <div className="num-display text-xl text-white">{aiSuggestion.amount} <span className="text-xs text-ghost">STX</span></div>
                              <p className="text-[11px] text-ghost mt-1 max-w-xs leading-relaxed">{aiSuggestion.reasoning}</p>
                            </div>
                            <button
                              onClick={applyAiSuggestion}
                              className="shrink-0 px-3 py-1.5 rounded-lg bg-brass/15 border border-brass/30 text-brass text-[10px] font-bold uppercase tracking-wide hover:bg-brass/25 transition-all"
                            >
                              Use this
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={requestAiSuggestion}
                            className="text-[11px] text-brass underline hover:opacity-80"
                          >
                            Ask AI for a suggested limit
                          </button>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-[9px] uppercase text-muted font-bold tracking-widest mb-1.5">
                        Limit (STX)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0.000001"
                          value={limitInput}
                          onChange={(e) => setLimitInput(e.target.value)}
                          placeholder="e.g. 100"
                          className="w-full px-4 py-3 bg-ink border border-line rounded-xl font-mono text-sm text-white placeholder:text-white/20 outline-none focus:border-brand-orange/50 transition-colors pr-14"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-muted">STX</span>
                      </div>
                    </div>
                    <button
                      onClick={handleConfigure}
                      disabled={txStatus === 'pending' || !limitInput || parseFloat(limitInput) <= 0}
                      className="w-full py-3 bg-gradient-to-r from-brand-orange to-brand-gold rounded-xl font-bold uppercase text-xs tracking-widest text-ink disabled:opacity-40 hover:brightness-110 transition-all"
                    >
                      {txStatus === 'pending' ? 'Broadcasting…' : 'Set Spending Limit'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Toggle Active */}
          {vault && (
            <div className="panel-glass rounded-2xl p-5 border border-line">
              <div className="flex items-center gap-2 mb-3">
                <Power className={`w-4 h-4 ${vault.active ? 'text-ok' : 'text-red-400'}`} />
                <span className="text-sm font-bold uppercase tracking-wide">Vault Status</span>
              </div>
              <p className="text-[11px] text-ghost mb-4">
                {vault.active
                  ? 'Vault is active. All execute-transfer calls are authorized.'
                  : 'Vault is paused. No transfers can be routed through the contract.'}
              </p>
              <button
                onClick={handleToggleActive}
                disabled={txStatus === 'pending'}
                className={`w-full py-3 rounded-xl font-bold uppercase text-xs tracking-widest disabled:opacity-40 hover:brightness-110 transition-all ${
                  vault.active
                    ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
                    : 'bg-ok/10 border border-ok/30 text-ok hover:bg-ok/20'
                }`}
              >
                {vault.active
                  ? <><ShieldOff className="inline w-3.5 h-3.5 mr-1" /> Pause Vault</>
                  : <><ShieldCheck className="inline w-3.5 h-3.5 mr-1" /> Activate Vault</>
                }
              </button>
            </div>
          )}

          {/* Reset Window */}
          {vault && (
            <div className="panel-glass rounded-2xl p-5 border border-line">
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw className="w-4 h-4 text-brand-gold" />
                <span className="text-sm font-bold uppercase tracking-wide">Reset Window</span>
              </div>
              <p className="text-[11px] text-ghost mb-4">
                Manually reset the spending window. The spent counter resets to zero and the window timer restarts from the current block.
              </p>
              <button
                onClick={handleResetWindow}
                disabled={txStatus === 'pending'}
                className="w-full py-3 bg-brand-gold/10 border border-brand-gold/30 text-brand-gold hover:bg-brand-gold/20 rounded-xl font-bold uppercase text-xs tracking-widest disabled:opacity-40 transition-all"
              >
                <RefreshCw className="inline w-3.5 h-3.5 mr-1" />
                Reset Spending Window
              </button>
            </div>
          )}

          {/* Info box */}
          <div className="p-4 bg-ink/40 border border-line/50 rounded-xl text-[10px] text-ghost space-y-2 leading-relaxed">
            <div className="flex items-center gap-1.5 text-muted font-bold uppercase tracking-widest mb-2">
              <Info className="w-3 h-3" /> How it works
            </div>
            <p>• <strong className="text-white/60">configure-vault</strong> — sets your per-window limit in microSTX</p>
            <p>• <strong className="text-white/60">execute-transfer</strong> — routes STX payments through the contract, enforcing your limit</p>
            <p>• <strong className="text-white/60">set-active</strong> — pause/resume your vault</p>
            <p>• <strong className="text-white/60">reset-window</strong> — manually restart the 4320-block spending window</p>
            <p className="pt-1 text-muted/60">The Decision Engine automatically uses your vault for STX transfers when it's active.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
