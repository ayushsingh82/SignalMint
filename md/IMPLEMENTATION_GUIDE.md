# SignalMint — Implementation Guide

Step-by-step technical guide to build SignalMint from scratch.

---

## Phase 0: Setup & Configuration

### 1. Create Project Structure
```bash
cd SignalMint
mkdir -p src/{agents,protocols,utils,models}
mkdir -p config contracts logs test
touch .env .env.example .gitignore
```

### 2. Package Configuration
```bash
# Initialize if needed
npm init -y

# Install core dependencies
npm install \
  ethers viem \
  @rareprotocol/rare-cli \
  @uniswap/sdk-core @uniswap/v4-sdk \
  @zyfai/sdk \
  web3.storage \
  @openserv/sdk \
  dotenv \
  typescript @types/node \
  ts-node nodemon

# Dev dependencies
npm install -D \
  prettier eslint \
  jest @types/jest ts-jest \
  @types/express
```

### 3. Environment Variables
Create `.env.example`:
```bash
# Wallet
AGENT_PRIVATE_KEY=0x...
AGENT_ADDRESS=0x...

# Rare Protocol
RARE_CHAIN=sepolia  # or mainnet, base
RARE_RPC_URL=https://...

# Uniswap
UNISWAP_API_KEY=...
UNISWAP_CHAIN=sepolia

# Filecoin/IPFS
WEB3_STORAGE_TOKEN=...

# ERC-8004 (Registry contract address on your chain)
ERC8004_IDENTITY_REGISTRY=0x...
ERC8004_REPUTATION_REGISTRY=0x...

# Zyfai
ZYFAI_API_KEY=...

# OpenServ
OPENSERV_API_KEY=...
OPENSERV_PLATFORM_URL=https://platform.openserv.ai

# Logging
LOG_LEVEL=info
LOG_DIR=./logs
```

### 4. TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

---

## Phase 1: Core Types & Shared Infrastructure

### 1. Types Definition (`src/shared/types.ts`)

```typescript
// Signal types
export interface Signal {
  id: string;
  type: 'PRICE_SPIKE' | 'TREND_CHANGE' | 'VOLUME_SPIKE';
  source: string;
  value: number;
  threshold: number;
  confidence: number;
  timestamp: Date;
  metadata: Record<string, any>;
}

// Decision types
export interface Decision {
  id: string;
  signalId: string;
  type: 'MINT' | 'SKIP' | 'AUCTION' | 'SWAP';
  confidence: number;
  reasoning: string;
  estimatedCost: string;
  timestamp: Date;
}

// Execution types
export interface Execution {
  id: string;
  type: 'MINT_NFT' | 'CREATE_AUCTION' | 'EXECUTE_SWAP';
  txHash?: string;
  result: 'pending' | 'success' | 'failed';
  error?: string;
  metadata: Record<string, any>;
  timestamp: Date;
  attempts: number;
}

// Agent messages
export interface AgentMessage {
  from: string;
  to: string;
  type: string;
  payload: Record<string, any>;
  timestamp: Date;
}

// Agent log entry
export interface AgentLogEntry {
  timestamp: Date;
  agentName: string;
  actionType: string;
  data: Record<string, any>;
  result: 'success' | 'failed';
  error?: string;
}
```

### 2. Message Bus (`src/shared/message.ts`)

```typescript
import { EventEmitter } from 'events';
import { AgentMessage } from './types';

export class MessageBus extends EventEmitter {
  private messageQueue: AgentMessage[] = [];

  async sendMessage(message: AgentMessage): Promise<void> {
    this.messageQueue.push(message);
    this.emit(message.type, message);
  }

  onMessage(
    type: string,
    handler: (message: AgentMessage) => Promise<void>
  ): void {
    this.on(type, async (message) => {
      try {
        await handler(message);
      } catch (error) {
        console.error(`Error handling ${type}:`, error);
      }
    });
  }

  getMessageQueue(): AgentMessage[] {
    return this.messageQueue;
  }

  clearQueue(): void {
    this.messageQueue = [];
  }
}

export const messageBus = new MessageBus();
```

### 3. Configuration (`src/shared/config.ts`)

