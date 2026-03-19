# SignalMint — System Architecture

Complete technical architecture for the autonomous multi-agent system.

---

## 🎯 Mission

SignalMint is a **production-grade autonomous agent system** that:

1. **Detects** market signals (price anomalies, trends)
2. **Decides** whether to mint NFTs based on confidence thresholds
3. **Executes** real trades (Uniswap) and NFT mints (Rare Protocol)
4. **Verifies** all actions on-chain
5. **Logs** everything for transparency and auditability
6. **Repeats** in an autonomous loop without human intervention

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AUTONOMOUS LOOP                          │
└─────────────────────────────────────────────────────────────────┘
                                ↓
        ┌───────────────────────┼───────────────────────┐
        ↓                       ↓                       ↓
    ┌───────────┐          ┌───────────┐          ┌───────────┐
    │   SCOUT   │          │ ANALYST   │          │ EXECUTOR  │
    │  AGENT    │────────→ │  AGENT    │────────→ │  AGENT    │
    └───────────┘          └───────────┘          └───────────┘
    • Detect signals     • Evaluate conditions  • Execute trades
    • Fetch prices       • Calculate confidence • Mint NFTs
    • Monitor markets    • Generate decision    • Launch auctions
        ↓
    ┌───────────────────────────────────────────────────────────┐
    │                  VERIFIER AGENT                           │
    │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐  │
    │  │ Validate Tx  │ │ Check Status │ │ Record in Logs   │  │
    │  └──────────────┘ └──────────────┘ └──────────────────┘  │
    └───────────────────────────────────────────────────────────┘
        ↓
    ┌───────────────────────────────────────────────────────────┐
    │                  STORAGE LAYER                            │
    │  ┌─────────────────────────────────────────────────────┐  │
    │  │ agent_log.json (Filecoin/IPFS)                     │  │
    │  │ ├─ Decisions                                        │  │
    │  │ ├─ Execution records (tx hashes)                   │  │
    │  │ ├─ Verification results                            │  │
    │  │ └─ Metadata                                         │  │
    │  └─────────────────────────────────────────────────────┘  │
    └───────────────────────────────────────────────────────────┘
        ↓
    ┌───────────────────────────────────────────────────────────┐
    │                 ON-CHAIN REGISTRIES                       │
    │  ┌────────────────────────────────────────────────────┐   │
    │  │ ERC-8004: Agent Identity + Reputation + Validation│   │
    │  │ Rare: NFT Contracts & Auctions                    │   │
    │  │ Uniswap: Swap History                             │   │
    │  └────────────────────────────────────────────────────┘   │
    └───────────────────────────────────────────────────────────┘
        ↓
    ┌───────────────────────────────────────────────────────────┐
    │           [LOOP REPEATS - Next Cycle]                     │
    └───────────────────────────────────────────────────────────┘
```

---

## 📦 Project Structure

```
/src (TypeScript source)
├── agents/
│   ├── main.ts               # Entry point for autonomous loop
│   ├── scout.ts              # Signal detection agent
│   ├── analyst.ts            # Decision-making agent
│   ├── executor.ts           # Action execution agent
│   ├── verifier.ts           # Verification & logging agent
│   └── shared/
│       ├── types.ts          # Shared types & interfaces
│       ├── message.ts        # Inter-agent message bus
│       └── config.ts         # Configuration management
├── protocols/
│   ├── rare.ts               # Rare Protocol integration
│   ├── uniswap.ts            # Uniswap V4 integration
│   ├── filecoin.ts           # Filecoin/Web3.storage integration
│   ├── erc8004.ts            # ERC-8004 identity registry
│   ├── zyfai.ts              # Zyfai yield accounts
│   └── openserv.ts           # OpenServ coordination
├── utils/
│   ├── logger.ts             # Agent logging (agent_log.json)
│   ├── wallet.ts             # Wallet management
│   ├── api.ts                # API request utilities
│   └── errors.ts             # Error handling & retries
├── models/
│   ├── signal.ts             # Signal detection data model
│   ├── decision.ts           # Decision data model
│   └── execution.ts          # Execution record model
└── index.ts                  # Main export

/contracts (Solidity)
├── IdentityRegistry.sol      # ERC-8004 Identity (if deploying)
├── ReputationRegistry.sol    # ERC-8004 Reputation
├── ValidationRegistry.sol    # ERC-8004 Validation
└── interfaces/
    └── IERC8004.sol

