# SignalMint — Protocol Integration Guide

Complete technical reference for all integrated protocols in SignalMint.

---

## 🟣 Rare Protocol (SuperRare)

### Overview
Rare Protocol is an open toolkit for on-chain creators: deploy ERC-721 collections, mint NFTs with IPFS metadata, run auctions, and search tokens—all via CLI.

### Installation
```bash
npm install -g @rareprotocol/rare-cli
# Requires Node.js 22+
```

### Configuration
```bash
# Set private key and RPC for a chain
rare configure --chain sepolia --private-key 0x... --rpc-url https://...

# View current config
rare configure --show
```

### Key Commands

#### Deploy Collection
```bash
rare deploy erc721 "SignalMint Gallery" "SMINT" --max-tokens 10000
# Output: contract address
```

#### Mint NFT with Signal Metadata
```bash
rare mint \
  --contract 0x... \
  --name "Market Signal: ETH > 2500" \
  --description "Autonomous signal detection mint" \
  --image ./signal-art.png \
  --attribute "Signal=BUY_SIGNAL" \
  --attribute "Confidence=0.92" \
  --attribute "Timestamp=$(date +%s)" \
  --tag signal --tag autonomous
```

#### Create Auction
```bash
rare auction create \
  --contract 0x... \
  --token-id 1 \
  --starting-price 0.1 \
  --duration 86400
```

#### Query Status
```bash
rare search tokens --mine --take 10
rare search auctions --state RUNNING
rare status --contract 0x... --token-id 1
```

### Integration Points
- **Agent Executor** calls `rare mint` only after condition check passes (`ETH_PRICE > threshold` and confidence threshold)
- **Mint metadata attributes** include `Condition`, `Confidence`, `Timestamp`, `Condition_Passed`, and `Tx_Refs`
- **Agent Verifier** calls `rare auction status` to confirm on-chain state
- **Storage**: NFT metadata stored on IPFS, referenced via token URI
- **Output logging**: Mint tx hash, token ID, auction status in agent_log.json

### Supported Chains
- Mainnet
- Sepolia (testnet)
- Base
- Base Sepolia (testnet)

### Contract Addresses
| Chain | Factory | Auction |
|-------|---------|---------|
| Sepolia | 0x3c7526a0975156299ceef369b8ff3c01cc670523 | 0xC8Edc7049b233641ad3723D6C60019D1c8771612 |
| Mainnet | 0xAe8E375a268Ed6442bEaC66C6254d6De5AeD4aB1 | 0x6D7c44773C52D396F43c2D511B81aa168E9a7a42 |
| Base | 0xf776204233bfb52ba0ddff24810cbdbf3dbf94dd | 0x51c36ffb05e17ed80ee5c02fa83d7677c5613de2 |

---

## 🟢 Filecoin + IPFS

### Overview
Filecoin provides decentralized, verifiable storage with on-chain proofs. IPFS handles content addressing via Content Identifiers (CIDs).

### Integration Approach: **Web3.storage** (Recommended)

For agent logs and metadata, use Web3.storage's simple HTTP API:

```bash
npm install web3.storage
```

### Upload Agent Log
```typescript
import { Web3Storage } from 'web3.storage';

const client = new Web3Storage({ token: process.env.WEB3_STORAGE_TOKEN });

const agentLog = {
  agentId: "SignalMint-1",
  timestamp: new Date().toISOString(),
  signals: [/* detected signals */],
  decision: "MINT_NFT",
  execution: [/* tx hashes */],
  verification: [/* on-chain confirmations */]
};

const file = new File([JSON.stringify(agentLog, null, 2)], 'agent_log.json');
const cid = await client.put([file]);
console.log(`Stored at IPFS: ipfs://${cid}`);
```

### Integration Points
- **Storage destination**: agent_log.json, metadata files
- **Reference**: Store CID in on-chain registries (ERC-8004, Rare token URI)
- **Verification**: Query IPFS gateway or Lotus node to retrieve and verify content
- **Output logging**: Record IPFS CID for each upload in agent_log.json

### Key Concepts
- **Content ID (CID)**: Hash of file content; same content = same CID (deterministic)
- **Pinning**: Web3.storage automatically pins to Filecoin for persistence
- **IPFS gateway**: Retrieve from `https://w3s.link/ipfs/{cid}` or your own IPFS node

---

## 🟠 Uniswap V4 API

### Overview
Uniswap provides APIs for token swapping with MEV protection (UniswapX), price quotes, and routing.

### Setup
1. **Get API key**: https://developers.uniswap.org/dashboard/
2. **Install SDK**:
```bash
npm install @uniswap/sdk-core @uniswap/v4-sdk @uniswap/smart-order-router
```