```typescript
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  agent: {
    privateKey: process.env.AGENT_PRIVATE_KEY!,
    address: process.env.AGENT_ADDRESS,
  },
  
  rare: {
    chain: process.env.RARE_CHAIN || 'sepolia',
    rpcUrl: process.env.RARE_RPC_URL!,
  },
  
  uniswap: {
    apiKey: process.env.UNISWAP_API_KEY!,
    chain: process.env.UNISWAP_CHAIN || 'sepolia',
  },
  
  filecoin: {
    web3StorageToken: process.env.WEB3_STORAGE_TOKEN!,
  },
  
  erc8004: {
    identityRegistry: process.env.ERC8004_IDENTITY_REGISTRY!,
    reputationRegistry: process.env.ERC8004_REPUTATION_REGISTRY!,
  },
  
  zyfai: {
    apiKey: process.env.ZYFAI_API_KEY,
  },
  
  openserv: {
    apiKey: process.env.OPENSERV_API_KEY,
    platformUrl: process.env.OPENSERV_PLATFORM_URL,
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs',
  },
};

// Validate required config
const required = ['AGENT_PRIVATE_KEY', 'UNISWAP_API_KEY', 'WEB3_STORAGE_TOKEN'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}
```

### 4. Logger (`src/utils/logger.ts`)

```typescript
import fs from 'fs';
import path from 'path';
import { config } from '../shared/config';
import { AgentLogEntry } from '../shared/types';

export class Logger {
  private logFile: string;
  private entries: AgentLogEntry[] = [];

  constructor() {
    const logDir = config.logging.dir;
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFile = path.join(logDir, `agent_log_${timestamp}.json`);
  }

  log(
    agentName: string,
    actionType: string,
    data: Record<string, any>,
    result: 'success' | 'failed' = 'success',
    error?: string
  ): void {
    const entry: AgentLogEntry = {
      timestamp: new Date(),
      agentName,
      actionType,
      data,
      result,
      error,
    };

    this.entries.push(entry);
    console.log(`[${agentName}] ${actionType}: ${result}`, data);
  }

  saveLog(): void {
    const agentLog = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      agentName: 'SignalMint',
      operatorWallet: config.agent.address,
      entries: this.entries,
      summary: {
        totalActions: this.entries.length,
        successCount: this.entries.filter((e) => e.result === 'success').length,
        failureCount: this.entries.filter((e) => e.result === 'failed').length,
      },
    };

    fs.writeFileSync(
      this.logFile,
      JSON.stringify(agentLog, null, 2)
    );
    
    console.log(`Log saved to ${this.logFile}`);
  }

  getLogFilePath(): string {
    return this.logFile;
  }
}

export const logger = new Logger();
```

---

## Phase 2: Protocol Integrations

### 1. Rare Protocol Integration (`src/protocols/rare.ts`)

