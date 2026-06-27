/**
 * Groq AI Service – multi-model fallback with on-chain verification support.
 */

import { TransactionRecord } from '../types';
import { TwinPayClient } from '@0xward/twinpayai-client';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";

// Single shared client instance used to estimate on-chain fees before the
// AI makes its approve/modify/reject decision, instead of relying on a
// hardcoded fee assumption in the prompt.
const twinPayClient = new TwinPayClient({ network: "mainnet" });

const MODEL_LIST = [
  "llama-3.3-70b-versatile",
  "qwen-2.5-32b",
  "llama-3.1-8b-instant",
];

export async function generatePersonality(userInput: string): Promise<any> {
  return callGroq(
    `Generate a financial personality profile based on this description: "${userInput}". Return JSON: { personality: "conservative"|"balanced"|"aggressive", monthly_budget_estimate: number, spending_habit_summary: string, risk_level: "low"|"medium"|"high" }`
  );
}

export async function makeDecision(
  profile: { monthly_budget: number; personality: string; current_balance: number },
  tx: { item: string; price: number; token: string; recipient: string; onChain?: any },
  recentTransactions?: TransactionRecord[]
): Promise<any> {
  const onChainInfo = tx.onChain
    ? `\nRecipient on-chain: transactions: ${tx.onChain.tx_count}, STX balance: ${tx.onChain.balance} microSTX.`
    : "";

  const historyContext =
    recentTransactions && recentTransactions.length > 0
      ? `\nUser's last ${recentTransactions.length} transactions:\n${recentTransactions
          .map(
            (t) =>
              `- ${t.item} | $${t.amount} ${t.token} | decision: ${t.decision} | verdict: ${t.verdict} | ${new Date(t.timestamp).toLocaleDateString()}`
          )
          .join("\n")}`
      : "";

  // Dynamically estimate the network fee for this transaction amount via
  // the TwinPay client SDK, instead of assuming a fixed ~0.01 STX fee.
  let feeContext = "Estimated fee: ~0.01 STX (fallback).";
  try {
    const feeEstimate = twinPayClient.estimateFee(tx.price);
    feeContext = `Estimated fee: ${feeEstimate.estimatedFeeStx} STX (≈$${feeEstimate.estimatedFeeUsd} USD) on ${feeEstimate.network}.`;
  } catch (err) {
    console.warn("[TwinPayClient] estimateFee failed, using fallback fee context.", err);
  }

  return callGroq(
    `You are TwinPay AI, a financial AI for Stacks Mainnet.
User profile: monthly budget $${profile.monthly_budget}, personality: ${profile.personality}, current STX balance: ${profile.current_balance.toFixed(6)} STX.
Transaction: buy "${tx.item}" for $${tx.price} using ${tx.token}, recipient: ${tx.recipient}.${onChainInfo}${historyContext}
${feeContext}

Using the transaction history above (if provided), detect any spending anomalies or patterns and factor them into your decision. Give personalized advice.

Decide: approve, modify, or reject.
- If user balance >= price + fee (see estimated fee above), approve.
- If balance insufficient but close, suggest a modified lower amount.
- Reject only if far over budget or highly suspicious.
Security audit: validate recipient address format. New addresses are acceptable.
Return ONLY JSON:
{
  "decision": "approve" | "modify" | "reject",
  "suggested_amount": number,
  "reason": string,
  "confidence": number (0-1),
  "security_audit": {
    "address_valid": boolean,
    "suspicious_score": number,
    "risk_summary": string
  },
  "tx_plan": {
    "execute": boolean,
    "token": "STX",
    "amount": number,
    "recipient": string,
    "network": "mainnet"
  }
}`
  );
}

export async function compareSpending(actual: number, aiAmount: number): Promise<any> {
  return callGroq(
    `Actual spent: ${actual}, AI suggested: ${aiAmount}. Compare and return JSON: { verdict: "overspending"|"efficient"|"underutilized", difference: number, message: string }`
  );
}

export async function checkAutoMode(profile: any, limit: number): Promise<any> {
  return callGroq(
    `Auto mode settings: limit ${limit}, profile: ${JSON.stringify(profile)}. Should auto-execute? Return JSON: { auto_execute: boolean, reason: string }`
  );
}

export interface InsightDigest {
  headline: string;
  summary: string;
  highlights: { label: string; detail: string; tone: "positive" | "warning" | "neutral" }[];
  recommendation: string;
  trend: "up" | "down" | "flat";
}

