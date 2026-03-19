// Signal types
export interface Signal {
  id: string;
  type: 'ETH_PRICE_SPIKE' | 'TREND_CHANGE' | 'VOLUME_SPIKE';
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
  conditionCheck?: {
    metric: 'ETH_PRICE';
    operator: '>' | '>=' | '<' | '<=';
    currentValue: number;
    threshold: number;
    passed: boolean;
  };
  signalSnapshot?: {
    type: Signal['type'];
    source: string;
    value: number;
    threshold: number;
    detectedAt: string;
  };
  timestamp: Date;
}

// Execution types
export interface Execution {
  id: string;
  type: 'MINT_NFT' | 'CREATE_AUCTION' | 'EXECUTE_SWAP' | 'VERIFY_TX';
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

// Complete agent log
export interface AgentLog {
  version: string;
  agentId?: number;
  agentRegistry?: string;
  operatorWallet?: string;
  cycleId: string;
  startTime: Date;
  endTime?: Date;
  signals: Signal[];
  decisions: Decision[];
  executions: Execution[];
  verifications: any[];
  storage?: {
    logIpfsCid?: string;
    logUrl?: string;
    uploadTimestamp?: Date;
  };
  erc8004?: {
    agentId?: number;
    identity_tx?: string;
    reputation_feedback?: any;
  };
  summary: {
    signalsDetected: number;
    decisionsGenerated: number;
    executionsAttempted: number;
    executionsSucceeded: number;
    executionsFailed: number;
    verificationsPass: number;
    totalGasUsed: number;
    totalCostETH: number;
  };
}