```typescript
import { execSync } from 'child_process';
import { config } from '../shared/config';
import { logger } from '../utils/logger';

export class RareIntegration {
  private chain: string;

  constructor() {
    this.chain = config.rare.chain;
  }

  async configureCLI(): Promise<void> {
    try {
      execSync(
        `rare configure --chain ${this.chain} ` +
        `--private-key ${config.agent.privateKey} ` +
        `--rpc-url ${config.rare.rpcUrl}`,
        { stdio: 'inherit' }
      );
      logger.log('RareIntegration', 'configureCLI', {}, 'success');
    } catch (error) {
      logger.log('RareIntegration', 'configureCLI', {}, 'failed', String(error));
      throw error;
    }
  }

  async deployCollection(name: string, symbol: string): Promise<string> {
    try {
      const output = execSync(
        `rare deploy erc721 "${name}" "${symbol}" --json`,
        { encoding: 'utf-8' }
      );
      const result = JSON.parse(output);
      
      logger.log('RareIntegration', 'deployCollection', {
        name,
        symbol,
        contractAddress: result.contractAddress,
      }, 'success');
      
      return result.contractAddress;
    } catch (error) {
      logger.log('RareIntegration', 'deployCollection', { name, symbol }, 'failed', String(error));
      throw error;
    }
  }

  async mintNFT(
    contractAddress: string,
    name: string,
    description: string,
    imagePath: string,
    attributes: Record<string, string>
  ): Promise<{ txHash: string; tokenId: number }> {
    try {
      let cmd = `rare mint --contract ${contractAddress} ` +
        `--name "${name}" --description "${description}" ` +
        `--image ${imagePath} --json`;

      // Add attributes
      for (const [key, value] of Object.entries(attributes)) {
        cmd += ` --attribute "${key}=${value}"`;
      }

      const output = execSync(cmd, { encoding: 'utf-8' });
      const result = JSON.parse(output);

      logger.log('RareIntegration', 'mintNFT', {
        contract: contractAddress,
        txHash: result.txHash,
        tokenId: result.tokenId,
      }, 'success');

      return { txHash: result.txHash, tokenId: result.tokenId };
    } catch (error) {
      logger.log('RareIntegration', 'mintNFT', { contractAddress }, 'failed', String(error));
      throw error;
    }
  }

  async createAuction(
    contractAddress: string,
    tokenId: number,
    startingPrice: string,
    durationSeconds: number
  ): Promise<{ txHash: string; auctionId: number }> {
    try {
      const output = execSync(
        `rare auction create --contract ${contractAddress} ` +
        `--token-id ${tokenId} --starting-price ${startingPrice} ` +
        `--duration ${durationSeconds} --json`,
        { encoding: 'utf-8' }
      );
      const result = JSON.parse(output);

      logger.log('RareIntegration', 'createAuction', {
        contract: contractAddress,
        tokenId,
        txHash: result.txHash,
        auctionId: result.auctionId,
      }, 'success');

      return { txHash: result.txHash, auctionId: result.auctionId };
    } catch (error) {
      logger.log('RareIntegration', 'createAuction', { contractAddress, tokenId }, 'failed', String(error));
      throw error;
    }
  }

  async getAuctionStatus(contractAddress: string, tokenId: number): Promise<any> {
    try {
      const output = execSync(
        `rare auction status --contract ${contractAddress} --token-id ${tokenId} --json`,
        { encoding: 'utf-8' }
      );
      return JSON.parse(output);
    } catch (error) {
      console.error('Failed to get auction status:', error);
      throw error;
    }
  }
}

export const rareIntegration = new RareIntegration();
```

### 2. Uniswap Integration (`src/protocols/uniswap.ts`)

```typescript
import axios from 'axios';
import { config } from '../shared/config';
import { logger } from '../utils/logger';

export class UniswapIntegration {
  private baseUrl = 'https://api.uniswap.org/v1';
  private apiKey = config.uniswap.apiKey;

  async getPrice(tokenIn: string, tokenOut: string): Promise<number> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/quote`,
        {
          tokenIn,
          amountIn: '1.0',
          tokenOut,
          slippageTolerance: 1,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const price = parseFloat(response.data.amountOut);
      logger.log('UniswapIntegration', 'getPrice', {
        tokenIn,
        tokenOut,
        price,
      }, 'success');

      return price;
    } catch (error) {
      logger.log('UniswapIntegration', 'getPrice', { tokenIn, tokenOut }, 'failed', String(error));
      throw error;
    }
  }

  async getQuote(
    tokenIn: string,
    amountIn: string,
    tokenOut: string,
    slippage: number = 1
  ): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/quote`,
        {
          tokenIn,
          amountIn,
          tokenOut,
          slippageTolerance: slippage,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.log('UniswapIntegration', 'getQuote', {
        tokenIn,
        amountIn,
        tokenOut,
        amountOut: response.data.amountOut,
      }, 'success');

      return response.data;
    } catch (error) {
      logger.log('UniswapIntegration', 'getQuote', { tokenIn, amountIn, tokenOut }, 'failed', String(error));
      throw error;
    }
  }

  async executeSwap(params: any): Promise<string> {
    // This would integrate with actual swap execution
    // For now, return a mock tx hash
    const txHash = '0x' + Math.random().toString(16).slice(2);
    
    logger.log('UniswapIntegration', 'executeSwap', {
      txHash,
      ...params,
    }, 'success');

    return txHash;
  }
}

export const uniswapIntegration = new UniswapIntegration();
```

### 3. Filecoin Integration (`src/protocols/filecoin.ts`)

```typescript
import { Web3Storage } from 'web3.storage';
import { config } from '../shared/config';
import { logger } from '../utils/logger';

export class FilecoinIntegration {
  private client: Web3Storage;

  constructor() {
    this.client = new Web3Storage({ token: config.filecoin.web3StorageToken });
  }

  async uploadLog(logContent: string): Promise<string> {
    try {
      const file = new File([logContent], 'agent_log.json', {
        type: 'application/json',
      });

      const cid = await this.client.put([file], {
        name: `agent_log_${new Date().toISOString()}`,
      });

      logger.log('FilecoinIntegration', 'uploadLog', {
        cid,
        timestamp: new Date().toISOString(),
      }, 'success');

      return cid;
    } catch (error) {
      logger.log('FilecoinIntegration', 'uploadLog', {}, 'failed', String(error));
      throw error;
    }
  }

  generateIPFSUrl(cid: string): string {
    return `https://w3s.link/ipfs/${cid}`;
  }
}

