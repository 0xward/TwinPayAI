/**
 * Groq AI Service – multi-model fallback with on-chain verification support.
 */

import { TransactionRecord } from '../types';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";

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

  return callGroq(
    `You are TwinPay AI, a financial AI for Stacks Mainnet.
User profile: monthly budget $${profile.monthly_budget}, personality: ${profile.personality}, current STX balance: ${profile.current_balance.toFixed(6)} STX.
Transaction: buy "${tx.item}" for $${tx.price} using ${tx.token}, recipient: ${tx.recipient}.${onChainInfo}${historyContext}

Using the transaction history above (if provided), detect any spending anomalies or patterns and factor them into your decision. Give personalized advice.

Decide: approve, modify, or reject.
- If user balance >= price + fee (~0.0005 STX), approve.
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
