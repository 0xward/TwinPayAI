/**
 * TwinPay Multisig Vault — Smart Contract Service
 * Contract: SPQ189E66S20X7ATY7794HBY6743JE9YJMCKHAEF.twinpay-multisig
 * Clarity 3 — Stacks Mainnet
 * Deploy tx: 0x04336476f14c071ba78e0baad508c4f08b4b443cd73950604c77bc1c9b856bc7
 */

import {
  cvToHex,
  hexToCV,
  standardPrincipalCV,
  uintCV,
  someCV,
  noneCV,
  boolCV,
  stringUtf8CV,
  ClarityType,
  type ClarityValue,
  type SomeCV,
  type TupleCV,
  type UIntCV,
  type PrincipalCV,
} from '@stacks/transactions';
import { HIRO_API_BASE } from '../stacks-config';
import { MULTISIG_CONTRACT_ADDRESS, MULTISIG_CONTRACT_NAME } from './vaultService';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface MultisigVault {
  vaultId: number;
  creator: string;
  owners: string[]; // owner-1..5, only the ones that are set
  ownerCount: number;
  threshold: number;
  active: boolean;
  balanceUstx: number;
  balanceStx: number;
}

export interface MultisigProposal {
  proposalId: number;
  vaultId: number;
  proposer: string;
  recipient: string;
  amountUstx: number;
  amountStx: number;
  memo: string;
  approvals: number;
  executed: boolean;
  cancelled: boolean;
}

// ─── Internal helpers ──────────────────────────────────────────────────────

const HIRO_API_KEY = import.meta.env.VITE_HIRO_API_KEY as string | undefined;

function hiroHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (HIRO_API_KEY) h['x-api-key'] = HIRO_API_KEY;
  return h;
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, delayMs = 600): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries) await new Promise((r) => setTimeout(r, delayMs * 2 ** attempt));
    }
  }
  throw lastErr;
}

