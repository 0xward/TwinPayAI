/**
 * MultisigView — TwinPay Multisig Vault
 * Contract: SPQ189E66S20X7ATY7794HBY6743JE9YJMCKHAEF.twinpay-multisig
 * Clarity 3 — Stacks Mainnet (live)
 *
 * A shared vault with N-of-M owner approval. Unlike the single-owner
 * TwinPay Vault, this view supports: creating a vault with extra owners,
 * depositing STX into it, proposing a payout, approving as any owner, and
 * executing once threshold is met. One vault per creator principal.
 */

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  openContractCall,
} from '@stacks/connect';
import { PostConditionMode, Pc } from '@stacks/transactions';
import { network, APP_DETAILS, resolveBnsName } from '../stacks-config';
import {
  MULTISIG_CONTRACT_ADDRESS,
  MULTISIG_CONTRACT_NAME,
} from '../services/vaultService';
import {
  fetchVaultIdForCreator,
  fetchMultisigVault,
  fetchProposal,
  fetchHasApproved,
  encodeCreateVaultArgs,
  encodeDepositArgs,
  encodeProposeTransferArgs,
  encodeApproveProposalArgs,
  encodeExecuteProposalArgs,
  encodeCancelProposalArgs,
  type MultisigVault,
  type MultisigProposal,
} from '../services/multisigService';
import {
  Users2,
  Plus,
  X,
  RefreshCw,
  ExternalLink,
  Wallet,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Zap,
  Trash2,
} from 'lucide-react';

interface MultisigViewProps {
  address: string | null;
}

type TxStatus = 'idle' | 'pending' | 'success' | 'error';

