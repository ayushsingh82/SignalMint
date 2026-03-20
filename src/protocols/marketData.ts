import axios, { AxiosInstance } from 'axios';
import { config } from '../shared/config';
import { logger } from '../utils/logger';

export interface CmcSnapshot {
  ethPriceUsd: number;
  btcPriceUsd: number;
  marketCapUsd: number;
  volume24hUsd: number;
  percentChange24h: number;
  fetchedAt: string;
}

export interface NewsSentimentSnapshot {
  score: number; // 0..1
  articleCount: number;
  positive: number;
  negative: number;
  neutral: number;
  topHeadlines: string[];
  fetchedAt: string;
}

export interface FearGreedSnapshot {
  value: number; // 0..100
  label: string;
  fetchedAt: string;
}

export interface PolymarketSnapshot {
  score: number; // 0..1 where > 0.5 is bullish
  marketCount: number;
  bullishCount: number;
  bearishCount: number;
  topMarkets: string[];
  fetchedAt: string;
}

export class MarketDataIntegration {
  private cmcApiKey: string | undefined;
  private newsApiKey: string | undefined;
  private cmcClient: AxiosInstance;
  private newsClient: AxiosInstance;
  private polymarketClient: AxiosInstance;

  constructor() {
    this.cmcApiKey = config.marketData.cmcApiKey;
    this.newsApiKey = config.marketData.newsApiKey;

    this.cmcClient = axios.create({
      baseURL: 'https://pro-api.coinmarketcap.com/v1',
      headers: this.cmcApiKey
        ? { 'X-CMC_PRO_API_KEY': this.cmcApiKey }
        : undefined,
      timeout: 10000,
    });

    this.newsClient = axios.create({
      baseURL: 'https://newsapi.org/v2',
      timeout: 10000,
    });

    this.polymarketClient = axios.create({
      baseURL: 'https://gamma-api.polymarket.com',
      timeout: 10000,
    });
  }

  async getCmcSnapshot(): Promise<CmcSnapshot | null> {
    if (!this.cmcApiKey) {
      logger.log('MarketDataIntegration', 'getCmcSnapshot', {
        skipped: true,
        reason: 'CMC API key missing',
      }, 'success');
      return null;
    }

    try {
      const res = await this.cmcClient.get('/cryptocurrency/quotes/latest', {
        params: {
          symbol: 'ETH,BTC',
          convert: 'USD',
        },
      });

      const eth = res.data?.data?.ETH?.quote?.USD;
      const btc = res.data?.data?.BTC?.quote?.USD;

      if (!eth || !btc) {
        throw new Error('Unexpected CMC response shape');
      }

      const snapshot: CmcSnapshot = {
        ethPriceUsd: Number(eth.price),
        btcPriceUsd: Number(btc.price),
        marketCapUsd: Number(eth.market_cap || 0),
        volume24hUsd: Number(eth.volume_24h || 0),
        percentChange24h: Number(eth.percent_change_24h || 0),
        fetchedAt: new Date().toISOString(),
      };

      logger.log('MarketDataIntegration', 'getCmcSnapshot', {
        ethPriceUsd: snapshot.ethPriceUsd,
        btcPriceUsd: snapshot.btcPriceUsd,
      }, 'success');

      return snapshot;
    } catch (error) {
      logger.log('MarketDataIntegration', 'getCmcSnapshot', {}, 'failed', String(error));
      return null;
    }
  }

  async getNewsSentiment(): Promise<NewsSentimentSnapshot | null> {
    if (!this.newsApiKey) {
      logger.log('MarketDataIntegration', 'getNewsSentiment', {
        skipped: true,
        reason: 'NewsAPI key missing',
      }, 'success');
      return null;
    }

    try {
      const res = await this.newsClient.get('/everything', {
        params: {
          q: '(ethereum OR ETH OR crypto) AND (market OR price OR rally OR crash)',
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: 20,
          apiKey: this.newsApiKey,
        },
      });

      const articles: Array<{ title?: string; description?: string }> = res.data?.articles || [];

      const positiveWords = ['surge', 'rally', 'breakout', 'adoption', 'upgrade', 'bullish', 'gain'];
      const negativeWords = ['hack', 'exploit', 'drop', 'crash', 'lawsuit', 'bearish', 'loss'];

      let positive = 0;
      let negative = 0;
      let neutral = 0;

      for (const article of articles) {
        const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();
        const posHit = positiveWords.some((w) => text.includes(w));
        const negHit = negativeWords.some((w) => text.includes(w));

        if (posHit && !negHit) positive++;
        else if (negHit && !posHit) negative++;
        else neutral++;
      }

      const count = Math.max(articles.length, 1);
      const rawScore = (positive - negative) / count; // -1..1
      const normalizedScore = Math.max(0, Math.min(1, 0.5 + rawScore * 0.5));

      const snapshot: NewsSentimentSnapshot = {
        score: normalizedScore,
        articleCount: articles.length,
        positive,
        negative,
        neutral,
        topHeadlines: articles.slice(0, 3).map((a) => a.title || 'Untitled'),
        fetchedAt: new Date().toISOString(),
      };

      logger.log('MarketDataIntegration', 'getNewsSentiment', {
        score: snapshot.score,
        articleCount: snapshot.articleCount,
      }, 'success');

      return snapshot;
    } catch (error) {
      logger.log('MarketDataIntegration', 'getNewsSentiment', {}, 'failed', String(error));
      return null;
    }
  }