export const filecoinIntegration = new FilecoinIntegration();
```

---

## Phase 3: Agent Implementations

### 1. Scout Agent (`src/agents/scout.ts`)

```typescript
import { Signal } from '../shared/types';
import { messageBus } from '../shared/message';
import { uniswapIntegration } from '../protocols/uniswap';
import { logger } from '../utils/logger';

export class ScoutAgent {
  private signalThreshold = 2500; // ETH price threshold
  private confidenceThreshold = 0.8;
  private priceHistory: number[] = [];

  async run(): Promise<void> {
    console.log('[ScoutAgent] Starting signal detection...');

    try {
      // Fetch current price
      const price = await uniswapIntegration.getPrice('WETH', 'USDC');
      this.priceHistory.push(price);

      // Detect signal
      const signal = this.detectSignal(price);

      if (signal) {
        logger.log('ScoutAgent', 'signal_detected', signal, 'success');

        // Send to AnalystAgent
        await messageBus.sendMessage({
          from: 'ScoutAgent',
          to: 'AnalystAgent',
          type: 'signal_detected',
          payload: signal,
          timestamp: new Date(),
        });
      } else {
        logger.log('ScoutAgent', 'no_signal', { price }, 'success');
      }
    } catch (error) {
      logger.log('ScoutAgent', 'run', {}, 'failed', String(error));
      throw error;
    }
  }

  private detectSignal(currentPrice: number): Signal | null {
    const confidence = this.calculateConfidence(currentPrice);

    if (currentPrice > this.signalThreshold && confidence >= this.confidenceThreshold) {
      return {
        id: `signal_${Date.now()}`,
        type: 'PRICE_SPIKE',
        source: 'uniswap_api',
        value: currentPrice,
        threshold: this.signalThreshold,
        confidence,
        timestamp: new Date(),
        metadata: {
          priceHistoryLength: this.priceHistory.length,
        },
      };
    }

    return null;
  }

  private calculateConfidence(currentPrice: number): number {
    // Simple confidence calculation
    if (this.priceHistory.length === 0) return 0.5;

    const previousPrice = this.priceHistory[this.priceHistory.length - 1];
    const change = (currentPrice - previousPrice) / previousPrice;

    // Higher change = higher confidence (up to 1.0)
    return Math.min(1.0, 0.5 + Math.abs(change) * 10);
  }
}

export const scoutAgent = new ScoutAgent();
```

### 2. Analyst Agent (`src/agents/analyst.ts`)

```typescript
import { Decision, AgentMessage } from '../shared/types';
import { messageBus } from '../shared/message';
import { logger } from '../utils/logger';