export default function MultisigView({ address }: MultisigViewProps) {
  const [vaultId, setVaultId] = useState<number | null>(null);
  const [vault, setVault] = useState<MultisigVault | null>(null);
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [txMsg, setTxMsg] = useState('');

  // create-vault form
  const [showCreate, setShowCreate] = useState(false);
  const [extraOwnersInput, setExtraOwnersInput] = useState(['', '', '', '']);
  const [threshold, setThreshold] = useState(2);

  // deposit form
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');

  // propose form
  const [showPropose, setShowPropose] = useState(false);
  const [proposeRecipient, setProposeRecipient] = useState('');
  const [proposeAmount, setProposeAmount] = useState('');
  const [proposeMemo, setProposeMemo] = useState('');

  // proposal tracker (manual id lookup, since the contract has no enumeration function)
  const [lookupId, setLookupId] = useState('');
  const [proposal, setProposal] = useState<MultisigProposal | null>(null);
  const [hasApproved, setHasApprovedState] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);

  // ── Load vault for this address ────────────────────────────────────────
  const loadVault = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const id = await fetchVaultIdForCreator(address, address);
      setVaultId(id);
      if (id !== null) {
        const v = await fetchMultisigVault(id, address);
        setVault(v);
      } else {
        setVault(null);
      }
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    loadVault();
  }, [loadVault]);

  // ── create-vault ────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!address) return;
    setTxStatus('pending');
    setTxMsg('Resolving owner addresses…');

    try {
      const resolved: string[] = [];
      for (const raw of extraOwnersInput) {
        const trimmed = raw.trim();
        if (!trimmed) continue;
        if (trimmed.endsWith('.btc')) {
          const addr = await resolveBnsName(trimmed);
          if (addr) resolved.push(addr);
        } else {
          resolved.push(trimmed);
        }
      }

      if (threshold < 1 || threshold > resolved.length + 1) {
        setTxStatus('error');
        setTxMsg('Threshold must be between 1 and the total number of owners.');
        return;
      }

      setTxMsg('Waiting for wallet signature…');
      openContractCall({
        contractAddress: MULTISIG_CONTRACT_ADDRESS,
        contractName: MULTISIG_CONTRACT_NAME,
        functionName: 'create-vault',
        functionArgs: encodeCreateVaultArgs(resolved, threshold),
        postConditionMode: PostConditionMode.Allow,
        network,
        appDetails: APP_DETAILS,
        onFinish: (data) => {
          setTxStatus('success');
          setTxMsg(`Vault created! TxID: ${data.txId?.slice(0, 12)}…`);
          setShowCreate(false);
          setExtraOwnersInput(['', '', '', '']);
          setTimeout(loadVault, 4000);
        },
        onCancel: () => {
          setTxStatus('idle');
          setTxMsg('');
        },
      });
    } catch {
      setTxStatus('error');
      setTxMsg('Could not resolve one or more owner addresses.');
    }
  };

  // ── deposit ─────────────────────────────────────────────────────────────
  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (!address || vaultId === null || isNaN(amount) || amount <= 0) return;

    setTxStatus('pending');
    setTxMsg('Waiting for wallet signature…');

    const amountUstx = BigInt(Math.round(amount * 1_000_000));
    const postCondition = Pc.principal(address).willSendEq(amountUstx).ustx();

    openContractCall({
      contractAddress: MULTISIG_CONTRACT_ADDRESS,
      contractName: MULTISIG_CONTRACT_NAME,
      functionName: 'deposit',
      functionArgs: encodeDepositArgs(vaultId, amount),
      postConditions: [postCondition],
      postConditionMode: PostConditionMode.Deny,
      network,
      appDetails: APP_DETAILS,
      onFinish: (data) => {
        setTxStatus('success');
        setTxMsg(`Deposit sent! TxID: ${data.txId?.slice(0, 12)}…`);
        setShowDeposit(false);
        setDepositAmount('');
        setTimeout(loadVault, 4000);
      },
      onCancel: () => {
        setTxStatus('idle');
        setTxMsg('');
      },
    });
  };

  // ── propose-transfer ────────────────────────────────────────────────────
  const handlePropose = async () => {
    const amount = parseFloat(proposeAmount);
    if (!address || vaultId === null || isNaN(amount) || amount <= 0 || !proposeRecipient.trim()) return;

    setTxStatus('pending');
    setTxMsg('Resolving recipient…');

    let recipient = proposeRecipient.trim();
    if (recipient.endsWith('.btc')) {
      const resolved = await resolveBnsName(recipient);
      if (!resolved) {
        setTxStatus('error');
        setTxMsg('Could not resolve that .btc name.');
        return;
      }
      recipient = resolved;
    }

    setTxMsg('Waiting for wallet signature…');
    openContractCall({
      contractAddress: MULTISIG_CONTRACT_ADDRESS,
      contractName: MULTISIG_CONTRACT_NAME,
      functionName: 'propose-transfer',
      functionArgs: encodeProposeTransferArgs(vaultId, recipient, amount, proposeMemo),
      postConditionMode: PostConditionMode.Allow,
      network,
      appDetails: APP_DETAILS,
      onFinish: (data) => {
        setTxStatus('success');
        setTxMsg(`Proposal submitted! TxID: ${data.txId?.slice(0, 12)}…`);
        setShowPropose(false);
        setProposeRecipient('');
        setProposeAmount('');
        setProposeMemo('');
      },
      onCancel: () => {
        setTxStatus('idle');
        setTxMsg('');
      },
    });
  };

  // ── approve / execute / cancel a looked-up proposal ────────────────────
  const handleLookup = async () => {
    const id = parseInt(lookupId, 10);
    if (!address || isNaN(id)) return;
    setLookupLoading(true);
    try {
      const p = await fetchProposal(id, address);
      setProposal(p);
      if (p) {
        const approved = await fetchHasApproved(id, address, address);
        setHasApprovedState(approved);
      }
    } finally {
      setLookupLoading(false);
    }
  };

  const handleApprove = () => {
    if (!proposal) return;
    setTxStatus('pending');
    setTxMsg('Waiting for wallet signature…');
    openContractCall({
      contractAddress: MULTISIG_CONTRACT_ADDRESS,
      contractName: MULTISIG_CONTRACT_NAME,
      functionName: 'approve-proposal',
      functionArgs: encodeApproveProposalArgs(proposal.proposalId),
      postConditionMode: PostConditionMode.Allow,
      network,
      appDetails: APP_DETAILS,
      onFinish: (data) => {
        setTxStatus('success');
        setTxMsg(`Approved! TxID: ${data.txId?.slice(0, 12)}…`);
        setTimeout(handleLookup, 4000);
      },
      onCancel: () => { setTxStatus('idle'); setTxMsg(''); },
    });
  };

  const handleExecute = () => {
    if (!proposal) return;
    setTxStatus('pending');
    setTxMsg('Waiting for wallet signature…');
    openContractCall({
      contractAddress: MULTISIG_CONTRACT_ADDRESS,
      contractName: MULTISIG_CONTRACT_NAME,
      functionName: 'execute-proposal',
      functionArgs: encodeExecuteProposalArgs(proposal.proposalId),
      postConditionMode: PostConditionMode.Allow,
      network,
      appDetails: APP_DETAILS,
      onFinish: (data) => {
        setTxStatus('success');
        setTxMsg(`Executed! TxID: ${data.txId?.slice(0, 12)}…`);
        setTimeout(() => { handleLookup(); loadVault(); }, 4000);
      },
      onCancel: () => { setTxStatus('idle'); setTxMsg(''); },
    });
  };

  const handleCancelProposal = () => {
    if (!proposal) return;
    setTxStatus('pending');
    setTxMsg('Waiting for wallet signature…');
    openContractCall({
      contractAddress: MULTISIG_CONTRACT_ADDRESS,
      contractName: MULTISIG_CONTRACT_NAME,
      functionName: 'cancel-proposal',
      functionArgs: encodeCancelProposalArgs(proposal.proposalId),
      postConditionMode: PostConditionMode.Allow,
      network,
      appDetails: APP_DETAILS,
      onFinish: (data) => {
        setTxStatus('success');
        setTxMsg(`Cancelled! TxID: ${data.txId?.slice(0, 12)}…`);
        setTimeout(handleLookup, 4000);
      },
      onCancel: () => { setTxStatus('idle'); setTxMsg(''); },
    });
  };

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <Users2 className="w-12 h-12 text-muted opacity-40" />
        <p className="text-sm text-ghost">Connect your wallet to manage a multisig vault.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="relative overflow-hidden rounded-2xl p-8 border border-brand-orange/20 ledger-strip"
        style={{ background: 'linear-gradient(135deg, rgba(17,20,28,0.95) 0%, rgba(11,14,20,0.98) 100%)' }}
      >
        <div className="relative z-10 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users2 className="w-3.5 h-3.5 text-brand-orange" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-orange/70">
                Live on Mainnet
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl text-white leading-none">
              Multisig <span className="text-gradient-brand">Vault</span>
            </h2>
            <p className="text-sm text-ghost mt-3 max-w-md">
              A shared vault with N-of-M owner approval. TwinPay AI can still audit proposals, but execution requires quorum signatures.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`https://explorer.hiro.so/address/${MULTISIG_CONTRACT_ADDRESS}.${MULTISIG_CONTRACT_NAME}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold uppercase text-ghost hover:text-white transition-all"
            >
              <ExternalLink className="w-3 h-3" /> Contract
            </a>
            <button
              onClick={loadVault}
              disabled={loading}
              className="p-2.5 rounded-xl border border-brand-orange/20 bg-brand-orange/5 hover:bg-brand-orange/10 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-brand-orange ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Status message */}
      <AnimatePresence>
        {txMsg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-[12px] ${
              txStatus === 'error'
                ? 'border-red-500/30 bg-red-500/5 text-red-300'
                : txStatus === 'success'
                ? 'border-ok/30 bg-ok/5 text-ok'
                : 'border-brand-orange/30 bg-brand-orange/5 text-brand-orange'
            }`}
          >
            {txStatus === 'pending' && <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />}
            {txStatus === 'success' && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
            {txStatus === 'error' && <XCircle className="w-3.5 h-3.5 shrink-0" />}
            <span>{txMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No vault yet */}
      {!loading && vaultId === null && (
        <div className="panel-quiet rounded-2xl p-10 text-center space-y-4">
          <Users2 className="w-10 h-10 text-muted opacity-30 mx-auto" />
          <p className="text-sm text-ghost">You haven't created a multisig vault yet.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-orange to-brand-gold rounded-xl font-bold uppercase text-xs tracking-widest text-ink hover:brightness-110 transition-all"
          >
            <Plus className="w-4 h-4" /> Create Vault
          </button>
        </div>
      )}

      {/* Vault summary */}
      {vault && (
        <div className="panel-glass ledger-strip rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-[10px] uppercase text-muted font-bold tracking-widest mb-1">Vault #{vault.vaultId}</div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${vault.active ? 'bg-ok/10 border-ok/30 text-ok' : 'bg-white/5 border-white/10 text-muted'}`}>
                  {vault.active ? 'Active' : 'Paused'}
                </span>
                <span className="text-[11px] text-ghost">{vault.threshold}-of-{vault.ownerCount} approval</span>
              </div>
            </div>
            <div className="text-right">
              <div className="num-display text-2xl text-white font-bold">{vault.balanceStx.toFixed(4)} <span className="text-xs text-ghost font-sans">STX</span></div>
              <div className="text-[10px] text-muted">Tracked vault balance</div>
            </div>
          </div>

          <div>
            <div className="text-[9px] uppercase text-muted font-bold tracking-widest mb-2">Owners</div>
            <div className="space-y-1.5">
              {vault.owners.map((o, i) => (
                <div key={o} className="flex items-center gap-2 text-[11px] font-mono text-ghost">
                  <span className="text-muted">{i === 0 ? 'Creator' : `Owner ${i + 1}`}</span>
                  <span className="truncate">{o}</span>
                  {o === address && <ShieldCheck className="w-3 h-3 text-brand-orange shrink-0" />}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-line">
            <button
              onClick={() => setShowDeposit(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold uppercase text-ghost hover:text-white transition-all"
            >
              <Wallet className="w-3.5 h-3.5" /> Deposit
            </button>
            <button
              onClick={() => setShowPropose(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-brand-orange/10 hover:bg-brand-orange/20 border border-brand-orange/25 rounded-lg text-[10px] font-bold uppercase text-brand-orange transition-all"
            >
              <Send className="w-3.5 h-3.5" /> Propose Transfer
            </button>
          </div>
        </div>
      )}

      {/* Proposal tracker */}
      <div className="panel-quiet rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-orange" />
          <span className="text-sm font-bold uppercase tracking-wide">Look Up a Proposal</span>
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            placeholder="Proposal ID"
            className="flex-1 px-4 py-2.5 bg-ink border border-line rounded-xl font-mono text-sm text-white placeholder:text-white/20 outline-none focus:border-brand-orange/50 transition-colors"
          />
          <button
            onClick={handleLookup}
            disabled={lookupLoading || !lookupId}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-bold uppercase text-ghost hover:text-white transition-all disabled:opacity-50"
          >
            {lookupLoading ? 'Loading…' : 'Look up'}
          </button>
        </div>

        {proposal && (
          <div className="p-4 rounded-xl bg-ink/60 border border-line space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">Proposal #{proposal.proposalId}</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                proposal.executed ? 'bg-ok/10 border-ok/30 text-ok'
                : proposal.cancelled ? 'bg-white/5 border-white/10 text-muted'
                : 'bg-brand-orange/10 border-brand-orange/30 text-brand-orange'
              }`}>
                {proposal.executed ? 'Executed' : proposal.cancelled ? 'Cancelled' : 'Open'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div><span className="text-muted">Vault</span><div className="text-white">#{proposal.vaultId}</div></div>
              <div><span className="text-muted">Approvals</span><div className="text-white">{proposal.approvals}</div></div>
              <div className="col-span-2"><span className="text-muted">Recipient</span><div className="font-mono text-ghost truncate">{proposal.recipient}</div></div>
              <div><span className="text-muted">Amount</span><div className="num-display text-white font-bold">{proposal.amountStx} STX</div></div>
              <div><span className="text-muted">Proposer</span><div className="font-mono text-ghost truncate">{proposal.proposer.slice(0, 10)}…</div></div>
              {proposal.memo && <div className="col-span-2"><span className="text-muted">Memo</span><div className="text-ghost italic">"{proposal.memo}"</div></div>}
            </div>

            {!proposal.executed && !proposal.cancelled && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-line">
                <button
                  onClick={handleApprove}
                  disabled={hasApproved}
                  className="flex items-center gap-1.5 px-3 py-2 bg-ok/10 hover:bg-ok/20 border border-ok/25 rounded-lg text-[10px] font-bold uppercase text-ok transition-all disabled:opacity-40"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> {hasApproved ? 'Already approved' : 'Approve'}
                </button>
                <button
                  onClick={handleExecute}
                  disabled={!vault || proposal.approvals < vault.threshold}
                  className="flex items-center gap-1.5 px-3 py-2 bg-brass/15 hover:bg-brass/25 border border-brass/30 rounded-lg text-[10px] font-bold uppercase text-brass transition-all disabled:opacity-40"
                >
                  <Zap className="w-3.5 h-3.5" /> Execute
                </button>
                {proposal.proposer === address && (
                  <button
                    onClick={handleCancelProposal}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-500/5 hover:bg-red-500/15 border border-red-500/20 rounded-lg text-[10px] font-bold uppercase text-red-400 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Cancel
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Create vault modal ── */}
      <AnimatePresence>
        {showCreate && (
          <Modal onClose={() => setShowCreate(false)} title="Create Multisig Vault">
            <div className="space-y-4">
              <p className="text-[11px] text-ghost">You'll be owner-1 automatically. Add up to 4 more owners (address or .btc name).</p>
              {extraOwnersInput.map((val, i) => (
                <input
                  key={i}
                  type="text"
                  value={val}
                  onChange={(e) => {
                    const next = [...extraOwnersInput];
                    next[i] = e.target.value;
                    setExtraOwnersInput(next);
                  }}
                  placeholder={`Owner ${i + 2} (optional) — SP... or name.btc`}
                  className="w-full px-4 py-2.5 bg-ink border border-line rounded-xl font-mono text-xs text-white placeholder:text-white/20 outline-none focus:border-brand-orange/50 transition-colors"
                />
              ))}
              <div>
                <label className="block text-[9px] uppercase text-muted font-bold tracking-widest mb-1.5">Approval threshold</label>
                <input
                  type="number"
                  min={1}
                  value={threshold}
                  onChange={(e) => setThreshold(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-4 py-2.5 bg-ink border border-line rounded-xl font-mono text-sm text-white outline-none focus:border-brand-orange/50 transition-colors"
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={txStatus === 'pending'}
                className="w-full py-3 bg-gradient-to-r from-brand-orange to-brand-gold rounded-xl font-bold uppercase text-xs tracking-widest text-ink disabled:opacity-40 hover:brightness-110 transition-all"
              >
                {txStatus === 'pending' ? 'Broadcasting…' : 'Create Vault'}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── Deposit modal ── */}
      <AnimatePresence>
        {showDeposit && (
          <Modal onClose={() => setShowDeposit(false)} title="Deposit STX">
            <div className="space-y-4">
              <div>
                <label className="block text-[9px] uppercase text-muted font-bold tracking-widest mb-1.5">Amount (STX)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-ink border border-line rounded-xl font-mono text-sm text-white placeholder:text-white/20 outline-none focus:border-brand-orange/50 transition-colors"
                />
              </div>
              <button
                onClick={handleDeposit}
                disabled={txStatus === 'pending' || !depositAmount}
                className="w-full py-3 bg-gradient-to-r from-brand-orange to-brand-gold rounded-xl font-bold uppercase text-xs tracking-widest text-ink disabled:opacity-40 hover:brightness-110 transition-all"
              >
                {txStatus === 'pending' ? 'Broadcasting…' : 'Deposit'}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── Propose modal ── */}
      <AnimatePresence>
        {showPropose && (
          <Modal onClose={() => setShowPropose(false)} title="Propose Transfer">
            <div className="space-y-4">
              <div>
                <label className="block text-[9px] uppercase text-muted font-bold tracking-widest mb-1.5">Recipient</label>
                <input
                  type="text"
                  value={proposeRecipient}
                  onChange={(e) => setProposeRecipient(e.target.value)}
                  placeholder="SP... or name.btc"
                  className="w-full px-4 py-3 bg-ink border border-line rounded-xl font-mono text-xs text-white placeholder:text-white/20 outline-none focus:border-brand-orange/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase text-muted font-bold tracking-widest mb-1.5">Amount (STX)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={proposeAmount}
                  onChange={(e) => setProposeAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-ink border border-line rounded-xl font-mono text-sm text-white placeholder:text-white/20 outline-none focus:border-brand-orange/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase text-muted font-bold tracking-widest mb-1.5">Memo (optional)</label>
                <input
                  type="text"
                  value={proposeMemo}
                  onChange={(e) => setProposeMemo(e.target.value)}
                  placeholder="What's this for?"
                  maxLength={140}
                  className="w-full px-4 py-3 bg-ink border border-line rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:border-brand-orange/50 transition-colors"
                />
              </div>
              <button
                onClick={handlePropose}
                disabled={txStatus === 'pending' || !proposeAmount || !proposeRecipient.trim()}
                className="w-full py-3 bg-gradient-to-r from-brand-orange to-brand-gold rounded-xl font-bold uppercase text-xs tracking-widest text-ink disabled:opacity-40 hover:brightness-110 transition-all"
              >
                {txStatus === 'pending' ? 'Broadcasting…' : 'Submit Proposal'}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          className="panel-glass rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display text-xl text-white">{title}</h3>
            <button onClick={onClose} className="text-muted hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          {children}
        </div>
      </motion.div>
    </>
  );
}
