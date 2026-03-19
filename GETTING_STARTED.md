# 🚀 Getting Started in 5 Minutes

**SignalMint** is a fully-implemented autonomous multi-agent system ready to run.

---

## ⚡ Quick Start

### 1️⃣ Install (30 seconds)
```bash
cd /Users/sambit/Desktop/hack/SignalMint
npm install
```

### 2️⃣ Configure (2 minutes)
```bash
cp .env.example .env

# Edit .env and add your private key
# AGENT_PRIVATE_KEY=0x<your-private-key-here>

# Optional: Add API keys for real interactions
# UNISWAP_API_KEY=your-key
# WEB3_STORAGE_TOKEN=your-token
```

### 3️⃣ Build (30 seconds)
```bash
npm run agent:build
```

### 4️⃣ Run (2 minutes, then Ctrl+C to stop)
```bash
npm run agent:run
```

### ✅ Success!
You should see:
```
✅ AnalystAgent started...
✅ ExecutorAgent started...
✅ VerifierAgent started...
🔍 Starting scout detection loop...

[Cycle 1] 10:30:45 AM
📊 Current ETH price: $2650
🧠 Decision: MINT (confidence: 0.92)
⚙️  Executing: NFT mint...
✅ Minted: txHash=0x...
```

---

## 📁 What's Included

✅ **4 Autonomous Agents**
- Scout: Detects price signals
- Analyst: Makes decisions
- Executor: Mints NFTs
- Verifier: Validates & logs

✅ **3 Real Protocol Integrations**
- Rare Protocol (NFT minting)
- Uniswap V4 (Price feeds)
- Filecoin/IPFS (Log storage)

✅ **Production-Ready Code**
- 14 TypeScript files (~2,500 lines)
- Fully typed interfaces
- Error handling & retries
- Compute budgets

✅ **Complete Documentation**
- AGENT_README.md (comprehensive guide)
- IMPLEMENTATION_STATUS.md (detailed checklist)
- ARCHITECTURE.md (system design)
- PROTOCOLS.md (all integrations)

---

## 🎯 What It Does

Every 5 seconds:

1. **Scout** → Fetches ETH price from Uniswap
2. **Analyst** → Decides if price spike should trigger mint
3. **Executor** → Mints real NFT via Rare Protocol
4. **Verifier** → Logs results to Filecoin/IPFS

All communication is async via MessageBus (no blocking).

---

## 🔧 Key Files

| File | Purpose |
|------|---------|
| `src/agents/main.ts` | Starts autonomous loop |
| `src/agents/scout.ts` | Price detection |
| `src/agents/analyst.ts` | Decision logic |
| `src/agents/executor.ts` | NFT minting |
| `src/agents/verifier.ts` | Validation & logging |
| `src/protocols/rare.ts` | Rare Protocol CLI |
| `src/protocols/uniswap.ts` | Uniswap API |
| `src/protocols/filecoin.ts` | Web3.storage → IPFS |
| `.env.example` | Configuration template |
| `AGENT_README.md` | Full documentation |

---

## 🧪 Commands

```bash
# Build (compile TypeScript)
npm run agent:build

# Run (execute autonomous loop)
npm run agent:run

# Development (live compilation)
npm run agent:dev

# Watch mode (rebuild on file changes)
npm run agent:watch

# Test
npm run test

# E2E tests
npm run test:e2e
```

---

## 📊 What Success Looks Like

✅ Agent prints cycles every 5 seconds  
✅ Prices are fetched from Uniswap  
✅ Decisions are being made  
✅ NFTs are minting (or showing mock results)  
✅ Logs are saved to `./logs/`  
✅ IPFS uploads complete (or gracefully degrade)  

---

## ❌ Troubleshooting

### "npm install fails"
```bash
# Make sure Node.js 22+ is installed
node --version

# If old version, update Node
# https://nodejs.org
```

### "Agent won't start"
```bash
# Check .env is created
cat .env | head -5

# Check build succeeded
npm run agent:build

# Check TypeScript types
npm run agent:build -- --noEmit
```

### "No price data"
- Verify UNISWAP_API_KEY in .env (optional, has mock fallback)
- Check internet connection
- Verify price threshold in .env (default $2500)

### "Mint failed"
- Verify AGENT_PRIVATE_KEY is valid
- Check Sepolia RPC is working
- Ensure wallet has test ETH

---

## 📚 Full Documentation

For detailed info, see:
- **AGENT_README.md** — Complete guide with all options
- **IMPLEMENTATION_STATUS.md** — Detailed checklist
- **ARCHITECTURE.md** — System design
- **PROTOCOLS.md** — Integration details

---

## ✨ You're Ready!

```bash
npm install && npm run agent:build && npm run agent:run
```

Watch your autonomous agent in action! 🤖✨

---

**Questions?** See AGENT_README.md or ARCHITECTURE.md for comprehensive docs.
