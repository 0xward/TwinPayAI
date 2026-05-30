# TwinPay AI // Agentic Payments for Stacks

TwinPay AI is an AI-powered personal finance and payments app for the **Stacks** blockchain, the leading Bitcoin Layer 2. You describe what you want in plain English (for example, *"send 5 STX to SP... for coffee"*), and an AI agent analyzes the request against your budget, audits the recipient, and prepares a transaction that you sign with your own Stacks wallet. Every payment settles on Stacks and is ultimately secured by Bitcoin finality.

## What it does
- **AI money management:** The agent reviews each proposed payment against your monthly budget and chosen spending personality (conservative, balanced, or aggressive) and returns an `approve` / `modify` / `reject` decision with a confidence score and reasoning.
- **Pay by intent:** Describe a payment in natural language; the AI turns it into a concrete, signable Stacks transaction plan.
- **Real on-chain execution:** You always sign in your own wallet. TwinPay never holds funds or signs on your behalf.
- **Post-payment insight:** After each transaction, the AI compares what you actually spent against its suggestion and records the outcome.

## How it works
1. **Connect** a Stacks wallet (Leather or Xverse) with `@stacks/connect`.
2. **Propose** a payment (description, amount, asset, recipient `SP...` address).
3. **Analyze** — the request is sent to the Gemini AI engine, which returns a structured decision and a deterministic transaction plan.
4. **Authorize** — you review the plan and sign it in your wallet:
   - **STX** transfers use `openSTXTransfer` (amounts handled in microSTX).
   - **SIP-010 tokens** (sBTC, aeUSDC) use `openContractCall` against the token's `transfer` function, protected by an exact fungible **post-condition** in `Deny` mode so no more than the intended amount can move.
5. **Track** — confirmed transactions are stored in Firestore and linked to the Stacks Explorer.

Live STX and SIP-010 balances are read from the public **Hiro API**, and the STX/USD price is sourced from CoinGecko with a Binance fallback.

## Tech Stack
- **Frontend:** React 19 + Vite + TypeScript
- **Styling:** Tailwind CSS (dark, Arkham-style aesthetic with an orange gradient)
- **Blockchain:** Stacks (Bitcoin L2) via `@stacks/connect`, `@stacks/transactions`, `@stacks/network`
- **Wallets:** Leather & Xverse
- **Chain data:** Hiro API (balances) and Stacks Explorer (links)
- **AI:** Google Gemini (`@google/genai`)
- **Infrastructure:** Firebase (Firestore & Auth)

## Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/arawrdn/TwinPay-AI.git
   cd TwinPay-AI
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file based on `.env.example`:
   - `GEMINI_API_KEY` — Google Gemini API key used by the AI decision engine.
   - `VITE_FIREBASE_CONFIG` — JSON string with your Firebase project configuration.
   - `APP_URL` — the URL where the app is hosted.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Type-check / build:**
   ```bash
   npm run lint   # tsc --noEmit
   npm run build
   ```

## Security
- TwinPay AI is **non-custodial**: it never controls your keys or funds. All transactions require an explicit signature in your wallet.
- SIP-010 transfers attach a strict post-condition so a transaction cannot transfer more than the amount you approved.
- The AI analysis is an aid, not a guarantee. Always verify the recipient and amount in your wallet before signing.

## License
This project is licensed under the MIT License.