### Get Price Quote
```typescript
import { Uniswap } from '@uniswap/sdk-core';

const quote = await fetch('https://api.uniswap.org/v1/quote', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${UNISWAP_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tokenIn: 'WETH',
    amountIn: '1.0',
    tokenOut: 'USDC',
    slippageTolerance: 1 // 1%
  })
});
```

### Execute Swap
```typescript
// Swap WETH → USDC
const swapTx = await uniswap.swap({
  tokenIn: WETH_ADDRESS,
  tokenOut: USDC_ADDRESS,
  amountIn: ethers.parseEther('1'),
  minAmountOut: minAmountOut,
  recipient: agentWallet.address,
  deadline: Math.floor(Date.now() / 1000) + 60 * 20 // 20 min
});

// Wait for confirmation
const receipt = await swapTx.wait();
console.log(`Swap tx: ${receipt.transactionHash}`);
```

### Integration Points
- **Scout Agent**: Fetch current prices, trend analysis
- **Analyst Agent**: Get swap quotes for execution decisions
- **Executor Agent**: Execute real swaps with slippage protection
- **Output logging**: Record swap tx hash, amounts in/out in agent_log.json

### Key Features
- **MEV Protection**: UniswapX routes through private pools
- **Multi-chain**: Ethereum, Polygon, Arbitrum, Base, and more
- **Permit2**: Support for signature-based approvals (no prior tx needed)

---

## 🟡 Locus (Agent Payments)

### Overview
Locus provides wallet management and spend control for autonomous agents.

### Status
⚠️ Documentation currently unavailable (docs.locus.fi inaccessible)

### Planned Integration
- Agent wallet funding mechanism
- Transaction fee coverage
- Spend limits per action type

---

## 🟢 Zyfai (Yield Accounts)

### Overview
Zyfai enables autonomous agents to earn yield on deposits, then use that yield for operations (gas, swaps). Built with ERC-4337 smart wallets and ERC-7579 module standards.

### Installation
```bash
npm install @zyfai/sdk
```

### Create Smart Wallet
```typescript
import { ZyfaiSDK } from '@zyfai/sdk';

const sdk = new ZyfaiSDK({
  privateKey: process.env.AGENT_PRIVATE_KEY,
  chains: ['arbitrum', 'base', 'plasma']
});

// Deterministic wallet address
const wallet = await sdk.getOrCreateWallet();
console.log(`Agent wallet: ${wallet.address}`);
```

### Deposit & Earn Yield
```typescript
import { Token } from '@zyfai/sdk';

// Deposit USDC earns ~8% APY
const depositTx = await sdk.deposit({
  token: Token.USDC,
  amount: ethers.parseUnits('1000', 6),
  chain: 'base'
});

// Monitor yield accrual
const balance = await sdk.getBalance(Token.USDC, 'base');
console.log(`Yield earned: ${balance.yield}`);
```

### Use Yield for Operations
```typescript
// Withdraw yield for gas or swap operations
const withdrawTx = await sdk.withdraw({
  token: Token.USDC,
  amount: balance.yield, // Use only the yield
  chain: 'base'
});

// Yield funds next swap/mint
```

### Integration Points
- **Initialize**: Agent creates smart wallet on first run
- **Fund**: Initial deposit (if needed) and periodic yield monitoring
- **Spend loop**: Use accumulated yield for gas, swap tx fees, auction participation
- **Output logging**: Record yield earned, used in agent_log.json

### Supported Chains
- Arbitrum
- Base
- Plasma

---

## 🔵 OpenServ (Multi-Agent Coordination)

### Overview
OpenServ provides a platform and SDK for orchestrating multiple agents into collaborative systems with built-in reasoning (BRAID framework).

### Installation
```bash
npm install @openserv/sdk
```

### Create Multi-Agent System
```typescript
import { OpenServSDK, Agent } from '@openserv/sdk';

const openserv = new OpenServSDK({ apiKey: process.env.OPENSERV_API_KEY });

// Define individual agents
const scoutAgent = new Agent({
  name: 'ScoutAgent',
  role: 'data_collection',
  tools: ['fetch_signals', 'query_markets']
});

const executorAgent = new Agent({
  name: 'ExecutorAgent',
  role: 'blockchain_executor',
  tools: ['mint_nft', 'execute_swap', 'settle_auction']
});

// Orchestrate into system
const system = await openserv.createSystem({
  name: 'SignalMint',
  agents: [scoutAgent, executorAgent],
  reasoning: 'BRAID' // Bounded Reasoning for Autonomous Inference
});
```