/**
 * Generates a proactive spending/vault digest from recent transaction history.
 * Designed to be called on a cadence (e.g. on app open, once per day) rather
 * than only in reaction to a new transaction — this is what gives the AI a
 * "check in on me" feel instead of a one-shot approval tool.
 */
export async function generateInsightDigest(
  profile: { monthly_budget: number; personality: string; current_balance: number },
  recentTransactions: TransactionRecord[],
  vault?: { configured: boolean; active: boolean; limitStx: number; spentStx: number; remainingStx: number } | null
): Promise<InsightDigest> {
  const txContext =
    recentTransactions.length > 0
      ? recentTransactions
          .map(
            (t) =>
              `- ${t.item} | $${t.amount} ${t.token} | category: ${t.category} | verdict: ${t.verdict} | ${new Date(t.timestamp).toLocaleDateString()}`
          )
          .join("\n")
      : "No transactions recorded yet.";

  const vaultContext = vault?.configured
    ? `Vault: limit ${vault.limitStx} STX/window, spent ${vault.spentStx.toFixed(4)} STX, remaining ${vault.remainingStx.toFixed(4)} STX, ${vault.active ? "active" : "paused"}.`
    : "Vault: not configured.";

  return callGroq(
    `You are TwinPay AI reviewing a user's recent activity to produce a short proactive digest (like a financial co-pilot checking in, not a transaction approval).
User profile: monthly budget $${profile.monthly_budget}, personality: ${profile.personality}, current balance: ${profile.current_balance.toFixed(4)} STX.
${vaultContext}
Recent transactions:
${txContext}

Write a concise, encouraging but honest digest. Mention concrete numbers where possible. If there isn't much history, focus on onboarding-style encouragement (e.g. suggest configuring the vault, or making a first payment) rather than inventing patterns that aren't there.
Return ONLY JSON:
{
  "headline": string (max 8 words, e.g. "You're 12% under budget this window"),
  "summary": string (1-2 sentences),
  "highlights": [{ "label": string, "detail": string, "tone": "positive"|"warning"|"neutral" }] (2-4 items),
  "recommendation": string (one concrete next action),
  "trend": "up"|"down"|"flat"
}`
  );
}

export interface VaultLimitSuggestion {
  suggested_limit_stx: number;
  reasoning: string;
}

/**
 * Suggests a sensible vault spending limit based on the user's stated budget,
 * personality and current balance — used to make vault setup feel like
 * guided advice rather than a blank numeric field.
 */
export async function suggestVaultLimit(profile: {
  monthly_budget: number;
  personality: string;
  current_balance: number;
}): Promise<VaultLimitSuggestion> {
  return callGroq(
    `A user wants TwinPay AI to suggest a monthly on-chain spending limit (in STX) for their TwinPay Vault smart contract.
Profile: monthly budget $${profile.monthly_budget}, personality: ${profile.personality}, current balance: ${profile.current_balance.toFixed(4)} STX.
The limit should be realistic relative to their current balance (never suggest more than ~80% of current balance) and aligned with their personality (conservative = lower % of balance, aggressive = higher %).
Return ONLY JSON:
{ "suggested_limit_stx": number, "reasoning": string (1 sentence) }`
  );
}

async function callGroq(prompt: string): Promise<any> {
  if (!GROQ_API_KEY) {
    throw new Error("VITE_GROQ_API_KEY not found. Set it in Vercel environment variables.");
  }

  let lastError: Error | null = null;

  for (const model of MODEL_LIST) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are TwinPay AI, a financial agent for Stacks blockchain. You MUST return ONLY valid JSON, no extra text. Analyze transactions based on user budget & personality, audit addresses, and generate execution plans.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[Groq] Model ${model} failed: ${errorText}`);
        lastError = new Error(`Groq API error (${response.status})`);
        continue;
      }

      const data = await response.json();
      const raw = data.choices?.[0]?.message?.content;
      if (!raw) {
        console.warn(`[Groq] Model ${model} returned empty content`);
        continue;
      }

      try {
        return JSON.parse(raw);
      } catch {
        console.warn(`[Groq] Model ${model} returned non-JSON`);
        continue;
      }
    } catch (fetchError: any) {
      console.warn(`[Groq] Network error with model ${model}`);
      lastError = fetchError;
    }
  }

  throw new Error(`All Groq models failed. Last error: ${lastError?.message}`);
}
