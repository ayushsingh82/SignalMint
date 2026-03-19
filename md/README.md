# SignalMint — Complete Documentation

**Autonomous market-driven NFT minting agent** for **Synthesis 2026**.

Detects market signals → Makes autonomous decisions → Executes real trades & mints → Verifies on-chain → Logs permanently.

Integrates: **Rare Protocol**, **Uniswap V4**, **Filecoin/IPFS**, **ERC-8004**, **Zyfai**, **OpenServ**, **ENS**.

---

## 📚 Documentation Structure

| File | Purpose |
|------|---------|
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | **START HERE** — Complete system design, agent lifecycle, data models, security constraints. |
| **[PROTOCOLS.md](./PROTOCOLS.md)** | **REFERENCE** — Detailed integration guide for each protocol (Rare, Filecoin, Uniswap, ERC-8004, etc.). |
| **[PROTOCOL_LABS_TRACK_CHECKLIST.md](./PROTOCOL_LABS_TRACK_CHECKLIST.md)** | Track requirements: "Let the Agent Cook" ($8k) + "Agents With Receipts" ($8,004). Deliverables mapping. |
| **[SYNTHESIS.md](./SYNTHESIS.md)** | Hackathon brief: Synthesis 2026, themes, timeline, partners. |
| **[BUILD.md](./BUILD.md)** | Build checklist: getting started, registration, optional stacks. |
| **[BUILD_AN_AGENT.md](./BUILD_AN_AGENT.md)** | General agent-building guide. |
| **[skill.md](./skill.md)** | Agent API & Synthesis registration format. |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 22+
- TypeScript
- Wallet with testnet ETH (Sepolia or Base)
- Required API keys: Uniswap, Web3.storage, Bankr (optional)

### Clone & Setup
```bash
git clone https://github.com/ayushsingh82/SignalMint.git
cd SignalMint

npm install

# Configure environment
cp .env.example .env
# Fill in:
# AGENT_PRIVATE_KEY=0x...
# UNISWAP_API_KEY=...
# WEB3_STORAGE_TOKEN=...
# OPENSERV_API_KEY=...

# Build
npm run build

# Run agent
npm run agent:run
```

### First Run
1. **Register ERC-8004 identity** (one-time)
2. **Deploy Rare collection** (one-time)
3. **Start autonomous loop** (continuous)

---

## 🎯 What SignalMint Does

### 1. **Scout Agent** (Signal Detection)
- Continuously monitors market signals (price spikes, trends)
- Fetches real ETH prices via Uniswap API
- Calculates confidence scores
- Sends signal events to Analyst

### 2. **Analyst Agent** (Decision Making)
- Receives signals from Scout
- Evaluates confidence thresholds (default 0.8+)
- Decides: MINT, SKIP, AUCTION, SWAP
- Includes reasoning and cost estimation

### 3. **Executor Agent** (Execution)
- Receives decisions from Analyst
- Executes **real** mints via Rare Protocol CLI
- Executes **real** swaps via Uniswap
- Creates auctions on Rare Bazaar
- All transactions produce real tx hashes

### 4. **Verifier Agent** (Validation & Logging)
- Validates all transactions on-chain
- Waits for confirmation (12 blocks)
- Records decisions & executions in agent_log.json
- Uploads logs to Filecoin (Web3.storage)
- Submits reputation feedback to ERC-8004

### 5. **Storage & Identity**
- **Filecoin/IPFS**: Persistent agent_log.json with CID
- **ERC-8004**: Agent identity registration + reputation scoring
- **ENS**: Optional human-readable agent name
- **Bankr**: Optional token launch for self-sustainability

---

## 📋 Protocol Integration Summary

| Protocol | Purpose | Status |
|----------|---------|--------|
| **Rare Protocol** | NFT minting & auctions | ✅ Core |
| **Uniswap V4** | Real swaps with MEV protection | ✅ Core |
| **Filecoin/IPFS** | Permanent agent log storage | ✅ Core |
| **ERC-8004** | Agent identity & reputation | ✅ Core |
| **Zyfai** | Yield accounts for gas funding | ⏳ Integration |
| **OpenServ** | Multi-agent coordination | ⏳ Integration |
| **ENS** | Domain names (optional) | ⏳ Optional |
| **Bankr** | Token launch & self-funding | ⏳ Optional |

See [PROTOCOLS.md](./PROTOCOLS.md) for detailed integration guide.

---

## 📊 Agent Log Example

Each cycle produces a complete `agent_log.json`:

