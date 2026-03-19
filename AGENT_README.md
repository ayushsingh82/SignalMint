# SignalMint — Implementation Complete ✅

Production-ready autonomous multi-agent system for Protocol Labs Synthesis 2026.

**Status**: Fully implemented with real blockchain integrations  
**Agents**: Scout → Analyst → Executor → Verifier (autonomous loop)  
**Chains**: Sepolia, Base, Mainnet  
**Storage**: Filecoin/IPFS via Web3.storage

---

## 🚀 Quick Start

### 1. Prerequisites
```bash
# Node.js 22+
node --version  # Should be v22.x or higher

# Clone repository
git clone https://github.com/ayushsingh82/SignalMint.git
cd SignalMint

# Install dependencies
npm install
```

### 2. Configure Environment
```bash
# Copy example config
cp .env.example .env

# Edit .env with your credentials:
# - AGENT_PRIVATE_KEY (required)
# - UNISWAP_API_KEY (for real pricing)
# - WEB3_STORAGE_TOKEN (for log persistence)
# - RPC endpoints (optional, uses public fallback)
```

### 3. Build & Run
```bash
# Build TypeScript
npm run agent:build

# Run autonomous agent
npm run agent:run

# Or run with live compilation
npm run agent:dev
```

---

## 📋 What's Implemented

### Core System
- ✅ **Scout Agent**: Real-time price monitoring via Uniswap API
- ✅ **Analyst Agent**: Decision engine with confidence scoring
- ✅ **Executor Agent**: Real NFT mints (Rare Protocol CLI) + swaps (Uniswap)
- ✅ **Verifier Agent**: Validation, logging, Filecoin persistence
- ✅ **Message Bus**: Async inter-agent communication
- ✅ **Logger**: Comprehensive agent_log.json with all actions

### Protocol Integrations
- ✅ **Rare Protocol**: NFT mint/auction via CLI (`@rareprotocol/rare-cli`)
- ✅ **Uniswap V4**: Real token swaps + price quotes (API)
- ✅ **Filecoin/IPFS**: Persistent log storage via Web3.storage
- ✅ **Error Handling**: Retries, validation, graceful degradation
- ✅ **Config Management**: Environment-based, validated at startup

### Features
- ✅ Fully autonomous loop (no human intervention)
- ✅ Real transaction hashes on-chain
- ✅ Structured agent logs (JSON format)
- ✅ Compute budget enforcement
- ✅ Mock fallbacks for demo without APIs
- ✅ Comprehensive logging and statistics

---

## 🔄 System Architecture

```
┌─────────────────────────────────────────────┐
│     Autonomous Event Loop (Every 5sec)      │
└─────────────────────────────────────────────┘
           ↓
    ┌─────────────────┐
    │  Scout Agent    │  ← Fetch ETH price (Uniswap)
    │  (Detect)       │  ← Check thresholds
    └─────────────────┘
           ↓ [signal_detected message]
    ┌─────────────────┐
    │ Analyst Agent   │  ← Evaluate confidence
    │  (Decide)       │  ← Generate decision
    └─────────────────┘
           ↓ [decision message]
    ┌─────────────────┐
    │ Executor Agent  │  ← Mint NFT (Rare CLI)
    │  (Execute)      │  ← Create auction
    └─────────────────┘
           ↓ [execution_result message]
    ┌─────────────────┐
    │ Verifier Agent  │  ← Verify on-chain
    │   (Verify)      │  ← Log to Filecoin
    └─────────────────┘
           ↓ [cycle_completed message]
    ┌─────────────────┐
    │  [Loop repeats] │
    └─────────────────┘
```

---

## 📁 Project Structure

```
src/
├── agents/
│   ├── scout.ts          # Signal detection
│   ├── analyst.ts        # Decision making
│   ├── executor.ts       # Action execution
│   ├── verifier.ts       # Validation & logging
│   └── main.ts           # Autonomous loop entry
│
├── protocols/
│   ├── rare.ts           # Rare Protocol NFT minting
│   ├── uniswap.ts        # Uniswap swaps & pricing
│   └── filecoin.ts       # Filecoin/IPFS storage
│
├── shared/
│   ├── types.ts          # All TypeScript interfaces
│   ├── message.ts        # Inter-agent message bus
│   └── config.ts         # Configuration management
│
└── utils/
    ├── logger.ts         # Structured logging
    └── helpers.ts        # Retry logic, validation

logs/
├── agent_log_*.json      # Execution logs (generated)

agent.json               # ERC-8004 registration
package.json
tsconfig.json
.env.example
README.md (this file)
```

---

## 🧪 Running the Agent

### Standard Execution
```bash
# Full autonomous loop
npm run agent:run

# Expected output:
# ✅ AnalystAgent started...
# ✅ ExecutorAgent started...
# ✅ VerifierAgent started...
# 🔍 Starting scout detection loop...
#
# [Cycle 1] 10:30:45 AM
# 📊 [ScoutAgent] Current ETH price: $2650
# 🧠 [AnalystAgent] Analyzing signal: ETH_PRICE_SPIKE
# ⚙️  [ExecutorAgent] Executing decision: MINT
# 🎨 Minting NFT: Market Signal #1...
# ✅ NFT minted: tokenId=1, txHash=0x...
# ✔️  [VerifierAgent] Verifying execution...
# 📝 Log persisted to IPFS: ipfs://Qm...
```

### Development Mode (with hot reload)
```bash
npm run agent:dev
```

### Compile Only
```bash
npm run agent:build  # Outputs to dist/
```

---

## 📊 Agent Statistics

