import { AppConfig, UserSession } from '@stacks/connect';
import { StacksMainnet } from '@stacks/network';
import { StackingInfo } from './types';

export const network = new StacksMainnet();

export const HIRO_API_BASE = 'https://api.hiro.so';
export const EXPLORER_BASE = 'https://explorer.hiro.so';

/** Build common headers for every Hiro API request. */
function hiroHeaders(): HeadersInit {
  const key = import.meta.env.VITE_HIRO_API_KEY as string | undefined;
  return key ? { 'x-api-key': key } : {};
}

// ─── TwinPay Vault Contract ────────────────────────────────────────────────
export const VAULT_CONTRACT = {
  address: 'SPQ189E66S20X7ATY7794HBY6743JE9YJMCKHAEF',
  name: 'twinpay-vault',
  /** Full identifier used in explorer/API calls */
  get fullId() { return `${this.address}.${this.name}`; },
  /** 4320 burn-blocks ≈ 30 days at ~10 min/block */
  windowBlocks: 4320,
} as const;

export const appConfig = new AppConfig(['store_write']);
export const userSession = new UserSession({ appConfig });

export const APP_DETAILS = {
  name: 'TwinPay AI',
  icon: typeof window !== 'undefined' ? `${window.location.origin}/TwinPayAI_Logo.png` : '',
};

export interface TokenInfo {
  contract: string;
  assetName: string;
  decimals: number;
}

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
  USDCx: {
    contract: 'SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc',
    assetName: 'token-aeusdc',
    decimals: 6,
  },
};

export function explorerTxUrl(txId: string): string {
  const id = txId.startsWith('0x') ? txId : `0x${txId}`;
  return `${EXPLORER_BASE}/txid/${id}?chain=mainnet`;
}

export function explorerAddressUrl(address: string): string {
  return `${EXPLORER_BASE}/address/${address}?chain=mainnet`;
}

export interface StacksBalances {
  stx: number;
  tokens: Record<string, number>;
}

export async function fetchStacksBalances(address: string): Promise<StacksBalances> {
  const response = await fetch(`${HIRO_API_BASE}/extended/v1/address/${address}/balances`, {
    headers: hiroHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to load balances (HTTP ${response.status})`);
  }
  const data = await response.json();
  const stx = Number(data?.stx?.balance ?? 0) / 1_000_000;
  const tokens: Record<string, number> = {};
  const fungible = data?.fungible_tokens ?? {};
  for (const [symbol, info] of Object.entries(TOKEN_CONTRACTS)) {
    const key = `${info.contract}::${info.assetName}`;
    const raw = (fungible as Record<string, { balance?: string }>)[key]?.balance;
    tokens[symbol] = raw ? Number(raw) / 10 ** info.decimals : 0;
  }
  return { stx, tokens };
}

// Average Stacks block time in seconds (~10 minutes)
const STACKS_BLOCK_TIME_SECONDS = 600;

export async function fetchStackingInfo(address: string): Promise<StackingInfo> {
  try {
    const response = await fetch(`${HIRO_API_BASE}/extended/v2/accounts/${address}/stacking`, {
      headers: hiroHeaders(),
    });
    if (!response.ok) {
      return { isStacking: false };
    }
    const data = await response.json();

    // Check if stacking is active
    if (!data?.stacked || data.stacked === false) {
      return { isStacking: false };
    }

    const locked = data?.locked ? Number(data.locked) / 1_000_000 : 0;
    const unlockBlock: number | undefined = data?.unlock_height ?? data?.burnchain_unlock_height;

    let estimatedUnlockDate: string | undefined;
    if (unlockBlock) {
      try {
        const infoRes = await fetch(`${HIRO_API_BASE}/v2/info`, { headers: hiroHeaders() });
        if (infoRes.ok) {
          const info = await infoRes.json();
          const currentBlock: number = info?.burn_block_height ?? info?.stacks_tip_height ?? 0;
          if (currentBlock && unlockBlock > currentBlock) {
            const blocksLeft = unlockBlock - currentBlock;
            const secondsLeft = blocksLeft * STACKS_BLOCK_TIME_SECONDS;
            const unlockDate = new Date(Date.now() + secondsLeft * 1000);
            estimatedUnlockDate = unlockDate.toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });
          }
        }
      } catch {
        // silently fail date estimation
      }
    }

    return {
      isStacking: true,
      locked,
      unlockBlock,
      estimatedUnlockDate,
      rewardCycle: data?.reward_cycle_id ?? undefined,
    };
  } catch {
    return { isStacking: false };
  }
}

export async function resolveBnsName(name: string): Promise<string | null> {
  try {
    const response = await fetch(`${HIRO_API_BASE}/v1/names/${encodeURIComponent(name)}`, {
      headers: hiroHeaders(),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.address ?? null;
  } catch {
    return null;
  }
}