### Agent Communication
```typescript
// ScoutAgent sends structured message to ExecutorAgent
await system.sendMessage({
  from: 'ScoutAgent',
  to: 'ExecutorAgent',
  type: 'signal_alert',
  payload: {
    signal: 'ETH_PRICE_SPIKE',
    threshold: 2500,
    confidence: 0.92,
    actionRequired: 'MINT_NFT'
  }
});
```

### Integration Points
- **Agent registry**: All agents auto-discover via OpenServ
- **Message bus**: Structured message passing between agents
- **Task delegation**: Executor waits for Scout signal, executes autonomously
- **Reasoning**: BRAID framework optimizes decisions at 70x cost reduction vs standard LLMs
- **Output logging**: All inter-agent messages logged to agent_log.json

### Key Features
- **Canvas UI**: Drag-drop agent composition
- **BRAID Reasoning**: State-of-the-art multi-model reasoning (70x cost reduction)
- **Multi-chain**: Any agent, any framework, any chain support

---

## 🟣 ERC-8004: Trustless Agents (Identity & Reputation)

### Overview
ERC-8004 provides on-chain agent identity, reputation scoring, and validation registries. Agents register as NFTs with metadata, receive feedback, and can be validated by independent validators.

### Three Core Registries

#### 1. Identity Registry (ERC-721 based)
```solidity
interface IdentityRegistry is IERC721URIStorage {
  function register(string agentURI) external returns (uint256 agentId);
  function setAgentURI(uint256 agentId, string newURI) external;
  function getAgentWallet(uint256 agentId) external view returns (address);
  function setAgentWallet(uint256 agentId, address newWallet) external;
}
```

#### 2. Reputation Registry
```solidity
interface ReputationRegistry {
  function giveFeedback(
    uint256 agentId, 
    int128 value,           // e.g., 85 (0-100 score)
    uint8 valueDecimals,    // e.g., 0 for whole numbers
    string tag1,            // e.g., "reliability"
    string tag2,            // e.g., "monthly"
    string feedbackURI      // Optional IPFS link to details
  ) external;
  
  function getSummary(
    uint256 agentId,
    address[] clientAddresses,
    string tag1,
    string tag2
  ) external view returns (uint64 count, int128 summaryValue);
}
```

#### 3. Validation Registry
```solidity
interface ValidationRegistry {
  function validationRequest(
    address validator,
    uint256 agentId,
    string requestURI,    // Details of what to validate
    bytes32 requestHash
  ) external;
  
  function validationResponse(
    bytes32 requestHash,
    uint8 response,       // 0-100 score
    string responseURI    // Validator's proof/audit
  ) external;
}
```

### Integration: Agent Registration

```typescript
import { ethers } from 'ethers';

// 1. Create agent.json registrationfile
const agentJSON = {
  type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  name: "SignalMint",
  description: "Autonomous market-driven NFT minting agent with signal detection",
  image: "ipfs://Qm...", // Agent logo
  services: [
    {
      name: "web",
      endpoint: "https://signalmint.example.com"
    },
    {
      name: "MCP",
      endpoint: "https://mcp.signalmint.example.com/",
      version: "2025-06-18"
    }
  ],
  active: true,
  registrations: [
    {
      agentId: 1,
      agentRegistry: "eip155:8453:0x..." // Base mainnet
    }
  ],
  supportedTrust: ["reputation", "validation"]
};

// 2. Upload to IPFS
const ipfsUri = await uploadToIPFS(agentJSON);

// 3. Call register() on Identity Registry
const identityRegistry = new ethers.Contract(
  '0x...',                    // Base mainnet registry address
  IdentityRegistryABI,
  signer
);

const registerTx = await identityRegistry.register(ipfsUri);
const receipt = await registerTx.wait();
const agentId = receipt.events[0].args.agentId;

console.log(`Registered agent ID: ${agentId}`);
console.log(`Agent URI: ${ipfsUri}`);
console.log(`Tx: https://basescan.org/tx/${registerTx.hash}`);
```

### Receiving Reputation Feedback

```typescript
// Other agents/validators can rate SignalMint
const reputationRegistry = new ethers.Contract(
  '0x...',
  ReputationRegistryABI,
  raterSigner
);

