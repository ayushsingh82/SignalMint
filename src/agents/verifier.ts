import { Execution, AgentMessage } from '../shared/types';
import { messageBus } from '../shared/message';
import { filecoinIntegration } from '../protocols/filecoin';
import { logger } from '../utils/logger';

/**
 * Verifier Agent: Validates executions and logs results to persistent storage
 * Confirms on-chain state, saves logs to Filecoin/IPFS
 */
export class VerifierAgent {
  private verified: number = 0;
  private failed: number = 0;

  /**
   * Verify execution and persist logs
   */
  async run(message: AgentMessage): Promise<void> {
    try {
      if (message.type !== 'execution_result') {
        return;
      }

      const execution = message.payload as Execution;

      console.log(`\n✔️  [VerifierAgent] Verifying execution: ${execution.type}`);

      // Verify transaction on-chain (simulated for demo)
      const verification = await this.verifyExecution(execution);

      logger.log('VerifierAgent', 'verification_complete', {
        executionId: execution.id,
        txHash: execution.txHash,
        status: verification.status,
      }, 'success');

      logger.recordVerification(verification);

      if (verification.status === 'passed') {
        this.verified++;
      } else {
        this.failed++;
      }

      // Persist log to Filecoin
      const logCid = await this.persistLog();

      console.log(`📝 Log persisted to IPFS: ${filecoinIntegration.generateIPFSUrl(logCid)}`);

      // Send completion signal
      await messageBus.sendMessage({
        from: 'VerifierAgent',
        to: 'System',
        type: 'cycle_completed',
        payload: {
          executionId: execution.id,
          ipfsCid: logCid,
          verified: this.verified,
          failed: this.failed,
        },
        timestamp: new Date(),
      });
    } catch (error) {
      logger.log('VerifierAgent', 'run', {}, 'failed', String(error));
    }
  }

  /**
   * Verify that execution was successful on-chain
   */
  private async verifyExecution(
    execution: Execution
  ): Promise<{
    executionId: string;
    txHash?: string;
    confirmed: boolean;
    status: string;
    blockNumber?: number;
    gasUsed?: number;
  }> {
    return {
      executionId: execution.id,
      txHash: execution.txHash,
      confirmed: execution.result === 'success',
      status: execution.result === 'success' ? 'passed' : 'failed',
      blockNumber: 123456 + Math.floor(Math.random() * 100), // Mock
      gasUsed: 185342, // Mock
    };
  }

  /**
   * Persist current agent log to Filecoin/IPFS
   */
  private async persistLog(): Promise<string> {
    try {
      const logData = logger.getLogData();
      const logString = JSON.stringify(logData, null, 2);

      const cid = await filecoinIntegration.uploadLog(
        logString,
        `agent_log_${logger.getCycleId()}.json`
      );

      logger.log('VerifierAgent', 'persistLog', {
        cid,
        size: logString.length,
        url: filecoinIntegration.generateIPFSUrl(cid),
      }, 'success');

      return cid;
    } catch (error) {
      logger.log('VerifierAgent', 'persistLog', {}, 'failed', String(error));
      throw error;
    }
  }

  /**
   * Start verifier agent (subscribe to execution_result messages)
   */
  async start(): Promise<void> {
    messageBus.onMessage('execution_result', (msg) => this.run(msg));
    console.log('✅ VerifierAgent started and listening for execution results');
  }

  /**
   * Get verifier statistics
   */
  getStats(): {
    verified: number;
    failed: number;
    successRate: number;
  } {
    const total = this.verified + this.failed;
    const successRate = total > 0 ? (this.verified / total) * 100 : 0;

    return {
      verified: this.verified,
      failed: this.failed,
      successRate,
    };
  }
}

export const verifierAgent = new VerifierAgent();
