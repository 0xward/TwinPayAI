/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionToken = 'STX' | 'sBTC' | 'aeUSDC';

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
    network: 'stacks_mainnet';
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

export type ViewType = 'engine' | 'history';

export type TwinPayMode = 'generate_personality' | 'decision' | 'compare' | 'auto_mode';
