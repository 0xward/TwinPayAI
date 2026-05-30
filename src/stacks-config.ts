/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppConfig, UserSession } from '@stacks/connect';
import { STACKS_MAINNET } from '@stacks/network';

// Stacks network the app operates on (Stacks Mainnet, secured by Bitcoin).
export const network = STACKS_MAINNET;

// Hiro public API base used for read-only chain queries (balances, etc.).
export const HIRO_API_BASE = 'https://api.hiro.so';

// Public Stacks block explorer.
export const EXPLORER_BASE = 'https://explorer.hiro.so';

// Persistent session used to authenticate the user's Stacks wallet (Leather / Xverse).
export const appConfig = new AppConfig(['store_write']);
export const userSession = new UserSession({ appConfig });

export const APP_DETAILS = {
  name: 'TwinPay AI',
  icon: typeof window !== 'undefined' ? `${window.location.origin}/TwinPayAI_Logo.png` : '',
};

export interface TokenInfo {
  /** Fully qualified contract id: `principal.contract-name`. */
  contract: string;
  /** SIP-010 asset identifier inside the contract. */
  assetName: string;
  /** Number of decimals the token uses. */
  decimals: number;
}

// SIP-010 token contracts on Stacks Mainnet.
export const TOKEN_CONTRACTS: Record<string, TokenInfo> = {
  sBTC: {
    contract: 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token',
    assetName: 'sbtc-token',
    decimals: 8,
  },
  aeUSDC: {
    contract: 'SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc',
    assetName: 'token-aeusdc',
    decimals: 6,
  },
};

/** Build a link to a transaction on the Stacks Explorer. */
export function explorerTxUrl(txId: string): string {
  const id = txId.startsWith('0x') ? txId : `0x${txId}`;
  return `${EXPLORER_BASE}/txid/${id}?chain=mainnet`;
}

/** Build a link to an address on the Stacks Explorer. */
export function explorerAddressUrl(address: string): string {
  return `${EXPLORER_BASE}/address/${address}?chain=mainnet`;
}

export interface StacksBalances {
  /** Native STX balance, already converted to whole STX. */
  stx: number;
  /** SIP-010 balances keyed by the token symbol (e.g. `sBTC`), in whole units. */
  tokens: Record<string, number>;
}

/**
 * Fetch live balances for a Stacks address from the Hiro API.
 * Returns the native STX balance plus any tracked SIP-010 token balances.
 */
export async function fetchStacksBalances(address: string): Promise<StacksBalances> {
  const response = await fetch(`${HIRO_API_BASE}/extended/v1/address/${address}/balances`);
  if (!response.ok) {
    throw new Error(`Failed to load balances (HTTP ${response.status})`);
  }
  const data = await response.json();

  const stx = Number(data?.stx?.balance ?? 0) / 1_000_000;

  const tokens: Record<string, number> = {};
  const fungible = data?.fungible_tokens ?? {};
  for (const [symbol, info] of Object.entries(TOKEN_CONTRACTS)) {
    // Hiro keys fungible tokens as `contract::asset-name`.
    const key = `${info.contract}::${info.assetName}`;
    const raw = (fungible as Record<string, { balance?: string }>)[key]?.balance;
    tokens[symbol] = raw ? Number(raw) / 10 ** info.decimals : 0;
  }

  return { stx, tokens };
}