/config
├── agents.json               # Agent configuration
├── signals.json              # Signal thresholds
└── chains.json               # Chain RPC endpoints

/logs
├── agent_log.json            # Current run log
└── archive/
    └── agent_log_*.json      # Historical logs

/agent.json                  # Agent registration file (ERC-8004)
/package.json
/tsconfig.json
/README.md
/md/
├── PROTOCOLS.md
├── ARCHITECTURE.md
├── PROTOCOL_LABS_TRACK_CHECKLIST.md
└── ...
```

---

## 🔄 Agent Lifecycle & Message Flow

### Phase 1: Startup
```typescript
// main.ts
1. Load configuration (chains, signals, agents)
2. Initialize wallet (from .env or generate)
3. Register agent identity on ERC-8004 (if not registered)
4. Create agent_log.json file
5. Start autonomous loop
```

### Phase 2: Scout Agent (Signal Detection)
```typescript
Interface inputs:
- None (periodic polling)

Operations:
1. Fetch current ETH price via Uniswap API
2. Check against signal thresholds
3. Analyze price trends (5min, 1hr, 4hr)
4. Calculate signal confidence (0-1.0)

Output message: {
  type: "signal_detected",
  signal: "ETH_PRICE_SPIKE",
  currentPrice: 2650,
  threshold: 2500,
  confidence: 0.92,
  timestamp: "2025-03-19T10:30:00Z"
}

Next agent: AnalystAgent
```

### Phase 3: Analyst Agent (Decision Making)
```typescript
Interface inputs:
- signal_detected message from Scout

Operations:
1. Receive signal
2. Validate confidence > threshold (default 0.8)
3. Determine action type (MINT, SKIP, etc.)
4. Assign confidence score to decision

Output message: {
  type: "decision",
  decision: "MINT_NFT",
  reason: "ETH price above threshold with high confidence",
  confidence: 0.92,
  estimatedGasLimit: 200000,
  estimatedCost: "0.05 ETH",
  timestamp: "2025-03-19T10:30:05Z"
}

Next agent: ExecutorAgent
```

### Phase 4: Executor Agent (Action Execution)
```typescript
Interface inputs:
- decision message from Analyst

Operations:
1. If decision = MINT_NFT:
   a. Fetch yield from Zyfai wallet for gas
   b. Generate art/metadata for the signal
   c. Upload to IPFS via Rare CLI
   d. Call rare mint (creates transaction)
   e. If decision includes swap:
      - Get Uniswap quote for signal condition
      - Execute swap (real tx hash returned)
2. Create structured execution record
3. Handle failures with retries

Output message: {
  type: "execution_result",
  action: "MINT_NFT",
  success: true,
  results: {
    mint: {
      txHash: "0x...",
      contractAddress: "0x...",
      tokenId: 1,
      ipfsUri: "ipfs://Qm..."
    },
    swap: {
      txHash: "0x...",
      amountIn: "1.0 WETH",
      amountOut: "2350 USDC"
    }
  },
  timestamp: "2025-03-19T10:30:45Z"
}

Next agent: VerifierAgent
```

### Phase 5: Verifier Agent (Validation & Logging)
```typescript
Interface inputs:
- execution_result message from Executor

Operations:
1. Validate each transaction on-chain
   - Wait for confirmation (12 blocks)
   - Check gas usage vs estimate
   - Verify final state matches expected
2. Record all decisions and actions in agent_log.json
3. Upload agent_log.json to Filecoin (Web3.storage)
4. Store IPFS CID in local config
5. Optional: Submit reputation feedback to ERC-8004
6. Emit completion signal

Output: {
  type: "cycle_completed",
  cycleId: "2025-03-19T10:30:00Z",
  ipfsCid: "Qm...",
  agentId: 1,  // From ERC-8004
  timestamp: "2025-03-19T10:32:00Z"
}