During execution, the system prints agent statistics every cycle:
```
📊 Agent Statistics:
   Scout: monitoring (15 readings)
   Analyst: 5 decisions (3 mints, 2 skips)
   Executor: 3 executions (3 success, 0 failed)
   Verifier: 3 verified (100% success rate)
```

---

## 🔧 Configuration

Key settings in `src/shared/config.ts`:

| Setting | Default | Purpose |
|---------|---------|---------|
| `ethPriceThreshold` | $2500 | ETH price trigger for signals |
| `confidenceThreshold` | 0.8 | Min confidence to execute |
| `priceCheckIntervalMs` | 5000 | Scout check frequency |
| `maxCallsPerCycle` | 100 | Compute budget limit |
| `maxCycleDurationMs` | 300000 | 5 min cycle timeout |

Customize by editing `.env`:
```bash
# Override in .env (if supported)
SIGNAL_ETH_PRICE_THRESHOLD=2500
SIGNAL_CONFIDENCE_THRESHOLD=0.8
```

---

## 📝 Agent Logs

Each cycle generates detailed logs:

**`logs/agent_log_2025-03-19T10-30-00Z.json`:**
```json
{
  "version": "1.0.0",
  "cycleId": "2025-03-19T10:30:00Z",
  "startTime": "2025-03-19T10:30:00Z",
  "endTime": "2025-03-19T10:32:00Z",
  "signals": [
    {
      "id": "signal_...",
      "type": "ETH_PRICE_SPIKE",
      "value": 2650,
      "confidence": 0.92
    }
  ],
  "decisions": [
    {
      "id": "decision_...",
      "type": "MINT",
      "confidence": 0.92
    }
  ],
  "executions": [
    {
      "id": "exec_mint_...",
      "type": "MINT_NFT",
      "txHash": "0x...",
      "result": "success"
    }
  ],
  "summary": {
    "signalsDetected": 1,
    "decisionsGenerated": 1,
    "executionsAttempted": 1,
    "executionsSucceeded": 1,
    "totalCostETH": 0.00463
  }
}
```

**Logs are automatically uploaded to Filecoin/IPFS:**
```
📝 Log persisted to IPFS: https://w3s.link/ipfs/Qm...
```

---

## 🔗 Next Steps

### For Testing/Demo
1. ✅ Agent runs on Sepolia automatically (no special config)
2. ✅ Uses mock prices/transactions if APIs unavailable
3. ✅ Logs saved locally to `./logs/`

### For Real Blockchain Integration
1. Get Uniswap API key: https://developers.uniswap.org/
2. Get Web3.storage token: https://web3.storage
3. Set up Rare Protocol CLI: `npm install -g @rareprotocol/rare-cli`
4. Fund wallet with testnet ETH (Sepolia faucet)
5. Update `.env` with credentials
6. Run: `npm run agent:run`

### For Mainnet
1. Use real private key (testnet → mainnet switch)
2. Set `RARE_CHAIN=mainnet` in `.env`
3. Ensure wallet has sufficient ETH
4. Update RPC endpoints to mainnet
5. Deploy on production infrastructure

### For ERC-8004 Integration
1. Wait for Synthesis to announce registry addresses
2. Update `.env` with `ERC8004_IDENTITY_REGISTRY` address
3. Agent will auto-register on startup
4. Reputation feedback will be submitted on-chain

---

## 📚 Documentation

Comprehensive documentation in `md/` folder:
- **[ARCHITECTURE.md](../md/ARCHITECTURE.md)** — Full system design, message flows, security
- **[PROTOCOLS.md](../md/PROTOCOLS.md)** — Detailed integration for each protocol
- **[IMPLEMENTATION_GUIDE.md](../md/IMPLEMENTATION_GUIDE.md)** — Step-by-step build guide
- **[PROTOCOL_LABS_TRACK_CHECKLIST.md](../md/PROTOCOL_LABS_TRACK_CHECKLIST.md)** — Competition requirements

---

## 🛠️ Troubleshooting

### Agent won't start
```bash
# Check Node version (need 22+)
node --version

# Check dependencies
npm install

# Check TypeScript
npm run agent:build

# Check config
cat .env | grep AGENT_PRIVATE_KEY
```

### No signals detected
- Check if UNISWAP_API_KEY is set (will use mock otherwise)
- Verify price threshold in config (default $2500)
- Check logs: `cat logs/agent_log_*.json`

### Mint failed
- Ensure AGENT_PRIVATE_KEY is valid
- Check Rarely CLI: `rare configure --show`
- Verify RPC endpoint is working
- Check wallet has sufficient balance

### No IPFS upload
- Set WEB3_STORAGE_TOKEN in .env
- Falls back to mock CID if unavailable
- Check logs for upload errors

---

##  🎯 Success Criteria

Agent is running successfully when:
- ✅ Cycles print every 5 seconds
- ✅ Prices fetch from Uniswap
- ✅ Decisions are generated
- ✅ Mints execute (testnet or mock)
- ✅ Logs saved to ./logs/
- ✅ IPFS upload completes (or gracefully degraded)
- ✅ All agents report statistics

---

## 📄 License

MIT — Open source for Synthesis 2026

---

## 🔗 Links

- **Repository**: https://github.com/ayushsingh82/SignalMint
- **Documentation**: `/md`
- **Synthesis**: https://synthesis.devfolio.co
- **Protocols Used**: 
  - Rare: https://rare.xyz
  - Uniswap: https://docs.uniswap.org
  - Filecoin: https://docs.filecoin.io
  - ERC-8004: https://eips.ethereum.org/EIPS/eip-8004

---

**SignalMint: Autonomous agents with receipts.** 🤖✨  
Built for Protocol Labs Synthesis 2026.
