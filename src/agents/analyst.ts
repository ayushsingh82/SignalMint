import { Decision, AgentMessage, Signal } from '../shared/types';
import { messageBus } from '../shared/message';
import { config } from '../shared/config';
import { logger } from '../utils/logger';

/**
 * Analyst Agent: Makes autonomous decisions based on signals
 * Evaluates confidence, determines action type (MINT, SKIP, etc.)
 */
export class AnalystAgent {
  private confidenceThreshold = config.signals.confidenceThreshold;
  private mintScoreThreshold = config.signals.mintScoreThreshold;
  private sentimentThreshold = config.signals.sentimentThreshold;
  private minDataSourcesForMint = config.signals.minDataSourcesForMint;
  private mintCooldownMs = config.signals.mintCooldownMs;
  private duplicateSignalWindowMs = config.signals.duplicateSignalWindowMs;
  private gasEstimate = '0.05'; // ETH
  private decisionLog: Decision[] = [];
  private lastMintAt: number = 0;
  private recentMintFingerprints = new Map<string, number>();

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
    const market = this.getMarketInputs(signal);
    const mintScore = this.calculateMintScore(signal, market);

    const isHighConfidence = signal.confidence >= this.confidenceThreshold;
    const isPriceConditionMet = signal.value > signal.threshold;
    const isSentimentHealthy = market.sentimentScore >= this.sentimentThreshold;
    const hasEnoughSources = market.sourceCount >= this.minDataSourcesForMint;
    const passesScore = mintScore >= this.mintScoreThreshold;

    const fingerprint = this.buildSignalFingerprint(signal, market);
    const duplicateBlocked = this.isDuplicateFingerprint(fingerprint);
    const cooldownBlocked = this.isMintCoolingDown();

    const shouldMint =
      isHighConfidence &&
      isPriceConditionMet &&
      isSentimentHealthy &&
      hasEnoughSources &&
      passesScore &&
      !duplicateBlocked &&
      !cooldownBlocked;

    if (shouldMint) {
      this.lastMintAt = Date.now();
      this.recentMintFingerprints.set(fingerprint, Date.now());
    }

    this.cleanupFingerprintCache();

    const decision: Decision = {
      id: `decision_${Date.now()}`,
      signalId: signal.id,
      type: shouldMint ? 'MINT' : 'SKIP',
      confidence: signal.confidence,
      reasoning: this.generateReasoning(signal, shouldMint, {
        mintScore,
        isHighConfidence,
        isPriceConditionMet,
        isSentimentHealthy,
        hasEnoughSources,
        duplicateBlocked,
        cooldownBlocked,
      }),
      estimatedCost: this.gasEstimate,
      conditionCheck: {
        metric: 'MULTI_FACTOR_MARKET',
        operator: '>=',
        currentValue: Number(mintScore.toFixed(4)),
        threshold: this.mintScoreThreshold,
        passed: shouldMint,
      },
      signalSnapshot: {
        type: signal.type,
        source: signal.source,
        value: signal.value,
        threshold: signal.threshold,
        detectedAt: signal.timestamp.toISOString(),
      },
      timestamp: new Date(),
    };

    return decision;
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(
    signal: Signal,
    makeDecision: boolean,
    details: {
      mintScore: number;
      isHighConfidence: boolean;
      isPriceConditionMet: boolean;
      isSentimentHealthy: boolean;
      hasEnoughSources: boolean;
      duplicateBlocked: boolean;
      cooldownBlocked: boolean;
    }
  ): string {
    const confidencePercent = (signal.confidence * 100).toFixed(1);
    const mintScorePercent = (details.mintScore * 100).toFixed(1);

    if (makeDecision) {
      return `Mint approved: multi-factor score ${mintScorePercent}% >= ${(this.mintScoreThreshold * 100).toFixed(0)}%, confidence ${confidencePercent}% >= ${(this.confidenceThreshold * 100).toFixed(0)}%, and market corroboration checks passed.`;
    } else {
      const failedReasons: string[] = [];
      if (!details.isHighConfidence) failedReasons.push('low confidence');
      if (!details.isPriceConditionMet) failedReasons.push('price not above threshold');
      if (!details.isSentimentHealthy) failedReasons.push('sentiment below threshold');
      if (!details.hasEnoughSources) failedReasons.push('insufficient data-source coverage');
      if (details.mintScore < this.mintScoreThreshold) failedReasons.push('mint score below threshold');
      if (details.duplicateBlocked) failedReasons.push('duplicate signal fingerprint in active window');
      if (details.cooldownBlocked) failedReasons.push('mint cooldown active');

      return `Mint skipped: ${failedReasons.join(', ')}. Current score=${mintScorePercent}%, confidence=${confidencePercent}%, price=${signal.value}, threshold=${signal.threshold}.`;
    }
  }