Next: Wait for next signal or timeout → Restart loop
```

---

## 💾 Agent Log Structure

`agent_log.json` contains complete execution provenance for a cycle:

```json
{
  "version": "1.0.0",
  "agentId": 1,
  "agentRegistry": "eip155:8453:0x...",
  "operatorWallet": "0x...",
  "cycleId": "2025-03-19T10:30:00Z",
  "startTime": "2025-03-19T10:30:00Z",
  "endTime": "2025-03-19T10:32:00Z",
  
  "signals": [
    {
      "type": "ETH_PRICE_SPIKE",
      "value": 2650,
      "threshold": 2500,
      "confidence": 0.92,
      "timestamp": "2025-03-19T10:30:15Z",
      "source": "uniswap_api"
    }
  ],
  
  "decisions": [
    {
      "timestamp": "2025-03-19T10:30:20Z",
      "input": "signal_detected",
      "signalId": "ETH_PRICE_SPIKE",
      "decision": "MINT_NFT",
      "confidence": 0.92,
      "reasoning": {
        "signalConfidence": 0.92,
        "thresholdMet": true,
        "gasAvailable": true,
        "yieldSufficient": true
      }
    }
  ],
  
  "executions": [
    {
      "id": "exec_001",
      "type": "mint_nft",
      "name": "Market Signal: ETH > 2500",
      "metadata": {
        "signal": "ETH_PRICE_SPIKE",
        "price": 2650,
        "confidence": 0.92,
        "cycleId": "2025-03-19T10:30:00Z"
      },
      "attempt": 1,
      "result": "success",
      "txHash": "0x...",
      "contractAddress": "0x...",
      "tokenId": 1,
      "ipfsUri": "ipfs://Qm...",
      "gasUsed": 185342,
      "gasPrice": "25 gwei",
      "totalCost": "0.00463 ETH",
      "timestamp": "2025-03-19T10:30:45Z"
    },
    {
      "id": "exec_002",
      "type": "create_auction",
      "contractAddress": "0x...",
      "tokenId": 1,
      "startingPrice": "0.1 ETH",
      "duration": 86400,
      "result": "success",
      "txHash": "0x...",
      "auctionId": 42,
      "timestamp": "2025-03-19T10:31:00Z"
    },
    {
      "id": "exec_003",
      "type": "swap",
      "amountIn": "1.0 WETH",
      "tokenIn": "WETH",
      "tokenOut": "USDC",
      "slippage": 1,
      "result": "success",
      "txHash": "0x...",
      "amountOut": "2350 USDC",
      "priceImpact": 0.002,
      "timestamp": "2025-03-19T10:31:15Z"
    }
  ],
  
  "verifications": [
    {
      "type": "mint_tx",
      "txHash": "0x...",
      "blockNumber": 123456,
      "confirmed": true,
      "expectedState": "tokenId 1 minted",
      "actualState": "tokenId 1 minted, owner is agent wallet",
      "status": "passed"
    },
    {
      "type": "auction_creation",
      "txHash": "0x...",
      "expected": "auctionId 42 created",
      "actual": "auctionId 42 created, running",
      "status": "passed"
    },
    {
      "type": "swap_tx",
      "txHash": "0x...",
      "confirmed": true,
      "amountOutReceived": "2350 USDC",
      "amountOutExpected": "2330 USDC",
      "actualBetterThanExpected": true,
      "status": "passed"
    }
  ],
  
  "storage": {
    "logIpfsCid": "Qm...",
    "logUrl": "https://w3s.link/ipfs/Qm...",
    "uploadTimestamp": "2025-03-19T10:32:00Z"
  },
  
  "erc8004": {
    "agentId": 1,
    "identity_tx": "0x...",
    "reputation_feedback": {
      "submitted": true,
      "value": 100,
      "tag1": "signal_accuracy",
      "tag2": "2025-03",
      "txHash": "0x..."
    }
  },
  
  "summary": {
    "signalsDetected": 1,
    "decisionsGenerated": 1,
    "executionsAttempted": 3,
    "executionsSucceeded": 3,
    "executionsFailed": 0,
    "verificationsPasssed": 3,
    "totalGasUsed": 185342,
    "totalCostETH": 0.00463,
    "yieldUsed": "0.00463 ETH",
    "yieldRemaining": "9.99537 ETH"
  }
}
```

---

## 🔐 Security & Safety Constraints

### Validation Before Execution
```typescript
class ExecutionValidator {
  validateMint(params: MintParams): ValidationResult {
    if (!params.tokenUri || params.tokenUri.length === 0)
      throw new Error("Invalid URI");
    if (!isValidAddress(params.contract))
      throw new Error("Invalid contract address");
    if (params.name.length > 256)
      throw new Error("Name too long");
    return { valid: true };
  }
  
