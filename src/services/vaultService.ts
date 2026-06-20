/**
 * TwinPay Vault — Smart Contract Service
 * Contract: SPQ189E66S20X7ATY7794HBY6743JE9YJMCKHAEF.twinpay-vault
 * Clarity 2 — Stacks Mainnet
 */

import {
  cvToHex,
  hexToCV,
  standardPrincipalCV,
  uintCV,
  ClarityType,
  type ClarityValue,
  type SomeCV,
  type ResponseOkCV,
  type TupleCV,
  type UIntCV,
} from '@stacks/transactions';
import { HIRO_API_BASE } from '../stacks-config';

// ─── Contract Constants ────────────────────────────────────────────────────
export const VAULT_CONTRACT_ADDRESS = 'SPQ189E66S20X7ATY7794HBY6743JE9YJMCKHAEF';
export const VAULT_CONTRACT_NAME = 'twinpay-vault';
/** 4320 burn-blocks ≈ 30 days at ~10 min/block */
export const VAULT_WINDOW_BLOCKS = 4320;

// ─── Types ─────────────────────────────────────────────────────────────────
export interface VaultInfo {
  /** Spending limit in microSTX */
  limitUstx: number;
  /** Spending limit in STX */
  limitStx: number;
  /** Burn-block height when the current window started */
  windowStart: number;
  /** Amount spent in the current window (microSTX) */
  spent: number;
  /** Amount spent in the current window (STX) */
  spentStx: number;
  /** Whether the vault is active (not paused) */
  active: boolean;
  /** Remaining allowance for the current window (microSTX) */
  remaining: number;
  /** Remaining allowance for the current window (STX) */
  remainingStx: number;
}

// ─── Internal helper ───────────────────────────────────────────────────────

const HIRO_API_KEY = import.meta.env.VITE_HIRO_API_KEY as string | undefined;

/** Build common headers for every Hiro API request. */
function hiroHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (HIRO_API_KEY) h['x-api-key'] = HIRO_API_KEY;
  return h;
}

/** Retry a fetch-based thunk up to `maxRetries` times with exponential back-off. */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 600
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, delayMs * 2 ** attempt));
      }
    }
  }
  throw lastErr;
}

async function callReadOnly(
  functionName: string,
  argHexes: string[],
  sender: string
): Promise<ClarityValue> {
  return withRetry(async () => {
    const res = await fetch(
      `${HIRO_API_BASE}/v2/contracts/call-read/${VAULT_CONTRACT_ADDRESS}/${VAULT_CONTRACT_NAME}/${functionName}`,
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
  if (cv.type === ClarityType.UInt) return Number((cv as UIntCV).value);
  return 0;
}

function extractBool(cv: ClarityValue): boolean {
  return cv.type === ClarityType.BoolTrue;
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Fetch the vault configuration for a given owner address.
 * Returns null if vault has never been configured (ERR-NOT-CONFIGURED).
 */
export async function fetchVaultInfo(address: string): Promise<VaultInfo | null> {
  try {
    const argHex = cvToHex(standardPrincipalCV(address));

    // Sequential calls — avoids hitting Hiro rate-limit with two simultaneous requests
    const vaultCV = await callReadOnly('get-vault', [argHex], address);
    const remainingCV = await callReadOnly('get-remaining', [argHex], address).catch(() => null);

    // get-vault returns (optional {...})
    if (vaultCV.type === ClarityType.OptionalNone) return null;
    if (vaultCV.type !== ClarityType.OptionalSome) return null;

    const tupleCV = (vaultCV as SomeCV).value as TupleCV;
    const d = tupleCV.data;

    const limitUstx = extractUint(d['limit-ustx']);
    const windowStart = extractUint(d['window-start']);
    const spent = extractUint(d['spent']);
    const active = extractBool(d['active']);

    // get-remaining returns (response uint uint)
    let remaining = 0;
    if (remainingCV && remainingCV.type === ClarityType.ResponseOk) {
      remaining = extractUint((remainingCV as ResponseOkCV).value as UIntCV);
    }

    return {
      limitUstx,
      limitStx: limitUstx / 1_000_000,
      windowStart,
      spent,
      spentStx: spent / 1_000_000,
      active,
      remaining,
      remainingStx: remaining / 1_000_000,
    };
  } catch {
    return null;
  }
}

/**
 * Encode function arguments for `configure-vault(limit-ustx uint)`.
 * Returns the hex-encoded arg list ready to use with openContractCall.
 */
export function encodeConfigureVaultArgs(limitStx: number) {
  const limitUstx = Math.round(limitStx * 1_000_000);
  return [uintCV(limitUstx)];
}

/**
 * Encode function arguments for `execute-transfer(amount-ustx uint, recipient principal)`.
 */
export function encodeExecuteTransferArgs(amountStx: number, recipient: string) {
  const amountUstx = BigInt(Math.round(amountStx * 1_000_000));
  return [uintCV(amountUstx), standardPrincipalCV(recipient)];
}
