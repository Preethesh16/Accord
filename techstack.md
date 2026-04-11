# Accord — Tech Stack

## Overview

Accord is a Trustless Deal Engine that combines AI-powered negotiation with blockchain-based escrow. Three AI seller agents compete for a buyer's task, a scoring optimizer picks the best deal, and an Algorand smart contract locks funds until delivery conditions are verified by an AI oracle.

---

## Frontend

| Technology | Version | Purpose | Source |
|---|---|---|---|
| React | 18.2.0 | UI framework — component-based interface | [react.dev](https://react.dev) |
| Vite | 5.0.0 | Build tool & dev server — fast HMR, ES module bundling | [vitejs.dev](https://vitejs.dev) |
| Tailwind CSS | 3.4.0 | Utility-first CSS framework — dark theme, custom Accord palette | [tailwindcss.com](https://tailwindcss.com) |
| AlgoSDK | 3.5.2 | Algorand JavaScript SDK — transaction building, encoding | [github.com/algorand/js-algorand-sdk](https://github.com/algorand/js-algorand-sdk) |
| Pera Wallet Connect | 1.3.4 | Wallet integration — connect, sign transactions via WalletConnect relay | [github.com/perawallet/connect](https://github.com/perawallet/connect) |
| vite-plugin-node-polyfills | 0.26.0 | Polyfills Buffer, process, stream for browser (needed by Pera/AlgoSDK) | [npmjs.com](https://www.npmjs.com/package/vite-plugin-node-polyfills) |

**Dev Server:** `localhost:5173`

---

## Backend

| Technology | Version | Purpose | Source |
|---|---|---|---|
| Node.js | 20.x | Runtime — server-side JavaScript | [nodejs.org](https://nodejs.org) |
| Express | 4.18.2 | HTTP framework — REST API routes | [expressjs.com](https://expressjs.com) |
| AlgoSDK | 3.5.2 | Algorand SDK — deploy contracts, sign oracle transactions, read state | [github.com/algorand/js-algorand-sdk](https://github.com/algorand/js-algorand-sdk) |
| Anthropic AI SDK | 0.39.0 | Claude API client — fallback negotiation engine | [github.com/anthropics/anthropic-sdk-node](https://github.com/anthropics/anthropic-sdk-node) |
| dotenv | 16.3.1 | Environment variable loader | [npmjs.com](https://www.npmjs.com/package/dotenv) |
| cors | 2.8.5 | Cross-origin resource sharing middleware | [npmjs.com](https://www.npmjs.com/package/cors) |
| uuid | 9.0.0 | Unique ID generation for deals | [npmjs.com](https://www.npmjs.com/package/uuid) |

**API Server:** `localhost:3001`

### API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Health check |
| `/api/negotiate` | POST | Run AI negotiation — 3 sellers, 2 rounds, returns winner + contract |
| `/api/fund` | POST | Submit buyer-signed funding transactions to Algorand |
| `/api/verify` | POST | Oracle verifies delivery completion on-chain |
| `/api/release` | POST | Oracle releases escrowed funds to seller |
| `/api/refund` | POST | Oracle refunds escrowed funds to buyer |
| `/api/deliver` | POST | AI delivery evaluation — seller generates update, oracle judges |
| `/api/contract/:appId` | GET | Read on-chain contract state |

---

## Smart Contract (Algorand)

| Technology | Version | Purpose | Source |
|---|---|---|---|
| AlgoKit | 2.0+ | Algorand development toolkit — compile, deploy, manage contracts | [github.com/algorand/algokit-cli](https://github.com/algorand/algokit-cli) |
| Puya (algorand-python) | 2.x | Python-to-TEAL compiler — write smart contracts in Python | [github.com/algorand/puya](https://github.com/algorand/puya) |
| Algorand TestNet | — | Public test blockchain — free transactions, faucet-funded accounts | [testnet.algoexplorer.io](https://testnet.algoexplorer.io) |

### Contract: DealEscrow (ARC-4)

Written in Python using Puya, compiled to TEAL bytecode, deployed on Algorand TestNet.

**State Machine:** `empty(0) → created(1) → funded(2) → verified(3) → released(4) / refunded(5)`

**Methods:**
- `createDeal(buyer, seller, amount, deadline)` — Oracle sets deal conditions
- `fundDeal(payment)` — Buyer deposits ALGO into escrow
- `verifyComplete()` — Oracle marks delivery as verified
- `releaseFunds()` — Inner transaction pays the seller
- `refundBuyer()` — Inner transaction returns funds to buyer

**Deployed App ID:** `758614211`

---

## AI / LLM Layer

### Self-Hosted LLM Middleware

| Technology | Version | Purpose | Source |
|---|---|---|---|
| FastAPI | 0.116.0 | Python API framework — serves negotiation and delivery endpoints | [fastapi.tiangolo.com](https://fastapi.tiangolo.com) |
| Uvicorn | 0.35.0 | ASGI server — runs FastAPI in production | [uvicorn.org](https://www.uvicorn.org) |
| vLLM | latest | High-throughput LLM inference server — serves the model via OpenAI-compatible API | [github.com/vllm-project/vllm](https://github.com/vllm-project/vllm) |
| ROCm | — | AMD GPU compute platform — hardware acceleration for LLM inference | [rocm.docs.amd.com](https://rocm.docs.amd.com) |
| Docker + Docker Compose | — | Containerization — runs vLLM and middleware as services | [docker.com](https://www.docker.com) |

**Hosted on:** AMD GPU Droplet (`165.245.134.230`)
- Port `9000` — FastAPI middleware (receives negotiation/delivery requests from backend)
- Port `8001` — vLLM server (internal, serves model inference)

### How the AI Works

1. **Negotiation:** Backend sends task details to LLM middleware → LLM generates seller responses in character (SpeedyDev, QualityCraft, BudgetPro) → 2 rounds of bidding
2. **Delivery Evaluation:** Seller AI generates a delivery update → Oracle AI evaluates it → auto-triggers release or refund on the smart contract
3. **Fallback:** If LLM middleware is down, falls back to Anthropic Claude API (`claude-sonnet-4-20250514`), then to hardcoded mock templates

### LLM Configuration

| Parameter | Value |
|---|---|
| Temperature | 0.2 |
| Top P | 0.8 |
| Max Tokens | 160 |
| Request Timeout | 60s |
| Session TTL | 30 minutes |
| Max History Turns | 6 |

---

## Blockchain Details

| Component | Value |
|---|---|
| Network | Algorand TestNet |
| Node Provider | AlgoNode (`testnet-api.algonode.cloud`) |
| Explorer | Pera Explorer (`testnet.explorer.perawallet.app`) |
| Wallet | Pera Wallet (mobile + WalletConnect) |
| Chain ID | 416002 (TestNet) |
| Oracle Account | `UQ2GZ2POGUMBDNJX5G6TGH62Y6PMEQS3G66U5FSUR4FAAB32LR4VEFMZ6I` |
| Seller Account | `BNKOQ6FFOWYM6SU2PF2MIIYEUB5BOB6BJVYHZFLUEM6SUG3SMZQ23TXUGU` |

---

## Infrastructure

```
┌─────────────────────────────────────────────────┐
│                  User's Browser                  │
│           React + Vite (localhost:5173)           │
│        Pera Wallet ←→ WalletConnect Relay        │
└───────────────────────┬─────────────────────────┘
                        │ HTTP
┌───────────────────────▼─────────────────────────┐
│              Node.js Backend (3001)              │
│     Express API — Oracle transactions, scoring   │
└──────┬────────────────────────────┬──────────────┘
       │ HTTP                       │ HTTP
┌──────▼──────────┐     ┌──────────▼──────────────┐
│  Algorand       │     │  AMD GPU Droplet         │
│  TestNet        │     │  165.245.134.230         │
│  (AlgoNode)     │     │  ├─ :9000 FastAPI LLM    │
│                 │     │  └─ :8001 vLLM (ROCm)    │
└─────────────────┘     └─────────────────────────┘
```

---

## Project Structure

```
Accord/
├── frontend/          # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/    # UI components (WalletConnect, ChatWindow, DealSummary, etc.)
│   │   ├── hooks/         # useWallet — Pera Wallet integration
│   │   ├── utils/         # Algorand transaction helpers
│   │   └── config/        # Constants (APP_ID, endpoints)
│   └── package.json
│
├── backend/           # Node.js + Express
│   ├── src/
│   │   ├── routes/        # API endpoints (negotiate, fund, verify, release, refund, deliver)
│   │   ├── services/      # Business logic (negotiationEngine, algorandService, optimizer)
│   │   ├── config/        # Environment config
│   │   └── middleware/     # Error handler
│   └── package.json
│
├── contract/          # Algorand Smart Contract
│   ├── smart_contracts/
│   │   └── deal_escrow/
│   │       └── contract.py    # Puya ARC-4 contract
│   └── artifacts/
│       ├── DealEscrow.approval.teal
│       └── DealEscrow.clear.teal
│
├── accord-llm/        # Self-Hosted LLM Middleware
│   ├── app/               # FastAPI application
│   ├── docker-compose.yml # vLLM + middleware containers
│   ├── Dockerfile
│   └── pyproject.toml
│
└── techstack.md       # This file
```
