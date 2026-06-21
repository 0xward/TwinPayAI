# TwinPay AI // Agentic Payments on Stacks

**TwinPay AI** is an AI-powered personal finance and payments agent built on **Stacks**, the leading Bitcoin Layer 2. Describe a payment in plain English — *"send 5 STX to SP... for coffee"* — and an AI decision engine audits the recipient, checks it against your budget, and prepares a transaction for you to sign with your own wallet. Every payment settles on Stacks Mainnet and inherits Bitcoin's finality.

Beyond a single payment, TwinPay is built to grow with you: an on-chain spending vault, proactive AI insights, Bitcoin stacking visibility, recurring payments, and a verifiable track record — all on the same non-custodial foundation.

---

## Table of Contents

- [Core Concept](#core-concept)
- [Features](#features)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Smart Contracts](#smart-contracts)
- [Third-Party Integrations](#third-party-integrations)
- [Security Model](#security-model)
- [Roadmap](#roadmap)
- [License](#license)

---

## Core Concept

TwinPay never holds your funds and never signs on your behalf. The AI's job is limited to **proposing and auditing** — every transfer is reviewed and signed by you, inside your own Leather or Xverse wallet. On top of that, two on-chain Clarity contracts (TwinPay Vault and TwinPay Multisig Vault) let you enforce spending rules at the protocol level, so your budget isn't just a UI suggestion. Where a feature would otherwise require TwinPay to custody funds or run its own financial risk (like sBTC-collateralized lending), TwinPay instead integrates with an established, audited third-party protocol rather than rebuilding that risk surface itself.

## Features

### Payments & Decisioning
- **AI Decision Engine** — a Groq-hosted LLM reviews each proposed payment against your monthly budget, spending personality (conservative / balanced / aggressive), and recent history, returning `approve` / `modify` / `reject` with a confidence score and reasoning.
- **Pay by intent** — describe what you're paying for in natural language; TwinPay turns it into a concrete, signable transaction plan.
- **On-chain address auditing** — every recipient is checked against Stacks Mainnet via the Hiro API before you're asked to sign.
- **Multi-asset support** — STX (native), and SIP-010 tokens: sBTC, aeUSDC, USDCx.
- **BNS resolution** — pay `name.btc` addresses directly; TwinPay resolves them to a Stacks principal before signing.
- **Payment Requests** — generate a shareable link + QR code to receive a payment for a specific amount and asset.

### TwinPay Vault (on-chain)
- A deployed **Clarity smart contract** on Stacks Mainnet that enforces a per-window STX spending limit at the protocol level — not just in the app's UI.
- **Vault Auto-Pilot** — the AI suggests a sensible limit based on your budget, balance, and spending personality when you first configure the vault.
- Proactive "remaining balance" prompts so the vault feels like an active co-pilot, not a buried setting.

### Growth & Retention tools (the "More" hub)
- **AI Insight Digest** — a proactive, cached summary of your recent spending and vault status, with one concrete suggested next step — your co-pilot checking in, not just reacting to new payments.
- **BTC Yield** — a read-only panel showing live Proof-of-Transfer (PoX) network parameters (minimum stacking threshold, current cycle, network participation) and your personal stacking status, with links to pooled/liquid-stacking providers. TwinPay never moves your STX into stacking on your behalf.
- **Recurring Payments** — schedule a repeating payment (rent, subscriptions, allowances) once; when it's due, TwinPay surfaces a "Run now" action that routes through the exact same AI audit + wallet-signature flow as a one-off payment.
- **Trust Score** — a running score and day-streak computed from your approval history, laying the groundwork for an on-chain reputation system.
- **Multisig Vault** — a shared, on-chain vault with N-of-M owner approval (live on Mainnet). Create a vault with up to 5 owners, deposit STX, propose a transfer, and require quorum approval before it executes. See [Smart Contracts](#smart-contracts).
- **sBTC Credit Line** — borrow stablecoins against sBTC collateral without selling it, via [Zest Protocol](https://app.zestprotocol.com). TwinPay surfaces your sBTC balance and an illustrative borrow estimate, then routes you directly to Zest — it never custodies your collateral or runs its own lending pool. See [Third-Party Integrations](#third-party-integrations).

### Account
- **Transaction Ledger** — full history with AI reasoning, network context, and a link to the Stacks Explorer for every transaction.
- **Address Book** — save contacts by Stacks address or BNS name.
- **Analytics** — spending breakdowns by token/category and a month-over-month comparison.

## How It Works

1. **Connect** a Stacks wallet (Leather or Xverse) via `@stacks/connect`.
2. **Propose** a payment — description, amount, asset, and recipient (`SP...` address or `name.btc`).
3. **Analyze** — the request is sent to the AI decision engine (Groq), which returns a structured decision and a deterministic transaction plan.
4. **Authorize** — you review the plan and sign it in your wallet:
   - **STX** transfers use `openSTXTransfer` (amounts handled in microSTX).
   - **SIP-010 tokens** (sBTC, aeUSDC, USDCx) use `openContractCall` against the token's `transfer` function, protected by an exact fungible **post-condition** in `Deny` mode so no more than the intended amount can move.
   - If your **TwinPay Vault** is active, native STX transfers route through `execute-transfer` on the vault contract, which enforces your configured limit on-chain.
5. **Track** — confirmed transactions are stored in Firestore and linked to the Stacks Explorer; recurring schedules and contacts are stored the same way.

Live STX and SIP-010 balances, BNS resolution, and PoX network parameters are read from the public **Hiro API**. STX/USD pricing is sourced from CoinGecko with a Binance fallback.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript |
| Styling | Tailwind CSS v4 (custom dark theme, brass/orange accents, Fraunces display type) |
| Animation | Motion (`motion/react`) |
| Blockchain | Stacks (Bitcoin L2) via `@stacks/connect`, `@stacks/transactions`, `@stacks/network` |
| Smart Contracts | Clarity 2 (`contract/twinpay-vault.clar`) |
| Wallets | Leather & Xverse |
| Chain data | Hiro API (balances, BNS, PoX) + Stacks Explorer (links) |
| AI | Groq (LLM-based decision engine) |
| Infrastructure | Firebase (Firestore for history, contacts, recurring schedules) |
| Icons | lucide-react |

## Project Structure

```
TwinPayAI-main/
├── contract/
│   ├── twinpay-vault.clar      # On-chain spending-limit vault (Clarity 2, deployed on Mainnet)
│   ├── twinpay-multisig.clar   # On-chain N-of-M multisig vault (Clarity 3, deployed on Mainnet)
│   ├── DEPLOY.md               # TwinPay Vault: contract address, functions, deployment notes
│   └── DEPLOY-multisig.md      # TwinPay Multisig Vault: contract address, functions, deployment notes
├── public/                     # Static assets (logo, etc.)
├── src/
│   ├── components/             # All views and UI components
│   │   ├── LandingPage.tsx     # Marketing/landing page (features, how-it-works, FAQ)
│   │   ├── TransactionForm.tsx # "Propose a transaction" form (Engine view)
│   │   ├── DecisionCard.tsx    # AI decision result card
│   │   ├── VaultView.tsx       # TwinPay Vault configure/monitor UI + Auto-Pilot
│   │   ├── InsightDigest.tsx   # Proactive AI spending/vault digest
│   │   ├── YieldView.tsx       # BTC Yield / stacking panel
│   │   ├── RecurringView.tsx   # Recurring payments scheduler
│   │   ├── ReputationView.tsx  # Trust Score / streaks
│   │   ├── MoreView.tsx        # "More" hub (replaces the old standalone Analytics tab)
│   │   ├── MultisigView.tsx    # Multisig Vault UI — create/deposit/propose/approve/execute (live Mainnet)
│   │   ├── CreditLineView.tsx  # sBTC Credit Line — Zest Protocol integration panel
│   │   ├── HistoryView.tsx     # Transaction ledger (table + mobile card list)
│   │   ├── ContactsView.tsx    # Address book
│   │   ├── RequestView.tsx     # Payment request link/QR generator
│   │   ├── AnalyticsView.tsx   # Spending analytics
│   │   ├── WalletCard.tsx      # Connected wallet summary
│   │   ├── AboutModal.tsx      # About / How-to-use / FAQ modal
│   │   └── OnboardingModal.tsx # First-run onboarding walkthrough
│   ├── services/
│   │   ├── groqService.ts      # AI decision engine, insight digest, vault-limit suggestions
│   │   ├── vaultService.ts     # Reads/encodes calls to the TwinPay Vault contract
│   │   ├── multisigService.ts  # Reads/encodes calls to the TwinPay Multisig Vault contract
│   │   └── recurringService.ts # Firestore CRUD for recurring payment schedules
│   ├── lib/
│   │   └── firebase.ts         # Firebase app/Firestore initialization
│   ├── stacks-config.ts        # Network config, Hiro API helpers, BNS + PoX fetchers
│   ├── types.ts                # Shared TypeScript types
│   └── App.tsx                 # Root component, routing, wallet + Firestore wiring
├── .env.example
├── package.json
└── LICENSE
```

## Getting Started

### Prerequisites
- Node.js 18+
- A [Leather](https://leather.io) or [Xverse](https://xverse.app) wallet (for testing real signing flows)
- A free [Groq](https://console.groq.com) API key
- A [Firebase](https://firebase.google.com) project (Firestore enabled)

### Installation

```bash
git clone https://github.com/arawrdn/TwinPay-AI.git
cd TwinPay-AI
npm install
```

### Configure environment variables

Copy `.env.example` to `.env` and fill in your own values (see [Environment Variables](#environment-variables) below).

```bash
cp .env.example .env
```

### Run the development server

```bash
npm run dev
```

### Type-check and build

```bash
npm run lint    # tsc --noEmit
npm run build   # vite build → dist/
npm run preview # preview the production build locally
```

## Environment Variables

All variables are documented with comments in [`.env.example`](./.env.example).

| Variable | Required | Description |
|---|---|---|
| `VITE_GROQ_API_KEY` | Yes | Groq API key powering the AI decision engine, insight digest, and vault-limit suggestions. Get one at [console.groq.com](https://console.groq.com). |
| `VITE_HIRO_API_KEY` | Recommended | Hiro API key for higher rate limits when reading balances, BNS names, and PoX data. Get one at [platform.hiro.so](https://platform.hiro.so). |
| `VITE_FIREBASE_CONFIG` | Yes | The full Firebase Web App config object (JSON string) — used for Firestore (transaction history, contacts, recurring schedules). |

## Smart Contract — TwinPay Vault

| Field | Value |
|---|---|
| **Contract** | `SPQ189E66S20X7ATY7794HBY6743JE9YJMCKHAEF.twinpay-vault` |
| **Network** | Stacks Mainnet |
| **Language** | Clarity 2 |
| **Source** | [`contract/twinpay-vault.clar`](./contract/twinpay-vault.clar) |

The vault lets a user configure a per-window STX spending limit that is enforced **on-chain** — once active, `execute-transfer` calls are checked against the remaining allowance by the contract itself, independent of the frontend. See [`contract/DEPLOY.md`](./contract/DEPLOY.md) for the full function reference and deployment notes.

## Security Model

- **Non-custodial** — TwinPay never controls your private keys or funds. Every transaction requires an explicit signature in your own wallet.
- **Strict post-conditions** — SIP-010 token transfers attach an exact fungible post-condition in `Deny` mode, so a transaction cannot move more than the amount you approved.
- **On-chain enforcement, not just UI** — once configured, the TwinPay Vault contract enforces your spending limit at the protocol level.
- **AI as advisor, not authority** — the AI's analysis is an aid, not a guarantee or an autopilot. Recurring payments and vault suggestions always require your review and your wallet signature before anything is broadcast.
- Always verify the recipient address and amount inside your wallet's signing popup before confirming. Blockchain transactions are irreversible.

## Roadmap

- [x] AI Decision Engine (approve / modify / reject with reasoning)
- [x] TwinPay Vault — on-chain spending limit (deployed, Mainnet)
- [x] Vault Auto-Pilot (AI-suggested limits)
- [x] AI Insight Digest (proactive spending/vault summaries)
- [x] BTC Yield panel (live PoX data + stacking provider links)
- [x] Recurring Payments
- [x] Trust Score (off-chain v1, computed from transaction history)
- [x] **Multisig Vault** — shared vaults with N-of-M threshold approval, extending the current Vault contract
- [x] On-chain Trust Score — mirror reputation milestones via contract events instead of client-side computation only
- [ ] **sBTC Credit Line** — borrow STX against sBTC collateral without selling it, with on-chain price oracle and liquidation logic


## License

This project is licensed under the **Apache License 2.0** — see [`LICENSE`](./LICENSE) for the full text.
