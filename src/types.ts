/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionToken = 'STX' | 'sBTC' | 'aeUSDC' | 'USDCx';

export interface UserProfile {
  monthly_budget: number;
  personality: 'conservative' | 'balanced' | 'aggressive';
  current_balance: number;
}

export interface TransactionInput {
  item: string;
  price: number;
  category: string;
  token: TransactionToken;
  recipient: string;
}

export interface AIResponseBase {
  confidence: number;
}

export interface PersonalityResponse {
  personality: 'conservative' | 'balanced' | 'aggressive';
  monthly_budget_estimate: number;
  spending_habit_summary: string;
  risk_level: 'low' | 'medium' | 'high';
}

export interface DecisionResponse {
  decision: 'approve' | 'reject' | 'modify';
  suggested_amount: number;
  reason: string;
  confidence: number;
  security_audit: {
    address_valid: boolean;
    suspicious_score: number; // 0-100
    risk_summary: string;
  };
  tx_plan: {
    execute: boolean;
    token: TransactionToken;
    amount: number;
    recipient: string;
    network: 'mainnet';
  };
}

export interface CompareResponse {
  verdict: 'overspending' | 'efficient' | 'underutilized';
  difference: number;
  message: string;
}

export interface AutoModeResponse {
  auto_execute: boolean;
  reason: string;
}

export interface TransactionRecord {
  id: string;
  item: string;
  category: string;
  amount: number;
  token: TransactionToken;
  recipient: string;
  decision: 'approve' | 'reject' | 'modify';
  verdict: 'overspending' | 'efficient' | 'underutilized' | 'pending';
  timestamp: string;
}

export interface Contact {
  id: string;
  name: string;
  address: string;
  bns?: string;
}

export interface StackingInfo {
  isStacking: boolean;
  locked?: number;
  unlockBlock?: number;
  estimatedUnlockDate?: string;
  rewardCycle?: number;
}

export type ViewType =
  | 'landing'
  | 'engine'
  | 'history'
  | 'contacts'
  | 'request'
  | 'analytics'
  | 'vault'
  | 'more'
  | 'insights'
  | 'yield'
  | 'recurring'
  | 'multisig'
  | 'credit'
  | 'reputation';

export interface VaultStatus {
  configured: boolean;
  active: boolean;
  remainingStx: number;
  limitStx: number;
  spentStx: number;
}

export type TwinPayMode = 'generate_personality' | 'decision' | 'compare' | 'auto_mode';

export interface RecurringPayment {
  id: string;
  label: string;
  amount: number;
  token: TransactionToken;
  recipient: string;
  recipientLabel?: string;
  intervalDays: number;
  nextRunAt: string;
  createdAt: string;
  active: boolean;
  lastRunAt?: string;
  lastTxId?: string;
}

export interface ReputationEvent {
  id: string;
  kind: 'approved_payment' | 'vault_configured' | 'streak_milestone' | 'recurring_setup';
  detail: string;
  timestamp: string;
}