```json
{
  "agentId": 1,
  "cycleId": "2025-03-19T10:30:00Z",
  "signals": [
    {
      "type": "ETH_PRICE_SPIKE",
      "value": 2650,
      "confidence": 0.92
    }
  ],
  "decisions": [
    {
      "decision": "MINT_NFT",
      "confidence": 0.92,
      "reasoning": "Signal confidence > threshold"
    }
  ],
  "executions": [
    {
      "type": "mint_nft",
      "txHash": "0x...",
      "tokenId": 1,
      "ipfsUri": "ipfs://Qm..."
    }
  ],
  "verifications": [
    {
      "type": "mint_tx",
      "confirmed": true,
      "status": "passed"
    }
  ],
  "storage": {
    "logIpfsCid": "Qm...",
    "uploadTimestamp": "2025-03-19T10:32:00Z"
  }
}
```

---

## 🎖️ Protocol Labs Track Compliance

### Track 1: "Let the Agent Cook" ($8k)
✅ Full autonomous execution loop  
✅ Agent identity (ERC-8004)  
✅ Real tools (Rare, Uniswap, IPFS)  
✅ Structured logs (agent.json, agent_log.json)  
✅ Safety & guardrails  
✅ Compute budget enforcement  

### Track 2: "Agents With Receipts" ($8,004)
✅ ERC-8004 on-chain identity  
✅ Verifiable mints & swaps  
✅ DevSpot agent manifest  
✅ On-chain reputation  
✅ Real transaction links  

See [PROTOCOL_LABS_TRACK_CHECKLIST.md](./PROTOCOL_LABS_TRACK_CHECKLIST.md) for full requirements.

---

## 🏗️ System Architecture

```
Signal Detection (Scout)
         ↓
   Decision Making (Analyst)
         ↓
   Action Execution (Executor)
    [Rare + Uniswap]
         ↓
   Validation (Verifier)
         ↓
   Storage (Filecoin/IPFS)
         ↓
Identity (ERC-8004) + Reputation
         ↓
   [LOOP REPEATS]
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete details.

---

## 📂 Project Structure

```
SignalMint/
├── src/agents/              # Agent implementations
│   ├── scout.ts
│   ├── analyst.ts
│   ├── executor.ts
│   ├── verifier.ts
│   └── main.ts
├── src/protocols/           # Protocol integrations
│   ├── rare.ts
│   ├── uniswap.ts
│   ├── filecoin.ts
│   └── erc8004.ts
├── config/                  # Configuration files
│   ├── agents.json
│   └── signals.json
├── logs/                    # Agent logs
│   └── agent_log.json
├── agent.json              # ERC-8004 registration
├── md/                     # Documentation
│   ├── ARCHITECTURE.md
│   ├── PROTOCOLS.md
│   ├── PROTOCOL_LABS_TRACK_CHECKLIST.md
│   └── ...
└── README.md               # Root readme
```

---

## 🧪 Testing

```bash
# Build TypeScript
npm run agent:build

# Run E2E tests (Sepolia)
npm run test:e2e

# Run agent
npm run agent:run

# Expected output:
# ✓ Scout detects signal
# ✓ Analyst makes decision
# ✓ Executor mints NFT (real tx)
# ✓ Executor swaps tokens (real tx)
# ✓ Verifier confirms on-chain
# ✓ Logs stored on Filecoin
```

---

## 🔗 Important Links

### Hackathon
- **Synthesis 2026**: https://synthesis.devfolio.co
- **Registration**: https://synthesis.md
- **Updates**: https://nsb.dev/synthesis-updates

### Protocols
- **Rare**: https://rare.xyz
- **Filecoin**: https://docs.filecoin.io
- **Uniswap**: https://docs.uniswap.org
- **ERC-8004**: https://eips.ethereum.org/EIPS/eip-8004
- **ENS**: https://docs.ens.domains
- **Bankr**: https://docs.bankr.bot
- **Zyfai**: https://docs.zyf.ai
- **OpenServ**: https://docs.openserv.ai

### Resources
- **Repository**: https://github.com/ayushsingh82/SignalMint
- **Synthesis Skill**: https://synthesis.devfolio.co/skill.md
- **Agent Registration**: https://synthesis.devfolio.co/register

---

## 📖 Reading Guide

**Developer starting fresh:**
1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) (overview + lifecycle)
2. Read [PROTOCOLS.md](./PROTOCOLS.md) (integration details)
3. Start building in `/src/agents/`
4. Reference [PROTOCOL_LABS_TRACK_CHECKLIST.md](./PROTOCOL_LABS_TRACK_CHECKLIST.md) for deliverables

**Integrating a specific protocol:**
→ Jump to [PROTOCOLS.md](./PROTOCOLS.md) section for that protocol

**Understanding compliance:**
→ [PROTOCOL_LABS_TRACK_CHECKLIST.md](./PROTOCOL_LABS_TRACK_CHECKLIST.md)

**General hackathon info:**
→ [SYNTHESIS.md](./SYNTHESIS.md)

---

## ⚖️ License

MIT — Build on it, ship it, win it.

---

**SignalMint: Autonomous agents with receipts.** 🤖✨