  validateSwap(params: SwapParams): ValidationResult {
    if (params.amountIn.lte(0))
      throw new Error("Invalid input amount");
    if (params.slippage < 0 || params.slippage > 5)
      throw new Error("Slippage out of range");
    if (params.deadline < Math.floor(Date.now() / 1000))
      throw new Error("Deadline in past");
    return { valid: true };
  }
}
```

### Error Handling & Retries
```typescript
class RetryableExecutor {
  async executeWithRetry(
    action: () => Promise<any>,
    maxRetries: number = 3,
    backoffMs: number = 1000
  ): Promise<any> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await action();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        
        // Log retry attempt
        logger.warn(`Attempt ${i + 1} failed, retrying in ${backoffMs}ms`, error);
        
        // Exponential backoff
        await sleep(backoffMs * Math.pow(2, i));
      }
    }
  }
}
```

### Compute Budget Enforcement
```typescript
class ComputeBudget {
  private callCount = 0;
  private maxCallsPerCycle = 100;
  private cycleStartTime = Date.now();
  private maxCycleDuration = 5 * 60 * 1000; // 5 minutes
  
  enforceLimit(agentName: string) {
    if (this.callCount > this.maxCallsPerCycle)
      throw new Error(`${agentName}: Exceeded call limit`);
    
    if (Date.now() - this.cycleStartTime > this.maxCycleDuration)
      throw new Error(`Cycle timeout: ${this.maxCycleDuration}ms exceeded`);
    
    this.callCount++;
  }
  
  reset() {
    this.callCount = 0;
    this.cycleStartTime = Date.now();
  }
}
```

---

## 🧪 Testing Strategy

### Unit Tests
- Scout Agent: Signal detection accuracy
- Analyst Agent: Decision logic correctness
- Executor Agent: TX generation & submission
- Verifier Agent: Log generation & validation

### Integration Tests
- Full loop on Sepolia testnet
- Real Rare Protocol mint (testnet)
- Real Uniswap swap (testnet)
- Real ERC-8004 registration (Sepolia)
- Real Filecoin upload via Web3.storage

### E2E Tests
```bash
# Signal → Decision → Mint → Swap → Auction → Verify → Log
npm run test:e2e

# Should produce:
# ✓ Signal detected (ETH price)
# ✓ Decision made (MINT with high confidence)
# ✓ NFT minted (Rare Protocol Sepolia)
# ✓ Auction created
# ✓ Swap executed (Uniswap Sepolia)
# ✓ All transactions verified on-chain
# ✓ agent_log.json uploaded to Filecoin
# ✓ ERC-8004 registration confirmed
```

---

## 📊 Metrics & Monitoring

### Agent KPIs
- **Signal Accuracy**: Signals detected / False positives
- **Decision Quality**: Decisions executed / Skipped
- **Execution Success Rate**: Successful txs / Total attempted
- **Verification Success Rate**: Verified / Total executed
- **Average Cycle Time**: Time from signal → verification
- **Cost per Cycle**: Total gas used ETH value
- **Reputation Score**: On-chain feedback (ERC-8004)

### System Health
- **Uptime**: % of time agent is running without error
- **Error Rate**: Errors per 1000 cycles
- **Retry Rate**: % of executions requiring retry
- **Response Latency**: Time from signal to action

---

## 🚀 Deployment Checklist

- [ ] All protocol credentials configured (.env)
- [ ] Wallet funded with testnet ETH (Sepolia/Base)
- [ ] Zyfai Smart Wallet created and funded
- [ ] Rare Protocol CLI configured and tested
- [ ] Uniswap API key active
- [ ] Web3.storage token generated
- [ ] ERC-8004 registry address known
- [ ] agent.json created and uploaded to IPFS
- [ ] agent_log.json template initialized
- [ ] TypeScript compiled without errors
- [ ] E2E tests passing on testnet
- [ ] README updated with all links and tx hashes
- [ ] Ready for mainnet or Synthesis public demo

---

## Links

- Source: https://github.com/ayushsingh82/SignalMint
- Synthesis Registration: https://synthesis.devfolio.co
- Documentation: [See md/ folder](./README.md)
