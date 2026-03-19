import { Decision, AgentMessage, Signal } from '../shared/types';
import { messageBus } from '../shared/message';
import { logger } from '../utils/logger';

/**
 * Analyst Agent: Makes autonomous decisions based on signals
 * Evaluates confidence, determines action type (MINT, SKIP, etc.)
 */
export class AnalystAgent {
  private confidenceThreshold = 0.8;
  private gasEstimate = '0.05'; // ETH
  private decisionLog: Decision[] = [];

  /**
   * Process incoming signal and make decision
   */
  async run(message: AgentMessage): Promise<void> {
    try {
      if (message.type !== 'signal_detected') {
        return;
      }

      const signal = message.payload as Signal;
      console.log(`\n🧠 [AnalystAgent] Analyzing signal: ${signal.type}`);

      const decision = this.makeDecision(signal);

      logger.log('AnalystAgent', 'decision_made', {
        type: decision.type,
        confidence: decision.confidence,
        reasoning: decision.reasoning,
      }, 'success');

      logger.recordDecision(decision);
      this.decisionLog.push(decision);

      // Send decision to ExecutorAgent
      await messageBus.sendMessage({
        from: 'AnalystAgent',
        to: 'ExecutorAgent',
        type: 'decision',
        payload: decision,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.log('AnalystAgent', 'run', {}, 'failed', String(error));
    }
  }

  /**
   * Make decision based on signal parameters
   */
  private makeDecision(signal: Signal): Decision {
    // Decision logic: Signal above threshold → MINT; otherwise → SKIP
    const isHighConfidence = signal.confidence >= this.confidenceThreshold;

    const decision: Decision = {
      id: `decision_${Date.now()}`,
      signalId: signal.id,
      type: isHighConfidence ? 'MINT' : 'SKIP',
      confidence: signal.confidence,
      reasoning: this.generateReasoning(signal, isHighConfidence),
      estimatedCost: this.gasEstimate,
      timestamp: new Date(),
    };

    return decision;
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(signal: Signal, makeDecision: boolean): string {
    const confidencePercent = (signal.confidence * 100).toFixed(1);

    if (makeDecision) {
      return `Signal confidence ${confidencePercent}% exceeds threshold (${(this.confidenceThreshold * 100).toFixed(0)}%). MINT decision made.`;
    } else {
      return `Signal confidence ${confidencePercent}% below threshold (${(this.confidenceThreshold * 100).toFixed(0)}%). Skipping execution.`;
    }
  }

  /**
   * Start analyst agent (subscribe to signal_detected messages)
   */
  async start(): Promise<void> {
    messageBus.onMessage('signal_detected', (msg) => this.run(msg));
    console.log('✅ AnalystAgent started and listening for signals');
  }

  /**
   * Get analyst statistics
   */
  getStats(): {
    decisionsGenerated: number;
    mintsDecided: number;
    skipsDecided: number;
    avgConfidence: number;
  } {
    const mints = this.decisionLog.filter((d) => d.type === 'MINT').length;
    const skips = this.decisionLog.filter((d) => d.type === 'SKIP').length;
    const avgConfidence =
      this.decisionLog.length > 0
        ? this.decisionLog.reduce((sum, d) => sum + d.confidence, 0) /
          this.decisionLog.length
        : 0;

    return {
      decisionsGenerated: this.decisionLog.length,
      mintsDecided: mints,
      skipsDecided: skips,
      avgConfidence,
    };
  }
}

export const analystAgent = new AnalystAgent();
