import { Signal } from '../shared/types';
import { messageBus } from '../shared/message';
import { uniswapIntegration } from '../protocols/uniswap';
import { marketDataIntegration } from '../protocols/marketData';
import { config } from '../shared/config';
import { logger } from '../utils/logger';
import { CircularBuffer } from '../utils/helpers';
import { CmcSnapshot, NewsSentimentSnapshot, FearGreedSnapshot, PolymarketSnapshot } from '../protocols/marketData';

type IntelligenceBundle = {
  cmcSnapshot: CmcSnapshot | null;
  newsSentiment: NewsSentimentSnapshot | null;
  fearGreed: FearGreedSnapshot | null;
  polymarketSentiment: PolymarketSnapshot | null;
};

type ConditionContext = {
  currentPrice: number;
  threshold: number;
  confidence: number;
  sentimentScore: number;
  newsScore: number;
  polymarketScore: number;
  fearGreedValue: number;
  cmc24hChange: number;
  priceChange: number;
  sourceCount: number;
  hasCmc: boolean;
  hasNews: boolean;
  hasPolymarket: boolean;
  hasFearGreed: boolean;
};

type MintCondition = {
  id: string;
  name: string;
  category: 'momentum' | 'sentiment' | 'cross_market' | 'risk' | 'resilience';
  evaluate: (context: ConditionContext) => boolean;
};

/**
 * Scout Agent: Continuously monitors market signals
 * Detects price anomalies, trends, and sends signals to Analyst
 */
export class ScoutAgent {
  private signalThreshold = config.signals.ethPriceThreshold;
  private confidenceThreshold = config.signals.confidenceThreshold;
  private sentimentThreshold = config.signals.sentimentThreshold;
  private minDataSourcesForMint = config.signals.minDataSourcesForMint;
  private minThirdPartyChecks = config.signals.minThirdPartyChecks;
  private priceHistory: CircularBuffer<number>;
  private lastSignalTime: number = 0;
  private minSignalIntervalMs: number = 10000; // Prevent signal spam
  private mintConditions: MintCondition[];

  constructor() {
    this.priceHistory = new CircularBuffer<number>(20); // Keep last 20 prices
    this.mintConditions = this.buildMintConditions();
  }