await reputationRegistry.giveFeedback(
  agentId = 1,
  value = 92,              // 92/100 score
  valueDecimals = 0,
  tag1 = "reliability",
  tag2 = "2025-03",
  feedbackURI = "ipfs://Qm..." // Optional  detailed feedback
);
```

### Integration Points
- **Initialization**: Register agent on first run, capture agentId
- **Identity**: Link all actions (mints, swaps, auctions) to agentId
- **Reputation**: Track feedback in agent_log.json and on-chain
- **Verification**: Other agents query reputation before trusting
- **Output**: ERC-8004 tx hash in README and agent_log.json

### Contract Deployment
- **Base Mainnet**: Expected to be deployed as singleton
- **Sepolia Testnet**: For testing before mainnet
- **Status**: ERC-8004 is DRAFT (August 2025), implementation addresses to be announced at Synthesis

---

## 🟡 ENS (Ethereum Name Service)

### Overview
ENS provides human-readable names (signalmint.eth) linked to Ethereum addresses and metadata.

### Setup
```bash
npm install @ensdomains/ensjs
```

### Link ENS to Agent
```typescript
import { createPublicClient, createWalletClient } from 'viem';
import { getEnsAddress } from '@ensdomains/ensjs';

const ensName = 'signalmint.eth';
const agentWallet = '0x...';

// Resolve ENS to address
const address = await getEnsAddress({ name: ensName });

// Or set ENS resolver to point to agent wallet (if you own the domain)
// This creates a human-readable identity for the agent
```

### Integration Points
- **Optional**: Register signalmint.eth for agent branding
- **Identity**: Optional complement to ERC-8004 identity
- **Documentation**: Link ENS name in REA DME and agent.json

---

## 🟠 Bankr (Optional: Self-Sustaining Agents)

### Overview
Bankr enables agents to fund themselves by launching a token and capturing trading fees from that token's trades.

### Installation
```bash
npm install -g @bankr/cli
```

### Quick Start
```bash
# 1. Create agent with built-in wallet
bankr login

# 2. Launch a fair-launch token for the agent
bankr launch --name SMINT --symbol SMINT

# 3. Track earnings (trading fees)
bankr fees

# 4. Use earnings to fund compute
# Earnings auto-flow back to cover operational costs
```

### Integration
SignalMint **can optionally**:
- Launch $SMINT token on Base
- Earn trading fees when users trade $SMINT
- Use fees to cover gas, API calls, Uniswap swap fees
- Become self-sustaining off-chain

This is a **bonus** for extending SignalMint's autonomy and is not required for the core loop.

---

## Summary: Protocol Integration Flow

```
Scout Agent (Signal Detection)
  ↓ [Uniswap Price API]
  ├→ Detect market anomalies
  └→ Send to AnalystAgent

Analyst Agent (Decision Making)
  ↓ [Signal Analysis]
  ├→ Evaluate conditions (confidence > 0.8)
  └→ Send decision to ExecutorAgent

Executor Agent (Actions)
  ├→ [Zyfai] Withdraw yield for gas
  ├→ [Uniswap] Execute swap if needed
  ├→ [Rare Protocol] Mint NFT with signal metadata
  ├→ [Rare Protocol] Launch auction
  └→ Send outputs to VerifierAgent

Verifier Agent (Validation)
  ├→ [Uniswap] Confirm swap tx
  ├→ [Rare Protocol] Verify mint & auction
  ├→ [ERC-8004] Confirm agent identity
  └→ Send verified logs to Storage

Storage (Filecoin + IPFS)
  ├→ [Web3.storage] Upload agent_log.json
  ├→ [IPFS] Store signal metadata
  └→ Return CID for on-chain reference

ERC-8004 Identity
  ├→ [Identity Registry] Link all actions to agentId
  ├→ [Reputation Registry] Receive feedback
  └→ On-chain verifiability ✓

OpenServ Coordination (Optional)
  └→ Multi-agent message bus + BRAID reasoning
```

---

## Testing Checklist

- [ ] **Rare Protocol**: Deploy test collection, mint test NFT on Sepolia
- [ ] **Filecoin/IPFS**: Upload test agent_log.json, retrieve via gateway
- [ ] **Uniswap API**: Get quote, execute test swap on Sepolia
- [ ] **ERC-8004**: Register agent on Sepolia testnet, capture agentId
- [ ] **Zyfai**: Create test wallet, check balance (no real deposit needed for test)
- [ ] **OpenServ**: Test agent message passing with stub agents
- [ ] **End-to-end**: Signal → Decision → Swap → Mint → Log → Verify

---

## Links

- Rare: https://rare.xyz
- Filecoin: https://docs.filecoin.io
- Uniswap: https://docs.uniswap.org
- Zyfai: https://docs.zyf.ai
- OpenServ: https://docs.openserv.ai
- ERC-8004: https://eips.ethereum.org/EIPS/eip-8004
- ENS: https://docs.ens.domains
- Bankr: https://docs.bankr.bot
