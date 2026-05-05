/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { 
  TwinPayMode, 
  UserProfile, 
  TransactionInput, 
  PersonalityResponse, 
  DecisionResponse, 
  CompareResponse, 
  AutoModeResponse 
} from "../types.ts";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("GEMINI_API_KEY is missing. TwinPay AI will not be able to process logic.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "" });

const SYSTEM_INSTRUCTION = `
You are "TwinPay AI", a deterministic financial AI that makes transaction decisions and prepares execution data for Celo Mainnet via MiniPay.

You MUST ALWAYS return valid JSON only. No extra text.

BLOCKCHAIN CONTEXT:
* Network: Celo Mainnet
* Tokens: CELO (0x471EcE3750Da237f93B8E339c536989b8978a438), cUSD, USDT, cEUR
* Transactions must be simple, safe, and user-confirmed unless auto_mode is enabled.

LOGIC CORE:
* Analyze if the purchase aligns with the monthly budget and chosen personality (Conservative/Balanced/Aggressive).
* For 'decision' mode, audit the recipient address for basic safety (starts with 0x, length 42).
* For 'compare' mode, evaluate the actual spending vs suggested.
* For 'generate_personality', create a financial profile from user description.
`;

const RESPONSE_SCHEMAS: Record<string, any> = {
  generate_personality: {
    type: Type.OBJECT,
    properties: {
      personality: { type: Type.STRING, enum: ["conservative", "balanced", "aggressive"] },
      monthly_budget_estimate: { type: Type.NUMBER },
      spending_habit_summary: { type: Type.STRING },
      risk_level: { type: Type.STRING, enum: ["low", "medium", "high"] },
    },
    required: ["personality", "monthly_budget_estimate", "spending_habit_summary", "risk_level"]
  },
  decision: {
    type: Type.OBJECT,
    properties: {
      decision: { type: Type.STRING, enum: ["approve", "reject", "modify"] },
      suggested_amount: { type: Type.NUMBER },
      reason: { type: Type.STRING },
      confidence: { type: Type.NUMBER },
      security_audit: {
        type: Type.OBJECT,
        properties: {
          address_valid: { type: Type.BOOLEAN },
          suspicious_score: { type: Type.NUMBER },
          risk_summary: { type: Type.STRING },
        },
        required: ["address_valid", "suspicious_score", "risk_summary"]
      },
      tx_plan: {
        type: Type.OBJECT,
        properties: {
          execute: { type: Type.BOOLEAN },
          token: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          recipient: { type: Type.STRING },
          network: { type: Type.STRING },
        },
        required: ["execute", "token", "amount", "recipient", "network"]
      }
    },
    required: ["decision", "suggested_amount", "reason", "confidence", "security_audit", "tx_plan"]
  },
  compare: {
    type: Type.OBJECT,
    properties: {
      verdict: { type: Type.STRING, enum: ["overspending", "efficient", "underutilized"] },
      difference: { type: Type.NUMBER },
      message: { type: Type.STRING },
    },
    required: ["verdict", "difference", "message"]
  },
  auto_mode: {
    type: Type.OBJECT,
    properties: {
      auto_execute: { type: Type.BOOLEAN },
      reason: { type: Type.STRING },
    },
    required: ["auto_execute", "reason"]
  }
};

export async function twinPayAI(
  mode: TwinPayMode,
  data: {
    user_profile?: UserProfile;
    transaction?: TransactionInput;
    user_input?: string;
    comparison?: { actual_amount: number; ai_amount: number };
    auto_settings?: { auto_limit: number };
  }
): Promise<any> {
  if (!API_KEY) throw new Error("TwinPay AI requires a Gemini API Key.");

  const prompt = `MODE: ${mode}\nDATA: ${JSON.stringify(data)}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMAS[mode],
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      },
    });

    const text = response.text || "";
    if (!text) throw new Error("Empty response from TwinPay AI Engine.");
    
    return JSON.parse(text);
  } catch (error: any) {
    console.error("TwinPay AI Error:", error);
    // Be more descriptive about common network errors
    if (error.message?.includes("Failed to fetch") || error.message?.includes("network error")) {
        throw new Error("AI Connection failure. Please check your internet connection.");
    }
    if (error.message?.includes("API key")) {
        throw new Error("Invalid or missing Gemini API Key. System in read-only mode.");
    }
    throw error;
  }
}

// Shortcut methods for better DX
export async function generatePersonality(userInput: string): Promise<PersonalityResponse> {
  return twinPayAI("generate_personality", { user_input: userInput });
}

export async function makeDecision(
  profile: UserProfile, 
  tx: TransactionInput
): Promise<DecisionResponse> {
  return twinPayAI("decision", { user_profile: profile, transaction: tx });
}

export async function compareSpending(
  actual: number, 
  aiAmount: number
): Promise<CompareResponse> {
  return twinPayAI("compare", { comparison: { actual_amount: actual, ai_amount: aiAmount } });
}

export async function checkAutoMode(
  profile: UserProfile, 
  limit: number
): Promise<AutoModeResponse> {
  return twinPayAI("auto_mode", { user_profile: profile, auto_settings: { auto_limit: limit } });
}