  /**
   * Run scout detection cycle
   */
  async run(): Promise<void> {
    try {
      // Fetch primary and third-party market intelligence in parallel.
      const [uniswapPrice, cmcSnapshot, newsSentiment, fearGreed, polymarketSentiment] = await Promise.all([
        uniswapIntegration.getPrice('WETH', 'USDC'),
        marketDataIntegration.getCmcSnapshot(),
        marketDataIntegration.getNewsSentiment(),
        marketDataIntegration.getFearGreed(),
        marketDataIntegration.getPolymarketSentiment(),
      ]);

      const price = cmcSnapshot?.ethPriceUsd ?? uniswapPrice;
      console.log(`\n📊 [ScoutAgent] Current ETH price: $${price}`);
      
      this.priceHistory.add(price);

      // Attempt to detect signal
      const signal = this.detectSignal(price, {
        cmcSnapshot,
        newsSentiment,
        fearGreed,
        polymarketSentiment,
      });

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
  private detectSignal(
    currentPrice: number,
    intelligence: IntelligenceBundle
  ): Signal | null {
    const confidence = this.calculateConfidence(currentPrice, intelligence);
    const newsScore = intelligence.newsSentiment?.score ?? 0.5;
    const polymarketScore = intelligence.polymarketSentiment?.score ?? 0.5;
    const sentimentScore = newsScore * 0.55 + polymarketScore * 0.45;

    const sourceCount = this.countActiveSources(intelligence);
    const priceChange = this.getPriceChange();
    const cmc24hChange = intelligence.cmcSnapshot?.percentChange24h ?? 0;
    const fearGreedValue = intelligence.fearGreed?.value ?? 50;

    const hasPriceBreakout = currentPrice > this.signalThreshold;
    const hasMomentum = priceChange >= 0.8 || cmc24hChange >= 1.2;

    const context: ConditionContext = {
      currentPrice,
      threshold: this.signalThreshold,
      confidence,
      sentimentScore,
      newsScore,
      polymarketScore,
      fearGreedValue,
      cmc24hChange,
      priceChange,
      sourceCount,
      hasCmc: Boolean(intelligence.cmcSnapshot),
      hasNews: Boolean(intelligence.newsSentiment),
      hasPolymarket: Boolean(intelligence.polymarketSentiment),
      hasFearGreed: Boolean(intelligence.fearGreed),
    };

    const matchedConditions = this.evaluateMatchingConditions(context);
    const thirdPartyChecksPassed = this.calculateThirdPartyChecks(context);
    const primaryCondition = matchedConditions[matchedConditions.length - 1];

    // Only emit a signal when we have strong and corroborated evidence.
    if (
      hasPriceBreakout &&
      confidence >= this.confidenceThreshold &&
      sentimentScore >= this.sentimentThreshold &&
      sourceCount >= this.minDataSourcesForMint &&
      hasMomentum &&
      matchedConditions.length > 0 &&
      thirdPartyChecksPassed >= this.minThirdPartyChecks
    ) {
      return {
        id: `signal_${Date.now()}`,
        type: 'ETH_PRICE_SPIKE',
        source: intelligence.cmcSnapshot ? 'cmc+uniswap+news+polymarket+conditions' : 'uniswap+news+polymarket+conditions',
        value: currentPrice,
        threshold: this.signalThreshold,
        confidence,
        timestamp: new Date(),
        metadata: {
          priceHistoryLength: this.priceHistory.getSize(),
          priceAverage: this.priceHistory.getAverage(),
          priceChange,
          uniswapPrice: intelligence.cmcSnapshot ? undefined : currentPrice,
          cmcPrice: intelligence.cmcSnapshot?.ethPriceUsd,
          btcPrice: intelligence.cmcSnapshot?.btcPriceUsd,
          cmc24hChange: intelligence.cmcSnapshot?.percentChange24h,
          newsSentiment: intelligence.newsSentiment?.score,
          newsArticleCount: intelligence.newsSentiment?.articleCount,
          polymarketSentiment: intelligence.polymarketSentiment?.score,
          polymarketMarketCount: intelligence.polymarketSentiment?.marketCount,
          fearGreedValue: intelligence.fearGreed?.value,
          fearGreedLabel: intelligence.fearGreed?.label,
          sourceCount,
          sentimentScore,
          hasMomentum,
          hasPriceBreakout,
          thirdPartyChecksPassed,
          conditionId: primaryCondition.id,
          conditionName: primaryCondition.name,
          conditionCategory: primaryCondition.category,
          matchedConditionIds: matchedConditions.map((condition) => condition.id),
          matchedConditionNames: matchedConditions.slice(0, 10).map((condition) => condition.name),
          matchedConditionCount: matchedConditions.length,
          totalConditionCatalogSize: this.mintConditions.length,
        },
      };
    }

    return null;
  }

  private countActiveSources(intelligence: IntelligenceBundle): number {
    const sources = [
      true, // Uniswap quote is mandatory in current flow
      Boolean(intelligence.cmcSnapshot),
      Boolean(intelligence.newsSentiment),
      Boolean(intelligence.polymarketSentiment),
      Boolean(intelligence.fearGreed),
    ];

    return sources.filter(Boolean).length;
  }

  private buildMintConditions(): MintCondition[] {
    const conditions: MintCondition[] = [];

    // Build 100 distinct condition recipes: 20 strictness tiers x 5 condition families.
    for (let tier = 0; tier < 20; tier++) {
      const breakout = 0.12 + tier * 0.06;
      const sentimentFloor = Math.min(0.43 + tier * 0.015, 0.9);
      const confidenceFloor = Math.min(0.52 + tier * 0.022, 0.98);
      const cmcChangeFloor = 0.1 + tier * 0.11;

      const baseIndex = tier * 5;

      conditions.push({
        id: `C${String(baseIndex + 1).padStart(2, '0')}`,
        name: `Momentum Breakout Tier ${tier + 1}`,
        category: 'momentum',
        evaluate: (ctx) =>
          ctx.currentPrice > ctx.threshold * (1 + tier * 0.006) &&
          ctx.priceChange >= breakout &&
          ctx.confidence >= confidenceFloor &&
          ctx.sourceCount >= 3,
      });

      conditions.push({
        id: `C${String(baseIndex + 2).padStart(2, '0')}`,
        name: `Sentiment Alignment Tier ${tier + 1}`,
        category: 'sentiment',
        evaluate: (ctx) =>
          ctx.hasNews &&
          ctx.hasPolymarket &&
          ctx.newsScore >= sentimentFloor &&
          ctx.polymarketScore >= sentimentFloor - 0.04 &&
          Math.abs(ctx.newsScore - ctx.polymarketScore) <= 0.25 &&
          ctx.confidence >= confidenceFloor - 0.05,
      });

      conditions.push({
        id: `C${String(baseIndex + 3).padStart(2, '0')}`,
        name: `Cross-Market Confirmation Tier ${tier + 1}`,
        category: 'cross_market',
        evaluate: (ctx) =>
          ctx.hasCmc &&
          ctx.cmc24hChange >= cmcChangeFloor &&
          ctx.currentPrice > ctx.threshold * 0.97 &&
          ctx.sentimentScore >= sentimentFloor - 0.06 &&
          ctx.confidence >= confidenceFloor - 0.08,
      });

      conditions.push({
        id: `C${String(baseIndex + 4).padStart(2, '0')}`,
        name: `Risk Regime Filter Tier ${tier + 1}`,
        category: 'risk',
        evaluate: (ctx) =>
          ctx.hasFearGreed &&
          ((ctx.fearGreedValue >= 45 && ctx.sentimentScore >= sentimentFloor - 0.02) ||
            (ctx.fearGreedValue <= 30 && ctx.priceChange >= breakout + 0.18 && ctx.newsScore >= sentimentFloor + 0.02)) &&
          ctx.confidence >= confidenceFloor - 0.1,
      });

      conditions.push({
        id: `C${String(baseIndex + 5).padStart(2, '0')}`,
        name: `Resilience Composite Tier ${tier + 1}`,
        category: 'resilience',
        evaluate: (ctx) =>
          ctx.hasNews &&
          ctx.hasPolymarket &&
          ctx.hasFearGreed &&
          ctx.sourceCount >= 4 &&
          ctx.sentimentScore >= sentimentFloor - 0.05 &&
          (ctx.priceChange >= breakout - 0.1 || ctx.cmc24hChange >= cmcChangeFloor - 0.1) &&
          ctx.confidence >= confidenceFloor - 0.08,
      });
    }

    return conditions;
  }

  private evaluateMatchingConditions(context: ConditionContext): MintCondition[] {
    return this.mintConditions.filter((condition) => condition.evaluate(context));
  }

  private calculateThirdPartyChecks(context: ConditionContext): number {
    let checksPassed = 0;

    if (context.hasCmc && Math.abs(context.cmc24hChange) <= 20) checksPassed++;
    if (context.hasNews && context.newsScore >= 0.45) checksPassed++;
    if (context.hasPolymarket && context.polymarketScore >= 0.35) checksPassed++;
    if (context.hasFearGreed && context.fearGreedValue >= 5) checksPassed++;

    return checksPassed;
  }

  /**
   * Calculate confidence score (0-1) based on price movement and history
   */
  private calculateConfidence(
    currentPrice: number,
    intelligence: IntelligenceBundle
  ): number {
    const latest = this.priceHistory.getLatest();
    if (!latest) return 0.5; // First reading

    // Confidence based on price change magnitude
    const change = (currentPrice - latest) / latest;
    const changeConfidence = Math.min(1.0, 0.5 + Math.abs(change) * 10);

    // Additional confidence from sustained high price
    const avgPrice = this.priceHistory.getAverage();
    const sustainedConfidence = avgPrice > this.signalThreshold * 0.9 ? 0.1 : 0;

    // Third-party contributions.
    const newsBoost = ((intelligence.newsSentiment?.score ?? 0.5) - 0.5) * 0.15;
    const polymarketBoost = ((intelligence.polymarketSentiment?.score ?? 0.5) - 0.5) * 0.2;
    const fearGreedValue = intelligence.fearGreed?.value ?? 50;
    const riskBoost = fearGreedValue >= 50 ? 0.05 : -0.05;

    const combined = changeConfidence + sustainedConfidence + newsBoost + polymarketBoost + riskBoost;

    return Math.max(0, Math.min(1.0, combined));
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
    conditionsConfigured: number;
  } {
    return {
      lastPrice: this.priceHistory.getLatest(),
      signalThreshold: this.signalThreshold,
      confidenceThreshold: this.confidenceThreshold,
      priceHistorySize: this.priceHistory.getSize(),
      conditionsConfigured: this.mintConditions.length,
    };
  }
}

export const scoutAgent = new ScoutAgent();
