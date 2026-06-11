# TwinPay Vault — Contract Deployment Guide

## Contract Info

| Field | Value |
|---|---|
| **Contract Address** | `SPQ189E66S20X7ATY7794HBY6743JE9YJMCKHAEF.twinpay-vault` |
| **Network** | Stacks Mainnet |
| **Language** | Clarity 2 |
| **File** | `contract/twinpay-vault.clar` |

---

## Functions

### Write Functions

| Function | Args | Description |
|---|---|---|
| `configure-vault` | `(limit-ustx uint)` | Set spending limit per window |
| `set-active` | `(active bool)` | Pause or activate the vault |
| `execute-transfer` | `(amount-ustx uint) (recipient principal)` | Route STX via the vault, enforcing the window limit |
| `reset-window` | — | Manually reset the spending window |

### Read-Only Functions

| Function | Args | Returns |
|---|---|---|
| `get-vault` | `(owner principal)` | `(optional { limit-ustx, window-start, spent, active })` |
| `get-remaining` | `(owner principal)` | `(response uint uint)` |

---

## Error Codes

| Code | Constant | Meaning |
|---|---|---|
| `u100` | `ERR-NOT-CONFIGURED` | Vault hasn't been configured yet |
| `u101` | `ERR-ZERO-AMOUNT` | Amount must be > 0 |
| `u102` | `ERR-OVER-LIMIT` | Single transfer exceeds the configured limit |
| `u103` | `ERR-CAP-REACHED` | Window cap would be exceeded |
| `u104` | `ERR-PAUSED` | Vault is paused |
| `u105` | `ERR-TRANSFER-FAILED` | Inner `stx-transfer?` failed |

---

## Window Rules

- Window size: **4320 burn-blocks** (~30 days at ~10 min/block)
- The window auto-resets on the first transfer after expiry
- `reset-window` manually restarts the counter at any time

---

## Deploying via Hiro Platform

1. Open [platform.hiro.so](https://platform.hiro.so)
2. Connect your Stacks wallet
3. Paste the contents of `twinpay-vault.clar`
4. Deploy to **Mainnet**
5. Copy the contract address and update `VAULT_CONTRACT_ADDRESS` in `src/services/vaultService.ts`

---

## Web Integration

The frontend integrates via `src/services/vaultService.ts`.

- `fetchVaultInfo(address)` — reads vault config via Hiro REST API
- `encodeConfigureVaultArgs(limitStx)` — encodes `configure-vault` args
- `encodeExecuteTransferArgs(amountStx, recipient)` — encodes `execute-transfer` args

The Decision Engine in `App.tsx` automatically routes STX transfers through the vault when:
1. The vault is configured
2. The vault is active (`active: true`)
3. The transfer amount is within the remaining window allowance

If the remaining allowance is insufficient, it falls back to a direct `openSTXTransfer`.
