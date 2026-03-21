import fs from 'fs';
import path from 'path';
import { config } from '../shared/config';
import { AgentLogEntry, AgentLog, Signal, Decision, Execution } from '../shared/types';

/**
 * Comprehensive agent logger for structured execution tracking
 */
export class Logger {
  private logDir: string;
  private currentCycleId: string;
  private entries: AgentLogEntry[] = [];
  private cycleStartTime: Date;
  private agentLogData: Partial<AgentLog>;

  constructor(cycleId: string = new Date().toISOString()) {
    this.logDir = config.logging.dir;
    this.currentCycleId = cycleId;
    this.cycleStartTime = new Date();
    
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    this.agentLogData = {
      version: '1.0.0',
      cycleId,
      startTime: this.cycleStartTime,
      signals: [],
      decisions: [],
      executions: [],
      verifications: [],
      summary: {
        signalsDetected: 0,
        decisionsGenerated: 0,
        executionsAttempted: 0,
        executionsSucceeded: 0,
        executionsFailed: 0,
        verificationsPass: 0,
        totalGasUsed: 0,
        totalCostETH: 0,
      },
    };
  }

  log(
    agentName: string,
    actionType: string,
    data: unknown,
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

    const statusEmoji = result === 'success' ? '✓' : '✗';
    console.log(
      `[${agentName}] ${statusEmoji} ${actionType}: ${result}`,
      data
    );
    
    if (error) {
      console.error(`  Error: ${error}`);
    }
  }

  recordSignal(signal: Signal): void {
    if (!this.agentLogData.signals) this.agentLogData.signals = [];
    this.agentLogData.signals.push(signal);
    if (this.agentLogData.summary) {
      this.agentLogData.summary.signalsDetected++;
    }
  }

  recordDecision(decision: Decision): void {
    if (!this.agentLogData.decisions) this.agentLogData.decisions = [];
    this.agentLogData.decisions.push(decision);
    if (this.agentLogData.summary) {
      this.agentLogData.summary.decisionsGenerated++;
    }
  }

  recordExecution(execution: Execution, success: boolean = true): void {
    if (!this.agentLogData.executions) this.agentLogData.executions = [];
    this.agentLogData.executions.push(execution);
    if (this.agentLogData.summary) {
      this.agentLogData.summary.executionsAttempted++;
      if (success) {
        this.agentLogData.summary.executionsSucceeded++;
      } else {
        this.agentLogData.summary.executionsFailed++;
      }
    }
  }

  recordVerification(verification: unknown): void {
    if (!this.agentLogData.verifications) this.agentLogData.verifications = [];
    this.agentLogData.verifications.push(verification);
    if (this.agentLogData.summary) {
      this.agentLogData.summary.verificationsPass++;
    }
  }

  saveLog(fileName?: string): string {
    const endTime = new Date();
    
    if (this.agentLogData.summary) {
      this.agentLogData.summary.totalCostETH = 0.00463; // Mock for now
    }

    const completeLog: AgentLog = {
      version: this.agentLogData.version || '1.0.0',
      cycleId: this.agentLogData.cycleId || this.currentCycleId,
      startTime: this.agentLogData.startTime || this.cycleStartTime,
      endTime,
      signals: this.agentLogData.signals || [],
      decisions: this.agentLogData.decisions || [],
      executions: this.agentLogData.executions || [],
      verifications: this.agentLogData.verifications || [],
      summary: this.agentLogData.summary || {
        signalsDetected: 0,
        decisionsGenerated: 0,
        executionsAttempted: 0,
        executionsSucceeded: 0,
        executionsFailed: 0,
        verificationsPass: 0,
        totalGasUsed: 0,
        totalCostETH: 0,
      },
    };

    const finalPath = path.join(
      this.logDir,
      fileName || `agent_log_${this.currentCycleId.replace(/[:.]/g, '-')}.json`
    );

    fs.writeFileSync(finalPath, JSON.stringify(completeLog, null, 2));
    
    console.log(`\n📝 Log saved to: ${finalPath}`);
    console.log(`📊 Summary: ${completeLog.summary.executionsSucceeded}/${completeLog.summary.executionsAttempted} executions succeeded`);

    return finalPath;
  }

  getLogFilePath(): string {
    return path.join(this.logDir, `agent_log_${this.currentCycleId.replace(/[:.]/g, '-')}.json`);
  }

  getLogData(): AgentLog {
    return this.agentLogData as AgentLog;
  }

  getCycleId(): string {
    return this.currentCycleId;
  }
}

// Export singleton logger
export const logger = new Logger();
