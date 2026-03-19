import { Execution, AgentMessage, Decision } from '../shared/types';
import { messageBus } from '../shared/message';
import { rareIntegration } from '../protocols/rare';
import { uniswapIntegration } from '../protocols/uniswap';
import { logger } from '../utils/logger';
import { RetryableExecutor, Validator } from '../utils/helpers';

/**
 * Executor Agent: Executes autonomous actions
 * Mints NFTs via Rare Protocol, executes swaps via Uniswap
 */
export class ExecutorAgent {
  private nftContract: string | null = null;
  private isInitialized: boolean = false;
  private executionLog: Execution[] = [];

  /**
   * Initialize executor (deploy NFT collection if needed)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🚀 [ExecutorAgent] Initializing...');

      // Initialize Rare CLI
      await rareIntegration.initialize();

      // Check if collection exists, otherwise deploy
      if (!this.nftContract) {
        this.nftContract = await rareIntegration.deployCollection(
          'SignalMint Gallery',
          'SMINT',
          10000
        );
        console.log(`✅ Deployed NFT collection: ${this.nftContract}`);
      }

      this.isInitialized = true;
    } catch (error) {
      logger.log('ExecutorAgent', 'initialize', {}, 'failed', String(error));
      throw error;
    }
  }

  /**
   * Process decision and execute actions
   */
  async run(message: AgentMessage): Promise<void> {
    try {
      if (message.type !== 'decision') {
        return;
      }

      const decision = message.payload as Decision;

      console.log(`\n⚙️  [ExecutorAgent] Executing decision: ${decision.type}`);

      if (decision.type === 'MINT') {
        // Execute mint + optional swap
        const execution = await this.executeMint(decision);

        logger.log('ExecutorAgent', 'execution_completed', {
          type: execution.type,
          txHash: execution.txHash,
          result: execution.result,
        }, 'success');

        logger.recordExecution(execution, execution.result === 'success');

        // Send to VerifierAgent
        await messageBus.sendMessage({
          from: 'ExecutorAgent',
          to: 'VerifierAgent',
          type: 'execution_result',
          payload: execution,
          timestamp: new Date(),
        });
      } else if (decision.type === 'SKIP') {
        logger.log('ExecutorAgent', 'skipped', {
          decisionId: decision.id,
          reason: decision.reasoning,
        }, 'success');
      }
    } catch (error) {
      logger.log('ExecutorAgent', 'run', {}, 'failed', String(error));
    }
  }

  /**
   * Execute minting flow: generate metadata → mint NFT → optionally create auction
   */
  private async executeMint(decision: Decision): Promise<Execution> {
    if (!this.nftContract) {
      throw new Error('NFT contract not initialized');
    }

    try {
      // Generate metadata for the mint
      const nftName = `Market Signal #${Math.floor(Date.now() / 1000)}`;
      const nftDescription =
        `Autonomous mint triggered by market signal. Decision ID: ${decision.id}`;

      const attributes: Record<string, string> = {
        'Signal_Type': 'ETH_PRICE_SPIKE',
        'Confidence': (decision.confidence * 100).toFixed(0),
        'Timestamp': new Date().toISOString(),
        'Decision_ID': decision.id,
      };

      // Mint NFT (using mock image path for demo)
      console.log(`🎨 Minting NFT: ${nftName}`);

      const mintResult = await RetryableExecutor.execute(async () => {
        return await rareIntegration.mintNFT(
          this.nftContract!,
          nftName,
          nftDescription,
          './assets/signal.png', // Mock image path (real deployment would generate actual image)
          attributes
        );
      }, 3);

      console.log(`✅ NFT minted: tokenId=${mintResult.tokenId}, txHash=${mintResult.txHash}`);

      // Optionally create auction
      if (decision.confidence > 0.9) {
        console.log(`🏆 Creating auction for token ${mintResult.tokenId}...`);

        const auctionResult = await RetryableExecutor.execute(async () => {
          return await rareIntegration.createAuction(
            this.nftContract!,
            mintResult.tokenId,
            '0.1', // 0.1 ETH starting price
            86400 // 24 hours
          );
        }, 2);

        console.log(`✅ Auction created: auctionId=${auctionResult.auctionId}`);

        return {
          id: `exec_mint_${Date.now()}`,
          type: 'MINT_NFT',
          txHash: mintResult.txHash,
          result: 'success',
          metadata: {
            tokenId: mintResult.tokenId,
            contract: this.nftContract,
            ipfsUri: mintResult.ipfsUri,
            auctionId: auctionResult.auctionId,
            decisionId: decision.id,
          },
          timestamp: new Date(),
          attempts: 1,
        };
      }

      return {
        id: `exec_mint_${Date.now()}`,
        type: 'MINT_NFT',
        txHash: mintResult.txHash,
        result: 'success',
        metadata: {
          tokenId: mintResult.tokenId,
          contract: this.nftContract,
          ipfsUri: mintResult.ipfsUri,
          decisionId: decision.id,
        },
        timestamp: new Date(),
        attempts: 1,
      };
    } catch (error) {
      const errorMsg = String(error);
      logger.log('ExecutorAgent', 'executeMint', {}, 'failed', errorMsg);

      return {
        id: `exec_mint_${Date.now()}`,
        type: 'MINT_NFT',
        result: 'failed',
        error: errorMsg,
        metadata: { decisionId: decision.id },
        timestamp: new Date(),
        attempts: 1,
      };
    }
  }

  /**
   * Execute optional swap (e.g., swap funds to cover gas)
   */
  async executeSwap(
    tokenIn: string,
    amountIn: string,
    tokenOut: string
  ): Promise<string> {
    try {
      console.log(`💱 Swapping ${amountIn} ${tokenIn} → ${tokenOut}...`);

      const quote = await uniswapIntegration.getQuote(
        tokenIn,
        amountIn,
        tokenOut,
        1 // 1% slippage
      );

      console.log(`📊 Quote: ${amountIn} ${tokenIn} → ${quote.amountOut} ${tokenOut}`);

      const txHash = await uniswapIntegration.executeSwap({
        tokenIn,
        amountIn,
        tokenOut,
        minAmountOut: quote.amountOut,
        slippage: 1,
      });

      console.log(`✅ Swap executed: ${txHash}`);

      return txHash;
    } catch (error) {
      logger.log('ExecutorAgent', 'executeSwap', { tokenIn, amountIn, tokenOut }, 'failed', String(error));
      throw error;
    }
  }

  /**
   * Start executor agent (subscribe to decision messages)
   */
  async start(): Promise<void> {
    await this.initialize();
    messageBus.onMessage('decision', (msg) => this.run(msg));
    console.log('✅ ExecutorAgent started and listening for decisions');
  }

  /**
   * Get executor statistics
   */
  getStats(): {
    executionsAttempted: number;
    executionsSucceeded: number;
    executionsFailed: number;
    nftContract: string | null;
  } {
    const succeeded = this.executionLog.filter((e) => e.result === 'success').length;
    const failed = this.executionLog.filter((e) => e.result === 'failed').length;

    return {
      executionsAttempted: this.executionLog.length,
      executionsSucceeded: succeeded,
      executionsFailed: failed,
      nftContract: this.nftContract,
    };
  }
}

export const executorAgent = new ExecutorAgent();