  async getFearGreed(): Promise<FearGreedSnapshot | null> {
    try {
      const res = await axios.get('https://api.alternative.me/fng/?limit=1&format=json', {
        timeout: 8000,
      });

      const row = res.data?.data?.[0];
      if (!row) {
        throw new Error('Unexpected Fear&Greed response');
      }

      const value = Number(row.value);
      const snapshot: FearGreedSnapshot = {
        value,
        label: String(row.value_classification || 'unknown'),
        fetchedAt: new Date().toISOString(),
      };

      logger.log('MarketDataIntegration', 'getFearGreed', {
        value: snapshot.value,
        label: snapshot.label,
      }, 'success');

      return snapshot;
    } catch (error) {
      logger.log('MarketDataIntegration', 'getFearGreed', {}, 'failed', String(error));
      return null;
    }
  }

  async getPolymarketSentiment(): Promise<PolymarketSnapshot | null> {
    try {
      const query = config.marketData.polymarketQuery || 'ethereum';
      const res = await this.polymarketClient.get('/markets', {
        params: {
          closed: false,
          archived: false,
          limit: 100,
        },
      });

      const markets = Array.isArray(res.data) ? res.data : [];

      const filtered = markets.filter((m: unknown) => {
        const market = m as Record<string, unknown>;
        const title = String(market.question || market.title || '').toLowerCase();
        return title.includes(query.toLowerCase()) || title.includes('eth');
      });

      if (filtered.length === 0) {
        return {
          score: 0.5,
          marketCount: 0,
          bullishCount: 0,
          bearishCount: 0,
          topMarkets: [],
          fetchedAt: new Date().toISOString(),
        };
      }

      let bullish = 0;
      let bearish = 0;
      let aggregate = 0;

      for (const item of filtered) {
        const market = item as Record<string, unknown>;

        const probs = this.extractOutcomeProbabilities(market);
        const bullishProb = this.pickBullishProbability(market, probs);

        aggregate += bullishProb;
        if (bullishProb >= 0.5) bullish++;
        else bearish++;
      }

      const score = Math.max(0, Math.min(1, aggregate / filtered.length));
      const snapshot: PolymarketSnapshot = {
        score,
        marketCount: filtered.length,
        bullishCount: bullish,
        bearishCount: bearish,
        topMarkets: filtered
          .slice(0, 3)
          .map((m: Record<string, unknown>) => String(m.question || m.title || 'Untitled')),
        fetchedAt: new Date().toISOString(),
      };

      logger.log('MarketDataIntegration', 'getPolymarketSentiment', {
        score: snapshot.score,
        marketCount: snapshot.marketCount,
      }, 'success');

      return snapshot;
    } catch (error) {
      logger.log('MarketDataIntegration', 'getPolymarketSentiment', {}, 'failed', String(error));
      return null;
    }
  }

  private extractOutcomeProbabilities(market: Record<string, unknown>): number[] {
    const pricesRaw = market.outcomePrices;
    if (Array.isArray(pricesRaw)) {
      return pricesRaw
        .map((v) => Number(v))
        .filter((n) => Number.isFinite(n));
    }

    if (typeof pricesRaw === 'string') {
      try {
        const parsed = JSON.parse(pricesRaw);
        if (Array.isArray(parsed)) {
          return parsed.map((v) => Number(v)).filter((n) => Number.isFinite(n));
        }
      } catch {
        // ignore parse errors and fallback below
      }
    }

    return [];
  }

  private pickBullishProbability(
    market: Record<string, unknown>,
    probs: number[]
  ): number {
    if (probs.length === 0) return 0.5;

    const outcomesRaw = market.outcomes;
    let outcomes: string[] = [];

    if (Array.isArray(outcomesRaw)) {
      outcomes = outcomesRaw.map((x) => String(x).toLowerCase());
    } else if (typeof outcomesRaw === 'string') {
      try {
        const parsed = JSON.parse(outcomesRaw);
        if (Array.isArray(parsed)) {
          outcomes = parsed.map((x) => String(x).toLowerCase());
        }
      } catch {
        outcomes = [];
      }
    }

    if (outcomes.length === probs.length) {
      const bullishIndex = outcomes.findIndex((o) =>
        o.includes('yes') || o.includes('up') || o.includes('above') || o.includes('increase')
      );
      if (bullishIndex >= 0) {
        return probs[bullishIndex];
      }
    }

    // Fallback: binary markets usually index 0 as YES.
    return probs[0] ?? 0.5;
  }
}

export const marketDataIntegration = new MarketDataIntegration();
