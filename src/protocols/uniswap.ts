import axios, { AxiosInstance } from 'axios';
import { JsonRpcProvider, Wallet, parseUnits, formatUnits } from 'ethers';
import { config } from '../shared/config';
import { logger } from '../utils/logger';
import { Validator, RetryableExecutor } from '../utils/helpers';

type QuoteApiResponse = {
  quote?: {
    output?: { amount?: string };
    priceImpact?: number;
    gasUseEstimate?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    swapper?: string;
  };
  permitData?: {
    domain: Record<string, unknown>;
    types: Record<string, Array<{ name: string; type: string }>>;
    values: Record<string, unknown>;
  };
};

type SwapApiResponse = {
  swap?: {
    to: string;
    from: string;
    data: string;
    value?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    gasLimit?: string;
  };
};

/**
 * Uniswap V4 API Integration for token swaps and pricing
 * Provides real price quotes and swap execution
 */
export class UniswapIntegration {
  private client: AxiosInstance;
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = config.uniswap.apiKey;

    this.client = axios.create({
      baseURL: 'https://trading-api-labs.interface.gateway.uniswap.org',
      headers: this.apiKey ? {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      } : {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  /**
   * Get current price of tokenOut in terms of tokenIn (1 unit of tokenIn → ? tokenOut)
   */
  async getPrice(tokenIn: string, tokenOut: string): Promise<number> {
    return RetryableExecutor.execute(async () => {
      try {
        const inMeta = this.getTokenMeta(tokenIn);
        const outMeta = this.getTokenMeta(tokenOut);
        const amountIn = parseUnits('1', inMeta.decimals).toString();
        const response = await this.requestQuote(tokenIn, amountIn, tokenOut, 0.5);

        const outAmount = response.quote?.output?.amount;
        if (!outAmount) {
          throw new Error('Uniswap quote missing output amount');
        }

        const price = Number(formatUnits(outAmount, outMeta.decimals));

        logger.log('UniswapIntegration', 'getPrice', {
          tokenIn,
          tokenOut,
          price,
        }, 'success');

        return price;
      } catch {
        throw new Error(`Uniswap price fetch failed for ${tokenIn} -> ${tokenOut}`);
      }
    }, 2);
  }

  /**
   * Get quote for swapping amountIn of tokenIn to tokenOut
   */
  async getQuote(
    tokenIn: string,
    amountIn: string,
    tokenOut: string,
    slippage: number = 1
  ): Promise<{
    amountOut: string;
    priceImpact: number;
    estimatedGas: number;
  }> {
    return RetryableExecutor.execute(async () => {
      Validator.validateSwapParams({
        amountIn: parseFloat(amountIn),
        slippage,
        deadline: Math.floor(Date.now() / 1000) + 60 * 20,
      });

      try {
        const inMeta = this.getTokenMeta(tokenIn);
        const outMeta = this.getTokenMeta(tokenOut);
        const amountRaw = parseUnits(amountIn, inMeta.decimals).toString();
        const response = await this.requestQuote(tokenIn, amountRaw, tokenOut, slippage);

        const outAmountRaw = response.quote?.output?.amount;
        if (!outAmountRaw) {
          throw new Error('Uniswap quote missing output amount');
        }

        const result = {
          amountOut: formatUnits(outAmountRaw, outMeta.decimals),
          priceImpact: Number(response.quote?.priceImpact || 0),
          estimatedGas: Number(response.quote?.gasUseEstimate || 0),
        };

        logger.log('UniswapIntegration', 'getQuote', {
          tokenIn,
          amountIn,
          tokenOut,
          amountOut: result.amountOut,
          priceImpact: result.priceImpact,
        }, 'success');

        return result;
      } catch {
        throw new Error(`Uniswap quote failed for ${amountIn} ${tokenIn}`);
      }
    }, 2);
  }

  /**
   * Execute a real on-chain swap via Uniswap trading API swap payload.
   */
  async executeSwap(params: {
    tokenIn: string;
    amountIn: string;
    tokenOut: string;
    minAmountOut: string;
    slippage?: number;
  }): Promise<string> {
    return RetryableExecutor.execute(async () => {
      Validator.validateSwapParams({
        amountIn: parseFloat(params.amountIn),
        slippage: params.slippage || 1,
        deadline: Math.floor(Date.now() / 1000) + 60 * 20,
      });

      const inMeta = this.getTokenMeta(params.tokenIn);
      const outMeta = this.getTokenMeta(params.tokenOut);
      const amountRaw = parseUnits(params.amountIn, inMeta.decimals).toString();

      const quoteResponse = await this.requestQuote(
        params.tokenIn,
        amountRaw,
        params.tokenOut,
        params.slippage || 1
      );

      const permitData = quoteResponse.permitData;
      let signature: string | undefined;
      if (permitData) {
        const walletForSig = new Wallet(config.agent.privateKey);
        signature = await walletForSig.signTypedData(
          permitData.domain,
          permitData.types,
          permitData.values
        );
      }

      const swapResponse = await this.client.post<SwapApiResponse>('/v1/swap', {
        swapper: config.agent.address,
        quote: quoteResponse.quote,
        permitData,
        signature,
      });

      const swapTx = swapResponse.data.swap;
      if (!swapTx?.to || !swapTx?.data) {
        throw new Error('Uniswap swap payload missing tx data');
      }

      const provider = new JsonRpcProvider(config.rare.rpcUrl);
      const wallet = new Wallet(config.agent.privateKey, provider);

      const tx = await wallet.sendTransaction({
        to: swapTx.to,
        data: swapTx.data,
        value: swapTx.value ? BigInt(swapTx.value) : BigInt(0),
        maxFeePerGas: swapTx.maxFeePerGas ? BigInt(swapTx.maxFeePerGas) : undefined,
        maxPriorityFeePerGas: swapTx.maxPriorityFeePerGas ? BigInt(swapTx.maxPriorityFeePerGas) : undefined,
        gasLimit: swapTx.gasLimit ? BigInt(swapTx.gasLimit) : undefined,
      });

      const receipt = await tx.wait();
      const txHash = receipt?.hash || tx.hash;

      const amountOutRaw = quoteResponse.quote?.output?.amount || '0';

      logger.log('UniswapIntegration', 'executeSwap', {
        tokenIn: params.tokenIn,
        amountIn: params.amountIn,
        tokenOut: params.tokenOut,
        amountOut: formatUnits(amountOutRaw, outMeta.decimals),
        txHash,
      }, 'success');

      logger.recordExecution({
        id: `swap_${Date.now()}`,
        type: 'EXECUTE_SWAP',
        txHash,
        result: 'success',
        metadata: params,
        timestamp: new Date(),
        attempts: 1,
      }, true);

      return txHash;
    }, 1);
  }

  /**
   * Monitor pending swap transaction
   */
  async monitorSwap(txHash: string, maxWaitMs: number = 60000): Promise<boolean> {
    const provider = new JsonRpcProvider(config.rare.rpcUrl);
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
      const receipt = await provider.getTransactionReceipt(txHash);
      if (receipt) {
        const confirmed = receipt.status === 1;
        logger.log('UniswapIntegration', 'monitorSwap', {
          txHash,
          confirmed,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
        }, confirmed ? 'success' : 'failed');
        return confirmed;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    throw new Error(`Swap timeout: ${txHash}`);
  }

  /**
   * Get supported tokens
   */
  async getSupportedTokens(): Promise<string[]> {
    return ['WETH', 'USDC', 'DAI', 'USDT', 'WBTC'];
  }

  private normalizeToken(token: string): string {
    return this.getTokenMeta(token).address;
  }

  private getTokenMeta(token: string): { address: string; decimals: number } {
    const chain = (config.uniswap.chain || 'sepolia').toLowerCase();
    const byChain: Record<string, Record<string, { address: string; decimals: number }>> = {
      sepolia: {
        WETH: { address: '0xfff9976782d46cc05630d1f6ebab18b2324d6b14', decimals: 18 },
        USDC: { address: '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238', decimals: 6 },
        DAI: { address: '0x68194a729c2450ad26072b3d33adab5dbb7b2f8a', decimals: 18 },
      },
      mainnet: {
        WETH: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
        USDC: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
        DAI: { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
      },
    };

    const upper = token.toUpperCase();
    const chainMap = byChain[chain] || byChain.sepolia;
    if (chainMap[upper]) return chainMap[upper];

    // Accept direct address input with default 18 decimals.
    return { address: token, decimals: 18 };
  }

  private async requestQuote(
    tokenIn: string,
    amountRaw: string,
    tokenOut: string,
    slippage: number
  ): Promise<QuoteApiResponse> {
    const inMeta = this.getTokenMeta(tokenIn);
    const outMeta = this.getTokenMeta(tokenOut);
    const chainId = (config.uniswap.chain || 'sepolia').toLowerCase() === 'mainnet' ? 1 : 11155111;

    const response = await this.client.post<QuoteApiResponse>('/v1/quote', {
      swapper: config.agent.address,
      tokenInChainId: chainId,
      tokenIn: inMeta.address,
      tokenOutChainId: chainId,
      tokenOut: outMeta.address,
      amount: amountRaw,
      type: 'EXACT_INPUT',
      slippageTolerance: slippage,
      configs: [
        {
          routingType: 'CLASSIC',
          protocols: ['V2', 'V3', 'V4'],
          enableUniversalRouter: true,
        },
      ],
    });

    return response.data;
  }
}

export const uniswapIntegration = new UniswapIntegration();