  private getMarketInputs(signal: Signal): {
    sentimentScore: number;
    sourceCount: number;
    momentum: number;
    confidence: number;
    agreement: number;
  } {
    const metadata = signal.metadata || {};
    const newsSentiment = this.toNumber(metadata.newsSentiment, 0.5);
    const polymarketSentiment = this.toNumber(metadata.polymarketSentiment, 0.5);
    const sentimentScore = (newsSentiment * 0.55) + (polymarketSentiment * 0.45);
    const sourceCount = this.toNumber(metadata.sourceCount, 1);

    const priceChange = this.toNumber(metadata.priceChange, 0);
    const cmc24hChange = this.toNumber(metadata.cmc24hChange, 0);
    const momentum = Math.max(0, Math.min(1, ((priceChange / 3) + (cmc24hChange / 6)) / 2 + 0.5));

    const agreement = 1 - Math.min(1, Math.abs(newsSentiment - polymarketSentiment) * 2);

    return {
      sentimentScore,
      sourceCount,
      momentum,
      confidence: signal.confidence,
      agreement,
    };
  }

  private calculateMintScore(
    signal: Signal,
    market: {
      sentimentScore: number;
      sourceCount: number;
      momentum: number;
      confidence: number;
      agreement: number;
    }
  ): number {
    const normalizedPrice = Math.max(
      0,
      Math.min(1, (signal.value - signal.threshold) / Math.max(signal.threshold * 0.05, 1))
    );
    const normalizedSourceCoverage = Math.max(0, Math.min(1, market.sourceCount / 5));

    const score =
      (market.confidence * 0.35) +
      (market.sentimentScore * 0.2) +
      (market.momentum * 0.2) +
      (normalizedSourceCoverage * 0.1) +
      (market.agreement * 0.1) +
      (normalizedPrice * 0.05);

    return Math.max(0, Math.min(1, score));
  }

  private buildSignalFingerprint(
    signal: Signal,
    market: {
      sentimentScore: number;
      sourceCount: number;
      momentum: number;
      confidence: number;
      agreement: number;
    }
  ): string {
    const priceBucket = Math.round(signal.value / 25) * 25;
    const sentimentBucket = Math.round(market.sentimentScore * 10);
    const confidenceBucket = Math.round(signal.confidence * 10);
    const momentumBucket = Math.round(market.momentum * 10);
    return `${signal.type}|${priceBucket}|${sentimentBucket}|${confidenceBucket}|${momentumBucket}`;
  }

  private isDuplicateFingerprint(fingerprint: string): boolean {
    const lastSeen = this.recentMintFingerprints.get(fingerprint);
    if (!lastSeen) return false;
    return Date.now() - lastSeen < this.duplicateSignalWindowMs;
  }

  private isMintCoolingDown(): boolean {
    if (!this.lastMintAt) return false;
    return Date.now() - this.lastMintAt < this.mintCooldownMs;
  }

  private cleanupFingerprintCache(): void {
    const now = Date.now();
    for (const [key, ts] of this.recentMintFingerprints.entries()) {
      if (now - ts >= this.duplicateSignalWindowMs) {
        this.recentMintFingerprints.delete(key);
      }
    }
  }

  private toNumber(value: unknown, fallback: number): number {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
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
