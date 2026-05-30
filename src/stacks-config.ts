/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppConfig, UserSession } from '@stacks/connect';
import { STACKS_MAINNET } from '@stacks/network';

// Stacks network the app operates on (Stacks Mainnet, secured by Bitcoin).
export const network = STACKS_MAINNET;

// Persistent session used to authenticate the user's Stacks wallet (Leather / Xverse).
export const appConfig = new AppConfig(['store_write']);
export const userSession = new UserSession({ appConfig });

export const APP_DETAILS = {
  name: 'TwinPay AI',
  icon: typeof window !== 'undefined' ? `${window.location.origin}/TwinPayAI_Logo.png` : '',
};

// SIP-010 token contracts on Stacks Mainnet.
// principal.contract-name :: asset-name
// TODO: confirm the exact mainnet contract principals for the tokens you support.
export const TOKEN_CONTRACTS: Record<string, { contract: string; name: string; decimals: number }> = {
  sBTC: {
    contract: 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token',
    name: 'sbtc-token',
    decimals: 8,
  },
  aeUSDC: {
    contract: 'SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc',
    name: 'token-aeusdc',
    decimals: 6,
  },
};
