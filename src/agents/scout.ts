import { Signal } from '../shared/types';
import { messageBus } from '../shared/message';
import { uniswapIntegration } from '../protocols/uniswap';
import { config } from '../shared/config';
import { logger } from '../utils/logger';
import { CircularBuffer } from '../utils/helpers';

/**
 * Scout Agent: Continuously monitors market signals
 * Detects price anomalies, trends, and sends signals to Analyst
 */
export class ScoutAgent {
  private signalThreshold = config.signals.ethPriceThreshold;
  private confidenceThreshold = config.signals.confidenceThreshold;
  private priceHistory: CircularBuffer<number>;
  private lastSignalTime: number = 0;
  private minSignalIntervalMs: number = 10000; // Prevent signal spam

  constructor() {
    this.priceHistory = new CircularBuffer<number>(20); // Keep last 20 prices
  }

  /**
   * Run scout detection cycle
   */
  async run(): Promise<void> {
    try {
      // Fetch current price from Uniswap
      const price = await uniswapIntegration.getPrice('WETH', 'USDC');
      console.log(`\n📊 [ScoutAgent] Current ETH price: $${price}`);
      
      this.priceHistory.add(price);

      // Attempt to detect signal
      const signal = this.detectSignal(price);

      if (signal && this.shouldEmitSignal()) {
        logger.log('ScoutAgent', 'signal_detected', {
          type: signal.type,
          value: signal.value,
          confidence: signal.confidence,
        }, 'success');

        logger.recordSignal(signal);

        // Send signal to AnalystAgent
        await messageBus.sendMessage({
          from: 'ScoutAgent',
          to: 'AnalystAgent',
          type: 'signal_detected',
          payload: signal,
          timestamp: new Date(),
        });

        this.lastSignalTime = Date.now();
      } else if (!signal) {
        logger.log('ScoutAgent', 'monitoring', {
          price,
          threshold: this.signalThreshold,
          status: 'no_signal',
        }, 'success');
      }
    } catch (error) {
      logger.log('ScoutAgent', 'run', {}, 'failed', String(error));
    }
  }

  /**
   * Detect if current price meets signal criteria
   */
  private detectSignal(currentPrice: number): Signal | null {
    const confidence = this.calculateConfidence(currentPrice);

    // Signal threshold met and high confidence
    if (currentPrice > this.signalThreshold && confidence >= this.confidenceThreshold) {
      return {
        id: `signal_${Date.now()}`,
        type: 'ETH_PRICE_SPIKE',
        source: 'uniswap_api',
        value: currentPrice,
        threshold: this.signalThreshold,
        confidence,
        timestamp: new Date(),
        metadata: {
          priceHistoryLength: this.priceHistory.getSize(),
          priceAverage: this.priceHistory.getAverage(),
          priceChange: this.getPriceChange(),
        },
      };
    }

    return null;
  }

  /**
   * Calculate confidence score (0-1) based on price movement and history
   */
  private calculateConfidence(currentPrice: number): number {
    const latest = this.priceHistory.getLatest();
    if (!latest) return 0.5; // First reading

    // Confidence based on price change magnitude
    const change = (currentPrice - latest) / latest;
    const changeConfidence = Math.min(1.0, 0.5 + Math.abs(change) * 10);

    // Additional confidence from sustained high price
    const avgPrice = this.priceHistory.getAverage();
    const sustainedConfidence = avgPrice > this.signalThreshold * 0.9 ? 0.1 : 0;

    return Math.min(1.0, changeConfidence + sustainedConfidence);
  }

  /**
   * Calculate overall price change percentage
   */
  private getPriceChange(): number {
    const all = this.priceHistory.getAll();
    if (all.length < 2) return 0;

    const first = all[0];
    const last = all[all.length - 1];

    return ((last - first) / first) * 100;
  }

  /**
   * Prevent signal spam
   */
  private shouldEmitSignal(): boolean {
    return Date.now() - this.lastSignalTime > this.minSignalIntervalMs;
  }

  /**
   * Get scout status
   */
  getStatus(): {
    lastPrice: number | undefined;
    signalThreshold: number;
    confidenceThreshold: number;
    priceHistorySize: number;
  } {
    return {
      lastPrice: this.priceHistory.getLatest(),
      signalThreshold: this.signalThreshold,
      confidenceThreshold: this.confidenceThreshold,
      priceHistorySize: this.priceHistory.getSize(),
    };
  }
}

export const scoutAgent = new ScoutAgent();
