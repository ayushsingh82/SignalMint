import dotenv from 'dotenv';

dotenv.config();

export const config = {
  agent: {
    privateKey: process.env.AGENT_PRIVATE_KEY!,
    address: process.env.AGENT_ADDRESS || '0x0000000000000000000000000000000000000000',
  },

  rare: {
    chain: process.env.RARE_CHAIN || 'sepolia',
    rpcUrl: process.env.RARE_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_KEY',
    contractAddress: process.env.RARE_CONTRACT_ADDRESS,
  },

  uniswap: {
    apiKey: process.env.UNISWAP_API_KEY,
    chain: process.env.UNISWAP_CHAIN || 'sepolia',
  },

  marketData: {
    cmcApiKey: process.env.CMC_API_KEY,
    newsApiKey: process.env.NEWS_API_KEY,
    polymarketQuery: process.env.POLYMARKET_QUERY || 'ethereum',
  },

  filecoin: {
    web3StorageToken: process.env.WEB3_STORAGE_TOKEN,
  },

  erc8004: {
    identityRegistry: process.env.ERC8004_IDENTITY_REGISTRY,
    reputationRegistry: process.env.ERC8004_REPUTATION_REGISTRY,
  },

  zyfai: {
    apiKey: process.env.ZYFAI_API_KEY,
    apiUrl: process.env.ZYFAI_API_URL || 'https://api.zyf.ai',
    privateKey: process.env.ZYFAI_PRIVATE_KEY,
    userEoa: process.env.ZYFAI_USER_EOA,
    chain: process.env.ZYFAI_CHAIN || 'base',
  },

  openserv: {
    apiKey: process.env.OPENSERV_API_KEY,
    platformUrl: process.env.OPENSERV_PLATFORM_URL,
  },

  pinata: {
    apiKey: process.env.PINATA_API_KEY,
    secretKey: process.env.PINATA_SECRET_KEY,
    jwt: process.env.PINATA_JWT,
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs',
  },

  // Signal thresholds
  signals: {
    ethPriceThreshold: Number(
      process.env.ETH_PRICE_THRESHOLD ||
      process.env.ETH_PRICE_THRESHOLD_BUY ||
      2500
    ),
    confidenceThreshold: Number(
      process.env.SIGNAL_CONFIDENCE_THRESHOLD ||
      process.env.MIN_CONFIDENCE ||
      0.8
    ),
    sentimentThreshold: Number(process.env.SIGNAL_SENTIMENT_THRESHOLD || 0.5),
    mintScoreThreshold: Number(process.env.SIGNAL_MINT_SCORE_THRESHOLD || 0.72),
    minDataSourcesForMint: Number(process.env.MIN_DATA_SOURCES_FOR_MINT || 3),
    mintCooldownMs: Number(process.env.MINT_COOLDOWN_MS || 10 * 60 * 1000),
    duplicateSignalWindowMs: Number(process.env.DUPLICATE_SIGNAL_WINDOW_MS || 60 * 60 * 1000),
    priceCheckIntervalMs: Number(process.env.PRICE_CHECK_INTERVAL_MS || 5000),
  },

  // Cycle limits
  limits: {
    maxCallsPerCycle: 100,
    maxCycleDurationMs: 5 * 60 * 1000, // 5 minutes
    maxRetries: 3,
    retryBackoffMs: 1000,
  },
};

// Validate critical config
const criticalVars = ['AGENT_PRIVATE_KEY'];
for (const key of criticalVars) {
  if (!process.env[key]) {
    console.warn(`⚠️  Missing optional env var: ${key}`);
  }
}

export function getConfig(key: string): unknown {
  const parts = key.split('.');
  let value: unknown = config;

  for (const part of parts) {
    if (typeof value !== 'object' || value === null) {
      return undefined;
    }
    value = (value as Record<string, unknown>)[part];
  }

  return value;
}