export class AnalystAgent {
  async run(message: AgentMessage): Promise<void> {
    console.log('[AnalystAgent] Processing signal...');

    try {
      const signal = message.payload;
      const decision = this.makeDecision(signal);

      logger.log('AnalystAgent', 'decision_made', decision, 'success');

      // Send to ExecutorAgent
      await messageBus.sendMessage({
        from: 'AnalystAgent',
        to: 'ExecutorAgent',
        type: 'decision',
        payload: decision,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.log('AnalystAgent', 'run', {}, 'failed', String(error));
      throw error;
    }
  }

  private makeDecision(signal: any): Decision {
    const isHighConfidence = signal.confidence >= 0.8;
    const decision: Decision = {
      id: `decision_${Date.now()}`,
      signalId: signal.id,
      type: isHighConfidence ? 'MINT' : 'SKIP',
      confidence: signal.confidence,
      reasoning: isHighConfidence
        ? `Signal confidence ${signal.confidence} exceeds threshold`
        : `Signal confidence ${signal.confidence} below threshold`,
      estimatedCost: '0.05 ETH',
      timestamp: new Date(),
    };

    return decision;
  }

  async start(): Promise<void> {
    messageBus.onMessage('signal_detected', (msg) => this.run(msg));
  }
}

export const analystAgent = new AnalystAgent();
```

### 3. Executor Agent (`src/agents/executor.ts`)

```typescript
import { Execution, AgentMessage } from '../shared/types';
import { messageBus } from '../shared/message';
import { rareIntegration } from '../protocols/rare';
import { logger } from '../utils/logger';

export class ExecutorAgent {
  private nftContract: string | null = null;

  async initialize(): Promise<void> {
    // Deploy collection if not done
    if (!this.nftContract) {
      this.nftContract = await rareIntegration.deployCollection(
        'SignalMint Gallery',
        'SMINT'
      );
    }
  }

  async run(message: AgentMessage): Promise<void> {
    console.log('[ExecutorAgent] Executing decision...');

    try {
      const decision = message.payload;

      if (decision.type === 'MINT') {
        const execution = await this.mintNFT(decision);

        logger.log('ExecutorAgent', 'mint_executed', execution, 'success');

        // Send to VerifierAgent
        await messageBus.sendMessage({
          from: 'ExecutorAgent',
          to: 'VerifierAgent',
          type: 'execution_result',
          payload: execution,
          timestamp: new Date(),
        });
      } else {
        logger.log('ExecutorAgent', 'skipped', decision, 'success');
      }
    } catch (error) {
      logger.log('ExecutorAgent', 'run', {}, 'failed', String(error));
      throw error;
    }
  }

  private async mintNFT(decision: Decision): Promise<Execution> {
    if (!this.nftContract) {
      throw new Error('NFT contract not initialized');
    }

    const result = await rareIntegration.mintNFT(
      this.nftContract,
      `Market Signal ${new Date().toISOString()}`,
      `Autonomous mint triggered by market signal`,
      './assets/signal.png',
      {
        'Signal Type': 'PRICE_SPIKE',
        'Decision ID': decision.id,
        'Confidence': decision.confidence.toString(),
      }
    );

    return {
      id: `exec_${Date.now()}`,
      type: 'MINT_NFT',
      txHash: result.txHash,
      result: 'success',
      metadata: {
        tokenId: result.tokenId,
        contract: this.nftContract,
        decisionId: decision.id,
      },
      timestamp: new Date(),
      attempts: 1,
    };
  }

  async start(): Promise<void> {
    await this.initialize();
    messageBus.onMessage('decision', (msg) => this.run(msg));
  }
}

export const executorAgent = new ExecutorAgent();
```

---

## Phase 4: Main Loop

### Main Entry Point (`src/agents/main.ts`)

```typescript
import { scoutAgent } from './scout';
import { analystAgent } from './analyst';
import { executorAgent } from './executor';
import { logger } from '../utils/logger';

async function runAutonomousLoop(): Promise<void> {
  console.log('Starting SignalMint autonomous agent...\n');

  try {
    // Start agents
    await analystAgent.start();
    await executorAgent.start();

    // Run scout in loop
    setInterval(async () => {
      await scoutAgent.run();
    }, 5000); // Check every 5 seconds

  } catch (error) {
    console.error('Fatal error:', error);
    logger.log('Main', 'fatal_error', {}, 'failed', String(error));
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  logger.saveLog();
  process.exit(0);
});

// Run
runAutonomousLoop().catch(console.error);
```

---

## Phase 5: Testing

### E2E Test Template (`test/e2e.test.ts`)

```typescript
import { scoutAgent } from '../src/agents/scout';
import { analystAgent } from '../src/agents/analyst';
import { rareIntegration } from '../src/protocols/rare';

describe('E2E: Signal → Decision → Mint → Verify', () => {
  it('should detect signal and execute mint', async () => {
    // Scout detects signal
    await scoutAgent.run();

    // Analyst makes decision
    // Executor mints NFT (real tx)
    // Verifier logs and confirms

    // Assert on-chain state
  });
});
```

---

## Next Steps

1. **Complete Phase 1-5** above
2. **Build ERC-8004 Integration** (identity registration)
3. **Build Filecoin Integration** (log persistence)
4. **Add Zyfai Integration** (yield accounts)
5. **Add OpenServ Integration** (multi-agent coordination)
6. **Test on Sepolia**
7. **Deploy to Mainnet/Base**
8. **Submit to Synthesis**

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system design.

See [PROTOCOLS.md](./PROTOCOLS.md) for detailed protocol integration specs.

---

**Build step-by-step. Test frequently. Document everything.**