async function callReadOnly(functionName: string, argHexes: string[], sender: string): Promise<ClarityValue> {
  return withRetry(async () => {
    const res = await fetch(
      `${HIRO_API_BASE}/v2/contracts/call-read/${MULTISIG_CONTRACT_ADDRESS}/${MULTISIG_CONTRACT_NAME}/${functionName}`,
      {
        method: 'POST',
        headers: hiroHeaders(),
        body: JSON.stringify({ sender, arguments: argHexes }),
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.okay) throw new Error(json.cause || 'Contract call failed');
    return hexToCV(json.result);
  });
}

function extractUint(cv: ClarityValue): number {
  return cv.type === ClarityType.UInt ? Number((cv as UIntCV).value) : 0;
}

function extractBool(cv: ClarityValue): boolean {
  return cv.type === ClarityType.BoolTrue;
}

function extractPrincipal(cv: ClarityValue): string {
  if (cv.type === ClarityType.PrincipalStandard) {
    return (cv as PrincipalCV & { address: string }).address;
  }
  if (cv.type === ClarityType.PrincipalContract) {
    const c = cv as any;
    return `${c.address}.${c.contractName}`;
  }
  return '';
}

function extractOptionalPrincipal(cv: ClarityValue): string | null {
  if (cv.type !== ClarityType.OptionalSome) return null;
  return extractPrincipal((cv as SomeCV).value);
}

function extractUtf8(cv: ClarityValue): string {
  return cv.type === ClarityType.StringUTF8 ? String((cv as any).data ?? '') : '';
}

// ─── Read functions ────────────────────────────────────────────────────────

/** Fetch a vault by id. Returns null if it doesn't exist. */
export async function fetchMultisigVault(vaultId: number, requesterAddress: string): Promise<MultisigVault | null> {
  try {
    const argHex = cvToHex(uintCV(vaultId));
    const cv = await callReadOnly('get-vault', [argHex], requesterAddress);

    if (cv.type !== ClarityType.OptionalSome) return null;

    const tuple = (cv as SomeCV).value as TupleCV;
    const d = tuple.data;

    const owners: string[] = [extractPrincipal(d['owner-1'])];
    const o2 = extractOptionalPrincipal(d['owner-2']);
    const o3 = extractOptionalPrincipal(d['owner-3']);
    const o4 = extractOptionalPrincipal(d['owner-4']);
    const o5 = extractOptionalPrincipal(d['owner-5']);
    [o2, o3, o4, o5].forEach((o) => { if (o) owners.push(o); });

    const balanceUstx = extractUint(d['balance-ustx']);

    return {
      vaultId,
      creator: extractPrincipal(d['creator']),
      owners,
      ownerCount: extractUint(d['owner-count']),
      threshold: extractUint(d['threshold']),
      active: extractBool(d['active']),
      balanceUstx,
      balanceStx: balanceUstx / 1_000_000,
    };
  } catch {
    return null;
  }
}

/** Look up the vault id that a given creator principal owns (their "primary" vault). */
export async function fetchVaultIdForCreator(creator: string, requesterAddress: string): Promise<number | null> {
  try {
    const argHex = cvToHex(standardPrincipalCV(creator));
    const cv = await callReadOnly('get-vault-id-for', [argHex], requesterAddress);
    if (cv.type !== ClarityType.OptionalSome) return null;
    return extractUint((cv as SomeCV).value);
  } catch {
    return null;
  }
}

/** Fetch a proposal by id. Returns null if it doesn't exist. */
export async function fetchProposal(proposalId: number, requesterAddress: string): Promise<MultisigProposal | null> {
  try {
    const argHex = cvToHex(uintCV(proposalId));
    const cv = await callReadOnly('get-proposal', [argHex], requesterAddress);
    if (cv.type !== ClarityType.OptionalSome) return null;

    const tuple = (cv as SomeCV).value as TupleCV;
    const d = tuple.data;
    const amountUstx = extractUint(d['amount-ustx']);

    return {
      proposalId,
      vaultId: extractUint(d['vault-id']),
      proposer: extractPrincipal(d['proposer']),
      recipient: extractPrincipal(d['recipient']),
      amountUstx,
      amountStx: amountUstx / 1_000_000,
      memo: extractUtf8(d['memo']),
      approvals: extractUint(d['approvals']),
      executed: extractBool(d['executed']),
      cancelled: extractBool(d['cancelled']),
    };
  } catch {
    return null;
  }
}

/** Check whether a given owner has already approved a given proposal. */
export async function fetchHasApproved(proposalId: number, owner: string, requesterAddress: string): Promise<boolean> {
  try {
    const args = [cvToHex(uintCV(proposalId)), cvToHex(standardPrincipalCV(owner))];
    const cv = await callReadOnly('has-approved', args, requesterAddress);
    return extractBool(cv);
  } catch {
    return false;
  }
}

/** Fetch the vault's authoritative tracked balance (in STX). */
export async function fetchVaultBalance(vaultId: number, requesterAddress: string): Promise<number | null> {
  try {
    const argHex = cvToHex(uintCV(vaultId));
    const cv = await callReadOnly('get-vault-balance', [argHex], requesterAddress);
    if (cv.type !== ClarityType.ResponseOk) return null;
    const inner = (cv as any).value as ClarityValue;
    return extractUint(inner) / 1_000_000;
  } catch {
    return null;
  }
}

// ─── Write-call argument encoders ───────────────────────────────────────────
// These return ClarityValue[] ready to pass into @stacks/connect's
// openContractCall / makeContractCall functionArgs.

/** create-vault(owner-2, owner-3, owner-4, owner-5, threshold) — extraOwners is up to 4 principals beyond the caller (owner-1). */
export function encodeCreateVaultArgs(extraOwners: string[], threshold: number) {
  const slots = [0, 1, 2, 3].map((i) =>
    extraOwners[i] ? someCV(standardPrincipalCV(extraOwners[i])) : noneCV()
  );
  return [...slots, uintCV(threshold)];
}

/** deposit(vault-id, amount-ustx) */
export function encodeDepositArgs(vaultId: number, amountStx: number) {
  const amountUstx = BigInt(Math.round(amountStx * 1_000_000));
  return [uintCV(vaultId), uintCV(amountUstx)];
}

/** propose-transfer(vault-id, recipient, amount-ustx, memo) */
export function encodeProposeTransferArgs(vaultId: number, recipient: string, amountStx: number, memo: string) {
  const amountUstx = BigInt(Math.round(amountStx * 1_000_000));
  return [uintCV(vaultId), standardPrincipalCV(recipient), uintCV(amountUstx), stringUtf8CV(memo.slice(0, 140))];
}

/** approve-proposal(proposal-id) */
export function encodeApproveProposalArgs(proposalId: number) {
  return [uintCV(proposalId)];
}

/** execute-proposal(proposal-id) */
export function encodeExecuteProposalArgs(proposalId: number) {
  return [uintCV(proposalId)];
}

/** cancel-proposal(proposal-id) */
export function encodeCancelProposalArgs(proposalId: number) {
  return [uintCV(proposalId)];
}

/** set-vault-active(vault-id, active) */
export function encodeSetVaultActiveArgs(vaultId: number, active: boolean) {
  return [uintCV(vaultId), boolCV(active)];
}
